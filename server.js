const express = require("express");
const multer = require("multer");
const fs = require("fs");
const exifParser = require("exif-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

app.post("/upload", upload.single("image"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = req.file.path;
    const buffer = fs.readFileSync(filePath);
    const parser = exifParser.create(buffer);
    const metadata = parser.parse();

    // Extract required metadata fields
    const requiredFields = [
        "Make", // Camera Maker
        "Model", // Camera Model
        "FNumber", // F-stop
        "ExposureTime", // Exposure time
        "ISO", // ISO speed (previously ISOSpeedRatings)
        "FocalLength" // Focal length
    ];

    // Check if all required fields exist
    const missingFields = requiredFields.filter(field => !(field in metadata.tags));

    console.log("Extracted Metadata:", metadata.tags);
    console.log("Missing Fields:", missingFields);

    const isOriginal = missingFields.length === 0;

    // Delete uploaded file after processing
    fs.unlinkSync(filePath);

    res.json({
        metadata: metadata.tags,
        isOriginal: isOriginal ? "✅ Original Image" : "❌ AI-Generated Image",
        missingFields: missingFields.length > 0 ? missingFields : "None"
    });
});

app.listen(5000, () => console.log("Server running on port 5000"));
