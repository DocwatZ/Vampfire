Rails.application.configure do
  config.x.livekit.url = ENV.fetch("LIVEKIT_URL", "ws://localhost:7880")
  config.x.livekit.api_key = ENV.fetch("LIVEKIT_API_KEY", "devkey")
  config.x.livekit.secret = ENV.fetch("LIVEKIT_SECRET", "secret")
end
