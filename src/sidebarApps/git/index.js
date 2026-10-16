import "./style.scss";
import confirm from "dialogs/confirm";
import { createGit, FLOW_KINDS } from "lib/git/git";

const STORAGE_KEY = "gitPanelConfig";

export default [
	"git", // icon
	"git", // id
	"Git", // title
	initApp, // init function
	false, // prepend
	() => {}, // onSelected
];

function loadConfig() {
	try {
		return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
	} catch {
		return {};
	}
}

/** Runs commands in the Alpine (proot) environment. */
const exec = (cmd) => Executor.execute(cmd, true);

/** @param {HTMLElement} container */
function initApp(container) {
	const cfg = loadConfig();
	const $repo = (
		<input
			placeholder="Repo path e.g. /sdcard/project"
			value={cfg.repo || ""}
		/>
	);
	const $token = (
		<input type="password" placeholder="Access token (not saved)" value="" />
	);
	const $msg = <input placeholder="Commit message" />;
	const $kind = (
		<select>
			{Object.keys(FLOW_KINDS).map((k) => (
				<option value={k}>{k}</option>
			))}
		</select>
	);
	const $name = <input placeholder="Flow branch name" />;
	const $log = <pre className="git-log scroll" />;

	const log = (text) => {
		$log.textContent += `${text}\n`;
		$log.scrollTop = $log.scrollHeight;
	};

	const act = (label, fn) => async () => {
		try {
			localStorage.setItem(
				STORAGE_KEY,
				JSON.stringify({ repo: $repo.value.trim() }),
			);
			const git = createGit({
				exec,
				repo: $repo.value,
				confirm: (m) => confirm("Git", m),
				getToken: () => $token.value,
			});
			log(`> ${label}`);
			const out = await fn(git);
			log(typeof out === "string" ? out.trim() || "done" : JSON.stringify(out));
		} catch (err) {
			log(`Error: ${err.message || err}`);
		}
	};

	const btn = (label, fn) => (
		<button type="button" onclick={act(label, fn)}>
			{label}
		</button>
	);

	container.content = (
		<div className="header">
			<div className="title">Git</div>
		</div>
	);
	container.append(
		<div className="git-panel">
			{$repo}
			{$token}
			<div className="git-actions">
				{btn("Status", (g) => g.status())}
				{btn("Pull", (g) => g.pull())}
				{btn("Push", (g) => g.push())}
			</div>
			{$msg}
			<div className="git-actions">
				{btn("Commit", (g) => g.commit($msg.value))}
				{btn("Sync", (g) => g.sync($msg.value))}
			</div>
			<div className="git-actions">
				{$kind}
				{$name}
			</div>
			<div className="git-actions">
				{btn("Start", (g) => g.start($kind.value, $name.value))}
				{btn("Finish", (g) => g.finish($kind.value))}
			</div>
			{$log}
		</div>,
	);
}
