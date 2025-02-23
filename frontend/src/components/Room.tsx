import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { io, Socket } from "socket.io-client"

const URL = 'http://localhost:3000'

export const Room = ({
    name,
    localAudioTrack,
    localVideoTrack
}:{
    name: string,
    localAudioTrack: MediaStreamTrack,
    localVideoTrack: MediaStreamTrack
}) => {
    const [searchParams, setSearchParams] = useSearchParams()
    // const name = searchParams.get('name')
    const [socket, setSocket] = useState<null | Socket>(null)
    const [lobby, setLobby] = useState(true)
    const [sendingPC, setSendingPC] = useState<RTCPeerConnection | null>(null)
    const [receivingPC, setReceivingPC] = useState<RTCPeerConnection | null>(null)
    const [remoteVideoTrack, setRemoteVideoTrack] = useState<MediaStreamTrack | null>(null)
    const [remoteAudioTrack, setRemoteAudioTrack] = useState<MediaStreamTrack | null>(null)
    const [remoteMediaStream, setRemoteMediaStream] = useState<MediaStream | null>(null)
    const remoteVideoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        const socket = io(URL)

        socket.on('send-offer', async ({roomId}) => {
            setLobby(false)
            const pc = new RTCPeerConnection()
            setSendingPC(pc)
            pc.addTrack(localAudioTrack)
            pc.addTrack(localVideoTrack)
            pc.onicecandidate = async () => {
                const sdp = await pc.createOffer()
                socket.emit('offer', {
                    sdp,
                    roomId
                })
            }
        })

        socket.on('offer', async ({roomId, offer}) => {
            setLobby(false)
            const pc = new RTCPeerConnection()
            pc.setRemoteDescription({
                sdp: offer,
                type: 'offer'
            })
            const sdp = await pc.createAnswer()
            const stream = new MediaStream()
            if(!remoteVideoRef.current){
                return
            }
            remoteVideoRef.current.srcObject = stream
            setRemoteMediaStream(stream)
            //trickle ice
            setReceivingPC(pc)
            pc.ontrack = (({track, type}) => {
                if (type === 'audio'){
                    // setRemoteAudioTrack(track)
                    if(!remoteVideoRef.current){
                        return
                    }
                    //@ts-ignore
                    remoteVideoRef.current.srcObject.addTrack(track)
                }else{
                    // setRemoteVideoTrack(track)
                    //@ts-ignore
                    remoteVideoRef.current.srcObject.addTrack(track)
                }
                remoteVideoRef.current?.play()
            })
            socket.emit('answer', {
                roomId,
                sdp
            })
        })

        socket.on('answer', ({roomId, answer}) => {
            setLobby(false)
            setSendingPC(pc => {
                pc?.setRemoteDescription({
                    type: 'answer',
                    sdp: answer
                })
                return pc
            })
        })

        socket.on('lobby', () => {
            setLobby(true)
        })

        setSocket(socket)

    }, [name])

    if(lobby){
        return <div>
            Waiting to connect to someone
        </div>
    }

    return (
        <>
            <div>
                Hi {name}
                <video width={400} height={400} />
                <video width={400} height={400} ref={remoteVideoRef} />
            </div>
        </>
    )
}