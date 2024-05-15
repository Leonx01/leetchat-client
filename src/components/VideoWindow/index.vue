<script lang="ts">
import apiUser from '../../api/modules/user'
import {ElMessage} from "element-plus";
import Avatar from "@/components/Avatar/index.vue";
export default {
    name: 'VideoWindow',
    props: {
        src: {
            type: String,
            // required: true
        },
    },
    setup(props) {
        const { src} = props
        // console.log(fromUid, toUid)
        return {
            src
        }
    },
    data(){
        return{
            load:false,
        }
    },
    methods:{
        // async loadUserInfo(){
        //
        //     let res = await apiUser.getUserInfo(this.fromUid)
        //     this.userInfo = res.data
        //     this.userInfo.createtime = new Date(this.userInfo.createtime).toLocaleDateString();
        //     // ElMessage.success('加载用户信息'+this.userInfo.unick)
        //     this.load = true
        //     //父组件异步请求参数导致子组件未加载完毕，导致子组件无法获取父组件传递的参数
        //     //解决方法：采用v-if设置同步锁，延迟加载子组件

        // }
    }
    ,mounted() {
        // this.loadUserInfo()//

    }
}
</script>
<template>
<div>
  <div id="videos">
    <video autoplay playsinline  style="height: 300px;width: 400px">
      <source src= "https://nileonx.oss-cn-beijing.aliyuncs.com/files/2024-04-25-21-15-52.mp4?Expires=1714242291&OSSAccessKeyId=TMP.3KhCQ33TGfUVBdEocu5fS6JrirrRWrmcd4sJJV21c5dWFekGHHokNnvjzqXc8xXex1ZiEbay8u2EKokEEQMeAwGoCroGup&Signature=8T1v5dnzi%2FodcyNqONrSdMXm7Jc%3D"
              type="video/mp4">
    </video>
<!--    <video :src="src" autoplay playsinline></video>-->
  </div>
</div>
</template>

<style scoped lang="scss">

</style>
