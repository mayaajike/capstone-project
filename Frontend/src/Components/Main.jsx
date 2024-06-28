import React, { useContext } from 'react';
import { UserContext } from '../UserContext';


export default async function Main() {
    const { updateUser } = useContext(UserContext);


    try {
        const response = await fetch(`http://localhost:4700/users/login`,{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, username, password }),
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            const loggedInUser = data.user;

            updateUser(loggedInUser);
            navigate('/');
            console.log(updateUser)
        } else {
            alert('Login Failed');
        }
    } catch (error) {
        alert('Login failed' + error);
    }
    return (
        <h1>Welcome Log in Successful!</h1>
    )
}
