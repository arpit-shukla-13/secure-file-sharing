import React, { useState } from 'react';
import axios from 'axios';

// Helper function for XOR encryption/decryption
// Yeh function buffer return karta hai
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

    // Aapka original upload logic, jo theek kaam kar raha tha
    const handleUpload = async () => {
        if (!file || !password) {
            setUploadMessage('Please select a file and enter a password.');
            return;
        }

        setUploadMessage('Starting upload...');
        setUploadProgress(0);

        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        
        try {
            const startResponse = await axios.post('http://localhost:5001/api/files/start-upload', {
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

                const promise = axios.post(`http://localhost:5001/api/files/upload-chunk/${fileId}`, formData)
                    .then(res => {
                        uploadedSize += chunk.size;
                        const progress = Math.round((uploadedSize / file.size) * 100);
                        setUploadProgress(progress);
                    });
                uploadPromises.push(promise);
            }

            await Promise.all(uploadPromises);

            setUploadMessage('All chunks uploaded. Merging file on server...');
            const finishResponse = await axios.post('http://localhost:5001/api/files/finish-upload', {
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
    
    // Corrected download and decryption logic
    const handleDownload = async () => {
        if (!fileIdForDownload || !passwordForDownload) {
            setDownloadMessage('Please enter a File ID and password.');
            return;
        }

        try {
            setDownloadMessage('Requesting file...');
            const response = await axios.get(`http://localhost:5001/api/files/download/${fileIdForDownload}`, {
                params: { password: passwordForDownload },
                responseType: 'blob',
            });

            setDownloadMessage('File received. Decrypting...');
            const encryptedBlob = response.data;
            
            // Decrypt the file
            const decryptedBuffer = await xorProcess(encryptedBlob, passwordForDownload);
            
            // **THE FIX IS HERE:** We read the file type from the server's response
            const fileType = response.headers['content-type'];
            const decryptedBlob = new Blob([decryptedBuffer], { type: fileType });
            
            // Get original filename from server's response header
            const contentDisposition = response.headers['content-disposition'];
            let fileName = 'decrypted-file'; // Default filename
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
                if (fileNameMatch && fileNameMatch.length === 2) {
                    fileName = fileNameMatch[1];
                }
            }

            // Create a link and trigger the download with the correct filename
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
            setDownloadMessage(`Download failed: ${errorMessage}`);
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

