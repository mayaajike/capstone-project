import React, { useContext } from 'react'
import NavBar from '../Components/NavBar'
import { RefreshTokenContext } from '../Context/RefreshTokenContext';
import { LogoutContext } from '../Context/LogoutContext';

export default function History({ searchResults, setSearchResults, searchQuery, setSearchQuery, handleSearch }) {
    const refreshToken = useContext(RefreshTokenContext)
    const handleLogout = useContext(LogoutContext)
    setInterval(async () => {
        const currentTime = new Date().getTime() / 1000;
        const tokenExpiration = localStorage.getItem("tokenExpiration");
        if ( currentTime >= tokenExpiration) {
            await refreshToken();
        }
    }, 30000)

    return (
        <>
             <NavBar searchResults={searchResults} setSearchResults={setSearchResults}
             searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleSearch={handleSearch} />
            <h1>My History</h1>
        </>
    )
}
