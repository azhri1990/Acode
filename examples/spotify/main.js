(() => {
	const pluginId = "spotify";
	const sidebarApps = acode.require("sidebarApps");
	const webview = acode.require("webview");
	let player;

	function toEmbedUrl(value) {
		let url;
		try {
			url = new URL(value.trim());
		} catch {
			return null;
		}

		if (
			url.protocol !== "https:" ||
			!["open.spotify.com", "www.spotify.com"].includes(url.hostname)
		) {
			return null;
		}

		const segments = url.pathname.split("/").filter(Boolean);
		const resourceIndex = segments.findIndex((segment) =>
			["album", "artist", "episode", "playlist", "show", "track"].includes(
				segment,
			),
		);
		if (resourceIndex < 0) return null;

		const type = segments[resourceIndex];
		const id = segments[resourceIndex + 1];
		if (!id || !/^[A-Za-z0-9]+$/.test(id)) return null;

		return `https://open.spotify.com/embed/${type}/${id}`;
	}

	async function closePlayer() {
		if (!player) return;
		const currentPlayer = player;
		player = null;
		try {
			await currentPlayer.destroy();
		} catch {}
	}

	async function openPlayer(url) {
		await closePlayer();

		let nextPlayer;
		try {
			nextPlayer = await webview.create({
				mode: "fullscreen",
				title: "Spotify",
				visible: false,
			});
			await nextPlayer.loadURL(url);
			player = nextPlayer;
			nextPlayer.on("closed", () => {
				if (player === nextPlayer) player = null;
			});
			await nextPlayer.show();
		} catch (error) {
			if (nextPlayer) {
				try {
					await nextPlayer.destroy();
				} catch {}
			}
			acode.require("toast")(
				`Couldn't open Spotify player: ${error.message || error}`,
			);
		}
	}

	function init(container) {
		container.innerHTML = `
			<section class="spotify-plugin">
				<h2>Spotify</h2>
				<button type="button" class="spotify-open-app">Open Spotify app</button>
				<p>Paste a Spotify link to play it here.</p>
				<input class="spotify-link" type="url" inputmode="url"
					placeholder="https://open.spotify.com/track/…" aria-label="Spotify link">
				<button type="button" class="spotify-embed">Open embedded player</button>
			</section>
		`;

		container.querySelector(".spotify-open-app").addEventListener("click", () => {
			if (!window.system?.openInBrowser) {
				acode.require("toast")("Spotify app links are only supported on Android.");
				return;
			}

			window.system.openInBrowser("https://open.spotify.com");
		});

		container.querySelector(".spotify-embed").addEventListener("click", () => {
			const url = toEmbedUrl(container.querySelector(".spotify-link").value);
			if (!url) {
				acode.require("toast")(
					"Enter a Spotify link to a track, album, playlist, artist, show, or episode.",
				);
				return;
			}
			openPlayer(url);
		});
	}

	acode.setPluginInit(pluginId, () => {
		sidebarApps.add("music_note", pluginId, "Spotify", init);
	});

	acode.setPluginUnmount(pluginId, () => {
		sidebarApps.remove(pluginId);
		closePlayer();
	});
})();
