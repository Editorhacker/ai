const express = require("express");
const multer = require("multer");
const fs = require("fs");
const exifParser = require("exif-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Multer config for file upload
const upload = multer({ dest: "uploads/" });

app.post("/upload", upload.single("image"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = req.file.path;

    try {
        const buffer = fs.readFileSync(filePath);

        // Validate if it's a JPEG file before parsing
        if (buffer.length < 2 || buffer[0] !== 0xFF || buffer[1] !== 0xD8) {
            throw new Error("Invalid JPEG file.");
        }

        const parser = exifParser.create(buffer);
        const metadata = parser.parse();

        // Extract required metadata fields
        const requiredFields = {
            Make: "Camera Maker",
            Model: "Camera Model",
            FNumber: "F-stop",
            ExposureTime: "Exposure Time",
            ISO: "ISO Speed",
            FocalLength: "Focal Length"
        };

        // Check missing fields
        const missingFields = Object.keys(requiredFields).filter(field => !(field in metadata.tags));

        console.log("Extracted Metadata:", metadata.tags);
        console.log("Missing Fields:", missingFields);

        const isOriginal = missingFields.length === 0;

        // Delete uploaded file after processing
        fs.unlinkSync(filePath);

        return res.json({
            metadata: metadata.tags,
            isOriginal: isOriginal ? "✅ Original Image" : "❌ AI-Generated Image",
            missingFields: missingFields.length > 0 ? missingFields : "None"
        });

    } catch (error) {
        console.error("Error processing image:", error.message);
        fs.unlinkSync(filePath); // Ensure file is deleted even if an error occurs
        return res.status(500).json({ error: "Failed to process image. Ensure it's a valid JPEG file." });
    }
});

// Start server
app.listen(5000, () => console.log("Server running on port 5000"));
