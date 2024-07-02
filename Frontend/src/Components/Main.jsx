import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'
import { UserContext } from '../UserContext';


export default function Main() {
    const [username, setUsername] = useState('');
    const navigate = useNavigate();
    let currentAccessToken = localStorage.getItem('accessToken')

    useEffect(()=> {
        getUsername();
    }, [username])

    const refreshToken = async () => {
        const refreshToken = localStorage.getItem('refreshToken')
        const user = JSON.parse(localStorage.getItem('user'));
        const username = user.username;
        if (!refreshToken) {
            alert("Refresh token is missing");
            return;
        }
        try {
            const response = await fetch('http://localhost:4700/token', {
                method: "POST",
                headers: {
                    "Content-Type": 'application/json'
                },
                body: JSON.stringify({ username, refreshToken })
            });
            const data = await response.json()
            const { message, accessToken } = data;
            currentAccessToken = accessToken;
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            getUsername();
        } catch(error) {
            alert('Failed to refresh token ' + error)
        }
    }

    setInterval(async () => {
        const currentTime = new Date().getTime() / 1000;
        const tokenExpiration = localStorage.getItem("tokenExpiration");
        if ( currentTime >= tokenExpiration) {
            await refreshToken();
        }
    }, 300000)

    const getUsername = async () => {
        if (!currentAccessToken || currentAccessToken === null) {
            alert("Access Token is missing")
            return;
        }
        try {
            const response = await fetch('http://localhost:4700', {
                method: 'GET',
                headers: {
                    'Content-Type' : 'application/json',
                    Authorization: `Bearer ${currentAccessToken}`,
                },
                credentials: 'include'
            })

            if (response.ok) {
                const data = await response.json()
                localStorage.setItem('tokenExpiration', data.exp)
                const validUntil = data.exp - data.iat;
                setUsername(data.username)
            } else{
                alert(`Failed to fetch key: ${response.status}`);
        }
        }catch (error) {
            alert('Login failed' + error);
    }}

    const handleLogout = async (e) => {
        e.preventDefault();
        const user = JSON.parse(localStorage.getItem('user'));
        const username = user.username;
        try {
            const response = await fetch('http://localhost:4700/logout', {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${currentAccessToken}`,
                },
                credentials: 'include',
                body: JSON.stringify({ username }),
            })

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('accessToken', data.user.accessToken);
                localStorage.setItem('refreshToken', data.user.refreshToken);


                setUsername('')
                navigate('/login')
            } else {
                alert('Logout failed')
            }
        } catch (error) {
            alert('Logout failed: ' + error)
        }
    }


    return (
        <>
            <h1>Welcome {username}, Log in Successful!</h1>
            <a href="#" onClick={handleLogout}>Logout</a>
        </>

    )
}
