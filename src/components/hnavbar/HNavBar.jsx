import { useNavigate } from "react-router-dom";
import "./HNavbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username");
  const role = localStorage.getItem("role");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    
    <nav className="navbar">
      <button onClick={() => console.log(`Role: ${localStorage.getItem("role")}`)} className="nav-btn">
      hi
      </button>
      <div className="nav-left" onClick={() => navigate("/dashboard")}>
        VolunteerHub
      </div>
      <div className="nav-right">
        {username ? (
          <>
            {role === "manager" && (
              <button
                onClick={() => navigate("/event/create")}
                className="nav-btn"
              >
                Create Event
              </button>
            )}
            <span className="nav-user">Hi, {username}</span>
            <button onClick={handleLogout} className="nav-btn logout">
              Logout
            </button>
          </>
        ) : (
          <button onClick={() => navigate("/login")} className="nav-btn">
            Login
          </button>
        )}
      </div>
    </nav>
  );
}
