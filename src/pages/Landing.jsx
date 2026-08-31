import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import CTA from "../components/CTA";
import Footer from "../components/Footer";

import "./Landing.css";

function Landing() {
  return (
    <div className="landing-page">

      <Navbar />

      <main>
        <Hero />

        <Features />

        <CTA />
      </main>

      <Footer />

    </div>
  );
}

export default Landing;