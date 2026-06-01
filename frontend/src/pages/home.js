import { useState, useEffect } from 'react';
import { Container, Button, Card, Row, Col, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import authFetch from './authFetch.js'
import { Html5Qrcode } from "html5-qrcode";
import MyNavbar from '../components/mynavbar'
import { FiCamera, FiCheckCircle } from 'react-icons/fi';
import '../styles/home.css';

export default function Home() {
    const navigate = useNavigate()
    const [recents, setRecents] = useState([])
    const [loadingRecents, setLoadingRecents] = useState(true)
    const [scanning, setScanning] = useState(false);
    const [errorMessage, setErrorMessage] = useState();

    useEffect(() => {
        async function fetchRecents() {
            try {
                const res = await authFetch("/recents")
                if (res.status === 200) {
                    const data = await res.json()
                    setRecents(data)
                }
            } catch (err) {
                // silently fail, recents are non-critical
            } finally {
                setLoadingRecents(false)
            }
        }
        fetchRecents()
    }, [])


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
                            const res = await authFetch(`/add/${decodedText}`, { method: 'POST' })
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
                        <div className="recents-list">
                            {recents.map((item, idx) => (
                                <Card key={item.product_barcode || idx} className="product-card">
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
                            ))}
                        </div>
                    </div>
                )}
            </Container>
        </div>
    )
}
