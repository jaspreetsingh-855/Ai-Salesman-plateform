import { Link } from "react-router-dom";
import "./Hero.css";

function Hero() {
  return (
    <section className="hero">

      <div className="hero-container">

        {/* LEFT SIDE */}

        <div className="hero-content">

          <div className="hero-badge">
            ✦ AI-Powered Sales Automation Platform
          </div>

          <h1>
            Your AI Salesman
            <br />

            That Closes More Deals,
            <br />

            While You
            <span> Focus on Growth</span>
          </h1>

          <p>
            AI Salesman engages leads, follows up automatically,
            qualifies prospects and books meetings on autopilot —
            so your team can focus on closing.
          </p>

          <div className="hero-buttons">

            <Link to="/signup" className="primary-btn">
              Start Free Trial →
            </Link>

            <button className="secondary-btn">
              Book a Demo
            </button>

          </div>

          <div className="hero-benefits">

            <div>
              ✓ No Credit Card Required
            </div>

            <div>
              ✓ Setup in 2 Minutes
            </div>

            <div>
              ✓ 7-Day Free Trial
            </div>

          </div>

        </div>


        {/* RIGHT SIDE */}

        <div className="dashboard-preview">

          <div className="dashboard-header">
            <h3>Dashboard</h3>

            <div className="user">
              👤 John Doe
            </div>
          </div>


          {/* Stats */}

          <div className="stats-grid">

            <div className="stat-card">
              <small>Total Leads</small>
              <h3>12,842</h3>
              <span>↗ 16.2%</span>
            </div>

            <div className="stat-card">
              <small>Conversations</small>
              <h3>8,456</h3>
              <span>↗ 24.8%</span>
            </div>

            <div className="stat-card">
              <small>Meetings</small>
              <h3>512</h3>
              <span>↗ 18.7%</span>
            </div>

            <div className="stat-card">
              <small>Deals Closed</small>
              <h3>205</h3>
              <span>↗ 22.4%</span>
            </div>

          </div>


          {/* Chart */}

          <div className="chart-card">

            <div className="chart-title">
              <strong>Sales Performance</strong>

              <button>This Month ▾</button>
            </div>

            <div className="fake-chart">

              <div className="chart-line"></div>

            </div>

          </div>


          {/* AI Assistant */}

          <div className="ai-message">

            <div className="ai-icon">
              🤖
            </div>

            <div>

              <strong>AI Salesman</strong>

              <p>
                I've found 32 new leads that match
                your ideal customer profile.
              </p>

              <button>
                View Leads
              </button>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}

export default Hero;