import Message from 'vue-m-message';
import useUserStore from "@/store/modules/user.ts";
import {ref} from 'vue';
import {ElMessage} from "element-plus";

const BASE_URL = import.meta.env.VITE_APP_BASE_WS_URL;
const MAX_RECONNECT_ATTEMPTS = 30;
const RECONNECT_DELAY = 1000;
const HEARTBEAT_INTERVAL = 60000;

const reconnectAttempts = ref(0);
let websocketInstance: WebSocketAPI | null = null; // Singleton instance

class WebSocketAPI {
    private socket: WebSocket;
    private readonly keep: boolean ;
    private callbacks: {
        resolve?: (data: any) => void,
        reject?: (error: any) => void,
        messageHandler?: (data: any) => void,
        onReceiveAnswer?: (data: any) => void,
        onReceiveOffer?: (data: any) => void,
        onReceiveICE?: (data: any) => void
        onReject?:(data:any)=>void
    };
    private readonly url: string;
    private readonly sub: string;
    private readonly token: string;
    // public readonly uid: string;

    public constructor(sub: string, messageHandler: (data: any) => void, keep: boolean = true,token:string ) {
        this.token = token;
        this.url = BASE_URL + sub;
        this.sub = sub;
        this.keep = keep;
        this.socket = new WebSocket(this.url, [this.token]);
        this.callbacks = {};
        this.callbacks.messageHandler=messageHandler;
        this.init();
    }



    public getStatus() {
        return this.socket.readyState;
    }
    init() {
        // this.socket = new WebSocket(this.url, [this.token]);
        this.socket.onopen = () => {
            console.log('WebSocket connection established.');
            this.startHeartbeat();
        };

        this.socket.onclose = (event) => {
            console.log('WebSocket connection closed:', event);
            if(this.keep)
                this.handleReconnect();
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.handleReconnect();
        };

        this.socket.onmessage = (event) => {

            let data = JSON.parse(event.data);
            switch (data.type) {
                case 'offer':
                    // ElMessage.success('收到offer')
                    if (this.callbacks.onReceiveOffer) {
                        console.log('收到offer')
                        // ElMessage.success('收到offer')
                        this.callbacks.onReceiveOffer(data);
                    }
                    break;
                case 'answer':
                    if (this.callbacks.onReceiveAnswer) {
                        console.log('收到answer')
                        // ElMessage.success('收到answer')
                        this.callbacks.onReceiveAnswer(data);
                    }
                    break;
                case 'ice':
                    if (this.callbacks.onReceiveICE) {
                        console.log('收到ice')
                        this.callbacks.onReceiveICE(data);
                    }
                    break;
                    case 'reject':
                      if(this.callbacks.onReject){
                        this.callbacks.onReject(data);
                      }
                default:
                    if (this.callbacks.messageHandler) {
                        this.callbacks.messageHandler(data);
                    }else
                        console.log('未处理的消息')
                // this.handleMessage(data);
            }
        };

    }
    setOnReject(callback:(data:any)=>void){
      this.callbacks.onReject=callback;
    }
    setOnReceiveOffer(callback: (data: any) => void) {
        // ElMessage.success('设置offer')
        this.callbacks.onReceiveOffer = callback;
    }
    setOnReceiveAnswer(callback: (data: any) => void) {
        this.callbacks.onReceiveAnswer = callback;
    }
    setOnReceiveICE(callback: (data: any) => void) {
        this.callbacks.onReceiveICE = callback;
    }

    getSid() {
        return this.sub.split('/')[2];
    }

    handleMessage(message: any) {
        const data = JSON.parse(message);
        if (data.status === 1) {
            if (data.error !== '') {
                Message.error(data.error, {
                    zIndex: 2000,
                });
                if (this.callbacks.reject) {
                    this.callbacks.reject(data);
                }
            } else {
                if (this.callbacks.resolve) {
                    this.callbacks.resolve(data);
                }
            }
        } else {
            // Handle other statuses
        }
        if (this.callbacks.messageHandler) {
            this.callbacks.messageHandler(data);
        }
    }

    public send(data: any) {
        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(data));
        } else {
            console.error('WebSocket connection not established.');
        }
    }

    request(data: any) {
        return new Promise((resolve, reject) => {
            this.callbacks.resolve = resolve;
            this.callbacks.reject = reject;
            this.send(data);
        });
    }

    close() {
        this.socket.close();
        websocketInstance = null; // Reset the singleton instance when closing the connection
    }

    private handleReconnect() {
        setTimeout(() => {
            reconnectAttempts.value++;
            if (reconnectAttempts.value <= MAX_RECONNECT_ATTEMPTS) {
                // this.socket.close();
                this.socket = new WebSocket(this.url, [this.token]);
                this.init();
                console.log('Reconnecting...');
            } else {
                console.log('超过最大重试次数，停止重连');
            }
        }, RECONNECT_DELAY);
    }

    private sendHeartbeat() {
        const Msg = {
            type: 'heartbeat'
        };
        this.send(Msg);
    }

    private startHeartbeat() {
        const heartbeatTimer = setInterval(this.sendHeartbeat.bind(this), HEARTBEAT_INTERVAL);
        return () => {
            clearInterval(heartbeatTimer);
        };
    }
}

export default WebSocketAPI;
