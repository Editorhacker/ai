const express = require('express');
const multer = require('multer');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = 3001;

// Middleware
app.use(cors()); // Allow frontend requests
app.use(express.json());

// Multer configuration for file upload
const upload = multer({ dest: 'uploads/' });

// Hugging Face API settings
const HF_MODEL_URL = "https://api-inference.huggingface.co/models/Hemg/AI-VS-REAL-IMAGE-DETECTION";
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY; // Store your API key in an .env file

// Route to handle image upload and AI detection
app.post('/upload', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }

    try {
        // Read the uploaded image
        const imageBuffer = fs.readFileSync(req.file.path);

        // Send image to Hugging Face API
        const response = await axios.post(HF_MODEL_URL, imageBuffer, {
            headers: {
                'Authorization': `Bearer ${HF_API_KEY}`,
                'Content-Type': 'application/octet-stream',
            }
        });

        // Delete uploaded file after processing
        fs.unlinkSync(req.file.path);

        // Send result to frontend
        res.json({
            result: response.data[0]?.label || 'Unknown',
            confidence: response.data[0]?.score ? (response.data[0].score * 100).toFixed(2) : 'N/A'
        });

    } catch (error) {
        console.error("Error processing image:", error);
        res.status(500).json({ error: 'Failed to process image.' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
