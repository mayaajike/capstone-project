import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'
import { UserContext } from '../UserContext';


export default function Main() {
    const [username, setUsername] = useState('');
    const navigate = useNavigate();
    const accessToken = localStorage.getItem('accessToken');

    // useEffect(() => {
    //     if (!accessToken) {
    //         refreshToken()
    //     }
    // })

    useEffect(()=> {
        getUsername();
    }, [username])


    // const refreshToken = async () => {
    //     const refreshToken = localStorage.getItem('refreshToken')
    //     console.log(refreshToken)
    //     const user = JSON.parse(localStorage.getItem('user'));
    //     const username = user.username;
    //     if (!refreshToken) {
    //         alert("Refresh token is missing");
    //         return;
    //     }
    //     try {
    //         const response = await fetch('http://localhost:4700/token', {
    //             method: "POST",
    //             headers: {
    //                 "Content-Type": 'application/json'
    //             },
    //             body: JSON.stringify({ username, refreshToken })
    //         });
    //         const data = await response.json()
    //         console.log(data)
    //         const { accessToken } = data;
    //         localStorage.setItem('accessToken', accessToken);
    //         getUsername();
    //         setTimeout(refreshToken, 1000);
    //     } catch(error) {
    //         alert('Failed to refresh token ' + error)
    //     }

    // }

    // setInterval(async () => {
    //     const accessToken = localStorage.getItem('accessToken');
    //     if (!accessToken || accessToken === 'null') {
    //         await refreshToken();
    //     }
    // }, 1000)

    const getUsername = async () => {
        const user = JSON.parse(localStorage.getItem('user'));
        console.log(user)
        if (!accessToken) {
            alert("Access Token is missing")
            return;
        }
        try {
            const response = await fetch('http://localhost:4700', {
                method: 'GET',
                headers: {
                    'Content-Type' : 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                credentials: 'include'
            })

            if (response.ok) {
                const data = await response.json()
                setUsername(data.username)
            } else{
                alert(`Failed to fetch data: ${response.status}`);
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
                    Authorization: `Bearer ${accessToken}`,
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
