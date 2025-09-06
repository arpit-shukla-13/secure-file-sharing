const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const fileRoutes = require('./routes/fileRoutes');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5001;

// --- Database Connection ---
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully.');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};
connectDB();

// --- Middlewares ---

// This is the crucial fix. It correctly tells the server to allow requests
// from the URL specified in your Render environment variables.
const corsOptions = {
  origin: process.env.FRONTEND_URL,
  optionsSuccessStatus: 200 // For older browsers
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- API Routes ---
app.use('/api/files', fileRoutes);

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});



    

