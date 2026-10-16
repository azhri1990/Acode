/**
 * Minimal OpenAI-compatible chat completion client.
 * Works with any router or local server exposing POST {baseUrl}/chat/completions.
 */

/**
 * @param {object} config
 * @param {string} config.baseUrl e.g. http://127.0.0.1:11434/v1
 * @param {string} [config.apiKey] sent as a ****** when present
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
		async chat({ model, messages, temperature = 0.7 }) {
			const doFetch = fetchImpl || globalThis.fetch;
			const headers = { "Content-Type": "application/json" };
			if (apiKey) headers.Authorization = `******;

			const res = await doFetch(`${root}/chat/completions`, {
				method: "POST",
				headers,
				body: JSON.stringify({ model, messages, temperature, stream: false }),
			});
			if (!res.ok) {
				throw new Error(`Agora: endpoint returned HTTP ${res.status}`);
			}
			const data = await res.json();
			const text = data?.choices?.[0]?.message?.content;
			if (typeof text !== "string") {
				throw new Error("Agora: unexpected response shape");
			}
			return text;
		},
	};
}
