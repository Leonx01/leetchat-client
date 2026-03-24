<script setup lang="ts">
import { computed } from 'vue'
import { useSignalChannel } from '@/store/modules/signalChannel.ts'

const signal = useSignalChannel()
const router = useRouter()

const popup = computed(() => signal.incomingMessagePopup)
const visible = computed(() => Boolean(popup.value))

function openMessage() {
  const uid = popup.value?.senderUid
  signal.clearIncomingMessagePopup()
  router.push({
    path: '/MailBox/index',
    ...(uid != null ? { query: { uid: String(uid) } } : {}),
  })
}

function closePopup() {
  signal.clearIncomingMessagePopup()
}
</script>

<template>
  <Transition name="msg-fade">
    <div v-if="visible" class="incoming-message" @click="openMessage">
      <div class="head">
        <span class="title">新消息</span>
        <button type="button" class="close-btn" @click.stop="closePopup">×</button>
      </div>
      <div class="sender">{{ popup?.senderName }}</div>
      <div class="preview">{{ popup?.preview }}</div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
.incoming-message {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 2999;
  width: 300px;
  border-radius: 12px;
  padding: 14px;
  color: #fff;
  cursor: pointer;
  background: linear-gradient(145deg, #3a3d42, #27292d);
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.35);
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title {
  font-size: 13px;
  opacity: 0.9;
}

.close-btn {
  border: 0;
  color: #fff;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  cursor: pointer;
  line-height: 1;
  background: rgba(255, 255, 255, 0.18);
}

.sender {
  margin-top: 8px;
  font-size: 16px;
  font-weight: 700;
}

.preview {
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.4;
  opacity: 0.8;
  word-break: break-word;
}

.msg-fade-enter-active,
.msg-fade-leave-active {
  transition: all 0.2s ease;
}

.msg-fade-enter-from,
.msg-fade-leave-to {
  transform: translateY(14px);
  opacity: 0;
}
</style>
