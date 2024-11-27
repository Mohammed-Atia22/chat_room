const socket = io('ws://localhost:3500')


const msginput = document.querySelector('#message');
const nameinput = document.querySelector('#name');
const chatroom = document.querySelector('#room');
const activity = document.querySelector('.activity');
const userlist = document.querySelector('.user-list');
const roomlist = document.querySelector('.room-list');
const chatdisplay = document.querySelector('.chat-display');

function sendMessage(e){
    e.preventDefault()
    if(nameinput.value && msginput.value && chatroom.value){
        socket.emit('message', { 
            name : nameinput.value,
            text : msginput.value
        })
        msginput.value = ''
    }
    msginput.focus()
}

function enterroom(e){
    e.preventDefault()
    if(nameinput.value && chatroom.value){
        socket.emit('enterroom',{
            name: nameinput.value,
            room: chatroom.value
        })
    }
}

document.querySelector('.form-msg')
    .addEventListener('submit',sendMessage)

document.querySelector('.form-join')
    .addEventListener('submit',enterroom)

msginput.addEventListener('keypress',()=>{
    socket.emit('activity', nameinput.value)
})


socket.on("message",(data) => {
    activity.textContent = ''
    const {name,text,time} = data
    const li = document.createElement('li')
    li.className = 'post'
    if(name === nameinput.value) li.className = 'post post--left'
    if(name !== nameinput.value && name !== 'admin') li.className = 'post post--right'
    if(name !== 'admin'){
        li.innerHTML = `
            <div class="post__header ${name===nameinput.value ? 'post__header--user':'post__header--reply'}">
            <span class="post__header--name">${name}</span>
            <span class="post__header--time">${time}</span>
            </div>
            <div class="post__text">${text}</div>
        `
    } else{
        li.innerHTML = `<div class="post__text">${text}</div>`
    }
    document.querySelector('.chat-display').appendChild(li)
    chatdisplay.scrollTop = chatdisplay.scrollHeight
})


let activitytimer 
socket.on("activity",(name)=>{
    activity.textContent = `${name} is typing...`
    clearTimeout(activitytimer)
    activitytimer = setTimeout(() => {
        activity.textContent = ''
    }, 3000);
})

socket.on('userlist',({users})=>{
    showusers(users)
})

socket.on('roomlist',({rooms})=>{
    showrooms(rooms)
})

function showusers(users){
    userlist.textContent = ''
    if(users){
        userlist.innerHTML = `<em> users in ${chatroom.value}:</em>`
        users.forEach((user,i) => {
            userlist.textContent += `${user.name}`
            if(users.length > 1 && i !== users.length - 1){
                userlist.textContent += ","
            }
        })
    }
}

function showrooms(rooms){
    roomlist.textContent = ''
    if(rooms){
        roomlist.innerHTML = `<em> active rooms :</em>`
        rooms.forEach((room,i) => {
            roomlist.textContent += `${room}`
            if(rooms.length > 1 && i !== rooms.length - 1){
                roomlist.textContent += ","
            }
        })
    }
}