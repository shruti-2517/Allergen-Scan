import { Card, Form, Button, Container, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { useRef, useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import authFetch from './authFetch.js'
import MyNavbar from '../components/mynavbar'
import { FiFilter, FiSearch, FiChevronRight } from 'react-icons/fi';
import '../styles/history.css';

export default function History() {
    const [errorMessage, setErrorMessage] = useState();
    const navigate = useNavigate()
    const [products, setProducts] = useState([])
    const [filteredProducts, setFilteredProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [filterType, setFilterType] = useState("all") // all, safe, unsafe

    async function getData() {
        setLoading(true);
        try {
            const res = await authFetch('/history')
            const data = await res.json()
            const historyItems = Array.isArray(data) ? data : data.data || []
            setProducts(historyItems)
            setFilteredProducts(historyItems)
        } catch (err) {
            setErrorMessage("Failed to load history. Please try again.")
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { getData() }, []);

    // Handle search and filter
    useEffect(() => {
        let filtered = products;

        // Apply filter by safety status
        if (filterType === "safe") {
            filtered = filtered.filter(p => p.safe);
        } else if (filterType === "unsafe") {
            filtered = filtered.filter(p => !p.safe);
        }

        // Apply search term
        if (searchTerm) {
            filtered = filtered.filter(p =>
                p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.product_barcode.includes(searchTerm)
            );
        }

        setFilteredProducts(filtered);
    }, [searchTerm, filterType, products]);

    return (
        <div className="history-container">
            <MyNavbar />

            <Container className="history-content">
                {/* Header */}
                <div className="history-header">
                    <h1 className="history-title">Scan History</h1>
                    <p className="history-subtitle">Track all your product scans</p>
                </div>

                {/* Search and Filter Bar */}
                <div className="search-filter-bar">
                    <div className="search-box">
                        <FiSearch className="search-icon" />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search by product name or barcode..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="filter-buttons">
                        <button
                            className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
                            onClick={() => setFilterType('all')}
                        >
                            All
                        </button>
                        <button
                            className={`filter-btn ${filterType === 'safe' ? 'active' : ''}`}
                            onClick={() => setFilterType('safe')}
                        >
                            Safe
                        </button>
                        <button
                            className={`filter-btn ${filterType === 'unsafe' ? 'active' : ''}`}
                            onClick={() => setFilterType('unsafe')}
                        >
                            Unsafe
                        </button>
                    </div>
                </div>

                {/* Error Message */}
                {errorMessage && (
                    <Alert variant="danger" dismissible onClose={() => setErrorMessage(null)}>
                        {errorMessage}
                    </Alert>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="loading-state">
                        <Spinner animation="border" variant="primary" />
                        <p>Loading your history...</p>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    // Empty State
                    <div className="empty-state">
                        <h3 className="empty-title">No products found</h3>
                        <p className="empty-subtitle">
                            {products.length === 0
                                ? "Start scanning products to build your history"
                                : "Try adjusting your search or filters"}
                        </p>
                        {products.length === 0 && (
                            <Button
                                className="btn-start-scanning"
                                onClick={() => navigate("/home")}
                            >
                                Start Scanning
                            </Button>
                        )}
                    </div>
                ) : (
                    // Products List
                    <div className="products-list">
                        {filteredProducts.map((product, idx) => (
                            <Card
                                key={idx}
                                className={`product-history-card ${product.safe ? 'safe' : 'unsafe'}`}
                            >
                                <Card.Body>
                                    <div className="card-content-header">
                                        <div className="product-info">
                                            <h3 className="product-history-name">{product.product_name}</h3>
                                            <p className="product-barcode">
                                                Barcode: <code>{product.product_barcode}</code>
                                            </p>
                                        </div>
                                        <span className={`status-badge-history ${product.safe ? 'safe' : 'unsafe'}`}>
                                            {product.safe ? '✓ Safe' : '⚠ Unsafe'}
                                        </span>
                                    </div>

                                    <div className="product-stats">
                                        <div className="stat-item">
                                            <span className="stat-label">Allergens Found</span>
                                            <span className="stat-value">{product.total_allergens}</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-label">Last Scanned</span>
                                            <span className="stat-value">
                                                {product.timestamp ? new Date(product.timestamp).toLocaleDateString() : 'N/A'}
                                            </span>
                                        </div>
                                    </div>

                                    <Button
                                        className="btn-view-details-history"
                                        onClick={() => navigate(`/info/${product.product_barcode}`)}
                                    >
                                        <span>View Details</span>
                                        <FiChevronRight />
                                    </Button>
                                </Card.Body>
                            </Card>
                        ))}

                        {/* Results count */}
                        <div className="results-count">
                            Showing {filteredProducts.length} of {products.length} products
                        </div>
                    </div>
                )}
            </Container>
        </div>
    )
}
