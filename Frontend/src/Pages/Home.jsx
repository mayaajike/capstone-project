import React, { useContext, useEffect, useState, useRef } from "react";
import NavBar from "../Components/NavBar";
import { RefreshTokenContext } from "../Context/RefreshTokenContext";
import { LogoutContext } from "../Context/LogoutContext";
import '../CSS/Home.css';
import { FaHeart } from "react-icons/fa";
import SearchProfile from "../Components/SearchProfile";
import { useNavigate } from 'react-router-dom';
import { CircularProgress } from "@mui/material";

export default function Home({ searchResults, setSearchResults, searchQuery, setSearchQuery, handleSearch }) {
  const refreshToken = useContext(RefreshTokenContext);
  const handleLogout = useContext(LogoutContext);
  const user = JSON.parse(localStorage.getItem("user"));
  const username = user.username;
  const accessToken = localStorage.getItem("accessToken")
  const [posts, SetPosts] = useState([])
  const hasRunRef = useRef(false);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true)

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
    if (!hasRunRef.current && posts.length < 1) {
		hasRunRef.current = true;
		getPosts()
    }
  }, [])

  const getPosts = async () => {
    try {
		const similarSongResponse = await fetch(`http://localhost:4700/comp-recently-played`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${accessToken}`
			},
			body: JSON.stringify({ username })
		})
		if (similarSongResponse.ok) {
			await new Promise(resolve => setTimeout(resolve, 1000));
			const postsResponse = await fetch(`http://localhost:4700/posts?username=${username}`, {
				method: "GET",
				headers:{
				"Content-Type": "application/json",
				"Authorization": `Bearer ${accessToken}`
				}
			})
			if (postsResponse.ok) {
				const data = await postsResponse.json()
        SetPosts(data.posts)
				setLoading(false)
			}
			}
    } catch (error) {
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

  const openProfile = async (value) => {
    const response = await fetch(
      `http://localhost:4700/profile?username=${value}`,
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
      <SearchProfile
        refreshToken={refreshToken}
        handleSearch={handleSearch}
        searchResults={searchResults}
        setSearchResults={setSearchResults}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />;
      navigate("/search-profile", { state: data });
    }
  };

  const handleLike = async (event, post) => {
	event.preventDefault()
	let endpoint;
	if (post.likes <= 0 ){ endpoint = 'like-post' }
	else { endpoint = 'remove-like' }
	try {
		const response = await fetch(`http://localhost:4700/${endpoint}`, {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${accessToken}`
			},
			body: JSON.stringify({ post })
		})
		if (response.ok) {
			const data = await response.json()
			getPosts()
		}
	} catch (error){
		throw error
	}
  }

  return (
  	<div>
		<NavBar searchResults={searchResults} setSearchResults={setSearchResults}
      	searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleSearch={handleSearch}/>
		<div className="postContainer">
			{loading ? (
				<CircularProgress color="primary" />
			): (
				posts && posts.map((post, index) => (
					<div className="post" key={index}>
				  <div className="postContent">
					<p className="postUsername" onClick={() => openProfile(post.text.match(/@(\w+)\s/)[0].split(" ")[0].slice(1))}>{post.text.match(/@(\w+)\s/)[0]}</p>
					<p className="postText">{post.text.startsWith('@') ? post.text.slice(1) : post.text}</p>
					<div className="songHeader">
					  <img src={post.track.albumCover} alt="Album Cover" className="albumCover" />
					  <div className="songInfo">
					  <p className="postSong">{post.track.track}</p>
					  <p className="postArtists">{post.track.artist.map((artist) => artist).join(", ")}</p>
					  </div>
					</div>
				  <p className="postLike" onClick={(event) => handleLike(event, post)}>
						<FaHeart style={{ color: post.likes === 0 ? 'lightgrey' : 'red' }}/>
					</p>
				  <p className="timestamp">{calcTimeStamp(post.createdAt)}</p>
				  </div>
				  </div>
			  ))
			)
			}
      	</div>
	</div>
  );
}
