import { describe, expect, it } from "vitest";
import { summarizeProjectFiles } from "../../src/sidebarApps/projectOverview/summary";

const keyFileNames = new Set(["readme.md", "package.json"]);

describe("summarizeProjectFiles", () => {
	it("counts files by extension and returns recognized project files", () => {
		const summary = summarizeProjectFiles(
			[
				{ name: "src", isDirectory: true },
				{ name: "README.md", url: "/project/README.md" },
				{ name: "package.json", url: "/project/package.json" },
				{ name: "app.js", url: "/project/app.js" },
				{ name: "main.js", url: "/project/main.js" },
				{ name: "LICENSE", url: "/project/LICENSE" },
			],
			keyFileNames,
		);

		expect(summary.total).toBe(5);
		expect(summary.extensions).toEqual([
			{ extension: "js", count: 2 },
			{ extension: "md", count: 1 },
		]);
		expect(summary.keyFiles.map(({ name }) => name)).toEqual([
			"README.md",
			"package.json",
		]);
		expect(summary.truncated).toBe(false);
	});

	it("limits displayed extension groups and preserves truncation state", () => {
		const entries = [
			{ name: "a.js" },
			{ name: "b.css" },
			{ name: "c.html" },
			{ name: "d.py" },
			{ name: "e.rs" },
			{ name: "f.ts" },
		];
		entries.truncated = true;
		const summary = summarizeProjectFiles(entries, keyFileNames);

		expect(summary.extensions).toHaveLength(5);
		expect(summary.truncated).toBe(true);
	});
});
