import { Link } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  return (
    <nav className="navbar">

      <div className="navbar-container">

        {/* Logo */}
        <Link to="/" className="logo">
          <div className="logo-icon">🤖</div>

          <span>
            AI <strong>SALESMAN</strong>
          </span>
        </Link>

        {/* Navigation */}
        <div className="nav-links">

          <a href="#features">Features</a>

          <a href="#solutions">Solutions</a>

          <a href="#how-it-works">How It Works</a>

          <a href="#pricing">Pricing</a>

          <a href="#resources">Resources</a>

        </div>

        {/* Buttons */}
        <div className="nav-actions">

          <Link to="/login" className="login-btn">
            Log in
          </Link>

          <Link to="/signup" className="signup-btn">
            Get Started Free →
          </Link>

        </div>

      </div>

    </nav>
  );
}

export default Navbar;