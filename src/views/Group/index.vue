<script setup lang="ts">
import {ElRow, ElCol} from "element-plus";
import {ElAvatar} from "element-plus";
import {ElText} from "element-plus";
import {ElMessage} from "element-plus";
import apiMessage from "../../api/modules/message";
// import {ElScroller} from "element-plus";
import {ElCard} from "element-plus";
import {ElSpace} from "element-plus";
// import {ElScroll} from "element-plus";
import EmojiPicker from 'vue3-emoji-picker'
const rightScrollBar = ref<InstanceType<typeof ElScrollbar>>()
// import css
import 'vue3-emoji-picker/css'
// import ElScroll from "element-plus"
import {ElScrollbar} from "element-plus";
import {ElBadge} from "element-plus";
// import { stringify } from '@vueuse/docs-utils'
import type { Ref } from 'vue'
import { reactive, ref } from 'vue'
import { useFileSystemAccess } from '@vueuse/core'
import {stringify} from "qs";
import apiFile from "../../api/modules/file.ts";
import api from "@/api";
// const demo = ref()
const files = ref([])
const dataType = ref('Blob') as Ref<'Text' | 'ArrayBuffer' | 'Blob'>
const res = useFileSystemAccess({
    dataType,
    // multiple: false,
    types: [{
        description: 'text',
        accept: {
            'text/plain': ['.txt', '.html','.md'],
        },
    },
      {
        description: "image",
        accept: {
          "image/plain": [".png", ".gif", ".jpeg", ".jpg",".svg"],
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

function uploadFiles() {
    for (var key in files.value) {
        if (files.value.hasOwnProperty(key)) {
            let file = files.value[key];
            let formData = new FormData()
            let fileBlob = new Blob([file.file], {type: file.fileMIME})
            formData.append('file', fileBlob);
            formData.append('fileName', file.fileName);
            formData.append('fileSize', file.fileSize);
            // ElMessage.success("添加文件：" + file.fileName)
            apiFile.uploadFile(formData).then(res => {
               if(res.code!=0)
               {
                 ElMessage({
                   message: res.descrption,
                   type: 'error'
                 })
               }else {
                  ElMessage({
                    message: '上传文件成功',
                    type: 'success'
                  })
                 files.value=[]
               }
            })
            // await api.post('/file',formData
            //  ).then(res=>{
            //    ElMessage.success("添加文件："+res.fileName.value)
            //  })
        }
    }
    // let formData = new FormData()
    // formData.append('file',file.file)
    // formData.append('fileName',file.fileName)
    // formData.append('fileSize',file.fileSize)
    // ElMessage.success("添加文件："+file.fileName)
    // formData.append('fileMIME',res.fileMIME.value)
   // await api.post('/file',formData
   //  ).then(res=>{
   //    ElMessage.success("添加文件："+res.fileName.value)
   //  })
}
async function addFile()
{
  await res.open()
    console.log(res)
  files.value.push({
    file: res.data.value,
    fileName: res.fileName.value,
    fileSize: res.fileSize.value,
    fileMIME: res.fileMIME.value
  })

}
const innerRef = ref(HTMLDivElement)
function removeFile(index:number)
{
  files.value.splice(index,1)
}
const windowActive = ref([]);
const scrollHeight = ref(0);
const loaded = ref(false);
const row = ref(1);
const activeMessageIndex = ref(0);
const typing = ref('');
const messages = ref([
  // ... your messages data
]);
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

const  updateScroll = () => {
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
    const res = await apiMessage.getPrivateWindows(1);
    windows.value = res.data.windows;
    showButtons.value = new Array(windows.value.length).fill(false);
    windowActive.value = new Array(windows.value.length).fill(false);
    windowActive.value[0] = true;
    console.log(windows.value);
    windowLoaded.value = true;

  } catch (error) {
    console.error('Error loading windows:', error);
  }
};

const loadMessages = async () => {
  try {
    const res = await apiMessage.getPrivateMessages(1);
    console.log(res.data);
    messages.value = res.data.messages;
    // setScroll(200);
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

const activeMail = (index) => {
  document.querySelector('.mail-detail')?.scrollTo(0, 0);
};

const removeMailItem = (index) => {
  windows.value.splice(index, 1);
};

const keydown = (e) => {
  if (!e.shiftKey && e.keyCode == 13) {
        e.cancelBubble = true;
        //ie阻止冒泡行为
        e.stopPropagation();//Firefox阻止冒泡行为
        e.preventDefault();//取消事件的默认动作*换行//以下处理发送消息代码
        // onSendMsg();
        // ElMessage.success("发送消息:"+typing)
        console.log(typing.value);
        if(files.value.length>0)
        {
              uploadFiles();
        }
        ElMessage.success('发送消息:' + typing.value);
        typing.value = '';
        // console.log(this.typing);
  }
};

const handleSelectEmoji = (emoji) => {
  typing.value += emoji.i;
};

onMounted(() => {
  setObserver();
  loadWindows();
  loadMessages();

});

</script>
<script lang="ts">
</script>
<template>
  <div>
    <el-row justify="start">
      <el-col :span="4" >
        <PageMain style="height: 100vh;background:#2C2D2F">
          <div >
            <div class="mail-header">
              <el-row justify="space-between">
                <el-col :span="8">
                  <el-row justify="start">
                    <el-col :span="18">
                      <el-text >
                        <strong>收件箱</strong></el-text>
                    </el-col>
                  </el-row>
                </el-col>
                <el-col :span="8">
                  <el-button type="info" text  style="margin-left: 30px;width: 20px;">
                    <SvgIcon :size="16" name="fluent:add-12-filled" />
                  </el-button>
                </el-col>
              </el-row>

              <br>
            </div>
          <div class="window-list">
            <el-scrollbar height="80vh" style="width: 100%">
              <div v-for="(item, index) in windows" :key="index" class="window-item">
                <div class="window mt-1" :index="index" style="
      width: 100%;
      display: flex;
      background: #2C2D2F;
      margin: auto 0;
      height: 60px;
    " @click="activeMail(index)"  @mouseenter="showButton(index)" @mouseleave="hideButton(index)">
                  <div style="width: 100%; display: flex; align-items: center;">
                    <el-space>
                      <el-badge is-dot class="item" :type="item.online ? 'success' : 'info'" style="margin-left: 10px;">
                        <el-avatar :src="item.avatar" :size="36" shape="circle"/>
                      </el-badge>
<!--                      <Avatar :online="item.online" :avatar="item.avatar" :size="36"/>-->
                      <span style="width: 80px">
            <el-text truncated>{{item.unick}}</el-text>
          </span>
                      <el-button type="info" text style="margin-right: 5px; " @click="removeMailItem(index)" circle
                                 v-show="showButtons[index]"
                      >
                        <SvgIcon :size="16" name="octicon:x-12" />
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
        <PageMain  style="height: 100%; background: #333436">
          <div class="mail-detail">
<!--              <el-empty description="暂无私信" v-if="windows.length===0"/>-->
            <el-scrollbar :style="{height:scrollHeight}" ref="rightScrollBar">
              <div ref="innerRef">
              <div  v-for="(item,index) in messages" :key="index" >
              <Message :from="item.from" :to="item.to" :fromMessage="item.fromMessage" :time="item.fromMessage.meta.time" :toMessage="item.toMessage">
                <template #avatar>
                  <el-avatar :src="windows[activeMessageIndex].avatar" :size="40" shape="circle" />
                </template>
<!--                <template #resp>-->
<!--                  <div v-for="one in item.fromMessage.meta.resp" :key="one" >-->
<!--                    <el-popover-->
<!--                        style="width: fit-content"-->
<!--                            placement="top"-->

<!--                            trigger="hover"-->
<!--                    >-->
<!--                      <template #default>-->
<!--                        <span>-->
<!--                           有{{one.count}}位用户反应了:{{one.emoji}}-->
<!--                        </span>-->
<!--                      </template>-->
<!--                      <template #reference>-->
<!--                    <el-tag type="info" class="m-1" style="width: 45px;height: 30px">-->
<!--                      {{one.emoji}}-->
<!--                      <span v-if="one.count>99">-->
<!--                        99+-->
<!--                      </span>-->
<!--                      <span v-else>-->
<!--                        {{one.count}}-->
<!--                      </span>-->
<!--                    </el-tag>-->
<!--                      </template>-->
<!--                    </el-popover>-->
<!--                  </div>-->
<!--                </template>-->
              </Message>
              </div>
              </div>
            </el-scrollbar>
          </div>
<!--     <FixedActionBar>-->
<!--        <template #default>-->
<!--          <el-button type="info" text  style="margin-left: 40px;" @click="console.log(str.file)"/>-->
            <div style="position: fixed; width: 53vw" class="bottom-5 " id="main-below" ref="demo">
          <div class="file-show flex-1" v-if="files.length>0"
                    style="height: 200px;width: inherit; border-radius: 5px;background: #3A3B3E; padding: 0 10px;">
<!--                {{content}}-->
              <el-scrollbar>
                <div class="scrollbar-flex-content">
                  <p v-for="(item, index) in files" :key="index" class="scrollbar-demo-item">
                    <span class="positioned-element">
                        <el-button-group size="small" style="background: #2C2D2F">
<!--                          <el-tooltip content="预览文件" placement="top-end" >-->
<!--                          <el-button  text>-->
<!--                            <SvgIcon name="mdi:eye" />-->
<!--                          </el-button>-->
<!--                          </el-tooltip>-->
<!--                        <el-tooltip content="修改文件" placement="top" >-->
<!--                            <el-button text>-->
<!--                               <SvgIcon name="mdi:edit" />-->
<!--                            </el-button>-->
<!--                           </el-tooltip>-->
                           <el-tooltip content="移除文件" placement="top-start" >
                                      <el-button text type="danger" @click="removeFile(index)">
                                  <SvgIcon name="mdi:delete" />
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
                <el-row id="inputBar" justify="start"
                        style="width: 100%;border-radius: 5px;background: #3A3B3E; padding: 0 10px;overflow: hidden">
<!--                >-->
                    <el-col :span="1" style="margin: auto">
                        <el-popover
                                placement="top-start"
                                :width="200"
                                trigger="click"
                        >
                            <template #reference>
                                <SvgIcon name="carbon:add-filled" :size="24" class="tool"/>
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
                        <el-input placeholder="Shift+Enter 换行 | Enter 发送" v-model="typing"
                                  type="textarea"   :autosize="{ minRows: 1, maxRows: 15 }"
                                  maxlength="2048" show-word-limit resize="none"
                                  style="width: 100%;border-radius: 5px;background: #3A3B3E; padding: 0 10px;
                                  margin-top: 8px; margin-bottom: 8px;"
                                  @keydown="keydown"
                        ></el-input>
                    </el-col>
                    <el-col :span="1" style="margin: auto">
<!--                        <el-button type="info" text  style="margin-left: 40px;">-->
                        <SvgIcon :size="24" name="fluent:gif-24-filled" class="tool" />
<!--                    </el-button>-->
                    </el-col>
                    <el-col :span="1" style="margin: auto">
<!--                        <el-button type="info" text  style="margin-left: 40px;">-->
                        <SvgIcon :size="24" name="fluent:sticker-24-filled" class="tool"
                        />
<!--                    </el-button>-->
                    </el-col>
                    <el-col :span="1" style="margin: auto">
                      <el-popover
                          hidden
                          placement="top"
                          :width="300"
                          trigger="click"
                      >
                        <template #reference>
                          <SvgIcon :size="24" name="fluent:emoji-24-filled" class="tool"/>
                        </template>
                        <emoji-picker :native="true" @select="handleSelectEmoji" theme="dark"
                        style="background: #1C1D1E;"
                        />
                      </el-popover>
                    </el-col>
                </el-row>
              </div>
<!--        </template>-->
<!--     </FixedActionBar>-->
          </div>
        </PageMain>
      </el-col>
        <el-col :span="6">
<!--          <el-button @click="setScroll(200)">设置滚动条</el-button>-->
                   <UserCard v-if="windowLoaded"
                           :fromUid="windows[activeMessageIndex].uid" :toUid="windows[activeMessageIndex].uid"/>
        </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.mail-item :hover {
  background-color:inherit;
}
.tool:hover{
  color: #DDDEE0;
  cursor: pointer;
}
.add-item{
  padding: 5px 10px;
  color: white;
}
.add-item:hover{
  background: #85ce61;
  cursor: pointer;
  border-radius: 5px;
}
.scrollbar-flex-content {
  display: flex;

}
.el-tag:hover{
  //background: #85ce61;
  cursor: pointer;
  border-color: #B4B6BA;
}
.el-tag:focus{
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
.window :hover{
  background:#37373B;
  border-radius: 5px;
}
.positioned-element{
  position: absolute;
  top: 0;
  right: 0;
  //width: 20px;
}
//.el-input :focus{
//  border-color: #85ce61;
//}
</style>
