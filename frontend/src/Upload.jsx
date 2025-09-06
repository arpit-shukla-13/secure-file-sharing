import React, { useState, useCallback } from "react";
import axios from "axios";
import { useDropzone } from "react-dropzone";

// Helper function for XOR encryption
async function xorProcess(chunk, key) {
  const keyBytes = new TextEncoder().encode(key);
  const chunkBytes = new Uint8Array(await chunk.arrayBuffer());
  const resultBytes = new Uint8Array(chunkBytes.length);

  for (let i = 0; i < chunkBytes.length; i++) {
    resultBytes[i] = chunkBytes[i] ^ keyBytes[i % keyBytes.length];
  }
  return resultBytes.buffer;
}

function Upload({ apiUrl, onUploadSuccess, onBack }) {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState("Drag & drop a file here, or click to select a file");
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setMessage(acceptedFiles[0].name);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false });

  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

  const handleUpload = async () => {
    if (!file || !password) {
      setMessage("Please select a file and enter a password.");
      return;
    }
    
    setIsUploading(true);
    setMessage("Starting upload...");
    setUploadProgress(0);

    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    
    try {
      const startResponse = await axios.post(`${apiUrl}/api/files/start-upload`, {
        fileName: file.name,
        totalChunks: totalChunks,
        size: file.size,
      });

      const { fileId } = startResponse.data;
      setMessage(`Encrypting and uploading chunks...`);

      const uploadPromises = [];
      let uploadedSize = 0;

      for (let i = 0; i < totalChunks; i++) {
        const chunk = file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        const encryptedBuffer = await xorProcess(chunk, password);
        
        const formData = new FormData();
        formData.append('chunkIndex', i);
        formData.append('chunk', new Blob([encryptedBuffer]));

        const promise = axios.post(`${apiUrl}/api/files/upload-chunk/${fileId}`, formData)
          .then(() => {
            uploadedSize += chunk.size;
            const progress = Math.round((uploadedSize / file.size) * 100);
            setUploadProgress(progress);
          });
        uploadPromises.push(promise);
      }

      await Promise.all(uploadPromises);

      setMessage("All chunks uploaded. Merging file on server...");
      const finishResponse = await axios.post(`${apiUrl}/api/files/finish-upload`, {
        fileId,
        password,
      });

      // Pass data to the success component
      onUploadSuccess({
        fileId: finishResponse.data.fileId,
        downloadLink: `${window.location.origin}/download/${finishResponse.data.fileId}`
      });

    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage = error.response?.data?.message || "Network Error";
      setMessage(`Upload failed: ${errorMessage}`);
      setUploadProgress(0);
      setIsUploading(false);
    }
  };

  return (
    <div className="card">
      <h2>Upload File</h2>
      <div {...getRootProps({ className: `dropzone ${isDragActive ? 'active' : ''}` })}>
        <input {...getInputProps()} />
        <p>{message}</p>
      </div>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter Encryption Password"
        disabled={isUploading}
      />
      <button onClick={handleUpload} disabled={isUploading || !file}>
        {isUploading ? `Uploading... ${uploadProgress}%` : 'Upload'}
      </button>
      {uploadProgress > 0 && (
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
        </div>
      )}
      <button onClick={onBack} className="back-btn" disabled={isUploading}>
        Back to Main Menu
      </button>
    </div>
  );
}

export default Upload;

