require "test_helper"

class VoiceNoteTest < ActiveSupport::TestCase
  test "belongs to user and room" do
    voice_note = VoiceNote.new(user: users(:david), room: rooms(:pets))
    voice_note.audio.attach(
      io: File.open(file_fixture("moon.jpg")),
      filename: "test.webm",
      content_type: "audio/webm"
    )

    assert voice_note.valid?
    assert_equal users(:david), voice_note.user
    assert_equal rooms(:pets), voice_note.room
  end

  test "requires audio attachment" do
    voice_note = VoiceNote.new(user: users(:david), room: rooms(:pets))
    assert_not voice_note.valid?
    assert voice_note.errors[:audio].present?
  end
end
