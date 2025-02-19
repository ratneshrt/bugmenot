import { useState } from "react"
import { Link } from "react-router-dom"

export const Landing = () => {
    const [name, setName] = useState('')
    return (
        <>
            <div>
                <input onChange={e => setName(e.target.value)} type="text"></input>
                <Link to={`/room/?name=${name}`}>Join Room</Link>
            </div>
        </>
    )
}