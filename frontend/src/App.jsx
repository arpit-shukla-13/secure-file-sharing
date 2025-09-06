import React, { useState } from 'react';
import Upload from './Upload';
import Success from './Success';
import Download from './Download';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Homepage component jo selection dikhata hai
function Selection({ onSelect }) {
    return (
        <div className="card selection-card">
            <h2>Welcome</h2>
            <p>Choose an action to get started.</p>
            <div className="selection-buttons">
                <button onClick={() => onSelect('upload')}>Upload a File</button>
                <button onClick={() => onSelect('download')} className="secondary-btn">Download a File</button>
            </div>
        </div>
    );
}

function App() {
    const [view, setView] = useState('selection'); // Default view
    const [uploadedFileData, setUploadedFileData] = useState(null);

    const onUploadSuccess = (data) => {
        setUploadedFileData(data);
        setView('success');
    };

    const handleBack = () => {
        setView('selection');
    };

    // Decide which component to show
    const renderContent = () => {
        switch (view) {
            case 'upload':
                return <Upload apiUrl={API_URL} onUploadSuccess={onUploadSuccess} onBack={handleBack} />;
            case 'download':
                return <Download apiUrl={API_URL} onBack={handleBack} />;
            case 'success':
                return <Success fileData={uploadedFileData} onUploadAnother={() => setView('upload')} />;
            case 'selection':
            default:
                return <Selection onSelect={setView} />;
        }
    };

    return (
        <div className="container">
            <header>
                <h1>Secure File Sharing</h1>
                <p>Upload your files securely with XOR encryption and chunking.</p>
            </header>
            {renderContent()}
        </div>
    );
}

export default App;

