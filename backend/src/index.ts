import { Server, Socket } from "socket.io";
import express from 'express'
const http = require('http')

const app = express()
const server = http.createServer(http)

const io = new Server(server)

io.on('connection', (socket: Socket) => {
    console.log('a user connected')
})

server.listen(3000, () => {
    console.log('server listening on 3000')
})