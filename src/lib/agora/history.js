const MAX_CHATS = 20;
const MAX_FILE_CHARS = 12000;

/** Model presets selectable in the panel. */
export const PRESETS = [
	{ name: "Local (Ollama)", baseUrl: "http://127.0.0.1:11434/v1" },
	{ name: "OpenRouter", baseUrl: "https://openrouter.ai/api/v1" },
	{ name: "OpenAI", baseUrl: "https://api.openai.com/v1" },
	{ name: "Tailscale host", baseUrl: "http://100.x.y.z:11434/v1" },
];

/**
 * Append a chat to saved history (newest first, capped). Pure: returns a new array.
 * @param {object[]} history
 * @param {{task:string, answer:string}} chat
 */
export function addChat(history, { task, answer }, now = Date.now()) {
	const entry = { id: String(now), task, answer, at: now };
	return [entry, ...(history || [])].slice(0, MAX_CHATS);
}

/** Build the task text, optionally with editor context. */
export function buildTask(question, context) {
	const q = String(question || "").trim();
	if (!context?.text) return q;
	const text =
		context.text.length > MAX_FILE_CHARS
			? `${context.text.slice(0, MAX_FILE_CHARS)}\n...(truncated)`
			: context.text;
	return `${q}\n\nContext (${context.label}):\n${text}`;
}
