import { describe, expect, it, vi } from "vitest";
import { createGit, parseStatus } from "../../src/lib/git/git.js";
import {
	quote,
	validateName,
	validateRepoPath,
} from "../../src/lib/git/shell.js";

describe("shell helpers", () => {
	it("quotes single quotes", () => {
		expect(quote("a'b")).toBe(`'a'\\''b'`);
	});
	it("validates names and paths", () => {
		expect(validateName("login-page")).toBe("login-page");
		for (const bad of ["", "-x", "a b", "a..b", "a;rm", "x.lock", "a//b"]) {
			expect(() => validateName(bad)).toThrow();
		}
		expect(() => validateRepoPath("rel")).toThrow();
		expect(() => validateRepoPath("/a/../b")).toThrow();
		expect(validateRepoPath("/sdcard/p")).toBe("/sdcard/p");
	});
});

describe("parseStatus", () => {
	it("parses branch, divergence and conflicts", () => {
		const s = parseStatus(
			"## main...origin/main [ahead 2, behind 1]\nUU a.js\n M b.js\n",
		);
		expect(s).toMatchObject({
			branch: "main",
			ahead: 2,
			behind: 1,
			changes: 2,
			conflicts: ["a.js"],
		});
	});
});

function make(statusOut, confirm = async () => true) {
	const exec = vi.fn(async (cmd) => (cmd.includes("status") ? statusOut : ""));
	const git = createGit({ exec, repo: "/r", confirm, getToken: () => "tok" });
	return { exec, git };
}

describe("git operations", () => {
	it("requires confirmation to push and sends token only on auth commands", async () => {
		const { exec, git } = make("## main\n");
		await git.push();
		const push = exec.mock.calls.at(-1)[0];
		expect(push).toContain("http.extraHeader");
		expect(push).toContain("push origin 'main'");
		const no = make("## main\n", async () => false);
		await expect(no.git.push()).rejects.toThrow("Cancelled");
		expect(no.exec.mock.calls.some((c) => c[0].includes("push"))).toBe(false);
	});

	it("refuses pull with conflicts", async () => {
		const { git } = make("## main\nUU a.js\n");
		await expect(git.pull()).rejects.toThrow("conflicts");
	});

	it("starts and finishes a feature", async () => {
		const { exec, git } = make("## feature/x\n");
		await git.start("feature", "x");
		expect(exec.mock.calls[0][0]).toContain(
			"checkout -b 'feature/x' 'develop'",
		);
		await git.finish("feature");
		const cmds = exec.mock.calls.map((c) => c[0]).join("\n");
		expect(cmds).toContain("merge --no-ff 'feature/x'");
		expect(cmds).toContain("branch -d 'feature/x'");
	});

	it("blocks finishing on the wrong branch or dirty tree", async () => {
		await expect(make("## main\n").git.finish("feature")).rejects.toThrow(
			"not a feature",
		);
		await expect(
			make("## feature/x\n M a\n").git.finish("feature"),
		).rejects.toThrow("stash");
	});

	it("rejects empty commit messages", async () => {
		await expect(make("## main\n").git.commit(" ")).rejects.toThrow();
	});
});
