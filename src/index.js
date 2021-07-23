import { io } from 'socket.io-client';
import { postData, qs } from './utils';

const ENDPOINT = "http://39.117.221.46:80";
const socket = io("http://39.117.221.46:3000");
let publicState = {};
let privateState = {};
let currentRoomId = "";
let myUserId = "";
let myUserName = "";

function newRoom() {
  let newRoomElem = qs("#newRoomInput");

  newRoomElem.style.display = "";
}

function submitNewRoom() {
  let newRoomName = qs("#newRoomName").value;

  qs("#newRoomName").value = "";

  postData(`${ENDPOINT}/newRoom`, {name: newRoomName})
  .then(data => {
    loadRoomList();
  })

  qs("#newRoomInput").style.display = "none";
}

function roomConnect(evt) {
  let target = evt.target;
  let roomId = target.getAttribute("roomId");
  let roomName = target.getAttribute("roomName");
  currentRoomId = roomId;

  if(currentRoomId !== "") {
    roomDisconnect();
  }

  postData(`${ENDPOINT}/connect`, {roomId: roomId, userId: myUserId})
  .then(data => {
    qs("#roomName").innerText = roomName;
    qs("#roomId").innerText = roomId;
    qs("#content").style.display = "";

    publicState = data.publicState;
    qs("#publicState").innerText = JSON.stringify(data.publicState);
  })


  socket.on(roomId, data => {
    publicState = data;
    qs("#publicState").innerText = JSON.stringify(data);
  });

  socket.on("private", data => {
    privateState = data;
    qs("#privateState").innerText = JSON.stringify(data);
  });
}

function roomDisconnect() {
  // catch error
  postData(`${ENDPOINT}/disconnect`, {roomId: currentRoomId, userId: myUserId});
}

function logout() {
  postData(`${ENDPOINT}/logout`, {userId: myUserId});
  location.reload();
}

function loadRoomList() {
  fetch(`${ENDPOINT}/rooms`)  
    .then(res => res.json())
    .then(data => {
      if(data.status == "success") {
        let list = data.data;
        let listElem = qs("#rooms > #list").cloneNode(false);
        list.forEach(room => {
          let roomElem = document.createElement("div");
          roomElem.setAttribute("id", "room");
          roomElem.setAttribute("roomId", room._id);
          roomElem.setAttribute("roomName", room.name);
          roomElem.addEventListener("click", roomConnect);
          roomElem.innerText = room.name;
          listElem.appendChild(roomElem);
        });

        qs("#rooms > #list").replaceWith(listElem);
      }
    })
}

function init() {

  // login

  qs("#login > button").addEventListener("click", evt => {
    myUserName = qs("#login > #userName").value;
    postData(`${ENDPOINT}/login`, {
      name: myUserName
    }).then(data => {
      if(data.status == "success") {
        myUserId = data.id;
        qs("#login").style.display = "none";
        qs("#app").style.display = "";
        qs("#user > #userName").innerText = myUserName;
        qs("#user > #userId").innerText = myUserId;
      }
    });
  })

  // room list

  loadRoomList();

  // setup button clicks

  qs("#controls > #reloadRoomList").addEventListener("click", () => loadRoomList());
  qs("#controls > #newRoom").addEventListener("click", () => newRoom());
  qs("#controls > #disconnect").addEventListener("click", () => logout());

  qs("#newRoomInput > #submitNewRoomName").addEventListener("click", () => submitNewRoom());


  // public, private state update

  qs("#updatePrivate > button").addEventListener("click", evt => {
    let keyElem = qs("#updatePrivateKey");
    let valElem = qs("#updatePrivateVal");
    let key = keyElem.value;
    let val = valElem.value;
    let obj = {};
    obj[key] = val;
    
    if(myUserId != "" && currentRoomId != "" && key != "" && val != "") {
      socket.emit("private", {roomId: currentRoomId, userId: myUserId, newState: obj});
    }

    keyElem.value = valElem.value = "";
  })
  
  qs("#updatePublic > button").addEventListener("click", evt => {
    let keyElem = qs("#updatePublicKey");
    let valElem = qs("#updatePublicVal");
    let key = keyElem.value;
    let val = valElem.value;
    let obj = {};
    obj[key] = val;

    if(myUserId != "" && currentRoomId != "" && key != "" && val != "") {
      socket.emit("public", {roomId: currentRoomId, newState: obj});
    }

    keyElem.value = valElem.value = "";
  })
}

window.onload = init;