import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Box, 
  Container, 
  TextField, 
  Button, 
  Typography, 
  Card, 
  Alert,
  CircularProgress 
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "./AdminStyle.css";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const apiUrl = `http://${window.location.hostname}:3800/api/v1`;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(`${apiUrl}/auth/login`, {
        username,
        password,
      });

      if (response.data.token) {
        localStorage.setItem("adminToken", response.data.token);
        localStorage.setItem("adminRole", response.data.user.role);
        toast.success("Giriş başarılı!");
        navigate("/admin/dashboard");
      }
    } catch (err) {
      const message = err.response?.data?.message || "Giriş başarısız";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <Container maxWidth="sm" sx={{ display: "flex", alignItems: "center", minHeight: "100vh" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ width: "100%" }}
        >
          <Card
            sx={{
              p: 4,
              borderRadius: "16px",
              boxShadow: "0 8px 32px rgba(26, 155, 142, 0.15)",
              border: "1px solid rgba(26, 155, 142, 0.1)",
            }}
          >
            {/* Header */}
            <Box sx={{ textAlign: "center", mb: 4 }}>
              <Typography variant="h3" sx={{ fontWeight: 700, color: "#0d1b2a", mb: 1 }}>
                🍽️ Mihman
              </Typography>
              <Typography variant="body1" sx={{ color: "#1a9b8e", fontWeight: 600 }}>
                Yönetim Paneli
              </Typography>
              <Typography variant="caption" sx={{ color: "#999", display: "block", mt: 1 }}>
                Admin hesabınızla giriş yapın
              </Typography>
            </Box>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin}>
              <TextField
                fullWidth
                label="Kullanıcı Adı"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                sx={{ mb: 2 }}
                variant="outlined"
              />

              <TextField
                fullWidth
                type="password"
                label="Parola"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                sx={{ mb: 3 }}
                variant="outlined"
              />

              <Button
                fullWidth
                variant="contained"
                size="large"
                disabled={loading || !username || !password}
                onClick={handleLogin}
                sx={{
                  backgroundColor: "#1a9b8e",
                  height: 48,
                  fontWeight: 600,
                  borderRadius: "8px",
                  position: "relative",
                  "&:hover": {
                    backgroundColor: "#158577",
                  },
                  "&:disabled": {
                    backgroundColor: "#ccc",
                  },
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Giriş Yap"}
              </Button>
            </form>

            {/* Demo Credentials */}
            <Box sx={{ mt: 3, p: 2, backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
              <Typography variant="caption" sx={{ color: "#666", fontWeight: 600, display: "block", mb: 1 }}>
                Demo Hesaplar:
              </Typography>
              <Typography variant="caption" sx={{ color: "#999", display: "block" }}>
                👤 admin / admin123
              </Typography>
              <Typography variant="caption" sx={{ color: "#999" }}>
                👤 manager / manager123
              </Typography>
            </Box>
          </Card>
        </motion.div>
      </Container>
    </div>
  );
};

export default AdminLogin;
