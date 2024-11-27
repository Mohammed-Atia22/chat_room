import express from 'express';
import { Server } from "socket.io";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.port || 3500;
const admin = "admin"

const app = express();

app.use(express.static(path.join(__dirname,"public")));

const expressServer = app.listen(port,()=>{
    console.log(`listening on port ${port}`)
})

const usersstate = {
    users:[],
    setusers:function (newusersarray){
        this.users = newusersarray
    }
}

const io = new Server(expressServer,{
    cors:{
        origin:process.env.NODE_ENV === "production" ? false : ["http://localhost:5500","http://127.0.0.1:5500"]
    }
});

io.on('connection',socket => {
    console.log(`User ${socket.id} connected`)

    socket.emit('message',buildmsg(admin,"welcome to chat app"))

    socket.on('enterroom',({name,room})=>{
        const prevroom = getuser(socket.id)?.room

        if(prevroom){
            socket.leave(prevroom)
            io.to(prevroom).emit('message',buildmsg(admin,`${name} has left the room`))
        }
        const user = activateuser(socket.id,name,room)

        if(prevroom){
            io.to(prevroom).emit('userlist',{
                users:getusersinroom(prevroom)
            })
        }
        socket.join(user.room)

        socket.join('message',buildmsg(admin,`you have joined the ${user.room} caht room`))

        socket.broadcast.to(user.room).emit('message',buildmsg(admin,`${user.name} has joined the room`))

        io.to(user.room).emit('userlist',{
            users:getusersinroom(user.room)
        })

        io.emit('roomlist',{
            rooms:getallactiverooms()
        })
    })

    socket.on('disconnect',()=>{
        const user = getuser(socket.id)
        userleavesapp(socket.id)
        if(user){
            io.to(user.room).emit('message',buildmsg(admin,`${user.name} has left the room`))
            io.to(user.room).emit('userlist',{
                users:getusersinroom(user.room)
            })
            io.emit('roomlist',{
                rooms:getallactiverooms()
            })
        }
        console.log(`user ${socket.id} dis connected`)
    })

    //socket.broadcast.emit('message',`user ${socket.id.substring(0,5)} connected`)

    socket.on('message',({name,text}) => {
        const room = getuser(socket.id)?.room
        if(room){
            io.to(room).emit('message',buildmsg(name,text))
        }
    })

    socket.on('activity',(name)=>{
        const room = getuser(socket.id)?.room
        if(room){
            socket.broadcast.to(room).emit('activity',name)
        }
    })
})


function buildmsg(name,text){
    return {
        name,
        text,
        time: new Intl.DateTimeFormat('default',{
            hour:'numeric',
            minute:'numeric',
            second:'numeric'
        }).format(new Date())
    }
}


function activateuser(id,name,room){
    const user = {id,name,room}
    usersstate.setusers([
        ...usersstate.users.filter(user => user.id !== id),
        user
    ])
    return user
}

function userleavesapp(id){
    usersstate.setusers(
        usersstate.users.filter(user => user.id !== id)
    )
}

function getuser(id){
    return usersstate.users.find(user => user.id === id)
}

function getusersinroom(room){
    return usersstate.users.filter(user => user.room === room)
}

function getallactiverooms(){
    return Array.from(new Set(usersstate.users.map(user => user.room)))
}