require "test_helper"

class LivekitControllerTest < ActionDispatch::IntegrationTest
  setup do
    sign_in :david
  end

  test "token returns JWT for valid room" do
    room = rooms(:pets)
    get livekit_token_url, params: { room_id: room.id }

    assert_response :success
    json = JSON.parse(response.body)
    assert json["token"].present?
    assert json["url"].present?
    assert_equal "vampfire-room-#{room.id}", json["room"]
  end

  test "token requires authentication" do
    delete session_url
    get livekit_token_url, params: { room_id: rooms(:pets).id }
    assert_redirected_to new_session_url
  end

  test "token returns 404 for room user is not a member of" do
    sign_in :jz
    # jz is not a member of 'pets' room based on fixtures
    assert_raises(ActiveRecord::RecordNotFound) do
      get livekit_token_url, params: { room_id: rooms(:watercooler).id }
    end
  end

  test "generated token is a valid JWT" do
    room = rooms(:pets)
    get livekit_token_url, params: { room_id: room.id }

    json = JSON.parse(response.body)
    token = json["token"]

    # Decode without verification to check structure
    decoded = JWT.decode(token, nil, false)
    payload = decoded[0]

    assert_equal "devkey", payload["iss"]
    assert_equal users(:david).id.to_s, payload["sub"]
    assert_equal "David", payload["name"]
    assert payload["video"]["roomJoin"]
    assert_equal "vampfire-room-#{room.id}", payload["video"]["room"]
  end
end
