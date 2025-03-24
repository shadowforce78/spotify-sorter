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
const PORT = process.env.PORT || 63247;

var client_id = process.env.SPOTIFY_CLIENT_ID;
var client_secret = process.env.SPOTIFY_CLIENT_SECRET;
// var redirect_uri = 'http://localhost:3000/api/auth/callback/spotify';
var redirect_uri = 'https://sortify.saumondeluxe.com/api/auth/callback/spotify';

var app = express();

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Middleware pour extraire le token d'authentification des en-têtes
const getAuthToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        req.token = authHeader.substring(7);
    }
    next();
};

app.use(getAuthToken);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}\n http://localhost:${PORT}`);
});

// Root route
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

app.get('/login', function (req, res) {
    var state = generateRandomString(16);
    var scope = 'user-read-private user-read-email playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private';

    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state
        }));
});

// Renvoyer les pages HTML, plus de vérification serveur nécessaire
app.get('/profile', function (req, res) {
    res.sendFile(path.join(__dirname, 'public', 'profile.html'));
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
                const expires_in = response.data.expires_in;

                console.log('Access token received, length:', access_token.length);

                // Rediriger vers une page qui stockera les tokens dans localStorage
                res.redirect(`/store-tokens.html?access_token=${access_token}&refresh_token=${refresh_token}&expires_in=${expires_in}`);
            })
            .catch(error => {
                console.error('Error during authentication:', error.response ? error.response.data : error.message);
                res.send('Error during authentication. Check console for details.');
            });
    }
});

app.get('/playlist-sorter', function (req, res) {
    res.sendFile(path.join(__dirname, 'public', 'playlist-sorter.html'));
});

// Route pour récupérer les informations utilisateur, utilise le token fourni dans les headers
app.get('/api/user-data', function (req, res) {
    if (!req.token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    // Utiliser le token fourni dans l'en-tête pour faire les requêtes à l'API Spotify
    Promise.all([
        axios.get('https://api.spotify.com/v1/me', {
            headers: { 'Authorization': `Bearer ${req.token}` }
        }),
        axios.get('https://api.spotify.com/v1/me/playlists', {
            headers: { 'Authorization': `Bearer ${req.token}` }
        })
    ])
        .then(([profileResponse, playlistsResponse]) => {
            res.json({
                profile: profileResponse.data,
                playlists: playlistsResponse.data
            });
        })
        .catch(error => {
            console.error('Error fetching user data:', error);
            res.status(error.response ? error.response.status : 500).json({
                error: error.response ? error.response.data : error.message
            });
        });
});

// Route pour récupérer les informations d'une playlist externe
app.get('/api/playlist/:id', function (req, res) {
    if (!req.token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const playlistId = req.params.id;

    axios.get(`https://api.spotify.com/v1/playlists/${playlistId}`, {
        headers: { 'Authorization': `Bearer ${req.token}` }
    })
        .then(response => {
            res.json(response.data);
        })
        .catch(error => {
            console.error('Error fetching playlist:', error.response ? error.response.data : error.message);
            res.status(error.response ? error.response.status : 500).json({
                error: error.response ? error.response.data : error.message
            });
        });
});

// Route pour récupérer les pistes d'une playlist
app.get('/api/playlist/:id/tracks', function (req, res) {
    if (!req.token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const playlistId = req.params.id;

    // Paramètres pour limiter le nombre de champs retournés et réduire la taille de la réponse
    const fields = 'items(track(id,name,artists,album,duration_ms,preview_url)),total';
    const limit = 100; // Maximum autorisé par l'API Spotify

    axios.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?fields=${fields}&limit=${limit}`, {
        headers: { 'Authorization': `Bearer ${req.token}` }
    })
        .then(response => {
            res.json(response.data);
        })
        .catch(error => {
            console.error('Error fetching playlist tracks:', error.response ? error.response.data : error.message);
            res.status(error.response ? error.response.status : 500).json({
                error: error.response ? error.response.data : error.message
            });
        });
});

// Route pour vérifier si une playlist est modifiable par l'utilisateur
app.get('/api/playlist/:id/check-permissions', function (req, res) {
    if (!req.token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const playlistId = req.params.id;
    const userId = req.query.userId; // Obtenir l'ID utilisateur depuis la requête

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    // Récupérer les informations de la playlist pour vérifier son propriétaire et son statut collaboratif
    axios.get(`https://api.spotify.com/v1/playlists/${playlistId}`, {
        headers: { 'Authorization': `Bearer ${req.token}` }
    })
        .then(response => {
            const playlist = response.data;
            // Vérifier si l'utilisateur est propriétaire ou si la playlist est collaborative
            const isOwner = playlist.owner.id === userId;
            const isCollaborative = playlist.collaborative === true;
            const canModify = isOwner || isCollaborative;

            res.json({
                canModify,
                isOwner,
                isCollaborative,
                playlist: {
                    id: playlist.id,
                    name: playlist.name,
                    owner: playlist.owner.display_name,
                    ownerId: playlist.owner.id
                }
            });
        })
        .catch(error => {
            console.error('Error checking playlist permissions:', error.response ? error.response.data : error.message);
            res.status(error.response ? error.response.status : 500).json({
                error: error.response ? error.response.data : error.message
            });
        });
});

// Route pour ajouter une piste à une playlist
app.post('/api/playlist/:id/add-track', express.json(), function (req, res) {
    if (!req.token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const playlistId = req.params.id;
    const { trackUri, userId } = req.body;

    if (!trackUri) {
        return res.status(400).json({ error: 'Track URI is required' });
    }

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    // Vérifier d'abord les permissions
    axios.get(`https://api.spotify.com/v1/playlists/${playlistId}`, {
        headers: { 'Authorization': `Bearer ${req.token}` }
    })
        .then(response => {
            const playlist = response.data;
            const isOwner = playlist.owner.id === userId;
            const isCollaborative = playlist.collaborative === true;

            if (!isOwner && !isCollaborative) {
                throw new Error('You do not have permission to modify this playlist');
            }

            // Si les permissions sont OK, ajouter la piste
            return axios.post(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
                uris: [trackUri]
            }, {
                headers: {
                    'Authorization': `Bearer ${req.token}`,
                    'Content-Type': 'application/json'
                }
            });
        })
        .then(response => {
            res.json({ success: true, data: response.data });
        })
        .catch(error => {
            if (error.message === 'You do not have permission to modify this playlist') {
                return res.status(403).json({ error: error.message });
            }
            console.error('Error adding track to playlist:', error.response ? error.response.data : error.message);
            res.status(error.response ? error.response.status : 500).json({
                error: error.response ? error.response.data : error.message
            });
        });
});

// Route pour retirer une piste d'une playlist
app.post('/api/playlist/:id/remove-track', express.json(), function (req, res) {
    if (!req.token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const playlistId = req.params.id;
    const { trackUri, userId } = req.body;

    if (!trackUri) {
        return res.status(400).json({ error: 'Track URI is required' });
    }

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    // Vérifier d'abord les permissions
    axios.get(`https://api.spotify.com/v1/playlists/${playlistId}`, {
        headers: { 'Authorization': `Bearer ${req.token}` }
    })
        .then(response => {
            const playlist = response.data;
            const isOwner = playlist.owner.id === userId;
            const isCollaborative = playlist.collaborative === true;

            if (!isOwner && !isCollaborative) {
                throw new Error('You do not have permission to modify this playlist');
            }

            // Si les permissions sont OK, retirer la piste
            return axios.delete(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
                headers: {
                    'Authorization': `Bearer ${req.token}`,
                    'Content-Type': 'application/json'
                },
                data: {
                    tracks: [{ uri: trackUri }]
                }
            });
        })
        .then(response => {
            res.json({ success: true, data: response.data });
        })
        .catch(error => {
            if (error.message === 'You do not have permission to modify this playlist') {
                return res.status(403).json({ error: error.message });
            }
            console.error('Error removing track from playlist:', error.response ? error.response.data : error.message);
            res.status(error.response ? error.response.status : 500).json({
                error: error.response ? error.response.data : error.message
            });
        });
});