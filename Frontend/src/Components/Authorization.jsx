import React, { useState, useEffect } from 'react';
// import { getAccessToken, fetchProfile } from '../../../spotify';

export default function Authorization() {
    const [code, setCode] = useState(null);
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        setCode(code);
    }, [])

    async function getAccessToken(clientId, code) {
        const verifier = localStorage.getItem("verifier");
        const params = new URLSearchParams();
        params.append("client_id", clientId);
        params.append("grant_type", "authorization_code");
        params.append("code", code);
        params.append("redirect_url", "http://localhost:5173/");
        params.append("code_verifier", verifier);

        const result = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded"},
            body: params
        });

        const { access_token } = await result.json();
        return access_token;
    }

    async function fetchProfile(token) {
        const result = await fetch("https://api.spotify.com/v1/me", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        return await result.json();
    }

    const handleCallback = async () => {
        if (code) {
            const accessToken = await getAccessToken(clientId, code);
            const profile = await fetchProfile(accessToken);
            setProfile(profile)
        }
    }


    if(!code) {
        const clientId = process.env.SPOTIFY_CLIENT_ID
        const redirectUri = 'http://localhost:5173/';
        const authorizationUrl = 'https://accounts.spotify.com/api/token';

        window.location.href = authorizationUrl
    } else {
        handleCallback();
    }
    return (
        <>
        {profile ? (
            <div>
                <h1>Welcome, {profile.display_nmae}!</h1>
                <p>Your profile:</p>
                <pre>{JSON.stringify(profile, null, 2)}</pre>
            </div>
        ): (
            <p>Loading</p>
        )}
        </>
    )
}
