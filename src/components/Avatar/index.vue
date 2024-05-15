<script lang="ts">
import {ElMessage} from "element-plus";
import reload from "@/views/reload.vue";

export default {
  name: 'Avatar',
  props: {
    avatar: {
      type: String,
      required: true
    },
    online: {
      type: Number,
      required: true
    },
    size: {
      type: Number,
      required: false,
    }
  },
  setup(props) {
    const {avatar, online, size} = props
    // console.log(fromUid, toUid)
    return {
      avatar,
      online,
      size
    }
  },
  data() {
    return {}
  },
  methods: {
    ReLocate() {
      console.log(this.size)
      console.log(this.avatar)//
      console.log(this.online)
      let cavatar = document.getElementsByClassName('avatar')[0]
      let conline = document.getElementsByClassName('online')[0]
      let csize = this.size
      cavatar.style.width = csize + 'px'
      cavatar.style.height = csize + 'px'
      conline.style.width = csize * 0.3 + 'px'
      conline.style.height = csize * 0.3 + 'px'
      conline.style.left = csize * 0.7 + 'px'
      conline.style.top = csize * 0.7 + 'px'
      // this.$forceUpdate()
      // while (this.avatar == null) {
      //   this.$forceUpdate()
      //   //
      // }

      // ElMessage.success('头像wedad更新')

    }
  }
  , mounted() {
    // ElMessage.success('头像已更新')
    this.ReLocate()

  },
  watch: {
    avatar(newValue, oldValue) {
      // this.ReLocate()
      // ElMessage.success('头像已更新')
    }

  }

}
</script>
<template>
  <div class="avatar" style="position: relative;">
    <el-avatar :size="size" :src="avatar"
               style="border: 8px solid #2C2D2F;position: absolute;
                   "></el-avatar>
    <div class="online" style="position: absolute;">
<div v-if="online==1">
  <el-tooltip content="在线" placement="top" effect="light" >
    <SvgIcon :size="size*0.3" name="wpf:online"
             style="border: 5px solid #2d2f2c; border-radius: 50%;color: #67c23a;background: #2C2D2F"
    ></SvgIcon>
  </el-tooltip>
</div>
<div v-if="online==0">
  <el-tooltip content="离线" placement="top" effect="light" >
    <SvgIcon :size="size*0.3" name="fa:circle-o"
             style="border-radius: 50%;border: 5px solid #2C2D2F;color: #8c858f;background: #2C2D2F" >
    </SvgIcon>
  </el-tooltip>
</div>

    </div>
  </div>


</template>

<style scoped lang="scss">

</style>
