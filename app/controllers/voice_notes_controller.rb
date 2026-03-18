class VoiceNotesController < ApplicationController
  def create
    room = Current.user.rooms.find(params[:voice_note][:room_id])
    @voice_note = Current.user.voice_notes.new(room: room)
    @voice_note.audio.attach(params[:voice_note][:audio])

    if @voice_note.save
      head :created
    else
      head :unprocessable_entity
    end
  end

  def show
    @voice_note = VoiceNote.find(params[:id])
    redirect_to rails_blob_path(@voice_note.audio, disposition: "inline")
  end
end
