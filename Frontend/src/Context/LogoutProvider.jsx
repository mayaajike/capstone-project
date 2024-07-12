import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogoutContext } from './LogoutContext';

export default function LogoutProvider({ children }){
    const navigate = useNavigate()

    const handleLogout = async (e) => {
        e.preventDefault();
        const user = JSON.parse(localStorage.getItem('user'));
        const username = user.username;
        const accessToken = localStorage.getItem("accessToken")
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
                localStorage.clear();
                navigate('/login')
            } else {
                alert('Logout failed')
            }
        } catch (error) {
            alert('Logout failed: ' + error)
        }
    }

    return (
        <LogoutContext.Provider value={handleLogout}>
            {children}
        </LogoutContext.Provider>
    )
}
