import React from 'react'
import NavBar from '../Components/NavBar'

export default function History({ searchResults, setSearchResults, searchQuery, setSearchQuery, handleSearch, refreshToken }) {
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
