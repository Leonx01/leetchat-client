<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useSignalChannel } from '@/store/modules/signalChannel.ts'

const signal = useSignalChannel()
const nowTs = ref(Date.now())
let timer: ReturnType<typeof setInterval> | null = null

const visible = computed(() => Boolean(signal.incomingCall))
const caller = computed(() => signal.incomingCall?.sourceName || '')
const remainSec = computed(() => {
  if (!signal.incomingCallExpiresAt) {
    return 0
  }
  return Math.max(0, Math.ceil((signal.incomingCallExpiresAt - nowTs.value) / 1000))
})

async function accept() {
  try {
    await signal.acceptIncomingCall()
  }
  catch (error) {
    ElMessage.error((error as Error)?.message || '接通失败')
  }
}

function decline() {
  signal.declineIncomingCall('对方已挂断')
}

onMounted(() => {
  timer = setInterval(() => {
    nowTs.value = Date.now()
  }, 500)
})

onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})
</script>

<template>
  <Transition name="call-fade">
    <div v-if="visible" class="incoming-call">
      <div class="title">视频通话请求</div>
      <div class="caller">{{ caller }}</div>
      <div class="timer">{{ remainSec }} 秒后自动关闭</div>
      <div class="actions">
        <button type="button" class="btn accept" @click="accept">接听</button>
        <button type="button" class="btn decline" @click="decline">拒绝</button>
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
.incoming-call {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 3000;
  width: 280px;
  border-radius: 12px;
  padding: 14px;
  color: #fff;
  background: linear-gradient(145deg, #2f3136, #1f2023);
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.35);
}

.title {
  font-size: 13px;
  opacity: 0.85;
}

.caller {
  margin-top: 6px;
  font-size: 18px;
  font-weight: 700;
}

.timer {
  margin-top: 6px;
  font-size: 12px;
  opacity: 0.75;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}

.btn {
  flex: 1;
  border: 0;
  border-radius: 8px;
  padding: 9px 10px;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

.accept {
  background: #67c23a;
}

.decline {
  background: #f56c6c;
}

.call-fade-enter-active,
.call-fade-leave-active {
  transition: all 0.2s ease;
}

.call-fade-enter-from,
.call-fade-leave-to {
  transform: translateY(14px);
  opacity: 0;
}
</style>
