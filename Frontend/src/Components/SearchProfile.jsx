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
    const [recentlyPlayed, setRecentlyPlayed] = useState([])
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const currentUsername = currentUser.username
    const [spotifyUser, setSpotifyUser] = useState([])
    const [friend, setFriend] = useState(false)
    const [confirmedFriend, setConfirmedFriend] = useState(false)
    const [initiatedFriend, setInitiatedFriend] = useState(false)
    const [receivedFriend, setReceivedFriend] = useState(false)

    useEffect(() => {
        getTopSongs()
        getRecentlyPlayed()
        getSpotify()
        getFriends()
    }, [])

    useEffect(() => {
        const checkTokenExpiration = async () => {
            const currentTime = new Date().getTime() / 1000;
            const tokenExpiration = localStorage.getItem("tokenExpiration");
            if (currentTime >= tokenExpiration) {
                await refreshToken();
            }
            setTimeout(checkTokenExpiration, 120000);
        };
        checkTokenExpiration();
        return () => clearTimeout(checkTokenExpiration);
    }, []);

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
        throw error
    }}

    const getRecentlyPlayed = async () => {
        try {
            const response = await fetch(`http://localhost:4700/recently-played?username=${username}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`
                }
            })
            if (response.ok) {
                const data = await response.json()
                setRecentlyPlayed(data)
            }
        } catch (error) {
            throw error
        }
    }
    const getSpotify = async () => {
        try {
            const response = await fetch(`http://localhost:4700/spotify-user?username=${username}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`
                }
            })
            if (response.ok) {
                const data = await response.json()
                setSpotifyUser(data)
            }
        } catch (error) {
            throw error
        }
    }

    const getFriends = async () => {
        try {
            const response = await fetch(`http://localhost:4700/friends?username=${currentUsername}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`
                }
            })
            if (response.ok) {
                const dataResponse = await response.json()
                const confirmedFriends = dataResponse.confirmedFriends
                const initiatedFriendships = dataResponse.initiatedFriendships
                const receivedFriendships = dataResponse.receivedFriendships
                if (confirmedFriends.length > 0 && await confirmedFriends.some(friend => {
                    if (friend.confirmed){
                        friend.confirmedId === data.user.id
                    }
                })){
                    setConfirmedFriend(true)
                }
                if (initiatedFriendships.length > 0 && await initiatedFriendships.some(friend => {
                    if (!friend.confirmed){friend.initiatorId === currentUser.id}}) && await initiatedFriendships.some(friend => {
                        if (!friend.confirmed){friend.receiverId === data.user.id}})){setInitiatedFriend(true)}
                if (receivedFriendships.length > 0 && await receivedFriendships.some(friend => {
                    if (!friend.confirmed){friend.receiverId === currentUser.id}
                }) && await receivedFriendships.some(friend => {if (!friend.confirmed){friend.initiatorId === data.user.id}})) {
                    setReceivedFriend(true)
                }
            }
        } catch (error) {
            throw error
        }
    }
    const addFriend = async () => {
        try {
            const response = await fetch(`http://localhost:4700/add-friend?username=${currentUsername}&friend=${username}`,{
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`
                }
            })
            if (response.ok) {
                const data = await response.json()
                setFriend(true)
                getFriends()
            }
        } catch (error) {
            throw error
        }
    }
    return (
        <div className='profile-page'>
             <NavBar />
            <div className='main-content'>
                <div className='profile-content'>
                    <img className='profile-pic' src='https://picsum.photos/200/300' />
                    <h3 className='username'>@{username}</h3>
                    <h4 className='follower-count'> x friends</h4>
                    {spotifyUser && spotifyUser.spotify && spotifyUser.spotify.spotifyUrl &&
                        <a className="spotify-url" href={spotifyUser.spotify.spotifyUrl} target="_blank" style={{ color: 'green' }}>
                            Spotify Profile
                        </a>
                    }
                    <a className='follow-button' onClick={addFriend} style={{ color: 'white' }}>
                        {confirmedFriend ? 'Friend' :
                        initiatedFriend ? 'Added' :
                        receivedFriend ? 'Accept' :
                        (friend ? 'Added' : 'Follow +')}
                    </a>
                </div>

                <div className='recently-played'>
                    <div className='recently-played-title-container'>
                        <h3 className='recently-played-title'>Recently Played Songs</h3>
                    </div>

                    <div className='recently-played-songs'>
                        {recentlyPlayed && recentlyPlayed.tracks ? (
                            recentlyPlayed.tracks.map((track, index) => (
                            <div key={index}>
                                <div className='song'>
                                    <p className='song-name'>{track.name}</p>
                                    <p className='artist-names'>{track.artists.map((artist) => artist.name).join(", ")}</p>
                                </div>
                            </div>
                        ))) : (
                            <div className='song'>
                                <p style={{ justifyContent: 'center', textAlign: 'center' }}>Spotify not synced</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className='top-songs-container'>
                    <h3>Top Songs</h3>
                    {topSongs && topSongs.topSongs ? (
                        topSongs.topSongs.map((song, index) => (
                            <div key={index}>
                            <h2 className='song-title'>{song.track}</h2>
                            <p className='artist-name'>{song.artist.join(', ')}</p>
                            </div>
                        ))
                    ) : (
                        <p>Spotify not synced</p>
                    )}
                </div>
            </div>
        </div>
    )
}
