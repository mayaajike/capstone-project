import React, { useContext, useEffect } from "react";
import NavBar from "../Components/NavBar";
import { RefreshTokenContext } from "../Context/RefreshTokenContext";
import { LogoutContext } from "../Context/LogoutContext";

export default function History({
  searchResults,
  setSearchResults,
  searchQuery,
  setSearchQuery,
  handleSearch,
}) {
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
    <>
      <NavBar
        searchResults={searchResults}
        setSearchResults={setSearchResults}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearch={handleSearch}
      />
      <h1>My History</h1>
    </>
  );
}
