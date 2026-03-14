import React from 'react';
import { Upload, Image as ImageIcon, FileArchive, X } from 'lucide-react';

const UploadSection = ({ onZipUpload, onScreenshotsUpload, onRemoveScreenshot, isGenerating, screenshots = [] }) => {

  const handleZipChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.name.endsWith('.zip')) {
        onZipUpload(file);
      } else {
        alert('Please upload a valid .zip file.');
      }
    }
  };

  const handleScreenshotsChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Convert files to object URLs for preview
    const newScreenshots = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      url: URL.createObjectURL(file)
    }));
    
    if (newScreenshots.length > 0) {
      onScreenshotsUpload(newScreenshots);
    }
  };

  return (
    <section className="upload-section">
      <div className="upload-card">
        <FileArchive className="upload-icon zip-icon" />
        <h3>Upload Project ZIP</h3>
        <p>Supported extensions: js, ts, jsx, tsx, py, html, css, json, md</p>
        <label className="upload-btn">
          <span>Choose ZIP File</span>
          <input 
            type="file" 
            accept=".zip" 
            onChange={handleZipChange} 
            disabled={isGenerating} 
            style={{ display: 'none' }} 
          />
        </label>
      </div>

      <div className="upload-card">
        <ImageIcon className="upload-icon img-icon" />
        <h3>Upload Screenshots</h3>
        <p>Supported formats: png, jpg, jpeg, webp</p>
        <label className="upload-btn alt">
          <span>Choose Images</span>
          <input 
            type="file" 
            accept="image/png, image/jpeg, image/jpg, image/webp" 
            multiple 
            onChange={handleScreenshotsChange} 
            disabled={isGenerating} 
            style={{ display: 'none' }} 
          />
        </label>

        {screenshots.length > 0 && (
          <div className="screenshots-preview-area">
            <div className="screenshots-count-badge">
              {screenshots.length} image{screenshots.length !== 1 ? 's' : ''} added
            </div>
            <div className="screenshots-mini-grid">
              {screenshots.map((s, i) => (
                <div key={s.id || i} className="screenshot-mini-item" title={s.name}>
                  <img src={s.url} alt={`Preview ${i}`} />
                  <button 
                    className="screenshot-remove-btn" 
                    onClick={() => onRemoveScreenshot(s.id)}
                    title="Remove image"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default UploadSection;
