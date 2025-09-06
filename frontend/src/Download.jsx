import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Helper function for XOR decryption
async function xorProcess(chunk, key) {
    const keyBytes = new TextEncoder().encode(key);
    const chunkBytes = new Uint8Array(await chunk.arrayBuffer());
    const resultBytes = new Uint8Array(chunkBytes.length);

    for (let i = 0; i < chunkBytes.length; i++) {
        resultBytes[i] = chunkBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    return resultBytes.buffer;
}

function Download({ apiUrl, fileIdFromUrl, onBack }) {
    const [fileId, setFileId] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        if (fileIdFromUrl) {
            setFileId(fileIdFromUrl);
        }
    }, [fileIdFromUrl]);

    const handleDownload = async () => {
        if (!fileId || !password) {
            setMessage('Please enter a File ID and password.');
            return;
        }
        
        setIsDownloading(true);
        setMessage('Requesting file...');

        try {
            const response = await axios.get(`${apiUrl}/api/files/download/${fileId}`, {
                params: { password },
                responseType: 'blob',
            });

            setMessage('File received. Decrypting...');
            const encryptedBlob = response.data;
            const decryptedBuffer = await xorProcess(encryptedBlob, password);
            
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
            
            setMessage('Download complete!');

        } catch (error) {
            console.error('Download error:', error);
            const errorMessage = error.response?.data?.message || 'Network Error. Check ID/password.';
            setMessage(`Download failed: ${errorMessage}`);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="card">
            <h2>Download File</h2>
            <p>Enter the File ID and password to download your file.</p>
            <input
                type="text"
                value={fileId}
                onChange={(e) => setFileId(e.target.value)}
                placeholder="Enter File ID"
                disabled={isDownloading}
            />
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Decryption Password"
                disabled={isDownloading}
            />
            <button onClick={handleDownload} disabled={isDownloading}>
                {isDownloading ? 'Downloading...' : 'Download'}
            </button>
            {message && <p className="message">{message}</p>}
            <button onClick={onBack} className="back-btn" disabled={isDownloading}>
                Back to Main Menu
            </button>
        </div>
    );
}

export default Download;
