import React, { useState, useEffect, useContext  } from 'react'
import '../CSS/SearchBar.css'
import { useNavigate } from 'react-router-dom'
import SearchProfile from './SearchProfile';
import { RefreshTokenContext } from '../Context/RefreshTokenContext';

export default function SearchBar({ handleSearch, searchResults, setSearchResults, searchQuery, setSearchQuery, username }) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchDisplay, setSearchDisplay] = useState([]);
    const accessToken = localStorage.getItem("accessToken");
    const navigate = useNavigate()
    const refreshToken = useContext(RefreshTokenContext)

    const handleChange = (event) => {
        setSearchQuery(event.target.value);
        handleSearch();
        setIsOpen(true)
        handleFilter(event.target.value);
        if (event.target.value === ''){
            setSearchResults([]);
            setIsOpen(false)
        }
    }

    const handleFilter = (value) => {
        if (searchResults.results) {
            const result = searchResults.results.filter(f => {
                return f.username.toLowerCase().includes(value)
            });
            setSearchDisplay(result)
        }
    }

    const openProfile = async (value) => {
        const response = await fetch(`http://localhost:4700/profile?username=${value}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            }
        })

        if (response.ok) {
            const data = await response.json();
            <SearchProfile refreshToken={refreshToken} handleSearch={handleSearch} searchResults={searchResults} setSearchResults={setSearchResults} searchQuery={searchQuery} setSearchQuery={setSearchQuery}/>
            navigate('/search-profile', { state: data });
        }
    }

    return(
        <div>
            <div className='search'>
                <input type='search' placeholder='Search...' id="search-bar" onChange={handleChange} />
            </div>

            <div className='search-result'>
                {searchDisplay && searchDisplay.map((user, index) => (
                    <div key={index} onClick={() => {openProfile(user.username)}}>
                        @{user.username}
                    </div>
                ))}
            </div>
        </div>
    )
}
