import React, { useState, useContext, useEffect } from 'react';
import { UserContext } from '../UserContext';


export default function Main() {
    const [username, setUsername] = useState('');

    const getUsername = async () => {
        const accessToken = localStorage.getItem('accessToken')
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

    useEffect(()=> {
        getUsername();
    }, [username])

    return (
        <h1>Welcome {username}, Log in Successful!</h1>
    )
}
