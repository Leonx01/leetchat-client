<script setup lang="ts" xmlns="">
import {ElMessage} from "element-plus";
import useUserStore from "@/store/modules/user.ts";

defineOptions({
  name: 'Message',
})

defineProps<{
  to?: object
  from?:object
  time?:string
  fromMessage?: object
  toMessage?:object

}>()
import apiFile from "@/api/modules/file.ts";
const userStore = useUserStore()
const slots = useSlots()
function download(key){
  // console.log(key)
  // apiFile.getPreviewUrl(key).then((res)=>{
  //   if(res.code==0){
      console.log(key)
      const downloadUrl = key
      // 创建一个隐藏的 <a> 标签
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', ''); // 设置下载属性
      document.body.appendChild(link);
      link.click(); // 模拟点击进行下载
      document.body.removeChild(link); // 下载完成后移除 <a> 标签
  //   }else{
  //    ElMessage(
  //       {
  //         message: res.description,
  //         type: 'error'
  //       }
  //    )
  //   }
  // }).catch((err)=>{
  //   ElMessage.error('预览失败')
  // })
}
const imageUrl = ref('')
</script>
<template>
  <div class="justify-start bg-[var(--g-container-bg)] px-5 flex" id="message">
    <div class="left mr-2 mt-2">
      <SvgIcon name="fontisto:reply" class="ml-5" :size="20" style="transform: scaleX(-1);color: #8c858f" v-if="toMessage"/>
      <br>
      <slot name="avatar" />
    </div>
    <div class="right">
    <div class="m-1">
      <div class="reply" v-if="toMessage">
            <slot name="to">
              <el-text type="success" class="username mb-" size="small" truncated>
                @{{to.uname}}&nbsp;:
              </el-text>
            </slot>
            <el-text size="small" type="info" truncated class="ml-2" style="width: 200px">
            <div v-if="toMessage.type==='text'">
              {{toMessage.content.substring(0,20)}}
            </div>
            <div v-if="toMessage.type==='image'">
                <SvgIcon name="fa-solid:file-image" style="color: #85ce61"/>
                图片消息</div>
            <div v-if="toMessage.type==='file'">
                <SvgIcon name="bx:file" style="color: #85ce61"/>
                文件消息</div>
              <div v-if="toMessage.type==='audio'">
                <SvgIcon name="bx:file-audio" style="color: #85ce61"/>
                音频消息</div>
              <div v-if="toMessage.type==='video'">
                <SvgIcon name="bx:file-video" style="color: #85ce61"/>
                视频消息</div>

            </el-text>
      </div>
      <div class="meta " style="justify-content: start">
            <el-text   class="username">
              {{from.uname}}<span v-if="from.uname===userStore.account" style="color:#FFF;font: bold">(me)</span>:
            </el-text>
            <el-text type="info" size="small" class="ml-2">
              {{new Date(time).toLocaleString()}}
            </el-text>
      </div>

          <div class="content ">
            <markdown-preview v-if="fromMessage.type=='text'" style="background: #333436;color:white; font-size: small;" :source="fromMessage.content"/>
            <div v-if="fromMessage.type=='image'">
              <br>
                <ImagePreview :src="fromMessage.content" style="max-width: 200px;max-height: 200px"/>
<!--              <img src="http://leetchat.oss-cn-beijing.aliyuncs.com/Server1/97bd2672-1eb7-4aec-afcf-adc1984f006c.png?Expires=1713716444&OSSAccessKeyId=LTAI5tKXXKGoSDVWvNYK2DiB&Signature=sfWtrfPV2rtw%2BDjgfKXypWRHfqI%3D" style="max-width: 200px;max-height: 200px"/>-->
              <br>
              </div>
            <div v-if="fromMessage.type=='file'" >
              <br>
                <div class="file-content flex flex-wrap"  @click="download(fromMessage.content)" style="
                position: relative;
                border-radius: 5px;background: #2C2D2F;width: 400px;height: 80px; align-items: center">
                 <SvgIcon class="ml-5" name="subway:file-13" :size="44" style="color: #85ce61"/>
                    <div>
                        <div><el-text class="ml-2" style="width: 200px">
                            {{fromMessage.name}}
                            </el-text>
                        </div>
<!--                        <div>-->
<!--                            <el-text type="info" size="small" class="ml-2" style="width: 200px">-->
<!--                                {{fromMessage.meta.size}}-->
<!--                            </el-text>-->
<!--                        </div>-->
                    </div>
                    <div style="position: absolute;right: 30px">
                        <el-link  :href="fromMessage.content" target="_blank">
                            <SvgIcon name="bx:bx-download" :size="18"/>
                        </el-link>
                    </div>
                </div>
            </div>
            <div v-if="fromMessage.type=='audio'">
              <br>
                <audio controls style="width: 400px">
                    <source :src="fromMessage.content" type="audio/mpeg">
                    Your browser does not support the audio element.
                </audio>
              <br>
            <br>

          </div>
            <div v-if="fromMessage.type=='video'">
              <br>
                <video controls style="width:400px">
                    <source :src="fromMessage.content" type="video/mp4">
                    Your browser does not support the video element.
                </video>
              <br>
            <br>
<!--          <br>-->
<!--      <ElButton type="text" class="text-gray-400" style="font-size: small" @click="slots.resp=!slots.resp">回复</ElButton>-->
          <div v-if="slots.resp" class="resp flex flex-wrap" >
            <slot name="resp"/>
          </div>
        </div>
        </div>
    </div>
    </div>
  </div>
</template>
<style scoped>
.username:hover{
  text-decoration: underline 1px;
  cursor: pointer;
}
#message:hover{
  background: #303133;
}
</style>

<script lang="ts">
import MarkdownPreview from '@uivjs/vue-markdown-preview';
import '@uivjs/vue-markdown-preview/markdown.css';
export default {
  components: {
    MarkdownPreview
  },
}
</script>
