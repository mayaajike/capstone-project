import React, { useState, useEffect } from 'react';
import { FaHeart } from "react-icons/fa";
import { useNavigate } from "react-router-dom"
import SearchProfile from './SearchProfile';
import "../CSS/Home.css"

export default function Posts({ posts, accessToken }) {
    const navigate = useNavigate()
    const [likedPosts, setLikedPosts] = useState({});

    useEffect(() => {
        const initialLikedPosts = {}
        posts.forEach((post) => {
            initialLikedPosts[post.id] = post.liked > 1;
        })
        setLikedPosts(initialLikedPosts)
    }, [posts])



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
          <SearchProfile />;
          navigate("/search-profile", { state: data });
        }
      };

      const handleLike = async (post) => {
        setLikedPosts(prevState => ({
            ...prevState,
            [post.id]: !prevState[post.id]
        }));
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
        } catch (error){
            throw error
        }
    }

    return (
        posts.map((post, index) => (
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
                <p className="postLike" onClick={(event) => handleLike(post)}>
                    <FaHeart style={{ color: post.likes > 0 ? 'red' : likedPosts[post.id] ? 'red' : 'lightgrey' }} />
                </p>
                <p className="timestamp">{calcTimeStamp(post.createdAt)}</p>
              </div>
            </div>
          ))
    )
}
