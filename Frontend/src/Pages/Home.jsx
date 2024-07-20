import React, { useContext, useEffect } from "react";
import NavBar from "../Components/NavBar";
import { RefreshTokenContext } from "../Context/RefreshTokenContext";
import { LogoutContext } from "../Context/LogoutContext";
import '../CSS/Home.css';
import { FaRegHeart } from "react-icons/fa";

export default function Home({ searchResults, setSearchResults, searchQuery, setSearchQuery, handleSearch }) {
  const refreshToken = useContext(RefreshTokenContext);
  const handleLogout = useContext(LogoutContext);
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
  return (
    <div>
      <NavBar searchResults={searchResults} setSearchResults={setSearchResults}
      searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleSearch={handleSearch}/>
      <div className="post-container">
        <div className="post">
          <div className="post-content">
              <p className="postUsername">@username</p>
              <p className="postSong">A post can also contain a song</p>
              <p className="postText">This is a post text</p>
              <p className="postLike"><FaRegHeart /></p>
              <p className="timestamp">Time stamp</p>
          </div>
        </div>
        <div className="post">
          <div className="post-content">
              <p className="postUsername">@username</p>
              <p className="postSong">A post can also contain a song</p>
              <p className="postText">This is a post text</p>
              <p className="postLike"><FaRegHeart /></p>
              <p className="timestamp">Time stamp</p>
          </div>
        </div>
      </div>
    </div>
  );
}
