class VoiceNote < ApplicationRecord
  belongs_to :user
  belongs_to :room
  has_one_attached :audio

  validates :audio, presence: true

  scope :ordered, -> { order(created_at: :asc) }

  after_create_commit :broadcast_to_room

  private
    def broadcast_to_room
      broadcast_append_to [ room, :messages ],
        target: "messages",
        partial: "voice_notes/voice_note",
        locals: { voice_note: self }
    end
end
