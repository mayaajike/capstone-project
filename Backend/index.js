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
    const { email, username, password } = req.body;

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
            existingUser.accessToken = generateAccessToken(user)
            existingUser.refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET)

            return res.status(200).json({
                message: "Login successful!",
                user: existingUser
            });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
})


app.post('/token', async (req, res) => {
    const { username, email, refreshToken } = req.body;

    try {
        const existingUser = await findUser(username, email)

        if (refreshToken === null || existingUser.refreshToken !== refreshToken) return res.status(401).json({ error: "Invalid token" })
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
            if (err) return res.status(403).json({ error: "Invalid Token" })
            existingUser.accessToken = generateAccessToken(user)
        })
        return res.status(200).json({
            message: "Token refreshed",
            user: existingUser
        })
    } catch (error) {
        res.status(500).json({ error: 'Server error'})
    }

})

function generateAccessToken(user){
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "3s" })
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

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})
