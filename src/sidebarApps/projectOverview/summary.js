const KEY_FILE_ORDER = [
	"readme.md",
	"package.json",
	"index.html",
	"cargo.toml",
	"pyproject.toml",
	"requirements.txt",
	"go.mod",
	"pom.xml",
];

export function summarizeProjectFiles(entries = [], keyFileNames = new Set()) {
	const extensions = new Map();
	const keyFiles = new Map();
	let total = 0;

	for (const entry of entries) {
		if (!entry || entry.isDirectory) continue;
		total += 1;

		const name = String(entry.name || "");
		const normalizedName = name.toLowerCase();
		const dot = normalizedName.lastIndexOf(".");
		if (dot > 0 && dot < normalizedName.length - 1) {
			const extension = normalizedName.slice(dot + 1);
			extensions.set(extension, (extensions.get(extension) || 0) + 1);
		}
		if (keyFileNames.has(normalizedName)) {
			keyFiles.set(normalizedName, entry);
		}
	}

	return {
		total,
		truncated: !!entries.truncated,
		extensions: [...extensions]
			.map(([extension, count]) => ({ extension, count }))
			.sort(
				(a, b) => b.count - a.count || a.extension.localeCompare(b.extension),
			)
			.slice(0, 5),
		keyFiles: KEY_FILE_ORDER.filter((name) => keyFiles.has(name)).map((name) =>
			keyFiles.get(name),
		),
	};
}
