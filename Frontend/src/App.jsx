import { useState, useEffect } from 'react'
import { UserContext } from './UserContext'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './Components/Login'
import Signup from './Components/Signup'
import Main from './Components/Main'
import './App.css'

export default function App() {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  })

  const updateUser = (newUser) => {
    setUser(newUser)
  }

  useEffect(() => {
    localStorage.setItem('user', JSON.stringify(user));
  }, [user])

  return (
    <div className='app'>
      <UserContext.Provider value = {{ user, updateUser }}>
        <BrowserRouter>
          <Routes>
            <Route path='/' element={user ? <Main /> : <Login />} />
            <Route path='/login' element={<Login />} />
            <Route path='/signup' element={<Signup />} />
          </Routes>
        </BrowserRouter>
      </UserContext.Provider>

    </div>
  )
}
