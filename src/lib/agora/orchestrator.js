/**
 * Agora: several agents with different roles discuss a task in rounds,
 * then a moderator synthesizes one answer. Nothing is applied to files here;
 * the caller must get user approval before acting on the result.
 */

export const DEFAULT_AGENTS = [
	{
		name: "Architect",
		prompt: "You plan the approach and point out design trade-offs.",
	},
	{
		name: "Coder",
		prompt: "You propose concrete code or commands to solve the task.",
	},
	{
		name: "Reviewer",
		prompt: "You find bugs, risks and security problems in the proposals.",
	},
];

/**
 * @param {object} opts
 * @param {{chat:Function}} opts.client
 * @param {string} opts.model
 * @param {string} opts.task
 * @param {{name:string,prompt:string,model?:string}[]} [opts.agents]
 * @param {number} [opts.rounds=1]
 * @param {(turn:{round:number,agent:string,content:string})=>void} [opts.onTurn]
 * @param {(agent:string,delta:string)=>void} [opts.onToken] streaming callback
 * @param {AbortSignal} [opts.signal]
 * @returns {Promise<{transcript:object[], answer:string}>}
 */
export async function runAgora({
	client,
	model,
	task,
	agents = DEFAULT_AGENTS,
	rounds = 1,
	onTurn,
	onToken,
	signal,
}) {
	if (!task?.trim()) throw new Error("Agora: task is empty");
	if (!agents.length) throw new Error("Agora: at least one agent is needed");

	const transcript = [];
	const rendered = () =>
		transcript.map((t) => `[${t.agent}] ${t.content}`).join("\n\n");

	for (let round = 1; round <= Math.max(1, rounds); round++) {
		for (const agent of agents) {
			if (signal?.aborted) throw new Error("Agora: aborted");
			const content = await client.chat({
				signal,
				onToken: onToken && ((d) => onToken(agent.name, d)),
				model: agent.model || model,
				messages: [
					{
						role: "system",
						content: `You are ${agent.name} in a multi-agent discussion. ${agent.prompt} Be concise.`,
					},
					{
						role: "user",
						content: `Task:\n${task}\n\nDiscussion so far:\n${rendered() || "(none)"}`,
					},
				],
			});
			const turn = { round, agent: agent.name, content };
			transcript.push(turn);
			onTurn?.(turn);
		}
	}

	if (signal?.aborted) throw new Error("Agora: aborted");
	const answer = await client.chat({
		signal,
		onToken: onToken && ((d) => onToken("Moderator", d)),
		model,
		temperature: 0.3,
		messages: [
			{
				role: "system",
				content:
					"You are the moderator. Merge the discussion into one final, actionable answer.",
			},
			{
				role: "user",
				content: `Task:\n${task}\n\nDiscussion:\n${rendered()}`,
			},
		],
	});
	return { transcript, answer };
}

/**
 * Parse agents from lines of "Name | prompt | optional model".
 * @param {string} text
 */
export function parseAgents(text) {
	const agents = [];
	for (const line of String(text || "").split("\n")) {
		const [name, prompt, model] = line.split("|").map((p) => p.trim());
		if (!name || !prompt) continue;
		agents.push(model ? { name, prompt, model } : { name, prompt });
	}
	return agents.length ? agents : DEFAULT_AGENTS;
}

export function formatAgents(agents) {
	return agents
		.map((a) => [a.name, a.prompt, a.model].filter(Boolean).join(" | "))
		.join("\n");
}
