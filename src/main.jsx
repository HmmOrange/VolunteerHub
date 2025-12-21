import React from "react";
import ReactDOM from "react-dom/client";
import AppRoutes from "./routes/AppRoutes";
import { ToastProvider } from "./context/ToastContext";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import { viVN } from "@mui/material/locale";
import "./index.css";

const theme = createTheme({
  palette: {
    mode: "light", // or "dark" TEST
    primary: { main: "#4169e1" },
    secondary: { main: "#b50bd3" },
    background: {
      default: "#f1f4f7",
      paper: "#ffffff"
    }
  },
  typography: {
    fontFamily: "Roboto, sans-serif",
  },
  viVN
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </ThemeProvider>
  </React.StrictMode>
);
