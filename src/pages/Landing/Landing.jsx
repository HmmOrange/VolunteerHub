import { useNavigate } from "react-router-dom";
import "./Landing.css";
import Button from "@mui/material/Button";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <h1>Chào mừng đến với VolunteerHub :v</h1>
      <div className="button-group">
        <Button onClick={() => navigate("/login")} variant="contained" color="primary" >
          Đăng nhập
        </Button>
        <Button onClick={() => navigate("/register")} variant="contained" color="secondary" >
          Đăng ký
        </Button>
      </div>
    </div>
  );
}
