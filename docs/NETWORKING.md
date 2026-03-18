# Vampfire Networking Guide

This guide explains how voice and video calls work in Vampfire, why TURN servers
are needed, and how to configure networking for reliable multi-user communication.

---

## How Voice/Video Works

Vampfire uses **LiveKit** (built on WebRTC) for real-time voice, video, and screen sharing.

Here's what happens when you start a call:

1. Your browser requests a **token** from the Vampfire server
2. Your browser connects to the **LiveKit server** via WebSocket
3. LiveKit negotiates a **peer-to-peer media path** between participants
4. Audio/video streams flow directly between participants (or through TURN if needed)

---

## WebSocket Requirements

LiveKit requires a **persistent WebSocket connection** between the browser and the LiveKit server.

### Key Points

| Scenario | LiveKit URL Format | Notes |
|----------|-------------------|-------|
| Local / HTTP only | `ws://your-server:7880` | Development only |
| Behind reverse proxy with SSL | `wss://livekit.yourdomain.com` | **Required for production** |

### Why WSS (Secure WebSocket)?

- Modern browsers **block** mixed content (HTTP page + WS connection)
- If your site is served over HTTPS, LiveKit **must** use WSS
- Most reverse proxies (Nginx Proxy Manager, Cloudflare, SWAG) can terminate SSL and proxy WebSocket traffic to LiveKit on port 7880

### Reverse Proxy Configuration

Your reverse proxy needs to forward WebSocket connections to LiveKit:

**Nginx example:**
```nginx
server {
    listen 443 ssl;
    server_name livekit.yourdomain.com;

    ssl_certificate     /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:7880;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
}
```

**Nginx Proxy Manager:**
1. Add a new proxy host for `livekit.yourdomain.com`
2. Point it to your server IP, port `7880`
3. Enable SSL (Let's Encrypt)
4. Under **Advanced**, add:
   ```
   proxy_set_header Upgrade $http_upgrade;
   proxy_set_header Connection "upgrade";
   ```

---

## Internal vs External Networking

This is the most common source of confusion.

### Internal (Docker Network)

Inside Docker, containers talk to each other by service name:
- Vampfire → LiveKit: `ws://livekit:7880` ✅ (works inside Docker)
- Redis: `redis://redis:6379` ✅ (works inside Docker)

### External (Browser Access)

**Browsers cannot reach Docker's internal network.** The `LIVEKIT_URL` environment
variable must be a URL that the **end-user's browser** can reach:

```
# ❌ WRONG — browsers can't resolve "livekit" (Docker internal hostname)
LIVEKIT_URL=ws://livekit:7880

# ✅ CORRECT — public URL that browsers can reach
LIVEKIT_URL=wss://livekit.yourdomain.com

# ✅ CORRECT — direct IP access (HTTP only, development)
LIVEKIT_URL=ws://192.168.1.100:7880
```

### Quick Test

Open your `LIVEKIT_URL` in a browser. If you see a connection or get a WebSocket
error, the URL is reachable. If you get "site not found", fix your DNS or proxy config.

---

## NAT Traversal and TURN

### What is NAT?

**Network Address Translation (NAT)** is used by routers to share a single public
IP address among many devices. It's everywhere — home routers, mobile networks,
corporate firewalls.

### Why NAT Causes Problems

WebRTC tries to establish **direct connections** between participants. NAT makes
this difficult because:

1. Devices behind NAT don't have public IP addresses
2. NAT firewalls block unsolicited incoming connections
3. **Symmetric NAT** (common on mobile networks) blocks most connection attempts

### The Solution: TURN Servers

A **TURN server** acts as a relay:

```
User A  ←→  TURN Server  ←→  User B
```

When direct connections fail, media flows through the TURN server instead.
This adds a small amount of latency but ensures **reliable connectivity**.

### When is TURN Required?

| Scenario | Direct Connection | TURN Needed? |
|----------|------------------|--------------|
| Same local network | ✅ Usually works | No |
| Home network → Home network | ✅ Often works | Sometimes |
| Mobile network (4G/5G) | ❌ Usually blocked | **Yes** |
| Corporate firewall | ❌ Often blocked | **Yes** |
| VPN | ❌ Often blocked | **Yes** |

**Rule of thumb:** If you want calls to work reliably for all users, set up TURN.

---

## TURN Server Setup

### Option A: External Coturn Server (Recommended)

If you already run a Coturn server (or want to set one up), configure LiveKit to use it.

1. Edit `livekit.yaml` and uncomment the TURN section:

```yaml
turn:
  enabled: true
  domain: turn.yourdomain.com
  tls_port: 443
  udp_port: 3478
  external_tls:
    - address: turn.yourdomain.com
      port: 443
      protocol: tls
      username: your-turn-username
      credential: your-turn-password
```

2. Set the TURN environment variables in your `.env`:

```bash
TURN_HOST=turn.yourdomain.com
TURN_PORT=3478
TURN_USERNAME=vampfire
TURN_PASSWORD=your-strong-password
```

### Option B: Add Coturn to Docker Compose

If you don't have a TURN server, you can run Coturn alongside Vampfire.

Add this to your `docker-compose.yml`:

```yaml
  coturn:
    image: coturn/coturn:latest
    ports:
      - "3478:3478/tcp"
      - "3478:3478/udp"
      - "5349:5349/tcp"
      - "49152-49200:49152-49200/udp"
    volumes:
      - ./turnserver.conf:/etc/turnserver.conf:ro
    command: -c /etc/turnserver.conf
    restart: unless-stopped
```

Create a `turnserver.conf` file:

```
# Coturn configuration for Vampfire
listening-port=3478
tls-listening-port=5349
realm=yourdomain.com
server-name=yourdomain.com

# Authentication
lt-cred-mech
user=vampfire:your-strong-password

# Logging
log-file=/var/log/turnserver.log
verbose

# Performance
total-quota=100
stale-nonce=600
no-multicast-peers
```

Then configure LiveKit to use it in `livekit.yaml`:

```yaml
turn:
  enabled: true
  domain: yourdomain.com
  udp_port: 3478
  tls_port: 5349
```

---

## Required Ports

| Port | Protocol | Service | Purpose |
|------|----------|---------|---------|
| 80 | TCP | Vampfire | HTTP web interface |
| 443 | TCP | Vampfire | HTTPS web interface |
| 7880 | TCP | LiveKit | WebSocket signaling |
| 7881 | TCP | LiveKit | WebRTC TCP fallback |
| 50000-50060 | UDP | LiveKit | WebRTC media traffic |
| 3478 | TCP/UDP | TURN (optional) | TURN signaling |
| 5349 | TCP | TURN (optional) | TURN over TLS |
| 49152-49200 | UDP | TURN (optional) | TURN media relay |

### Firewall Rules

Ensure these ports are open in your firewall/router:

```bash
# Minimum required
ufw allow 80/tcp     # Vampfire HTTP
ufw allow 443/tcp    # Vampfire HTTPS
ufw allow 7880/tcp   # LiveKit WebSocket
ufw allow 7881/tcp   # LiveKit TCP fallback
ufw allow 50000:50060/udp  # LiveKit media

# If using TURN
ufw allow 3478/tcp   # TURN signaling
ufw allow 3478/udp   # TURN signaling
ufw allow 5349/tcp   # TURN TLS
ufw allow 49152:49200/udp  # TURN media relay
```

---

## Mobile Browser Limitations

| Browser | Voice | Video | Screen Share | Notes |
|---------|-------|-------|-------------|-------|
| Chrome (Android) | ✅ | ✅ | ✅ | Best experience |
| Firefox (Android) | ✅ | ✅ | ❌ | No screen share |
| Safari (iOS) | ✅ | ✅ | ❌ | Requires iOS 14.5+ |
| Chrome (iOS) | ✅ | ✅ | ❌ | Uses Safari's WebRTC engine |

**iOS note:** All iOS browsers use Safari's WebRTC engine due to Apple's
restrictions. Screen sharing is not supported on iOS.

---

## Troubleshooting

### "No audio or video"

**Cause:** TURN server not configured, or TURN server unreachable.

**Fix:**
1. Set up a TURN server (see above)
2. Verify TURN is reachable: `nc -zv turn.yourdomain.com 3478`
3. Check LiveKit logs: `docker compose logs livekit`

### "Call connects but no sound"

**Cause:** Symmetric NAT blocking direct peer connections.

**Fix:**
1. Configure a TURN server — this is the #1 fix
2. Check that UDP ports 50000-50060 are open on your firewall
3. Try from a different network to isolate the issue

### "Cannot join call" or "WebSocket connection failed"

**Cause:** LiveKit WebSocket URL is wrong or unreachable from the browser.

**Fix:**
1. Check `LIVEKIT_URL` — it must be reachable from the **browser**, not just Docker
2. If using HTTPS, `LIVEKIT_URL` must use `wss://` (not `ws://`)
3. Check your reverse proxy forwards WebSocket connections (see above)
4. Test: open `LIVEKIT_URL` in your browser — you should get a WebSocket error, not "site not found"

### "Works on desktop but not mobile"

**Cause:** Mobile networks use symmetric NAT which blocks direct connections.

**Fix:**
1. Set up a TURN server — mobile networks almost always require TURN
2. Ensure your TURN server supports UDP relay

### "Only works on local network"

**Cause:** LiveKit is only accessible within Docker or your LAN.

**Fix:**
1. Set `LIVEKIT_URL` to a publicly accessible URL (not `ws://livekit:7880`)
2. Port-forward or reverse-proxy LiveKit port 7880
3. Set `use_external_ip: true` in `livekit.yaml` (already set in the default config)
