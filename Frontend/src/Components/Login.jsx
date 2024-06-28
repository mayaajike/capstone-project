import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserContext } from '../UserContext';
import '../CSS/Login.css'


export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const { updateUser } = useContext(UserContext);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`http://localhost:4700/users/login`,{
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, username, password }),
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                const loggedInUser = data.user;
                localStorage.setItem('accessToken', data.user.accessToken);
                localStorage.setItem('refreshToken', data.user.refreshToken);

                updateUser(loggedInUser);
                navigate('/');
            } else {
                alert('Login Failed');
            }
        } catch (error) {
            alert('Login failed' + error);
        }
    };

    const refreshToken = async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await fetch(`http://localhost:4700/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, refreshToken })
        });

        if (response.ok) {
            const data = await response.json()
            const newAccessToken = data.user.accessToken

            localStorage.setItem('accessToken', newAccessToken)
        } else {
            console.log("Token refresh failed")
        }
    }

    return (
        <div className='login-container'>
            <form className='login-form' onSubmit={handleLogin}>
                <h2>Login</h2>
                <div className='form-group'>
                    <label htmlFor='email'>Email:</label>
                    <input type="text" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>

                <div className='form-group'>
                    <label htmlFor='username'>Username:</label>
                    <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                </div>

                <div className='form-group'>
                    <label htmlFor='password'>Password:</label>
                    <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <button type='submit'>Login</button>
                <p>New Here? <Link to="/signup">Sign Up</Link></p>
            </form>
        </div>
    )
}
