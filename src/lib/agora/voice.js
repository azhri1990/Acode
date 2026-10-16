/** Voice helpers built on the Web Speech API (availability depends on the WebView). */

export function isVoiceInputSupported() {
	return !!(globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition);
}

export function isVoiceOutputSupported() {
	return !!globalThis.speechSynthesis && !!globalThis.SpeechSynthesisUtterance;
}

/** @returns {Promise<string>} recognized text */
export function listen(lang = "en-US") {
	const Ctor = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;
	if (!Ctor) return Promise.reject(new Error("Voice input not supported"));
	return new Promise((resolve, reject) => {
		const rec = new Ctor();
		rec.lang = lang;
		rec.interimResults = false;
		rec.onresult = (e) => resolve(e.results?.[0]?.[0]?.transcript || "");
		rec.onerror = (e) => reject(new Error(e.error || "Voice input failed"));
		rec.start();
	});
}

export function speak(text) {
	if (!isVoiceOutputSupported()) return;
	globalThis.speechSynthesis.cancel();
	globalThis.speechSynthesis.speak(new globalThis.SpeechSynthesisUtterance(text));
}
