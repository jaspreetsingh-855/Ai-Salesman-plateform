import "./Features.css";

function Features() {

  const features = [
    {
      icon: "🤖",
      title: "AI Lead Engagement",
      text: "AI Salesman engages your leads automatically across multiple channels."
    },
    {
      icon: "🔄",
      title: "Smart Follow-ups",
      text: "Automatically follow up with prospects at the right time."
    },
    {
      icon: "🎯",
      title: "Lead Qualification",
      text: "AI identifies and scores leads based on buying intent."
    },
    {
      icon: "📅",
      title: "Meeting Booking",
      text: "Book meetings automatically based on your team's availability."
    },
    {
      icon: "📊",
      title: "Analytics & Insights",
      text: "Track sales performance, conversions and revenue in real time."
    },
    {
      icon: "👥",
      title: "Team Collaboration",
      text: "Help admins and sales representatives work together efficiently."
    }
  ];

  return (

    <section className="features" id="features">

      <div className="features-container">

        <div className="section-heading">

          <div className="section-badge">
            ✦ Powerful Features
          </div>

          <h2>
            Everything You Need to
            <span> Scale Your Sales</span>
          </h2>

          <p>
            AI Salesman handles the busy work so your
            sales team can focus on building relationships
            and closing deals.
          </p>

        </div>


        <div className="features-grid">

          {features.map((feature, index) => (

            <div className="feature-card" key={index}>

              <div className="feature-icon">
                {feature.icon}
              </div>

              <h3>
                {feature.title}
              </h3>

              <p>
                {feature.text}
              </p>

            </div>

          ))}

        </div>

      </div>

    </section>

  );
}

export default Features;