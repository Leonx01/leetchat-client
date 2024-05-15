<script lang="ts">
import apiUser from '../../api/modules/user'
import {ElMessage} from "element-plus";
import Avatar from "@/components/Avatar/index.vue";

export default {
  name: 'UserCard',
  components: {Avatar},
  props: {
    fromUid: {
      type: String,
      required: true
    },
    // toUid: {
    //   type: Object,
    //   required: true
    // },
  },
  setup(props) {
    const {fromUid} = props
    // console.log(fromUid, toUid)
    return {
      fromUid,
    }
  },
  computed:{
    bannerStyle(){
      return {
        // 'linear-gradient(135deg, #3498db, #6ab8e1)',
        background: this.userInfo && this.userInfo.background ? this.userInfo.background : '',
        height: '120px',
        position: 'relative'
      }
    },
  },
  data() {
    return {
      userInfo: {},
      load: false,
    }
  },
  methods: {
    async loadUserInfo() {

      let res = await apiUser.getUserInfo(this.fromUid)
      this.userInfo = res.data
      this.userInfo.createtime = new Date(this.userInfo.createtime).toLocaleDateString();
      this.userInfo.background = 'linear-gradient(135deg,#6ab8e1, #6ab8e1)'
      // ElMessage.success('加载用户信息'+this.userInfo.unick)
      this.load = true
      //父组件异步请求参数导致子组件未加载完毕，导致子组件无法获取父组件传递的参数
      //解决方法：采用v-if设置同步锁，延迟加载子组件
    }
  }
  , mounted() {
    this.loadUserInfo()//

  },
  watch: {
    fromUid: {
      handler: function (newVal, oldVal) {
        console.log('fromUid')
        this.loadUserInfo()
      },
      immediate: true
    }
  }
}
</script>
<template>
  <div class="user-card" style="background: #2C2D2F;height:100%;border-radius: 10px">
    <div class="banner" :style="bannerStyle">
      <Avatar v-if="load"
              :online="userInfo.online" :avatar="userInfo.avatar" :size="110"
              style="position: absolute;left: 25%;top: 90%;transform: translate(-50%,-50%);"
      />
    </div>
    <!--      <div style="height: px"></div>-->
    <div class="info mt-15 mr-5 ml-5" style="background: #121213;border-radius: 8px;height:60%;width: 90%;">
      <div class="ml-8 mr-8">
        <br>
        <div class="name">
          <div style="font-size: medium">{{ userInfo.unick }}</div>
          <div class="mt-1" style="font-size: small;color: #DDDEE0">{{ userInfo.uname }}</div>
        </div>
        <el-divider class="mt-3 mb-3"></el-divider>
        <div class="date">
          <div style="font-size: medium">注册时间</div>
          <div class="mt-1" style="font-size: small;color: rgba(240,243,243,0.49)">{{ userInfo.createtime }}</div>
        </div>
        <el-divider class="mt-3 mb-3"></el-divider>
        <div class="memo">
          <div style="font-size: medium">个性签名</div>
          <div class="mt-1" style="font-size: small;color: rgba(240,243,243,0.49)">{{ userInfo.selfinfo }}</div>
        </div>
      </div>

    </div>
  </div>
  <!--<div class="user-card "-->
</template>
