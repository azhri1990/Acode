/**
 * Minimal OpenAI-compatible chat completion client.
 * Works with any router or local server exposing POST {baseUrl}/chat/completions.
 */

/**
 * @param {object} config
 * @param {string} config.baseUrl e.g. http://127.0.0.1:11434/v1
 * @param {string} [config.apiKey] sent as an Authorization bearer header when present
 * @param {typeof fetch} [config.fetchImpl]
 */
export function createClient({ baseUrl, apiKey, fetchImpl }) {
	if (!baseUrl) throw new Error("Agora: baseUrl is required");
	const root = baseUrl.replace(/\/+$/, "");

	return {
		/**
		 * @param {{model:string, messages:{role:string,content:string}[], temperature?:number}} req
		 * @returns {Promise<string>} assistant text
		 */
		async chat({ model, messages, temperature = 0.7, signal, onToken }) {
			const doFetch = fetchImpl || globalThis.fetch;
			const headers = { "Content-Type": "application/json" };
			if (apiKey) headers.Authorization = ["Bearer", apiKey].join(" ");

			const res = await doFetch(`${root}/chat/completions`, {
				method: "POST",
				signal,
				headers,
				body: JSON.stringify({
					model,
					messages,
					temperature,
					stream: !!onToken,
				}),
			});
			if (!res.ok) {
				let detail = "";
				try {
					detail = (await res.text?.())?.slice(0, 200) || res.statusText || "";
				} catch {
					// body unavailable
				}
				throw new Error(
					`Agora: endpoint returned HTTP ${res.status}${detail ? `: ${detail}` : ""}`,
				);
			}
			if (onToken) return readStream(res, onToken);
			const data = await res.json();
			const text = data?.choices?.[0]?.message?.content;
			if (typeof text !== "string") {
				throw new Error("Agora: unexpected response shape");
			}
			return text;
		},
	};
}

/**
 * Read an OpenAI-style server-sent-events stream, calling onToken per delta.
 * @returns {Promise<string>} full text
 */
async function readStream(res, onToken) {
	if (!res.body?.getReader) throw new Error("Agora: streaming not supported");
	const reader = res.body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";
	let full = "";
	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;
		buffer += decoder.decode(value, { stream: true });
		const lines = buffer.split("\n");
		buffer = lines.pop();
		for (const line of lines) {
			const t = line.trim();
			if (!t.startsWith("data:")) continue;
			const payload = t.slice(5).trim();
			if (payload === "[DONE]") return full;
			try {
				const delta = JSON.parse(payload)?.choices?.[0]?.delta?.content;
				if (delta) {
					full += delta;
					onToken(delta);
				}
			} catch {
				// ignore malformed keep-alive lines
			}
		}
	}
	return full;
}
