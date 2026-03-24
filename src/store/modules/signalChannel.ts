import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import WebSocketAPI from '../../socket'
import useUserStore from '@/store/modules/user.ts'

const config = {
  iceServers: [{
    urls: 'stun:stun.l.google.com:19302',
  }],
}

const audioOnlyConstraints: MediaStreamConstraints = {
  audio: true,
  video: false,
}

const videoOnlyConstraints: MediaStreamConstraints = {
  video: {
    width: { min: 640, ideal: 1280, max: 1920 },
    height: { min: 480, ideal: 720, max: 1080 },
  },
  audio: false,
}

const offerOptions = {
  offerToReceiveVideo: true,
  offerToReceiveAudio: true,
}

const INVITE_TIMEOUT_MS = 30000

type CallStatus = 'idle' | 'inviting' | 'ringing' | 'connecting' | 'connected' | 'ended' | 'failed'

type RejectReason = 'rejected' | 'hangup' | 'timeout' | 'busy' | 'offline'

interface IncomingCall {
  offer: RTCSessionDescriptionInit
  sourceName: string
  targetName: string
}

interface IncomingMessagePopup {
  senderName: string
  senderUid: string | number | null
  preview: string
  receivedAt: number
}

export const useSignalChannel = defineStore('webRTC', {
  state: () => ({
    socket: null as WebSocketAPI | null,
    pc: null as RTCPeerConnection | null,
    localStream: null as MediaStream | null,
    remoteStream: null as MediaStream | null,
    source: null as string | null,
    target: null as string | null,
    router: null as any,
    pendingIceCandidates: [] as RTCIceCandidateInit[],
    callStatus: 'idle' as CallStatus,
    callError: null as string | null,
    inviteTimeoutId: null as ReturnType<typeof setTimeout> | null,
    incomingCall: null as IncomingCall | null,
    incomingCallTimeoutId: null as ReturnType<typeof setTimeout> | null,
    incomingCallExpiresAt: null as number | null,
    pendingOfferSync: false,
    incomingMessagePopup: null as IncomingMessagePopup | null,
    incomingMessageTimeoutId: null as ReturnType<typeof setTimeout> | null,
  }),

  actions: {
    setCallState(status: CallStatus, error: string | null = null) {
      this.callStatus = status
      this.callError = error
    },

    clearInviteTimeout() {
      if (this.inviteTimeoutId) {
        clearTimeout(this.inviteTimeoutId)
      }
      this.inviteTimeoutId = null
    },

    clearIncomingCall() {
      this.clearIncomingCallTimeout()
      this.incomingCall = null
    },

    clearIncomingCallTimeout() {
      if (this.incomingCallTimeoutId) {
        clearTimeout(this.incomingCallTimeoutId)
      }
      this.incomingCallTimeoutId = null
      this.incomingCallExpiresAt = null
    },

    clearIncomingMessagePopup() {
      if (this.incomingMessageTimeoutId) {
        clearTimeout(this.incomingMessageTimeoutId)
      }
      this.incomingMessageTimeoutId = null
      this.incomingMessagePopup = null
    },

    formatMessagePreview(fromMessage: any) {
      if (!fromMessage) {
        return '你收到一条新消息'
      }
      switch (fromMessage.type) {
        case 'text':
          return (fromMessage.content || '').slice(0, 80) || '你收到一条新消息'
        case 'image':
          return '[图片]'
        case 'video':
          return '[视频]'
        case 'audio':
          return '[音频]'
        case 'file':
          return `[文件] ${fromMessage.name || ''}`.trim()
        default:
          return '[新消息]'
      }
    },

    onSocketMessage(data: any) {
      if (!data || !data.fromMessage || !data.from) {
        return
      }
      const currentUid = useUserStore().uid
      const senderUid = data.from.uid ?? data.from.id ?? null
      if (senderUid != null && String(senderUid) === String(currentUid)) {
        return
      }
      this.incomingMessagePopup = {
        senderName: data.from.uname || data.from.name || '新消息',
        senderUid,
        preview: this.formatMessagePreview(data.fromMessage),
        receivedAt: Date.now(),
      }
      if (this.incomingMessageTimeoutId) {
        clearTimeout(this.incomingMessageTimeoutId)
      }
      this.incomingMessageTimeoutId = setTimeout(() => {
        this.clearIncomingMessagePopup()
      }, 6000)
    },

    startIncomingCallTimeout() {
      this.clearIncomingCallTimeout()
      this.incomingCallExpiresAt = Date.now() + INVITE_TIMEOUT_MS
        this.incomingCallTimeoutId = setTimeout(() => {
          if (!this.incomingCall) {
            return
          }
          const { sourceName, targetName } = this.incomingCall
          this.socket?.send({
            type: 'reject',
            reason: 'timeout',
            description: '对方暂时无法接听',
            sourceName: targetName,
            targetName: sourceName,
          })
        this.clearIncomingCall()
        this.setCallState('idle')
      }, INVITE_TIMEOUT_MS)
    },

    startInviteTimeout() {
      this.clearInviteTimeout()
      this.inviteTimeoutId = setTimeout(() => {
        if (this.callStatus !== 'inviting' && this.callStatus !== 'connecting') {
          return
        }

        this.socket?.send({
          type: 'reject',
          reason: 'timeout',
          description: '对方超时未接听',
          sourceName: this.source,
          targetName: this.target,
        })

        this.setCallState('failed', '对方未接听')
        this.cleanupRTCState()
        this.router?.push({
          path: '/MailBox/index',
        })
      }, INVITE_TIMEOUT_MS)
    },

    async sendOffer() {
      if (!this.pc || !this.socket) {
        return
      }
      const offer = await this.pc.createOffer(offerOptions)
      await this.pc.setLocalDescription(offer)
      this.socket.send({
        type: 'offer',
        offer,
        sourceName: this.source,
        targetName: this.target,
      })
    },

    sendRejectSignal(reason: RejectReason, description: string, sourceName?: string | null, targetName?: string | null) {
      const payload = {
        type: 'reject',
        reason,
        description,
        sourceName: sourceName ?? this.source,
        targetName: targetName ?? this.target,
      }
      this.socket?.send(payload)
      setTimeout(() => {
        this.socket?.send(payload)
      }, 300)
    },

    endCallFromPeer(description = '通话已结束') {
      if (!['inviting', 'ringing', 'connecting', 'connected'].includes(this.callStatus)) {
        return
      }
      this.setCallState('ended', description)
      ElMessage.warning(description)
      this.cleanupRTCState()
      this.router?.push({
        path: '/MailBox/index',
      })
    },

    bindPeerConnectionEvents() {
      if (!this.pc) {
        return
      }

      this.pc.onicecandidate = (event) => {
        if (!event.candidate || !this.socket) {
          return
        }

        this.socket.send({
          type: 'ice',
          iceCandidate: event.candidate,
          sourceName: this.source,
          targetName: this.target,
        })
      }

      this.pc.ontrack = (event: RTCTrackEvent) => {
        const incomingStream = event.streams[0]
        if (incomingStream) {
          this.remoteStream = incomingStream
        }
        else {
          if (!this.remoteStream) {
            this.remoteStream = new MediaStream()
          }
          const hasTrack = this.remoteStream.getTracks().some(track => track.id === event.track.id)
          if (!hasTrack) {
            this.remoteStream.addTrack(event.track)
          }
        }
        event.track.onended = () => {
          this.endCallFromPeer('对方已结束通话')
        }
        if (this.remoteStream) {
          this.clearInviteTimeout()
          this.setCallState('connected')
        }
      }

      this.pc.onconnectionstatechange = () => {
        const state = this.pc?.connectionState
        if (!state) {
          return
        }
        if (!['failed', 'closed', 'disconnected'].includes(state)) {
          return
        }
        this.endCallFromPeer('对方连接已断开')
      }

      this.pc.oniceconnectionstatechange = () => {
        const state = this.pc?.iceConnectionState
        if (!state) {
          return
        }
        if (!['failed', 'disconnected', 'closed'].includes(state)) {
          return
        }
        this.endCallFromPeer('对方连接已断开')
      }

      this.pc.onsignalingstatechange = () => {
        if (!this.pc || !this.pendingOfferSync || this.pc.signalingState !== 'stable') {
          return
        }
        this.trySyncOffer()
      }
    },

    connect(routerInstance?: any) {
      if (!this.router && routerInstance) {
        this.router = routerInstance
      }

      const currentUid = useUserStore().uid
      const socketStatus = this.socket?.getStatus()
      if (this.socket && (socketStatus === WebSocket.CONNECTING || socketStatus === WebSocket.OPEN)) {
        this.socket.setMessageHandler(data => this.onSocketMessage(data))
        this.socket.setOnReceiveAnswer(data => this.onReceiveAnswer(data))
        this.socket.setOnReceiveOffer(data => this.onReceiveOffer(data))
        this.socket.setOnReceiveICE(data => this.onReceiveIce(data))
        this.socket.setOnReject(data => this.onReceiveReject(data))
        this.source = currentUid
        return
      }

      this.socket = new WebSocketAPI('/online-status', data => this.onSocketMessage(data), true, useUserStore().token)

      this.socket.setMessageHandler(data => this.onSocketMessage(data))
      this.socket.setOnReceiveAnswer(data => this.onReceiveAnswer(data))
      this.socket.setOnReceiveOffer(data => this.onReceiveOffer(data))
      this.socket.setOnReceiveICE(data => this.onReceiveIce(data))
      this.socket.setOnReject(data => this.onReceiveReject(data))
      this.source = currentUid
    },

    async initRTC(target: string): Promise<MediaStream | null> {
      if (!target) {
        throw new Error('无效的通话目标')
      }
      if (!this.socket) {
        throw new Error('信令通道未连接')
      }
      if (this.localStream) {
        return this.localStream
      }

      this.target = target
      this.pendingIceCandidates = []
      this.cleanupPeerOnly()
      this.pc = new RTCPeerConnection(config)
      this.setCallState('inviting')
      this.bindPeerConnectionEvents()
      // 预创建视频 transceiver，确保首轮协商就包含视频 m-line
      this.pc.addTransceiver('video', { direction: 'sendrecv' })

      const stream = await navigator.mediaDevices.getUserMedia(audioOnlyConstraints)
      this.localStream = stream
      stream.getTracks().forEach((track) => {
        this.pc?.addTrack(track, stream)
      })

      await this.sendOffer()
      this.startInviteTimeout()
      return this.localStream
    },

    async enableLocalVideo() {
      if (!this.pc || !this.localStream) {
        throw new Error('通话尚未初始化')
      }

      const currentTrack = this.localStream.getVideoTracks()[0]
      if (currentTrack) {
        currentTrack.enabled = true
        await this.trySyncOffer()
        return
      }

      const cameraStream = await navigator.mediaDevices.getUserMedia(videoOnlyConstraints)
      const videoTrack = cameraStream.getVideoTracks()[0]
      if (!videoTrack) {
        throw new Error('未找到摄像头视频轨道')
      }

      if (!this.localStream.getVideoTracks().some(track => track.id === videoTrack.id)) {
        this.localStream.addTrack(videoTrack)
      }

      const videoSender = this.pc.getSenders().find(sender => sender.track?.kind === 'video')
        || this.pc.getTransceivers().find(transceiver => transceiver.sender.track?.kind === 'video' || transceiver.receiver.track.kind === 'video')?.sender

      if (videoSender) {
        await videoSender.replaceTrack(videoTrack)
      }
      else {
        this.pc.addTrack(videoTrack, this.localStream)
        await this.trySyncOffer()
      }
    },

    async trySyncOffer() {
      if (!this.pc || !this.socket) {
        return
      }
      if (!['inviting', 'connecting', 'connected'].includes(this.callStatus)) {
        return
      }
      if (this.pc.signalingState !== 'stable') {
        this.pendingOfferSync = true
        return
      }
      this.pendingOfferSync = false
      await this.sendOffer()
    },

    async onReceiveOffer(data: any) {
      const { offer, sourceName, targetName } = data

      if (this.pc && this.target === sourceName && ['connecting', 'connected'].includes(this.callStatus)) {
        await this.pc.setRemoteDescription(new RTCSessionDescription(offer))
        await this.flushPendingIceCandidates()

        const answer = await this.pc.createAnswer()
        await this.pc.setLocalDescription(answer)
        this.socket?.send({
          type: 'answer',
          answer,
          sourceName: targetName,
          targetName: sourceName,
        })
        return
      }

      if (this.callStatus === 'ringing' && this.incomingCall
        && this.incomingCall.sourceName === sourceName
        && this.incomingCall.targetName === targetName) {
        this.incomingCall = {
          ...this.incomingCall,
          offer,
        }
        return
      }

      if (['inviting', 'ringing', 'connecting', 'connected'].includes(this.callStatus)) {
        this.socket?.send({
          type: 'reject',
          reason: 'busy',
          description: '用户正在其他通话中',
          sourceName: targetName,
          targetName: sourceName,
        })
        return
      }

      this.setCallState('ringing')
      this.incomingCall = { offer, sourceName, targetName }
      this.startIncomingCallTimeout()
    },

    async acceptIncomingCall() {
      if (!this.incomingCall) {
        return
      }
      const { offer, sourceName, targetName } = this.incomingCall
      this.clearIncomingCall()
      ElMessage({
        type: 'success',
        message: '已接听通话',
      })

      this.pendingIceCandidates = []
      this.cleanupPeerOnly()
      this.pc = new RTCPeerConnection(config)
      this.target = sourceName
      this.setCallState('connecting')
      this.bindPeerConnectionEvents()
      // 被叫侧提前声明接收视频，避免后续新增视频轨时协商不一致
      this.pc.addTransceiver('video', { direction: 'recvonly' })

      const stream = await navigator.mediaDevices.getUserMedia(audioOnlyConstraints)
      this.localStream = stream
      stream.getTracks().forEach((track) => {
        this.pc?.addTrack(track, stream)
      })

      await this.pc.setRemoteDescription(new RTCSessionDescription(offer))
      await this.flushPendingIceCandidates()

      const answer = await this.pc.createAnswer()
      await this.pc.setLocalDescription(answer)
      this.socket?.send({
        type: 'answer',
        answer,
        sourceName: targetName,
        targetName: sourceName,
      })

      this.router?.push({
        path: '/MailBox/chatroom',
        query: { uid: sourceName },
      })
    },

    declineIncomingCall(description = '对方暂时无法接听') {
      if (!this.incomingCall) {
        return
      }
      const { sourceName, targetName } = this.incomingCall
      this.socket?.send({
        type: 'reject',
        reason: 'rejected',
        description,
        sourceName: targetName,
        targetName: sourceName,
      })
      this.clearIncomingCall()
      this.setCallState('idle')
    },

    async onReceiveAnswer(data: any) {
      const { answer } = data
      if (!this.pc) {
        return
      }

      if (this.callStatus !== 'connected') {
        this.setCallState('connecting')
      }
      await this.pc.setRemoteDescription(new RTCSessionDescription(answer))
      await this.flushPendingIceCandidates()
      await this.trySyncOffer()
    },

    async onReceiveIce(data: any) {
      const { iceCandidate } = data
      if (!this.pc) {
        return
      }

      if (!this.pc.remoteDescription) {
        this.pendingIceCandidates.push(iceCandidate)
        return
      }

      await this.pc.addIceCandidate(new RTCIceCandidate(iceCandidate))
    },

    onReceiveReject(data: any) {
      const reason = (data?.reason ?? 'rejected') as RejectReason
      const description = data?.description ?? '通话已结束'

      if (this.incomingCall && data?.sourceName === this.incomingCall.sourceName) {
        this.clearIncomingCall()
        this.setCallState('idle')
        ElMessage.info(description)
        return
      }

      this.clearInviteTimeout()
      this.setCallState(reason === 'hangup' ? 'ended' : 'failed', description)
      ElMessage.warning(description)
      this.cleanupRTCState()
      this.router?.push({
        path: '/MailBox/index',
      })
    },

    closeRTC(reason: RejectReason = 'hangup') {
      const reasonMap: Record<RejectReason, string> = {
        rejected: '对方已拒绝你的通话',
        hangup: '通话已结束',
        timeout: '对方超时未接听',
        busy: '对方正在其他通话中',
        offline: '对方当前离线',
      }

      this.socket?.send({
        type: 'reject',
        reason,
        description: reasonMap[reason],
        sourceName: this.source,
        targetName: this.target,
      })

      this.clearInviteTimeout()
      this.setCallState('ended', reasonMap[reason])
      this.cleanupRTCState()
      this.router?.push({
        path: '/MailBox/index',
      })
    },

    leaveRTC() {
      if (this.target && ['inviting', 'ringing', 'connecting', 'connected'].includes(this.callStatus)) {
        this.socket?.send({
          type: 'reject',
          reason: 'hangup',
          description: '通话已结束',
          sourceName: this.source,
          targetName: this.target,
        })
      }
      this.cleanupRTCState()
    },

    async flushPendingIceCandidates() {
      if (!this.pc || !this.pc.remoteDescription || this.pendingIceCandidates.length === 0) {
        return
      }

      const queue = [...this.pendingIceCandidates]
      this.pendingIceCandidates = []
      for (const candidate of queue) {
        await this.pc.addIceCandidate(new RTCIceCandidate(candidate))
      }
    },

    cleanupPeerOnly() {
      if (this.pc) {
        this.pc.close()
      }
      this.pc = null
      this.remoteStream = null
    },

    cleanupRTCState() {
      this.clearInviteTimeout()
      this.clearIncomingCall()
      this.cleanupPeerOnly()
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop())
      }
      this.localStream = null
      this.pendingIceCandidates = []
      this.pendingOfferSync = false
      this.target = null
      this.callStatus = 'idle'
      this.callError = null
    },
  },
})
