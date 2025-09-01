const fs = require('fs');
const path = require('path');
const File = require('../models/File');
const { logAction } = require('../utils/logger');

// --- 1. Start Upload ---
const startUpload = async (req, res) => {
    const { fileName, totalChunks, size } = req.body;

    if (!fileName || totalChunks === undefined || !size) {
        return res.status(400).json({ message: 'Missing required fields.' });
    }

    try {
        const file = new File({
            originalName: fileName,
            totalChunks,
            size,
            status: 'pending',
        });
        await file.save();
        
        const fileId = file._id;
        const tempDir = path.join(__dirname, '..', 'temp_uploads', fileId.toString());
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        logAction(`Upload started for ${fileName} with ID: ${fileId}`);
        res.status(201).json({ fileId });

    } catch (error) {
        console.error('Error starting upload:', error);
        logAction(`ERROR starting upload for ${fileName}: ${error.message}`);
        res.status(500).json({ 
            message: 'Server error during upload initiation.',
            error: error.message
        });
    }
};

// --- 2. Upload Chunk ---
const uploadChunk = async (req, res) => {
    const { fileId } = req.params;
    const { chunkIndex } = req.body;
    const chunkFile = req.file;

    if (!chunkFile || chunkIndex === undefined) {
        return res.status(400).json({ message: 'Missing chunk or chunk index.' });
    }

    logAction(`Received chunk ${chunkIndex} for file ID: ${fileId}`);
    res.status(200).json({ message: `Chunk ${chunkIndex} uploaded successfully.` });
};

// --- 3. Finish Upload (Highly Efficient Stream-based Merging) ---
const finishUpload = async (req, res) => {
    const { fileId, password } = req.body;

    if (!fileId || !password) {
        return res.status(400).json({ message: 'File ID and password are required.' });
    }

    try {
        const file = await File.findById(fileId);
        if (!file) {
            return res.status(404).json({ message: 'File record not found.' });
        }

        const tempDir = path.join(__dirname, '..', 'temp_uploads', fileId.toString());
        const finalDir = path.join(__dirname, '..', 'final_uploads');

        if (!fs.existsSync(finalDir)) {
            fs.mkdirSync(finalDir, { recursive: true });
        }
        
        const uniqueDiskFilename = `${fileId}${path.extname(file.originalName)}`;
        const finalFilePath = path.join(finalDir, uniqueDiskFilename);
        
        // Asynchronous function to merge chunks using streams
        const mergeChunks = () => {
            return new Promise((resolve, reject) => {
                const writeStream = fs.createWriteStream(finalFilePath);
                let currentChunk = 0;

                const appendChunk = () => {
                    if (currentChunk >= file.totalChunks) {
                        writeStream.end();
                        return;
                    }

                    const chunkPath = path.join(tempDir, `${currentChunk}`);
                    if (!fs.existsSync(chunkPath)) {
                        return reject(new Error(`Missing chunk ${currentChunk}`));
                    }
                    
                    const readStream = fs.createReadStream(chunkPath);
                    readStream.pipe(writeStream, { end: false });

                    readStream.on('end', () => {
                        fs.unlinkSync(chunkPath); // Clean up chunk after writing
                        currentChunk++;
                        appendChunk();
                    });

                    readStream.on('error', (err) => {
                        writeStream.end();
                        reject(err);
                    });
                };

                writeStream.on('finish', resolve);
                writeStream.on('error', reject);
                
                appendChunk();
            });
        };

        await mergeChunks();

        fs.rmdirSync(tempDir); // Remove temporary directory

        file.finalFilename = finalFilePath;
        file.password = password;
        file.status = 'completed';
        await file.save();

        logAction(`File merged and completed for ID: ${fileId}`);
        res.status(200).json({ message: 'File uploaded and merged successfully!', fileId: file._id });

    } catch (error) {
        console.error('Error finishing upload:', error);
        logAction(`ERROR finishing upload for ID ${fileId}: ${error.message}`);
        res.status(500).json({ message: 'Error processing file.', error: error.message });
    }
};


// --- 4. Get Download Link / Download File ---
const getDownloadLink = async (req, res) => {
    try {
        const file = await File.findById(req.params.fileId);

        if (!file || file.status !== 'completed') {
            return res.status(404).json({ message: 'File not found or upload is not complete.' });
        }

        if (file.password !== req.query.password) {
            return res.status(403).json({ message: 'Invalid password.' });
        }

        if (!file.finalFilename || !fs.existsSync(file.finalFilename)) {
            return res.status(404).json({ message: 'File disk par nahi mili.' });
        }
        
        logAction(`Successful download for file: ${file.originalName}`);
        res.download(file.finalFilename, file.originalName);

    } catch (error) {
        console.error('Download error:', error);
        logAction(`ERROR during download for ID ${req.params.fileId}: ${error.message}`);
        res.status(500).json({ message: 'Server error during download.' });
    }
};

module.exports = {
    startUpload,
    uploadChunk,
    finishUpload,
    getDownloadLink,
};

