import { Navbar, Container, Button } from "react-bootstrap";
import { useNavigate } from 'react-router-dom';

export default function MyNavbar() {

    const navigate = useNavigate()

    return (
        <Navbar className="px-3" style={{ backgroundColor: '#d6b2d6' }}>
            <Container fluid className="justify-content-between align-items-center">
                <Navbar.Brand className="fw-bold fs-5">Allergenic</Navbar.Brand>
                <div className="d-flex align-items-center gap-3">
                    <a className="nav-link text-dark" onClick={() => { navigate("/history")}}>History</a>
                    {!localStorage.getItem("token") && <Button variant="outline-dark" size="sm">Sign In/Up</Button> }
                    <i className="bi bi-person-circle fs-1 ms-1" onClick={() => { navigate("/profile")}}></i>
                </div>
            </Container>
        </Navbar>
    )
}