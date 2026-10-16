/** Single-quote a value for POSIX sh. */
export function quote(value) {
	return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

/**
 * Validate a short branch/topic name (no spaces, no option-like or path tricks).
 * @returns {string} the trimmed name
 */
export function validateName(name) {
	const n = String(name ?? "").trim();
	if (
		!/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(n) ||
		n.includes("..") ||
		n.endsWith("/") ||
		n.endsWith(".lock") ||
		n.includes("//")
	) {
		throw new Error(`Invalid name: ${n || "(empty)"}`);
	}
	return n;
}

/** Validate an absolute repository path. */
export function validateRepoPath(path) {
	const p = String(path ?? "").trim();
	if (!p.startsWith("/") || p.includes("\n") || p.split("/").includes("..")) {
		throw new Error("Repository path must be absolute (e.g. /sdcard/project)");
	}
	return p;
}
