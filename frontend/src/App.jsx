import React, { useState } from 'react';
import axios from 'axios';

// Yeh line code ko smart banati hai. Live website par yeh Render ka URL use karegi,
// aur aapke computer par localhost use karegi.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Helper function for XOR encryption/decryption
async function xorProcess(chunk, key) {
    const keyBytes = new TextEncoder().encode(key);
    const chunkBytes = new Uint8Array(await chunk.arrayBuffer());
    const resultBytes = new Uint8Array(chunkBytes.length);

    for (let i = 0; i < chunkBytes.length; i++) {
        resultBytes[i] = chunkBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    return resultBytes.buffer;
}


function App() {
    const [file, setFile] = useState(null);
    const [password, setPassword] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadMessage, setUploadMessage] = useState('');
    const [fileIdForDownload, setFileIdForDownload] = useState('');
    const [passwordForDownload, setPasswordForDownload] = useState('');
    const [downloadMessage, setDownloadMessage] = useState('');

    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file || !password) {
            setUploadMessage('Please select a file and enter a password.');
            return;
        }

        setUploadMessage('Starting upload...');
        setUploadProgress(0);

        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        
        try {
            // Using the smart API_URL instead of localhost
            const startResponse = await axios.post(`${API_URL}/api/files/start-upload`, {
                fileName: file.name,
                totalChunks: totalChunks,
                size: file.size,
            });

            const { fileId } = startResponse.data;
            setUploadMessage(`File ID: ${fileId}. Uploading chunks...`);

            const uploadPromises = [];
            let uploadedSize = 0;
            for (let i = 0; i < totalChunks; i++) {
                const chunk = file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
                const encryptedBuffer = await xorProcess(chunk, password);
                
                const formData = new FormData();
                formData.append('chunkIndex', i);
                formData.append('chunk', new Blob([encryptedBuffer]));

                // Using the smart API_URL
                const promise = axios.post(`${API_URL}/api/files/upload-chunk/${fileId}`, formData)
                    .then(res => {
                        uploadedSize += chunk.size;
                        const progress = Math.round((uploadedSize / file.size) * 100);
                        setUploadProgress(progress);
                    });
                uploadPromises.push(promise);
            }

            await Promise.all(uploadPromises);

            setUploadMessage('All chunks uploaded. Merging file on server...');
            // Using the smart API_URL
            const finishResponse = await axios.post(`${API_URL}/api/files/finish-upload`, {
                fileId,
                password,
            });

            setUploadMessage(`Upload successful! Your File ID is: ${finishResponse.data.fileId}`);
            setFileIdForDownload(finishResponse.data.fileId);

        } catch (error) {
            console.error('Upload error:', error);
            const errorMessage = error.response?.data?.message || 'Network Error';
            setUploadMessage(`Upload failed: ${errorMessage}`);
            setUploadProgress(0);
        }
    };
    
    const handleDownload = async () => {
        if (!fileIdForDownload || !passwordForDownload) {
            setDownloadMessage('Please enter a File ID and password.');
            return;
        }

        try {
            setDownloadMessage('Requesting file...');
            // Using the smart API_URL
            const response = await axios.get(`${API_URL}/api/files/download/${fileIdForDownload}`, {
                params: { password: passwordForDownload },
                responseType: 'blob',
            });

            setDownloadMessage('File received. Decrypting...');
            const encryptedBlob = response.data;
            
            const decryptedBuffer = await xorProcess(encryptedBlob, passwordForDownload);
            
            // The final fix for the download issue is here
            const fileType = response.headers['content-type'];
            const decryptedBlob = new Blob([decryptedBuffer], { type: fileType });
            
            const contentDisposition = response.headers['content-disposition'];
            let fileName = 'decrypted-file';
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
                if (fileNameMatch && fileNameMatch.length === 2) {
                    fileName = fileNameMatch[1];
                }
            }

            const url = window.URL.createObjectURL(decryptedBlob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = fileName; 
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            setDownloadMessage('Download complete!');

        } catch (error) {
            console.error('Download error:', error);
            const errorMessage = error.response?.data?.message || 'Network Error. Check ID/password.';
            setDownloadMessage(`Upload failed: ${errorMessage}`);
        }
    };


    return (
        <div className="container">
            <header>
                <h1>Secure Chunked File Sharing</h1>
                <p>Upload your files securely with XOR encryption and chunking.</p>
            </header>

            <div className="card">
                <h2>Upload File</h2>
                <input type="file" onChange={handleFileChange} />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter Encryption Password"
                />
                <button onClick={handleUpload}>Upload</button>
                {uploadMessage && <p className="message">{uploadMessage}</p>}
                {uploadProgress > 0 && (
                    <div className="progress-bar-container">
                        <div className="progress-bar" style={{ width: `${uploadProgress}%` }}>
                             {`${Math.round(uploadProgress)}%`}
                        </div>
                    </div>
                )}
            </div>
            
            <div className="card">
                <h2>Download File</h2>
                <input
                    type="text"
                    value={fileIdForDownload}
                    onChange={(e) => setFileIdForDownload(e.target.value)}
                    placeholder="Enter File ID"
                />
                <input
                    type="password"
                    value={passwordForDownload}
                    onChange={(e) => setPasswordForDownload(e.target.value)}
                    placeholder="Enter Decryption Password"
                />
                <button onClick={handleDownload}>Download</button>
                {downloadMessage && <p className="message">{downloadMessage}</p>}
            </div>
        </div>
    );
}

export default App;
