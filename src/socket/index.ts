import Message from 'vue-m-message';
import useUserStore from "@/store/modules/user.ts";
import {ref} from 'vue';
import {ElMessage} from "element-plus";

const BASE_URL = import.meta.env.VITE_APP_BASE_WS_URL;
const MAX_RECONNECT_ATTEMPTS = 30;
const RECONNECT_DELAY = 1000;
const HEARTBEAT_INTERVAL = 20000;

const reconnectAttempts = ref(0);
let websocketInstance: WebSocketAPI | null = null; // Singleton instance

class WebSocketAPI {
    private socket: WebSocket;
    private readonly keep: boolean ;
    private messageQueue: string[];
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
    private heartbeatTimer: number | null = null;
    private reconnectTimer: number | null = null;
    // public readonly uid: string;

    public constructor(sub: string, messageHandler: (data: any) => void, keep: boolean = true,token:string ) {
        this.token = token;
        this.url = BASE_URL + sub;
        this.sub = sub;
        this.keep = keep;
        this.socket = new WebSocket(this.url, [this.token]);
        this.callbacks = {};
        this.messageQueue = [];
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
            reconnectAttempts.value = 0;
            if (this.reconnectTimer) {
                clearTimeout(this.reconnectTimer);
                this.reconnectTimer = null;
            }
            if (this.messageQueue.length > 0) {
                const queue = [...this.messageQueue];
                this.messageQueue = [];
                queue.forEach((msg) => this.socket.send(msg));
            }
            this.startHeartbeat();
        };

        this.socket.onclose = (event) => {
            console.log('WebSocket connection closed:', event);
            this.stopHeartbeat();
            if(this.keep)
                this.handleReconnect();
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        this.socket.onmessage = (event) => {

            let data = JSON.parse(event.data);
            switch (data.type) {
                case 'offer':
            
                    if (this.callbacks.onReceiveOffer) {
                        console.log('offer')
                        
                        this.callbacks.onReceiveOffer(data);
                    }
                    break;
                case 'answer':
                    if (this.callbacks.onReceiveAnswer) {
                        console.log('answer')
                        this.callbacks.onReceiveAnswer(data);
                    }
                    break;
                case 'ice':
                    if (this.callbacks.onReceiveICE) {
                        console.log('ice')
                        this.callbacks.onReceiveICE(data);
                    }
                    break;
                    case 'reject':
                    if(this.callbacks.onReject){
                        this.callbacks.onReject(data);
                    }
                    break;
                default:
                    if (this.callbacks.messageHandler) {
                        this.callbacks.messageHandler(data);
                    }else
                        console.log('unknown message')
                // this.handleMessage(data);
            }
        };

    }
    setOnReject(callback:(data:any)=>void){
      this.callbacks.onReject=callback;
    }
    setOnReceiveOffer(callback: (data: any) => void) {
        this.callbacks.onReceiveOffer = callback;
    }
    setOnReceiveAnswer(callback: (data: any) => void) {
        this.callbacks.onReceiveAnswer = callback;
    }
    setOnReceiveICE(callback: (data: any) => void) {
        this.callbacks.onReceiveICE = callback;
    }
    setMessageHandler(callback: (data: any) => void) {
        this.callbacks.messageHandler = callback;
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
        const payload = JSON.stringify(data);
        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(payload);
        } else {
            this.messageQueue.push(payload);
            console.error('WebSocket connection not established. Message queued.');
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
        this.stopHeartbeat();
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        this.socket.close();
        websocketInstance = null; // Reset the singleton instance when closing the connection
    }

    private handleReconnect() {
        if (this.reconnectTimer) {
            return;
        }
        this.reconnectTimer = window.setTimeout(() => {
            this.reconnectTimer = null;
            reconnectAttempts.value++;
            if (reconnectAttempts.value <= MAX_RECONNECT_ATTEMPTS) {
                // this.socket.close();
                this.socket = new WebSocket(this.url, [this.token]);
                this.init();
                console.log('Reconnecting...');
            } else {
                console.log('Max reconnect attempts reached');
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
        this.stopHeartbeat();
        this.heartbeatTimer = window.setInterval(this.sendHeartbeat.bind(this), HEARTBEAT_INTERVAL);
    }

    private stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }
}

export default WebSocketAPI;


