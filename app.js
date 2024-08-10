const express = require('express');
const path = require('path');
const axios = require('axios');
const multer = require('multer');
const fs = require('fs');
const app = express();
const port = 3000;

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Configure multer for file upload
const upload = multer({ dest: 'uploads/' });

app.post('/post-instagram', upload.single('photo'), async (req, res) => {
    const { caption, access_token } = req.body;
    const photoPath = req.file.path;

    const instagramBusinessAccountId = '17841468119882244'; // Your Instagram Business Account ID

    try {
        // Step 1: Upload the photo to Instagram
        const mediaResponse = await axios.post(`https://graph.facebook.com/v17.0/${instagramBusinessAccountId}/media`, {
            image_url: `http://localhost:3000/${photoPath}`, // This should be a publicly accessible URL
            caption: caption,
            access_token: access_token
        });

        const mediaId = mediaResponse.data.id;

        // Step 2: Publish the photo
        const publishResponse = await axios.post(`https://graph.facebook.com/v17.0/${instagramBusinessAccountId}/media_publish`, {
            creation_id: mediaId,
            access_token: access_token
        });

        console.log('Photo uploaded and published successfully:', publishResponse.data);

        // Clean up the uploaded file
        fs.unlinkSync(photoPath);

        res.send('Photo uploaded to Instagram successfully');
    } catch (error) {
        console.error('Error uploading photo to Instagram:', error.response ? error.response.data : error.message);
        res.status(500).send('Error uploading photo to Instagram');
    }
});

app.listen(port, () => {
    console.log(`App running at http://localhost:${port}`);
});
