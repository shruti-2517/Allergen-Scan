import React, { useState, useRef } from 'react';
import { Container, Card, Button, Form, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { FiCamera, FiUpload, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import MyNavbar from '../components/mynavbar';
import '../styles/ingredientAnalyzer.css';

const IngredientAnalyzer = () => {
  const navigate = useNavigate();
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upload');
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
      setError(null);
      setAnalysis(null);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setActiveTab('camera');
    } catch (err) {
      setError('Unable to access camera. Please check permissions.');
    }
  };

  const capturePhoto = () => {
    const context = canvasRef.current?.getContext('2d');
    if (context && videoRef.current) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      canvasRef.current.toBlob((blob) => {
        const file = new File([blob], 'captured_ingredient.jpg', {
          type: 'image/jpeg',
        });
        setSelectedFile(file);
        setImagePreview(canvasRef.current.toDataURL('image/jpeg'));
        setActiveTab('upload');
        stopCamera();
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => {
        track.stop();
      });
    }
  };

  const analyzeImage = async () => {
    if (!selectedFile) {
      setError('Please select or capture an image first');
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Not authenticated. Please log in.');
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await fetch('/analyze-ingredients', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to analyze image');
      } else {
        setAnalysis(data);
      }
    } catch (err) {
      setError('Error analyzing image: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setAnalysis(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <MyNavbar />
      <Container className="mt-5 mb-5">
      <Row className="justify-content-center">
        <Col lg={8}>
          <Card className="shadow-lg border-0">
            <Card.Header className="bg-gradient">
              <Card.Title className="mb-0">
                <FiUpload className="me-2" />
                Analyze Ingredients from Image
              </Card.Title>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}

              {!analysis ? (
                <>
                  {/* Tab Navigation */}
                  <div className="btn-group mb-4 w-100" role="tablist">
                    <button
                      className={`btn upload-button ${
                        activeTab === 'upload' ? 'active' : ''
                      }`}
                      onClick={() => setActiveTab('upload')}
                    >
                      <FiUpload className="me-2" />
                      Upload Image
                    </button>
                    <button
                      className={`btn upload-button ${
                        activeTab === 'camera' ? 'active' : ''
                      }`}
                      onClick={startCamera}
                    >
                      <FiCamera className="me-2" />
                      Take Photo
                    </button>
                  </div>

                  {/* Upload Tab */}
                  {activeTab === 'upload' && (
                    <div className="upload-section">
                      {!imagePreview ? (
                        <div
                          className="upload-area border-2 border-dashed rounded p-5 text-center cursor-pointer"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <FiUpload size={48} className="text-primary mb-3" />
                          <p className="text-muted mb-2">
                            Click to upload or drag and drop
                          </p>
                          <small className="text-muted">
                            PNG, JPG, JPEG or WEBP (Max 10MB)
                          </small>
                          <Form.Control
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="d-none"
                          />
                        </div>
                      ) : (
                        <div className="preview-section">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="img-fluid rounded mb-3"
                            style={{ maxHeight: '400px' }}
                          />
                          <div className="d-grid gap-2">
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={resetForm}
                            >
                              Change Image
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Camera Tab */}
                  {activeTab === 'camera' && (
                    <div className="camera-section">
                      {!imagePreview ? (
                        <>
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-100 rounded mb-3"
                            style={{ maxHeight: '400px', objectFit: 'cover' }}
                          />
                          <canvas ref={canvasRef} className="d-none" />
                          <div className="d-grid gap-2">
                            <Button
                              variant="primary"
                              size="lg"
                              onClick={capturePhoto}
                            >
                              <FiCamera className="me-2" />
                              Capture Photo
                            </Button>
                            <Button
                              variant="secondary"
                              onClick={stopCamera}
                            >
                              Cancel
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <img
                            src={imagePreview}
                            alt="Captured"
                            className="img-fluid rounded mb-3"
                            style={{ maxHeight: '400px' }}
                          />
                          <div className="d-grid gap-2">
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={resetForm}
                            >
                              Retake Photo
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Analyze Button */}
                  {imagePreview && (
                    <Button
                      variant="success"
                      size="lg"
                      className="w-100 mt-4"
                      onClick={analyzeImage}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Spinner
                            animation="border"
                            size="sm"
                            className="me-2"
                          />
                          Analyzing...
                        </>
                      ) : (
                        'Analyze Ingredients'
                      )}
                    </Button>
                  )}
                </>
              ) : (
                /* Analysis Results */
                <div className="analysis-results">
                  <Alert variant={analysis.safe ? 'success' : 'warning'}>
                    <strong>
                      {analysis.safe ? <><FiCheckCircle className="me-2" />Safe to Consume</> : <><FiAlertCircle className="me-2" />Contains Allergens</>}
                    </strong>
                  </Alert>

                  <Row className="mb-4">
                    <Col md={6}>
                      <div className="stat-box">
                        <h6 className="text-muted">Total Ingredients</h6>
                        <h3 className="text-primary">
                          {analysis.total_ingredients}
                        </h3>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="stat-box">
                        <h6 className="text-muted">Allergens Found</h6>
                        <h3 className="text-danger">
                          {analysis.total_allergens}
                        </h3>
                      </div>
                    </Col>
                  </Row>

                  {analysis.found_allergens.length > 0 && (
                    <div className="mb-4">
                      <h6 className="text-danger mb-2">Detected Allergens:</h6>
                      <div className="allergen-tags">
                        {analysis.found_allergens.map((allergen, idx) => (
                          <span key={idx} className="badge bg-danger me-2 mb-2">
                            {allergen}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <h6 className="mb-2">Extracted Text:</h6>
                    <div className="extracted-text p-3 bg-light rounded">
                      <small className="text-muted">
                        {analysis.extracted_text}
                      </small>
                    </div>
                  </div>

                  <div className="d-grid gap-2">
                    <Button variant="primary" onClick={resetForm}>
                      Analyze Another Image
                    </Button>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      </Container>
    </>
  );
};

export default IngredientAnalyzer;
