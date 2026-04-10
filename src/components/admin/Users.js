import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Security as SecurityIcon,
} from "@mui/icons-material";
import axios from "axios";
import { toast } from "react-toastify";

const Users = ({ adminRole, apiUrl, getAuthHeaders }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    role: "waiter",
  });
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiUrl}/users`, getAuthHeaders());
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Kullanıcılar yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddDialog = () => {
    setEditingUser(null);
    setFormData({
      username: "",
      password: "",
      email: "",
      role: "waiter",
    });
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email || "",
      role: user.role,
      password: "", // Şifre düzenleme opsiyonel olabilir
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
  };

  const handleSaveUser = async () => {
    if (!formData.username || (!editingUser && !formData.password)) {
      toast.error("Lütfen gerekli alanları doldurun");
      return;
    }

    try {
      if (editingUser) {
        await axios.put(`${apiUrl}/users/${editingUser._id}`, formData, getAuthHeaders());
        toast.success("Kullanıcı güncellendi");
      } else {
        await axios.post(`${apiUrl}/auth/register`, formData, getAuthHeaders());
        toast.success("Kullanıcı oluşturuldu");
      }
      handleCloseDialog();
      fetchUsers();
    } catch (error) {
      toast.error("İşlem başarısız: " + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm("Bu kullanıcıyı silmek istediğinize emin misiniz?")) {
      try {
        await axios.delete(`${apiUrl}/users/${id}`, getAuthHeaders());
        toast.success("Kullanıcı silindi");
        fetchUsers();
      } catch (error) {
        toast.error("Silme işlemi başarısız: " + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await axios.post(`${apiUrl}/users/${id}/toggle-active`, {}, getAuthHeaders());
      toast.success("Durum güncellendi");
      fetchUsers();
    } catch (error) {
      toast.error("Hata: " + (error.response?.data?.message || error.message));
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          👥 Kullanıcı Yönetimi
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAddDialog}
          sx={{ backgroundColor: "#1a9b8e", "&:hover": { backgroundColor: "#158577" } }}
        >
          Yeni Kullanıcı
        </Button>
      </Box>

      {adminRole === "admin" && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Admin olarak süper adminleri düzenleyemez veya silemezsiniz.
        </Alert>
      )}

      <TableContainer component={Paper} sx={{ borderRadius: "12px", border: "1px solid #f0f0f0" }}>
        <Table>
          <TableHead sx={{ backgroundColor: "#f8f9fa" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Kullanıcı Adı</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Rol</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Durum</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id} hover>
                <TableCell sx={{ fontWeight: 600 }}>{user.username}</TableCell>
                <TableCell>{user.email || "—"}</TableCell>
                <TableCell>
                  <Chip
                    label={user.role.toUpperCase()}
                    size="small"
                    color={
                      user.role === "superadmin" ? "secondary" : 
                      user.role === "admin" ? "primary" : 
                      user.role === "manager" ? "info" : "default"
                    }
                    icon={user.role === "superadmin" ? <SecurityIcon fontSize="small" /> : undefined}
                    sx={{ fontWeight: 700 }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={user.isActive ? "Aktif" : "Pasif"}
                    color={user.isActive ? "success" : "error"}
                    size="small"
                    onClick={() => {
                        if (user.role === 'superadmin' && adminRole !== 'superadmin') return;
                        handleToggleActive(user._id);
                    }}
                    sx={{ cursor: (user.role === 'superadmin' && adminRole !== 'superadmin') ? 'default' : 'pointer' }}
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleOpenEditDialog(user)}
                    disabled={user.role === "superadmin" && adminRole !== "superadmin"}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteUser(user._id)}
                    disabled={
                        (user.role === "superadmin") || 
                        (user._id === localStorage.getItem("userId")) // Kendi hesabını silemesin (backend koruyor ama UI'da da kapatalım)
                    }
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingUser ? "Kullanıcı Düzenle" : "Yeni Kullanıcı Ekle"}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Kullanıcı Adı"
              fullWidth
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              disabled={!!editingUser}
            />
            <TextField
              label="Email"
              fullWidth
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <TextField
              label={editingUser ? "Yeni Şifre (Boş bırakılabilir)" : "Şifre"}
              fullWidth
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <TextField
              label="Rol"
              fullWidth
              select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              {adminRole === "superadmin" && <MenuItem value="superadmin">Super Admin</MenuItem>}
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="manager">Manager</MenuItem>
              <MenuItem value="waiter">Waiter</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseDialog} color="inherit">İptal</Button>
          <Button onClick={handleSaveUser} variant="contained" sx={{ backgroundColor: "#1a9b8e" }}>
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;
