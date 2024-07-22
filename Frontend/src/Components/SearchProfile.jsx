import React, { useState, useEffect, useContext } from "react";
import "../CSS/Profile.css";
import { useLocation } from "react-router-dom";
import NavBar from "./NavBar";
import { RefreshTokenContext } from "../Context/RefreshTokenContext";
import { LogoutContext } from "../Context/LogoutContext";
import { CircularProgress } from "@mui/material";
import { FaRegHeart } from "react-icons/fa";

export default function SearchProfile({ searchResults, setSearchResults, searchQuery, setSearchQuery, handleSearch }) {
  const [topSongs, setTopSongs] = useState([]);
  const location = useLocation();
  const data = location.state;
  const username = data.user.username;
  const accessToken = localStorage.getItem("accessToken");
  const refreshToken = useContext(RefreshTokenContext);
  const handleLogout = useContext(LogoutContext);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const currentUsername = currentUser.username;
  const [spotifyUser, setSpotifyUser] = useState([]);
  const [friendshipConfirmed, setFriendshipConfirmed] = useState(false);
  const [friendshipInitiated, setFriendshipInitiated] = useState(false);
  const [friendshipReceived, setFriendshipReceived] = useState(false);
  const [confirmedFriends, setConfirmedFriends] = useState([]);
  const [initiatedFriends, setInitiatedFriends] = useState([]);
  const [receivedFriends, setReceivedFriends] = useState([]);
  const [friends, setFriends] = useState(0)
  const [compatibility, setCompatibility] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTopSongs();
    getRecentlyPlayed();
    getCompatibility();
    getSpotify();
    getFriends();
    getFriendsCount();
  }, []);

  useEffect(() => {
    if (confirmedFriends || initiatedFriends || receivedFriends) {
      checkFriendship();
    }
  }, [confirmedFriends, receivedFriends, initiatedFriends]);

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
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setTopSongs(data);
      } else {
        return;
      }
    } catch (error) {
      throw error;
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
            Authorization: `Bearer ${accessToken}`,
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
        `http://localhost:4700/spotify/spotify-user?username=${username}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
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
        `http://localhost:4700/friends?username=${currentUsername}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
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

  const getFriendsCount = async () => {
    try {
      const response = await fetch(`http://localhost:4700/friends?username=${username}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        }
      });
      if (response.ok) {
        const data = await response.json()
        const confirmedFriends = [...data.confirmedFriendshipsInitiated, ...data.confirmedFriendshipsReceived]
        setFriends(confirmedFriends.length)
      }
    } catch (error) {
      throw error
    }
  }

  const checkFriendship = async () => {
    let friendshipFound = null;
    initiatedFriends.some((friendship) => {
      if (
        friendship.initiatorId === currentUser.id &&
        friendship.receiverId === data.user.id
      ) {
        setFriendshipInitiated(true);
        return true;
      }
      return false;
    });
    receivedFriends.some((friendship) => {
      if (
        friendship.initiatorId === data.user.id &&
        friendship.receiverId === currentUser.id
      ) {
        setFriendshipReceived(true);
        return true;
      }
      return false;
    });
    confirmedFriends.some((friendship) => {
      if (
        (friendship.user1Id === currentUser.id &&
          friendship.user2Id === data.user.id) ||
        (friendship.user1Id === data.user.id &&
          friendship.user2Id === currentUser.id)
      ) {
        setFriendshipConfirmed(true);
        return true;
      }
      return false;
    });
    if (!friendshipFound) {
      return null;
    }
  };

  const addFriend = async () => {
    try {
      const response = await fetch("http://localhost:4700/add-friend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ username: currentUsername, friend: username }),
      });
      if (response.ok) {
        const data = await response.json();
        setFriendshipInitiated(true);
        await getFriends();
      } else if (response.status === 409) {
        return;
      }
    } catch (error) {
      throw error;
    }
  };

  const getCompatibility = async () => {
    try {
      const response = await fetch(`http://localhost:4700/spotify/compatibility?username=${currentUsername}&friend=${username}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCompatibility(data.compatibility);
        setLoading(false);
      }
    } catch (error) {
      throw error
    }

  }
  return (
    <div className="profile-page">
      <NavBar searchResults={searchResults} setSearchResults={setSearchResults}
      searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleSearch={handleSearch}/>
      <div className="main-content">
        <div className="profile-content">
          <img className="profile-pic" src="https://picsum.photos/200/300" />
          <h3 className="username">@{username}</h3>
          <h4 className="follower-count">
            {" "}
            {friends}{" "}
            {friends == 1 ? "friend" : "friends"}
          </h4>
          {spotifyUser &&
            spotifyUser.spotify &&
            spotifyUser.spotify.spotifyUrl && (
              <a className="spotify-url" href={spotifyUser.spotify.spotifyUrl} target="_blank" style={{ color: "green" }}>
                Spotify Profile
              </a>
            )}
          <a
            className="follow-button"
            onClick={ friendshipConfirmed || friendshipReceived || friendshipInitiated ? null : addFriend }
            style={{ color: "white" }}>
            {friendshipConfirmed ? "Friend" : friendshipInitiated ? "Added" : friendshipReceived ? "Accept" : "Follow +"}
          </a>
          <p className="compatibility-score" style={{ color: compatibility >= 70 ? "green" : compatibility >= 50 ? "orange" : "pink" }}>
          {loading ? (
              <CircularProgress color="secondary" />
            ) : (
              <>
                {compatibility}%
              </>
            )}
          </p>
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
                    <p className="song-name">{track.name}</p>
                    <p className="artist-names">
                      {track.artists.map((artist) => artist.name).join(", ")}
                    </p>
                    <p className="interaction-button"><FaRegHeart /></p>
                  </div>
                </div>
              ))
            ) : (
              <div className="song">
                <p style={{ justifyContent: "center", textAlign: "center" }}>
                  Spotify not synced
                </p>
              </div>
            )}
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
    </div>
  );
}
