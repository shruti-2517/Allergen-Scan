import { Navbar, Container, Button, Offcanvas } from "react-bootstrap";
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { useState } from 'react';
import { FiMenu, FiSettings } from 'react-icons/fi';
import './navbar.css';

export default function MyNavbar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [showMenu, setShowMenu] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const hideAuthButton = location.pathname === '/login' || location.pathname === '/signup';
    const isLoggedIn = !!localStorage.getItem("token");

    const handleNavClick = (path) => {
        navigate(path);
        setShowMenu(false);
        setShowSettings(false);
    };

    return (
        <Navbar className="navbar-custom" sticky="top">
            <Container fluid className="px-3 py-3">
                <Navbar.Brand 
                    className="navbar-brand-custom" 
                    onClick={() => navigate("/home")}
                    style={{ cursor: 'pointer' }}
                >
                    <span className="brand-text">AllergenAware</span>
                </Navbar.Brand>

                {/* Desktop Navigation */}
                <div className="d-none d-lg-flex align-items-center gap-4">
                    <button 
                        className="nav-link-custom"
                        onClick={() => handleNavClick("/analyze")}
                    >
                        Analyze
                    </button>
                    <button 
                        className="nav-link-custom"
                        onClick={() => handleNavClick("/history")}
                    >
                        History
                    </button>
                    {isLoggedIn && (
                        <button 
                            className="nav-link-custom"
                            onClick={() => handleNavClick("/dashboard")}
                        >
                            Dashboard
                        </button>
                    )}
                    {!isLoggedIn && !hideAuthButton && (
                        <Button 
                            className="btn-sign-in"
                            onClick={() => navigate("/login")}
                        >
                            Sign In
                        </Button>
                    )}
                    {isLoggedIn && (
                        <div className="desktop-profile-menu">
                            <button 
                                className="profile-btn"
                                onClick={() => setShowSettings(!showSettings)}
                                title="Profile & Settings"
                            >
                                <i className="bi bi-person-circle"></i>
                            </button>
                            {showSettings && (
                                <div className="profile-dropdown">
                                    <button
                                        className="dropdown-item"
                                        onClick={() => handleNavClick("/profile")}
                                    >
                                        👤 Profile
                                    </button>
                                    <button
                                        className="dropdown-item"
                                        onClick={() => handleNavClick("/settings")}
                                    >
                                        ⚙️ Settings
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button 
                    className="menu-toggle d-lg-none"
                    onClick={() => setShowMenu(true)}
                >
                    <FiMenu size={24} />
                </button>

                {/* Mobile Offcanvas Menu */}
                <Offcanvas 
                    show={showMenu} 
                    onHide={() => setShowMenu(false)}
                    placement="end"
                    className="mobile-menu"
                >
                    <Offcanvas.Header closeButton className="offcanvas-header">
                        <Offcanvas.Title>Menu</Offcanvas.Title>
                    </Offcanvas.Header>
                    <Offcanvas.Body className="offcanvas-body">
                        <div className="mobile-nav-items">
                            <button 
                                className="mobile-nav-item"
                                onClick={() => handleNavClick("/analyze")}
                            >
                                Analyze Ingredients
                            </button>
                            <button 
                                className="mobile-nav-item"
                                onClick={() => handleNavClick("/history")}
                            >
                                History
                            </button>
                            {isLoggedIn && (
                                <button 
                                    className="mobile-nav-item"
                                    onClick={() => handleNavClick("/dashboard")}
                                >
                                    Dashboard
                                </button>
                            )}
                            {isLoggedIn && (
                                <button 
                                    className="mobile-nav-item"
                                    onClick={() => handleNavClick("/profile")}
                                >
                                    Profile
                                </button>
                            )}
                            {isLoggedIn && (
                                <button 
                                    className="mobile-nav-item"
                                    onClick={() => handleNavClick("/settings")}
                                >
                                    Settings
                                </button>
                            )}
                            {!isLoggedIn && !hideAuthButton && (
                                <button 
                                    className="mobile-nav-item btn-mobile-signin"
                                    onClick={() => handleNavClick("/login")}
                                >
                                    Sign In / Sign Up
                                </button>
                            )}
                        </div>
                    </Offcanvas.Body>
                </Offcanvas>
            </Container>
        </Navbar>
    );
}