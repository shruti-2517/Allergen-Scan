import { Card, Form, Button, Container, Row, Col } from 'react-bootstrap';
import { useRef, useState } from "react";
import { useNavigate } from 'react-router-dom';
import MyNavbar from '../components/navbar'

export default function Login() {
    const refEmail = useRef();
    const refPassword = useRef();
    const [errorMessage, setErrorMessage] = useState();
    const navigate = useNavigate()

    // Handles login and sends a POST request to backend
    async function handleLogin() {
        const email = refEmail.current.value
        const password = refPassword.current.value

        const res = await fetch("/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                email: email,
                password: password,
            })
        })
        const data = await res.json()
        if (res.status == 200) {
            localStorage.setItem("token", data.accessToken)
            navigate("/home");
        }
        else {
            setErrorMessage(data.error)
        }
    };

    return (
        <div>

            <MyNavbar />

            <Container className="d-flex justify-content-center align-items-center" style={{ height: '90vh' }}>
                <Card style={{ width: '90%', maxWidth: '400px', borderRadius: '15px', border: '1px solid black' }}>
                    <Card.Header className="text-center fw-bold border-bottom" style={{ backgroundColor: 'transparent' }}>
                        Login
                    </Card.Header>
                    <Card.Body>
                        <Form>
                            <Form.Group controlId="formEmail" className="mb-3">
                                <Form.Label>Email</Form.Label>
                                <input ref={refEmail} type="email" className="form-control" id="email" required />
                            </Form.Group>

                            <Form.Group controlId="formPassword" className="mb-4">
                                <Form.Label>Password</Form.Label>
                                <input ref={refPassword} type="password" className="form-control" id="password" required />
                            </Form.Group>
                        </Form>
                        <Row>
                            <Col>
                                <Button variant="light" className="w-100" onClick={handleLogin} style={{ backgroundColor: '#d6b2d6', border: '1px solid #d6b2d6' }}>
                                    Login
                                </Button>
                            </Col>
                            <Col>
                                <Button variant="light" className="w-100" onClick={() => { navigate("/signup") }} style={{ backgroundColor: '#d6b2d6', border: '1px solid #d6b2d6' }}>
                                    Sign Up
                                </Button>
                            </Col>
                        </Row>
                        <p className="message text-center mt-4">{errorMessage}</p>
                    </Card.Body>
                </Card>
            </Container>
        </div>
    );
}
