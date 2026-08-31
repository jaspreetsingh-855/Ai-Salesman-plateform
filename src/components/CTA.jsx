import { Link } from "react-router-dom";
import "./CTA.css";

function CTA() {
  return (

    <section className="cta">

      <div className="cta-container">

        <h2>
          Ready to Build Your
          <span> AI-Powered Sales Team?</span>
        </h2>

        <p>
          Start automating your sales process today.
        </p>

        <Link to="/signup" className="cta-button">
          Get Started Free →
        </Link>

      </div>

    </section>

  );
}

export default CTA;