# Spotify for Acode

This Acode plugin adds a Spotify panel with two options:

- **Open Spotify app** opens Spotify's universal link. Android opens the Spotify app when it is installed and associated with Spotify links; otherwise the link opens in a browser.
- **Open embedded player** loads a Spotify embed for a pasted track, album, playlist, artist, show, or episode link in Acode's fullscreen WebView.

The embedded player requires an internet connection and may require signing in to Spotify. It uses Spotify's web player and does not control playback in the Spotify app.

## Install

Package the files in this directory (`plugin.json`, `main.js`, and `readme.md`) at the root of a ZIP archive, then install that ZIP using Acode's plugin installer. This is an Acode editor plugin, not a Cordova plugin.
