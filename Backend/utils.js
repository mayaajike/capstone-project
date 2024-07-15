const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
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
    const user = await prisma.user.findFirst({
        where: {
            username: username,
        },
    })
    return user;
}

async function findWithId(userId) {
    const user = await prisma.user.findFirst({
        where: {
            id: userId,
        },
    })
    return user
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

async function generateRandomString(length) {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

async function getTopSongs(username, accessToken, timeRange, limit) {
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
            const songInfo = data.items.map(item => ({
                songName: item.name,
                artistNames: item.artists.map(artist => artist.name)
              }));
            const topSongs = await saveTopSongs(username, songInfo)
            return topSongs
        } else {
            throw new Error(`Failed to fetch top tracks: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        throw new Error('Failed to fetch top songs');
    }
}

async function getUsersTopSongs (username) {
    const currentUser = findUser(username)
    const topSongs = await prisma.topSongs.findFirst({
        where: {
            user: currentUser
        }
    })
    if (topSongs) {
        const tracks = await prisma.tracks.findMany({
            where: {
                topSongsId: topSongs.id
            }
        })
        return tracks
    } else {
        return topSongs;
    }
}

async function refreshSpotifyToken(spotifyUser) {
    const response = await fetch(`http://localhost:4700/spotify/refresh-tokens?userId=${spotifyUser.userId}&refreshToken=${spotifyUser.refreshToken}`)
    const data =  await response.json()
    const newAccessToken = data.newAccessToken
    return newAccessToken
}

async function saveTopSongs(username, songInfo){
    const user = await findUser(username)
    const latestTopSongs = await prisma.topSongs.findFirst({
        where: {
            userId: user.id
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    if (latestTopSongs && latestTopSongs.createdAt > Date.now() - 4 * 7 * 24 * 60 * 60 * 1000) { return latestTopSongs }
    const topSongsData = songInfo.map((song) => ({
        track: song.songName,
        artist: song.artistNames
    }))
    const topSongs = await prisma.topSongs.create({
        data: {
            tracks: {
                create: topSongsData
            },
            user:{
                connect: user
            }
        }
    })
    return topSongs;
}

async function topSongs (spotifyUser) {
    try {
        const response = await fetch('https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=10&offset=0', {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${spotifyUser.accessToken}`
            }
        });
        if (response.ok) {
            const data = await response.json()
            return data
        } else if (response.status === 401) {
            const newAccessToken = await refreshSpotifyToken(spotifyUser);
            const response = await fetch('https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=10&offset=0', {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${newAccessToken}`
                }
            });
            if (response.ok) {
                const data = await response.json()
                return data
            }
        }
    } catch (error) {
        throw error
    }
}

async function topArtists(spotifyUser) {
    try {
        const response = await fetch('https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=10&offset=0', {
            method: "GET",
            headers: {
                "Content-Type": "appplication/json",
                "Authorization": `Bearer ${spotifyUser.accessToken}`
            }
        });
        if (response.ok) {
            const data = await response.json()
            return data
        } else if (response.status === 401) {
            const newAccessToken = await refreshSpotifyToken(spotifyUser);
            const response = await fetch('https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=10&offset=0', {
                method: "GET",
                headers: {
                    "Content-Type": "appplication/json",
                    "Authorization": `Bearer ${newAccessToken}`
                }
            });
            if (response.ok) {
                const data = await response.json()
                return data
            }
        }
    } catch (error) {
        throw error
    }
}

async function followedArtists(spotifyUser) {
    try {
        const response = await fetch('https://api.spotify.com/v1/me/following?type=artist&limit=10', {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${spotifyUser.accessToken}`
            }
        });
        if (response.ok){
            const data = await response.json()
            return data
        }else if (response.status === 401 || response.status === 403) {
            const newAccessToken = await refreshSpotifyToken(spotifyUser);
            const response = await fetch('https://api.spotify.com/v1/me/following?type=artist&limit=10', {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${newAccessToken}`
                }
            });
            if (response.ok){
                const data = await response.json()
                return data
            }
        }
    } catch (error) {
        throw error
    }
}

async function savedTracks(spotifyUser) {
    try {
        const response = await fetch('https://api.spotify.com/v1/me/tracks?limit=50&offset=0', {
            method: "GET",
            headers: {
                "Content-Type": "aplication/json",
                "Authorization": `Bearer ${spotifyUser.accessToken}`
            }
        });
        if (response.ok){
            const data = await response.json()
            return data
        } else if (response.status === 401) {
            const newAccessToken = refreshSpotifyToken(spotifyUser);
            const response = await fetch('https://api.spotify.com/v1/me/tracks?limit=10&offset=0', {
                method: "GET",
                headers: {
                    "Content-Type": "aplication/json",
                    "Authorization": `Bearer ${newAccessToken}`
                }
            });
        }
    } catch (error) {
        throw error
    }
}

async function audioFeatures(spotifyUser, songIds) {
    try {
        const response = await fetch(`https://api.spotify.com/v1/audio-features?ids=${songIds}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${spotifyUser.accessToken}`
            }
        });
        if (response.ok) {
            const data = await response.json()
            return data
        } else if (response.status === 401) {
            const newAccessToken = await refreshSpotifyToken(spotifyUser)
            const response = await fetch(`https://api.spotify.com/v1/audio-features?ids=${songIds}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${newAccessToken}`
                }
            });
            if (response.ok) {
                const data = await response.json()
                return data
            }
        }
    } catch (error) {
        throw error
    }
}


module.exports = {
    hashPassword,
    verifyPassword,
    validatePassword,
    findUser,
    findWithId,
    updateUser,
    findSpotifyUser,
    updateSpotifyUser,
    generateAccessToken,
    generateRandomString,
    getUsersTopSongs,
    getTopSongs,
    refreshSpotifyToken,
    saveTopSongs,
    topSongs,
    topArtists,
    followedArtists,
    savedTracks,
    audioFeatures
};
