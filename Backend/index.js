require('dotenv').config()
const bcrypt = require('bcryptjs')
const express = require('express')
const app = express()
app.use(express.json());
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const PORT = process.env.PORT || 3000

const session = require('express-session');
const crypto = require('crypto');
const secretKey = crypto.randomBytes(32).toString('hex');
app.use(session({
    secret: secretKey,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
}));

app.get('/', (req, res) => {
    res.send('Welcome to my app!')
})


const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword
}

const verifyPassword = async(submittedPassword, storedHash) => {
    return bcrypt.compare(submittedPassword, storedHash);
}

async function findExistingUser(username, email) {
    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { username: username },
                { email: email }
            ]
        }
    })
    return user;
}

// to change
// app.get('/', async (req, res) => {
//     if (req.session.user){
//         res.redirect('/main')
//     } else {
//         res.redirect('/login')
//     }
// })

app.get('/users', async (req, res) => {
    const users = await prisma.user.findMany()
    res.json(users)
})

// route for user registeration, to create a new user.
app.post('/users', async (req, res) => {
    const { firstName, lastName, username, password, email } = req.body;

    try {
        const existingUser = await findExistingUser(username, email)

        if (existingUser) {
            return res.status(400).json({ error: 'Username or email already exists' })
        } else {
            const hashedPassword = await hashPassword(password);
            const newUser = await prisma.user.create({
                data: {
                    firstName: firstName,
                    lastName: lastName,
                    username: username,
                    password: hashedPassword,
                    email: email
                }
            });
            req.session.user = {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email
            };
            res.json({ user: newUser });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// route for user login, authenticate old user
app.post('/users/login', async (req, res) => {
    const { email, username, password } = req.body;

    try {
        const existingUser = await findExistingUser(username, email)

        if (!existingUser) {
            return res.status(401).json({ error: "Invalid username or password" })
        } else {
            const isValidPassword = await verifyPassword(password, existingUser.password);

            if (!isValidPassword) {
                return res.status(401).json({ error: "Invalid password" });
            }

            req.session.user = {
                id: existingUser.id,
                username: existingUser.username,
                email: existingUser.email
            }
            res.json({ existingUser });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Server error' });
    }
})



app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})
