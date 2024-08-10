const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const FormData = require('form-data');

const app = express();
const port = 3000;

// Middleware to parse the body of POST requests
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Multer configuration to handle file uploads
const upload = multer({ dest: 'uploads/' });

// Replace with your new actual access token and Instagram Business Account ID
const accessToken = 'YOUR_INSTAGRAM_ACCESS_TOKEN';
const instagramBusinessAccountId = '17841468119882244';

// Route to handle Instagram OAuth redirection (if needed)
app.get('/auth', (req, res) => {
    const instagramAuthUrl = `https://www.facebook.com/v17.0/dialog/oauth?client_id=857221119666087&redirect_uri=http://localhost:3000/callback&scope=instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement`;
    res.redirect(instagramAuthUrl);
});

// OAuth callback route
app.get('/callback', async (req, res) => {
    const code = req.query.code;

    try {
        const tokenResponse = await axios.get('https://graph.facebook.com/v17.0/oauth/access_token', {
            params: {
                client_id: '857221119666087',
                client_secret: '',
                redirect_uri: 'http://localhost:3000/callback',
                code: code
            }
        });

        const token = tokenResponse.data.access_token;
        res.redirect(`/upload?access_token=${token}`);
    } catch (error) {
        console.error('Error exchanging code for access token:', error.response ? error.response.data : error.message);
        res.status(500).send('Error during authentication');
    }
});

// Serve the form page with access token in the query string
app.get('/upload', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle the image upload and post to Instagram
app.post('/post-instagram', upload.single('photo'), async (req, res) => {
    const token = req.query.access_token || accessToken;
    const caption = req.body.caption;
    const imagePath = req.file.path;

    try {
        // Step 1: Upload the photo to Instagram
        const imageUploadResponse = await axios.post(`https://graph.facebook.com/v17.0/${instagramBusinessAccountId}/media`, {
            image_url: `http://localhost:3000/${imagePath}`, // This should be a publicly accessible URL
            caption: caption,
            access_token: token
        });

        const mediaId = imageUploadResponse.data.id;

        // Step 2: Publish the photo
        const publishResponse = await axios.post(`https://graph.facebook.com/v17.0/${instagramBusinessAccountId}/media_publish`, {
            creation_id: mediaId,
            access_token: token
        });

        console.log('Photo uploaded and published successfully:', publishResponse.data);
        res.send('Photo uploaded to Instagram successfully');
    } catch (error) {
        console.error('Error uploading photo to Instagram:', error.response ? error.response.data : error.message);
        res.status(500).send('Error uploading photo to Instagram');
    } finally {
        // Delete the uploaded file after posting
        fs.unlink(imagePath, (err) => {
            if (err) console.error('Error deleting uploaded file:', err);
        });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`App running at http://localhost:${port}`);
});
