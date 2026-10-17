import "./style.scss";
import fileIndex from "lib/fileIndex";
import files from "lib/fileList";
import openFile from "lib/openFile";
import { addedFolder } from "lib/openFolder";
import { summarizeProjectFiles } from "./summary";

const MAX_INDEXED_FILES = 5000;
const INDEX_PAGE_SIZE = 1000;
const KEY_FILE_NAMES = new Set([
	"readme.md",
	"package.json",
	"index.html",
	"cargo.toml",
	"pyproject.toml",
	"requirements.txt",
	"go.mod",
	"pom.xml",
]);

let container;
let renderVersion = 0;

export default [
	"assessment",
	"project-overview",
	strings["overview"],
	initApp,
	false,
	refresh,
];

function initApp(el) {
	container = el;
	container.classList.add("project-overview");
	refreshButton.addEventListener("click", refresh);
	render();

	files.on("add-folder", refresh);
	files.on("remove-folder", refresh);
	files.on("refresh", refresh);
	editorManager.on(["add-folder", "remove-folder"], refresh);

	return () => {
		renderVersion += 1;
		files.off("add-folder", refresh);
		files.off("remove-folder", refresh);
		files.off("refresh", refresh);
		editorManager.off(["add-folder", "remove-folder"], refresh);
		refreshButton.removeEventListener("click", refresh);
		container = null;
	};
}

const refreshButton = document.createElement("button");
refreshButton.type = "button";
refreshButton.className = "project-overview-refresh";
refreshButton.title = strings["refresh"];
refreshButton.setAttribute("aria-label", strings["refresh"]);
refreshButton.innerHTML = '<span class="icon refresh"></span>';

async function refresh() {
	await render();
}

async function render() {
	if (!container) return;
	const version = ++renderVersion;
	container.replaceChildren();

	const header = document.createElement("div");
	header.className = "project-overview-header";
	const title = document.createElement("strong");
	title.textContent = strings["overview"];
	header.append(title, refreshButton);
	container.append(header);

	const roots = addedFolder;
	if (!roots.length) {
		const empty = document.createElement("button");
		empty.type = "button";
		empty.className = "project-overview-empty";
		empty.textContent = strings["open folder"];
		empty.addEventListener("click", () => acode.exec("open-folder"));
		container.append(empty);
		return;
	}

	try {
		await fileIndex.whenReady(
			roots.filter(({ listFiles }) => listFiles).map(({ url }) => url),
		);
	} catch (_) {
		// Continue with the entries already available in the file list.
	}
	if (!container || version !== renderVersion) return;

	const fallbackFiles = files();
	for (const root of roots) {
		const section = document.createElement("section");
		section.className = "project-overview-workspace";

		const heading = document.createElement("h3");
		heading.textContent = root.title;
		heading.title = root.url;
		section.append(heading);

		if (!root.listFiles) {
			const hint = document.createElement("p");
			hint.textContent = strings["info-listFiles"];
			section.append(hint);
			container.append(section);
			continue;
		}

		let entries = fallbackFiles.filter((file) =>
			isWithinRoot(file.url, root.url),
		);
		if (fileIndex.supports(root.url)) {
			try {
				entries = await getIndexedFiles(root.url);
			} catch (error) {
				console.warn("Unable to load project overview:", error);
			}
		}
		if (!container || version !== renderVersion) return;

		const summary = summarizeProjectFiles(entries, KEY_FILE_NAMES);
		const count = document.createElement("div");
		count.className = "project-overview-count";
		count.textContent = `${summary.total}${summary.truncated ? "+" : ""} ${strings["files"]}`;
		section.append(count);

		if (summary.extensions.length) {
			const types = document.createElement("div");
			types.className = "project-overview-types";
			for (const { extension, count: extensionCount } of summary.extensions) {
				const type = document.createElement("div");
				type.className = "project-overview-type";
				const label = document.createElement("span");
				label.textContent = extension;
				const value = document.createElement("span");
				value.textContent = String(extensionCount);
				type.append(label, value);
				types.append(type);
			}
			section.append(types);
		}

		if (summary.keyFiles.length) {
			const keyFiles = document.createElement("div");
			keyFiles.className = "project-overview-key-files";
			for (const file of summary.keyFiles) {
				const button = document.createElement("button");
				button.type = "button";
				button.textContent = file.name;
				button.title = file.path || file.url;
				button.addEventListener("click", () => openFile(file.url));
				keyFiles.append(button);
			}
			section.append(keyFiles);
		}

		container.append(section);
	}
}

async function getIndexedFiles(rootUrl) {
	const entries = [];
	let cursor = 0;
	let truncated = false;
	while (entries.length < MAX_INDEXED_FILES) {
		const page = await fileIndex.query({
			roots: [rootUrl],
			limit: INDEX_PAGE_SIZE,
			cursor,
		});
		entries.push(...(page.entries || []));
		if (page.cursor == null) break;
		cursor = page.cursor;
		if (entries.length >= MAX_INDEXED_FILES) truncated = true;
	}
	return entries.length > MAX_INDEXED_FILES
		? Object.assign(entries.slice(0, MAX_INDEXED_FILES), { truncated: true })
		: Object.assign(entries, { truncated });
}

function isWithinRoot(url = "", rootUrl = "") {
	const prefix = rootUrl.endsWith("/") ? rootUrl : `${rootUrl}/`;
	return url === rootUrl || url.startsWith(prefix);
}
