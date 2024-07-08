import React, { useState, useEffect } from 'react'
import '../CSS/Profile.css'
import { useLocation } from 'react-router-dom'
import NavBar from './NavBar'


export default function SearchProfile() {
    const [topSongs, setTopSongs] = useState([])
    const location = useLocation();
    const data = location.state
    const username = data.user.username
    const accessToken = localStorage.getItem("accessToken")

    useEffect(() => {
        getTopSongs()
    }, [])

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
            alert("Unable to fetch top songs")
        }
    } catch (error) {
        alert("Unable to fetch top songs ", error)
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
                {topSongs.songInfo && topSongs.songInfo.map((song, index) => (
                    <div key={index}>
                    <h2 className='song-title'>{song.songName}</h2>
                    <p className='artist-name'>{song.artistNames.join(', ')}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}
