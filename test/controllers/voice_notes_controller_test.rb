require "test_helper"

class VoiceNotesControllerTest < ActionDispatch::IntegrationTest
  setup do
    sign_in :david
  end

  test "create voice note with audio attachment" do
    room = rooms(:pets)
    audio_blob = fixture_file_upload("test_audio.webm", "audio/webm")

    assert_difference -> { VoiceNote.count }, 1 do
      post voice_notes_url, params: {
        voice_note: { room_id: room.id, audio: audio_blob }
      }
    end

    assert_response :created
  end

  test "create voice note requires authentication" do
    delete session_url
    post voice_notes_url, params: {
      voice_note: { room_id: rooms(:pets).id }
    }
    assert_redirected_to new_session_url
  end

  test "create voice note fails without audio" do
    room = rooms(:pets)

    assert_no_difference -> { VoiceNote.count } do
      post voice_notes_url, params: {
        voice_note: { room_id: room.id }
      }
    end

    assert_response :unprocessable_entity
  end
end
