import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["panel", "videoGrid", "joinBtn", "leaveBtn", "controls",
                     "micBtn", "camBtn", "screenBtn", "participantCount"]
  static values = { roomId: Number }

  connect() {
    this.room = null
    this.localParticipant = null
    this.micEnabled = true
    this.camEnabled = false
    this.screenEnabled = false
  }

  disconnect() {
    this.leaveCall()
  }

  async joinCall() {
    try {
      const { Room, RoomEvent, Track } = await import("livekit-client")

      // Fetch token from server
      const response = await fetch(`/livekit/token?room_id=${this.roomIdValue}`, {
        headers: {
          "Accept": "application/json",
          "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]')?.content
        }
      })

      if (!response.ok) throw new Error("Failed to get call token")
      const data = await response.json()

      // Create and connect to room
      this.room = new Room({
        adaptiveStream: true,
        dynacast: true
      })

      this.setupRoomEvents(RoomEvent, Track)

      await this.room.connect(data.url, data.token)
      this.localParticipant = this.room.localParticipant

      // Enable microphone by default
      await this.localParticipant.setMicrophoneEnabled(true)
      this.micEnabled = true

      // Show call UI
      this.showCallUI()
      this.updateParticipantCount()

    } catch (error) {
      console.error("Failed to join call:", error)
      alert("Failed to join call. Please check your LiveKit configuration.")
    }
  }

  async leaveCall() {
    if (this.room) {
      await this.room.disconnect()
      this.room = null
      this.localParticipant = null
    }
    this.hideCallUI()
    this.clearVideoGrid()
  }

  async toggleMic() {
    if (!this.localParticipant) return
    this.micEnabled = !this.micEnabled
    await this.localParticipant.setMicrophoneEnabled(this.micEnabled)
    this.updateMicButton()
  }

  async toggleCam() {
    if (!this.localParticipant) return
    this.camEnabled = !this.camEnabled
    await this.localParticipant.setCameraEnabled(this.camEnabled)
    this.updateCamButton()
  }

  async toggleScreen() {
    if (!this.localParticipant) return
    this.screenEnabled = !this.screenEnabled
    try {
      await this.localParticipant.setScreenShareEnabled(this.screenEnabled)
      this.updateScreenButton()
    } catch (e) {
      this.screenEnabled = false
      this.updateScreenButton()
    }
  }

  // Private methods

  setupRoomEvents(RoomEvent, Track) {
    this.room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      this.attachTrack(track, participant)
    })

    this.room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
      this.detachTrack(track, participant)
    })

    this.room.on(RoomEvent.LocalTrackPublished, (publication) => {
      if (publication.track) {
        this.attachTrack(publication.track, this.room.localParticipant)
      }
    })

    this.room.on(RoomEvent.LocalTrackUnpublished, (publication) => {
      if (publication.track) {
        this.detachTrack(publication.track, this.room.localParticipant)
      }
    })

    this.room.on(RoomEvent.ParticipantConnected, () => {
      this.updateParticipantCount()
    })

    this.room.on(RoomEvent.ParticipantDisconnected, (participant) => {
      this.removeParticipantTile(participant.identity)
      this.updateParticipantCount()
    })

    this.room.on(RoomEvent.Disconnected, () => {
      this.hideCallUI()
      this.clearVideoGrid()
    })
  }

  attachTrack(track, participant) {
    const Track = { Kind: { Video: "video", Audio: "audio" } }
    if (track.kind === "video") {
      const tile = this.getOrCreateParticipantTile(participant.identity, participant.name || participant.identity)
      const videoContainer = tile.querySelector(".call-tile__video")
      const existingElement = videoContainer.querySelector(`[data-track-sid="${track.sid}"]`)
      if (!existingElement) {
        const element = track.attach()
        element.dataset.trackSid = track.sid
        element.classList.add("call-tile__media")
        videoContainer.appendChild(element)
        tile.classList.add("call-tile--has-video")
      }
    } else if (track.kind === "audio") {
      // Audio tracks need to be attached to play
      if (participant.identity !== this.room?.localParticipant?.identity) {
        const element = track.attach()
        element.dataset.trackSid = track.sid
        element.dataset.participantId = participant.identity
        element.style.display = "none"
        document.body.appendChild(element)
      }
    }
  }

  detachTrack(track, participant) {
    if (track.kind === "video") {
      const elements = this.videoGridTarget.querySelectorAll(`[data-track-sid="${track.sid}"]`)
      elements.forEach(el => el.remove())
      const tile = this.videoGridTarget.querySelector(`[data-participant-id="${participant.identity}"]`)
      if (tile && !tile.querySelector(".call-tile__video video, .call-tile__video canvas")) {
        tile.classList.remove("call-tile--has-video")
      }
    } else if (track.kind === "audio") {
      const elements = document.querySelectorAll(`[data-track-sid="${track.sid}"]`)
      elements.forEach(el => {
        track.detach(el)
        el.remove()
      })
    }
  }

  getOrCreateParticipantTile(identity, name) {
    let tile = this.videoGridTarget.querySelector(`[data-participant-id="${identity}"]`)
    if (!tile) {
      tile = document.createElement("div")
      tile.classList.add("call-tile")
      tile.dataset.participantId = identity
      const isLocal = identity === this.room?.localParticipant?.identity
      if (isLocal) tile.classList.add("call-tile--local")
      tile.innerHTML = `
        <div class="call-tile__video"></div>
        <div class="call-tile__name">${this.escapeHtml(name)}</div>
      `
      this.videoGridTarget.appendChild(tile)
    }
    return tile
  }

  removeParticipantTile(identity) {
    const tile = this.videoGridTarget.querySelector(`[data-participant-id="${identity}"]`)
    // Also remove any audio elements for this participant
    const audioElements = document.querySelectorAll(`audio[data-participant-id="${identity}"]`)
    audioElements.forEach(el => el.remove())
    if (tile) tile.remove()
  }

  clearVideoGrid() {
    if (this.hasVideoGridTarget) {
      this.videoGridTarget.innerHTML = ""
    }
    // Remove all remote audio elements
    document.querySelectorAll("audio[data-participant-id]").forEach(el => el.remove())
  }

  showCallUI() {
    if (this.hasPanelTarget) this.panelTarget.classList.add("call-panel--active")
    if (this.hasJoinBtnTarget) this.joinBtnTarget.style.display = "none"
    if (this.hasLeaveBtnTarget) this.leaveBtnTarget.style.display = ""
    if (this.hasControlsTarget) this.controlsTarget.style.display = ""
    this.updateMicButton()
    this.updateCamButton()
    this.updateScreenButton()
  }

  hideCallUI() {
    if (this.hasPanelTarget) this.panelTarget.classList.remove("call-panel--active")
    if (this.hasJoinBtnTarget) this.joinBtnTarget.style.display = ""
    if (this.hasLeaveBtnTarget) this.leaveBtnTarget.style.display = "none"
    if (this.hasControlsTarget) this.controlsTarget.style.display = "none"
  }

  updateMicButton() {
    if (this.hasMicBtnTarget) {
      this.micBtnTarget.classList.toggle("call-control--muted", !this.micEnabled)
      this.micBtnTarget.title = this.micEnabled ? "Mute microphone" : "Unmute microphone"
      this.micBtnTarget.querySelector(".call-control__label").textContent =
        this.micEnabled ? "Mute" : "Unmute"
    }
  }

  updateCamButton() {
    if (this.hasCamBtnTarget) {
      this.camBtnTarget.classList.toggle("call-control--active", this.camEnabled)
      this.camBtnTarget.title = this.camEnabled ? "Turn off camera" : "Turn on camera"
      this.camBtnTarget.querySelector(".call-control__label").textContent =
        this.camEnabled ? "Cam Off" : "Cam On"
    }
  }

  updateScreenButton() {
    if (this.hasScreenBtnTarget) {
      this.screenBtnTarget.classList.toggle("call-control--active", this.screenEnabled)
      this.screenBtnTarget.title = this.screenEnabled ? "Stop sharing" : "Share screen"
      this.screenBtnTarget.querySelector(".call-control__label").textContent =
        this.screenEnabled ? "Stop" : "Share"
    }
  }

  updateParticipantCount() {
    if (this.hasParticipantCountTarget && this.room) {
      const count = this.room.numParticipants + 1 // includes local
      this.participantCountTarget.textContent = count
    }
  }

  escapeHtml(text) {
    const div = document.createElement("div")
    div.textContent = text
    return div.innerHTML
  }
}
