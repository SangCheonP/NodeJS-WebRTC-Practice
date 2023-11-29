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
    console.log(cameraSelect.value);
    await getMedia(cameraSelect.value);
}

// 방 입장하기

const startMedia = () => {
    welcome.hidden = true;
    call.hidden = false;
    getMedia();
}


const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector('form');

const handleWelcomeSubmit = (event) => {
    event.preventDefault();
    const input = welcomeForm.querySelector("input");
    // 클라이언트가 무사히 받으면 실행함
    socket.emit("join_room", input.value, startMedia);
    roomName = input.value;
    input.value = "";
}



muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
cameraSelect.addEventListener("input", handleCameraChange);
welcomeForm.addEventListener("submit", handleWelcomeSubmit);


// socket 구현 부분

socket.on("welcome", () => {
    console.log("someone join!");
})