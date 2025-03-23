const axios = require('axios');
require('dotenv').config();
const express = require('express');
const querystring = require('querystring');
const path = require('path');

function generateRandomString(length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
}
const PORT = process.env.PORT || 3000;

var client_id = process.env.SPOTIFY_CLIENT_ID;
var client_secret = process.env.SPOTIFY_CLIENT_SECRET;
// var redirect_uri = 'http://localhost:3000/api/auth/callback/spotify';
var redirect_uri = 'https://31c9-82-67-27-121.ngrok-free.app/api/auth/callback/spotify';

var app = express();

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Store user data temporarily (in a real app, use sessions)
let userData = null;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}\n http://localhost:${PORT}`);
});

// Root route
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

app.get('/login', function (req, res) {

    var state = generateRandomString(16);
    var scope = 'user-read-private user-read-email playlist-read-private playlist-read-collaborative';

    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state
        }));
});

// Améliorer la logique pour userData
app.get('/profile', function (req, res) {
    if (!userData) {
        console.log('No user data available, redirecting to login');
        return res.redirect('/login');
    }

    res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

app.get('/api/user-data', function (req, res) {
    console.log('API user-data requested, userData exists:', !!userData);

    if (userData) {
        // S'assurer que tous les éléments nécessaires sont présents
        if (!userData.profile || !userData.playlists) {
            console.error('Incomplete userData object:', userData);
            return res.status(500).json({ error: 'Incomplete user data' });
        }

        res.json(userData);
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

app.get('/api/auth/callback/spotify', function (req, res) {

    var code = req.query.code || null;
    var state = req.query.state || null;

    if (state === null) {
        res.redirect('/#' +
            querystring.stringify({
                error: 'state_mismatch'
            }));
    } else {
        // Exchange the authorization code for an access token
        const authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            method: 'post',
            params: {
                code: code,
                redirect_uri: redirect_uri,
                grant_type: 'authorization_code'
            },
            headers: {
                'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };

        axios(authOptions)
            .then(response => {
                const access_token = response.data.access_token;
                const refresh_token = response.data.refresh_token;

                console.log('Access token received, length:', access_token.length);

                // Initialiser userData comme un objet vide
                userData = {
                    tokens: {
                        access_token: access_token,
                        refresh_token: refresh_token
                    }
                };

                // Use the access token to get user profile information
                return axios.get('https://api.spotify.com/v1/me', {
                    headers: {
                        'Authorization': 'Bearer ' + access_token
                    }
                });
            })
            .then(response => {
                console.log('User profile received:', !!response.data);

                // Store user profile data
                userData.profile = response.data;

                // Get user's playlists
                const access_token = userData.tokens.access_token;
                return axios.get('https://api.spotify.com/v1/me/playlists', {
                    headers: {
                        'Authorization': 'Bearer ' + access_token
                    }
                });
            })
            .then(response => {
                console.log('User playlists received, count:', response.data.items.length);

                // Add playlists to stored user data
                userData.playlists = response.data;

                // Vérifier que userData est complet avant la redirection
                if (!userData.profile || !userData.playlists) {
                    throw new Error('Failed to retrieve complete user data');
                }

                res.redirect('/profile');
            })
            .catch(error => {
                console.error('Error during authentication:', error.response ? error.response.data : error.message);
                userData = null; // Réinitialiser userData en cas d'erreur
                res.send('Error during authentication. Check console for details.');
            });
    }
});

// Ajouter une route pour se déconnecter
app.get('/logout', function (req, res) {
    userData = null;
    res.redirect('/');
});