require "jwt"

class LivekitToken
  # Generate a LiveKit access token for a user to join a room
  def self.generate(user:, room_name:, ttl: 6.hours)
    api_key = Rails.configuration.x.livekit.api_key
    secret = Rails.configuration.x.livekit.secret

    now = Time.now.to_i
    exp = now + ttl.to_i

    payload = {
      iss: api_key,
      sub: user.id.to_s,
      nbf: now,
      exp: exp,
      name: user.name,
      video: {
        roomJoin: true,
        room: room_name,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true
      },
      metadata: { user_id: user.id, name: user.name }.to_json
    }

    JWT.encode(payload, secret, "HS256", { typ: "JWT" })
  end
end
