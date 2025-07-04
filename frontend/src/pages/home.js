import React, { useState, useRef, useEffect } from 'react';
import { Navbar, Container, Button, Card } from 'react-bootstrap';
import { useSwipeable } from 'react-swipeable';
import { useNavigate } from 'react-router-dom';
import authFetch from './authFetch.js'
import { Html5Qrcode } from "html5-qrcode";

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

    useEffect(() => {
        async function fetchRecents() {
            try {
                const res = await authFetch(`/recents`)
                const data = await res.json()
                if (res.status == 200) {
                    console.log(Array.isArray(data))
                    console.log("Length:", data.length)
                    console.log(data)
                    setRecents(data)
                } else {
                    setErrorMessage("Failed to load recents")
                }
            } catch (err) {
                setErrorMessage("Network error while fetching recents")
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
        <div style={{ minHeight: '100vh', backgroundColor: '#fff' }}>
            {/* Navbar */}
            <Navbar className="px-3" style={{ backgroundColor: '#d6b2d6' }}>
                <Container fluid className="justify-content-between align-items-center">
                    <Navbar.Brand className="fw-bold fs-5">Allergenic</Navbar.Brand>
                    <div className="d-flex align-items-center gap-3">
                        <a className="nav-link text-dark" onClick={() => { navigate("/history") }}>History</a>
                        <Button variant="outline-dark" size="sm" onClick={() => { navigate("/login") }}>Sign In/Up</Button>
                        <i className="bi bi-person-circle fs-1 ms-1" onClick={() => { navigate("/profile") }}></i>
                    </div>
                </Container>
            </Navbar>

            {/* Recents */}
            <Container fluid className="mt-4 px-0 pt-4">
                <h5 className="text-start ms-3 ps-3 mb-2 pb-2">Recents</h5>

                <div {...handlers} className="position-relative" style={{ height: '155px', overflow: 'hidden' }}>
                    <div className="d-flex" style={{ transform: `translateX(-${currentIndex * 100}vw)`, width: `${recents.length * 100}vw`, transition: 'transform 0.4s ease' }} >
                        {recents.map((item, idx) => (
                            <div key={idx} className="d-flex justify-content-center" style={{ width: '100vw', flexShrink: 0 }}>
                                <Card style={{ width: '85vw' }}>
                                    <Card.Body>
                                        <Card.Title className="d-flex justify-content-between">
                                            <span className="fw-bold">{item.product_name}</span>
                                            <span className={`fw-bold ${item.safe === 'Safe' ? 'text-success' : 'text-danger'}`}>{item.status}</span>
                                        </Card.Title>
                                        <Card.Text>
                                            Allergens Found: {item.total_allergens}
                                        </Card.Text>
                                        <Button variant="outline-secondary" size="sm" className="w-100" onClick={() => {navigate(`/info/${recents.product_barcode}`)}}>Detailed Info</Button>
                                    </Card.Body>
                                </Card>
                            </div>
                        ))}
                    </div>
                </div>


            {/* Dots */}
            <div className="d-flex justify-content-center gap-2 mb-5 pb-5">
                    {recents.map((_, idx) => (
                        <div key={idx} style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: currentIndex === idx ? '#d6b2d6' : '#ccc',
                            transition: 'background-color 0.3s ease',
                        }}
                        />
                    ))}
                </div>
            </Container>

            {scanning && <div id="reader" style={{ width: "200px", height: "100px", aspectRatio: "1 / 1", margin: "auto", marginTop: "10px" }} />}
            {scannedCode && <p className="mt-3 text-center">Scanned: <strong>{scannedCode}</strong></p>}

            {/* Camera Button */}
            {!scanning && <div className="d-flex justify-content-center mt-4 pt-4" onClick={() => setScanning(true)}>
                <button className="btn rounded-circle shadow"
                    style={{ backgroundColor: '#d6b2d6', padding: '20px', width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <i className="bi bi-camera fs-3 text-dark"></i>
                </button>
            </div>}
        </div >
    );
}