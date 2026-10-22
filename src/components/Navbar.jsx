import { Link } from "react-router-dom";
import { portalHome, useAuth } from "../context/AuthContext";
import "./Navbar.css";

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="logo">
          <div className="logo-icon">🤖</div>
          <span>
            AI <strong>SALESMAN</strong>
          </span>
        </Link>

        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#solutions">Solutions</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#pricing">Pricing</a>
          <a href="#resources">Resources</a>
        </div>

        <div className="nav-actions">
          {user ? (
            <>
              <span className="user-name">Hi, {user.name}</span>
              <Link to={portalHome(user.role)} className="signup-btn">
                Open Portal
              </Link>
              <button type="button" className="logout-btn" onClick={logout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="login-btn">Log in</Link>
              <Link to="/signup" className="signup-btn">Get Started Free →</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
