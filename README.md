# <img src="https://github.com/user-attachments/assets/3a3b9abc-5e89-4aee-a3e0-a3c66bfbdcf9" width="48" height="48" alt="Vampfire logo" style="vertical-align: middle;"> Vampfire

```
                                              ###                                                   
                                               #####                                                
                                               ###*###                                              
                                               ###*+*##                                             
                                               ####*+*###                                           
                                               ####*++*##                                           
                                              #####*+++**#                                          
                                            #######*++++*##                                         
                                           ####*###++++++**# ***                                    
                                          ###***###++====**#  ***                                   
                                        ####***###*======***  ****                                  
                                      %###****###*=======***  *****                                 
                                 ##  ####***####*=-======***  ***=**                                
                                %#% %##***#####+--======+**  **++==*                                
                              %##%%%##**#####*---=======**# **+--=-+*                               
                             %%#%%%%#**#####=--========+*  *++=::-:+*                               
                             %#*#%%%#*###*=-==========+****+=::::::=+                               
                            %##*+#%%####+-===========+**+=-::::::::=+  *                            
                           %%#**++#%##*--==========+*=--:::::::::::=+  ++                           
                           %%#***==*#+--===========::::::::::::::::++ +++                           
                          %%%#***+===--========--:::::::::::::::::-+ ++++*                          
                          %%%#*++*+%%%%#+=====-::::::::::::=*%%%#-=++=-++*                          
                          %%%#*+++*@@@@*#%@%#+-----:::-*%@%#*@@@@#=-::-***                          
                          %%%%#*+=*@@@@*=-=#@@@@@@@@@@@@#=--+@@@@+:::-+***                          
                           %%%%*+==%@@@#=-=@@@@@@@@@@@@@@=--#@@@@-::-=***                           
                           %%%%%#+=+@@@@+:*@@@@@@@@@@@@@@*:=@@@@=:--=****                           
                            %%%%%#*=+%@@%=*@@@@@@@@@@@@@@*-%@@@+---=***#                            
                             %%%%###*+%@@%*@@@@@@@@@@@@@@*%@@%=-===*###                             
                              %%%%#*+==*@@@@@@@@@@@@@@@@@@@@#:-==+####                              
                                %%%#*++==*%@@@@@@@@@@@@@@%+---=+*###                                
                                 %%%%#*+====+%@@@@@@@@%+-:--=+#####                                 
                                    %%%%#*===--+@@@@+:::-=+#####                                    
                                       %%%%#+=--:++:::-+#####                                       
                                         %%%%#+--::--+#%%%%                                         
                                            %%%#=--=#%%%                                            
                                             %%%#++%%%%                                             
                                               %%%%%%                                               
                                                %%%%                                                
                                                 %%
```

Vampfire is a self-hosted, privacy-first, lightweight alternative to Discord built
on top of Campfire. It provides:

- Real-time text chat with multiple rooms and access controls
- Voice communication (via LiveKit)
- Video calls (via LiveKit)
- Screen sharing (via LiveKit)
- Voice notes (record and send audio messages)
- Direct messages
- File attachments with previews
- Search
- Notifications (via Web Push)
- @mentions
- API, with support for bot integrations

- Mobile-friendly PWA experience
- Easy deployment via Docker and Unraid

---

## Stack

| Layer | Technology |
|-------|------------|
| **Framework** | [Ruby on Rails](https://rubyonrails.org/) 8.2 (Ruby 3.4) |
| **Database** | [SQLite](https://www.sqlite.org/) — zero-config, file-based storage |
| **Real-time** | [Action Cable](https://guides.rubyonrails.org/action_cable_overview.html) (WebSockets) backed by [Redis](https://redis.io/) |
| **Voice / Video** | [LiveKit](https://livekit.io/) (WebRTC) with [livekit-client](https://www.npmjs.com/package/livekit-client) JS SDK |
| **Frontend** | [Hotwire](https://hotwired.dev/) ([Turbo](https://turbo.hotwired.dev/) + [Stimulus](https://stimulus.hotwired.dev/)), [Trix](https://trix-editor.org/) rich-text editor, [importmap-rails](https://github.com/rails/importmap-rails) (no bundler) |
| **Asset Pipeline** | [Propshaft](https://github.com/rails/propshaft) |
| **Web Server** | [Puma](https://puma.io/) behind [Thruster](https://github.com/basecamp/thruster) (HTTP/2, asset caching, X-Sendfile) |
| **Background Jobs** | [Resque](https://github.com/resque/resque) + Redis |
| **Push Notifications** | Web Push via the [web-push](https://github.com/pushpad/web-push) gem (VAPID) |
| **Media Processing** | [libvips](https://www.libvips.org/) (via ImageProcessing) and [FFmpeg](https://ffmpeg.org/) |
| **Containerization** | [Docker](https://www.docker.com/) multi-stage build, [Docker Compose](https://docs.docker.com/compose/) orchestration |
| **Container Image** | Published to [GitHub Container Registry](https://ghcr.io/) (`ghcr.io/docwatz/vampfire`) |
| **Supported Platforms** | Docker, [Unraid](https://unraid.net/) (community template), any Linux host |

---

## Quick Start (5-Minute Setup)

```bash
# 1. Clone the repository
git clone https://github.com/DocwatZ/Vampfire.git
cd Vampfire

# 2. Copy the example environment file
cp .env.example .env

# 3. Generate a secret key and add it to .env
echo "SECRET_KEY_BASE=$(openssl rand -hex 64)" >> .env

# 4. Start everything
docker compose up -d

# 5. Open in your browser
open http://localhost
```

On first visit, you'll be guided through creating an admin account. That's it — you're running!

---

## Full Setup Guide

### Prerequisites

- Docker and Docker Compose
- A domain name (for production with SSL)
- A reverse proxy (for SSL termination — see below)

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `SECRET_KEY_BASE` | Rails secret key | — | **Yes** |
| `LIVEKIT_URL` | LiveKit WebSocket URL (see note below) | `ws://livekit:7880` | **Yes** |
| `LIVEKIT_API_KEY` | LiveKit API key | `devkey` | **Yes** |
| `LIVEKIT_SECRET` | LiveKit API secret | `secret` | **Yes** |
| `REDIS_URL` | Redis connection URL | `redis://redis:6379` | **Yes** |
| `DISABLE_SSL` | Set `true` for HTTP-only (behind proxy) | `true` | No |
| `TURN_HOST` | TURN server hostname | — | No |
| `TURN_PORT` | TURN server port | `3478` | No |
| `TURN_USERNAME` | TURN server username | — | No |
| `TURN_PASSWORD` | TURN server password | — | No |
| `VAPID_PUBLIC_KEY` | Web Push public key | — | No |
| `VAPID_PRIVATE_KEY` | Web Push private key | — | No |

> **⚠️ Important:** `LIVEKIT_URL` must be reachable by end-user browsers — not just
> the Docker internal network. For production, use `wss://livekit.yourdomain.com`.
> See [docs/NETWORKING.md](docs/NETWORKING.md) for details.

### Production Credentials

**Generate strong credentials before deploying to production:**

```bash
# Rails secret key
openssl rand -hex 64

# LiveKit API key
openssl rand -hex 16

# LiveKit secret
openssl rand -hex 32
```

Update your `.env`, and set matching keys in `livekit.yaml` under the `keys:` section.

See [`.env.production`](.env.production) for a fully documented production configuration example.

### Domain and SSL Setup

Vampfire requires HTTPS in production for:
- Secure cookies and sessions
- WebRTC (browsers block insecure WebRTC on HTTPS pages)
- WebSocket connections (`wss://`)

#### Using Nginx Proxy Manager (Recommended for Unraid)

1. Install Nginx Proxy Manager on your server
2. Add a proxy host for your Vampfire domain → port `80`
3. Add a proxy host for your LiveKit domain → port `7880`
   - Under **Advanced**, add:
     ```
     proxy_set_header Upgrade $http_upgrade;
     proxy_set_header Connection "upgrade";
     ```
4. Enable SSL (Let's Encrypt) on both proxy hosts
5. Set these in your `.env`:
   ```
   LIVEKIT_URL=wss://livekit.yourdomain.com
   DISABLE_SSL=true
   ```

#### Using Cloudflare

1. Add your domain to Cloudflare
2. Point DNS A records to your server IP
3. Set SSL mode to "Full" or "Full (Strict)"
4. Create proxy rules for both Vampfire and LiveKit subdomains
5. **Important:** Cloudflare must be configured to proxy WebSocket traffic for LiveKit

#### Using SWAG (Secure Web Application Gateway)

1. Add subdomain configurations for Vampfire and LiveKit
2. Include WebSocket proxy headers for the LiveKit subdomain
3. Let SWAG handle Let's Encrypt certificates

---

## Voice/Video Requirements

Vampfire uses LiveKit (WebRTC) for all real-time communication. This section covers what you need for reliable voice and video.

### Required Ports

| Port | Protocol | Service | Purpose |
|------|----------|---------|---------|
| 80 | TCP | Vampfire | HTTP web interface |
| 443 | TCP | Vampfire | HTTPS web interface |
| 7880 | TCP | LiveKit | WebSocket signaling |
| 7881 | TCP | LiveKit | WebRTC TCP fallback |
| 50000-50060 | UDP | LiveKit | WebRTC media traffic |

### TURN Server (For Reliable Calls)

A TURN server relays media traffic when direct peer-to-peer connections fail.
**You need TURN if:**

- Users are on mobile networks (4G/5G)
- Users are behind corporate firewalls
- Users are behind symmetric NATs
- You want calls to "just work" for everyone

**Two options:**

1. **Use your existing Coturn server** (recommended)
2. **Add Coturn to docker-compose** (see [docs/NETWORKING.md](docs/NETWORKING.md))

Configure TURN in `livekit.yaml` — see the commented examples in that file.

### Mobile Browser Support

| Browser | Voice | Video | Screen Share |
|---------|-------|-------|-------------|
| Chrome (Android) | ✅ | ✅ | ✅ |
| Firefox (Android) | ✅ | ✅ | ❌ |
| Safari (iOS 14.5+) | ✅ | ✅ | ❌ |
| Chrome (iOS) | ✅ | ✅ | ❌ |

> All iOS browsers use Safari's WebRTC engine. Screen sharing is not supported on iOS.

---

## Troubleshooting

### "No audio or video"

**Likely cause:** TURN server not configured.

1. Set up a TURN server (see [docs/NETWORKING.md](docs/NETWORKING.md))
2. Check LiveKit logs: `docker compose logs livekit`
3. Verify UDP ports 50000-50060 are open in your firewall

### "Call connects but no sound"

**Likely cause:** Symmetric NAT blocking direct peer connections.

1. Configure a TURN server
2. Check firewall rules for UDP ports
3. Try from a different network to isolate the problem

### "Cannot join call" / WebSocket errors

**Likely cause:** `LIVEKIT_URL` is wrong or unreachable.

1. `LIVEKIT_URL` must be reachable from the **browser**, not just Docker
2. If using HTTPS, `LIVEKIT_URL` must use `wss://` (not `ws://`)
3. Verify your reverse proxy passes WebSocket headers
4. Test: open `LIVEKIT_URL` in your browser — you should get a WebSocket error, not "site not found"

### "Works on desktop but not mobile"

**Likely cause:** Mobile networks use symmetric NAT.

1. Set up a TURN server
2. Ensure TURN supports UDP relay

### "Only works on local network"

**Likely cause:** LiveKit is only accessible within Docker.

1. Set `LIVEKIT_URL` to a publicly reachable URL
2. Port-forward or reverse-proxy LiveKit port 7880
3. Verify `use_external_ip: true` in `livekit.yaml`

For detailed networking guidance, see [docs/NETWORKING.md](docs/NETWORKING.md).

---

## Unraid Deployment

### Using the Unraid Template (Recommended)

1. Install the **Community Applications** plugin if you haven't already
2. Search for **Vampfire** in Community Applications
3. Click **Install** — the template will pre-fill all required settings
4. Configure the following:
   - **SECRET_KEY_BASE**: Generate with `openssl rand -hex 64`
   - **LIVEKIT_URL**: Set to your public LiveKit URL (e.g., `wss://livekit.yourdomain.com`)
   - **LIVEKIT_API_KEY** / **LIVEKIT_SECRET**: Set matching values on both Vampfire and your LiveKit container
   - **TURN** settings *(optional)*: Configure if you need reliable mobile/remote calls
   - **VAPID keys** *(optional, for Web Push)*: Generate with:
     ```bash
     docker run --rm ghcr.io/docwatz/vampfire:latest \
       bin/rails runner "keys = WebPush.generate_key; puts keys.public_key; puts keys.private_key"
     ```
5. Click **Apply** to start the container

### Manual Docker Setup on Unraid

1. Go to the **Docker** tab in Unraid
2. Click **Add Container** and configure:
   - **Repository**: `ghcr.io/docwatz/vampfire:latest`
   - **Network Type**: `bridge`
   - **Port Mappings**: `80`→`80`, `443`→`443`
   - **Volume Mappings**: `/mnt/user/appdata/vampfire/storage` → `/rails/storage`
   - **Environment Variables**: see the table above
3. You'll also need **Redis** and **LiveKit** containers:
   - **Redis**: `redis:7-alpine` image with `/mnt/user/appdata/redis:/data`
   - **LiveKit**: `livekit/livekit-server:latest` with ports `7880`, `7881`, UDP `50000-50060`

### Unraid Folder Structure

```
/mnt/user/appdata/vampfire/
├── storage/          # Rails storage (database, uploads, config)
├── livekit.yaml      # LiveKit server configuration (optional)
```

```
/mnt/user/appdata/redis/
└── (Redis data)
```

### Unraid Tips

- **Reverse Proxy**: Use Nginx Proxy Manager or SWAG. Point your domain to Vampfire on port 80, enable SSL at the proxy level, and set `DISABLE_SSL=true`.
- **Persistence**: The `/rails/storage` volume contains your database, uploads, and configuration. **Back this up regularly.**
- **Updates**: Pull the latest image from `ghcr.io/docwatz/vampfire:latest` and restart.

---

## Security

### Authentication

All endpoints require authentication. Unauthenticated requests are redirected to the login page. Bot access requires a valid bot API key.

### LiveKit Token Security

LiveKit access tokens are:
- **Scoped to specific rooms** — users can only join rooms they have access to
- **Time-limited** — tokens expire after 6 hours
- **User-bound** — tokens include the user's identity

Users cannot join rooms they are not members of because the token endpoint (`/livekit/token`) looks up rooms via `Current.user.rooms.find(params[:room_id])`, which only returns rooms the authenticated user has access to.

### Production Security Checklist

- [ ] Set `SECRET_KEY_BASE` to a strong random value (`openssl rand -hex 64`)
- [ ] Change `LIVEKIT_API_KEY` and `LIVEKIT_SECRET` from defaults
- [ ] Update matching keys in `livekit.yaml`
- [ ] Use HTTPS (via reverse proxy) — never expose Vampfire over plain HTTP in production
- [ ] If using TURN, set a strong `TURN_PASSWORD`

---

## Validation Checklist

After deploying, verify your setup with [docs/VALIDATION.md](docs/VALIDATION.md) — a step-by-step checklist covering text chat, voice/video calls, persistence, and security.

---

## Building from Source

```bash
docker build -t vampfire .

docker run \
  --publish 80:80 --publish 443:443 \
  --restart unless-stopped \
  --volume vampfire:/rails/storage \
  --env SECRET_KEY_BASE=$YOUR_SECRET_KEY_BASE \
  --env DISABLE_SSL=true \
  vampfire
```

## Running in Development

```bash
bin/setup
bin/rails server
```

## Worth Noting

When you start Vampfire for the first time, you'll be guided through
creating an admin account.
The email address of this admin account will be shown on the login page
so that people who forget their password know who to contact for help.
(You can change this email later in the settings)

Vampfire is single-tenant: any rooms designated "public" will be accessible by
all users in the system. To support entirely distinct groups of customers, you
would deploy multiple instances of the application.
