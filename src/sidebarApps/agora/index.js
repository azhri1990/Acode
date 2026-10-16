import "./style.scss";
import { createClient } from "lib/agora/client";
import { runAgora } from "lib/agora/orchestrator";
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
		<input type="password" placeholder="API key (optional)" value={cfg.apiKey || ""} />
	);
	const $model = <input placeholder="Model id" value={cfg.model || ""} />;
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

	const run = async () => {
		const config = {
			baseUrl: $base.value.trim(),
			apiKey: $key.value,
			model: $model.value.trim(),
		};
		localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
		const task = $task.value;
		if (!config.baseUrl || !config.model || !task.trim()) {
			add("Agora", "Set endpoint, model and a question first.");
			return;
		}
		controller?.abort();
		controller = new AbortController();
		add("You", task);
		try {
			const { answer } = await runAgora({
				client: createClient(config),
				model: config.model,
				task,
				signal: controller.signal,
				onTurn: (t) => add(t.agent, t.content),
			});
			add("Moderator", answer);
			if (isVoiceOutputSupported()) speak(answer);
		} catch (err) {
			add("Error", err.message);
		}
	};

	container.content = <div className="header"><div className="title">Agora</div></div>;
	container.append(
		<div className="agora">
			{$base}
			{$key}
			{$model}
			{$log}
			{$task}
			<div className="agora-actions">
				<button type="button" onclick={run}>Send</button>
				<button type="button" onclick={() => controller?.abort()}>Stop</button>
				{isVoiceInputSupported() ? (
					<button
						type="button"
						onclick={async () => {
							try {
								$task.value = await listen();
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
