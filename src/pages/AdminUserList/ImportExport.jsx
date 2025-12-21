import { useState } from "react";
import { useToast } from "../../context/ToastContext";
import {
  Box,
  Button,
  Stack,
  Typography,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Divider,
} from "@mui/material";

/* ================= CONFIG ================= */

const API_URL = "http://localhost:5000/api/users";

/* ================= HELPERS ================= */

const downloadFile = (content, filename, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const usersToCSV = (users) => {
  const headers = [
    "username",
    "email",
    "password",
    "fullName",
    "dateOfBirth",
    "address",
    "avatar",
    "role",
    "isLocked",
    "isEmailVerified",
  ];

  const rows = users.map((u) =>
    [
      u.username || "",
      u.email || "",
      "", // never export passwords
      u.fullName || "",
      u.dateOfBirth || "",
      u.address || "",
      u.avatar || "",
      u.role || "volunteer",
      u.isLocked ?? false,
      u.isEmailVerified ?? false,
    ].join(",")
  );

  return [headers.join(","), ...rows].join("\n");
};

/* ================= COMPONENT ================= */

export default function ImportExport({ users, onImported, showExport = true }) {
  const [file, setFile] = useState(null);
  const [exportType, setExportType] = useState("csv");
  const { showToast } = useToast();

  /* ================= EXPORT ================= */

  const handleExport = () => {
    if (!users || users.length === 0) {
      showToast("Không có user để export.", "info");
      return;
    }

    if (exportType === "json") {
      downloadFile(
        JSON.stringify(users, null, 2),
        "users.json",
        "application/json"
      );
    } else {
      downloadFile(usersToCSV(users), "users.csv", "text/csv");
    }
  };

  /* ================= IMPORT ================= */

  const handleImport = async () => {
    if (!file) {
      showToast("Vui lòng chọn file CSV hoặc JSON.", "warning");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      showToast("Bạn chưa đăng nhập.", "warning");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/import`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Import thất bại");
      }

      showToast("Import thành công.", "success");
      setFile(null);
      onImported && onImported();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  /* ================= TEMPLATES ================= */

  const downloadTemplate = (type) => {
    if (type === "json") {
      downloadFile(
        JSON.stringify(
          [
            {
              username: "manager01",
              email: "manager01@email.com",
              password: "123456",
              fullName: "Nguyen Van A",
              dateOfBirth: "1995-01-01",
              address: "Hanoi",
              avatar: "",
              role: "manager",
              isLocked: false,
              isEmailVerified: false,
            },
          ],
          null,
          2
        ),
        "users_template.json",
        "application/json"
      );
    } else {
      downloadFile(
        "username,email,password,fullName,dateOfBirth,address,avatar,role,isLocked,isEmailVerified\nmanager01,manager01@email.com,123456,Nguyen Van A,1995-01-01,Hanoi,,manager,false,false",
        "users_template.csv",
        "text/csv"
      );
    }
  };

  /* ================= UI ================= */

  return (
    <Box sx={{ p: 3, border: "1px dashed #ccc", borderRadius: 2, bgcolor: 'background.paper', height: '100%' }}>
      {/* ================= EXPORT SECTION ================= */}
      {showExport && (
        <>
          <Typography variant="h6" mb={2}>
            Xuất người dùng
          </Typography>

          <Stack direction="row" spacing={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Định dạng</InputLabel>
              <Select
                value={exportType}
                label="Định dạng"
                onChange={(e) => setExportType(e.target.value)}
              >
                <MenuItem value="csv">CSV</MenuItem>
                <MenuItem value="json">JSON</MenuItem>
              </Select>
            </FormControl>

            <Button
              // variant="contained"
              onClick={handleExport}
              sx={{
                backgroundColor: "#49BBBD",
                color: "white",
                "&:hover": {
                  backgroundColor: "#3fa6a8",
                },
              }}
            >
              Xuất
            </Button>

          </Stack>

          <Divider sx={{ my: 3 }} />
        </>
      )}

      {/* ================= IMPORT SECTION ================= */}
      <Typography variant="h6" mb={2}>
        Nhập người dùng
      </Typography>

      <Stack spacing={2}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Button variant="outlined" component="label">
            Chọn file
            <input
              type="file"
              hidden
              accept=".csv,.json"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </Button>

          <Typography variant="body2">
            {file ? file.name : "Chưa chọn file"}
          </Typography>

          <Button
            variant="contained"
            onClick={handleImport}
            sx={{
              backgroundColor: "#49BBBD",
              color: "white",
              "&:hover": {
                backgroundColor: "#3fa6a8",
              },
            }}
          >
            Nhập
          </Button>

        </Stack>

        {/* ===== TEMPLATES ===== */}
        <Stack direction="row" spacing={2}>
          <Button size="small" onClick={() => downloadTemplate("csv")}>
            Tải CSV mẫu
          </Button>
          <Button size="small" onClick={() => downloadTemplate("json")}>
            Tải JSON mẫu
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
