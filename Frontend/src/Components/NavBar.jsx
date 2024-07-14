import React, { useContext, useState, useEffect, useRef } from 'react';
import Nav from 'react-bootstrap/Nav';
import "bootstrap/dist/css/bootstrap.min.css";
import '../CSS/NavBar.css';
import SearchBar from './SearchBar';
import { RefreshTokenContext } from '../Context/RefreshTokenContext';
import { LogoutContext } from '../Context/LogoutContext';
import { LiaUserFriendsSolid } from "react-icons/lia";
import { Badge } from '@mui/material';
import Dropdown from 'react-bootstrap/Dropdown'
import { MdOutlineCancel } from "react-icons/md";
import { FaRegCheckCircle } from "react-icons/fa";

export default function NavBar({ handleSearch, searchResults, setSearchResults, searchQuery, setSearchQuery }) {
    const refreshToken = useContext(RefreshTokenContext)
    const handleLogout = useContext(LogoutContext)
    const [friendRequests, setFriendRequests] = useState(0);
    const user =  JSON.parse(localStorage.getItem("user"))
    const username = user.username
    const accessToken = localStorage.getItem("accessToken")
    const [showFriendRequests, setShowFriendRequests] = useState(false)
    const [friendRequestsList, setFriendRequestsList] = useState([])
    const hasRunRef = useRef(false);

    useEffect(() => {
        if (!hasRunRef.current ) {
            hasRunRef.current = true;
            getFriendRequests()
        }
    }, [])

    const toggleFriendRequests = () => {
        setShowFriendRequests(!showFriendRequests)
    }

    const getFriendRequests = async () => {
        try {
            const response = await fetch(`http://localhost:4700/friends?username=${username}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`
                }
            })
            if (response.ok) {
                const data = await response.json()
                const receivedFriendships = data.receivedFriendships
                let received = 0;
                receivedFriendships.map(async (friendship) => {
                    if (!friendship.receiverConfirmed) {
                        received += 1
                        const username = await getUsername(friendship.initiatorId)
                    }
                })
                setFriendRequests(received)
            }
        } catch (error) {
            throw error
        }
    }

    const getUsername = async (userId) => {
        try {
            const response = await fetch(`http://localhost:4700/user?userId=${userId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`
                }
            })
            if (response.ok) {
                const data = await response.json()
                setFriendRequestsList(prevList => [...prevList, data.user.username])
            }
        } catch (error) {
            throw error
        }
    }

    const FriendRequestsBadge = () =>  (
        <Badge color="secondary" badgeContent={friendRequests}>
            <LiaUserFriendsSolid onClick={toggleFriendRequests}/>
        </Badge >
    )

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
        ), className: "search-bar"},
        { label: "Friend Requests", component: <FriendRequestsBadge />, className: "requests" }
    ]

    const acceptFriendRequest = async (friend) => {
        try {
            const response = await fetch("http://localhost:4700/accept-request", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`
                },
                body: JSON.stringify({ username: username, friend: friend })
            })
            if (response.ok) {
                const data = await response.json()
                getFriendRequests()
                if (friendRequestsList){
                    setFriendRequestsList((prevList) => prevList.filter((username) => username !== friend))
                }
            }
        } catch(error) {
            throw error
        }
    }

    const declineFriendRequest = async (friend) => {
        try {
            const response = await fetch("http://localhost:4700/decline-request", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`
                },
                body: JSON.stringify({ username: username, friend: friend})
            })
            if (response.ok) {
                const data = await response.json()
                getFriendRequests()
                if (friendRequestsList) {
                    setFriendRequestsList((prevList) => prevList.filter((username) => username !== friend))
                }
            }
        } catch (error) {
            throw error
        }
    }

    return (
        <div>
            <div className='nav-bar'>
                <Nav variant="pills" className="justify-content-center">
                    {navItems.map((item, index) => (
                        <Nav.Item key={index} className={item.label === "Search" ? "search-bar" : item.label === "Friend Requests" ? "requests" : ""}>
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

            {showFriendRequests && (
                <Dropdown.Menu show={showFriendRequests} onClick={(() => setShowFriendRequests(false))} className='friend-requests-menu'>
                    {friendRequestsList && friendRequestsList.map((friend, index) => (
                        <Dropdown.Item key={index} className='friend-requests-item'>{friend} <MdOutlineCancel className='decline' onClick={() => declineFriendRequest(friend)}/> <FaRegCheckCircle className='accept' onClick={() => acceptFriendRequest(friend)}/></Dropdown.Item>
                    ))}
                </Dropdown.Menu>
            )}
        </div>
  )
}
