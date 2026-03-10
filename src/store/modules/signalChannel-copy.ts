import {defineStore} from 'pinia'
import WebSocketAPI from "../../socket";
import {Action, ElMessage, ElMessageBox} from "element-plus";
import useUserStore from "@/store/modules/user.ts";
import {connect} from "socket.io-client";
import router from "@/router";
const config = {
    iceServers: [{
        urls: "stun:stun.l.google.com:19302",
    }]
}

const constraints = {
    video: {
        width: {min: 640, ideal: 1920, max: 1920}, height: {min: 480, ideal: 1080, max: 1080},
    }, audio: true
}
const offerOptions = {
    offerToReceiveVideo: true, offerToReceiveAudio: true,
}

export const useSignalChannel = defineStore('webRTC', {
    state: () => ({
        socket: null, pc: null, localStream: null, remoteStream: null,source:null,target:null,router:null
    }), actions: {
        connect(router:any) {
           if (this.router==null&&router!=null)
             this.router = router
            this.socket = new WebSocketAPI('/online-status', (data)=>{
                console.log(data)
            }, true,useUserStore().token)
            this.socket.setOnReceiveAnswer(this.onReceiveAnswer)
            this.socket.setOnReceiveOffer(this.onReceiveOffer)
            this.socket.setOnReceiveICE(this.onReceiveIce)
            this.socket.setOnReject(this.onReceiveReject)
            this.source = useUserStore().uid
        },
        initRTC(target: string): Promise<MediaStream | null> {
            if(this.localStream!=null)//如果已经有流了，直接返回
                return new Promise((resolve, reject) => {
                    resolve(this.localStream);
                })
            this.target = target
            // this.connect()
            return new Promise((resolve, reject) => {
                console.log(this.socket);
                this.pc = new RTCPeerConnection(config);
                console.log(this.pc);
                 navigator.mediaDevices.getUserMedia(constraints)
                    .then((stream: MediaStream) => {
                        this.localStream = stream;
                        console.log("STREAM" + stream);
                        stream.getTracks().forEach((track: MediaStreamTrack) =>
                            this.pc.addTrack(track, this.localStream));
                        this.pc.createOffer(offerOptions)
                            .then((offer: RTCSessionDescriptionInit) => {
                                this.pc.setLocalDescription(offer);
                                this.socket.send({
                                    type: 'offer',
                                    offer,
                                    sourceName:  this.source,
                                    targetName: this.target,
                                });
                            });
                        this.pc.onicecandidate = (event) => {
                            if (event.candidate) {
                                this.socket.send({
                                    type: 'ice',
                                    iceCandidate: event.candidate,
                                    sourceName:  this.source,
                                    targetName: this.target,
                                });
                            }
                        };
                        this.pc.ontrack = (event:any) => {
                            // ElMessage.success('ontrack')
                            this.remoteStream = event.streams[0];
                            console.log("RemoteStream");
                            console.log(this.remoteStream);
                        };
                        resolve(this.localStream); // 成功获取流后，使用 resolve 返回
                    })
                    .catch((error) => {
                        // ElMessage.error('getUserMedia error');
                        console.log(error.code);
                        console.log(error.name);
                        reject(error); // 遇到错误时，使用 reject 传递错误信息
                    });
            });
        }, onReceiveOffer(data: any) {
            // ElMessage.success('onReceiveOffer')
            const {type, offer, sourceName,targetName} = data;
            ElMessageBox.confirm(
                '收到用户' + sourceName + '的视频通话请求，是否接受？',
                '视频通话请求',
                {
                    confirmButtonText: '接收',
                    cancelButtonText: '拒绝',
                    type: 'warning',
                }
            )
                .then(() => {
                    ElMessage({
                        type: 'success',
                        message: '接受成功',
                    })
                    this.pc = new RTCPeerConnection(config);
                    navigator.mediaDevices.getUserMedia(constraints)
                        .then((stream: MediaStream) => {
                            this.localStream = stream;
                            this.localStream.getTracks().forEach((track: MediaStreamTrack) => this.pc.addTrack(track, this.localStream))
                            this.pc.setRemoteDescription(new RTCSessionDescription(offer));
                            //设置远端描述
                            this.pc.createAnswer().then((answer:any)=> {
                                this.pc.setLocalDescription(answer);
                                this.socket.send({
                                    type: 'answer', answer, sourceName:  targetName,targetName: sourceName,
                                });
                            });
                            this.pc.onicecandidate = (event:any) => {
                                if (event.candidate) {
                                    this.socket.send({
                                        type: 'ice', iceCandidate: event.candidate, sourceName:targetName,targetName:sourceName,
                                    });
                                }
                            };
                            this.pc.ontrack = (event:any) => {
                                // ElMessage.success('ontrack')
                                this.remoteStream = event.streams[0];
                            };

                        })
                    // const router = useRouter()
                    // 路由跳转
                    console.log(router)
                    // Navigate to MailBox page with sourceName as query parameter
                    // window.location.reload()
                    this.router.push({
                        path:'/MailBox/chatroom',
                        query: { uid:sourceName }
                    });
                    //初始化PeerB的RTCPeerConnection对象
                })
                .catch((err) => {
                    console.log(err);
                    this.socket.send({
                        type: 'reject',
                        description: '对方拒绝了您的视频通话请求',
                        sourceName:targetName,
                        targetName:sourceName,
                    });
                    // ElMessage({
                    //     type: 'info',
                    //     message: '已拒绝',
                    // })
                })
            //初始化PeerB的RTCPeerConnection对象
        }, onReceiveAnswer(data: any) {
            // ElMessage.success('onReceiveAnswer')
            const {type, answer, sourceName} = data
            this.pc.setRemoteDescription(new RTCSessionDescription(answer));
            //设置远端描述
        }, onReceiveIce(data: any) {
            const {type, iceCandidate, sourceName} = data;
            if(this.pc==null)
                return
            else {
                // ElMessage.success('onReceiveIce')
                this.pc.addIceCandidate(new RTCIceCandidate(iceCandidate));
            }

            //添加iceCandidate
        },onReceiveReject(data: any) {
            const {type, sourceName,description} = data;
            ElMessageBox.alert(
                description,
                {
                    confirmButtonText: '确定',
                    type: 'warning',
                }
            ).then(() => {
                if (this.pc) {
                    this.pc.close();
                    this.localStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
                    this.localStream = null;
                    this.remoteStream = null;
                    this.router.push({
                        path:'/MailBox/index',
                    });
                }
                // window.location.reload();
            })

        },
        closeRTC() {
            this.socket.send({
                type: 'reject',
                description: '对方已挂断',
                sourceName: this.source,
                targetName: this.target,
            })
            if (this.pc) {
                this.pc.close();
                this.localStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
                this.localStream = null;
                this.remoteStream = null;
                this.router.push({
                    path:'/MailBox/index',
                });
            }
        }
    }
})
