<script lang="ts" setup>
// import {ElScroller} from "element-plus";
// import ElScroll from "element-plus"
import { useSignalChannel } from '@/store/modules/signalChannel.ts'
import {
  ElAvatar,
  ElBadge,
  ElButton,
  ElCol,
  ElDivider,
  ElInput,
  ElMessage,
  ElRow,
  ElScrollbar,
  ElSpace,
  ElText,
} from 'element-plus'
import apiMessage from '../../api/modules/message'

// import {ElScroll} from "element-plus";
import EmojiPicker from 'vue3-emoji-picker'

// import css
import 'vue3-emoji-picker/css'

// import { stringify } from '@vueuse/docs-utils'
import type { Ref } from 'vue'
import { computed, nextTick, reactive, ref } from 'vue'
import { useFileSystemAccess } from '@vueuse/core'
import { stringify } from 'qs'
import apiFile from '../../api/modules/file.ts'
import apiFriends from '../../api/modules/friend.ts'
import WebSocketAPI from '@/socket'
import useUserStore from '@/store/modules/user.ts'

const rightScrollBar = ref<InstanceType<typeof ElScrollbar>>()
// const demo = ref()
const signalChannel = useSignalChannel()
const files = ref([])
const curWindowId = ref()
const dataType = ref('Blob') as Ref<'Text' | 'ArrayBuffer' | 'Blob'>
const res = useFileSystemAccess({
  dataType,
  // multiple: false,
  types: [{
    description: 'text',
    accept: {
      'text/plain': ['.txt', '.html', '.md'],
    },
  },
  {
    description: 'image',
    accept: {
      'image/plain': ['.png', '.gif', '.jpeg', '.jpg', '.svg'],
    },
  },
  ],
  excludeAcceptAllOption: false,
})
function setScroll(value: number) {
  rightScrollBar.value!.setScrollTop(value)
}
const content = res.data
const str = stringify(reactive({
  isSupported: res.isSupported,
  file: res.file,
  fileName: res.fileName,
  fileMIME: res.fileMIME,
  fileSize: res.fileSize,
  fileLastModified: res.fileLastModified,
}))
const imgType = ref(['png', 'gif', 'jpeg', 'jpg', 'svg', 'bmp', 'webp', 'ico'])
const videoType = ref(['mp4', 'avi', 'mov'])
const audioType = ref(['mp3', 'wav', 'flac', 'ape', 'wma'])

function uploadFiles() {
  for (const key in files.value) {
    if (files.value.hasOwnProperty(key)) {
      const file = files.value[key]
      const formData = new FormData()
      const fileBlob = new Blob([file.file], { type: file.fileMIME })
      formData.append('sid', serverMeta.value.sid)
      formData.append('file', fileBlob)
      formData.append('fileName', file.fileName)
      formData.append('fileSize', file.fileSize)
      // ElMessage.success("濞ｈ濮為弬鍥︽閿? + file.fileName)
      apiFile.uploadFile(formData).then((res) => {
        if (res.code != 0) {
          ElMessage({
            message: res.descrption,
            type: 'error',
          })
        }
        else {
          ElMessage({
            message: '文件上传成功',
            type: 'success',
          })
          // console.log(res.data.key);
          const type = file.fileName.split('.').pop()
          if (imgType.value.includes(type)) {
            const Msg = {
              type: 'image',
              content: res.data.key,
              name: file.fileName,
            }
            ws.send(Msg)
          }
          else if (videoType.value.includes(type)) {
            const Msg = {
              type: 'video',
              content: res.data.key,
              name: file.fileName,
            }
            ws.send(Msg)
          }
          else if (audioType.value.includes(type)) {
            const Msg = {
              type: 'audio',
              content: res.data.key,
              name: file.fileName,
            }
            ws.send(Msg)
          }
          else {
            const Msg = {
              type: 'file',
              content: res.data.key,
              name: file.fileName,
            }
            ws.send(Msg)
          }
          moveCurrentWindowToTop()
        }
      }).catch((err) => {
        ElMessage.error('文件上传失败')
      })
    }
  }
  files.value = []
}

async function addFile() {
  await res.open()
  console.log(res)
  files.value.push({
    file: res.data.value,
    fileMIME: res.fileMIME.value,
    fileName: res.fileName.value,
    fileSize: res.fileSize.value,
  })
}

const onshowUid = ref()
const innerRef = ref(HTMLDivElement)

function removeFile(index: number) {
  files.value.splice(index, 1)
}

const windowActive = ref([])
const scrollHeight = ref('')
const loaded = ref(false)
const row = ref(1)
const activeMessageIndex = ref(0)
const typing = ref('')
const messages = ref([
  // ... your messages data
])
const pageSize = 30
interface WindowMessageState {
  messages: any[]
  page: number
  hasMore: boolean
  initialized: boolean
}
const messageStateByWindow = ref<Record<number, WindowMessageState>>({})
const hasMoreMessages = ref(false)
const loadingMoreMessages = ref(false)
const showScrollToBottom = ref(false)
const hasActiveWindow = computed(() => Boolean(serverMeta.value.wid && serverMeta.value.sid))
const serverMeta = ref({
  sid: null,
  wid: null,
})
const windows = ref([
  // ... your windows data
])
const showButtons = ref([])
const windowLoaded = ref(false)
function setObserver() {
  const targetElement = document.getElementById('main-below')
  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      updateScroll()
    }
  })
  if (targetElement) { observer.observe(targetElement) }
}
const activateIndex = ref(0)
function updateScroll() {
  // ElMessage.info('濠婃俺鐤嗙紓鈺傛杹: ');

  const dsElement = document.getElementById('main-below')
  if (dsElement) {
    const dsHeight = dsElement.offsetHeight
    setTimeout(() => {
      setScroll(innerRef.value!.clientHeight)
      // scrollHeight.value = `calc(100vh - 100px - ${dsHeight}px)`;
    }, 80)
    scrollHeight.value = `calc(100vh - 100px - ${dsHeight}px)`
    // setScroll(200);
  }
  else {
    // console.log('閺堫亝澹橀崚鏉垮徔閺堝D "ds" 閻ㄥ嫬鍘撶槐鐙呮嫹?);
  }
}

function getMessageState(wid: number): WindowMessageState {
  if (!messageStateByWindow.value[wid]) {
    messageStateByWindow.value[wid] = {
      messages: [],
      page: 0,
      hasMore: true,
      initialized: false,
    }
  }
  return messageStateByWindow.value[wid]
}

const getMessageId = (item: any) => item?.mid ?? item?.fromMessage?.mid ?? item?.toMessage?.mid ?? null

function getMessageTime(item: any) {
  const t = item?.fromMessage?.time ?? item?.toMessage?.time ?? item?.time ?? null
  if (!t) { return null }
  const time = new Date(t).getTime()
  return Number.isNaN(time) ? null : time
}

function normalizePagedResponse(data: any) {
  if (Array.isArray(data)) {
    return { list: data, total: null }
  }
  const list = data?.list || data?.records || []
  const total = typeof data?.total === 'number' ? data.total : null
  return { list, total }
}

function mergeUniqueMessages(base: any[], incoming: any[]) {
  const exist = new Set(base.map(item => getMessageId(item)).filter(id => id != null))
  const extra = incoming.filter((item) => {
    const id = getMessageId(item)
    if (id == null) {
      return true
    }
    if (exist.has(id)) {
      return false
    }
    exist.add(id)
    return true
  })
  return [...base, ...extra]
}

function appendPageMessages(current: any[], incoming: any[]) {
  if (current.length === 0) {
    return incoming
  }
  if (incoming.length === 0) {
    return current
  }
  const merged = mergeUniqueMessages(current, incoming)
  return merged.sort((a: any, b: any) => {
    const ta = getMessageTime(a)
    const tb = getMessageTime(b)
    if (ta != null && tb != null) { return ta - tb }
    const ia = getMessageId(a)
    const ib = getMessageId(b)
    if (ia != null && ib != null) { return ia - ib }
    return 0
  })
}

function syncVisibleMessages(wid: number, scrollToBottom: boolean = false) {
  const state = getMessageState(wid)
  messages.value = state.messages
  hasMoreMessages.value = state.hasMore
  if (scrollToBottom) {
    showScrollToBottom.value = false
    nextTick(() => {
      if (innerRef.value) {
        setScroll(innerRef.value.clientHeight)
      }
    })
  }
}

function handleMessageScroll() {
  const wrapEl = (rightScrollBar.value as any)?.wrapRef as HTMLElement | undefined
  if (!wrapEl) {
    return
  }
  const distanceToBottom = wrapEl.scrollHeight - wrapEl.clientHeight - wrapEl.scrollTop
  showScrollToBottom.value = distanceToBottom > 140
}

function scrollToBottom() {
  showScrollToBottom.value = false
  nextTick(() => {
    if (innerRef.value) {
      setScroll(innerRef.value.clientHeight)
    }
  })
}

function isChatMessagePayload(data: any) {
  return !!(data && data.fromMessage && data.from)
}

function ensureWsForCurrentSid() {
  if (!serverMeta.value.sid) {
    return
  }
  if (ws == null) {
    ws = new WebSocketAPI(`/private/${serverMeta.value.sid}`, messageHandler, false, useUserStore().token)
  }
  else if (ws.getSid() != serverMeta.value.sid) {
    ws.close()
    ws = new WebSocketAPI(`/private/${serverMeta.value.sid}`, messageHandler, false, useUserStore().token)
  }
}

function appendMessageToCurrentWindow(msg: any) {
  const wid = Number(serverMeta.value.wid)
  if (!wid || !msg || !msg.fromMessage) {
    return false
  }
  const state = getMessageState(wid)
  const incomingMid = getMessageId(msg)
  const exists = state.messages.some((item: any) => getMessageId(item) === incomingMid && incomingMid != null)
  if (exists) {
    return false
  }
  state.messages = appendPageMessages(state.messages, [msg])
  syncVisibleMessages(wid, true)
  return true
}

async function syncLatestMessagesAfterSend() {
  const wid = Number(serverMeta.value.wid)
  if (!wid) {
    return
  }
  const state = getMessageState(wid)
  try {
    const res = await apiMessage.getPrivateMessages(wid as any, 1, pageSize)
    const { list, total } = normalizePagedResponse(res.data)
    state.messages = appendPageMessages(state.messages, list)
    state.initialized = true
    state.page = Math.max(state.page, 1)
    if (total != null) {
      state.hasMore = state.messages.length < total
    }
    else if (Array.isArray(list) && list.length > 0) {
      state.hasMore = list.length >= pageSize || state.hasMore
    }
    syncVisibleMessages(wid, true)
  }
  catch (error) {
    console.error('Error syncing latest messages after send:', error)
  }
}

async function loadWindows() {
  try {
    initialLoad.value = true
    const res = await apiMessage.getPrivateWindows()
    const list = res.data || []
    const toTime = (w: any) => {
      const t = w.lastActiveTime ?? w.lastactivetime
      if (t == null) return 0
      if (typeof t === 'number') return t
      const ms = new Date(t).getTime()
      return Number.isNaN(ms) ? 0 : ms
    }
    windows.value = list.sort((a: any, b: any) => toTime(b) - toTime(a))
    if (windows.value.length === 0) {
      serverMeta.value = { sid: null, wid: null }
      onshowUid.value = null
      messages.value = []
      hasMoreMessages.value = false
      loadingMoreMessages.value = false
      replyFlag.value = false
      showScrollToBottom.value = false
      windowLoaded.value = false
      if (ws) {
        ws.close()
        ws = null
      }
      initialLoad.value = false
      return
    }
    serverMeta.value = {
      sid: windows.value[0].sid,
      wid: windows.value[0].wid,
    }
    console.log(serverMeta)
    // activateIndex.value
    onshowUid.value = windows.value[0].user.uid
    console.log(onshowUid.value)
    await loadMessages(serverMeta.value.wid)
    if (windows.value[0]) {
      windows.value[0].unreadCount = 0
    }
    showButtons.value = Array.from({ length: windows.value.length }).fill(false)
    windowActive.value = Array.from({ length: windows.value.length }).fill(false)
    windowActive.value[0] = true
    console.log(windows.value)
    windowLoaded.value = true
    initialLoad.value = false
  }
  catch (error) {
    console.error('Error loading windows:', error)
    initialLoad.value = false
  }
}

function messageHandler(data: any) {
  if (data?.type === 'receive') {
    // 后端仅发送 receive 通知时，主动拉取一次最新消息
    syncLatestMessagesAfterSend()
    return
  }
  if (!isChatMessagePayload(data)) {
    return
  }
  appendMessageToCurrentWindow(data)
}

async function loadMessages(wid: number, forceReload: boolean = false) {
  // const userStore = useUserStore();
  if (!wid) {
    return
  }
  ensureWsForCurrentSid()
  const state = getMessageState(wid)
  if (!forceReload && state.initialized) {
    syncVisibleMessages(wid, true)
    return
  }
  loadingMsg.value = true
  try {
    const res = await apiMessage.getPrivateMessages(wid as any, 1, pageSize)
    const { list, total } = normalizePagedResponse(res.data)
    console.log(list)
    state.messages = appendPageMessages([], list)
    state.page = 1
    state.initialized = true
    if (total != null) {
      state.hasMore = state.messages.length < total
    }
    else {
      state.hasMore = list.length >= pageSize
    }
    syncVisibleMessages(wid, true)
    setObserver()
  }
  catch (error) {
    console.error('Error loading messages:', error)
  }
  finally {
    loadingMsg.value = false
  }
}

function loadMoreMessages() {
  const wid = Number(serverMeta.value.wid)
  if (!wid || loadingMoreMessages.value || !hasMoreMessages.value) {
    return
  }
  const state = getMessageState(wid)
  const nextPage = state.page + 1
  loadingMoreMessages.value = true
  apiMessage.getPrivateMessages(wid as any, nextPage, pageSize).then((res) => {
    const { list, total } = normalizePagedResponse(res.data)
    if (!Array.isArray(list) || list.length === 0) {
      state.hasMore = false
      syncVisibleMessages(wid, false)
      return
    }
    state.messages = appendPageMessages(state.messages, list)
    state.page = nextPage
    if (total != null) {
      state.hasMore = state.messages.length < total
    }
    else {
      state.hasMore = list.length >= pageSize
    }
    syncVisibleMessages(wid, false)
  }).catch((error) => {
    console.error('Error loading more messages:', error)
  }).finally(() => {
    loadingMoreMessages.value = false
  })
}

function showButton(index) {
  showButtons.value[index] = true
}

function hideButton(index) {
  showButtons.value[index] = false
}
let ws

function activeMail() {
  // activateIndex.value = item.wid
  loadMessages(serverMeta.value.wid, true)
  // document.querySelector('.mail-detail')?.scrollTo(0, 0);
}

function selectWindowByIndex(index: number) {
  const item = windows.value[index]
  if (!item) {
    return
  }
  serverMeta.value = {
    wid: item.wid,
    sid: item.sid,
  }
  const wid = item.wid
  apiMessage.markWindowRead(wid).then(() => {
    const w = windows.value.find((x: any) => Number(x.wid) === Number(wid))
    if (w) {
      w.unreadCount = 0
    }
  }).catch(() => {})
}

/** 发送消息后把当前会话移到列表顶部 */
function moveCurrentWindowToTop() {
  const wid = serverMeta.value.wid
  if (!wid || windows.value.length <= 1) return
  const i = windows.value.findIndex((w: any) => Number(w.wid) === Number(wid))
  if (i <= 0) return
  const [win] = windows.value.splice(i, 1)
  const [sb] = showButtons.value.splice(i, 1)
  const [wa] = windowActive.value.splice(i, 1)
  windows.value.unshift(win)
  showButtons.value.unshift(sb)
  windowActive.value.unshift(wa)
  windowActive.value = windows.value.map((_: any, idx: number) => idx === 0)
}

/** 收到非当前会话的新消息时（通过全局通道推送）：将会话置顶并增加未读数 */
function onIncomingMessageFromOtherConversation(senderUid: string | number | null) {
  if (senderUid == null || windows.value.length === 0) return
  const senderUidStr = String(senderUid)
  const item = windows.value.find((w: any) => String(w?.user?.uid) === senderUidStr)
  if (!item) return
  if (Number(item.wid) === Number(serverMeta.value.wid)) return
  const i = windows.value.indexOf(item)
  if (i <= 0) {
    item.unreadCount = (item.unreadCount || 0) + 1
    return
  }
  const [win] = windows.value.splice(i, 1)
  const [sb] = showButtons.value.splice(i, 1)
  const [wa] = windowActive.value.splice(i, 1)
  win.unreadCount = (win.unreadCount || 0) + 1
  windows.value.unshift(win)
  showButtons.value.unshift(sb)
  windowActive.value.unshift(wa)
  windowActive.value = windows.value.map((_: any, idx: number) => idx === 0)
}

function removeMailItem(index, wid) {
  const removedWasActive = Number(serverMeta.value.wid) === Number(wid)
  windows.value.splice(index, 1)
  showButtons.value.splice(index, 1)
  windowActive.value.splice(index, 1)

  if (windows.value.length === 0) {
    serverMeta.value = { sid: null, wid: null }
    onshowUid.value = null
    messages.value = []
    hasMoreMessages.value = false
    replyFlag.value = false
    showScrollToBottom.value = false
    if (ws) {
      ws.close()
      ws = null
    }
  }
  else if (removedWasActive) {
    const nextIndex = Math.min(index, windows.value.length - 1)
    selectWindowByIndex(nextIndex)
  }

  apiMessage.closeWindow(wid).then((res) => {
    if (res.code != 0) {
      ElMessage({
        message: res.descrption,
        type: 'error',
      })
    }
    else {
      ElMessage({
        message: '会话关闭成功',
        type: 'success',
      })
    }
  })
}
const loadingMsg = ref(false)
const initialLoad = ref(true)
function keydown(e) {
  if (!e.shiftKey && e.keyCode == 13) {
    e.cancelBubble = true
    // ie闂冪粯顒涢崘鎺撳満鐞涘奔璐?
    e.stopPropagation()// Firefox闂冪粯顒涢崘鎺撳満鐞涘奔璐?
    e.preventDefault()// 閸欐牗绉锋禍瀣╂閻ㄥ嫰绮拋銈呭З閿?閹广垼顢?/娴犮儰绗呮径鍕倞閸欐垿鈧焦绉烽幁顖欏敩閿?
    // onSendMsg();
    // ElMessage.success("閸欐垿鈧焦绉烽敓?"+typing)
    console.log(typing.value)
    // 婢跺嫮鎮婇弬鍥︽娣団剝浼?
    if (files.value.length > 0) {
      uploadFiles()
    }
    // ElMessage.success('閸欐垿鈧焦绉烽敓?' + typing.value);
    if (typing.value.length > 0) {
      const content = typing.value
      const Msg = {
        toid: replyFlag.value ? rplyMsg.value.from.uid : null,
        replymid: replyFlag.value ? rplyMsg.value.mid : null,
        type: 'text',
        content,
      }
      ws.send(Msg)
      typing.value = ''
      replyFlag.value = false
      moveCurrentWindowToTop()
      setTimeout(() => {
        syncLatestMessagesAfterSend()
      }, 180)
    }
    // const Msg = {
    //     type:"text",
    //     content:typing.value,
    //   }
    //   ws.send(Msg);
    //   typing.value = '';
    //   loadMessages(serverMeta.value.wid);
    // console.log(this.typing);
  }
}
const route = useRoute()
const router = useRouter()
function handleSelectEmoji(emoji) {
  typing.value += emoji.i
}

onMounted(() => {
  const onVideoUid = route.query.id
  if (onVideoUid != null) {
    onshowUid.value = onVideoUid
  }
  // console.log("MailBox")
  // console.log(route.query.id)
  loadWindows()
  setObserver()
})
onBeforeUnmount(() => {
  if (ws) {
    ws.close()
    ws = null
  }
})
watch(serverMeta, () => {
  const activeWindow = windows.value.find(item => item.wid == serverMeta.value.wid)
  if (activeWindow) {
    onshowUid.value = activeWindow.user.uid
  }
  if (initialLoad.value) {
    return
  }
  activeMail()
})
watch(onshowUid, () => {
  if (onshowUid.value == null) {
    windowLoaded.value = false
    return
  }
  windowLoaded.value = false
  setTimeout(
    () => {
      windowLoaded.value = true
    }, 300,
  )
  // console.log(onshowUid.value);
})
watch(() => signalChannel.incomingMessagePopup, (popup) => {
  if (popup?.senderUid) {
    onIncomingMessageFromOtherConversation(popup.senderUid)
  }
}, { deep: true })
const friends = ref([])
const showNewMgsWindowDiag = ref(false)

function loadFriends() {
  apiFriends.getFriendList().then((res) => {
    friends.value = res.data
  })
}

function handleNewMsg() {
  showNewMgsWindowDiag.value = true
  loadFriends()
}

function isUserOnline(user: any): boolean {
  const flag = user?.online ?? user?.isOnline ?? user?.status
  if (typeof flag === 'boolean') {
    return flag
  }
  if (typeof flag === 'number') {
    return flag === 1
  }
  if (typeof flag === 'string') {
    const value = flag.trim().toLowerCase()
    if (['1', 'true', 'online'].includes(value)) {
      return true
    }
    if (['0', 'false', 'offline'].includes(value)) {
      return false
    }
  }
  return false
}

function resolveActiveWindow() {
  const byWid = windows.value.find((item: any) => item.wid == serverMeta.value.wid)
  if (byWid) {
    return byWid
  }
  if (onshowUid.value == null) {
    return null
  }
  return windows.value.find((item: any) => item?.user?.uid == onshowUid.value) ?? null
}

function startVideoCall() {
  const activeWindow = resolveActiveWindow()
  const targetUid = onshowUid.value ?? activeWindow?.user?.uid
  if (!targetUid) {
    ElMessage.warning('Please select a chat window first')
    return
  }

  if (!activeWindow) {
    ElMessage.warning('Cannot resolve target user status')
    return
  }

  if (!isUserOnline(activeWindow.user)) {
    ElMessage.warning('对方当前不在线')
    return
  }

  router.push({
    path: '/MailBox/chatroom',
    query: { uid: targetUid },
  })
}
const rplyMsg = ref({})
const replyFlag = ref(false)
const hoveredMessageIndex = ref<number | null>(null)

function selectReplyMsg(item) {
  replyFlag.value = true
  rplyMsg.value = item
}

function cancelReply() {
  replyFlag.value = false
}

function getReplyPreview(item: any) {
  const fromMessage = item?.fromMessage
  if (!fromMessage) {
    return ''
  }
  if (fromMessage.type === 'text') {
    return String(fromMessage.content ?? '').slice(0, 80)
  }
  if (fromMessage.type === 'image') {
    return '[图片]'
  }
  if (fromMessage.type === 'video') {
    return '[视频]'
  }
  if (fromMessage.type === 'audio') {
    return '[语音]'
  }
  if (fromMessage.type === 'file') {
    return `[文件] ${fromMessage.name ?? ''}`
  }
  return '[消息]'
}

function activateWindow(
  uname: string,
) {
  apiMessage.activateWindow(
    uname,
  ).then((res) => {
    console.log(res)
    loadWindows()
    // $router.push('/MailBox');
  }).catch((err) => {
    console.log(err)
  })
  // 鐠侯垳鏁遍崚鍥ㄥ床
}

const ChatWindowVisible = ref(false)
</script>

<script lang="ts">
</script>

<template>
  <div>
    <!--      <el-button @click="showDiag = true">閺勫墽銇?Dialog</el-button> -->
    <el-dialog v-model="showNewMgsWindowDiag">
      <template #title>
        <div>发起新会话</div>
      </template>
      <ElScrollbar view-class="scrollbar-view" wrap-class="scrollbar-wrapper" wrap-style="height: 60vh">
        <!--              <el-divider direction="horizontal" class="m-5"></el-divider> -->
        <div v-for="(item, index) in friends" :key="index" class="m-5">
          <ElRow align="middle" justify="start">
            <ElCol :span="2">
              <ElBadge :type="isUserOnline(item) ? 'success' : 'info'" class="item" is-dot style="margin-left: 10px;">
                <ElAvatar :size="36" :src="item.avatar" shape="circle" />
              </ElBadge>
            </ElCol>
            <ElCol :span="4">
              <ElText size="large">
                <strong>{{ item.unick }}</strong>
              </ElText>
              <br>
              <ElText type="info">
                {{ item.uname }}
              </ElText>
            </ElCol>
            <ElCol :span="15" />
            <ElCol :span="3">
              <ElButton
                style="margin-left: 30px;width: 20px;" text type="info"
                @click="() => { activateWindow(item.uname);showNewMgsWindowDiag = false }"
              >
                <SvgIcon :size="16" name="fluent:mail-24-filled" />
              </ElButton>
            </ElCol>
          </ElRow>
        </div>
      </ElScrollbar>
    </el-dialog>
    <ElRow justify="start">
      <ElCol :span="4">
        <PageMain style="height: 100vh;background:#2C2D2F">
          <div>
            <div class="mail-header">
              <ElRow justify="space-between">
                <ElCol :span="8">
                  <ElRow justify="start">
                    <ElCol :span="18">
                      <ElText>
                        <strong>私信</strong>
                      </ElText>
                    </ElCol>
                  </ElRow>
                </ElCol>
                <ElCol :span="8">
                  <ElButton style="margin-left: 30px;width: 20px;" text type="info" @click="handleNewMsg()">
                    <SvgIcon :size="16" name="fluent:add-12-filled" />
                  </ElButton>
                </ElCol>
              </ElRow>

              <br>
            </div>
            <div class="window-list">
              <ElScrollbar height="80vh" style="width: 100%">
                <div v-for="(item, index) in windows" :key="index" class="window-item">
                  <div
                    :index="index" class="window mt-1" style="
      width: 100%;
      display: flex;
      background: #2C2D2F;
      margin: auto 0;
      height: 60px;
    " @click="selectWindowByIndex(index)" @mouseenter="showButton(index)" @mouseleave="hideButton(index)"
                  >
                    <div style="width: 100%; display: flex; align-items: center;">
                      <ElSpace>
                        <ElBadge
                          :value="(item.unreadCount > 0 ? item.unreadCount : '')"
                          :max="99"
                          :type="isUserOnline(item.user) ? 'success' : 'info'"
                          :is-dot="!(item.unreadCount > 0)"
                          class="item"
                          style="margin-left: 10px;"
                        >
                          <ElAvatar :size="36" :src="item.user.avatar" shape="circle" />
                        </ElBadge>
                        <span style="width: 80px">
                          <ElText truncated>{{ item.user.unick }}</ElText>
                        </span>
                        <ElButton
                          v-show="showButtons[index]" circle style="margin-right: 5px; " text
                          type="info"
                          @click.stop="removeMailItem(index, item.wid)"
                        >
                          <SvgIcon :size="16" name="octicon:x-12" />
                        </ElButton>
                      </ElSpace>
                    </div>
                  </div>
                </div>
              </ElScrollbar>
            </div>
          </div>
        </PageMain>
      </ElCol>
      <ElCol :span="14">
        <PageMain style="height: 100%; background: #333436">
          <template v-if="hasActiveWindow">
            <div v-loading="loadingMsg" class="mail-detail">
              <ElScrollbar ref="rightScrollBar" :style="{ height: scrollHeight }" @scroll="handleMessageScroll">
                <div ref="innerRef">
                  <el-empty v-if="messages.length === 0" description="暂无会话消息" />
                  <div class="history-loader-wrap">
                    <ElButton
                      class="history-loader-btn"
                      :disabled="!hasMoreMessages"
                      :loading="loadingMoreMessages"
                      text
                      type="info"
                      @click="loadMoreMessages"
                    >
                      {{ hasMoreMessages ? '查看更多消息' : '没有更多消息了' }}
                    </ElButton>
                  </div>

                  <div
                    v-for="(item, index) in messages"
                    :key="index"
                    class="message-row"
                    @mouseenter="hoveredMessageIndex = index"
                    @mouseleave="hoveredMessageIndex = null"
                  >
                    <div
                      class="reply-action"
                      :class="{ visible: hoveredMessageIndex === index }"
                      @click="selectReplyMsg(item)"
                    >
                      <ElButton circle text type="info">
                        <SvgIcon :size="16" name="subway:reply" />
                      </ElButton>
                      <span class="reply-action-text">回复</span>
                    </div>
                    <Message
                      :from="item.from" :from-message="item.fromMessage" :time="item.fromMessage.time"
                      :to="item.to" :to-message="item.toMessage"
                    >
                      <template #avatar>
                        <ElAvatar :size="40" :src="item.from.avatar" shape="circle" />
                      </template>
                    </Message>
                  </div>
                </div>
                <ElDivider direction="horizontal" style="margin: auto" />
              </ElScrollbar>
              <div class="scroll-bottom-wrap" :class="{ visible: showScrollToBottom }">
                <ElButton circle class="scroll-bottom-btn" @click="scrollToBottom">
                  <SvgIcon :size="18" name="mdi:chevron-double-down" />
                </ElButton>
              </div>
            </div>

            <div id="main-below" ref="demo" class="bottom-5" style="position: fixed; width: 53vw">
              <div
                v-if="files.length > 0" class="file-show flex-1"
                style="height: 200px;width: inherit; border-radius: 5px;background: #3A3B3E; padding: 0 10px;"
              >
                <!--                {{content}} -->
                <ElScrollbar>
                  <div class="scrollbar-flex-content">
                    <p v-for="(item, index) in files" :key="index" class="scrollbar-demo-item">
                      <span class="positioned-element">
                        <el-button-group size="small" style="background: #2C2D2F">
                          <el-tooltip content="移除文件" placement="top-start">
                            <ElButton text type="danger" @click="removeFile(index)">
                              <SvgIcon name="mdi:delete" />
                            </ElButton>
                          </el-tooltip>

                        </el-button-group>
                      </span>
                      {{ item.fileName }}
                    </p>
                  </div>
                </ElScrollbar>
              </div>
              <div>
                <ElDivider direction="horizontal" style="margin: auto" />
                <div v-if="replyFlag">
                  <div class="reply-bar">
                    <div class="reply-bar-main">
                      <div class="reply-bar-mark" />
                      <div class="reply-bar-content">
                        <div class="reply-bar-title">
                          回复 {{ rplyMsg.from?.uname || '用户' }}
                        </div>
                        <div class="reply-bar-preview">
                          {{ getReplyPreview(rplyMsg) }}
                        </div>
                      </div>
                    </div>
                    <ElButton text type="info" class="reply-bar-close" @click="cancelReply">
                      取消
                    </ElButton>
                  </div>
                </div>
                <ElRow
                  id="inputBar" justify="start"
                  style="width: 100%;border-radius: 5px;background: #3A3B3E; padding: 0 10px;overflow: hidden"
                >
                <!--                > -->

                <ElCol :span="1" style="margin: auto">
                  <el-popover
                    :width="200"
                    placement="top-start"
                    trigger="click"
                  >
                    <template #reference>
                      <SvgIcon :size="24" class="tool" name="carbon:add-filled" />
                    </template>
                    <div
                      class="add-item" style="display: flex; align-items: center; justify-content: start;"
                      @click="addFile"
                    >
                      <SvgIcon :size="24" name="ri:upload-line" />
                      <div style="font-size: 12px">
                        &nbsp;&nbsp;上传文件
                      </div>
                    </div>
                  </el-popover>

                  <!--                        </el-button> -->
                </ElCol>
                <ElCol :span="18" style="margin: auto">
                  <!--                      {{row}} -->
                  <!--                      <input type="text" v-model="typing" placeholder="鐠囩柉绶崗銉ュ敶閿?> -->
                  <ElInput
                    v-model="typing" :autosize="{ minRows: 1, maxRows: 15 }"
                    maxlength="2048" placeholder="Shift+Enter newline | Enter send"
                    resize="none" show-word-limit style="width: 100%;border-radius: 5px;background: #3A3B3E; padding: 0 10px;
                                  margin-top: 8px; margin-bottom: 8px;"
                    type="textarea"
                    @keydown="keydown"
                  />
                </ElCol>
                <ElCol :span="1" style="margin: auto">
                  <!--                        <el-button type="info" text  style="margin-left: 40px;"> -->
                  <SvgIcon :size="24" class="tool" name="mdi:video" @click="startVideoCall" />
                  <!--                    </el-button> -->
                </ElCol>
                <ElCol :span="1" style="margin: auto">
                  <!--                        <el-button type="info" text  style="margin-left: 40px;"> -->
                  <SvgIcon :size="24" class="tool" name="fluent:sticker-24-filled" />
                  <!--                    </el-button> -->
                </ElCol>
                <ElCol :span="1" style="margin: auto">
                  <el-popover
                    :width="300"
                    hidden
                    placement="top"
                    trigger="click"
                  >
                    <template #reference>
                      <SvgIcon :size="24" class="tool" name="fluent:emoji-24-filled" />
                    </template>
                    <EmojiPicker
                      :native="true" style="background: #1C1D1E;" theme="dark"
                      @select="handleSelectEmoji"
                    />
                  </el-popover>
                </ElCol>
                </ElRow>
              </div>
            </div>
          </template>
          <div v-else class="mail-empty-state">
            <el-empty description="暂无会话，开始一个新聊天吧">
              <ElButton type="info" text @click="handleNewMsg">
                发起新会话
              </ElButton>
            </el-empty>
          </div>
        </PageMain>
      </ElCol>
      <ElCol :span="6">
        <UserCard
          v-if="hasActiveWindow && windowLoaded"
          :from-uid="onshowUid"
        />
        <div v-else-if="hasActiveWindow" style="width: 80%">
          <div class="user-card" style="">
            <div class="banner" style="height:120px;position: relative">
              <el-skeleton
                animated
                style="--el-skeleton-circle-size: 100px;position: absolute;left: 25%;top: 90%;transform: translate(-10%,-50%);"
              >
                <template #template>
                  <el-skeleton-item variant="circle" />
                </template>
              </el-skeleton>
            </div>
            <div class="info ml-5 mr-5 mt-15" style="background: #121213;border-radius: 8px;height:420px;width:300px;">
              <br>
              <div class="ml-8 mr-8">
                <el-skeleton :rows="4" animated />
              </div>

              <br>
              <br>
            </div>
          </div>
        </div>
        <div v-else class="user-empty-placeholder" />
      </ElCol>
    </ElRow>
    <!--    <el-drawer v-model:="ChatWindowVisible" :show-close="false" direction="rtl" size="50%" title="閼卞﹤銇夌粣妤€褰?> -->

    <!--    </el-drawer> -->
  </div>
</template>

<style lang="scss" scoped>
.mail-item :hover {
  background-color: inherit;
}

.tool:hover {
  color: #DDDEE0;
  cursor: pointer;
}

.mail-detail {
  position: relative;
}

.mail-empty-state {
  height: calc(100vh - 130px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-empty-placeholder {
  width: 80%;
  min-height: 60vh;
}

.scroll-bottom-wrap {
  position: absolute;
  right: 16px;
  bottom: 108px;
  z-index: 5;
  opacity: 0;
  transform: translateY(8px);
  pointer-events: none;
  transition: all 0.18s ease;
}

.scroll-bottom-wrap.visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.scroll-bottom-btn {
  width: 34px;
  height: 34px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(22, 24, 28, 0.86);
  color: #9ea5b1;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.28);
}

.scroll-bottom-btn:hover {
  color: #dde1e8;
  border-color: rgba(255, 255, 255, 0.14);
  background: rgba(36, 39, 46, 0.96);
}

.history-loader-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px 0 14px;
}

.history-loader-btn {
  border-radius: 999px;
  padding: 6px 14px;
  color: #a8adb7;
  background: rgba(24, 26, 31, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: all 0.16s ease;
}

.history-loader-btn:hover {
  color: #d2d5db;
  background: rgba(33, 36, 43, 0.9);
  border-color: rgba(255, 255, 255, 0.12);
}

.history-loader-btn.is-disabled,
.history-loader-btn:disabled {
  color: #7f8692;
  background: rgba(24, 26, 31, 0.5);
  border-color: rgba(255, 255, 255, 0.04);
}

.message-row {
  position: relative;
}

.reply-action {
  position: absolute;
  top: 8px;
  right: 14px;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 6px;
  border-radius: 10px;
  background: rgba(20, 21, 24, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.35);
  opacity: 0;
  transform: translateY(-4px);
  pointer-events: none;
  transition: all 0.16s ease;
}

.reply-action.visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.reply-action:hover {
  border-color: rgba(133, 206, 97, 0.45);
  background: rgba(33, 35, 40, 0.95);
}

.reply-action-text {
  color: #d9dbde;
  font-size: 12px;
  padding-right: 6px;
}

.reply-bar {
  margin: 8px 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: #2f3033;
  border: 1px solid rgba(133, 206, 97, 0.32);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.reply-bar-main {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 10px;
}

.reply-bar-mark {
  width: 4px;
  height: 36px;
  border-radius: 999px;
  background: linear-gradient(180deg, #85ce61, #67c23a);
}

.reply-bar-content {
  min-width: 0;
}

.reply-bar-title {
  color: #e4e7ed;
  font-size: 12px;
  line-height: 1.2;
}

.reply-bar-preview {
  margin-top: 4px;
  color: #b9bcc3;
  font-size: 12px;
  line-height: 1.2;
  max-width: 480px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.reply-bar-close {
  flex-shrink: 0;
}

.add-item {
  padding: 5px 10px;
  color: white;
}

.add-item:hover {
  background: #85ce61;
  cursor: pointer;
  border-radius: 5px;
}

.scrollbar-flex-content {
  display: flex;

}

.el-tag:hover {
  //background: #85ce61;
  cursor: pointer;
  border-color: #B4B6BA;
}

.el-tag:focus {
  background: #85ce61;
  cursor: pointer;
  border-color: #B4B6BA;
}

.scrollbar-demo-item {
  position: relative;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 180px;
  height: 180px;
  margin: 10px;
  text-align: center;
  border-radius: 4px;
  //background: var(--el-color-danger-light-9);
  //color: var(--el-color-danger);
  background: rgba(133, 206, 97, 0.45);

}

.window :hover {
  background: #37373B;
  border-radius: 5px;
}

.positioned-element {
  position: absolute;
  top: 0;
  right: 0;
  //width: 20px;
}

//.el-input :focus{
//  border-color: #85ce61;
//}
</style>
