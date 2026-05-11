import { Container, Row, Col, Card, Spinner, Alert } from 'react-bootstrap'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import MyNavbar from '../components/mynavbar'
import authFetch from './authFetch.js'
import { FiBarChart2, FiCheckCircle, FiAlertCircle, FiTrendingUp } from 'react-icons/fi'
import '../styles/dashboard.css'

export default function Dashboard() {
    const navigate = useNavigate()
    const [stats, setStats] = useState({
        totalScans: 0,
        safeProducts: 0,
        unsafeProducts: 0,
        topAllergens: []
    })
    const [loading, setLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState("")

    useEffect(() => {
        async function fetchStats() {
            setLoading(true);
            try {
                const res = await authFetch('/dashboard/stats')
                if (res.ok) {
                    const data = await res.json()
                    setStats(data)
                } else {
                    const err = await res.json().catch(() => ({}))
                    setErrorMessage(`Failed to load dashboard statistics (${res.status}: ${err.error || 'unknown'})`)
                }
            } catch (err) {
                setErrorMessage("Error loading dashboard")
            } finally {
                setLoading(false);
            }
        }
        fetchStats()
    }, [])

    if (loading) {
        return (
            <div className="dashboard-container">
                <MyNavbar />
                <Container className="dashboard-content d-flex align-items-center justify-content-center">
                    <Spinner animation="border" variant="primary" />
                </Container>
            </div>
        )
    }

    const safePercentage = stats.totalScans > 0
        ? Math.round((stats.safeProducts / stats.totalScans) * 100)
        : 0

    return (
        <div className="dashboard-container">
            <MyNavbar />

            <Container className="dashboard-content">
                {/* Header */}
                <div className="dashboard-header">
                    <h1 className="dashboard-title">Your Dashboard</h1>
                    <p className="dashboard-subtitle">Track your scanning activity and allergen insights</p>
                </div>

                {errorMessage && (
                    <Alert variant="danger" dismissible onClose={() => setErrorMessage("")}>
                        {errorMessage}
                    </Alert>
                )}

                {/* Stats Grid */}
                <Row className="g-3 mb-4">
                    {/* Total Scans Card */}
                    <Col xs={12} sm={6} lg={3}>
                        <Card className="stat-card">
                            <Card.Body>
                                <div className="stat-icon total">
                                    <FiBarChart2 />
                                </div>
                                <div className="stat-info">
                                    <p className="stat-label">Total Scans</p>
                                    <p className="stat-number">{stats.totalScans}</p>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Safe Products Card */}
                    <Col xs={12} sm={6} lg={3}>
                        <Card className="stat-card safe-stat">
                            <Card.Body>
                                <div className="stat-icon safe">
                                    <FiCheckCircle />
                                </div>
                                <div className="stat-info">
                                    <p className="stat-label">Safe Products</p>
                                    <p className="stat-number">{stats.safeProducts}</p>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Unsafe Products Card */}
                    <Col xs={12} sm={6} lg={3}>
                        <Card className="stat-card unsafe-stat">
                            <Card.Body>
                                <div className="stat-icon unsafe">
                                    <FiAlertCircle />
                                </div>
                                <div className="stat-info">
                                    <p className="stat-label">Unsafe Products</p>
                                    <p className="stat-number">{stats.unsafeProducts}</p>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Safety Rate Card */}
                    <Col xs={12} sm={6} lg={3}>
                        <Card className="stat-card trend-stat">
                            <Card.Body>
                                <div className="stat-icon trend">
                                    <FiTrendingUp />
                                </div>
                                <div className="stat-info">
                                    <p className="stat-label">Safety Rate</p>
                                    <p className="stat-number">{safePercentage}%</p>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Top Allergens */}
                <Row>
                    <Col>
                        <Card className="insights-card">
                            <Card.Header className="insights-header">
                                <Card.Title className="mb-0">Most Common Allergens</Card.Title>
                            </Card.Header>
                            <Card.Body>
                                {stats.topAllergens && stats.topAllergens.length > 0 ? (
                                    <div className="allergens-list">
                                        {stats.topAllergens.slice(0, 5).map((allergen, idx) => (
                                            <div key={idx} className="allergen-item">
                                                <div className="allergen-rank">{idx + 1}</div>
                                                <div className="allergen-details">
                                                    <p className="allergen-name">{allergen.name}</p>
                                                    <div className="allergen-progress">
                                                        <div
                                                            className="progress-bar-fill"
                                                            style={{
                                                                width: `${(allergen.count / (stats.topAllergens[0]?.count || 1)) * 100}%`
                                                            }}
                                                        ></div>
                                                    </div>
                                                </div>
                                                <p className="allergen-count">{allergen.count}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="no-data">
                                        <p>No allergen data yet. Start scanning products!</p>
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
