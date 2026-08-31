
import { useState } from "react";
import "./Signup.css";
import { useNavigate } from "react-router-dom";

function Signup() {

  // Used to navigate to another page
  const navigate = useNavigate();

  // Object for storing form input data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: ""
  });

  // Object for storing data after clicking Create Account
  const [submittedData, setSubmittedData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: ""
  });

  // Handle all input changes
  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });

  };

  // Handle Create Account button
  const handleSubmit = (e) => {

    e.preventDefault();

    // Store the current form data
    setSubmittedData(formData);

    // Print object in console
    console.log(formData);
  };

  // Handle Login button
  const handleLogin = () => {

    navigate("/login");

  };

  return (
    <div className="signup-page">

      <form onSubmit={handleSubmit}>

        <h1>Signup Page</h1>


        {/* ================= NAME ================= */}

        <div>
          <label htmlFor="name">
            Name
          </label>

          <input
            id="name"
            name="name"
            type="text"
            placeholder="Enter your name"
            onChange={handleChange}
          />
        </div>


        {/* ================= EMAIL ================= */}

        <div>
          <label htmlFor="email">
            Email
          </label>

          <input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email"
            onChange={handleChange}
          />
        </div>


        {/* ================= PHONE ================= */}

        <div>
          <label htmlFor="phone">
            Phone
          </label>

          <input
            id="phone"
            name="phone"
            type="tel"
            placeholder="Enter your phone number"
            onChange={handleChange}
          />
        </div>


        {/* ================= PASSWORD ================= */}

        <div>
          <label htmlFor="password">
            Password
          </label>

          <input
            id="password"
            name="password"
            type="password"
            placeholder="Enter your password"
            onChange={handleChange}
          />
        </div>


        {/* ================= ROLE ================= */}

        <div>
          <label htmlFor="role">
            Role
          </label>

          <select
            id="role"
            name="role"
            defaultValue=""
            onChange={handleChange}
          >

            <option value="" disabled>
              Select your role
            </option>

            <option value="admin">
              Admin
            </option>

            <option value="manager">
              Manager
            </option>

            <option value="salesman">
              Salesman
            </option>

          </select>
        </div>


        {/* ================= CREATE ACCOUNT ================= */}

        <button type="submit">
          Create Account
        </button>


        {/* ================= LOGIN ================= */}

        <div className="login-section">

          <h5>
            Already have an account?
          </h5>

          <button
            type="button"
            onClick={handleLogin}
          >
            Login
          </button>

        </div>


        {/* ================= SUBMITTED DATA ================= */}

        {submittedData.name && (

          <div className="submitted-data">

            <h3>
              Submitted Data
            </h3>

            <p>
              Name: {submittedData.name}
            </p>

            <p>
              Email: {submittedData.email}
            </p>

            <p>
              Phone: {submittedData.phone}
            </p>

            <p>
              Password: {submittedData.password}
            </p>

            <p>
              Role: {submittedData.role}
            </p>

          </div>

        )}

      </form>

    </div>
  );
}

export default Signup;

