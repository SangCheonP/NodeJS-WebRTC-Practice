const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const cameraSelect = document.getElementById("cameras");
const call = document.getElementById("call")

let myStream;

let muted = false;
let cameraOff = false;
let roomName;

// 카메라 목록을 받아옴
const getCameras = async () => {
    try{
        const devices = await navigator.mediaDevices.enumerateDevices();    
        // console.log(devices);
        const cameras = devices.filter((divice) => divice.kind === "videoinput");

        // camera 목록을 form input
        const currentCamera = myStream.getVideoTracks()[0];
        cameras.forEach((camera) => {
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if (currentCamera.label === camera.label) {
                option.selected = true;
            }
            cameraSelect.appendChild(option);
        })
    } catch(e) {
        console.log(e);
    }
}


// 미디어를 가져옴
const getMedia = async (deviceId) => {
    // 최초
    const initialConstraint = {
        audio: true,
        video : { facingMode: "user" },
    };

    // divice 받아온 것을 바꿔줌
    const cameraConstraints = {
        audio: true,
        video: { deviceId: { exact: deviceId }},
    };

    try{
        // divice 값이 넘어오면, 안 넘어오면
        myStream = await navigator.mediaDevices.getUserMedia(deviceId ? cameraConstraints : initialConstraint);
        //console.log(myStream);
        myFace.srcObject = myStream;

        // deviceId가 없을 때만, 시작
        if (!deviceId){
            await getCameras();
        }
    } catch(e){
        console.log(e);
    }
}


call.hidden = true;
// 미디어 시작
//getMedia();

// 음소거 버튼 조작
const handleMuteClick = () => {
    //console.log(myStream.getAudioTracks());
    myStream.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));
    if(!muted){
        muteBtn.innerText = "Unmute";
        muted = true;
    } else {
        muteBtn.innerText = "Mute";
        muted = false;
    }
}

// 카메라 버튼 조작
const handleCameraClick = () => {
    //console.log(myStream.getVideoTracks());
    myStream.getVideoTracks().forEach((track) => (track.enabled = !track.enabled));
    if(!cameraOff){
        cameraBtn.innerText = "Turn Camera On";
        cameraOff = true;
    } else {
        cameraBtn.innerText = "Turn Camera Off";
        cameraOff = false;
    }
}

const handleCameraChange = async () =>{
    //console.log(cameraSelect.value);
    await getMedia(cameraSelect.value);
    if (myPeerConnection) {
        const videoTrack = myStream.getVideoTracks()[0];
        const videoSender = myPeerConnection.getSenders().find((sender) => sender.track.kind === 'video');
        videoSender.replaceTrack(videoTrack);
    }
}

// 방 입장하기

const startMedia = async () => {
    welcome.hidden = true;
    call.hidden = false;
    await getMedia();
    // p2p 연결
    makeConnection();
}


const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector('form');

const handleWelcomeSubmit = async (event) => {
    event.preventDefault();
    const input = welcomeForm.querySelector("input");
    // 클라이언트가 무사히 받으면 실행함
    await startMedia();
    socket.emit("join_room", input.value);
    roomName = input.value;
    input.value = "";
}



muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
cameraSelect.addEventListener("input", handleCameraChange);
welcomeForm.addEventListener("submit", handleWelcomeSubmit);


// socket 구현 부분

socket.on("welcome", async () => {
    // offer 관련 명세
    const offer = await myPeerConnection.createOffer();
    // 나의 description을 offer에 실어서 보내줌
    myPeerConnection.setLocalDescription(offer);
    socket.emit("offer", offer, roomName);
})

socket.on("offer", async (offer) => {
    //console.log(offer);
    // 받은 offer에 맞춰 설정
    myPeerConnection.setRemoteDescription(offer);
    const answer = await myPeerConnection.createAnswer();
    console.log(answer);
    myPeerConnection.setLocalDescription(answer);
    socket.emit('answer', answer, roomName);
})

socket.on('answer', answer => {
    myPeerConnection.setRemoteDescription(answer);
})

socket.on('ice', ice => {
    myPeerConnection.addIceCandidate(ice);
})

// RTC 구현 부분

let myPeerConnection;

const makeConnection = () =>{
    myPeerConnection = new RTCPeerConnection({
        iceServers: [
            {
                urls: [
                "stun:stun.l.google.com:19302",
                "stun:stun1.l.google.com:19302",
                "stun:stun2.l.google.com:19302",
                "stun:stun3.l.google.com:19302",
                "stun:stun4.l.google.com:19302",
                ],
            },
            ],
    });
    myPeerConnection.addEventListener('icecandidate', handleIce);
    myPeerConnection.addEventListener('addstream', handleAddStream);
    myStream
    .getTracks()
    .forEach((track) => myPeerConnection.addTrack(track, myStream));
};

const handleIce = (data) => {
    //console.log(data.candidate);
    socket.emit('ice', data.candidate, roomName)
}

const handleAddStream = (data) => {
    //console.log(data)
    const peerFace = document.getElementById('peerFace');
    peerFace.srcObject = data.stream;
}