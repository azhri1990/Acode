import { describe, expect, it, vi } from "vitest";
import { createClient } from "../../src/lib/agora/client.js";
import { runAgora } from "../../src/lib/agora/orchestrator.js";

describe("agora client", () => {
	it("posts to chat/completions with bearer auth", async () => {
		const fetchImpl = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ choices: [{ message: { content: "hi" } }] }),
		});
		const c = createClient({ baseUrl: "http://x/v1/", apiKey: "k", fetchImpl });
		expect(await c.chat({ model: "m", messages: [] })).toBe("hi");
		expect(fetchImpl.mock.calls[0][0]).toBe("http://x/v1/chat/completions");
		expect(fetchImpl.mock.calls[0][1].headers.Authorization).toBe(
			["Bearer", "k"].join(" "),
		);
	});

	it("throws on HTTP errors", async () => {
		const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 401 });
		const c = createClient({ baseUrl: "http://x", fetchImpl });
		await expect(c.chat({ model: "m", messages: [] })).rejects.toThrow("401");
	});
});

describe("runAgora", () => {
	it("runs every agent per round then a moderator", async () => {
		const client = { chat: vi.fn().mockResolvedValue("ok") };
		const onTurn = vi.fn();
		const r = await runAgora({
			client,
			model: "m",
			task: "t",
			rounds: 2,
			onTurn,
		});
		expect(r.transcript).toHaveLength(6);
		expect(client.chat).toHaveBeenCalledTimes(7);
		expect(r.answer).toBe("ok");
	});

	it("rejects empty tasks and honors abort", async () => {
		const client = { chat: vi.fn() };
		await expect(runAgora({ client, model: "m", task: " " })).rejects.toThrow();
		const ac = new AbortController();
		ac.abort();
		await expect(
			runAgora({ client, model: "m", task: "t", signal: ac.signal }),
		).rejects.toThrow("aborted");
	});
});

describe("client edge cases", () => {
	it("rejects malformed responses", async () => {
		const fetchImpl = vi
			.fn()
			.mockResolvedValue({ ok: true, json: async () => ({}) });
		const c = createClient({ baseUrl: "http://x", fetchImpl });
		await expect(c.chat({ model: "m", messages: [] })).rejects.toThrow(
			"unexpected",
		);
	});
});

describe("streaming and agents", () => {
	it("streams SSE deltas", async () => {
		const enc = new TextEncoder();
		const chunks = [
			'data: {"choices":[{"delta":{"content":"a"}}]}\n',
			'data: {"choices":[{"delta":{"content":"b"}}]}\ndata: [DONE]\n',
		];
		let i = 0;
		const fetchImpl = vi.fn().mockResolvedValue({
			ok: true,
			body: {
				getReader: () => ({
					read: async () =>
						i < chunks.length
							? { done: false, value: enc.encode(chunks[i++]) }
							: { done: true },
				}),
			},
		});
		const tokens = [];
		const c = createClient({ baseUrl: "http://x", fetchImpl });
		const out = await c.chat({
			model: "m",
			messages: [],
			onToken: (d) => tokens.push(d),
		});
		expect(out).toBe("ab");
		expect(tokens).toEqual(["a", "b"]);
	});

	it("parses agents with optional model", async () => {
		const { parseAgents, DEFAULT_AGENTS } = await import(
			"../../src/lib/agora/orchestrator.js"
		);
		expect(parseAgents("A | do x | gpt\nbad")).toEqual([
			{ name: "A", prompt: "do x", model: "gpt" },
		]);
		expect(parseAgents("")).toBe(DEFAULT_AGENTS);
	});
});

describe("history helpers", () => {
	it("caps history and builds task context", async () => {
		const { addChat, buildTask } = await import(
			"../../src/lib/agora/history.js"
		);
		let h = [];
		for (let i = 0; i < 25; i++)
			h = addChat(h, { task: `t${i}`, answer: "a" }, i);
		expect(h).toHaveLength(20);
		expect(h[0].task).toBe("t24");
		expect(buildTask("q", null)).toBe("q");
		expect(buildTask("q", { label: "selection", text: "x" })).toContain(
			"Context (selection):\nx",
		);
		expect(
			buildTask("q", { label: "file", text: "y".repeat(13000) }),
		).toContain("(truncated)");
	});
});
