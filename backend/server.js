// --- Imports ---
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fileRoutes = require('./routes/fileRoutes'); // Routes ko import karna zaroori hai
require('dotenv').config();

// --- Initializations ---
const app = express();
const PORT = process.env.PORT || 5001;

// --- Middlewares ---
// CORS ko theek se configure karna bahut zaroori hai
app.use(cors({
    origin: process.env.FRONTEND_URL, // .env se sirf frontend URL ko allow karein
}));

app.use(express.json()); // JSON data parse karne ke liye

// --- API Routes ---
// Yahan hum fileRoutes.js mein define kiye gaye saare routes ko link kar rahe hain
app.use('/api/files', fileRoutes);

// --- Database Connection ---
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connect successfully!');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// --- Start Server ---
connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Backend server is running on port ${PORT} `);
    });
});

