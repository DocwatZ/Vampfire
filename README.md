# Vampfire

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

## Deploying with Docker Compose

Vampfire provides a complete Docker Compose stack including the Rails app, Redis, and LiveKit server.

### Quick Start

```bash
docker compose up -d
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY_BASE` | Rails secret key (required) | - |
| `LIVEKIT_URL` | LiveKit server WebSocket URL | `ws://livekit:7880` |
| `LIVEKIT_API_KEY` | LiveKit API key | `devkey` |
| `LIVEKIT_SECRET` | LiveKit API secret | `secret` |
| `REDIS_URL` | Redis connection URL | `redis://redis:6379` |
| `DISABLE_SSL` | Set to serve over plain HTTP | `true` |
| `VAPID_PUBLIC_KEY` | Web Push notification public key | - |
| `VAPID_PRIVATE_KEY` | Web Push notification private key | - |

### Unraid Deployment

Vampfire can be deployed on Unraid using either the Community Applications template or a manual Docker setup.

#### Using the Unraid Template (Recommended)

1. Install the **Community Applications** plugin if you haven't already
2. Search for **Vampfire** in Community Applications
3. Click **Install** — the template will pre-fill all required settings
4. Configure the following:
   - **SECRET_KEY_BASE**: Generate one with `openssl rand -hex 64` and paste it in
   - **LIVEKIT_URL**: Leave as default (`ws://livekit:7880`) if running LiveKit on the same server
   - **LIVEKIT_API_KEY** / **LIVEKIT_SECRET**: Set matching values on both Vampfire and your LiveKit container
   - **VAPID keys**: Generate with `docker run --rm ghcr.io/docwatz/vampfire:latest bin/rails runner "keys = WebPush.generate_key; puts keys.public_key; puts keys.private_key"` for Web Push notifications
5. Click **Apply** to start the container

#### Manual Docker Setup on Unraid

1. Go to the **Docker** tab in Unraid
2. Click **Add Container** and configure:
   - **Repository**: `ghcr.io/docwatz/vampfire:latest`
   - **Network Type**: `bridge`
   - **Port Mappings**:
     - `80` → `80` (HTTP)
     - `443` → `443` (HTTPS)
   - **Volume Mappings**:
     - `/mnt/user/appdata/vampfire/storage` → `/rails/storage` (Read/Write)
   - **Environment Variables**:
     - `SECRET_KEY_BASE` = *(your generated secret key)*
     - `REDIS_URL` = `redis://<your-redis-ip>:6379`
     - `LIVEKIT_URL` = `ws://<your-livekit-ip>:7880`
     - `LIVEKIT_API_KEY` = *(your LiveKit API key)*
     - `LIVEKIT_SECRET` = *(your LiveKit secret)*
     - `DISABLE_SSL` = `true` *(set to `false` if using a reverse proxy with SSL)*
     - `VAPID_PUBLIC_KEY` = *(optional, for Web Push)*
     - `VAPID_PRIVATE_KEY` = *(optional, for Web Push)*

3. You will also need **Redis** and **LiveKit** containers:
   - **Redis**: Use the `redis:7-alpine` image with `/mnt/user/appdata/redis:/data` volume mapping
   - **LiveKit**: Use the `livekit/livekit-server:latest` image with ports `7880`, `7881`, and UDP range `50000-50060`. Set `LIVEKIT_KEYS_devkey=secret` (or your custom key/secret pair) and use command `--dev --bind 0.0.0.0`

4. Start all three containers and access Vampfire at `http://<your-unraid-ip>`

#### Unraid Tips

- **Reverse Proxy**: If using Nginx Proxy Manager or SWAG, point your domain to the Vampfire container on port 80 and enable SSL at the proxy level. Set `DISABLE_SSL=true` on the Vampfire container.
- **Persistence**: The `/rails/storage` volume contains your database, uploaded files, and configuration. **Back this up regularly.**
- **Updates**: Pull the latest image from `ghcr.io/docwatz/vampfire:latest` and restart the container to update.

### Building from Source

    docker build -t vampfire .

    docker run \
      --publish 80:80 --publish 443:443 \
      --restart unless-stopped \
      --volume vampfire:/rails/storage \
      --env SECRET_KEY_BASE=$YOUR_SECRET_KEY_BASE \
      --env DISABLE_SSL=true \
      vampfire

## Running in development

    bin/setup
    bin/rails server

## Worth Noting

When you start Vampfire for the first time, you’ll be guided through
creating an admin account.
The email address of this admin account will be shown on the login page
so that people who forget their password know who to contact for help.
(You can change this email later in the settings)

Vampfire is single-tenant: any rooms designated "public" will be accessible by
all users in the system. To support entirely distinct groups of customers, you
would deploy multiple instances of the application.
