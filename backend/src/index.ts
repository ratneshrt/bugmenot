import { Server, Socket } from "socket.io";
import express from 'express'
import { UserManager } from "./managers/UserManager";
const http = require('http')

const app = express()
const server = http.createServer(http)

const userManager = new UserManager()

const io = new Server(server, {
    cors: {
        origin: '*'
    }
})

io.on('connection', (socket: Socket) => {
    console.log('a user connected')
    userManager.addUser("randomName", socket)
    socket.on('disconnected', () => {
        userManager.removeUser(socket.id)
    })
})

server.listen(3000, () => {
    console.log('server listening on 3000')
})