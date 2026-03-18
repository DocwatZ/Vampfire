# Vampfire Validation Checklist

Use this checklist to verify your Vampfire deployment is working correctly.
Test with **two or more devices** (or browser tabs in separate profiles/incognito windows).

---

## Basic Functionality

- [ ] Vampfire loads in the browser at your configured URL
- [ ] First-run setup completes (create admin account)
- [ ] Login works with created credentials
- [ ] Second user can register via join link
- [ ] Rooms are visible after login

## Text Chat

- [ ] Send a message in a room — appears for all users
- [ ] @mention another user — they receive a notification
- [ ] Upload a file — preview displays correctly
- [ ] Direct message another user — message is delivered
- [ ] Search finds previously sent messages

## Voice / Video Calls

- [ ] Two users join the same room
- [ ] Start a voice call — both users hear each other
- [ ] Audio works in both directions
- [ ] Enable video — both users see each other
- [ ] Video works in both directions
- [ ] Third user joins — group call works (all participants can hear/see each other)
- [ ] Screen share works (desktop browsers only)
- [ ] End call — all participants disconnect cleanly

## Voice Notes

- [ ] Record a voice note in a room
- [ ] Voice note plays back correctly for other users
- [ ] Voice notes persist after container restart (`docker compose restart`)

## Persistence

- [ ] Restart containers: `docker compose restart`
- [ ] All messages still visible after restart
- [ ] All uploaded files still accessible after restart
- [ ] User accounts and sessions survive restart

## Networking

- [ ] Call works between two devices on the same local network
- [ ] Call works between a local device and a mobile device (if TURN configured)
- [ ] LiveKit WebSocket URL (`LIVEKIT_URL`) is reachable from a browser
- [ ] Check LiveKit health: `curl http://localhost:7880` returns a response

## Security

- [ ] Unauthenticated users are redirected to login
- [ ] Users can only access rooms they are members of
- [ ] LiveKit tokens are scoped to specific rooms
- [ ] `SECRET_KEY_BASE` is set to a strong, unique value (not the default)
- [ ] `LIVEKIT_API_KEY` and `LIVEKIT_SECRET` are changed from defaults in production

## Mobile / PWA

- [ ] Vampfire loads on mobile browser
- [ ] "Add to Home Screen" / "Install App" works
- [ ] Push notifications work (if VAPID keys configured)
- [ ] Voice calls work on mobile (may require TURN)

---

## Quick Smoke Test (5 minutes)

1. Open Vampfire in **Browser A** (logged in as User 1)
2. Open Vampfire in **Browser B** (private/incognito window, logged in as User 2)
3. Both users navigate to the same room
4. User 1 sends a text message → User 2 sees it
5. User 1 starts a voice call → User 2 joins
6. Verify audio works both ways
7. User 1 enables video → User 2 sees video
8. User 2 shares screen → User 1 sees shared screen
9. End call → both users return to text chat

If all steps pass, your deployment is working correctly. 🎉
