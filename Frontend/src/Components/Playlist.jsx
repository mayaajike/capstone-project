import React, { useContext, useState, useEffect } from 'react'
import Modal from 'react-bootstrap/Modal'
import { RefreshTokenContext } from "../Context/RefreshTokenContext";
import '../CSS/Playlist.css'
import StarCursorTrail from './StarCursorTrail';

export default function({ show, onHide, accessToken, username }) {
    const refreshToken = useContext(RefreshTokenContext);
    const [likedSongs, setLikedSongs] = useState([])

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

    useEffect(() => {
        getLikedSongs()
    })

    const getLikedSongs = async () => {
        try {
          const response = await fetch(`http://localhost:4700/liked-songs?username=${username}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${accessToken}`
            }
          })
          if (response.ok) {
            const data = await response.json()
            setLikedSongs(data.likedSongs)
          }
        } catch(error) {
          throw error
        }
    }

    const calcTimeStamp = (timestamp) => {
        const now = new Date();
        const postDate = new Date(timestamp)
        const seconds = Math.floor((now - postDate) / 1000);

        const years = Math.floor(seconds / 31536000);
        if (years > 0) {
          if (years === 0){
            return `${years} year ago`
          }
          return `${years} years ago`};
        const months = Math.floor(seconds / 2592000);
        if (months > 0) {
          if (months === 1){
            return `${months} month ago`
          }
          return `${months} months ago`};
        const days = Math.floor(seconds / 86400);
        if (days > 0){
          if (days === 1) {
            return `${days} day ago`
          }
          return `${days} days ago`;
        }
        const hours = Math.floor(seconds / 3600);
        if (hours > 0) {
          if (hours === 1) {
            return `${hours} hour ago`
          }
          return `${hours} hours ago`;
        }
        const minutes = Math.floor(seconds / 60);
        if (minutes > 0) {
          if (minutes === 1) {
            return `${minutes} minute ago`
          }
          return `${minutes} minutes ago`;
        }
        return `${Math.floor(seconds)} seconds ago`;
      }

    return (
        <div>
          <StarCursorTrail />
            <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={show}>
                <Modal.Header id="contained-modal-title-vcenter">
                    <h3>{username}'s liked songs</h3>
                </Modal.Header>
                <Modal.Body>
                    <div className='liked-songs'>
                        {likedSongs?.length ? (likedSongs.map((song, index) => (
                            <div key={index}>
                                <div className='liked-song-info'>
                                    <img src={song.track.albumCover} alt="Album Cover" className='liked-album-cover' />
                                    <p className='liked-song-name'>{song.track.track}</p>
                                    <p className='liked-artist-names'>
                                        {song.track.artist.map((artist) => artist).join(", ")}
                                    </p>
                                    <p className='liked-at'>{calcTimeStamp(song.likedAt)}</p>
                                </div>
                            </div>
                        ))) : (
                          <div className='liked-song-info'>
                            <p>No Liked Songs</p>
                          </div>
                        )}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <button onClick={onHide}>Close</button>
                </Modal.Footer>
            </Modal>
        </div>
    )
}
