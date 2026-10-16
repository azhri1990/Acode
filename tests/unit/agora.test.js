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
