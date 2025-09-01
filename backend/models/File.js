const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const fileSchema = new Schema({
    originalName: {
        type: String,
        required: true
    },
    // Renamed from filePath to match the database index causing the error.
    finalFilename: {
        type: String,
        required: false,
        unique: true, // Ensures no two completed files have the same final path.
        sparse: true  // THE FIX: This tells MongoDB to only enforce uniqueness on documents that HAVE this field. It will ignore multiple documents where this field is null.
    },
    password: {
        type: String,
        required: false
    },
    totalChunks: {
        type: Number,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
}, { timestamps: true });

module.exports = mongoose.model('File', fileSchema);

