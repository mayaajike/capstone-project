import React, { useContext } from 'react'
import { RefreshTokenContext } from '../Context/RefreshTokenContext'
import { LogoutContext } from '../Context/LogoutContext'

export default function Home() {
    const refreshToken = useContext(RefreshTokenContext)
    const handleLogiout = useContext(LogoutContext)
    return(
        <>
            <h1>Home</h1>
        </>
    )
}
