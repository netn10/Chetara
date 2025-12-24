import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <Link to="/" className="logo">♔ Chess Magic ♟</Link>
        <ul className="nav-links">
          <li>
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
              Home
            </Link>
          </li>
          <li>
            <Link to="/about" className={location.pathname === '/about' ? 'active' : ''}>
              About
            </Link>
          </li>
          <li>
            <Link to="/rules" className={location.pathname === '/rules' ? 'active' : ''}>
              Rules
            </Link>
          </li>
          <li>
            <Link to="/cards" className={location.pathname === '/cards' ? 'active' : ''}>
              Cards
            </Link>
          </li>
          <li>
            <Link to="/play" className={location.pathname === '/play' ? 'active' : ''}>
              Play
            </Link>
          </li>
          {isAdmin && (
            <li>
              <Link to="/add-card" className={location.pathname === '/add-card' ? 'active' : ''}>
                Add Card
              </Link>
            </li>
          )}
          {user ? (
            <li>
              <button onClick={handleLogout} className="logout-btn">
                Logout ({user.username})
              </button>
            </li>
          ) : (
            <li>
              <Link to="/login" className={location.pathname === '/login' ? 'active' : ''}>
                Login
              </Link>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
