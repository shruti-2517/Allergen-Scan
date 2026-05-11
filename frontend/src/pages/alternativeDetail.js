import { Card, Container, Row, Col, Spinner, Button } from 'react-bootstrap'
import MyNavbar from '../components/mynavbar'
import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import authFetch from './authFetch'
import { FiArrowLeft, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import '../styles/info.css'

export default function AlternativeDetail() {
    const { barcode } = useParams()
    const navigate = useNavigate()
    const [product, setProduct] = useState(null)
    const [loading, setLoading] = useState(true)
    const [fetchError, setFetchError] = useState(null)
    const [expandIngredients, setExpandIngredients] = useState(false)
    const VISIBLE_COUNT = 5

    useEffect(() => {
        async function fetchDetail() {
            setLoading(true)
            try {
                const res = await authFetch(`/alternative-detail/${barcode}`)
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}))
                    setFetchError(err.error || `Error ${res.status}`)
                    setProduct(null)
                    return
                }
                setProduct(await res.json())
            } catch (e) {
                setFetchError('Failed to load product details')
                setProduct(null)
            } finally {
                setLoading(false)
            }
        }
        fetchDetail()
    }, [barcode])

    if (loading) return (
        <div className="info-container">
            <MyNavbar />
            <Container className="info-content d-flex align-items-center justify-content-center">
                <Spinner animation="border" variant="primary" />
            </Container>
        </div>
    )

    if (!product) return (
        <div className="info-container">
            <MyNavbar />
            <Container className="info-content">
                <div className="empty-state">
                    <h3 className="empty-title">Product Not Found</h3>
                    <p className="empty-subtitle">{fetchError || "Couldn't load details for this product."}</p>
                    <Button className="btn-back" onClick={() => navigate(-1)}>
                        <FiArrowLeft /> Go Back
                    </Button>
                </div>
            </Container>
        </div>
    )

    const ingredientCount = product.ingredients_tags?.length || 0

    return (
        <div className="info-container">
            <MyNavbar />
            <Container className="info-content">
                <button className="back-link" onClick={() => navigate(-1)}>
                    <FiArrowLeft /> Back to Alternatives
                </button>

                <Row className="g-4">
                    <Col lg={4}>
                        <Card className="product-card">
                            {product.image_url && (
                                <div className="product-image-container">
                                    <img src={product.image_url} alt={product.product_name} className="product-image" />
                                </div>
                            )}
                            <Card.Body>
                                <h2 className="product-title">{product.product_name}</h2>
                                <p className="product-barcode"><code>{product.product_barcode}</code></p>

                                <div className={`status-banner ${product.safe && !product.uncertain ? 'safe' : product.uncertain ? 'uncertain' : 'unsafe'}`}>
                                    <span className="status-icon">{product.safe && !product.uncertain ? '✓' : product.uncertain ? '?' : '⚠'}</span>
                                    <span className="status-text">
                                        {product.safe && !product.uncertain
                                            ? 'Safe for You'
                                            : product.uncertain
                                            ? 'Safety Uncertain'
                                            : 'Contains Your Allergens'}
                                    </span>
                                </div>

                                <div className="product-metadata">
                                    {product.brands && (
                                        <div className="metadata-item">
                                            <span className="metadata-label">Brand</span>
                                            <span className="metadata-value">{product.brands}</span>
                                        </div>
                                    )}
                                    {product.quantity && (
                                        <div className="metadata-item">
                                            <span className="metadata-label">Quantity</span>
                                            <span className="metadata-value">{product.quantity}</span>
                                        </div>
                                    )}
                                    {product.nutriscore_grade && (
                                        <div className="metadata-item">
                                            <span className="metadata-label">Nutri-Score</span>
                                            <span className={`metadata-value nutriscore nutriscore-${product.nutriscore_grade.toLowerCase()}`}>
                                                {product.nutriscore_grade.toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                    <div className="metadata-item">
                                        <span className="metadata-label">Ingredients</span>
                                        <span className="metadata-value">{ingredientCount}</span>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col lg={8}>
                        {product.hasTraceWarning && product.traceAllergens?.length > 0 && (
                            <Card className="details-card mb-4">
                                <Card.Header className="details-header uncertain-header">
                                    <div className="header-content">
                                        <h3 className="details-title">Trace Warning for Your Allergens</h3>
                                        <span className="allergen-count-badge">{product.traceAllergens.length}</span>
                                    </div>
                                </Card.Header>
                                <Card.Body>
                                    <p className="uncertain-note">
                                        This product may contain traces of allergens from your profile due to shared equipment or facilities.
                                    </p>
                                    <div className="items-list">
                                        {product.traceAllergens.map((a, i) => (
                                            <div key={i} className="list-item uncertain-item">
                                                <span className="item-text">{a}</span>
                                            </div>
                                        ))}
                                    </div>
                                </Card.Body>
                            </Card>
                        )}

                        {/* Allergens card — shown only if somehow unsafe */}
                        {product.foundAllergens?.length > 0 && (
                            <Card className="details-card mb-4">
                                <Card.Header className="details-header">
                                    <div className="header-content">
                                        <h3 className="details-title">Matched Allergens</h3>
                                        <span className="allergen-count-badge">{product.foundAllergens.length}</span>
                                    </div>
                                </Card.Header>
                                <Card.Body>
                                    <div className="items-list">
                                        {product.foundAllergens.map((a, i) => (
                                            <div key={i} className="list-item allergen-item">
                                                <span className="item-text">{a}</span>
                                            </div>
                                        ))}
                                    </div>
                                </Card.Body>
                            </Card>
                        )}

                        {/* Ingredients card */}
                        <Card className="details-card">
                            <Card.Header className="details-header">
                                <div className="header-content">
                                    <h3 className="details-title">Ingredients</h3>
                                    {ingredientCount > 0 && (
                                        <span className="ingredient-count-badge">{ingredientCount}</span>
                                    )}
                                </div>
                            </Card.Header>
                            <Card.Body>
                                {ingredientCount > 0 ? (
                                    <>
                                        <div className="items-list">
                                            {(expandIngredients
                                                ? product.ingredients_tags
                                                : product.ingredients_tags?.slice(0, VISIBLE_COUNT)
                                            )?.map((ing, i) => (
                                                <div key={i} className="list-item ingredient-item">
                                                    <span className="item-text">{ing}</span>
                                                </div>
                                            ))}
                                        </div>
                                        {ingredientCount > VISIBLE_COUNT && (
                                            <button className="expand-btn" onClick={() => setExpandIngredients(v => !v)}>
                                                {expandIngredients
                                                    ? <><span>Show less</span><FiChevronUp /></>
                                                    : <><span>Show {ingredientCount - VISIBLE_COUNT} more</span><FiChevronDown /></>
                                                }
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <div className="no-items"><p>No ingredient data available</p></div>
                                )}
                            </Card.Body>
                        </Card>

                        {/* Raw ingredients text */}
                        {product.ingredients_text && (
                            <Card className="details-card mt-4">
                                <Card.Header className="details-header">
                                    <div className="header-content">
                                        <h3 className="details-title">Full Ingredients Text</h3>
                                    </div>
                                </Card.Header>
                                <Card.Body>
                                    <p className="ingredients-text">{product.ingredients_text}</p>
                                </Card.Body>
                            </Card>
                        )}
                    </Col>
                </Row>
            </Container>
        </div>
    )
}
