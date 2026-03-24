<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useSignalChannel } from '@/store/modules/signalChannel.ts'
import useUserStore from '@/store/modules/user.ts'

const props = defineProps<{
  uid: number | string
}>()

const signalingChannel = useSignalChannel()
const userStore = useUserStore()

const localStreamRef = ref<HTMLVideoElement | null>(null)
const remoteStreamRef = ref<HTMLVideoElement | null>(null)
const cameraEnabled = ref(false)
const micEnabled = ref(true)
const remoteVideoEnabled = ref(false)
const closing = ref(false)
const remoteTrackProbeId = ref<ReturnType<typeof setInterval> | null>(null)
const localPrimary = ref(false)

const normalizedUid = computed(() => String(props.uid ?? '').trim())
const remoteConnected = computed(() => Boolean(signalingChannel.remoteStream))
const localStream = computed(() => signalingChannel.localStream)
const callStatus = computed(() => signalingChannel.callStatus)
const localAvatar = computed(() => userStore.avatar || '')

const callHint = computed(() => {
  switch (callStatus.value) {
    case 'inviting':
      return '呼叫中...'
    case 'ringing':
      return '来电响铃中...'
    case 'connecting':
      return '连接中...'
    case 'connected':
      return '语音/视频通话中'
    case 'failed':
      return signalingChannel.callError || '通话失败'
    case 'ended':
      return signalingChannel.callError || '通话结束'
    default:
      return '正在准备媒体设备...'
  }
})

const callStatusLabel = computed(() => {
  switch (callStatus.value) {
    case 'inviting':
      return '呼叫中'
    case 'ringing':
      return '响铃'
    case 'connecting':
      return '连接中'
    case 'connected':
      return '通话中'
    case 'failed':
      return '失败'
    case 'ended':
      return '已结束'
    default:
      return '准备中'
  }
})

function setVideoStream(el: HTMLVideoElement | null, stream: MediaStream | null) {
  if (!el) {
    return
  }
  if (!stream) {
    el.srcObject = null
    return
  }
  if (el.srcObject !== stream) {
    el.srcObject = stream
  }
}

function syncLocalTrackStatus() {
  const stream = localStream.value
  if (!stream) {
    cameraEnabled.value = false
    micEnabled.value = false
    return
  }

  const videoTrack = stream.getVideoTracks()[0]
  const audioTrack = stream.getAudioTracks()[0]
  cameraEnabled.value = Boolean(videoTrack?.enabled)
  micEnabled.value = Boolean(audioTrack?.enabled)
}

function syncRemoteTrackStatus() {
  const stream = signalingChannel.remoteStream
  if (!stream) {
    remoteVideoEnabled.value = false
    return
  }
  const remoteVideoTrack = stream.getVideoTracks()[0]
  remoteVideoEnabled.value = Boolean(remoteVideoTrack?.enabled)
}

async function toggleCamera() {
  const stream = localStream.value
  if (!stream) {
    ElMessage.warning('Local audio stream is not ready')
    return
  }

  const videoTrack = stream.getVideoTracks()[0]
  if (!videoTrack) {
    try {
      await signalingChannel.enableLocalVideo()
      setVideoStream(localStreamRef.value, signalingChannel.localStream)
      syncLocalTrackStatus()
      return
    }
    catch (error) {
      const msg = (error as Error)?.message || 'Failed to enable camera'
      ElMessage.warning(msg)
      return
    }
  }

  videoTrack.enabled = !videoTrack.enabled
  cameraEnabled.value = videoTrack.enabled
}

function toggleMic() {
  const stream = localStream.value
  if (!stream) {
    ElMessage.warning('Local audio stream is not ready')
    return
  }

  const audioTrack = stream.getAudioTracks()[0]
  if (!audioTrack) {
    ElMessage.warning('Microphone track not found')
    return
  }

  audioTrack.enabled = !audioTrack.enabled
  micEnabled.value = audioTrack.enabled
}

function handleClose() {
  if (closing.value) {
    return
  }
  closing.value = true
  signalingChannel.closeRTC()
}

function handleSwapWindows() {
  localPrimary.value = !localPrimary.value
}

function resolveInitError(error: unknown): string {
  const err = error as Partial<DOMException> & { message?: string }
  if (!err) {
    return 'Call initialization failed'
  }

  if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
    return 'Camera or microphone permission denied'
  }
  if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
    return 'Camera or microphone device not found'
  }
  if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
    return 'Camera or microphone is being used by another app'
  }
  if (err.name === 'OverconstrainedError') {
    return 'Media device does not satisfy requested constraints'
  }
  if (typeof err.message === 'string' && err.message.includes('Signal channel not connected')) {
    return 'Signaling channel is not connected'
  }
  if (typeof err.message === 'string' && err.message.includes('Invalid call target')) {
    return 'Invalid call target'
  }
  return err.message || 'Failed to initialize media devices'
}

onMounted(async () => {
  if (!normalizedUid.value) {
    ElMessage.error('Invalid call target')
    return
  }

  try {
    await signalingChannel.initRTC(normalizedUid.value)
    setVideoStream(localStreamRef.value, signalingChannel.localStream)
    setVideoStream(remoteStreamRef.value, signalingChannel.remoteStream)
    syncLocalTrackStatus()
    syncRemoteTrackStatus()
    remoteTrackProbeId.value = setInterval(syncRemoteTrackStatus, 800)
  }
  catch (error) {
    const message = resolveInitError(error)
    ElMessage.error(message)
    signalingChannel.setCallState('failed', message)
    if (message === 'Signaling channel is not connected') {
      signalingChannel.router?.push({ path: '/MailBox/index' })
    }
  }
})

onBeforeUnmount(() => {
  if (remoteTrackProbeId.value) {
    clearInterval(remoteTrackProbeId.value)
    remoteTrackProbeId.value = null
  }
  if (closing.value) {
    return
  }
  signalingChannel.leaveRTC()
})

watch(
  () => signalingChannel.localStream,
  (stream) => {
    setVideoStream(localStreamRef.value, stream)
    syncLocalTrackStatus()
  },
  { immediate: true },
)

watch(
  () => signalingChannel.remoteStream,
  (stream) => {
    setVideoStream(remoteStreamRef.value, stream)
    syncRemoteTrackStatus()
  },
  { immediate: true },
)
</script>

<template>
  <div class="discord-room">
    <div class="room-header">
      <div class="header-left">
        <div class="presence-dot" :class="`status-${callStatus}`" />
        <div class="header-meta">
          <p class="title">与 {{ normalizedUid || '用户' }} 的通话</p>
          <p class="subtitle">{{ callHint }}</p>
        </div>
      </div>
      <div class="header-right">
        <span class="badge" :class="`status-${callStatus}`">{{ callStatusLabel }}</span>
      </div>
    </div>

    <div class="video-stage">
      <div
        class="remote-wrapper"
        :class="{ 'is-main': !localPrimary, 'is-pip': localPrimary }"
        @click="localPrimary && handleSwapWindows()"
      >
        <video
          id="user-2"
          ref="remoteStreamRef"
          class="video-player"
          autoplay
          playsinline
          :class="{ hidden: !remoteVideoEnabled }"
        />
        <div v-if="!remoteVideoEnabled" class="avatar-placeholder remote">
          <span>{{ normalizedUid || 'USER' }}</span>
        </div>
        <div v-if="remoteConnected" class="remote-tag">
          {{ localPrimary ? '点击切换到主画面' : '对方画面' }}
        </div>
      </div>

      <div
        class="local-pip"
        :class="{ collapsed: !remoteConnected, 'is-main': localPrimary, 'is-pip': !localPrimary }"
        @click="!localPrimary && handleSwapWindows()"
      >
        <video
          id="user-1"
          ref="localStreamRef"
          class="video-player"
          autoplay
          muted
          playsinline
          :class="{ hidden: !cameraEnabled }"
        />
        <div v-if="!cameraEnabled" class="avatar-placeholder">
          <img v-if="localAvatar" :src="localAvatar" alt="local-avatar">
          <span v-else>ME</span>
        </div>
        <div class="local-tag">{{ localPrimary ? '你（主画面）' : '你（点击放大）' }}</div>
      </div>
    </div>

    <div class="control-dock">
      <button
        class="control-btn"
        :class="{ disabled: !cameraEnabled }"
        type="button"
        @click="toggleCamera"
      >
        <img src="/icons/camera.png" alt="camera">
        <span>摄像头</span>
      </button>

      <button
        class="control-btn"
        :class="{ disabled: !micEnabled }"
        type="button"
        @click="toggleMic"
      >
        <img src="/icons/mic.png" alt="microphone">
        <span>麦克风</span>
      </button>

      <button class="control-btn danger" type="button" @click="handleClose">
        <img src="/icons/phone.png" alt="leave">
        <span>挂断</span>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.discord-room {
  position: relative;
  min-height: calc(100vh - 60px);
  padding: 14px;
  background: #2f3136;
}

.room-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #202225;
  border: 1px solid #3a3d44;
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.presence-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #747f8d;
  box-shadow: 0 0 0 5px rgba(116, 127, 141, 0.15);
}

.presence-dot.status-connected {
  background: #3ba55d;
  box-shadow: 0 0 0 5px rgba(59, 165, 93, 0.2);
}

.presence-dot.status-inviting,
.presence-dot.status-ringing,
.presence-dot.status-connecting {
  background: #faa61a;
  box-shadow: 0 0 0 5px rgba(250, 166, 26, 0.2);
}

.presence-dot.status-failed,
.presence-dot.status-ended {
  background: #ed4245;
  box-shadow: 0 0 0 5px rgba(237, 66, 69, 0.2);
}

.header-meta .title {
  color: #f2f3f5;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.2;
}

.header-meta .subtitle {
  color: #b9bbbe;
  font-size: 12px;
  margin-top: 4px;
}

.badge {
  font-size: 11px;
  color: #fff;
  background: #4f545c;
  border-radius: 999px;
  padding: 6px 10px;
}

.badge.status-connected {
  background: #2d7d46;
}

.badge.status-inviting,
.badge.status-ringing,
.badge.status-connecting {
  background: #b57913;
}

.badge.status-failed,
.badge.status-ended {
  background: #a13235;
}

.video-stage {
  position: relative;
  height: calc(100vh - 170px);
  min-height: 420px;
  border-radius: 10px;
  border: 1px solid #3a3d44;
  background: #202225;
  overflow: hidden;
}

.remote-wrapper {
  position: relative;
  overflow: hidden;
}

.remote-wrapper.is-main {
  width: 100%;
  height: 100%;
}

.remote-wrapper.is-pip {
  position: absolute;
  right: 14px;
  bottom: 94px;
  width: 280px;
  height: 168px;
  border-radius: 10px;
  z-index: 6;
  border: 1px solid #5865f2;
  background: #111318;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.38);
  cursor: pointer;
}

.video-player {
  background-color: #0f1115;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-player.hidden {
  opacity: 0;
  pointer-events: none;
}

.avatar-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1e1f22;
  color: #dcddde;
  font-size: 22px;
  font-weight: 700;
}

.avatar-placeholder img {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 0.18);
}

.remote-tag,
.local-tag {
  position: absolute;
  z-index: 4;
  color: #fff;
  font-size: 12px;
  border-radius: 999px;
  padding: 4px 10px;
  background: rgba(32, 34, 37, 0.88);
}

.remote-tag {
  left: 14px;
  top: 14px;
}

.local-tag {
  bottom: 10px;
  left: 10px;
}

.local-pip {
  position: relative;
  overflow: hidden;
  transition: all 0.2s ease;
}

.local-pip.is-main {
  width: 100%;
  height: 100%;
}

.local-pip.is-pip {
  position: absolute;
  right: 14px;
  bottom: 94px;
  width: 280px;
  height: 168px;
  border-radius: 10px;
  z-index: 6;
  border: 1px solid #5865f2;
  background: #111318;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.38);
  cursor: pointer;
}

.local-pip.collapsed {
  bottom: 94px;
  right: 14px;
  width: 220px;
  height: 132px;
}

.control-dock {
  position: absolute;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
  z-index: 20;
  background: rgba(32, 34, 37, 0.94);
  border: 1px solid #3a3d44;
  border-radius: 14px;
  padding: 8px 10px;
}

.control-btn {
  background: #3f4248;
  border: 0;
  min-width: 78px;
  height: 62px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  gap: 6px;
  color: #fff;
  transition: transform 0.15s ease, background 0.15s ease;
}

.control-btn:hover {
  transform: translateY(-1px);
  background: #4a4f57;
}

.control-btn.disabled {
  background: #5a2325;
}

.control-btn.danger {
  background: #d83c3e;
}

.control-btn.danger:hover {
  background: #be3436;
}

.control-btn img {
  width: 22px;
  height: 22px;
}

.control-btn span {
  font-size: 12px;
  color: #dcddde;
}

@media screen and (max-width: 600px) {
  .discord-room {
    min-height: calc(100vh - 52px);
    padding: 8px;
  }

  .video-stage {
    height: calc(100vh - 142px);
    min-height: 340px;
  }

  .local-pip {
    width: 170px;
    height: 108px;
    right: 8px;
    bottom: 84px;
  }

  .remote-wrapper.is-pip {
    width: 170px;
    height: 108px;
    right: 8px;
    bottom: 84px;
  }

  .local-pip.collapsed {
    width: 140px;
    height: 88px;
    bottom: 84px;
    right: 8px;
  }

  .control-dock {
    bottom: 8px;
    gap: 8px;
    padding: 6px;
  }

  .control-btn {
    min-width: 70px;
    height: 60px;
  }

  .control-btn span {
    font-size: 11px;
  }

  .avatar-placeholder img {
    width: 64px;
    height: 64px;
  }
}
</style>
