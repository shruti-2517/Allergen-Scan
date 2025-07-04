import { Card, Container } from 'react-bootstrap'
import MyNavbar from '../components/navbar'
import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import authFetch from './authFetch'

export default function Info() {
    const { barcode } = useParams()
    const [product, setProduct] = useState(null)
    const [expandAllergens, setExpandAllergens] = useState(false);
    const [expandIngredients, setExpandIngredients] = useState(false);
    const VISIBLE_COUNT = 4;

    useEffect(() => { fetchProduct() }, [barcode])

    async function fetchProduct() {
        const res = await authFetch(`/info/${barcode}`)
        const data = await res.json()
        setProduct(data)
    }

    if (!product) return <div>Loading...</div>

    return (
        <div>
            <MyNavbar />

            <Container className="mt-4 d-flex justify-content-center">
                <Card style={{ width: '320px', borderRadius: '15px', border: '1px solid #333', padding: '10px', fontSize: '1rem', fontWeight: '400' }}>
                    <Card.Body>

                        <Card.Title className="text-center mb-3" style={{ backgroundColor: '#d6b2d6', borderRadius: '8px', padding: '5px', fontSize: '1.2rem' }}>
                            {product.product_name || "Unknown Product"}
                        </Card.Title>

                        <p className="mb-2"><strong>Barcode:</strong> {product.product_barcode || 'N/A'}</p>

                        <p className="mb-2"><strong>Status:</strong>
                            <span style={{ color: product.safe ? 'green' : 'red', marginLeft: '5px' }}>
                                {product.safe ? 'Safe for you' : 'Unsafe'}
                            </span>
                        </p>

                        <p><strong>Last Scanned: </strong>
                            {new Date(product.timestamp).toLocaleString()}
                        </p>


                        <hr />

                        <p className="mb-1"><strong>Matched Allergens:</strong></p>
                        <ul className="list-unstyled mb-2" style={{ fontSize: '0.9rem' }}>
                            {(expandAllergens ? product.foundAllergens : product.foundAllergens?.slice(0, VISIBLE_COUNT))?.map((a, i) => (
                                <li key={i}>• {a}</li>
                            ))}

                            {!expandAllergens && product.foundAllergens?.length > VISIBLE_COUNT && (
                                <li
                                    style={{ color: '#6c757d', cursor: 'pointer' }}
                                    onClick={() => setExpandAllergens(true)}
                                >
                                    • ...and {product.foundAllergens.length - VISIBLE_COUNT} more
                                </li>
                            )}

                            {expandAllergens && product.foundAllergens?.length > VISIBLE_COUNT && (
                                <li
                                    style={{ color: '#6c757d', cursor: 'pointer' }}
                                    onClick={() => setExpandAllergens(false)}
                                >
                                    • Show less
                                </li>
                            )}
                        </ul>

                        <p className="mb-1"><strong>Ingredients:</strong></p>
                        <ul className="list-unstyled mb-2" style={{ fontSize: '0.9rem' }}>
                            {(expandIngredients ? product.ingredients_tags : product.ingredients_tags?.slice(0, VISIBLE_COUNT))?.map((ing, i) => (
                                <li key={i}>• {ing}</li>
                            ))}

                            {!expandIngredients && product.ingredients_tags?.length > VISIBLE_COUNT && (
                                <li
                                    style={{ color: '#6c757d', cursor: 'pointer' }}
                                    onClick={() => setExpandIngredients(true)}
                                >
                                    • ...and {product.ingredients_tags.length - VISIBLE_COUNT} more
                                </li>
                            )}

                            {expandIngredients && product.ingredients_tags?.length > VISIBLE_COUNT && (
                                <li
                                    style={{ color: '#6c757d', cursor: 'pointer' }}
                                    onClick={() => setExpandIngredients(false)}
                                >
                                    • Show less
                                </li>
                            )}
                        </ul>

                    </Card.Body>
                </Card>
            </Container>
        </div >
    )
}