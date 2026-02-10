import { Card, Form, Button, Container, Row, Col, Alert } from 'react-bootstrap';
import { useRef, useState } from "react";
import { useNavigate } from 'react-router-dom';
import MyNavbar from '../components/mynavbar'
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import '../styles/auth.css';

export default function SignUp() {
    const refName = useRef();
    const refEmail = useRef();
    const refPassword = useRef();
    const [errorMessage, setErrorMessage] = useState();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate()

    // Handles sign up and sends a POST request to backend
    async function handleSignUp() {
        const email = refEmail.current.value
        const name = refName.current.value
        const password = refPassword.current.value

        if (!name || !email || !password) {
            setErrorMessage("Please fill in all fields")
            return;
        }

        if (password.length < 6) {
            setErrorMessage("Password must be at least 6 characters")
            return;
        }

        setLoading(true);
        setErrorMessage(null);

        try {
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
            if (res.status == 200) {
                navigate("/profile")
            } else {
                setErrorMessage(data.message || "Sign up failed. Please try again.")
            }
        } catch (err) {
            setErrorMessage("Network error. Please try again.")
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSignUp();
        }
    };

    return (
        <div className="auth-container">
            <MyNavbar />

            <Container className="auth-content">
                <Row className="min-vh-100 d-flex align-items-center justify-content-center">
                    <Col xs={12} sm={10} md={6} lg={5}>
                        <div className="auth-card-wrapper">
                            <div className="auth-header">
                                <div className="auth-icon">👤</div>
                                <h1 className="auth-title">Join AllergenScan</h1>
                                <p className="auth-subtitle">Create your account to track allergens safely</p>
                            </div>

                            <Card className="auth-card">
                                <Card.Body>
                                    {errorMessage && (
                                        <Alert variant="danger" dismissible onClose={() => setErrorMessage(null)}>
                                            {errorMessage}
                                        </Alert>
                                    )}

                                    <Form>
                                        <Form.Group controlId="formName" className="mb-4">
                                            <Form.Label className="form-label-custom">Full Name</Form.Label>
                                            <div className="input-group-custom">
                                                <FiUser className="input-icon" />
                                                <input 
                                                    ref={refName} 
                                                    type="text" 
                                                    className="form-control input-custom" 
                                                    placeholder="John Doe"
                                                    onKeyPress={handleKeyPress}
                                                    disabled={loading}
                                                />
                                            </div>
                                        </Form.Group>

                                        <Form.Group controlId="formEmail" className="mb-4">
                                            <Form.Label className="form-label-custom">Email Address</Form.Label>
                                            <div className="input-group-custom">
                                                <FiMail className="input-icon" />
                                                <input 
                                                    ref={refEmail} 
                                                    type="email" 
                                                    className="form-control input-custom" 
                                                    placeholder="you@example.com"
                                                    onKeyPress={handleKeyPress}
                                                    disabled={loading}
                                                />
                                            </div>
                                        </Form.Group>

                                        <Form.Group controlId="formPassword" className="mb-3">
                                            <Form.Label className="form-label-custom">Password</Form.Label>
                                            <div className="input-group-custom">
                                                <FiLock className="input-icon" />
                                                <input 
                                                    ref={refPassword} 
                                                    type={showPassword ? "text" : "password"} 
                                                    className="form-control input-custom" 
                                                    placeholder="••••••••"
                                                    onKeyPress={handleKeyPress}
                                                    disabled={loading}
                                                />
                                                <button
                                                    type="button"
                                                    className="password-toggle"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    {showPassword ? <FiEyeOff /> : <FiEye />}
                                                </button>
                                            </div>
                                            <small className="form-text text-muted">
                                                Password must be at least 6 characters
                                            </small>
                                        </Form.Group>
                                    </Form>

                                    <Button 
                                        className="btn-signup w-100 mt-4"
                                        onClick={handleSignUp}
                                        disabled={loading}
                                    >
                                        {loading ? "Creating Account..." : "Create Account"}
                                    </Button>

                                    <div className="auth-divider">
                                        <span>Already have an account?</span>
                                    </div>

                                    <Button 
                                        className="btn-login w-100"
                                        onClick={() => navigate("/login")}
                                        disabled={loading}
                                    >
                                        Sign In
                                    </Button>
                                </Card.Body>
                            </Card>
                        </div>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}
