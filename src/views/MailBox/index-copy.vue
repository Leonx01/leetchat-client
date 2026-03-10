<script lang="ts" setup>
// import {ElScroller} from "element-plus";
// import ElScroll from "element-plus"
import {useSignalChannel} from "@/store/modules/signalChannel.ts";
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
  ElText
} from "element-plus";
import apiMessage from "../../api/modules/message";
// import {ElScroll} from "element-plus";
import EmojiPicker from 'vue3-emoji-picker'
import WebSocketAPI from "@/socket";
// import css
import 'vue3-emoji-picker/css'
// import { stringify } from '@vueuse/docs-utils'
import type {Ref} from 'vue'
import {reactive, ref} from 'vue'
import {useFileSystemAccess} from '@vueuse/core'
import {stringify} from "qs";
import apiFile from "../../api/modules/file.ts";
import apiFriends from "../../api/modules/friend.ts";
import useUserStore from "@/store/modules/user.ts";

const rightScrollBar = ref<InstanceType<typeof ElScrollbar>>()
// const demo = ref()
const signalChannel = useSignalChannel()
const files = ref([])
const curWindowId = ref();
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
      description: "image",
      accept: {
        "image/plain": [".png", ".gif", ".jpeg", ".jpg", ".svg"],
      },
    },
  ],
  excludeAcceptAllOption: false,
})
const setScroll = (value: number) => {
  rightScrollBar.value!.setScrollTop(value)
  // ElMessage.success('滚动条设置为：' + value)
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
  for (var key in files.value) {
    if (files.value.hasOwnProperty(key)) {
      let file = files.value[key];
      let formData = new FormData()
      let fileBlob = new Blob([file.file], {type: file.fileMIME})
      formData.append('sid', serverMeta.value.sid)
      formData.append('file', fileBlob);
      formData.append('fileName', file.fileName);
      formData.append('fileSize', file.fileSize);
      // ElMessage.success("添加文件：" + file.fileName)
      apiFile.uploadFile(formData).then(res => {
        if (res.code != 0) {
          ElMessage({
            message: res.descrption,
            type: 'error'
          })
        } else {
          ElMessage({
            message: '上传文件成功',
            type: 'success'
          })
          // console.log(res.data.key);
          const type = file.fileName.split('.').pop();
          if (imgType.value.includes(type)) {
            const Msg = {
              type: "image",
              content: res.data.key,
              name: file.fileName,
            }
            ws.send(Msg);
          } else if (videoType.value.includes(type)) {
            const Msg = {
              type: "video",
              content: res.data.key,
              name: file.fileName,
            }
            ws.send(Msg);
          } else if (audioType.value.includes(type)) {
            const Msg = {
              type: "audio",
              content: res.data.key,
              name: file.fileName,
            }
            ws.send(Msg);
          } else {
            const Msg = {
              type: "file",
              content: res.data.key,
              name: file.fileName,
            }
            ws.send(Msg);
          }
        }
      }).catch(err => {
        ElMessage.error('上传文件失败')
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
    fileSize: res.fileSize.value
  })
}

const onshowUid = ref();
const innerRef = ref(HTMLDivElement)

function removeFile(index: number) {
  files.value.splice(index, 1)
}

const windowActive = ref([]);
const scrollHeight = ref("");
const loaded = ref(false);
const row = ref(1);
const activeMessageIndex = ref(0);
const typing = ref('');
const messages = ref([
  // ... your messages data
]);
const serverMeta = ref({
  sid: null,
  wid: null,
})
const windows = ref([
  // ... your windows data
]);
const showButtons = ref([]);
const windowLoaded = ref(false);
const setObserver = () => {
  const targetElement = document.getElementById('main-below');
  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      updateScroll();
    }
  });
  if (targetElement) observer.observe(targetElement);
};
const activateIndex = ref(0);
const updateScroll = () => {
  // ElMessage.info('滚轮缩放: ');

  const dsElement = document.getElementById('main-below');
  if (dsElement) {
    const dsHeight = dsElement.offsetHeight;
    setTimeout(() => {
      setScroll(innerRef.value!.clientHeight);
      // scrollHeight.value = `calc(100vh - 100px - ${dsHeight}px)`;
    }, 80);
    scrollHeight.value = `calc(100vh - 100px - ${dsHeight}px)`;
    // setScroll(200);

  } else {
    // console.log('未找到具有ID "ds" 的元素。');
  }
};

const loadWindows = async () => {

  try {
    const res = await apiMessage.getPrivateWindows();
    windows.value = res.data.sort((a: any, b: any) => {
      if (a.lastActiveTime < b.lastActiveTime) {
        return -1;
      }
      if (a.lastActiveTime > b.lastActiveTime) {
        return 1;
      }
      return 0;
    });
    serverMeta.value.sid = windows.value[0].sid;
    serverMeta.value.wid = windows.value[0].wid;
    console.log(serverMeta)
    // activateIndex.value
    onshowUid.value = windows.value[0].user.uid;
    console.log(onshowUid.value);
    loadMessages(serverMeta.value.wid);
    showButtons.value = new Array(windows.value.length).fill(false);
    windowActive.value = new Array(windows.value.length).fill(false);
    windowActive.value[0] = true;
    console.log(windows.value);
    windowLoaded.value = true;

  } catch (error) {
    console.error('Error loading windows:', error);
  }
};

function messageHandler() {
  loadMessages(serverMeta.value.wid);
}

const loadMessages = async (wid: number) => {
  // const userStore = useUserStore();
  loadingMsg.value = true;
  try {
    const res = await apiMessage.getPrivateMessages(wid);
    console.log(res.data);
    messages.value = res.data;
    if (ws == null) {
      ws = new WebSocketAPI("/private/" + serverMeta.value.sid,messageHandler, false,useUserStore().token);
    } else if (ws.getSid() != serverMeta.value.sid) {
      // ElMessage.success("加入聊天窗口: "+serverMeta.value.sid+"关闭连接"+ws.getSid());
      ws.close();
      ws = new WebSocketAPI("/private/" + serverMeta.value.sid, messageHandler, false,useUserStore().token);
    }

    // ElMessage.success("加入聊天窗口: "+serverMeta.value.sid);
    // setScroll(200);
    loadingMsg.value = false;
    setObserver();

  } catch (error) {
    console.error('Error loading messages:', error);
  }
};

const showButton = (index) => {
  showButtons.value[index] = true;
};

const hideButton = (index) => {
  showButtons.value[index] = false;
};
let ws;

const activeMail = () => {
  // activateIndex.value = item.wid
  loadMessages(serverMeta.value.wid)
  // document.querySelector('.mail-detail')?.scrollTo(0, 0);
};

const removeMailItem = (index, wid) => {
  windows.value.splice(index, 1);
  apiMessage.closeWindow(wid).then(res => {
    if (res.code != 0) {
      ElMessage({
        message: res.descrption,
        type: 'error'
      })
    } else {
      ElMessage({
        message: '关闭私信成功',
        type: 'success'
      })
    }
  })
};
const loadingMsg = ref(false)
const keydown = (e) => {
  if (!e.shiftKey && e.keyCode == 13) {
    e.cancelBubble = true;
    //ie阻止冒泡行为
    e.stopPropagation();//Firefox阻止冒泡行为
    e.preventDefault();//取消事件的默认动作*换行//以下处理发送消息代码
    // onSendMsg();
    // ElMessage.success("发送消息:"+typing)
    console.log(typing.value);
    //处理文件信息
    if (files.value.length > 0) {
      uploadFiles();

    }
    // ElMessage.success('发送消息:' + typing.value);
    if (typing.value.length > 0) {
      const Msg = {
        toid: replyFlag.value ? rplyMsg.value.from.uid : null,
        replymid: replyFlag.value ? rplyMsg.value.mid : null,
        type: "text",
        content: typing.value,
      }
      ws.send(Msg);
      typing.value = '';
      replyFlag.value = false;
      // loadMessages(serverMeta.value.wid);
    }
    setTimeout(() => {
      loadMessages(serverMeta.value.wid);
    }, 500);
    // const Msg = {
    //     type:"text",
    //     content:typing.value,
    //   }
    //   ws.send(Msg);
    //   typing.value = '';
    //   loadMessages(serverMeta.value.wid);
    // console.log(this.typing);

  }
};
const route = useRoute()
const handleSelectEmoji = (emoji) => {
  typing.value += emoji.i;
};

onMounted(() => {
  let onVideoUid = route.query.id;
  if (onVideoUid != null) {
    onshowUid.value = onVideoUid;
  }
  // console.log("MailBox")
  // console.log(route.query.id)
  loadWindows();
  setObserver();


});
watch(serverMeta, () => {
  activeMail();
  onshowUid.value = windows.value.filter((item) => item.wid == serverMeta.value.wid)[0].user.uid;
  // console.log(onshowUid.value);
  // console.log("dasdasdad"+onshowUid.value);
})
watch(onshowUid, () => {
  windowLoaded.value = false;
  setTimeout(
    () => {
      windowLoaded.value = true;
    }, 300
  )
  // console.log(onshowUid.value);
})
const friends = ref([]);
const showNewMgsWindowDiag = ref(false);

function loadFriends() {
  apiFriends.getFriendList().then(res => {
    friends.value = res.data;
  })
}

function handleNewMsg() {
  showNewMgsWindowDiag.value = true;
  loadFriends();
}

const rplyMsg = ref({});
const replyFlag = ref(false);

function selectReplyMsg(item) {
  console.log("回复消息")
  console.log(item);
  replyFlag.value = true;
  rplyMsg.value = item;
  // ElMessage.success("回复消息")
}

function activateWindow(
  uname: string
) {
  apiMessage.activateWindow(
    uname
  ).then((res) => {
    console.log(res)
    loadWindows();
    // this.$router.push('/MailBox');
  }).catch((err) => {
    console.log(err)
  })
  //路由切换
}

const ChatWindowVisible = ref(false);
</script>
<script lang="ts">
</script>
<template>
  <div>
    <!--      <el-button @click="showDiag = true">显示 Dialog</el-button>-->
    <el-dialog v-model:="showNewMgsWindowDiag">
      <template #title>
        <div>发起私信</div>
      </template>
      <el-scrollbar view-class="scrollbar-view" wrap-class="scrollbar-wrapper" wrap-style="height: 60vh">
        <!--              <el-divider direction="horizontal" class="m-5"></el-divider>-->
        <div v-for="(item,index) in friends" :key="index" class="m-5">
          <el-row align="middle" justify="start">
            <el-col :span="2">
              <el-badge :type="item.online ? 'success' : 'info'" class="item" is-dot style="margin-left: 10px;">
                <el-avatar :size="36" :src="item.avatar" shape="circle"/>
              </el-badge>
            </el-col>
            <el-col :span="4">
              <el-text size="large">
                <strong>{{ item.unick }}</strong></el-text>
              <br>
              <el-text type="info">{{ item.uname }}</el-text>
            </el-col>
            <el-col :span="15"></el-col>
            <el-col :span="3">
              <el-button style="margin-left: 30px;width: 20px;" text type="info"
                         @click="()=>{activateWindow(item.uname);showNewMgsWindowDiag=false}">
                <SvgIcon :size="16" name="fluent:mail-24-filled"/>
              </el-button>
            </el-col>
          </el-row>
        </div>
      </el-scrollbar>
    </el-dialog>
    <el-row justify="start">
      <el-col :span="4">
        <PageMain style="height: 100vh;background:#2C2D2F">
          <div>
            <div class="mail-header">
              <el-row justify="space-between">
                <el-col :span="8">
                  <el-row justify="start">
                    <el-col :span="18">
                      <el-text>
                        <strong>收件箱</strong></el-text>
                    </el-col>
                  </el-row>
                </el-col>
                <el-col :span="8">
                  <el-button style="margin-left: 30px;width: 20px;" text type="info" @click="handleNewMsg()">
                    <SvgIcon :size="16" name="fluent:add-12-filled"/>
                  </el-button>
                </el-col>
              </el-row>

              <br>
            </div>
            <div class="window-list">
              <el-scrollbar height="80vh" style="width: 100%">
                <div v-for="(item, index) in windows" :key="index" class="window-item">
                  <div :index="index" class="window mt-1" style="
      width: 100%;
      display: flex;
      background: #2C2D2F;
      margin: auto 0;
      height: 60px;
    " @click="()=>{
      serverMeta={wid:item.wid,
                  sid:item.sid}}" @mouseenter="showButton(index)" @mouseleave="hideButton(index)">
                    <div style="width: 100%; display: flex; align-items: center;">
                      <el-space>
                        <el-badge :type="item.user.online ? 'success' : 'info'" class="item" is-dot
                                  style="margin-left: 10px;">
                          <el-avatar :size="36" :src="item.user.avatar" shape="circle"/>
                        </el-badge>
                        <span style="width: 80px">
            <el-text truncated>{{ item.user.unick }}</el-text>
          </span>
                        <el-button v-show="showButtons[index]" circle style="margin-right: 5px; " text
                                   type="info"
                                   @click="removeMailItem(index,item.wid)"
                        >
                          <SvgIcon :size="16" name="octicon:x-12"/>
                        </el-button>
                      </el-space>
                    </div>
                  </div>
                </div>
              </el-scrollbar>

            </div>

          </div>
        </PageMain>

      </el-col>
      <el-col :span="14">
        <PageMain style="height: 100%; background: #333436">
          <div v-loading="loadingMsg" class="mail-detail">

            <el-scrollbar ref="rightScrollBar" :style="{height:scrollHeight}">
              <div ref="innerRef">
                <el-empty v-if="messages.length===0" description="暂无私信"/>
                <div style="display: flex; justify-content: center; align-items: center;">
                  <el-button text type="info">加载更多信息</el-button>
                </div>

                <div v-for="(item,index) in messages" :key="index">
                  <el-popover
                    close="click"
                    placement="bottom-end"
                    trigger="click"
                  >
                    <template #reference>
                      <Message :from="item.from" :fromMessage="item.fromMessage" :time="item.fromMessage.time"
                               :to="item.to" :toMessage="item.toMessage">
                        <template #avatar>
                          <el-avatar :size="40" :src="item.from.avatar" shape="circle"/>
                        </template>
                      </Message>
                    </template>
                    <el-button circle text type="info" @click="selectReplyMsg(item)">
                      <SvgIcon :size="16" name="subway:reply"/>
                    </el-button>
                    <el-text>回复：{{ item.from.uname }}</el-text>
                  </el-popover>
                </div>
              </div>
              <el-divider direction="horizontal" style="margin: auto"></el-divider>
            </el-scrollbar>
          </div>

          <div id="main-below" ref="demo" class="bottom-5 " style="position: fixed; width: 53vw">
            <div v-if="files.length>0" class="file-show flex-1"
                 style="height: 200px;width: inherit; border-radius: 5px;background: #3A3B3E; padding: 0 10px;">
              <!--                {{content}}-->
              <el-scrollbar>
                <div class="scrollbar-flex-content">
                  <p v-for="(item, index) in files" :key="index" class="scrollbar-demo-item">
                    <span class="positioned-element">
                        <el-button-group size="small" style="background: #2C2D2F">
                           <el-tooltip content="移除文件" placement="top-start">
                                      <el-button text type="danger" @click="removeFile(index)">
                                  <SvgIcon name="mdi:delete"/>
                              </el-button>
                          </el-tooltip>

                        </el-button-group>
                    </span>
                    {{ item.fileName }}
                  </p>

                </div>
              </el-scrollbar>
            </div>
            <div>
              <el-divider direction="horizontal" style="margin: auto"></el-divider>
              <div v-if="replyFlag">
                <div style="background: #85ce61;height: 2px"></div>
                <el-text>回复消息：</el-text>
                <el-button text type="info" @click="()=>{replyFlag=false}">取消回复</el-button>
                <Message :from="rplyMsg.from" :fromMessage="rplyMsg.fromMessage" :time="rplyMsg.fromMessage.time">
                  <template #avatar>
                    <el-avatar :size="40" :src="rplyMsg.from.avatar" shape="circle"/>
                  </template>
                </Message>
              </div>
              <el-row id="inputBar" justify="start"
                      style="width: 100%;border-radius: 5px;background: #3A3B3E; padding: 0 10px;overflow: hidden">
                <!--                >-->


                <el-col :span="1" style="margin: auto">
                  <el-popover
                    :width="200"
                    placement="top-start"
                    trigger="click"
                  >
                    <template #reference>
                      <SvgIcon :size="24" class="tool" name="carbon:add-filled"/>
                    </template>
                    <div class="add-item" style="display: flex; align-items: center; justify-content: start;"
                         @click="addFile">
                      <SvgIcon :size="24" name="ri:upload-line"/>
                      <div style="font-size: 12px">&nbsp;&nbsp;上传文件</div>
                    </div>
                  </el-popover>

                  <!--                        </el-button>-->
                </el-col>
                <el-col :span="18" style="margin: auto">
                  <!--                      {{row}}-->
                  <!--                      <input type="text" v-model="typing" placeholder="请输入内容/>-->
                  <el-input v-model="typing" :autosize="{ minRows: 1, maxRows: 15 }"
                            maxlength="2048" placeholder="Shift+Enter 换行 | Enter 发送"
                            resize="none" show-word-limit style="width: 100%;border-radius: 5px;background: #3A3B3E; padding: 0 10px;
                                  margin-top: 8px; margin-bottom: 8px;"
                            type="textarea"
                            @keydown="keydown"
                  ></el-input>
                </el-col>
                <el-col :span="1" style="margin: auto">
                  <!--                        <el-button type="info" text  style="margin-left: 40px;">-->
                  <SvgIcon :size="24" class="tool" name="mdi:video" @click="
                  ()=>{
                     this.$router.push({
                      path: '/MailBox/chatroom',
                      query: {uid: onshowUid}
                     })

                  }"
                 />
                  <!--                    </el-button>-->
                </el-col>
                <el-col :span="1" style="margin: auto">
                  <!--                        <el-button type="info" text  style="margin-left: 40px;">-->
                  <SvgIcon :size="24" class="tool" name="fluent:sticker-24-filled"
                  />
                  <!--                    </el-button>-->
                </el-col>
                <el-col :span="1" style="margin: auto">
                  <el-popover
                    :width="300"
                    hidden
                    placement="top"
                    trigger="click"
                  >
                    <template #reference>
                      <SvgIcon :size="24" class="tool" name="fluent:emoji-24-filled"/>
                    </template>
                    <emoji-picker :native="true" style="background: #1C1D1E;" theme="dark"
                                  @select="handleSelectEmoji"
                    />
                  </el-popover>
                </el-col>
              </el-row>
            </div>
          </div>
        </PageMain>
      </el-col>
      <el-col :span="6">
        <UserCard v-if="windowLoaded"
                  :fromUid="onshowUid"/>
        <div v-else style="width: 80%">
          <div class="user-card" style="">
            <div class="banner" style="height:120px;position: relative">
              <el-skeleton
                animated
                style="--el-skeleton-circle-size: 100px;position: absolute;left: 25%;top: 90%;transform: translate(-10%,-50%);">
                <template #template>
                  <el-skeleton-item variant="circle"/>
                </template>
              </el-skeleton>
            </div>
            <div class="info mt-15 mr-5 ml-5" style="background: #121213;border-radius: 8px;height:420px;width:300px;">
              <br>
              <div class="ml-8 mr-8">
                <el-skeleton :rows="4" animated/>
              </div>

              <br>
              <br>

            </div>
          </div>

        </div>
      </el-col>
    </el-row>
<!--    <el-drawer v-model:="ChatWindowVisible" :show-close="false" direction="rtl" size="50%" title="聊天窗口">-->

<!--    </el-drawer>-->
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
