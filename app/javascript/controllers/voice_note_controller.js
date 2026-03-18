import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["recordBtn", "status", "preview", "player"]
  static values = { roomId: Number }

  connect() {
    this.mediaRecorder = null
    this.chunks = []
    this.recording = false
    this.stream = null
  }

  disconnect() {
    this.stopRecording()
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }
  }

  async toggleRecord() {
    if (this.recording) {
      this.stopRecording()
    } else {
      await this.startRecording()
    }
  }

  async startRecording() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      this.mediaRecorder = new MediaRecorder(this.stream, { mimeType: this.supportedMimeType() })
      this.chunks = []

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.chunks.push(e.data)
      }

      this.mediaRecorder.onstop = () => {
        this.uploadVoiceNote()
        this.stream.getTracks().forEach(track => track.stop())
        this.stream = null
      }

      this.mediaRecorder.start()
      this.recording = true
      this.updateUI()
    } catch (error) {
      console.error("Failed to start recording:", error)
      alert("Could not access microphone. Please check permissions.")
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop()
    }
    this.recording = false
    this.updateUI()
  }

  async uploadVoiceNote() {
    const blob = new Blob(this.chunks, { type: this.supportedMimeType() })
    if (blob.size === 0) return

    const formData = new FormData()
    const extension = this.supportedMimeType().includes("webm") ? "webm" : "mp4"
    formData.append("voice_note[audio]", blob, `voice-note.${extension}`)
    formData.append("voice_note[room_id]", this.roomIdValue)

    try {
      if (this.hasStatusTarget) {
        this.statusTarget.textContent = "Sending..."
      }

      const response = await fetch("/voice_notes", {
        method: "POST",
        headers: {
          "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]')?.content
        },
        body: formData
      })

      if (!response.ok) throw new Error("Upload failed")

      if (this.hasStatusTarget) {
        this.statusTarget.textContent = "Sent!"
        setTimeout(() => { this.statusTarget.textContent = "" }, 2000)
      }
    } catch (error) {
      console.error("Failed to upload voice note:", error)
      if (this.hasStatusTarget) {
        this.statusTarget.textContent = "Failed to send"
        setTimeout(() => { this.statusTarget.textContent = "" }, 3000)
      }
    }
  }

  updateUI() {
    if (this.hasRecordBtnTarget) {
      this.recordBtnTarget.classList.toggle("voice-note--recording", this.recording)
      this.recordBtnTarget.title = this.recording ? "Stop recording" : "Record voice note"
    }
    if (this.hasStatusTarget) {
      this.statusTarget.textContent = this.recording ? "Recording..." : ""
    }
  }

  supportedMimeType() {
    if (typeof MediaRecorder !== "undefined") {
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) return "audio/webm;codecs=opus"
      if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm"
      if (MediaRecorder.isTypeSupported("audio/mp4")) return "audio/mp4"
    }
    return "audio/webm"
  }
}
