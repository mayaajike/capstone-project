import React, { useState, useEffect, useContext } from 'react';
import "../CSS/Discover.css"
import { useNavigate } from "react-router-dom"
import SearchProfile from './SearchProfile';
import { LogoutContext } from "../Context/LogoutContext";

export default function Discover({ user, searchResults, setSearchResults, searchQuery, setSearchQuery, handleSearch }) {
    const [newFriends, setNewFriends] = useState([])
    const [hasFetched, setHasFetched] = useState(false)
    const navigate = useNavigate()
    const refreshToken = localStorage.getItem("refreshToken")
    const handleLogout = useContext(LogoutContext);

    useEffect(() => {
        if (!hasFetched){
            findNewFriends()
            setHasFetched(true)
        }
    }, [])

    const findNewFriends = async () => {
        try {
            const response = await fetch(`http://localhost:4700/discover?username=${user.username}`, {
                method: "GET",
                headers:{
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${user.accessToken}`
                }
            })
            if (response.status === 200){
                const data = await response.json()
                console.log(data)
                setNewFriends(data.newFriends)
            }
        } catch (error){
            return;
        }
    }

    const openProfile = async (value) => {
        const response = await fetch(
          `http://localhost:4700/profile?username=${value}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${user.accessToken}`,
            },
        })
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
    }
    return (
        <div>
            <h1 className='title'>You might know...</h1>
            <div className="discover-container">
            <div className='discover-content'>
                {newFriends && newFriends.map((friend, index) => (
                    <div className="friend-container" key={index} onClick={() => openProfile(friend.username)}>
                        <img src={`https://picsum.photos/200/300?random=${index}`} alt="Friend's avatar" />
                        <p>{friend.username}</p>
                    </div>
                ))}
            </div>
            </div>
        </div>
    )
}
