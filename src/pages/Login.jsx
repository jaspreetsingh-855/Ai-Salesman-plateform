
import "./Login.css";

function Login() {
  return (
    <div className="login-page">

      <form>
        <h1>Login Page</h1>

        {/* Email */}
        <div>
          <label htmlFor="email">Email</label>

          <input
            id="email"
            type="email"
            placeholder="Enter your email"
          />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password">Password</label>

          <input
            id="password"
            type="password"
            placeholder="Enter your password"
          />
        </div>

        <button type="submit">
          Login
        </button>

      </form>

    </div>
  );
}

export default Login;



