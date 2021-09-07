const socket = io();
//Elements
let displayEl = document.getElementById("displaytext");
const $formEl = document.querySelector("#main");
const $messageFormInput = $formEl.querySelector("#inputmain");
const $messageFormButton = $formEl.querySelector("#submit");
const $butlocate = document.querySelector("#location");
const $messages = document.querySelector("#messages");

//Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector(
  "#current-location-template"
).innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

//options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

//auto scrol function
const autoscroll = () => {
  //New message elemment
  const $newMessage = $messages.lastElementChild;

  //Height of the new message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;
  //visible height
  const visibleHeight = $messages.offsetHeight;
  //Height of messages container
  const containerHeight = $messages.scrollHeight;

  //How far have i scrolled
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};
//listening for events from server
socket.on("message", (value) => {
  console.log(value);
  //displayEl.textContent = value;
  const html = Mustache.render(messageTemplate, {
    username: value.username,
    message: value.text,
    createdAt: moment(value.createdAt).format("h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});
//listening to location message from server
socket.on("position", (value) => {
  console.log(value);
  const html = Mustache.render(locationTemplate, {
    username: value.username,
    url: value.url,
    createdAt: moment(value.createdAt).format("h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });
  document.querySelector("#sidebar").innerHTML = html;
});
//adding event to the submit button
$formEl.addEventListener("submit", (e) => {
  e.preventDefault();
  $messageFormButton.setAttribute("disabled", "disabled");
  //disable the form
  let messageEl = e.target.elements.message;

  let message = messageEl.value;
  //sending message to
  socket.emit("sendMessage", message, (error) => {
    $messageFormButton.removeAttribute("disabled");
    $messageFormInput.value = "";
    $messageFormInput.focus();
    // enable form
    if (error) {
      return console.log(error);
    }
    console.log("The message was delivered");
  });
});
//adding even to click to get location
$butlocate.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("location sharing is not supported by your browser");
  }
  $butlocate.setAttribute("disabled", "disabled");
  navigator.geolocation.getCurrentPosition((position) => {
    let latitude = position.coords.latitude;
    let longitude = position.coords.longitude;
    let Position = {
      longitude,
      latitude,
    };
    //emiting location message to server
    socket.emit("sendLocation", Position, (acknowledge) => {
      $butlocate.removeAttribute("disabled");
      console.log(acknowledge);
    });
  });
});
socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
