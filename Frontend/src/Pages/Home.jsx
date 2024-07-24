import React, { useContext, useEffect, useState, useRef } from "react";
import NavBar from "../Components/NavBar";
import { RefreshTokenContext } from "../Context/RefreshTokenContext";
import { LogoutContext } from "../Context/LogoutContext";
import '../CSS/Home.css';
import { CircularProgress } from "@mui/material";
import Discover from "../Components/Discover";
import Posts from "../Components/Posts";
import Pagination from "../Components/Pagination"

export default function Home({ searchResults, setSearchResults, searchQuery, setSearchQuery, handleSearch }) {
  const refreshToken = useContext(RefreshTokenContext);
  const handleLogout = useContext(LogoutContext);
  const user = JSON.parse(localStorage.getItem("user"));
  const username = user.username;
  const accessToken = localStorage.getItem("accessToken")
  const [posts, SetPosts] = useState([])
  const hasRunRef = useRef(false);
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage, setPostsPerPage] = useState(5);

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

  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost)

  const paginate = (pageNumber)=>{
    setCurrentPage(pageNumber)
  }

  return (
  	<div>
		<NavBar searchResults={searchResults} setSearchResults={setSearchResults}
      	searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleSearch={handleSearch}/>
		<div className="postContainer">
      {loading ? (
        <CircularProgress color="primary" />
      ) : posts && posts.length > 0 ? (
        <>
        <Posts posts={currentPosts} accessToken={accessToken} getPosts={getPosts}/>
        <Pagination postsPerPage={postsPerPage} totalPosts={posts.length} paginate={paginate} currentPage={currentPage} setCurrentPage={setCurrentPage} />
        </>
      ) : (
        <div>
          <Discover user={user} searchResults={searchResults} setSearchResults={setSearchResults}
          searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleSearch={handleSearch}/>
        </div>
      )}
      	</div>
	</div>
  );
}
