# Using Acode with Tailscale

Acode cannot create a VPN itself. Use Tailscale alongside it:

## Option A: Android Tailscale app (recommended)
1. Install the Tailscale app on the phone and sign in to your tailnet.
2. In Acode, point SFTP/FTP profiles and the Agora endpoint at the machine's
   Tailscale address (e.g. `100.x.y.z`) or MagicDNS name.
3. Prefer an inference server that requires an API key; do not expose an
   unauthenticated model endpoint, even on a tailnet you share.

## Option B: userspace Tailscale inside the Acode terminal (proot)
1. In the Acode terminal: `apk add tailscale`.
2. Start the daemon in userspace mode:
   `tailscaled --tun=userspace-networking --socks5-server=localhost:1055 &`
3. Authenticate: `tailscale up`.
4. Traffic only flows through the SOCKS5 proxy at `localhost:1055`; tools such
   as `git` must be configured to use it (e.g. `ALL_PROXY=socks5h://localhost:1055`).

The Agora panel has a "Tailscale host" endpoint preset; edit the placeholder
address to your machine's Tailscale IP.
