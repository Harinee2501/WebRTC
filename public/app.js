const socket = io();

let localStream;
let peerConnections = {}; // Store peer connections by socket ID
let roomId = null;

// Set up video and audio streams
navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
    localStream = stream;
    const localVideo = document.getElementById('localVideo');
    localVideo.srcObject = stream;
});

function generateMeetID() {
    // Generate a unique ID for the room
    const meetID = Math.random().toString(36).substring(2, 10); // Generates an 8-character random string
    document.getElementById('roomId').value = meetID;
    alert(`Your Meet ID is: ${meetID}\nShare this ID with others to join your room.`);
}

function joinRoom() {
    roomId = document.getElementById('roomId').value;
    if (!roomId) {
        alert('Please enter a room ID or generate one!');
        return;
    }
    socket.emit('join-room', roomId);
}

// Handle when another user joins the room
socket.on('user-joined', (socketId) => {
    console.log(`User joined: ${socketId}`);
    createPeerConnection(socketId);
});

// Handle receiving an offer
socket.on('offer', async (offer, fromSocketId) => {
    const pc = createPeerConnection(fromSocketId);
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit('answer', answer, fromSocketId);
});

// Handle receiving an answer
socket.on('answer', (answer, fromSocketId) => {
    peerConnections[fromSocketId].setRemoteDescription(new RTCSessionDescription(answer));
});

// Handle receiving an ICE candidate
socket.on('ice-candidate', (candidate, fromSocketId) => {
    const pc = peerConnections[fromSocketId];
    pc.addIceCandidate(new RTCIceCandidate(candidate));
});

// Create a new peer connection
function createPeerConnection(socketId) {
    const pc = new RTCPeerConnection();

    // Add local stream tracks to the peer connection
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

    // Handle remote stream
    pc.ontrack = (event) => {
        const remoteVideo = document.createElement('video');
        remoteVideo.srcObject = event.streams[0];
        remoteVideo.autoplay = true;
        document.getElementById('videos').appendChild(remoteVideo);
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('ice-candidate', event.candidate, socketId);
        }
    };

    peerConnections[socketId] = pc;

    // If this is the first user to join, send an offer
    if (Object.keys(peerConnections).length === 1) {
        createOffer(socketId);
    }

    return pc;
}

// Create an offer to send to another user
async function createOffer(socketId) {
    const pc = peerConnections[socketId];
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit('offer', offer, socketId);
}


