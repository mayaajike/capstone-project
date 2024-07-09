import React, { useState, useEffect, useRef } from 'react'
import NavBar from '../Components/NavBar'
import '../CSS/Profile.css'

export default function Profile({ searchResults, setSearchResults, searchQuery, setSearchQuery, handleSearch, refreshToken }) {
    // const [username, setUsername] = useState("")
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const [user, setUser] = useState(currentUser)
    const username = user.username;
    const [topSongs, setTopSongs] = useState([])
    let currentAccessToken = localStorage.getItem("accessToken")
    const hasRunRef = useRef(false);

    useEffect(() => {
        if (!hasRunRef.current && topSongs.length < 1) {
            hasRunRef.current = true;
            getTopSongs()
        }
    }, [user])

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
                    'Authorization': `Bearer ${currentAccessToken}`
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
        }
    }

    return(
        <div className='profile-page'>
            <NavBar username={username} searchResults={searchResults} setSearchResults={setSearchResults}
             searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleSearch={handleSearch} />
            <div className='main-content'>
                <img className='profile-pic' src='https://picsum.photos/200/300' />
                <h3 className='username'>@{username}</h3>
                <h4 className='follower-count'> x followers</h4>
            </div>

            <div className='top-songs-container'>
                <h3>Top Songs</h3>
                {topSongs && topSongs.topSongs && topSongs.topSongs.map((song, index) => (
                    <div key={index}>
                    <h2 className='song-title'>{song.track}</h2>
                    <p className='artist-name'>{song.artist}</p>
                    </div>
                ))}
            </div>

        </div>
    )
}
