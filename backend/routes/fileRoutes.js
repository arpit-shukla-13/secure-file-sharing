const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { 
    startUpload, 
    uploadChunk, 
    finishUpload, 
    getDownloadLink 
} = require('../controllers/fileController');

// Multer setup for handling chunk uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // fileId ab URL se (req.params) aa raha hai, req.body se nahi
        const { fileId } = req.params;
        const dir = path.join(__dirname, '..', 'temp_uploads', fileId);
        
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const { chunkIndex } = req.body;
        cb(null, chunkIndex);
    }
});

const upload = multer({ storage });

// API Routes
router.post('/start-upload', startUpload);
// Route ko update karke :fileId ko URL ka hissa banaya gaya hai
router.post('/upload-chunk/:fileId', upload.single('chunk'), uploadChunk);
router.post('/finish-upload', finishUpload);
router.get('/download/:fileId', getDownloadLink);

module.exports = router;

