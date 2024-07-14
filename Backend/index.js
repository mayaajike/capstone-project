require('dotenv').config()
const bcrypt = require('bcryptjs')
const cors = require('cors')
const express = require('express')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')
const app = express();
const spotifyRoutes = require('./spotifyRoutes')
const prisma = new PrismaClient();
app.use(express.json());

const corsOptions = {
    origin: 'http://localhost:5173',
    credentials: true,
    optionsSuccessStatus: 200
  };
  app
app.use(cors(corsOptions))
const PORT = process.env.PORT || 3000
const {
    hashPassword,
    verifyPassword,
    validatePassword,
    findUser,
    findWithId,
    updateUser,
    generateAccessToken
} = require('./utils')

app.use('/spotify', spotifyRoutes)

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

app.get('/user', async (req, res) => {
    const { userId } = req.query;
    const user = await findWithId(userId);
    res.status(200).json({ user: user})
})

app.get('/users', async (req, res) => {
    const users = await prisma.user.findMany()
    res.json(users)
})

app.get('/spotify-accounts', async (req, res) => {
    const accounts = await prisma.spotifyAccount.findMany()
    res.json(accounts)
})

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
            const user = { username: username }
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
        res.status(500).json({ error: error });
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
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, user) => {
            if (err) return res.status(403).json({ error: "Invalid Token" })
            newAccessToken =  generateAccessToken(currentUser)
        })
        existingUser.accessToken = newAccessToken
        await updateUser(username, newAccessToken, refreshToken)
        return res.status(200).json({ message: "Token refreshed", accessToken: newAccessToken })
    } catch (error) {
        res.status(500).json({ error: 'Server error'})
    }
})


app.post('/search', async (req, res) =>{
    const { searchQuery } = req.body;
    const results = await prisma.user.findMany({
        where: {
            OR: [
                {
                    firstName: {
                        contains: searchQuery,
                        mode: 'insensitive'
                    }
                },
                {
                    lastName: {
                        contains: searchQuery,
                        mode: 'insensitive'
                    }
                },
                {
                    username: {
                        contains: searchQuery,
                        mode: 'insensitive'
                    }
        }]}})
    res.status(200).json({ results: results })
})

app.get('/profile', async (req, res) => {
    const { username } = req.query;
    const user = await findUser(username);

    if (user) {
        res.status(200).json({ user: user})
    } else {
        res.status(500).json({ error: "Server error"})
    }
})

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})
