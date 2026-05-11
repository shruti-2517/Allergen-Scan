import { Navbar, Container, Button } from "react-bootstrap";
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { FiMenu, FiX } from 'react-icons/fi';
import './navbar.css';

export default function MyNavbar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [showMenu, setShowMenu] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const menuRef = useRef(null);
    const hideAuthButton = location.pathname === '/login' || location.pathname === '/signup';
    const isLoggedIn = !!localStorage.getItem("token");

    // Close menu on route change
    useEffect(() => { setShowMenu(false); }, [location.pathname]);

    // Close settings dropdown on outside click
    useEffect(() => {
        function handleClick(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowSettings(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <>
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
                        <Link className="nav-link-custom" to="/analyze">Analyze</Link>
                        <Link className="nav-link-custom" to="/history">History</Link>
                        {isLoggedIn && <Link className="nav-link-custom" to="/dashboard">Dashboard</Link>}
                        {!isLoggedIn && !hideAuthButton && (
                            <Button className="btn-sign-in" onClick={() => navigate("/login")}>Sign In</Button>
                        )}
                        {isLoggedIn && (
                            <div className="desktop-profile-menu" ref={menuRef}>
                                <button
                                    className="profile-btn"
                                    onClick={() => setShowSettings(v => !v)}
                                >
                                    <i className="bi bi-person-circle"></i>
                                </button>
                                {showSettings && (
                                    <div className="profile-dropdown">
                                        <Link className="dropdown-item" to="/profile" onClick={() => setShowSettings(false)}>👤 Profile</Link>
                                        <Link className="dropdown-item" to="/settings" onClick={() => setShowSettings(false)}>⚙️ Settings</Link>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="menu-toggle d-lg-none"
                        onClick={() => setShowMenu(v => !v)}
                        aria-label="Toggle menu"
                    >
                        {showMenu ? <FiX size={24} /> : <FiMenu size={24} />}
                    </button>
                </Container>
            </Navbar>

            {/* Mobile drawer — plain HTML, no Bootstrap Offcanvas */}
            {showMenu && (
                <div className="mobile-backdrop" onClick={() => setShowMenu(false)} />
            )}
            <div className={`mobile-drawer ${showMenu ? 'open' : ''}`}>
                <div className="drawer-header">
                    <span className="drawer-title">AllergenAware</span>
                    <button className="drawer-close" onClick={() => setShowMenu(false)} aria-label="Close menu">
                        <FiX size={20} />
                    </button>
                </div>

                <div className="drawer-section-label">Navigation</div>
                <div className="mobile-nav-items">
                    <Link className="mobile-nav-item" to="/home">Home</Link>
                    <Link className="mobile-nav-item" to="/analyze">Analyze Ingredients</Link>
                    <Link className="mobile-nav-item" to="/history">History</Link>
                    {isLoggedIn && <Link className="mobile-nav-item" to="/dashboard">Dashboard</Link>}
                </div>

                {isLoggedIn && (
                    <>
                        <div className="drawer-divider" />
                        <div className="drawer-section-label">Account</div>
                        <div className="mobile-nav-items">
                            <Link className="mobile-nav-item" to="/profile">Profile</Link>
                            <Link className="mobile-nav-item" to="/settings">Settings</Link>
                        </div>
                    </>
                )}

                {!isLoggedIn && !hideAuthButton && (
                    <>
                        <div className="drawer-divider" />
                        <div className="mobile-nav-items">
                            <Link className="mobile-nav-item btn-mobile-signin" to="/login">Sign In / Sign Up</Link>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
