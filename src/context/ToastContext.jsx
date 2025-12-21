import React, { createContext, useContext, useState, useCallback } from "react";
import { Snackbar, Alert } from "@mui/material";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, severity = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, severity }]);
  }, []);

  const handleClose = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.map((t) => (
        <Snackbar
          key={t.id}
          open
          autoHideDuration={4000}
          onClose={() => handleClose(t.id)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          sx={{ mb: 1 }}
        >
          <Alert
            onClose={() => handleClose(t.id)}
            severity={t.severity}
            variant="filled"
            sx={{ width: "100%" }}
          >
            {t.message}
          </Alert>
        </Snackbar>
      ))}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

export default ToastContext;
