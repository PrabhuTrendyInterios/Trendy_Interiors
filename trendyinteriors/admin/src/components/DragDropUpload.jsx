import React, { useState } from 'react';
import { FaCloudUploadAlt, FaTimes } from 'react-icons/fa';
import './DragDropUpload.css';

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:5001'
    : 'https://trendyinteriors-1.onrender.com');

const uploadToServer = async (file, folder) => {
  const formData = new FormData();
  formData.append('image', file);

  const token = localStorage.getItem('token');
  const url = folder ? `${API_BASE_URL}/api/upload?folder=${encodeURIComponent(folder)}` : `${API_BASE_URL}/api/upload`;
  const response = await fetch(url, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Upload failed');
  }
  return data.data.url;
};

const MAX_FILE_SIZE_MB = 6;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const DragDropUpload = ({ onImageUrlChange, imageUrl, label = 'Project Image', folder = '' }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleFile = async (file) => {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError(`File exceeds the ${MAX_FILE_SIZE_MB}MB limit. Please choose a smaller image.`);
      return;
    }
    setUploading(true);
    setUploadError('');
    try {
      const url = await uploadToServer(file, folder);
      onImageUrlChange(url);
    } catch (err) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleClickUpload = () => {
    document.getElementById('image-upload').click();
  };

  const clearImage = () => {
    onImageUrlChange('');
    setUploadError('');
  };

  return (
    <div className="drag-drop-upload">
      {imageUrl ? (
        <div className="upload-preview">
          <div className="preview-image-wrapper">
            <img src={imageUrl} alt="Preview" className="preview-image" />
            <button
              type="button"
              className="clear-image-btn"
              onClick={clearImage}
              title="Remove image"
            >
              <FaTimes />
            </button>
          </div>
          <div className="preview-actions">
            <p className="preview-text">Image uploaded successfully</p>
            <button type="button" className="change-image-btn" onClick={clearImage}>
              Change Image
            </button>
          </div>
        </div>
      ) : (
        <div className="upload-input-wrapper">
          <div
            className={`drag-drop-zone ${isDragging ? 'dragging' : ''} ${uploading ? 'uploading' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={!uploading ? handleClickUpload : undefined}
          >
            <FaCloudUploadAlt className="upload-icon" />
            {uploading ? (
              <>
                <h4 className="upload-title">Uploading…</h4>
                <p className="upload-subtitle">Saving to Google Drive</p>
              </>
            ) : (
              <>
                <h4 className="upload-title">Drag &amp; drop your image</h4>
                <p className="upload-subtitle">or click to browse files</p>
                <p className="upload-formats">Supported: JPG, PNG, WebP (Max {MAX_FILE_SIZE_MB}MB)</p>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="file-input"
              id="image-upload"
              disabled={uploading}
            />
          </div>

          {uploadError && <p className="upload-error" style={{ color: 'red', marginTop: 8 }}>{uploadError}</p>}

          <div className="url-input-section">
            <p className="url-section-title">Or paste an image URL</p>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => onImageUrlChange(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="url-input"
            />
            <small className="url-hint">Direct image links from Unsplash, Pexels, or verified URLs</small>
          </div>
        </div>
      )}
    </div>
  );
};

export default DragDropUpload;
