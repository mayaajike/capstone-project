import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserContext } from '../UserContext';
import '../CSS/Signup.css'

export default function Signup() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { updateUser } = useContext(UserContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        try {
            const response = await fetch(`http://localhost:4700/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ firstName, lastName, username, email, password }),
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                const loggedInUser = data.user;

                console.log('Signup Successful!')

                setFirstName('');
                setLastName('');
                setUsername('');
                setEmail('');
                setPassword('');

                updateUser(loggedInUser)

                navigate('/')
            }else {
                alert('Signup failed!');
            }
        } catch (error) {
            alert('Signup failed' + error);
        }
    }

    return (
        <div className='signup-container'>
            <form className='signup-form' onSubmit={handleSubmit}>
                <h2>Sign Up</h2>
                <div className='form-group'>
                    <label htmlFor='firstName'>First Name:</label>
                    <input type="text" id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required/>
                </div>

                <div className='form-group'>
                    <label htmlFor='lastName'>Last Name:</label>
                    <input type="text" id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required/>
                </div>

                <div className='form-group'>
                    <label htmlFor='username'>Username:</label>
                    <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} required/>
                </div>

                <div className='form-group'>
                    <label htmlFor='email'>Email:</label>
                    <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required/>
                </div>

                <div className='form-group'>
                    <label htmlFor='password'>Password:</label>
                    <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required/>
                </div>
                <button type='submit'>Sign Up</button>
                <p>Already have an account? <Link to="/login">Login</Link></p>
            </form>
        </div>
    )
}
