import { quote, validateName, validateRepoPath } from "./shell";

export const FLOW_KINDS = {
	feature: { base: "develop", prefix: "feature/" },
	release: {
		base: "develop",
		prefix: "release/",
		target: "main",
		back: "develop",
	},
	hotfix: { base: "main", prefix: "hotfix/", target: "main", back: "develop" },
};

/** Parse `git status --porcelain=v1 -b` output. */
export function parseStatus(out) {
	const lines = String(out).split("\n").filter(Boolean);
	const head = lines[0]?.startsWith("## ") ? lines.shift().slice(3) : "";
	const branch = head.split("...")[0].split(" ")[0];
	const ahead = Number(/ahead (\d+)/.exec(head)?.[1] || 0);
	const behind = Number(/behind (\d+)/.exec(head)?.[1] || 0);
	const conflicts = lines.filter((l) => /^(UU|AA|DD|AU|UA|DU|UD)/.test(l));
	return {
		branch,
		ahead,
		behind,
		changes: lines.length,
		conflicts: conflicts.map((l) => l.slice(3)),
	};
}

/**
 * Git operations over an injected shell runner.
 * @param {object} opts
 * @param {(cmd:string)=>Promise<string>} opts.exec runs a shell command, resolves stdout
 * @param {string} opts.repo absolute repository path
 * @param {(msg:string)=>Promise<boolean>} [opts.confirm] required for push/finish
 * @param {()=>string|undefined} [opts.getToken] token read at call time, never stored here
 */
export function createGit({ exec, repo, confirm, getToken }) {
	const dir = validateRepoPath(repo);
	const git = (args, { auth = false } = {}) => {
		let pre = "";
		const token = auth ? getToken?.() : "";
		if (token) {
			const b64 = globalThis.btoa(`x-access-token:${token}`);
			pre = `-c http.extraHeader=${quote(`Authorization: Basic ${b64}`)} `;
		}
		return exec(`git -C ${quote(dir)} ${pre}${args}`);
	};
	const ask = async (msg) => {
		if (!confirm || !(await confirm(msg))) throw new Error("Cancelled");
	};

	const api = {
		async status() {
			return parseStatus(await git("status --porcelain=v1 -b"));
		},
		async pull() {
			const s = await api.status();
			if (s.conflicts.length) {
				throw new Error(`Resolve conflicts first: ${s.conflicts.join(", ")}`);
			}
			try {
				return await git("pull --ff-only", { auth: true });
			} catch (err) {
				throw new Error(
					`Pull could not fast-forward (local and remote have diverged). Rebase or merge manually. ${err.message || err}`,
				);
			}
		},
		async commit(message) {
			const m = String(message ?? "").trim();
			if (!m) throw new Error("Commit message is empty");
			await git("add -A");
			return git(`commit -m ${quote(m)}`);
		},
		async push() {
			const s = await api.status();
			await ask(`Push branch "${s.branch}" (${s.ahead} commit(s) ahead)?`);
			return git(`push origin ${quote(s.branch)}`, { auth: true });
		},
		async sync(message) {
			const s = await api.status();
			if (s.changes) await api.commit(message);
			await api.pull();
			return api.push();
		},
		async start(kind, name) {
			const flow = FLOW_KINDS[kind];
			if (!flow) throw new Error(`Unknown flow kind: ${kind}`);
			const branch = flow.prefix + validateName(name);
			return git(`checkout -b ${quote(branch)} ${quote(flow.base)}`);
		},
		async finish(kind) {
			const flow = FLOW_KINDS[kind];
			if (!flow) throw new Error(`Unknown flow kind: ${kind}`);
			const s = await api.status();
			if (!s.branch.startsWith(flow.prefix)) {
				throw new Error(`Current branch is not a ${kind} branch`);
			}
			if (s.changes) throw new Error("Commit or stash changes first");
			const target = flow.target || flow.base;
			const targets = [target, ...(flow.back ? [flow.back] : [])];
			await ask(
				`Merge "${s.branch}" into ${targets.join(" and ")}${kind === "feature" ? "" : ", tag it"} and delete it?`,
			);
			await git(`checkout ${quote(target)}`);
			await git(`merge --no-ff ${quote(s.branch)}`);
			if (kind !== "feature") {
				await git(`tag ${quote(s.branch.slice(flow.prefix.length))}`);
			}
			if (flow.back) {
				await git(`checkout ${quote(flow.back)}`);
				await git(`merge --no-ff ${quote(s.branch)}`);
			}
			return git(`branch -d ${quote(s.branch)}`);
		},
	};
	return api;
}
