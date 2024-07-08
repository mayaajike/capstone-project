require('dotenv').config()
const bcrypt = require('bcryptjs')
const cors = require('cors')
const express = require('express')
const app = express()
app.use(express.json());
const corsOptions = {
    origin: 'http://localhost:5173',
    credentials: true,
    optionsSuccessStatus: 200
  };
  app
app.use(cors(corsOptions))
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const PORT = process.env.PORT || 3000
const jwt = require('jsonwebtoken')


const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword
}

const verifyPassword = async(submittedPassword, storedHash) => {
    return bcrypt.compare(submittedPassword, storedHash);
}

const validatePassword = (password, passwordAgain) => {
    errors = []
    if (!password) errors.push("Password cannot be empty")
    if (password.length < 8) errors.push("Password must have at least 8 characters")
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push("Password must contain special characters")
    if (!/\d/.test(password)) errors.push("Password must contain a number")
    if (!/[A-Z]/.test(password)) errors.push("Password must contain at least one capital letter")
    if (password !== passwordAgain) errors.push("Passwords do not match")

    if (errors.length > 0) return { errorCode: 401, errorMessage: "Invalid Password, Try Again"}
   return { errorCode: 200, errorMessage: "Password is Valid" }
}


async function findUser(username) {
    const user = await prisma.user.findUnique({
        where: {
            username: username,
        },
    })
    return user;
}

async function updateUser(username, accessToken, refreshToken) {
    await prisma.user.update({
        where: {
            username: username
        },
        data: {
            accessToken: accessToken,
            refreshToken: refreshToken
        },
    })
}

const findSpotifyUser = async (userId) => {
    const user = await prisma.spotifyAccount.findFirst({
        where: {
            userId: userId,
        },
    })
    return user
}

async function updateSpotifyUser(userId, accessToken, refreshToken) {
    await prisma.spotifyAccount.update({
        where: {
            userId: userId
        },
        data: {
            accessToken: accessToken,
            refreshToken: refreshToken
        }
    })
}

function generateAccessToken(user){
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "10m" })
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (token === null) return res.status(401).json({ error: "Invalid user" });

    try {
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            if (err) return res.status(403).json({ error: "Invalid token" });
            const existingUser = findUser(JSON.stringify(user))
            if (existingUser) {
                req.user = user;
                next()
            }
        })
    } catch (error){
        res.status(500).json({ error: "Server error" })
    }
}

app.get('/', authenticateToken, async (req, res) => {
    res.json(req.user)
})

app.get('/users', async (req, res) => {
    const users = await prisma.user.findMany()
    res.json(users)
})

// route to create a new user.
app.post('/users/signup', async (req, res) => {
    const { firstName, lastName, username, email, password, passwordAgain } = req.body;
    try {
        const existingUser = await findUser(username)
        if (existingUser) {
            return res.status(400).json({ error: 'Username or email already exists' })
        } else {
            const isValid = validatePassword(password, passwordAgain)
            if (isValid.errorCode === 401) return res.status(401).json({ error: isValid.errorMessage})
        }
            const hashedPassword = await hashPassword(password);
            const user = { username: username, password: password }
            const accessToken = generateAccessToken(user)
            const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET)
            const newUser = await prisma.user.create({
                data: {
                    firstName: firstName,
                    lastName: lastName,
                    username: username,
                    email: email,
                    password: hashedPassword,
                    accessToken: accessToken,
                    refreshToken: refreshToken
                }
            });
            res.json({ user: newUser });
        } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// route for user login
app.post('/users/login', async (req, res) => {

    const { username, password } = req.body;
    try {
        const existingUser = await findUser(username)
        if (!existingUser) {
            return res.status(401).json({ error: "Invalid username or password" })
        } else {
            const isValidPassword = await verifyPassword(password, existingUser.password);
            if (!isValidPassword) {
                return res.status(401).json({ error: "Invalid password" });
            }
            const user = { username: username }
            const accessToken = generateAccessToken(user)
            const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET)
            existingUser.accessToken = accessToken
            existingUser.refreshToken = refreshToken
            await updateUser(username, accessToken, refreshToken)
            return res.status(200).json({
                message: "Login successful!",
                user: existingUser
            });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
})


app.post('/logout', async (req, res) => {
    const { username } = req.body;

    try {
        const existingUser = await findUser(username);
        if (!existingUser) return res.status(401).json({ error: "User doesn't exist" })
        existingUser.accessToken = null;
        existingUser.refreshToken = null;
        await updateUser(username, existingUser.accessToken, existingUser.refreshToken)
        return res.status(200).json({
            message: "Logout successful!",
            user: existingUser
        });
    } catch {
        res.status(500).json({ error: "Server error" });
    }
})

app.post('/token', async (req, res) => {
    const { username, refreshToken } = req.body;
    let newAccessToken;
    try {
        const existingUser = await findUser(username)
        const currentUser = { username: username }
        if (refreshToken === null || existingUser.refreshToken !== refreshToken) return res.status(401).json({ error: "Invalid token" })
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
            if (err) return res.status(403).json({ error: "Invalid Token" })
            existingUser.accessToken = generateAccessToken(user)
        })

        existingUser.accessToken = newAccessToken
        await updateUser(username, newAccessToken, refreshToken)
        return res.status(200).json({ message: "Token refreshed" })
    } catch (error) {
        res.status(500).json({ error: 'Server error'})
    }

})

function generateAccessToken(user){
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "3s" })
}

app.get('/authorize', async (req, res) => {

    try {
        const state = await generateRandomString(16);
        const responseType = "code"
        const scope = 'user-read-private user-read-email user-top-read user-library-read';
        const authorizationUrl = `https://accounts.spotify.com/authorize?response_type=${responseType}&client_id=${clientId}&scope=${scope}&redirect_uri=${redirectUri}&state=${state}`
        res.status(200).json({ authorizationUrl: authorizationUrl })
    }catch (error) {
        res.status(500).json({ error: 'Server error' })
    }
});

app.get('/callback', async (req, res) => {
    const code = req.query.code || null;
    const state = req.query.state || null;
    const stateMismatch = 'state_mismatch'

    try {
        if (state === null) {
            res.redirect(`/#?error=${stateMismatch}`)
        } else {
            const authOptions = {
                method: "POST",
                headers: {
                    'Content-type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + (new Buffer.from(`${clientId}:${clientSecret}`).toString('base64'))
                },
                body: `grant_type=authorization_code&code=${code}&redirect_uri=${redirectUri}`,
            };

            const tokenResponse = await fetch('https://accounts.spotify.com/api/token', authOptions);
            if (tokenResponse.ok) {
                const tokenData = await tokenResponse.json();
                const { access_token, token_type, scope, expires_in, refresh_token } = tokenData;

                res.status(200).json({
                    spotifyAccessToken: access_token,
                    tokenType: token_type,
                    scope: scope,
                    expiresIn: expires_in,
                    spotifyRefreshToken: refresh_token
                })
            } else {
                const errorMessage = await tokenResponse.text();
                res.status(500).json({ error: errorMessage })
            }
        }
    } catch (error) {
        res.status(500).json({ error: "Server error"})
    }
});

app.post('/save-tokens', async (req, res) => {
  const { username, accessToken, refreshToken, userId, spotifyUrl } = req.body;
  const currentUser = await findUser(username)
    try {

        const existingSpotifyAccount = await findSpotifyUser(currentUser.id)
        if (!existingSpotifyAccount) {
            await prisma.spotifyAccount.create({
                data: {
                    spotifyId: userId,
                    accessToken: accessToken,
                    refreshToken: refreshToken,
                    spotifyUrl: spotifyUrl,
                    user:{
                        connect: currentUser
                    }
                }
            });
        } else {
            await prisma.spotifyAccount.update({
                where: {
                    userId: existingSpotifyAccount.userId
                },
                data: {
                    accessToken: accessToken,
                    refreshToken: refreshToken
                }
            })
        }
        res.status(200).json({
            message: "Tokens saved",
            accessToken: accessToken
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: "Server error"})
    }
}


async function getTopSongs(accessToken) {
    const timeRange = "short_term"
    const limit = 10

    try {
        const response = await fetch(`https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=${limit}&offset=0`, {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            }
        });
        if (response.ok) {
            const data = await response.json();
            if (!data || !data.items) {
                throw new Error("Invalid response from Spotify API");
            }
            return data
        } else {
            throw new Error(`Failed to fetch top tracks: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        throw error
    }
}

app.get('/top-songs', async (req, res) => {
    const { username } = req.query || null;
    const currentUser = await findUser(username)
    const spotifyUser = await findSpotifyUser(currentUser.id)
    const accessToken = spotifyUser.accessToken

    try {
        const data = await getTopSongs(accessToken)
        const songInfo = data.items.map(item => ({
            songName: item.name,
            artistNames: item.artists.map(artist => artist.name)
        }));
        res.status(200).json({ songInfo: songInfo})
    } catch (error) {
        if (error.message.includes('401')) {
            const refreshResponse = await fetch(`http://localhost:4700/refresh-tokens?userId=${spotifyUser.userId}&refreshToken=${spotifyUser.refreshToken}`)
            const refreshData = await refreshResponse.json()
            const newAccessToken = refreshData.newAccessToken

            const data = await getTopSongs(newAccessToken)
            const songInfo = data.results.items.map(item => ({
                songName: item.name,
                artistNames: item.artists.map(artist => artist.name)
              }));
            res.status(200).json({ songInfo: songInfo})
        } else {
            res.status(500).json({ error: "Server error" })
        }
    }
})

app.get('/refresh-tokens', async (req, res) => {
    const { userId, refreshToken } = req.query
    const scope = "user-top-read"

    try {
        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token not provided' });
        }
        const authOptions = {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
            },
            body: `grant_type=refresh_token&refresh_token=${refreshToken}&scope=${scope}`
        };

        const response = await fetch('https://accounts.spotify.com/api/token', authOptions);
        if (response.ok) {
            const data = await response.json()
            const newAccessToken = data.access_token
            await updateSpotifyUser(userId, newAccessToken, refreshToken)
            res.status(200).json({ newAccessToken: newAccessToken})
        } else {
            res.status(response.status).json({ error: response.statusText });
        }
    } catch (error) {
        res.status(500).json({ error: "Server error" })
    }
})

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})
