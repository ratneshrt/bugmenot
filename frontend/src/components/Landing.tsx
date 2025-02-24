import { useEffect, useRef, useState } from "react"
import { Room } from "./Room"

export const Landing = () => {
    const [name, setName] = useState('')
    const [joined, setJoined] = useState(false)
    const [localVideoTrack, setLocalVideoTrack] = useState<MediaStreamTrack | null>(null)
    const [localAudioTrack, setLocalAudioTrack] = useState<MediaStreamTrack | null>(null)
    const videoRef = useRef<HTMLVideoElement>(null)

    const getCam = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        })
        const audioTrack = stream.getAudioTracks()[0]
        const videoTrack = stream.getVideoTracks()[0]
        setLocalVideoTrack(videoTrack)
        setLocalAudioTrack(audioTrack)
        if(!videoRef.current){
            return
        }
        videoRef.current.srcObject = new MediaStream([videoTrack])
        videoRef.current.play()
    }

    useEffect(() => {
        if(videoRef && videoRef.current){
            getCam()
        }
    }, [videoRef])

    if(!joined){
        return (
            <>
                <div>
                    <video ref={videoRef} autoPlay/>
                    <input onChange={e => setName(e.target.value)} type="text"></input>
                    <button onClick={() => {
                        setJoined(true)
                    }}>Join Room</button>
                </div>
            </>
        )
    }

    return (
        <Room name={name} localAudioTrack={localAudioTrack} localVideoTrack={localVideoTrack}/>
    )

}