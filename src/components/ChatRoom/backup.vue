<!--<script lang="ts">-->
<!--import WebSocketAPI from "../../socket";-->
<!--import {ElMessage} from "element-plus";-->
<!--import useUserStore from "@/store/modules/user.ts";-->
<!--export default {-->
<!--  name: 'ChatRoom',-->
<!--  props: {-->
<!--    close:{-->
<!--      type:Function,-->
<!--      required:true-->
<!--    },-->
<!--    websocket:{-->
<!--      type:WebSocketAPI,-->
<!--      required:true-->
<!--    }-->
<!--  },-->
<!--  setup(props) {-->
<!--    const {close, websocket} = props-->
<!--    // console.log(fromUid, toUid)-->
<!--    return {-->
<!--      close,-->
<!--      websocket-->
<!--    }-->
<!--  },-->
<!--  data() {-->
<!--    return {-->
<!--      SignalingChannel: null as any,-->
<!--      pc: null as any,-->
<!--      offerOptions: {-->
<!--        offerToReceiveVideo: true,-->
<!--        offerToReceiveAudio: true,-->
<!--      }as RTCOfferOptions,-->
<!--      pcList: [],-->
<!--      localPeerConnection: null as any,-->
<!--      remotePeerConnection: null as any,-->
<!--      config: {-->
<!--        iceServers: [-->
<!--          {-->
<!--            urls: "stun:stun.l.google.com:19302",-->
<!--          }-->
<!--        ]-->
<!--      },-->
<!--      constraints: {-->
<!--        video: {-->
<!--          width: {min: 640, ideal: 1920, max: 1920},-->
<!--          height: {min: 480, ideal: 1080, max: 1080},-->
<!--        },-->
<!--        audio: true-->
<!--      },-->
<!--      localStream: null as any,-->
<!--      // remoteStream:null,-->
<!--    }-->
<!--  },-->
<!--  unmounted() {-->


<!--  },-->
<!--  watch: {-->
<!--    websocket: {-->
<!--      handler: function (newVal, oldVal) {-->
<!--        if (newVal !== null)-->
<!--        {-->
<!--          this.init()-->
<!--          this.pc = this.initPeerConnection()-->
<!--        }-->
<!--        // this.init()-->
<!--        // this.pc = this.initPeerConnection()-->
<!--      },-->
<!--      immediate: true-->
<!--    }-->
<!--  },-->
<!--  mounted() {-->
<!--  },-->
<!--  methods: {-->
<!--    init() {-->
<!--      this.websocket.setOnReceiveAnswer(this.onReceiveAnswer)-->
<!--      this.websocket.setOnReceiveOffer(this.onReceiveOffer)-->
<!--      this.websocket.setOnReceiveICE(this.onReceiveIce)-->
<!--    },-->
<!--    initPeerConnection(){-->
<!--      const pc = new RTCPeerConnection(this.config);-->
<!--      //创建新的RTCPeerConnection对象-->
<!--      this.initLocalStream().then((stream: MediaStream) => {-->
<!--        stream.getTracks().forEach((track: MediaStreamTrack) => pc.addTrack(track, this.localStream));-->
<!--      })-->

<!--      //将本地流添加到RTCPeerConnection对象中-->
<!--      //将会触发icecandidate事件-->
<!--      pc.createOffer(this.offerOptions).then(offer => {-->
<!--        pc.setLocalDescription(offer);-->
<!--        //创建一个offer并将其设置为本地描述-->
<!--        //发送offer给对方-->
<!--        this.websocket.send({-->
<!--          type: 'offer',-->
<!--          offer,-->
<!--          sourceName: useUserStore().account,-->
<!--        });-->
<!--      });-->
<!--      //监听icecandidate事件-->
<!--      pc.onicecandidate = (event) => {-->
<!--        if (event.candidate) {-->
<!--          this.websocket.send({-->
<!--            type: 'ice',-->
<!--            iceCandidate: event.candidate,-->
<!--            sourceName: useUserStore().account,-->
<!--          });-->
<!--        }-->
<!--      };-->
<!--      pc.ontrack = (event) => {-->
<!--        this.$refs.remoteStreamRef.srcObject = event.streams[0];-->
<!--      };-->
<!--      return pc;-->
<!--    },-->
<!--    onReceiveOffer(data:any) {-->
<!--      // ElMessage.success('onReceiveOffer')-->
<!--      const {type,offer, sourceName} = data;-->
<!--      const pc = new RTCPeerConnection(this.config);-->
<!--      this.localStream.getTracks().forEach((track:MediaStreamTrack ) => pc.addTrack(track, this.localStream));-->
<!--      pc.setRemoteDescription(new RTCSessionDescription(offer));-->
<!--      pc.createAnswer().then(answer => {-->
<!--        pc.setLocalDescription(answer);-->
<!--        this.websocket.send({-->
<!--          type: 'answer',-->
<!--          answer,-->
<!--          sourceName: useUserStore().account,-->
<!--        });-->
<!--      });-->
<!--      pc.onicecandidate = (event) => {-->
<!--        if (event.candidate) {-->
<!--          this.websocket.send({-->
<!--            type: 'ice',-->
<!--            iceCandidate: event.candidate,-->
<!--            sourceName: useUserStore().account,-->
<!--          });-->
<!--        }-->
<!--      };-->
<!--      pc.ontrack = (event) => {-->
<!--        this.$refs.remoteStreamRef.srcObject = event.streams[0];-->
<!--      };-->
<!--      this.pc=pc;-->
<!--      //初始化PeerB的RTCPeerConnection对象-->
<!--    },-->
<!--    onReceiveAnswer(data:any) {-->
<!--      const {type, answer, sourceName} = data-->
<!--      this.pc.setRemoteDescription(new RTCSessionDescription(answer));-->
<!--      //设置远端描述-->
<!--    },-->
<!--    onReceiveIce(data:any) {-->
<!--      const {type, iceCandidate, sourceName} = data;-->
<!--      this.pc.addIceCandidate(new RTCIceCandidate(iceCandidate));-->
<!--      //添加iceCandidate-->
<!--    },-->
<!--    toggleCamera() {-->
<!--      this.initLocalStream()-->
<!--      let stream = this.localStream-->
<!--      let videoTrack = stream.getTracks().find(track => track.kind === 'video')-->

<!--      if (videoTrack.enabled) {-->
<!--        videoTrack.enabled = false-->
<!--        document.getElementById('camera-btn').style.backgroundColor = 'rgb(255, 80, 80)'-->
<!--      } else {-->
<!--        videoTrack.enabled = true-->
<!--        document.getElementById('camera-btn').style.backgroundColor = 'rgb(103,194,58)'-->
<!--      }-->

<!--    },-->
<!--    toggleMic() {-->
<!--      this.initLocalStream()-->
<!--      let stream = this.localStream-->
<!--      let audioTrack = stream.getTracks().find(track => track.kind === 'audio')-->

<!--      if (audioTrack.enabled) {-->
<!--        audioTrack.enabled = false-->
<!--        document.getElementById('mic-btn').style.backgroundColor = 'rgb(255, 80, 80)'-->
<!--      } else {-->
<!--        audioTrack.enabled = true-->
<!--        document.getElementById('mic-btn').style.backgroundColor = 'rgb(103,194,58)'-->
<!--      }-->
<!--    },-->

<!--    initLocalStream() {-->
<!--      if (this.localStream) return Promise.resolve(this.localStream);-->

<!--      return new Promise((resolve, reject) => {-->
<!--        navigator.mediaDevices.getUserMedia(this.constraints).then(stream => {-->
<!--          this.$refs.localStreamRef.srcObject = stream;-->
<!--          // this.$refs.remoteStreamRef.srcObject = stream;-->
<!--          this.localStream = stream;-->
<!--          resolve(stream);-->
<!--        }).catch(error => {-->
<!--          reject(error);-->
<!--        });-->
<!--      });-->
<!--    },-->

<!--    handleClose() {-->
<!--      if (this.localStream) this.localStream.getTracks().forEach(track => track.stop())-->
<!--      // this.localStream.getTracks().forEach(track => track.stop())-->
<!--      this.localStream = null-->
<!--      this.close()-->
<!--    },-->
<!--  },-->
<!--}-->
<!--</script>-->
<!--<template>-->
<!--  <div>-->
<!--    <el-button @click="()=>{ init}">测试</el-button>-->
<!--    <div id="videos">-->
<!--      <video ref="localStreamRef"-->
<!--             class="video-player" id="user-1" autoplay playsinline></video>-->
<!--      <video ref="remoteStreamRef"-->
<!--             class="video-player" id="user-2" autoplay playsinline></video>-->
<!--    </div>-->

<!--    <div id="controls">-->

<!--      <div class="control-container" id="camera-btn" @click="toggleCamera">-->
<!--        <img src="/icons/camera.png"/>-->
<!--      </div>-->

<!--      <div class="control-container" id="mic-btn" @click="toggleMic">-->
<!--        <img src="/icons/mic.png"/>-->
<!--      </div>-->

<!--      <div>-->
<!--        <div class="control-container" id="leave-btn" @click="handleClose">-->
<!--          <img src="/icons/phone.png"/>-->
<!--        </div>-->
<!--      </div>-->

<!--    </div>-->
<!--  </div>-->
<!--</template>-->
<!--<style scoped lang="scss">-->
<!--* {-->
<!--  margin: 0;-->
<!--  padding: 0;-->
<!--  box-sizing: border-box;-->
<!--}-->

<!--#videos {-->
<!--  display: grid;-->
<!--  grid-template-columns: 1fr;-->
<!--  height: 100vh;-->
<!--  overflow: hidden;-->
<!--}-->

<!--.video-player {-->
<!--  background-color: black;-->
<!--  width: 100%;-->
<!--  height: 100%;-->
<!--  object-fit: cover;-->
<!--}-->

<!--#user-2 {-->
<!--  //display: none;-->
<!--}-->

<!--.smallFrame {-->
<!--  position: fixed;-->
<!--  top: 20px;-->
<!--  left: 20px;-->
<!--  height: 170px;-->
<!--  width: 300px;-->
<!--  border-radius: 5px;-->
<!--  border: 2px solid #ff5050;-->
<!--  -webkit-box-shadow: 3px 3px 15px -1px rgba(0, 0, 0, 0.77);-->
<!--  box-shadow: 3px 3px 15px -1px rgba(0, 0, 0, 0.77);-->
<!--  z-index: 999;-->
<!--}-->


<!--#controls {-->
<!--  align-items: center;-->
<!--  justify-content: center;-->
<!--  width: 50%;-->
<!--  position: fixed;-->
<!--  bottom: 20px;-->
<!--  //left: 50%;-->
<!--  //transform:translateX(-50%);-->
<!--  display: flex;-->
<!--  gap: 1em;-->
<!--}-->


<!--.control-container {-->
<!--  background-color: rgb(103, 194, 58);-->
<!--  padding: 20px;-->
<!--  border-radius: 50%;-->
<!--  display: flex;-->
<!--  justify-content: center;-->
<!--  align-items: center;-->
<!--  cursor: pointer;-->
<!--}-->

<!--.control-container img {-->
<!--  height: 30px;-->
<!--  width: 30px;-->
<!--}-->

<!--#leave-btn {-->
<!--  background-color: rgb(255, 80, 80, 1);-->
<!--}-->

<!--@media screen and (max-width: 600px) {-->
<!--  .smallFrame {-->
<!--    height: 80px;-->
<!--    width: 120px;-->
<!--  }-->

<!--  .control-container img {-->
<!--    height: 20px;-->
<!--    width: 20px;-->
<!--  }-->
<!--}-->
<!--</style>-->
