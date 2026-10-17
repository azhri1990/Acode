import { spawnSync } from "node:child_process";
import {
	chmodSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const buildScript = fileURLToPath(
	new URL("../../utils/scripts/build.sh", import.meta.url),
);
const tempDirs = [];

function runBuild(overrides = {}) {
	const root = mkdtempSync(path.join(os.tmpdir(), "acode-build-"));
	tempDirs.push(root);
	const bin = path.join(root, "bin");
	mkdirSync(bin);

	const commands = {
		npm: 'printf "%s\\n" "$PWD"',
		node: 'printf "node\\n" >> "$BUILD_LOG"\nexit "${CONFIG_STATUS:-0}"',
		rspack: 'printf "rspack\\n" >> "$BUILD_LOG"\nexit "${RSPACK_STATUS:-0}"',
		cordova: 'printf "cordova\\n" >> "$BUILD_LOG"',
	};

	for (const [command, body] of Object.entries(commands)) {
		const file = path.join(bin, command);
		writeFileSync(file, `#!/bin/sh\n${body}\n`);
		chmodSync(file, 0o755);
	}

	const logFile = path.join(root, "build.log");
	const result = spawnSync("sh", [buildScript, "free", "dev", "apk"], {
		cwd: root,
		env: {
			...process.env,
			...overrides,
			BUILD_LOG: logFile,
			PATH: `${bin}${path.delimiter}${process.env.PATH}`,
			TMPDIR: root,
		},
		encoding: "utf8",
	});

	return {
		log: readFileSync(logFile, "utf8"),
		result,
	};
}

afterEach(() => {
	for (const directory of tempDirs.splice(0)) {
		rmSync(directory, { force: true, recursive: true });
	}
});

describe("Android build script", () => {
	it("stops before bundling when configuration fails", () => {
		const { log, result } = runBuild({ CONFIG_STATUS: "9" });

		expect(result.status).toBe(9);
		expect(log).toBe("node\n");
	});

	it("stops before Cordova when web bundling fails", () => {
		const { log, result } = runBuild({ RSPACK_STATUS: "8" });

		expect(result.status).toBe(8);
		expect(log).toBe("node\nrspack\n");
	});

	it("runs Cordova after configuration and bundling succeed", () => {
		const { log, result } = runBuild();

		expect(result.status).toBe(0);
		expect(log).toBe("node\nrspack\ncordova\n");
	});
});
