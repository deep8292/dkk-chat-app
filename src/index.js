const path = require('path')
const express = require('express')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const {generateMessage} = require('./utils/messages')
const {addUser, removeUser, getUser, getUsers } = require('./utils/users')

const PORT = process.env.PORT
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
    // When new user joins the room
    socket.on('join', ({username, room}, callback) => {
        const {error, user } = addUser({ id: socket.id, username, room })
        if (error) {
            return callback(error)
        }
        socket.join(user.room)
        socket.emit('message', generateMessage(`Welcome! to ${room}`, 'Admin'))
        socket.broadcast.to(user.room).emit('message', generateMessage(`${user.username} has joined the chat!`, 'Admin'))
        
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsers(user.room)
        })

        callback()
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)
        const filter = new Filter()
        if (filter.isProfane(message)) {
            return callback('profanity is not allo d')
        }
        io.to(user.room).emit('message', generateMessage(message, user.username))
        callback()
    })

    socket.on('sendLocation', (position, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateMessage('https://google.com/maps?q=' +position.latitude +',' +position.longitude, user.username))
        callback()
    })

    socket.on('disconnect', () => {
        const user =removeUser(socket.id)
        if (user) {
            io.to(user.room).emit('message', generateMessage(`${user.username} has left!`, 'Admin'))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsers(user.room)
            })
        }
        
    })

    /*socket.emit('countUpdated', count)

    socket.on('increment', () => {
        count++
        // socket.emit('countUpdated', count) // Emit an event to only one connection
        io.emit('countUpdated', count)   // Emit an event to every connection
    })*/
})

server.listen(PORT, () => {
    console.log('Chat App is running on ', +PORT)
})