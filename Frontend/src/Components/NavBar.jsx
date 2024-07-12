import React, { useContext } from 'react';
import Nav from 'react-bootstrap/Nav';
import "bootstrap/dist/css/bootstrap.min.css";
import '../CSS/NavBar.css';
import SearchBar from './SearchBar';
import { RefreshTokenContext } from '../Context/RefreshTokenContext';
import { LogoutContext } from '../Context/LogoutContext';


export default function NavBar({ handleSearch, searchResults, setSearchResults, searchQuery, setSearchQuery, username }) {
    const refreshToken = useContext(RefreshTokenContext)
    const handleLogout = useContext(LogoutContext)
    const navItems = [
        { label: "Home", href: '/' },
        { label: "History", href: '/history'},
        { label: "Your Profile", href: '/profile'},
        { label: "Log Out", onClick: handleLogout },
        { label: 'Search', component: (
            <SearchBar
            handleSearch={handleSearch}
            searchResults={searchResults}
            setSearchResults={setSearchResults}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            username={username}
            refreshToken={refreshToken}/>
        ), className: "search-bar"}
    ]


    return (
    <div className='nav-bar'>
        <Nav variant="pills" className="justify-content-center">
            {navItems.map((item, index) => (
                <Nav.Item key={index} className={item.label === "Search" ? "search-bar" : ""}>
                    {item.component ? (
                        item.component
                    ) : (
                        <Nav.Link href={item.href} onClick={item.onClick}>
                            {item.label}
                        </Nav.Link>
                    )}
                </Nav.Item>
            ))}
        </Nav>
    </div>
  );
}
