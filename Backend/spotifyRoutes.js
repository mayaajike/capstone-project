const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

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
  audioFeatures,
  calculateAudioFeatures,
} = require("./utils");

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const redirectUri = "http://localhost:5173/";

const dynamicImportFetch = async () => {
  const fetchModule = await import("node-fetch");
  return fetchModule.default;
};

router.get("/authorize", async (req, res) => {
  try {
    const state = await generateRandomString(16);
    const responseType = "code";
    const scope =
      "user-read-private user-read-email user-top-read user-library-read user-read-recently-played user-follow-read";
    const authorizationUrl = `https://accounts.spotify.com/authorize?response_type=${responseType}&client_id=${clientId}&scope=${scope}&redirect_uri=${redirectUri}&state=${state}`;
    res.status(200).json({ authorizationUrl: authorizationUrl });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/callback", async (req, res) => {
  const fetch = await dynamicImportFetch();
  const code = req.query.code || null;
  const state = req.query.state || null;
  const stateMismatch = "state_mismatch";
  try {
    if (state === null) {
      res.redirect(`/#?error=${stateMismatch}`);
    } else {
      const authOptions = {
        method: "POST",
        headers: {
          "Content-type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " +
            new Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
        },
        body: `grant_type=authorization_code&code=${code}&redirect_uri=${redirectUri}`,
      };

      const tokenResponse = await fetch(
        "https://accounts.spotify.com/api/token",
        authOptions,
      );
      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        const { access_token, token_type, scope, expires_in, refresh_token } =
          tokenData;

        res.status(200).json({
          spotifyAccessToken: access_token,
          tokenType: token_type,
          scope: scope,
          expiresIn: expires_in,
          spotifyRefreshToken: refresh_token,
        });
      } else {
        const errorMessage = await tokenResponse.text();
        res.status(500).json({ error: errorMessage });
      }
    }
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/save-tokens", async (req, res) => {
  const { username, accessToken, refreshToken, userId, spotifyUrl } = req.body;
  const currentUser = await findUser(username);
  try {
    const existingSpotifyAccount = await findSpotifyUser(currentUser.id);
    if (!existingSpotifyAccount) {
      await prisma.spotifyAccount.create({
        data: {
          spotifyId: userId,
          accessToken: accessToken,
          refreshToken: refreshToken,
          spotifyUrl: spotifyUrl,
          user: {
            connect: currentUser,
          },
        },
      });
    } else {
      await prisma.spotifyAccount.update({
        where: {
          userId: existingSpotifyAccount.userId,
        },
        data: {
          accessToken: accessToken,
          refreshToken: refreshToken,
        },
      });
    }
    res.status(200).json({ message: "Tokens saved" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/top-songs", async (req, res) => {
  const fetch = await dynamicImportFetch();
  const { username } = req.query || null;
  const currentUser = await findUser(username);
  if (!currentUser) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const spotifyUser = await findSpotifyUser(currentUser.id);
  if (!spotifyUser) {
    res.status(404).json({ error: "User has no connected Spotify account." });
    return;
  }
  const accessToken = spotifyUser.accessToken;
  try {
    const data = await getTopSongs(username, accessToken, "short_term", 10);
    res.status(200).json({ topSongs: data });
  } catch (error) {
    if (error.message.includes("401")) {
      const newAccessToken = await refreshSpotifyToken(spotifyUser);

      const data = await getTopSongs(
        username,
        newAccessToken,
        "short_term",
        10,
      );
      const songInfo = data.items.map((item) => ({
        songName: item.name,
        artistNames: item.artists.map((artist) => artist.name),
      }));
      res.status(200).json({ songInfo: songInfo });
    } else {
      res.status(500).json({ error: "Server error" });
    }
  }
});

router.get("/refresh-tokens", async (req, res) => {
  const fetch = await dynamicImportFetch();
  const { userId, refreshToken } = req.query;
  const scope =
    "user-top-read user-library-read user-read-recently-played user-follow-read";

  try {
    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token not provided" });
    }
    const authOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: `grant_type=refresh_token&refresh_token=${refreshToken}&scope=${scope}`,
    };

    const response = await fetch(
      "https://accounts.spotify.com/api/token",
      authOptions,
    );
    if (response.ok) {
      const data = await response.json();
      const newAccessToken = data.access_token;
      await updateSpotifyUser(userId, newAccessToken, refreshToken);
      res.status(200).json({ newAccessToken: newAccessToken });
    } else {
      res.status(response.status).json({ error: response.statusText });
    }
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/recently-played", async (req, res) => {
  const fetch = await dynamicImportFetch();
  const { username } = req.query || null;
  const currentUser = await findUser(username);
  const spotifyUser = await findSpotifyUser(currentUser.id);
  if (spotifyUser) {
    const accessToken = spotifyUser.accessToken;
    try {
      const response = await fetch(
        "https://api.spotify.com/v1/me/player/recently-played",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      if (response.ok) {
        const data = await response.json();
        const tracks = data.items.map((item) => item.track);
        res.status(200).json({ tracks: tracks });
      } else if (response.status === 401) {
        const newAccessToken = await refreshSpotifyToken(spotifyUser);
        const response = await fetch(
          "https://api.spotify.com/v1/me/player/recently-played",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${newAccessToken}`,
            },
          },
        );
        if (response.ok) {
          const data = await response.json();
          const tracks = data.items.map((item) => item.track);
          res.status(200).json({ tracks: tracks });
        }
      } else {
        res
          .status(500)
          .json({ error: "Failed to fetch recently played songs." });
      }
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  } else {
    res.status(404).json({ error: "User not found" });
  }
});

router.get("/spotify-user", async (req, res) => {
  const { username } = req.query || null;
  const currentUser = await findUser(username);
  try {
    const spotifyUser = await findSpotifyUser(currentUser.id);
    res.status(200).json({ spotify: spotifyUser });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/compatibility", async (req, res) => {
  const { username, friend } = req.query;
  const currentUser = await findUser(username);
  const currentFriend = await findUser(friend);
  const currentUserSpotify = await findSpotifyUser(currentUser.id);
  const currentFriendSpotify = await findSpotifyUser(currentFriend.id);

  if (
    currentUser &&
    currentFriend &&
    currentUserSpotify &&
    currentFriendSpotify
  ) {
    const currentUserTopSongsData = await topSongs(currentUserSpotify);
    const currentFriendTopSongsData = await topSongs(currentFriendSpotify);
    const currentUserTopSongs = currentUserTopSongsData.items.map(
        (song) => ({ title: song.name, popularity: song.popularity,})
      );
    const currentFriendTopSongs = currentFriendTopSongsData.items.map(
      (song) => ({ title: song.name, popularity: song.popularity}),
    );
    const currentUserTopSongsIds = currentUserTopSongsData.items
      .map((song) => song.id)
      .join(",");
    const currentFriendTopSongsIds = currentFriendTopSongsData.items
      .map((song) => song.id)
      .join(",");
    const topSongsJaccard = await calcTopSongsJaccard(currentUserTopSongs, currentFriendTopSongs)

    const currentUserTopArtistsData = await topArtists(currentUserSpotify);
    const currentFriendTopArtistsData = await topArtists(currentFriendSpotify);
    const currentUserTopArtists = currentUserTopArtistsData.items.map(
      (artist) => ({ name: artist.name, genres: artist.genres, popularity: artist.popularity }),
    );
    const currentFriendTopArtists = currentFriendTopArtistsData.items.map(
      (artist) => ({ name: artist.name, genres: artist.genres, popularity: artist.popularity }),
    );
    const topArtistJaccard = await calcTopArtistsJaccard(currentUserTopArtists, currentFriendTopArtists)

    const currentUserFollowedArtistsData =
      await followedArtists(currentUserSpotify);
    const currentFriendFollowedArtistsData =
      await followedArtists(currentFriendSpotify);
    const currentUserFollowedArtists =
      currentUserFollowedArtistsData.artists.items.map(
        (artist) => ({ name: artist.name, genres: artist.genres, popularity: artist.popularity}),
      );
    const currentFriendFollowedArtists =
      currentFriendFollowedArtistsData.artists.items.map(
        (artist) => ({ name: artist.name, genres: artist.genres, popularity: artist.popularity}),
      );
    const followedArtistJaccard = await calcTopArtistsJaccard(currentUserFollowedArtists, currentFriendFollowedArtists)

    const currentUserLikedSongsData = await savedTracks(currentUserSpotify);
    const friendUserLikedSongsData = await savedTracks(currentFriendSpotify);
    const currentUserLikedSongs = currentUserLikedSongsData.items.map(
      (song) => ({ name: song.track.name,
        artists: [song.track.artists.map((artist) => artist.name)],
        popularity: song.track.popularity,}),
    );
    const friendUserLikedSongs = friendUserLikedSongsData.items.map(
        (song) => ({ name: song.track.name,
            artists: [song.track.artists.map((artist) => artist.name)],
            popularity: song.track.popularity,}),

    );
    const likedSongsJaccard = await calcTopArtistsJaccard(currentUserLikedSongs, friendUserLikedSongs)

    const currentUserTopGenres = getTopGenres(currentUserTopArtists, currentUserFollowedArtists)
    const currentFriendTopGenres = getTopGenres(currentFriendTopArtists, currentFriendFollowedArtists)
    const topGenresJaccard = await calcTopGenresJaccard(currentUserTopGenres, currentFriendTopGenres)

    const currentUserTopAudioFeaturesData = await audioFeatures(
      currentUserSpotify,
      currentUserTopSongsIds,
    );
    const currentFriendTopAudioFeaturesData = await audioFeatures(
      currentFriendSpotify,
      currentFriendTopSongsIds,
    );
    const currentUserTopAudioFeatures = await calculateAudioFeatures(
      currentUserTopAudioFeaturesData,
    );
    const currentFriendTopAudioFeatures = await calculateAudioFeatures(
      currentFriendTopAudioFeaturesData,
    );

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
      currentFriendTopAudioFeatures: currentFriendTopAudioFeatures,
    });
  }
});

function calcJaccard(intersection, union) {
    if (intersection.size === 0) {
        return 0;
    } else {
        let intersectionNum = 0, unionNum = 0;
        for (const song of intersection) {
            const [title, popularity] = song.split(":");
            if (0 <= popularity && popularity <= 34 ) {
                intersectionNum += 3
            }else if (35 <= popularity && popularity <= 68) {
                intersectionNum += 2
            }else if (69 <= popularity && popularity <= 100) {
                intersectionNum += 1
            }
        }

        for (const song of union) {
            const [title, popularity] = song.split(":");
            if (0 <= popularity && popularity <= 34 ) {
                unionNum += 3
            }else if (35 <= popularity && popularity <= 68) {
                unionNum += 2
            }else if (69 <= popularity && popularity <= 100) {
                unionNum += 1
            }
        }
        const index = (intersectionNum / unionNum).toFixed(3)
        return parseInt(index)
    }
}

async function calcTopSongsJaccard(currentUserData, currentFriendData) {
    const userSet = new Set(currentUserData.map((song) => `${song.title}:${song.popularity}`))
    const friendSet = new Set(currentFriendData.map((song) => `${song.title}:${song.popularity}`))
    const intersection = new Set([...userSet].filter(x => friendSet.has(x)))
    const union = new Set([...userSet, ...friendSet])
    const index = calcJaccard(intersection, union)
    return index

}

async function calcTopArtistsJaccard(userData, friendData) {
    const userSet = new Set(userData.map((artist) => `${artist.name}:${artist.popularity}`))
    const friendSet = new Set(friendData.map((artist) => `${artist.name}:${artist.popularity}`))
    const intersection = new Set([...userSet].filter(x => friendSet.has(x)))
    const union = new Set([...userSet, ...friendSet])
    const index = calcJaccard(intersection, union)
    return index
}
function getTopGenres(topArtists, followedArtists) {
    let genres = [];
    topArtists.forEach((artist) => {
        genres = [...genres, ...artist.genres];
    });
    followedArtists.forEach((artist) => {
        genres = [...genres, ...artist.genres]
    });
    const genresSet = new Set(genres)
    return genresSet
}

async function calcTopGenresJaccard(userSet, friendSet){
    const intersection = new Set([...userSet].filter(x => friendSet.has(x)))
    const union = new Set([...userSet, ...friendSet])
    const index = (intersection.size / union.size).toFixed(3)
    return index
}



module.exports = router;
