const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
};

const verifyPassword = async (submittedPassword, storedHash) => {
  return bcrypt.compare(submittedPassword, storedHash);
};

const validatePassword = (password, passwordAgain) => {
  errors = [];
  if (!password) errors.push("Password cannot be empty");
  if (password.length < 8)
    errors.push("Password must have at least 8 characters");
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
    errors.push("Password must contain special characters");
  if (!/\d/.test(password)) errors.push("Password must contain a number");
  if (!/[A-Z]/.test(password))
    errors.push("Password must contain at least one capital letter");
  if (password !== passwordAgain) errors.push("Passwords do not match");

  if (errors.length > 0)
    return { errorCode: 401, errorMessage: "Invalid Password, Try Again" };
  return { errorCode: 200, errorMessage: "Password is Valid" };
};

async function findUser(username) {
  const user = await prisma.user.findFirst({
    where: {
      username: username,
    },
  });
  return user;
}

async function findWithId(userId) {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
    },
  });
  return user;
}

async function updateUser(username, accessToken, refreshToken) {
  await prisma.user.update({
    where: {
      username: username,
    },
    data: {
      accessToken: accessToken,
      refreshToken: refreshToken,
    },
  });
}

const findSpotifyUser = async (userId) => {
  const user = await prisma.spotifyAccount.findFirst({
    where: {
      userId: userId,
    },
  });
  return user;
};

async function updateSpotifyUser(userId, accessToken, refreshToken) {
  await prisma.spotifyAccount.update({
    where: {
      userId: userId,
    },
    data: {
      accessToken: accessToken,
      refreshToken: refreshToken,
    },
  });
}

function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" });
}

async function generateRandomString(length) {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

async function getTopSongs(username, accessToken, timeRange, limit) {
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=${limit}&offset=0`,
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
      if (!data || !data.items) {
        throw new Error("Invalid response from Spotify API");
      }
      const songInfo = data.items.map((item) => ({
        songName: item.name,
        artistNames: item.artists.map((artist) => artist.name),
      }));
      return songInfo;
    } else {
      throw new Error(
        `Failed to fetch top tracks: ${response.status} ${response.statusText}`,
      );
    }
  } catch (error) {
    throw new Error("Failed to fetch top songs");
  }
}

async function getUsersTopSongs(username) {
  const currentUser = findUser(username);
  const topSongs = await prisma.topSongs.findFirst({
    where: {
      user: currentUser,
    },
  });
  if (topSongs) {
    const tracks = await prisma.tracks.findMany({
      where: {
        topSongsId: topSongs.id,
      },
    });
    return tracks;
  } else {
    return topSongs;
  }
}

async function refreshSpotifyToken(spotifyUser) {
  const response = await fetch(
    `http://localhost:4700/spotify/refresh-tokens?userId=${spotifyUser.userId}&refreshToken=${spotifyUser.refreshToken}`,
  );
  const data = await response.json();
  const newAccessToken = data.newAccessToken;
  return newAccessToken;
}

async function saveTopSongs(username, songInfo) {
  const user = await findUser(username);
  const latestTopSongs = await prisma.topSongs.findFirst({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (
    latestTopSongs &&
    latestTopSongs.createdAt > Date.now() - 4 * 7 * 24 * 60 * 60 * 1000
  ) {
    return latestTopSongs;
  }
  const topSongsData = songInfo.map((song) => ({
    track: song.songName,
    artist: song.artistNames,
  }));
  const topSongs = await prisma.topSongs.create({
    data: {
      tracks: {
        create: topSongsData,
      },
      user: {
        connect: user,
      },
    },
  });
  return topSongs;
}

async function topSongs(spotifyUser) {
  try {
    const response = await fetch(
      "https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=10&offset=0",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${spotifyUser.accessToken}`,
        },
      },
    );
    if (response.ok) {
      const data = await response.json();
      return data;
    } else if (response.status === 401) {
      const newAccessToken = await refreshSpotifyToken(spotifyUser);
      const response = await fetch(
        "https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=10&offset=0",
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
        return data;
      }
    }
  } catch (error) {
    throw error;
  }
}

async function topArtists(spotifyUser) {
  try {
    const response = await fetch(
      "https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=10&offset=0",
      {
        method: "GET",
        headers: {
          "Content-Type": "appplication/json",
          Authorization: `Bearer ${spotifyUser.accessToken}`,
        },
      },
    );
    if (response.ok) {
      const data = await response.json();
      return data;
    } else if (response.status === 401) {
      const newAccessToken = await refreshSpotifyToken(spotifyUser);
      const response = await fetch(
        "https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=10&offset=0",
        {
          method: "GET",
          headers: {
            "Content-Type": "appplication/json",
            Authorization: `Bearer ${newAccessToken}`,
          },
        },
      );
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    }
  } catch (error) {
    throw error;
  }
}

async function getRecentlyPlayed(spotifyUser){
  try {
    const response = await fetch('https://api.spotify.com/v1/me/player/recently-played', {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${spotifyUser.accessToken}`
    }
  })
  if (response.ok) {
    const data = await response.json()
    const tracks = data.items.map((item) => item.track);
    return tracks
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
      return tracks
    }
  } else  {
    return;
  }
  } catch (error) {
    return error
}
}

async function followedArtists(spotifyUser) {
  try {
    const response = await fetch(
      "https://api.spotify.com/v1/me/following?type=artist&limit=10",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${spotifyUser.accessToken}`,
        },
      },
    );
    if (response.ok) {
      const data = await response.json();
      return data;
    } else if (response.status === 401 || response.status === 403) {
      const newAccessToken = await refreshSpotifyToken(spotifyUser);
      const response = await fetch(
        "https://api.spotify.com/v1/me/following?type=artist&limit=10",
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
        return data;
      }
    }
  } catch (error) {
    throw error;
  }
}

async function savedTracks(spotifyUser) {
  try {
    const response = await fetch(
      "https://api.spotify.com/v1/me/tracks?limit=50&offset=0",
      {
        method: "GET",
        headers: {
          "Content-Type": "aplication/json",
          Authorization: `Bearer ${spotifyUser.accessToken}`,
        },
      },
    );
    if (response.ok) {
      const data = await response.json();
      return data;
    } else if (response.status === 401) {
      const newAccessToken = refreshSpotifyToken(spotifyUser);
      const response = await fetch(
        "https://api.spotify.com/v1/me/tracks?limit=10&offset=0",
        {
          method: "GET",
          headers: {
            "Content-Type": "aplication/json",
            Authorization: `Bearer ${newAccessToken}`,
          },
        },
      );
    }
  } catch (error) {
    throw error;
  }
}

async function audioFeatures(spotifyUser, songIds) {
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/audio-features?ids=${songIds}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${spotifyUser.accessToken}`,
        },
      },
    );
    if (response.ok) {
      const data = await response.json();
      return data;
    } else if (response.status === 401) {
      const newAccessToken = await refreshSpotifyToken(spotifyUser);
      const response = await fetch(
        `https://api.spotify.com/v1/audio-features?ids=${songIds}`,
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
        return data;
      }
    }
  } catch (error) {
    throw error;
  }
}

async function calculateAudioFeatures(audioFeatures) {
  let danceability = 0,
    loudness = 0,
    energy = 0,
    tempo = 0,
    valence = 0,
    duration = 0;
  audioFeatures.audio_features.forEach((song) => {
    danceability += song.danceability;
    loudness += song.loudness;
    energy += song.energy;
    tempo += song.tempo;
    valence += song.valence;
    duration += song.duration_ms;
  });

  danceability = (danceability / 10).toFixed(3);
  loudness = (loudness / 10).toFixed(3);
  energy = (energy / 10).toFixed(3);
  tempo = (tempo / 10).toFixed(3);
  valence = (valence / 10).toFixed(3);
  duration = (duration / 10).toFixed(3);

  return {
    danceability: parseFloat(danceability),
    loudness: parseFloat(loudness),
    energy: parseFloat(energy),
    tempo: parseFloat(tempo),
    valence: parseFloat(valence),
    duration: parseFloat(duration),
  };
}

function calcJaccard(intersection, union) {
  if (intersection.size === 0) {
    return 0;
  } else {
    let intersectionNum = 0,
      unionNum = 0;
    for (const song of intersection) {
      const [title, popularity] = song.split(":");
      if (0 <= popularity && popularity <= 34) {
        intersectionNum += 3;
      } else if (35 <= popularity && popularity <= 68) {
        intersectionNum += 2;
      } else if (69 <= popularity && popularity <= 100) {
        intersectionNum += 1;
      }
    }

    for (const song of union) {
      const [title, popularity] = song.split(":");
      if (0 <= popularity && popularity <= 34) {
        unionNum += 3;
      } else if (35 <= popularity && popularity <= 68) {
        unionNum += 2;
      } else if (69 <= popularity && popularity <= 100) {
        unionNum += 1;
      }
    }
    const index = (intersectionNum / unionNum).toFixed(3);
    return parseFloat(index);
  }
}

function calcJaccardIndex(userData, friendData) {
  const userSet = new Set(
    userData.map((record) => `${record.name}:${record.popularity}`),
  );
  const friendSet = new Set(
    friendData.map((record) => `${record.name}:${record.popularity}`),
  );
  const intersection = new Set([...userSet].filter((x) => friendSet.has(x)));
  const union = new Set([...userSet, ...friendSet]);
  const index = calcJaccard(intersection, union);
  return index;
}

function getTopGenres(topArtists, followedArtists) {
  let genres = [];
  topArtists.forEach((artist) => {
    genres = [...genres, ...artist.genres];
  });
  followedArtists.forEach((artist) => {
    genres = [...genres, ...artist.genres];
  });
  const genresSet = new Set(genres);
  return genresSet;
}

function calcTopGenresJaccard(userSet, friendSet) {
  const intersection = new Set([...userSet].filter((x) => friendSet.has(x)));
  const union = new Set([...userSet, ...friendSet]);
  if (intersection.size === 0) {
    return 0;
  }
  const index = (intersection.size / union.size).toFixed(3);
  return parseFloat(index);
}

function dotProduct(vectorA, vectorB) {
  return vectorA.reduce((sum, a, i) => sum + a * vectorB[i], 0);
}

function magnitude(vector) {
  return Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
}

function calcCosineSimilarity(userAudioFeatures, friendAudioFeatures) {
  currentUserVector = Object.values(userAudioFeatures);
  currentFriendVector = Object.values(friendAudioFeatures);
  const dotProductRes = dotProduct(currentUserVector, currentFriendVector);
  const userMagnitude = magnitude(currentUserVector);
  const friendMagnitude = magnitude(currentFriendVector);
  const similarity = dotProductRes / (userMagnitude * friendMagnitude);
  return similarity;
}

function calcCompatibility(jaccardScores, cosineSimilarity) {
  let jaccardSum = 0;
  jaccardScores.forEach((score) => {
    jaccardSum += score;
  });
  let jaccardAvg = jaccardSum / jaccardScores.length;
  const compatibility = (
    (0.4 * jaccardAvg + 0.6 * cosineSimilarity) *
    100
  ).toFixed(1);
  return parseFloat(compatibility);
}

function getCompatibilityScore(
  currentUserTopSongs,
  currentFriendTopSongs,
  currentUserTopArtists,
  currentFriendTopArtists,
  currentUserFollowedArtists,
  currentFriendFollowedArtists,
  currentUserLikedSongs,
  friendUserLikedSongs,
  currentUserTopGenres,
  currentFriendTopGenres,
  currentUserTopAudioFeatures,
  currentFriendTopAudioFeatures,
) {
  const topSongsJaccard = calcJaccardIndex(
    currentUserTopSongs,
    currentFriendTopSongs,
  );
  const topArtistJaccard = calcJaccardIndex(
    currentUserTopArtists,
    currentFriendTopArtists,
  );
  const followedArtistJaccard = calcJaccardIndex(
    currentUserFollowedArtists,
    currentFriendFollowedArtists,
  );
  const likedSongsJaccard = calcJaccardIndex(
    currentUserLikedSongs,
    friendUserLikedSongs,
  );
  const topGenresJaccard = calcTopGenresJaccard(
    currentUserTopGenres,
    currentFriendTopGenres,
  );
  const jaccardScores = [
	topSongsJaccard,
	topArtistJaccard,
	followedArtistJaccard,
	likedSongsJaccard,
	topGenresJaccard];
  const audioFeaturesCosineSimilarity = calcCosineSimilarity(
    currentUserTopAudioFeatures,
    currentFriendTopAudioFeatures,
  );
  const compatibility = calcCompatibility(
    jaccardScores,
    audioFeaturesCosineSimilarity,
  );
  return compatibility;
}

async function usersTopSongs(spotifyUser) {
  const topSongsData = await topSongs(spotifyUser);
  const topSongsRes = topSongsData.items.map((song) => ({
    name: song.name,
    popularity: song.popularity,
  }));
  return topSongsRes;
}

async function topSongIds(spotifyUser) {
  const topSongsData = await topSongs(spotifyUser);
  const songIds = topSongsData.items.map((song) => song.id).join(",");
  return songIds;
}

async function usersTopArtists(spotifyUser) {
  const topArtistsData = await topArtists(spotifyUser);
  const topArtistsRes = topArtistsData.items.map((artist) => ({
    name: artist.name,
    genres: artist.genres,
    popularity: artist.popularity,
  }));
  return topArtistsRes;
}

async function usersFollowedArtists(spotifyUser) {
  const followedArtistsData = await followedArtists(spotifyUser);
  const followedArtistsRes = followedArtistsData.artists.items.map(
    (artist) => ({
      name: artist.name,
      genres: artist.genres,
      popularity: artist.popularity,
    }),
  );
  return followedArtistsRes;
}

async function usersLikedSongs(spotifyUser) {
  const likedSongsData = await savedTracks(spotifyUser);
  const likedSongs = likedSongsData.items.map((song) => ({
    name: song.track.name,
    artists: [song.track.artists.map((artist) => artist.name)],
    popularity: song.track.popularity,
  }));
  return likedSongs;
}

async function usersAudioFeatures(spotifyUser, songIds) {
  const audioFeaturesData = await audioFeatures(spotifyUser, songIds);
  const audioFeaturesRes = await calculateAudioFeatures(audioFeaturesData);
  return audioFeaturesRes;
}

function findSimilarities(RPS) {
  const currentUserKey = Object.keys(RPS[0])[0]
  const currentUserSongs = new Set(RPS[0][currentUserKey])

  const findIntersection = (firstSet, secondArray) => {
    return secondArray.filter(song => firstSet.has(song))
  }
  let similarities = []

  for (let i = 1; i < RPS.length; i++) {
    const key = Object.keys(RPS[i])[0]
    const songs = RPS[i][key]
    const intersection = findIntersection(currentUserSongs, songs)
    similarities.push({
      [currentUserKey + ' & ' + key]: intersection
    })
  }
  return similarities
}

const calcInteractionScore = async(currentUser, user) => {
  let postData = []
  const userPosts = user[0].userPosts
  const friendPosts = user[0].friendPosts
  const visited = user[0].visitedProfiles
  const visitors = user[0].profileVisitors

  if (userPosts) {
    for (const post of userPosts) {
      const similarTracks = await prisma.post.findMany({
        where: {
          trackId: post.trackId,
          OR: [
            { userId: currentUser.id },
            { friendId: currentUser.id }
    ]}})
      if (similarTracks) {
        let likes = 0;
        similarTracks.forEach((track) => {
          likes += track.likes
        })
        postData.push({ post: post, likes: likes, interactions: 0, weight: 1, interactionScore: 0})
    }}}
    const visitorIds = new Set(visitors.map((visitor) => visitor.visitorId));
    const visitedIds = new Set(visited.map((visited) => visited.visitedId));
    if (visitorIds && visitedIds) {
      for (const post of postData) {
        if (visitorIds.has(post.post.friendId) || visitedIds.has(post.post.friendId)) {
          post.interactions += 1;
    }}}
    for (post of postData){
      if (post.post.text.includes("currently")) {
        post.weight += 1
    }}
    for (post of postData) {
      post.interactionScore = (post.likes + post.interactions) * post.weight
    }
  return postData
}

function calcTimeSincePost(postData) {
  for (const post of postData){
    const now = new Date()
    const timeDiff = now.getTime() - post.post.createdAt.getTime()
    const hoursSincePost = (timeDiff / 3600000).toFixed(4);
    post.decayFactor = (parseFloat(hoursSincePost) / 2) ** 0.95
  }
  return postData
}

function calcOrder(postData) {
  for (const post of postData){
    const order = Math.log10(Math.max(post.interactionScore, 1)).toFixed(3)
    post.order = parseFloat(order)
  }
  return postData
}

function calcRank(postData) {
  postData = calcTimeSincePost(postData)
  postData = calcOrder(postData)
  for (const post of postData) {
    const numerator = (post.interactionScore * post.order)
    post.rank = (numerator / post.decayFactor)
  }
  return postData
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
  audioFeatures,
  calculateAudioFeatures,
  calcJaccardIndex,
  getTopGenres,
  calcTopGenresJaccard,
  dotProduct,
  magnitude,
  calcCosineSimilarity,
  calcCompatibility,
  getCompatibilityScore,
  usersTopSongs,
  topSongIds,
  usersTopArtists,
  usersFollowedArtists,
  usersLikedSongs,
  usersAudioFeatures,
  getRecentlyPlayed,
  findSimilarities,
  calcInteractionScore,
  calcTimeSincePost,
  calcOrder,
  calcRank
};
