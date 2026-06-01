import { Card, Form, Button, Container, Row, Col, Alert } from 'react-bootstrap';
import { useRef, useState } from "react";
import { useNavigate } from 'react-router-dom';
import MyNavbar from '../components/mynavbar'
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import '../styles/auth.css';

export default function Login() {
    const refEmail = useRef();
    const refPassword = useRef();
    const [errorMessage, setErrorMessage] = useState();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate()

    // Handles login and sends a POST request to backend
    async function handleLogin() {
        const email = refEmail.current.value
        const password = refPassword.current.value

        if (!email || !password) {
            setErrorMessage("Please fill in all fields")
            return;
        }

        setLoading(true);
        setErrorMessage(null);

        try {
            const res = await fetch("/auth/login", {
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
                sessionStorage.setItem("accessToken", data.accessToken)
                navigate("/home");
            }
            else {
                setErrorMessage(data.error || "Login failed. Please try again.")
            }
        } catch (err) {
            setErrorMessage("Network error. Please try again.")
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleLogin();
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
                                <div className="auth-icon">🔐</div>
                                <h1 className="auth-title">Welcome Back</h1>
                                <p className="auth-subtitle">Sign in to your AllergenScan account</p>
                            </div>

                            <Card className="auth-card">
                                <Card.Body>
                                    {errorMessage && (
                                        <Alert variant="danger" dismissible onClose={() => setErrorMessage(null)}>
                                            {errorMessage}
                                        </Alert>
                                    )}

                                    <Form>
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
                                        </Form.Group>
                                    </Form>

                                    <Button 
                                        className="btn-login w-100 mt-4"
                                        onClick={handleLogin}
                                        disabled={loading}
                                    >
                                        {loading ? "Signing in..." : "Sign In"}
                                    </Button>

                                    <div className="auth-divider">
                                        <span>Don't have an account?</span>
                                    </div>

                                    <Button 
                                        className="btn-signup w-100"
                                        onClick={() => navigate("/signup")}
                                        disabled={loading}
                                    >
                                        Create Account
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
