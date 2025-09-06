Secure Chunked File Sharing System
This is a full-stack MERN application that allows users to securely upload, share, and download files. Large files are split into smaller chunks and encrypted client-side using XOR encryption for enhanced security and upload reliability.

✨ Live Demo
You can view and interact with the live version of this project here:

https://findfiles.netlify.app/

🚀 Features
Chunk-based Uploads: Large files are split into 5MB chunks for a more reliable upload process.

Client-Side Encryption: Every chunk is encrypted in the browser using the user-provided password with XOR encryption, ensuring the original file never reaches the server.

Modern UI/UX:

Sleek dark mode theme.

Responsive design that works on both mobile and desktop.

Separate, easy-to-navigate pages for Upload and Download.

Drag-and-Drop area for file selection.

Secure Download: A valid File ID and password are required to download files. Decryption also happens entirely in the browser.

Shareable Links: A unique File ID and a shareable link are generated after every successful upload.

🛠️ Tech Stack & Deployment
Frontend:

React.js (Vite)

Axios

React-Dropzone

Backend:

Node.js

Express.js

MongoDB (Mongoose)

Multer

Deployment:

Frontend (UI): Hosted on Netlify.

Backend (Server): Hosted on Render.

Database: MongoDB Atlas

How to Run on a Local Machine
To run this project on your local computer, follow the steps below:

1. Clone the Repository:

git clone [https://github.com/arpit-shukla-13/secure-file-sharing.git](https://github.com/arpit-shukla-13/secure-file-sharing.git)
cd secure-file-sharing

2. Backend Setup:

cd backend
npm install

Create a .env file inside the backend folder.

Add your necessary keys like MONGO_URI and PORT=5001.

Start the server:

npm run dev

3. Frontend Setup (in a new terminal):

cd frontend
npm install

Start the frontend:

npm run dev

You can now access the project at http://localhost:5173 (or the port shown in your terminal).
