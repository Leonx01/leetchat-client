<script lang="ts">
import WebSocketAPI from "../../socket";
import {ElMessage} from "element-plus";
import useUserStore from "@/store/modules/user.ts";
import {useSignalChannel} from "@/store/modules/signalChannel.ts";

export default {
  name: 'ChatRoom',
  props: {
    uid:{
      type:Number,
      required:true
    },
    // websocket:{
    //   type:WebSocketAPI,
    //   required:true
    // }
  },
  setup(props) {
    const {uid} = props
      const signalingChannel = useSignalChannel();
    const localStream = signalingChannel.localStream
    const remoteStream = signalingChannel.remoteStream
    // console.log(fromUid, toUid)
    return {
        signalingChannel,
        uid,
        localStream,
        remoteStream

    }
  },
  data() {
    return {
        // localStream: null as any,
        // remoteStream: null as any,
    }
  },
  mounted() {
    // ElMessage.success('mounted')
    // this.init()
    this.signalingChannel.initRTC(String(this.uid)).then(stream => {
      // this.localStream = stream
      // this.$refs.localStreamRef.srcObject = stream
    })

      // this.toggleCamera()
      // this.toggleMic()
      // console.log(signalingChannel.localStream+"Dadads")
      // setTimeout(() => {

      // }, 1000)

      // this.$refs.localStreamRef.srcObject = signalingChannel.localStream
    // this.$refs.remoteStreamRef.srcObject = signalingChannel.remoteStream
  },
  methods:
    {

    toggleCamera() {
      let stream = this.$refs.localStreamRef.srcObject
        console.log(stream)
      let videoTrack = stream.getTracks().find(track => track.kind === 'video')

      if (videoTrack.enabled) {
        videoTrack.enabled = false
        document.getElementById('camera-btn').style.backgroundColor = 'rgb(255, 80, 80)'
      } else {
        videoTrack.enabled = true
        document.getElementById('camera-btn').style.backgroundColor = 'rgb(103,194,58)'
      }

    },
    toggleMic() {
      // this.initLocalStream()
      let stream = this.$refs.localStreamRef.srcObject
      let audioTrack = stream.getTracks().find(track => track.kind === 'audio')

      if (audioTrack.enabled) {
        audioTrack.enabled = false
        document.getElementById('mic-btn').style.backgroundColor = 'rgb(255, 80, 80)'
      } else {
        audioTrack.enabled = true
        document.getElementById('mic-btn').style.backgroundColor = 'rgb(103,194,58)'
      }

    },

    // initLocalStream() {
    //   if (this.localStream) return Promise.resolve(this.localStream);
    //
    //   return new Promise((resolve, reject) => {
    //     navigator.mediaDevices.getUserMedia(this.constraints).then(stream => {
    //       this.$refs.localStreamRef.srcObject = stream;
    //       // this.$refs.remoteStreamRef.srcObject = stream;
    //       this.localStream = stream;
    //       resolve(stream);
    //     }).catch(error => {
    //       reject(error);
    //     });
    //   });
    // },

    handleClose() {
      this.signalingChannel.closeRTC()
      // if (this.localStream) this.localStream.getTracks().forEach(track => track.stop())
      // // this.localStream.getTracks().forEach(track => track.stop())
      // this.localStream = null
      this.$router.push({name: 'MailBox'})
      // this.close()
    },
        test(){
        console.log("测试")
        console.log(this.signalingChannel.remoteStream)
        this.$refs.remoteStreamRef.srcObject = this.signalingChannel.remoteStream
          document.getElementById('user-2').style.display = 'block'
          document.getElementById('user-1').classList.add('smallFrame')
        }
  },
    watch: {
        'signalingChannel.remoteStream': {
            handler: function (newVal, oldVal) {
                console.log("remoteStream");
                console.log(newVal);
                if (newVal)
                {
                  // document.getElementById('user-2').style.display = 'block'
                  this.$refs.remoteStreamRef.srcObject = newVal;
                  document.getElementById('user-2').style.display = 'block'
                  document.getElementById('user-1').classList.add('smallFrame')

                }

                    //display remote stream
            },
            deep: true
        },
        'signalingChannel.localStream': {
            handler: function (newVal, oldVal) {
                console.log("localStream");
                console.log(newVal);
                if (newVal)
                    this.$refs.localStreamRef.srcObject = newVal;
            },
            deep: true
        }
    }
        //signalingChannel.remoteStream
}
</script>
<template>
  <div>
<!--    <el-button @click="test()">测试</el-button>-->
    <div id="videos">
      <video class="video-player" ref="localStreamRef"
             id="user-1" autoplay playsinline></video>
        <video class="video-player" ref="remoteStreamRef"
               id="user-2" autoplay playsinline></video>
    </div>

    <div id="controls">

      <div class="control-container" id="camera-btn" @click="toggleCamera">
        <img src="/icons/camera.png"/>
      </div>

      <div class="control-container" id="mic-btn" @click="toggleMic">
        <img src="/icons/mic.png"/>
      </div>

      <div>
        <div class="control-container" id="leave-btn" @click="handleClose">
          <img src="/icons/phone.png"/>
        </div>
      </div>

    </div>
  </div>
</template>
<style scoped lang="scss">
*{
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#videos{
  display: grid;
  grid-template-columns: 1fr;
  height: 100vh;
  overflow:hidden;
}

.video-player{
  background-color: black;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

#user-2{
  display: none;
}

.smallFrame{
  position: fixed;
  top: 20px;
  left: 20px;
  height: 300px;
  width: 500px;
  border-radius: 5px;
  border:2px solid rgb(103, 194, 58);
  -webkit-box-shadow: 3px 3px 15px -1px rgb(103, 194, 58);
  box-shadow: 3px 3px 15px -1px rgba(0,0,0,0.77);
  z-index: 999;
}


#controls{
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform:translateX(-50%);
  display: flex;
  gap: 1em;
}


.control-container{
  background-color: rgb(103, 194, 58);
  padding: 20px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

.control-container img{
  height: 30px;
  width: 30px;
}

#leave-btn{
  background-color: rgb(255,80,80, 1);
}

@media screen and (max-width:600px) {
  .smallFrame{
    height: 80px;
    width: 120px;
  }

  .control-container img{
    height: 20px;
    width: 20px;
  }
}
</style>
