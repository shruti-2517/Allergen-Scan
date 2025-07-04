import { Card, Form, Button, Container, Row, Col } from 'react-bootstrap';
import { useRef, useState } from "react";
import { useNavigate } from 'react-router-dom';
import MyNavbar from '../components/navbar'

export default function SignUp() {
    const refName = useRef();
    const refEmail = useRef();
    const refPassword = useRef();
    const [errorMessage, setErrorMessage] = useState();
    const navigate = useNavigate()

    // Handles sign up and sends a POST request to backend
    async function handleSignUp() {
        const email = refEmail.current.value
        const name = refName.current.value
        const password = refPassword.current.value

        const res = await fetch("/signup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: name,
                email: email,
                password: password,
            })
        })
        const data = await res.json()
        if(res.status == 200)
        {
            navigate("/profile")
        }
        setErrorMessage(data.message)
    };

    return (
        <div>
            
            <MyNavbar />

            <Container className="d-flex justify-content-center align-items-center" style={{ height: '90vh' }}>
                <Card style={{ width: '90%', maxWidth: '400px', borderRadius: '15px', border: '1px solid black' }}>
                    <Card.Header className="text-center fw-bold border-bottom" style={{ backgroundColor: 'transparent' }}>
                        Sign Up
                    </Card.Header>
                    <Card.Body>
                        <Form>
                            <Form.Group controlId="formName" className="mb-3">
                                <Form.Label>Name</Form.Label>
                                <input ref={refName} type="text" className="form-control" id ="name" required />
                            </Form.Group>

                            <Form.Group controlId="formEmail" className="mb-3">
                                <Form.Label>Email</Form.Label>
                                <input ref={refEmail} type="email" className="form-control" id = "email" required />
                            </Form.Group>

                            <Form.Group controlId="formPassword" className="mb-4">
                                <Form.Label>Password</Form.Label>
                                <input ref={refPassword} type="password" className="form-control" id="password" required />
                            </Form.Group>
                        </Form>
                        <Row>
                            <Col>
                                <Button variant="light" className="w-100" onClick={handleSignUp} style={{ backgroundColor: '#d6b2d6', border: '1px solid #d6b2d6' }}>
                                    Sign Up
                                </Button>
                            </Col>
                            <Col>
                                <Button variant="light" className="w-100" onClick={() => {navigate("/login")}} style={{ backgroundColor: '#d6b2d6', border: '1px solid #d6b2d6' }}>
                                    Login
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
