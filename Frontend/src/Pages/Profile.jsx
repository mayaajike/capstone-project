import React, { useState, useEffect, useRef, useContext } from "react";
import NavBar from "../Components/NavBar";
import "../CSS/Profile.css";
import { RefreshTokenContext } from "../Context/RefreshTokenContext";
import { LogoutContext } from "../Context/LogoutContext";
import { FaShare } from "react-icons/fa6";
import { useNavigate } from "react-router-dom"
import Playlist from "../Components/Playlist";
import StarCursorTrail from "../Components/StarCursorTrail";

export default function Profile({
  searchResults,
  setSearchResults,
  searchQuery,
  setSearchQuery,
  handleSearch,
}) {
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const [user, setUser] = useState(currentUser);
  const username = user.username;
  const [topSongs, setTopSongs] = useState([]);
  let currentAccessToken = localStorage.getItem("accessToken");
  const hasRunRef = useRef(false);
  const refreshToken = useContext(RefreshTokenContext);
  const handleLogout = useContext(LogoutContext);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [spotifyUser, setSpotifyUser] = useState([]);
  const [confirmedFriends, setConfirmedFriends] = useState([]);
  const [initiatedFriends, setInitiatedFriends] = useState([]);
  const [receivedFriends, setReceivedFriends] = useState([]);
  const navigate = useNavigate()
  const [showPlaylist, setShowPlaylist] = useState(false)

  useEffect(() => {
    if (!hasRunRef.current && topSongs.length < 1) {
      hasRunRef.current = true;
      getSpotify();
      getTopSongs();
      getRecentlyPlayed();
      getFriends();
    }
  }, [user]);

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
      const response = await fetch(
        `http://localhost:4700/spotify/top-songs?username=${username}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentAccessToken}`,
          },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setTopSongs(data);
      }
    } catch (error) {
      throw new Error("Unable to fetch top songs ", error);
    }
  };

  const getRecentlyPlayed = async () => {
    try {
      const response = await fetch(
        `http://localhost:4700/spotify/recently-played?username=${username}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentAccessToken}`,
          },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setRecentlyPlayed(data);
      }
    } catch (error) {
      throw error;
    }
  };

  const getSpotify = async () => {
    try {
      const response = await fetch(
        `http://localhost:4700/spotify/spotify-user?username=${currentUser.username}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentAccessToken}`,
          },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setSpotifyUser(data);
      }
    } catch (error) {
      throw error;
    }
  };

  const getFriends = async () => {
    try {
      const response = await fetch(
        `http://localhost:4700/friends?username=${username}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentAccessToken}`,
          },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setConfirmedFriends([
          ...data.confirmedFriendshipsInitiated,
          ...data.confirmedFriendshipsReceived,
        ]);
        setInitiatedFriends(data.initiatedFriendships);
        setReceivedFriends(data.receivedFriendships);
      }
    } catch (error) {
      throw error;
    }
  };

  const shareSong = async (track) => {
    try {
      const response = await fetch('http://localhost:4700/share-song', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentAccessToken}`
        },
        body: JSON.stringify({ track, username})
      })
    } catch (error) {
      throw error
    }
  }

  return (
    <div className="profile-page">
      <StarCursorTrail />
      <NavBar
        searchResults={searchResults}
        setSearchResults={setSearchResults}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearch={handleSearch}
      />
      <div className="main-content">
        <div className="profile-content">
          <img className="profile-pic" src="https://picsum.photos/200/300" />
          <h3 className="username">@{username}</h3>
          <h4 className="follower-count">
            {" "}
            {confirmedFriends.length}{" "}
            {confirmedFriends.length <= 1 ? "friend" : "friends"}
          </h4>
          {spotifyUser &&
            spotifyUser.spotify &&
            spotifyUser.spotify.spotifyUrl && (
              <a
                className="spotify-url"
                href={spotifyUser.spotify.spotifyUrl}
                target="_blank"
                style={{ color: "green" }}
              >
                Spotify Profile
              </a>
            )}

            <div className="view-playlist-container">
              <div className="playlist-card" onClick={() => setShowPlaylist(true)}>
                <img src='https://picsum.photos/200/300?random=15' alt="Playlist Cover" className="playlist-cover" />
                <div className="playlist-info">
                  <h3>{username}'s Liked Songs</h3>
                </div>
              </div>
              <Playlist show={showPlaylist} onHide={() => setShowPlaylist(false)} accessToken={currentAccessToken} username={username}/>
            </div>
        </div>

        <div className="recently-played">
          <div className="recently-played-title-container">
            <h3 className="recently-played-title">Now Listening</h3>
          </div>

          <div className="recently-played-songs">
            {recentlyPlayed && recentlyPlayed.tracks ? (
              recentlyPlayed.tracks.map((track, index) => (
                <div key={index}>
                  <div className="song">
                    <div className="song-info" onClick={() => window.open(track.external_urls.spotify, '_blank')}>
                      <p className="song-name">{track.name}</p>
                      <p className="artist-names">
                        {track.artists.map((artist) => artist.name).join(", ")}
                      </p>
                    </div>
                    <p className="interaction-button" onClick={() => shareSong(track)}><FaShare /></p>
                    <div className="tool-tip">
                      <a href={track.external_urls.spotify} target="_blank"> {track.external_urls.spotify}</a>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="song">
                <p style={{ justifyContent: "center", textAlign: "center" }} onClick={() => navigate('/main')}>
                  Connect Spotify 🎵
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="top-songs-container">
        <h3>Top Songs</h3>
        {topSongs && topSongs.topSongs ? (
          topSongs.topSongs.map((song, index) => (
            <div key={index}>
              <h5 className="song-title">{song.songName}</h5>
              <p className="artist-name">{song.artistNames.join(", ")}</p>
            </div>
          ))
        ) : (
          <p>Spotify not synced</p>
        )}
      </div>
    </div>
  );
}
