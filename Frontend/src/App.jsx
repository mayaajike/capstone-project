import { useState, useEffect } from 'react'
import { UserContext } from './Context/UserContext'
import { RefreshTokenContext } from './Context/RefreshTokenContext'
import { LogoutContext } from './Context/LogoutContext'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import Login from './Components/Login'
import Signup from './Components/Signup'
import Main from './Components/Main'
import Profile from './Pages/Profile'
import History from './Pages/History'
import SearchProfile from './Components/SearchProfile'
import './App.css'
import LogoutProvider from './Context/LogoutProvider'

export default function App() {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  })
  const [searchResults, setSearchResults] = useState([])
  const [searchQuery, setSearchQuery] = useState('');

  const updateUser = (newUser) => {
    setUser(newUser)
  }

  useEffect(() => {
    localStorage.setItem('user', JSON.stringify(user));
  }, [user])

  const accessToken = localStorage.getItem("accessToken")
  const handleSearch = async () => {
    const response = await fetch('http://localhost:4700/search', {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify({ searchQuery })
    })
    if (response.ok) {
        const data = await response.json()
        setSearchResults(data);
    }
}

  const refreshToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.username) {
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
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
      } catch(error) {
          alert('Failed to refresh token ' + error)
      }
    }
  }

//   const handleLogout = async (e) => {
//     const navigate = useNavigate();
//     e.preventDefault();
//     const user = JSON.parse(localStorage.getItem('user'));
//     const username = user.username;
//     const accessToken = localStorage.getItem("accessToken")
//     try {
//         const response = await fetch('http://localhost:4700/logout', {
//             method: "POST",
//             headers: {
//                 'Content-Type': 'application/json',
//                 Authorization: `Bearer ${accessToken}`,
//             },
//             credentials: 'include',
//             body: JSON.stringify({ username }),
//         })

//         if (response.ok) {
//             localStorage.clear();
//             setUser(null)
//             navigate('/login')
//         } else {
//             alert('Logout failed')
//         }
//     } catch (error) {
//         alert('Logout failed: ' + error)
//     }
// }


  return (
    <div className='app'>
      <UserContext.Provider value = {{ user, updateUser }}>
        <RefreshTokenContext.Provider value = {refreshToken}>
          <BrowserRouter>
            <LogoutProvider>
              <Routes>
                <Route path='/' element={user ? <Main searchResults={searchResults} setSearchResults={setSearchResults}
                searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleSearch={handleSearch} /> : <Login />} />
                <Route path='/login' element={<Login />} />
                <Route path='/signup' element={<Signup />} />
                <Route path='/profile' element={<Profile searchResults={searchResults} setSearchResults={setSearchResults}
                searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleSearch={handleSearch} />} />
                <Route path='/history' element={<History searchResults={searchResults} setSearchResults={setSearchResults}
                searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleSearch={handleSearch} />} />
                <Route path='/search-profile' element={<SearchProfile />} />
              </Routes>
            </LogoutProvider>
          </BrowserRouter>
        </RefreshTokenContext.Provider>
      </UserContext.Provider>

    </div>
  )
}
