import React, { useState, useContext, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../Context/UserContext";
import NavBar from "./NavBar";
import { RefreshTokenContext } from "../Context/RefreshTokenContext";
import { LogoutContext } from "../Context/LogoutContext";

export default function Main({
  searchResults,
  setSearchResults,
  searchQuery,
  setSearchQuery,
  handleSearch,
}) {
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const hasRunRef = useRef(false);
  const navigate = useNavigate();
  let currentAccessToken = localStorage.getItem("accessToken");
  const refreshToken = useContext(RefreshTokenContext);
  const handleLogout = useContext(LogoutContext);

  useEffect(() => {
    getUsername();
  }, [username]);

  useEffect(() => {
    if (!hasRunRef.current && code.length < 1) {
      hasRunRef.current = true;
      getSpotifyTokens();
    }
  }, [code]);

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

  const getUsername = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const username = user.username;
    setUsername(username);

    const response = await fetch("http://localhost:4700", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${currentAccessToken}`,
      },
      credentials: "include",
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem("tokenExpiration", data.exp);
    }
  };

  const handleAuthorization = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:4700/spotify/authorize", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const authorizationUrl = data.authorizationUrl;
        window.location.href = authorizationUrl;
      } else {
        alert("Error fetching authorization URL");
      }
    } catch (error) {
      alert("Error fetching authorization URL: " + error);
    }
  };

  const getSpotifyTokens = async () => {
    const query = new URLSearchParams(window.location.search);
    const code = query.get("code");
    setCode(code);
    const state = query.get("state");

    if (code && state) {
      try {
        const response = await fetch(
          `http://localhost:4700/spotify/callback?code=${code}&state=${state}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          const spotifyAccessToken = data.spotifyAccessToken;
          const expiresIn = data.expiresIn;
          const spotifyRefreshToken = data.spotifyRefreshToken;
          localStorage.setItem("spotifyAccessToken", spotifyAccessToken),
            localStorage.setItem("spotifyRefreshToken", spotifyRefreshToken);
          localStorage.setItem("spotifyTokenExpiration", expiresIn);
          await getProfile();
          const userId = localStorage.getItem("spotifyUserId");
          const spotifyUrl = localStorage.getItem("spotifyUrl");
          if (userId && spotifyUrl) {
            await saveSpotifyTokens(
              spotifyAccessToken,
              spotifyRefreshToken,
              userId,
              spotifyUrl,
            );
          }
        } else {
          alert("Failed to fetch tokens ", response.statusText);
        }
        navigate("/");
      } catch (error) {
        alert("Failed to fetch tokens ", error);
      }
    }
  };

  const getProfile = async () => {
    const spotifyAccessToken = localStorage.getItem("spotifyAccessToken");
    const response = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${spotifyAccessToken}`,
      },
    });
    if (response.ok) {
      const data = await response.json();
      const userId = data.id;
      const userSpotifyUrl = data.external_urls.spotify;
      localStorage.setItem("spotifyUserId", userId);
      localStorage.setItem("spotifyUrl", userSpotifyUrl);
    }
  };

  const saveSpotifyTokens = async (
    accessToken,
    refreshToken,
    userId,
    spotifyUrl,
  ) => {
    const user = JSON.parse(localStorage.getItem("user"));
    const username = user.username;
    try {
      if (!accessToken || !refreshToken) {
        throw new Error("Invalid input!");
      }
      const response = await fetch(
        "http://localhost:4700/spotify/save-tokens",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentAccessToken}`,
          },
          body: JSON.stringify({
            username,
            accessToken,
            refreshToken,
            userId,
            spotifyUrl,
          }),
        },
      );
      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage);
      }
    } catch (error) {
      alert("Unable to save tokens ", error);
    }
  };

  return (
    <>
      <NavBar
        handleLogout={handleLogout}
        handleSearch={handleSearch}
        searchResults={searchResults}
        setSearchResults={setSearchResults}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        refreshToken={refreshToken}
      />
      <h1>Welcome {username}, Log in Successful!</h1>
      <a href="#" onClick={handleAuthorization}>
        Login to Spotify
      </a>
    </>
  );
}
