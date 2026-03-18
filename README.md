# Vampfire

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

For Unraid, use volume mappings like `/mnt/user/appdata/vampfire/storage:/rails/storage`.

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
