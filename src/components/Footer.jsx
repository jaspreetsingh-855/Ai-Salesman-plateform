import "./Footer.css";

function Footer() {
  return (

    <footer className="footer">

      <div className="footer-container">

        <div className="footer-brand">

          <h3>
            🤖 AI <span>SALESMAN</span>
          </h3>

          <p>
            Your AI-powered sales assistant
            for modern sales teams.
          </p>

        </div>


        <div className="footer-links">

          <div>
            <h4>Product</h4>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#solutions">Solutions</a>
          </div>

          <div>
            <h4>Company</h4>
            <a href="#">About</a>
            <a href="#">Contact</a>
            <a href="#">Careers</a>
          </div>

          <div>
            <h4>Resources</h4>
            <a href="#">Documentation</a>
            <a href="#">Blog</a>
            <a href="#">Help Center</a>
          </div>

        </div>

      </div>


      <div className="footer-bottom">

        © 2026 AI Salesman. All rights reserved.

      </div>

    </footer>

  );
}

export default Footer;