import { useState, useRef, useEffect } from 'react';
import { Container, Button, Card, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useSwipeable } from 'react-swipeable';
import { useNavigate } from 'react-router-dom';
import authFetch from './authFetch.js'
import { Html5Qrcode } from "html5-qrcode";
import MyNavbar from '../components/mynavbar'
import { FiCamera, FiChevronLeft, FiChevronRight, FiCheckCircle } from 'react-icons/fi';
import '../styles/home.css';

export default function Home() {
    const navigate = useNavigate()
    const [recents, setRecents] = useState([])
    const [loadingRecents, setLoadingRecents] = useState(true)

    const [currentIndex, setCurrentIndex] = useState(0);

    // Handles the swipe function for recents
    function handleSwipe(direction) {
        if (direction === 'LEFT' && currentIndex < recents.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else if (direction === 'RIGHT' && currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handlers = useSwipeable({
        onSwipedLeft: () => handleSwipe('LEFT'),
        onSwipedRight: () => handleSwipe('RIGHT'),
        preventDefaultTouchmoveEvent: true,
        trackMouse: true,
    });

    const [scannedCode, setScannedCode] = useState("");
    const [scanning, setScanning] = useState(false);
    const [errorMessage, setErrorMessage] = useState();
    const [scanSuccess, setScanSuccess] = useState(false);

    useEffect(() => {
        async function fetchRecents() {
            try {
                const res = await authFetch("/recents")
                const data = await res.json()
                if (res.status == 200) {
                    setRecents(data)
                    setCurrentIndex(0)
                    setLoadingRecents(false)
                }
                else {
                    setLoadingRecents(false)
                }
            } catch (err) {
                setErrorMessage("Network error while fetching recents")
                setLoadingRecents(false)
            }
        }
        fetchRecents()
    }, [])

    // Reset carousel index whenever recents update
    useEffect(() => {
        setCurrentIndex(0)
    }, [recents])


    useEffect(() => {
        if (scanning) {
            const startScan = async () => {
                await scanBarcode()
            }
            startScan()
        }
    }, [scanning])

    // Scans the barcode and navigates to the detailed info page
    async function scanBarcode(params) {
        if (scanning) {
            const html5QrCode = new Html5Qrcode("reader");

            await Html5Qrcode.getCameras().then((devices) => {
                if (devices && devices.length) {
                    html5QrCode.start(
                        { facingMode: "environment" },
                        {
                            fps: 10,
                            qrbox: 200,
                        },
                        async (decodedText, decodedResult) => {
                            await html5QrCode.stop()
                            setScanning(false)
                            const res = await authFetch(`/add/${decodedText}`)
                            const data = await res.json()
                            if (res.status == 200) {
                                navigate(`/info/${decodedText}`)
                            }
                            else {
                                setErrorMessage("Error : " + JSON.stringify(data))
                            }
                        },
                    )
                }
            })
        }
    }

    return (
        <div className="home-container">
            <MyNavbar />

            <Container className="home-content">
                {/* Hero Section */}
                <div className="hero-section">
                    <h1 className="hero-title">Scan & Analyze</h1>
                    <p className="hero-subtitle">Keep yourself safe from allergens</p>
                </div>

                {/* Scanner Button */}
                <div className="scanner-section">
                    {!scanning && (
                        <button 
                            className="scanner-button"
                            onClick={() => setScanning(true)}
                            title="Tap to scan barcode"
                        >
                            <FiCamera size={32} />
                            <span>Scan Barcode</span>
                        </button>
                    )}

                    {scanning && (
                        <div className="scanner-active">
                            <div className="scanner-header">
                                <h3>Position barcode in frame</h3>
                                <button 
                                    className="close-scanner"
                                    onClick={() => {
                                        setScanning(false);
                                        setErrorMessage(null);
                                        setScanSuccess(false);
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                            <div id="reader" className="barcode-reader"></div>
                            {errorMessage && (
                                <Alert variant="danger" className="mt-3">
                                    {errorMessage}
                                </Alert>
                            )}
                        </div>
                    )}
                </div>

                {/* Recents Section */}
                {!loadingRecents && recents.length > 0 && (
                    <div className="recents-section">
                        <h2 className="section-title">Recently Scanned</h2>
                        
                        <div {...handlers} className="recents-carousel">
                            <div 
                                className="carousel-track"
                                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                            >
                                {recents.slice(0, 3).map((item, idx) => (
                                    <div key={item.product_barcode || idx} className="carousel-item">
                                        <Card className="product-card">
                                            <Card.Body>
                                                <div className="card-header-custom">
                                                    <span className="product-name">{item.product_name}</span>
                                                    <span className={`status-badge ${item.safe ? 'safe' : 'unsafe'}`}>
                                                        {item.safe ? '✓ Safe' : '⚠ Unsafe'}
                                                    </span>
                                                </div>
                                                <div className="card-content">
                                                    <p className="allergen-count">
                                                        <strong>{item.total_allergens}</strong> allergens found
                                                    </p>
                                                    <Button 
                                                        className="btn-view-details"
                                                        onClick={() => navigate(`/info/${item.product_barcode}`)}
                                                    >
                                                        View Details
                                                    </Button>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </div>
                                ))}
                            </div>

                            {/* Carousel Controls */}
                            {currentIndex > 0 && (
                                <button 
                                    className="carousel-control prev"
                                    onClick={() => setCurrentIndex(currentIndex - 1)}
                                >
                                    <FiChevronLeft />
                                </button>
                            )}
                            {currentIndex < Math.min(2, recents.length - 1) && (
                                <button 
                                    className="carousel-control next"
                                    onClick={() => setCurrentIndex(currentIndex + 1)}
                                >
                                    <FiChevronRight />
                                </button>
                            )}
                        </div>

                        {/* Carousel Indicators */}
                        <div className="carousel-indicators">
                            {recents.slice(0, 3).map((_, idx) => (
                                <button
                                    key={idx}
                                    className={`indicator ${currentIndex === idx ? 'active' : ''}`}
                                    onClick={() => setCurrentIndex(idx)}
                                    aria-label={`Go to slide ${idx + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="quick-actions">
                    <Row>
                        <Col xs={6} className="mb-3">
                            <button 
                                className="action-card"
                                onClick={() => navigate("/analyze")}
                            >
                                <FiCamera size={32} className="action-icon" />
                                <div className="action-text">Analyze Image</div>
                            </button>
                        </Col>
                        <Col xs={6} className="mb-3">
                            <button 
                                className="action-card"
                                onClick={() => navigate("/history")}
                            >
                                <FiCheckCircle size={32} className="action-icon" />
                                <div className="action-text">View History</div>
                            </button>
                        </Col>
                    </Row>
                </div>
            </Container>
        </div>
    )
}