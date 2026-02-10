import { Card, Container, Row, Col, Button, Spinner, Alert } from 'react-bootstrap'
import MyNavbar from '../components/mynavbar'
import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import authFetch from './authFetch'
import { FiChevronDown, FiChevronUp, FiArrowLeft } from 'react-icons/fi'
import '../styles/info.css'

export default function Info() {
    const { barcode } = useParams()
    const navigate = useNavigate()
    const [product, setProduct] = useState(null)
    const [loading, setLoading] = useState(true)
    const [expandAllergens, setExpandAllergens] = useState(false);
    const [expandIngredients, setExpandIngredients] = useState(false);
    const VISIBLE_COUNT = 5;

    useEffect(() => {
        async function fetchProduct() {
            setLoading(true)
            try {
                const res = await authFetch(`/info/${barcode}`)
                if (!res.ok) {
                    if (res.status === 404) {
                        setProduct(null)
                        return
                    }
                    return
                }

                const data = await res.json()
                setProduct(data)
            } catch (e) {
                console.error('Failed to parse product JSON', e)
                setProduct(null)
            } finally {
                setLoading(false)
            }
        }
        fetchProduct()
    }, [barcode])

    if (loading) {
        return (
            <div className="info-container">
                <MyNavbar />
                <Container className="info-content d-flex align-items-center justify-content-center">
                    <Spinner animation="border" variant="primary" />
                </Container>
            </div>
        )
    }

    if (!product) {
        return (
            <div className="info-container">
                <MyNavbar />
                <Container className="info-content">
                    <div className="empty-state">
                        <h3 className="empty-title">Product Not Found</h3>
                        <p className="empty-subtitle">We couldn't find information for this barcode.</p>
                        <Button
                            className="btn-back"
                            onClick={() => navigate("/home")}
                        >
                            <FiArrowLeft /> Back to Home
                        </Button>
                    </div>
                </Container>
            </div>
        )
    }

    const allergenCount = product.foundAllergens?.length || 0
    const ingredientCount = product.ingredients_tags?.length || 0

    return (
        <div className="info-container">
            <MyNavbar />

            <Container className="info-content">
                {/* Header */}
                <button 
                    className="back-link"
                    onClick={() => navigate(-1)}
                >
                    <FiArrowLeft /> Back
                </button>

                <Row className="g-4">
                    {/* Product Image and Status */}
                    <Col lg={4}>
                        <Card className="product-card">
                            {product.image_url && (
                                <div className="product-image-container">
                                    <img
                                        src={product.image_url}
                                        alt={product.product_name}
                                        className="product-image"
                                    />
                                </div>
                            )}
                            <Card.Body>
                                <h2 className="product-title">{product.product_name || "Unknown Product"}</h2>
                                <p className="product-barcode">
                                    <code>{product.product_barcode || 'N/A'}</code>
                                </p>

                                {/* Status Badge */}
                                <div className={`status-banner ${product.safe ? 'safe' : 'unsafe'}`}>
                                    <span className="status-icon">
                                        {product.safe ? '✓' : '⚠'}
                                    </span>
                                    <span className="status-text">
                                        {product.safe ? 'Safe for You' : 'Unsafe - Contains Allergens'}
                                    </span>
                                </div>

                                {/* Metadata */}
                                <div className="product-metadata">
                                    <div className="metadata-item">
                                        <span className="metadata-label">Last Scanned</span>
                                        <span className="metadata-value">
                                            {new Date(product.timestamp).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="metadata-item">
                                        <span className="metadata-label">Allergens Found</span>
                                        <span className="metadata-value">{allergenCount}</span>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Allergens and Ingredients */}
                    <Col lg={8}>
                        {/* Allergens Card */}
                        <Card className="details-card mb-4">
                            <Card.Header className="details-header">
                                <div className="header-content">
                                    <h3 className="details-title">
                                        Matched Allergens
                                    </h3>
                                    {allergenCount > 0 && (
                                        <span className="allergen-count-badge">{allergenCount}</span>
                                    )}
                                </div>
                            </Card.Header>
                            <Card.Body>
                                {allergenCount > 0 ? (
                                    <>
                                        <div className="items-list">
                                            {(expandAllergens ? product.foundAllergens : product.foundAllergens?.slice(0, VISIBLE_COUNT))?.map((allergen, i) => (
                                                <div key={i} className="list-item allergen-item">
                                                    <span className="item-text">{allergen}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {!expandAllergens && allergenCount > VISIBLE_COUNT && (
                                            <button
                                                className="expand-btn"
                                                onClick={() => setExpandAllergens(true)}
                                            >
                                                Show {allergenCount - VISIBLE_COUNT} more
                                                <FiChevronDown />
                                            </button>
                                        )}

                                        {expandAllergens && allergenCount > VISIBLE_COUNT && (
                                            <button
                                                className="expand-btn"
                                                onClick={() => setExpandAllergens(false)}
                                            >
                                                Show less
                                                <FiChevronUp />
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <div className="no-items">
                                        <span className="no-items-icon">✓</span>
                                        <p>No matched allergens - Safe to consume!</p>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>

                        {/* Ingredients Card */}
                        <Card className="details-card">
                            <Card.Header className="details-header">
                                <div className="header-content">
                                    <h3 className="details-title">
                                        Ingredients
                                    </h3>
                                    {ingredientCount > 0 && (
                                        <span className="ingredient-count-badge">{ingredientCount}</span>
                                    )}
                                </div>
                            </Card.Header>
                            <Card.Body>
                                {ingredientCount > 0 ? (
                                    <>
                                        <div className="items-list">
                                            {(expandIngredients ? product.ingredients_tags : product.ingredients_tags?.slice(0, VISIBLE_COUNT))?.map((ingredient, i) => (
                                                <div key={i} className="list-item ingredient-item">
                                                    <span className="item-text">{ingredient}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {!expandIngredients && ingredientCount > VISIBLE_COUNT && (
                                            <button
                                                className="expand-btn"
                                                onClick={() => setExpandIngredients(true)}
                                            >
                                                Show {ingredientCount - VISIBLE_COUNT} more
                                                <FiChevronDown />
                                            </button>
                                        )}

                                        {expandIngredients && ingredientCount > VISIBLE_COUNT && (
                                            <button
                                                className="expand-btn"
                                                onClick={() => setExpandIngredients(false)}
                                            >
                                                Show less
                                                <FiChevronUp />
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <div className="no-items">
                                        <p>No ingredient data available</p>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    )
}