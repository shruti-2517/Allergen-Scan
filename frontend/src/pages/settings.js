import { Container, Row, Col, Card, Form, Button, Alert, Toggle } from 'react-bootstrap'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import MyNavbar from '../components/mynavbar'
import { FiSettings, FiBell, FiLock, FiTrash2, FiArrowLeft } from 'react-icons/fi'
import '../styles/settings.css'

export default function Settings() {
    const navigate = useNavigate()
    const [settings, setSettings] = useState({
        notifications: true,
        emailAlerts: false,
        darkMode: false,
        language: 'en'
    })
    const [saved, setSaved] = useState(false)
    const [showDeleteWarning, setShowDeleteWarning] = useState(false)

    useEffect(() => {
        // Load saved settings from localStorage
        const savedSettings = localStorage.getItem('appSettings')
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings))
        }
    }, [])

    const handleSettingChange = (key, value) => {
        const newSettings = { ...settings, [key]: value }
        setSettings(newSettings)
        localStorage.setItem('appSettings', JSON.stringify(newSettings))
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
    }

    const handleDeleteAccount = () => {
        // Implement account deletion logic
        sessionStorage.removeItem("accessToken")
        navigate("/login")
    }

    return (
        <div className="settings-container">
            <MyNavbar />

            <Container className="settings-content">
                {/* Header */}
                <div className="settings-header">
                    <div className="header-title">
                        <button 
                            className="back-btn"
                            onClick={() => navigate("/home")}
                            title="Back to home"
                        >
                            <FiArrowLeft />
                        </button>
                        <div>
                            <h1 className="settings-title">Settings</h1>
                            <p className="settings-subtitle">Manage your preferences</p>
                        </div>
                    </div>
                </div>

                {saved && (
                    <Alert variant="success" className="saved-alert">
                        Settings saved successfully!
                    </Alert>
                )}

                <Row className="g-4">
                    {/* Notification Settings */}
                    <Col lg={6}>
                        <Card className="settings-card">
                            <Card.Header className="settings-card-header">
                                <FiBell className="card-icon" />
                                <Card.Title className="mb-0">Notifications</Card.Title>
                            </Card.Header>
                            <Card.Body>
                                <div className="settings-item">
                                    <div className="setting-info">
                                        <p className="setting-label">Push Notifications</p>
                                        <p className="setting-description">Receive notifications about allergen alerts</p>
                                    </div>
                                    <Form.Check
                                        type="switch"
                                        checked={settings.notifications}
                                        onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                                        className="setting-toggle"
                                    />
                                </div>

                                <hr className="settings-divider" />

                                <div className="settings-item">
                                    <div className="setting-info">
                                        <p className="setting-label">Email Alerts</p>
                                        <p className="setting-description">Get email notifications for important updates</p>
                                    </div>
                                    <Form.Check
                                        type="switch"
                                        checked={settings.emailAlerts}
                                        onChange={(e) => handleSettingChange('emailAlerts', e.target.checked)}
                                        className="setting-toggle"
                                    />
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Display Settings */}
                    <Col lg={6}>
                        <Card className="settings-card">
                            <Card.Header className="settings-card-header">
                                <FiSettings className="card-icon" />
                                <Card.Title className="mb-0">Display</Card.Title>
                            </Card.Header>
                            <Card.Body>
                                <div className="settings-item">
                                    <div className="setting-info">
                                        <p className="setting-label">Dark Mode</p>
                                        <p className="setting-description">Use dark theme for the app (coming soon)</p>
                                    </div>
                                    <Form.Check
                                        type="switch"
                                        checked={settings.darkMode}
                                        onChange={(e) => handleSettingChange('darkMode', e.target.checked)}
                                        disabled
                                        className="setting-toggle"
                                    />
                                </div>

                                <hr className="settings-divider" />

                                <div className="settings-item">
                                    <div className="setting-info">
                                        <p className="setting-label">Language</p>
                                        <p className="setting-description">Choose your preferred language</p>
                                    </div>
                                    <Form.Select
                                        value={settings.language}
                                        onChange={(e) => handleSettingChange('language', e.target.value)}
                                        className="language-select"
                                    >
                                        <option value="en">English</option>
                                        <option value="es">Español</option>
                                        <option value="fr">Français</option>
                                        <option value="de">Deutsch</option>
                                    </Form.Select>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Privacy & Security */}
                <Card className="settings-card mt-4">
                    <Card.Header className="settings-card-header">
                        <FiLock className="card-icon" />
                        <Card.Title className="mb-0">Privacy & Security</Card.Title>
                    </Card.Header>
                    <Card.Body>
                        <div className="security-section">
                            <h5 className="section-title">Password Security</h5>
                            <p className="section-description">
                                Change your password regularly to keep your account secure
                            </p>
                            <Button className="btn-change-password" disabled>
                                Change Password (Coming Soon)
                            </Button>
                        </div>

                        <hr className="settings-divider" />

                        <div className="security-section">
                            <h5 className="section-title">Account Visibility</h5>
                            <p className="section-description">
                                Control who can see your profile and scan history
                            </p>
                            <div className="visibility-options">
                                <Form.Check
                                    type="radio"
                                    label="Private (Only you)"
                                    name="visibility"
                                    id="visibility-private"
                                    defaultChecked
                                    className="visibility-option"
                                />
                                <Form.Check
                                    type="radio"
                                    label="Public"
                                    name="visibility"
                                    id="visibility-public"
                                    className="visibility-option"
                                />
                            </div>
                        </div>
                    </Card.Body>
                </Card>

                {/* Danger Zone */}
                <Card className="settings-card danger-card mt-4">
                    <Card.Header className="settings-card-header danger-header">
                        <FiTrash2 className="card-icon" />
                        <Card.Title className="mb-0">Danger Zone</Card.Title>
                    </Card.Header>
                    <Card.Body>
                        <div className="danger-section">
                            <h5 className="section-title">Delete Account</h5>
                            <p className="section-description">
                                Permanently delete your account and all associated data. This action cannot be undone.
                            </p>
                            <Button
                                className="btn-delete-account"
                                onClick={() => setShowDeleteWarning(true)}
                            >
                                Delete My Account
                            </Button>
                        </div>
                    </Card.Body>
                </Card>

                {/* Delete Warning Modal */}
                {showDeleteWarning && (
                    <div className="delete-warning-overlay">
                        <div className="delete-warning-card">
                            <h3 className="warning-title">Are you sure?</h3>
                            <p className="warning-message">
                                Deleting your account will permanently remove all your data, including scan history and allergen preferences. This action cannot be undone.
                            </p>
                            <div className="warning-actions">
                                <Button
                                    className="btn-cancel"
                                    onClick={() => setShowDeleteWarning(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="btn-delete-confirm"
                                    onClick={handleDeleteAccount}
                                >
                                    Yes, Delete My Account
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </Container>
        </div>
    )
}
