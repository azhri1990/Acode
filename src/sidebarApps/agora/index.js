import "./style.scss";
import { createClient } from "lib/agora/client";
import { addChat, buildTask, PRESETS } from "lib/agora/history";
import {
	DEFAULT_AGENTS,
	formatAgents,
	parseAgents,
	runAgora,
} from "lib/agora/orchestrator";
import {
	isVoiceInputSupported,
	isVoiceOutputSupported,
	listen,
	speak,
} from "lib/agora/voice";

const STORAGE_KEY = "agoraConfig";

export default [
	"chat_bubble", // icon
	"agora", // id
	"Agora", // title
	initApp, // init function
	false, // prepend
	() => {}, // onSelected
];

function loadConfig() {
	try {
		return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
	} catch {
		return {};
	}
}

const HISTORY_KEY = "agoraHistory";

function loadHistory() {
	try {
		return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
	} catch {
		return [];
	}
}

function saveHistory(chat) {
	localStorage.setItem(
		HISTORY_KEY,
		JSON.stringify(addChat(loadHistory(), chat)),
	);
}

/** @returns {{label:string,text:string}|null} */
function getContext(kind) {
	const view = editorManager?.editor;
	if (!kind || !view) return null;
	if (kind === "file") {
		return { label: "open file", text: view.state.doc.toString() };
	}
	const { from, to } = view.state.selection.main;
	return from === to
		? null
		: { label: "selection", text: view.state.sliceDoc(from, to) };
}

function insertAtCursor(text) {
	const view = editorManager?.editor;
	if (!view || !text) return;
	view.dispatch(view.state.replaceSelection(text));
}

/** @param {HTMLElement} container */
function initApp(container) {
	const cfg = loadConfig();
	let controller = null;

	const $base = (
		<input
			placeholder="Endpoint e.g. http://127.0.0.1:11434/v1"
			value={cfg.baseUrl || ""}
		/>
	);
	const $key = (
		<input type="password" placeholder="API key (optional)" value="" />
	);
	const $preset = (
		<select
			title="Endpoint preset"
			onchange={(e) => {
				const p = PRESETS.find((x) => x.name === e.target.value);
				if (p) $base.value = p.baseUrl;
			}}
		>
			<option value="">Preset...</option>
			{PRESETS.map((p) => (
				<option value={p.name}>{p.name}</option>
			))}
		</select>
	);
	const $ctx = (
		<select title="Editor context to send">
			<option value="">No context</option>
			<option value="selection">Send selection</option>
			<option value="file">Send open file</option>
		</select>
	);
	let lastAnswer = "";
	const $model = <input placeholder="Model id" value={cfg.model || ""} />;
	const $agents = (
		<textarea
			rows="4"
			title="One agent per line: Name | role prompt | optional model"
			value={cfg.agents || formatAgents(DEFAULT_AGENTS)}
		/>
	);
	const $rounds = (
		<input
			type="number"
			min="1"
			max="5"
			value={cfg.rounds || 1}
			title="Rounds"
		/>
	);
	const $task = <textarea placeholder="Ask the agents..." rows="3" />;
	const $log = <div className="agora-log scroll" />;

	const add = (who, text) => {
		$log.append(
			<div className="agora-turn">
				<b>{who}</b>
				<pre>{text}</pre>
			</div>,
		);
		$log.scrollTop = $log.scrollHeight;
	};

	const showHistory = () => {
		const h = loadHistory();
		if (!h.length) return add("Agora", "No saved chats yet.");
		for (const c of h.slice().reverse()) {
			add(
				`Saved ${new Date(c.at).toLocaleString()}`,
				`Q: ${c.task}\n\n${c.answer}`,
			);
		}
	};

	const run = async () => {
		const config = {
			baseUrl: $base.value.trim(),
			apiKey: $key.value,
			model: $model.value.trim(),
			agents: $agents.value,
			rounds: Math.min(5, Math.max(1, Number($rounds.value) || 1)),
		};
		const { apiKey: _secret, ...persisted } = config;
		localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
		const task = buildTask($task.value, getContext($ctx.value));
		if (!config.baseUrl || !config.model || !task.trim()) {
			add("Agora", "Set endpoint, model and a question first.");
			return;
		}
		controller?.abort();
		const ctrl = new AbortController();
		controller = ctrl;
		const question = $task.value;
		add("You", task);
		const live = {};
		const onToken = (who, delta) => {
			if (!live.who || live.who !== who) {
				live.who = who;
				live.pre = document.createElement("pre");
				const $turn = document.createElement("div");
				$turn.className = "agora-turn";
				const $b = document.createElement("b");
				$b.textContent = who;
				$turn.append($b, live.pre);
				$log.append($turn);
			}
			live.pre.textContent += delta;
			$log.scrollTop = $log.scrollHeight;
		};
		try {
			const { answer } = await runAgora({
				client: createClient(config),
				model: config.model,
				task,
				signal: ctrl.signal,
				agents: parseAgents(config.agents),
				rounds: config.rounds,
				onToken,
				onTurn: () => {
					live.who = null;
				},
			});
			lastAnswer = answer;
			saveHistory({ task: question, answer });
			if (isVoiceOutputSupported()) speak(answer);
		} catch (err) {
			if (!ctrl.signal.aborted) add("Error", err.message);
		}
	};

	container.content = (
		<div className="header">
			<div className="title">Agora</div>
		</div>
	);
	container.append(
		<div className="agora">
			{$preset}
			{$base}
			{$key}
			{$model}
			{$agents}
			{$rounds}
			{$ctx}
			{$log}
			{$task}
			<div className="agora-actions">
				<button type="button" onclick={run}>
					Send
				</button>
				<button type="button" onclick={() => controller?.abort()}>
					Stop
				</button>
				<button type="button" onclick={() => insertAtCursor(lastAnswer)}>
					Insert
				</button>
				<button type="button" onclick={showHistory}>
					History
				</button>
				{isVoiceInputSupported() ? (
					<button
						type="button"
						onclick={async () => {
							try {
								const heard = await listen();
								if (heard) $task.value = heard;
							} catch (err) {
								add("Error", err.message);
							}
						}}
					>
						Mic
					</button>
				) : null}
			</div>
		</div>,
	);
}
