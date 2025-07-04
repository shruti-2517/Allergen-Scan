import { Card, Form, Button, Container, Row, Col } from 'react-bootstrap';
import { useRef, useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import authFetch from './authFetch.js'
import MyNavbar from '../components/navbar'

export default function History() {

    const [errorMessage, setErrorMessage] = useState();
    const navigate = useNavigate()
    const [products, setProducts] = useState([])

    async function getData() {
        const res = await authFetch('/info/history', {
            method: 'POST'
        })
        const data = await res.json()
        setProducts(data.products || [])
    }

    useEffect(() => { getData() }, []);

    return (
        <div>

            <MyNavbar />

            <Container className="mt-4">
                {products.map((product, idx) => (
                    <Card
                        key={idx}
                        className="mb-4"
                        style={{
                            borderRadius: '10px',
                            border: '1px solid #333',
                            padding: '1px'
                        }}
                    >
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center w-100 mb-2">
                                <strong className="text-start">{product.product_name}</strong>
                                <strong className="text-end">{product.safe ? "Safe" : "Unsafe"}</strong>
                            </div>

                            <Row className="mt-2">
                                <Col>
                                    Allergens Found: {product.total_allergens} allergens
                                </Col>
                            </Row>
                            <Button className="mt-3" variant="outline-dark" size="sm">
                                Detailed Info
                            </Button>
                        </Card.Body>
                    </Card>
                ))}
            </Container>
        </div>
    )
}
