import { useState, useEffect } from "react";
import { UserContext } from "./Context/UserContext";
import { RefreshTokenContext } from "./Context/RefreshTokenContext";
import { LogoutContext } from "./Context/LogoutContext";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Login from "./Components/Login";
import Signup from "./Components/Signup";
import Main from "./Components/Main";
import Profile from "./Pages/Profile";
import Home from "./Pages/Home";
import SearchProfile from "./Components/SearchProfile";
import "./App.css";
import LogoutProvider from "./Context/LogoutProvider";

export default function App() {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [spotifyUser, setSpotifyUser] = useState(null)

  const updateUser = (newUser) => {
    setUser(newUser);
  };

  useEffect(() => {
    getSpotify()
    localStorage.setItem("user", JSON.stringify(user));
  }, [user]);

  const accessToken = localStorage.getItem("accessToken");
  const handleSearch = async () => {
    const response = await fetch("http://localhost:4700/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ searchQuery }),
    });
    if (response.ok) {
      const data = await response.json();
      setSearchResults(data);
    }
  };

  const refreshToken = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.username) {
      const username = user.username;
      if (!refreshToken) {
        throw new Error("Refresh token is missing");
      }
      try {
        const response = await fetch("http://localhost:4700/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, refreshToken }),
        });
        const data = await response.json();
        const { message, accessToken } = data;
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
      } catch (error) {
        throw error;
      }
    }
  };

  const getSpotify = async () => {
    try {
      const response = await fetch(`http://localhost:4700/user-spotify?userId=${user.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setSpotifyUser(data)
      } else if (response.status === 409){
        setSpotifyUser(null)
      }
    } catch (error){
      setSpotifyUser(null)
    }
  }

  return (
    <div className="app">
      <UserContext.Provider value={{ user, updateUser }}>
        <RefreshTokenContext.Provider value={refreshToken}>
          <BrowserRouter>
            <LogoutProvider>
              <Routes>
              <Route path="/" element={
                  user && spotifyUser  ? (
                    <Home searchResults={searchResults} setSearchResults={setSearchResults}
                          searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleSearch={handleSearch} setSpotifyUser={setSpotifyUser}/>
                  ) :
                  user ? (
                    <Main searchResults={searchResults} setSearchResults={setSearchResults}
                          searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleSearch={handleSearch}/>
                  ) : (
                    <Login />
                  )
                }/>
                <Route path="/login" element={<Login />}/>
                <Route path="/signup" element={<Signup />}/>
                <Route path="/home" element={<Home searchResults={searchResults} setSearchResults={setSearchResults}
                searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleSearch={handleSearch}/>}/>
                <Route path="/profile" element={<Profile searchResults={searchResults} setSearchResults={setSearchResults}
                  searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleSearch={handleSearch}/>}/>
                <Route path="/search-profile" element={<SearchProfile searchResults={searchResults} setSearchResults={setSearchResults}
                searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleSearch={handleSearch}/>} />
                <Route path="/main" element={<Main searchResults={searchResults} setSearchResults={setSearchResults}
                searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleSearch={handleSearch}/>} />
              </Routes>
            </LogoutProvider>
          </BrowserRouter>
        </RefreshTokenContext.Provider>
      </UserContext.Provider>
    </div>
  );
}
