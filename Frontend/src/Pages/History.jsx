import React from 'react'
import NavBar from '../Components/NavBar'

export default function History({ searchResults, setSearchResults, searchQuery, setSearchQuery, handleSearch }) {
    return (
        <>
             <NavBar searchResults={searchResults} setSearchResults={setSearchResults}
             searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleSearch={handleSearch} />
            <h1>My History</h1>
        </>
    )
}
