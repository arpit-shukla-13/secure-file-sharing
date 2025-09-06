import React, { useState } from 'react';

function Success({ fileData, onUploadAnother }) {
    const [copySuccess, setCopySuccess] = useState('');
    
    // Create the full shareable download link
    const downloadLink = `${window.location.origin}/download/${fileData.fileId}`;
    
    const handleCopy = (textToCopy) => {
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopySuccess('Copied!');
            setTimeout(() => setCopySuccess(''), 2000); // Clear message after 2 seconds
        }, (err) => {
            setCopySuccess('Failed to copy!');
            console.error('Could not copy text: ', err);
        });
    };

    // Naya function jo download page par le jaayega
    const goToDownloadPage = () => {
        window.location.href = downloadLink;
    };

    return (
        <div className="card success-card">
            <h2>Upload Successful!</h2>
            {/* fileData.fileName ko hata diya hai taaki error na aaye */}
            <p>Your file is ready to be shared.</p>
            
            <div className="info-box">
                <label>File ID</label>
                <div className="copy-container">
                    <input type="text" value={fileData.fileId} readOnly />
                    <button onClick={() => handleCopy(fileData.fileId)}>Copy</button>
                </div>
            </div>

            <div className="info-box">
                <label>Shareable Download Link</label>
                <div className="copy-container">
                    <input type="text" value={downloadLink} readOnly />
                    <button onClick={() => handleCopy(downloadLink)}>Copy Link</button>
                </div>
            </div>

            {copySuccess && <p className="message success-message">{copySuccess}</p>}
            
            {/* Naya button jo download page par le jaata hai */}
            <button onClick={goToDownloadPage} className="secondary-btn">
                Go to Download Page
            </button>

            {/* Yeh button aapko home/selection screen par wapas le jaayega */}
            <button onClick={onUploadAnother} className="upload-another-btn">
                Upload Another File
            </button>
        </div>
    );
}

export default Success;

