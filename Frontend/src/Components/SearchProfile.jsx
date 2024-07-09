import React, { useState, useEffect, useContext } from 'react'
import '../CSS/Profile.css'
import { useLocation } from 'react-router-dom'
import NavBar from './NavBar'
import { RefreshTokenContext } from '../Context/RefreshTokenContext'
import { LogoutContext } from '../Context/LogoutContext'


export default function SearchProfile() {
    const [topSongs, setTopSongs] = useState([])
    const location = useLocation();
    const data = location.state
    const username = data.user.username
    const accessToken = localStorage.getItem("accessToken")
    const refreshToken = useContext(RefreshTokenContext)
    const handleLogout = useContext(LogoutContext)

    useEffect(() => {
        getTopSongs()
    }, [])

    setInterval(async () => {
        const currentTime = new Date().getTime() / 1000;
        const tokenExpiration = localStorage.getItem("tokenExpiration");
        if ( currentTime >= tokenExpiration) {
            await refreshToken();
        }
    }, 30000)

    const getTopSongs = async () => {
    try {
        const response = await fetch(`http://localhost:4700/top-songs?username=${username}`, {
            method: "GET",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
            }
        })
        if (response.ok) {
            const data = await response.json()
            setTopSongs(data)
        } else {
            return
        }
    } catch (error) {
        console.log(error)
        return;
    }}

    return (
        <div className='profile-page'>
             <NavBar username={username}  />
            <div className='main-content'>
                <img className='profile-pic' src='https://picsum.photos/200/300' />
                <h3 className='username'>@{username}</h3>
                <h4 className='follower-count'> x followers</h4>
            </div>

            <div className='top-songs-container'>
                <h3>Top Songs</h3>
                {topSongs && topSongs.topSongs ? (
                    topSongs.topSongs.map((song, index) => (
                        <div key={index}>
                        <h2 className='song-title'>{song.track}</h2>
                        <p className='artist-name'>{song.artist}</p>
                        </div>
                    ))
                ) : (
                    <p>Spotify not synced</p>
                )}
            </div>
        </div>
    )
}
