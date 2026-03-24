const userName = document.getElementById('userName'); // 鐢ㄦ埛鍚嶈緭鍏ユ
const roomName = document.getElementById('roomName'); // 鎴块棿鍙疯緭鍏ユ
const startConn = document.getElementById('startConn'); // 杩炴帴鎸夐挳
const joinRoom = document.getElementById('joinRoom'); // 鍔犲叆鎴块棿鎸夐挳
const hangUp = document.getElementById('hangUp'); // 鎸傛柇鎸夐挳
const videoContainer = document.getElementById('videoContainer'); // 閫氳瘽鍒楄〃
roomName.disabled = true;
joinRoom.disabled = true;
hangUp.disabled = true;
var pcList = []; // rtc杩炴帴鍒楄〃
var localStream; // 鏈湴瑙嗛娴?
var ws; // WebSocket 杩炴帴
// ice stun鏈嶅姟鍣ㄥ湴鍧€
var config = {
    'iceServers': [{
        'urls': 'stun:stun.l.google.com:19302'
    }]
};
// offer 閰嶇疆
const offerOptions = {
    offerToReceiveVideo: 1,
    offerToReceiveAudio: 1
};
// 寮€濮?
startConn.onclick = function () {
    ws = new WebSocket('wss://' + location.host);
    ws.onopen = evt => {
        console.log('connent WebSocket is ok');
        const sendJson = JSON.stringify({
            type: 'conn',
            userName: userName.value,
        });
        ws.send(sendJson); // 娉ㄥ唽鐢ㄦ埛鍚?
    }
    ws.onmessage = msg => {
        const str = msg.data.toString();
        const json = JSON.parse(str);
        switch (json.type) {
            case 'conn':
                console.log('杩炴帴鎴愬姛');
                userName.disabled = true;
                startConn.disabled = true;
                roomName.disabled = false;
                joinRoom.disabled = false;
                hangUp.disabled = false;
                break;
            case 'room':
                // 杩斿洖鎴块棿鍐呮墍鏈夌敤鎴?
                sendRoomUser(json.roomUserList, 0);
                break;
            case 'signalOffer':
                // 鏀跺埌淇′护Offer
                signalOffer(json);
                break;
            case 'signalAnswer':
                // 鏀跺埌淇′护Answer
                signalAnswer(json);
                break;
            case 'iceOffer':
                // 鏀跺埌iceOffer
                addIceCandidates(json);
                break;
            case 'close':
                // 鏀跺埌鎴块棿鍐呯敤鎴风寮€
                closeRoomUser(json);
            default:
                break;
        }
    }
}
// 鍔犲叆鎴栧垱寤烘埧闂?
joinRoom.onclick = function () {
    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
        const isSecureContext = window.isSecureContext === true;
        const message = isSecureContext
            ? 'This browser does not support audio/video calls.'
            : 'Audio/video calls require HTTPS or localhost.';
        console.error(message);
        alert(message);
        return;
    }
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(function (mediastream) {
        localStream = mediastream; // 鏈湴瑙嗛娴?
        addUserItem(userName.value, localStream.id, localStream);
        const str = JSON.stringify({
            type: 'room',
            roomName: roomName.value,
            streamId: localStream.id
        });
        ws.send(str);
        roomName.disabled = true;
        joinRoom.disabled = true;
    }).catch(function (e) {
        console.log(JSON.stringify(e));
    });
}
// 鍒涘缓WebRTC
function createWebRTC (userName, isOffer) {
    const pc = new RTCPeerConnection(config); // 鍒涘缓 RTC 杩炴帴
    pcList.push({ userName, pc });
    localStream.getTracks().forEach(track => pc.addTrack(track, localStream)); // 娣诲姞鏈湴瑙嗛娴?track
    if (isOffer) {
        // 鍒涘缓 Offer 璇锋眰
            pc.createOffer(offerOptions).then(function (offer) {
            pc.setLocalDescription(offer).then(r =>
                {
                    const str = JSON.stringify({ type: 'signalOffer', offer, userName });
                    ws.send(str);
                }
            ); // 璁剧疆鏈湴 Offer 鎻忚堪锛岋紙璁剧疆鎻忚堪涔嬪悗浼氳Е鍙慽ce浜嬩欢锛?
            // 鍙戦€?Offer 璇锋眰淇′护
        });
        // 鐩戝惉 ice
        pc.addEventListener('icecandidate', function (event) {
            const iceCandidate = event.candidate;
            if (iceCandidate) {
                // 鍙戦€?iceOffer 璇锋眰
                const str = JSON.stringify({ type: 'iceOffer', iceCandidate, userName });
                ws.send(str);
            }
        });
    }
    return pc;
}
// 涓烘瘡涓埧闂寸敤鎴峰垱寤篟TCPeerConnection
function sendRoomUser (list, index) {
    createWebRTC(list[index], true);
    index++;
    if (list.length > index) {
        sendRoomUser(list, index);
    }
}
// 鎺ユ敹 Offer 璇锋眰淇′护
function signalOffer (json) {
    const { offer, sourceName, streamId } = json;
    addUserItem(sourceName, streamId);
    const pc = createWebRTC(sourceName);
    pc.setRemoteDescription(new RTCSessionDescription(offer)).then(r => {}); // 璁剧疆杩滅鎻忚堪
    // 鍒涘缓 Answer 璇锋眰
    pc.createAnswer().then(function (answer) {
        pc.setLocalDescription(answer).then(r => {
            const str = JSON.stringify({ type: 'signalAnswer', answer, userName: sourceName });
            ws.send(str); // 鍙戦€?Answer 璇锋眰淇′护
        }); // 璁剧疆鏈湴 Answer 鎻忚堪

    });
    // 鐩戝惉杩滅瑙嗛娴?
    pc.addEventListener('', function (event) {
        document.getElementById(event.stream.id).srcObject = event.stream; // 鎾斁杩滅瑙嗛娴?
    });
}
// 鎺ユ敹 Answer 璇锋眰淇′护
function signalAnswer (json) {
    const { answer, sourceName, streamId } = json;
    addUserItem(sourceName, streamId);
    const item = pcList.find(i => i.userName === sourceName);
    if (item) {
        const { pc } = item;
        pc.setRemoteDescription(new RTCSessionDescription(answer)); // 璁剧疆杩滅鎻忚堪
        // 鐩戝惉杩滅瑙嗛娴?
        pc.addEventListener('addstream', function (event) {
            document.getElementById(event.stream.id).srcObject = event.stream;
        });
    }
}
// 鎺ユ敹ice骞舵坊鍔?
function addIceCandidates (json) {
    const { iceCandidate, sourceName } = json;
    const item = pcList.find(i => i.userName === sourceName);
    if (item) {
        const { pc } = item;
        pc.addIceCandidate(new RTCIceCandidate(iceCandidate));
    }
}
// 鎴块棿鍐呯敤鎴风寮€
function closeRoomUser (json) {
    const { sourceName, streamId } = json;
    const index = pcList.findIndex(i => i.userName === sourceName);
    if (index > -1) {
        pcList.splice(index, 1);
    }
    removeUserItem(streamId);
}
// 鎸傛柇
hangUp.onclick = function () {
    userName.disabled = false;
    startConn.disabled = false;
    roomName.disabled = true;
    joinRoom.disabled = true;
    hangUp.disabled = true;
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    pcList.forEach(element => {
        element.pc.close();
        element.pc = null;
    });
    pcList.length = 0;
    if (ws) {
        ws.close();
        ws = null;
    }
    videoContainer.innerHTML = '';
}

// 娣诲姞鐢ㄦ埛
function addUserItem (userName, mediaStreamId, src) {
    const div = document.createElement('div');
    div.id = mediaStreamId + '_item';
    div.className = 'video-item';
    const span = document.createElement('span');
    span.className = 'video-title';
    // 安全修复：使用 textContent 替代 innerHTML 防止 XSS 攻击
    span.textContent = userName;
    div.appendChild(span);
    const video = document.createElement('video');
    video.id = mediaStreamId;
    video.className = 'video-play';
    video.controls = true;
    video.autoplay = true;
    video.muted = true;
    video.webkitPlaysinline = true;
    src && (video.srcObject = src);
    div.appendChild(video);
    videoContainer.appendChild(div);
}
// 绉婚櫎鐢ㄦ埛
function removeUserItem (streamId) {
    videoContainer.removeChild(document.getElementById(streamId + '_item'));
}
