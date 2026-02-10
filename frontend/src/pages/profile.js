import { Card, Form, Button, Container, Row, Col, Alert, Spinner } from 'react-bootstrap'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import MyNavbar from '../components/mynavbar'
import authFetch from './authFetch.js'
import { FiUser, FiMail, FiAlertTriangle, FiLogOut } from 'react-icons/fi'
import '../styles/profile.css'

const ALLERGEN_OPTIONS = ['Peanuts', 'Milk', 'Gluten', 'Soy', 'Eggs', 'Cashew nuts', 'Almonds']

export default function Profile() {
    const navigate = useNavigate()
    const [user, setUser] = useState({ name: "", email: "" })
    const [allergens, setAllergens] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [successMessage, setSuccessMessage] = useState("")
    const [errorMessage, setErrorMessage] = useState("")
    const isFirstRun = useRef(true)
    const previousAllergens = useRef([])

    async function getUserInfo() {
        setLoading(true);
        try {
            const res = await authFetch('/user/info')
            const data = await res.json()
            setUser({ name: data.name, email: data.email })
            setAllergens(data.allergens || [])
        } catch (err) {
            setErrorMessage("Failed to load profile information")
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { getUserInfo(); }, [])

    async function updateAllergens() {
        if (
            JSON.stringify(previousAllergens.current.sort()) === JSON.stringify(allergens.sort())
        ) return

        previousAllergens.current = allergens
        setSaving(true);
        setErrorMessage("");
        setSuccessMessage("");

        try {
            await authFetch('/update_allergens', {
                method: 'POST',
                body: JSON.stringify({ Allergens: allergens })
            })
            setSuccessMessage("Allergens updated successfully!")
            setTimeout(() => setSuccessMessage(""), 3000)
        } catch (err) {
            setErrorMessage("Failed to update allergens")
        } finally {
            setSaving(false);
        }
    }

    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false
            return
        }
        updateAllergens()
    }, [allergens])

    function handleAddAllergen(item) {
        if (!allergens.includes(item)) {
            setAllergens([...allergens, item])
        }
    }

    function handleRemoveAllergen(item) {
        setAllergens(allergens.filter(a => a !== item))
    }

    function handleLogout() {
        localStorage.removeItem("token")
        navigate("/login")
    }

    if (loading) {
        return (
            <div className="profile-container">
                <MyNavbar />
                <Container className="profile-content d-flex align-items-center justify-content-center">
                    <Spinner animation="border" variant="primary" />
                </Container>
            </div>
        )
    }

    return (
        <div className="profile-container">
            <MyNavbar />

            <Container className="profile-content">
                <div className="profile-header">
                    <h1 className="profile-title">My Profile</h1>
                    <p className="profile-subtitle">Manage your account and allergens</p>
                </div>

                {/* Error and Success Messages */}
                {errorMessage && (
                    <Alert variant="danger" dismissible onClose={() => setErrorMessage("")}>
                        {errorMessage}
                    </Alert>
                )}
                {successMessage && (
                    <Alert variant="success" dismissible onClose={() => setSuccessMessage("")}>
                        {successMessage}
                    </Alert>
                )}

                <Row className="g-4">
                    {/* User Information Card */}
                    <Col lg={6}>
                        <Card className="profile-card">
                            <Card.Header className="profile-card-header">
                                <FiUser className="card-icon" />
                                <Card.Title className="mb-0">Account Information</Card.Title>
                            </Card.Header>
                            <Card.Body>
                                <div className="info-item">
                                    <label className="info-label">Full Name</label>
                                    <div className="info-value">
                                        <FiUser className="info-icon" />
                                        <span>{user.name}</span>
                                    </div>
                                </div>

                                <div className="info-item">
                                    <label className="info-label">Email Address</label>
                                    <div className="info-value">
                                        <FiMail className="info-icon" />
                                        <span>{user.email}</span>
                                    </div>
                                </div>

                                <Button
                                    className="btn-logout w-100 mt-4"
                                    onClick={handleLogout}
                                >
                                    <FiLogOut className="me-2" />
                                    Sign Out
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Allergens Management Card */}
                    <Col lg={6}>
                        <Card className="profile-card">
                            <Card.Header className="profile-card-header">
                                <FiAlertTriangle className="card-icon" />
                                <Card.Title className="mb-0">My Allergens</Card.Title>
                            </Card.Header>
                            <Card.Body>
                                <p className="allergens-subtitle">
                                    Select the allergens you want to track. Products containing these will be marked as unsafe.
                                </p>

                                <div className="allergens-grid">
                                    {ALLERGEN_OPTIONS.map(item => (
                                        <button
                                            key={item}
                                            className={`allergen-chip ${allergens.includes(item) ? 'selected' : ''}`}
                                            onClick={() => {
                                                if (allergens.includes(item)) {
                                                    handleRemoveAllergen(item)
                                                } else {
                                                    handleAddAllergen(item)
                                                }
                                            }}
                                            disabled={saving}
                                        >
                                            {allergens.includes(item) && <span className="chip-check">✓</span>}
                                            <span className="chip-text">{item}</span>
                                        </button>
                                    ))}
                                </div>

                                <div className="allergens-count">
                                    {allergens.length === 0 ? (
                                        <span className="text-muted">No allergens selected</span>
                                    ) : (
                                        <span><strong>{allergens.length}</strong> allergen{allergens.length !== 1 ? 's' : ''} selected</span>
                                    )}
                                </div>

                                {allergens.length > 0 && (
                                    <div className="selected-allergens">
                                        <p className="selected-label">Selected:</p>
                                        <div className="allergen-tags">
                                            {allergens.map(item => (
                                                <div key={item} className="allergen-tag">
                                                    {item}
                                                    <button
                                                        className="tag-remove"
                                                        onClick={() => handleRemoveAllergen(item)}
                                                        disabled={saving}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}
