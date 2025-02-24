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
    localAudioTrack: MediaStreamTrack | null,
    localVideoTrack: MediaStreamTrack | null
}) => {
    const [searchParams, setSearchParams] = useSearchParams()
    const [socket, setSocket] = useState<null | Socket>(null)
    const [lobby, setLobby] = useState(true)
    const [sendingPC, setSendingPC] = useState<RTCPeerConnection | null>(null)
    const [receivingPC, setReceivingPC] = useState<RTCPeerConnection | null>(null)
    const [remoteVideoTrack, setRemoteVideoTrack] = useState<MediaStreamTrack | null>(null)
    const [remoteAudioTrack, setRemoteAudioTrack] = useState<MediaStreamTrack | null>(null)
    const [remoteMediaStream, setRemoteMediaStream] = useState<MediaStream | null>(null)
    const remoteVideoRef = useRef<HTMLVideoElement>(null)
    const localVideoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        const socket = io(URL)

        socket.on('send-offer', async ({roomId}) => {
            setLobby(false)
            const pc = new RTCPeerConnection()
            setSendingPC(pc)
            if(!localAudioTrack || !localVideoTrack){
                return
            }
            pc.addTrack(localAudioTrack)
            pc.addTrack(localVideoTrack)
            
            // pc.onicecandidate = (e) => {
            //     pc.addIceCandidate(e.candidate)
            // }

            pc.onnegotiationneeded = async() => {
                console.log('on negotiation neede')
                const sdp = await pc.createOffer()
                
                pc.setLocalDescription(sdp)
                socket.emit('offer', {
                    sdp,
                    roomId
                })
            }
        })

        socket.on('offer', async ({roomId, sdp: remoteSdp}) => {
            setLobby(false)
            const pc = new RTCPeerConnection()
            pc.setRemoteDescription(remoteSdp)
            const sdp = await pc.createAnswer()
            
            pc.setLocalDescription(sdp)
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

        socket.on('answer', ({roomId, sdp: remoteSdp}) => {
            setLobby(false)
            setSendingPC(pc => {
                pc?.setRemoteDescription(remoteSdp)
                return pc
            })
        })

        socket.on('lobby', () => {
            setLobby(true)
        })

        setSocket(socket)

    }, [name])


    useEffect(() => {
        if(localVideoRef.current){
            if(localVideoTrack){
                localVideoRef.current.srcObject = new MediaStream([localVideoTrack])
                localVideoRef.current.play()
            }
        }
    },[localVideoTrack])

    return (
        <>
            <div>
                Hi {name}
                <video autoPlay width={400} height={400} ref={localVideoRef} />
                {lobby ? 'Waiting to connecte you to someone': null}
                <video autoPlay width={400} height={400} ref={remoteVideoRef} />
            </div>
        </>
    )
}