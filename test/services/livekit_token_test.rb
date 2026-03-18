require "test_helper"

class LivekitTokenTest < ActiveSupport::TestCase
  test "generates a valid JWT token" do
    user = users(:david)
    token = LivekitToken.generate(user: user, room_name: "test-room")

    assert token.present?

    decoded = JWT.decode(token, "secret", true, algorithm: "HS256")
    payload = decoded[0]

    assert_equal "devkey", payload["iss"]
    assert_equal user.id.to_s, payload["sub"]
    assert_equal "David", payload["name"]
    assert_equal "test-room", payload["video"]["room"]
    assert payload["video"]["roomJoin"]
    assert payload["video"]["canPublish"]
    assert payload["video"]["canSubscribe"]
  end

  test "token includes correct expiration" do
    user = users(:david)
    token = LivekitToken.generate(user: user, room_name: "test-room", ttl: 1.hour)

    decoded = JWT.decode(token, "secret", true, algorithm: "HS256")
    payload = decoded[0]

    assert_in_delta Time.now.to_i + 3600, payload["exp"], 5
  end

  test "token includes user metadata as JSON" do
    user = users(:david)
    token = LivekitToken.generate(user: user, room_name: "test-room")

    decoded = JWT.decode(token, "secret", true, algorithm: "HS256")
    payload = decoded[0]

    metadata = JSON.parse(payload["metadata"])
    assert_equal user.id, metadata["user_id"]
    assert_equal "David", metadata["name"]
  end
end
