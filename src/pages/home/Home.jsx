import { useNavigate } from "react-router-dom";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <h1>Chào mừng đến với VolunteerHub :v</h1>
      <div className="button-group">
        <button onClick={() => navigate("/login")} className="btn btn-login">
          Login
        </button>
        <button onClick={() => navigate("/register")} className="btn btn-register">
          Register
        </button>
      </div>
    </div>
  );
}
