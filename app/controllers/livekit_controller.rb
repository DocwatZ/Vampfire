class LivekitController < ApplicationController
  def token
    room = Current.user.rooms.find(params[:room_id])
    room_name = "vampfire-room-#{room.id}"

    token = LivekitToken.generate(user: Current.user, room_name: room_name)

    render json: {
      token: token,
      url: Rails.configuration.x.livekit.url,
      room: room_name
    }
  end
end
