const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const {
    findUser,
    findSpotifyUser,
    updateSpotifyUser,
    generateRandomString,
    getUsersTopSongs,
    getTopSongs,
    refreshSpotifyToken,
    topSongs,
    topArtists,
    followedArtists,
    savedTracks,
    audioFeatures
} = require('./utils')

const clientId = process.env.SPOTIFY_CLIENT_ID
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
const redirectUri = 'http://localhost:5173/'

const dynamicImportFetch = async () => {
    const fetchModule = await import('node-fetch');
    return fetchModule.default;
}

router.get('/authorize', async (req, res) => {
    try {
        const state = await generateRandomString(16);
        const responseType = "code"
        const scope = 'user-read-private user-read-email user-top-read user-library-read user-read-recently-played user-follow-read';
        const authorizationUrl = `https://accounts.spotify.com/authorize?response_type=${responseType}&client_id=${clientId}&scope=${scope}&redirect_uri=${redirectUri}&state=${state}`
        res.status(200).json({ authorizationUrl: authorizationUrl })
    }catch (error) {
        res.status(500).json({ error: 'Server error' })
    }
});

router.get('/callback', async (req, res) => {
    const fetch = await dynamicImportFetch();
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

router.post('/save-tokens', async (req, res) => {
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
        res.status(200).json({ message: "Tokens saved" })
    } catch (error) {
        res.status(500).json({ error: "Server error" })
    }
})


router.get('/top-songs', async (req, res) => {
    const fetch = await dynamicImportFetch();
    const { username } = req.query || null
    const currentUser = await findUser(username)
    if (!currentUser) {
        res.status(404).json({ error: "User not found" });
        return;
      }
    const spotifyUser = await findSpotifyUser(currentUser.id)
    if (!spotifyUser) {
        res.status(404).json({ error: "User has no connect Spotify account." })
        return
    }
    const accessToken = spotifyUser.accessToken
    try {
        const topSongs = await getUsersTopSongs(username)
        if (topSongs) {
            res.status(200).json({ topSongs: topSongs })
            return;
        }
        const data = await getTopSongs(username, accessToken, "short_term", 10)
        res.status(200).json({ topSongs: data})
    } catch (error){
        if (error.message.includes('401')) {
            const newAccessToken = await refreshSpotifyToken(spotifyUser)

            const data = await getTopSongs(username, newAccessToken, "short_term", 10)
            const songInfo = data.items.map(item => ({
                songName: item.name,
                artistNames: item.artists.map(artist => artist.name)
                }));
            res.status(200).json({ songInfo: songInfo })
        } else {
            res.status(500).json({ error: "Server error" })
        }
    }
})

router.get('/refresh-tokens', async (req, res) => {
    const fetch = await dynamicImportFetch();
    const { userId, refreshToken } = req.query
    const scope = "user-top-read user-library-read user-read-recently-played user-follow-read"

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

router.get('/recently-played', async (req, res) => {
    const fetch = await dynamicImportFetch();
    const { username } = req.query || null
    const currentUser = await findUser(username)
    const spotifyUser = await findSpotifyUser(currentUser.id)
    if (spotifyUser) {
        const accessToken = spotifyUser.accessToken
        try {
            const response = await fetch('https://api.spotify.com/v1/me/player/recently-played', {
            method: "GET",
            headers: {
                "Content-Type": 'application/json',
                "Authorization": `Bearer ${accessToken}`
            }})
            if (response.ok) {
                const data = await response.json()
                const tracks = data.items.map((item) => item.track)
                res.status(200).json({ tracks: tracks})
            } else if(response.status === 401) {
                const newAccessToken = await refreshSpotifyToken(spotifyUser)

                const response = await fetch('https://api.spotify.com/v1/me/player/recently-played', {
                    method: "GET",
                    headers: {
                        "Content-Type": 'application/json',
                        "Authorization": `Bearer ${newAccessToken}`
                    }})
                if (response.ok) {
                    const data = await response.json()
                    const tracks = data.items.map((item) => item.track)
                    res.status(200).json({ tracks: tracks})
                }
            } else {
                res.status(500).json({ error: "Failed to fetch recently played songs." })
            }
        } catch (error) {
            res.status(500).json({ error: "Server error"})
        }
    } else {
        res.status(404).json({ error: "User not found" })
    }
})

router.get('/spotify-user', async (req, res) => {
    const { username } = req.query || null
    const currentUser = await findUser(username)
    try {
        const spotifyUser = await findSpotifyUser(currentUser.id)
        res.status(200).json({ spotify: spotifyUser })
    } catch (error) {
       res.status(500).json({ error: "Server error" })
    }
})

router.get("/compatibility", async (req, res) => {
    const { username, friend } = req.query
    const currentUser = await findUser(username)
    const currentFriend = await findUser(friend)
    const currentUserSpotify = await findSpotifyUser(currentUser.id)
    const currentFriendSpotify = await findSpotifyUser(currentFriend.id)

    if (currentUser && currentFriend && currentUserSpotify && currentFriendSpotify) {
        const currentUserTopSongsData = await topSongs(currentUserSpotify)
        const currentFriendTopSongsData = await topSongs(currentFriendSpotify)
        const currentUserTopSongs = currentUserTopSongsData.items.map((song) => [song.name, song.popularity])
        const currentFriendTopSongs = currentFriendTopSongsData.items.map((song) => [song.name, song.popularity])
        const currentUserTopSongsIds = currentUserTopSongsData.items.map((song) => (song.id)).join(',')
        const currentFriendTopSongsIds = currentFriendTopSongsData.items.map((song) => (song.id)).join(',')


        const currentUserTopArtistsData = await topArtists(currentUserSpotify)
        const currentFriendTopArtistsData = await topArtists(currentFriendSpotify)
        const currentUserTopArtists = currentUserTopArtistsData.items.map((artist) => [artist.name, artist.genres, artist.popularity])
        const currentFriendTopArtists = currentFriendTopArtistsData.items.map((artist) => [artist.name, artist.genres, artist.popularity])

        const currentUserFollowedArtistsData = await followedArtists(currentUserSpotify)
        const currentFriendFollowedArtistsData = await followedArtists(currentFriendSpotify)
        const currentUserFollowedArtists = currentUserFollowedArtistsData.artists.items.map((artist) => [artist.name, artist.genres, artist.popularity])
        const currentFriendFollowedArtists = currentFriendFollowedArtistsData.artists.items.map((artist) => [artist.name, artist.genres, artist.popularity])

        const currentUserLikedSongsData = await savedTracks(currentUserSpotify)
        const friendUserLikedSongsData = await savedTracks(currentFriendSpotify)
        const currentUserLikedSongs = currentUserLikedSongsData.items.map((song) => [song.track.name, [song.track.artists.map((artist) => artist.name)], song.track.popularity])
        const friendUserLikedSongs = friendUserLikedSongsData.items.map((song) => [song.track.name, [song.track.artists.map((artist) => artist.name)], song.track.popularity])

        const currentUserTopAudioFeaturesData = await audioFeatures(currentUserSpotify, currentUserTopSongsIds)
        const currentFriendTopAudioFeaturesData = await audioFeatures(currentFriendSpotify, currentFriendTopSongsIds)
        let currentUserDanceability = 0, currentUserLoudness = 0, currentUserEnergy = 0, currentUserTempo = 0, currentUserValence = 0;
        let currentFriendDanceability = 0, currentFriendLoudness = 0, currentFriendEnergy = 0, currentFriendTempo = 0, currentFriendValence = 0;
        currentUserTopAudioFeaturesData.audio_features.forEach((song) => {
            currentUserDanceability += song.danceability
            currentUserLoudness += song.loudness
            currentUserEnergy += song.energy
            currentUserTempo += song.tempo
            currentUserValence += song.valence
        })
        currentFriendTopAudioFeaturesData.audio_features.forEach((song) => {
            currentFriendDanceability += song.danceability
            currentFriendLoudness += song.loudness
            currentFriendEnergy += song.energy
            currentFriendTempo += song.tempo
            currentFriendValence += song.valence
        })
        const currentUserTopAudioFeatures = {danceability: parseFloat(currentUserDanceability / 10).toFixed(3), loudness: parseFloat(currentUserLoudness / 10).toFixed(3), energy: parseFloat(currentUserEnergy / 10).toFixed(3), tempo: parseFloat(currentUserTempo / 10).toFixed(3), valence: parseFloat(currentUserValence / 10).toFixed(3)}
        const currentFriendTopAudioFeatures = {danceability: parseFloat(currentFriendDanceability / 10).toFixed(3), loudness: parseFloat(currentFriendLoudness / 10).toFixed(3), energy: parseFloat(currentFriendEnergy / 10).toFixed(3), tempo: parseFloat(currentFriendTempo / 10).toFixed(3), valence: parseFloat(currentFriendValence / 10).toFixed(3)}
        res.status(200).json({
            currentUserTopSongs: currentUserTopSongs,
            currentFriendTopSongs: currentFriendTopSongs,
            currentUserTopArtists: currentUserTopArtists,
            currentFriendTopArtists: currentFriendTopArtists,
            currentUserFollowedArtists: currentUserFollowedArtists,
            currentFriendFollowedArtists: currentFriendFollowedArtists,
            currentUserLikedSongs: currentUserLikedSongs,
            friendUserLikedSongs: friendUserLikedSongs,
            currentUserTopAudioFeatures: currentUserTopAudioFeatures,
            currentFriendTopAudioFeatures: currentFriendTopAudioFeatures
        })
    }
})

module.exports = router;
