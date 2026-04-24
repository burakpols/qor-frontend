import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tab,
  Tabs,
  Chip,
  CircularProgress,
  IconButton,
  AppBar,
  Toolbar,
  Divider,
  Avatar,
  Stack,
  FormControlLabel,
  Switch,
  Stepper,
  Step,
  StepLabel,
  InputAdornment,
  Alert,
  MenuItem,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
  CloudUpload as CloudUploadIcon,
  Image as ImageIcon,
  Close as CloseIcon,
  AttachMoney as AttachMoneyIcon,
  Discount as DiscountIcon,
  Category as CategoryIcon,
} from "@mui/icons-material";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Users from "./Users";
import AdminAIChat from "../chat/AdminAIChat";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from "recharts";
import "./AdminStyle.css";

// Status Türkçe Mapper
const getStatusTurkish = (status) => {
  const statusMap = {
    pending: "Beklemede",
    confirmed: "Onaylandı",
    prepared: "Hazırlandı",
    served: "Servis Edildi",
    cancelled: "İptal Edildi",
  };
  return statusMap[status] || status;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState("orders");
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    category: "",
    subcategory: "",
    title: "",
    desc: "",
    price: "",
    discount: 0,
    isAvailable: true,
    image: "", // Resim URL
    stock: 10,
    lowStockThreshold: 5,
    trackStock: true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [stats, setStats] = useState({ items: 0, orders: 0, revenue: 0 });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [openOrderDetails, setOpenOrderDetails] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [settings, setSettings] = useState(null);
  const [settingsForm, setSettingsForm] = useState({});
  const [savingSettings, setSavingSettings] = useState(false);
  const [adminTheme, setAdminTheme] = useState(localStorage.getItem("akay_admin_theme") || "light");

  // Dynamic API URL - Railway backend URL for production, localhost for local dev
  const getApiUrl = () => {
    // Production'da Railway backend URL'i kullan
    if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      // Environment variable'dan Railway backend URL al
      return process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api/v1` : "";
    }
    // Local development
    return `http://localhost:3800/api/v1`;
  };

  const apiUrl = getApiUrl();
  const token = localStorage.getItem("adminToken");
  const adminRole = localStorage.getItem("adminRole");

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${token}` },
  });

  // JWT Token Expired Handler - Global axios interceptor
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        // Sadece 401 (token geçersiz/süresi dolmuş) ve token doğrulama 403'lerinde çıkış yap
        // Yetki hatası (permission 403) durumunda çıkış YAPMA - sadece hatayı döndür
        if (error.response) {
          if (error.response.status === 401) {
            // Token geçersiz veya süresi dolmuş-
            localStorage.removeItem("adminToken");
            localStorage.removeItem("adminRole");
            toast.error("Oturum süreniz doldu. Lütfen tekrar giriş yapın.");
            navigate("/admin");
          } else if (error.response.status === 403) {
            // Token doğrulama hatası (Failed to authenticate token) vs yetki hatası ayır
            const msg = error.response.data?.message || "";
            if (msg.includes("Failed to authenticate") || msg.includes("Token not provided")) {
              // Token doğrulama hatası - gerçek oturum sorunu
              localStorage.removeItem("adminToken");
              localStorage.removeItem("adminRole");
              toast.error("Oturum süreniz doldu. Lütfen tekrar giriş yapın.");
              navigate("/admin");
            }
            // Diğer 403'ler (yetki hatası) - çıkış yapma, hatayı component'e bırak
          }
        }
        return Promise.reject(error);
      }
    );

    // Component unmount olduğunda interceptor'u temizle
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [navigate]);

  // Verileri yükle
  useEffect(() => {
    if (!token) {
      navigate("/admin");
      return;
    }
    fetchData();
  }, [token]);

  // Theme colors
  const themeConfig = {
    light: {
      bg: "#ffffff",
      bgSecondary: "#f8f9fa",
      text: "#0d1b2a",
      textSecondary: "#666",
      appBar: "#fff",
      card: "#ffffff",
      border: "#f0f0f0",
      tableHead: "#f8f9fa",
      success: "#e8f5e9",
      warning: "#fff3e0",
      info: "#e3f2fd",
      purple: "#f3e5f5",
      gray: "#f3f4f6",
      lightBlue: "#f0f9ff",
      lightPurple: "#f5f3ff",
    },
    dark: {
      bg: "#1a1a2e",
      bgSecondary: "#16213e",
      text: "#ffffff",
      textSecondary: "#b0b0b0",
      appBar: "#16213e",
      card: "#1a1a2e",
      border: "#333355",
      tableHead: "#16213e",
      success: "#1b4332",
      warning: "#4a3728",
      info: "#1e3a5f",
      purple: "#3d2c4a",
      gray: "#2d2d44",
      lightBlue: "#1e3a5f",
      lightPurple: "#3d2c4a",
    },
  };
  const currentTheme = themeConfig[adminTheme];

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsRes, ordersRes] = await Promise.all([
        axios.get(`${apiUrl}/items`, getAuthHeaders()),
        axios.get(`${apiUrl}/orders`, getAuthHeaders()),
      ]);

      setItems(itemsRes.data);
      setOrders(ordersRes.data);
      
      // Calculate active orders (not served/cancelled)
      const activeOrders = ordersRes.data.filter(
        (o) => o.status !== "served" && o.status !== "cancelled"
      ).length;
      
      // Revenue from served orders only
      const servedRevenue = ordersRes.data
        .filter((o) => o.status === "served")
        .reduce((sum, o) => sum + (o.total || 0), 0);

      setStats({
        items: itemsRes.data.length,
        orders: ordersRes.data.length,
        revenue: servedRevenue,
        activeOrders: activeOrders,
      });
      
      // Fetch settings
      try {
        const settingsRes = await axios.get(`${apiUrl}/settings`);
        setSettings(settingsRes.data);
        setSettingsForm(settingsRes.data);
      } catch (error) {
        console.warn("Settings load error:", error.message);
      }
      
      // Fetch analytics separately (non-blocking) - Only for admin/manager/superadmin
      if (adminRole === "superadmin" || adminRole === "admin" || adminRole === "manager") {
        try {
          const analyticsRes = await axios.get(`${apiUrl}/analytics`, getAuthHeaders());
          if (analyticsRes?.data) {
            // Normalize analytics data - ensure all fields exist with defaults
            const data = analyticsRes.data;
            setAnalytics({
              summary: { totalOrders: 0, completedOrders: 0, pendingOrders: 0, cancelledOrders: 0, totalRevenue: "0", completionRate: 0, cancelRate: 0, averageOrderValue: 0, tableUtilization: 0, ...data.summary },
              mostOrderedItems: data.mostOrderedItems || [],
              ordersByTable: data.ordersByTable || [],
              ordersByStatus: data.ordersByStatus || {},
              dailyRevenue: data.dailyRevenue || [],
              hourlyOrders: data.hourlyOrders || [],
              categoryStats: data.categoryStats || [],
              revenueComparison: { today: 0, yesterday: 0, changePercent: 0, ...data.revenueComparison },
              lowestPerformingItems: data.lowestPerformingItems || [],
              productCombinations: data.productCombinations || [],
              repeatCustomerRate: data.repeatCustomerRate || 0,
              avgPrepTime: data.avgPrepTime || 0,
              targetVsActual: { percentage: 0, actual: 0, target: 0, ...data.targetVsActual },
              peakHours: data.peakHours || [],
              categoryPerformance: data.categoryPerformance || [],
              weeklyComparison: { thisWeek: { orders: 0, revenue: 0 }, lastWeek: { orders: 0, revenue: 0 }, changePercent: 0, ...data.weeklyComparison },
            });
          }
        } catch (analyticsError) {
          console.warn("Analytics endpoint not available:", analyticsError.message);
          // Set empty analytics to prevent infinite loading
          setAnalytics({
            summary: { totalOrders: 0, completedOrders: 0, pendingOrders: 0, cancelledOrders: 0, totalRevenue: "0", completionRate: 0, cancelRate: 0, averageOrderValue: 0, tableUtilization: 0 },
            mostOrderedItems: [],
            ordersByTable: [],
            ordersByStatus: {},
            dailyRevenue: [],
            hourlyOrders: [],
            categoryStats: [],
            revenueComparison: { today: 0, yesterday: 0, changePercent: 0 },
            lowestPerformingItems: [],
            productCombinations: [],
            repeatCustomerRate: 0,
            avgPrepTime: 0,
            targetVsActual: { percentage: 0, actual: 0, target: 0 },
            peakHours: [],
            categoryPerformance: [],
            weeklyComparison: { thisWeek: { orders: 0, revenue: 0 }, lastWeek: { orders: 0, revenue: 0 }, changePercent: 0 },
          });
          toast.warning("Analitik veriler yüklenemedi");
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Veri yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddDialog = () => {
    setDialogTitle("Yeni Ürün Ekle");
    setEditingItem(null);
    setFormData({
      category: "",
      subcategory: "",
      title: "",
      desc: "",
      price: "",
      discount: 0,
      isAvailable: true,
      image: "",
      stock: 10,
      lowStockThreshold: 5,
      trackStock: true,
    });
    setImageFile(null);
    setImagePreview("");
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (item) => {
    setDialogTitle("Ürünü Düzenle");
    setEditingItem(item);
    setFormData({
      category: item.category,
      subcategory: item.subcategory || "",
      title: item.title,
      desc: item.desc,
      price: item.price,
      discount: item.discount || 0,
      isAvailable: item.isAvailable || true,
      image: item.img || item.image || "",
      stock: item.stock || 10,
      lowStockThreshold: item.lowStockThreshold || 5,
      trackStock: item.trackStock !== false,
    });
    setImageFile(null);
    setImagePreview(item.img || item.image || "");
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingItem(null);
    setImageFile(null);
    setImagePreview("");
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadImage = async () => {
    if (!imageFile) {
      toast.error("Lütfen resim seçin");
      return;
    }

    try {
      setUploadingImage(true);
      const formDataObj = new FormData();
      formDataObj.append("file", imageFile);

      const response = await axios.post(`${apiUrl}/upload`, formDataObj, {
        ...getAuthHeaders(),
        headers: {
          ...getAuthHeaders().headers,
          "Content-Type": "multipart/form-data",
        },
      });

      setFormData({ ...formData, image: response.data.filePath });
      setImageFile(null);
      toast.success("Resim yüklendi");
    } catch (error) {
      toast.error("Resim yükleme başarısız: " + (error.response?.data?.message || error.message));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview("");
    setFormData({ ...formData, image: "" });
    setImageFile(null);
  };

  const handleSaveItem = async () => {
    if (!formData.title || !formData.price || !formData.category) {
      toast.error("Lütfen tüm alanları doldurun");
      return;
    }

    try {
      // Map 'image' to 'img' for backend compatibility
      const backendData = {
        ...formData,
        img: formData.image || "",
      };
      delete backendData.image;

      if (editingItem) {
        // Update
        await axios.put(
          `${apiUrl}/items/${editingItem._id}`,
          backendData,
          getAuthHeaders()
        );
        toast.success("Ürün güncellendi");
      } else {
        // Create
        await axios.post(`${apiUrl}/items`, backendData, getAuthHeaders());
        toast.success("Ürün eklendi");
      }
      handleCloseDialog();
      fetchData();
    } catch (error) {
      toast.error("İşlem başarısız: " + (error.response?.data?.message || error.message));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminRole");
    navigate("/admin");
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm("Silmek istediğinize emin misiniz?")) {
      try {
        await axios.delete(`${apiUrl}/items/${id}`, getAuthHeaders());
        setItems(items.filter((item) => item._id !== id));
        toast.success("Ürün silindi");
        fetchData();
      } catch (error) {
        toast.error("Silme işlemi başarısız");
      }
    }
  };

  const handleLogoutClick = () => {
    handleLogout();
  };

  // Orders Tab Handlers
  const handleOpenOrderDetails = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setOpenOrderDetails(true);
  };

  const handleCloseOrderDetails = () => {
    setOpenOrderDetails(false);
    setSelectedOrder(null);
    setNewStatus("");
    setUpdatingOrderId(null);
  };

  const handleUpdateOrderStatus = async () => {
    if (!selectedOrder || !newStatus) return;

    try {
      setUpdatingOrderId(selectedOrder._id);
      await axios.put(
        `${apiUrl}/orders/${selectedOrder._id}`,
        { status: newStatus },
        getAuthHeaders()
      );
      toast.success("Sipariş durumu güncellendi");
      fetchData();
      handleCloseOrderDetails();
    } catch (error) {
      toast.error("Güncellemede hata: " + (error.response?.data?.message || error.message));
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const searchLower = searchText.toLowerCase();
    const matchesSearch =
      order.tableNumber?.toString().includes(searchText) ||
      order.customerName?.toLowerCase().includes(searchLower) ||
      order._id.toLowerCase().includes(searchLower);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="admin-dashboard-container" style={{ backgroundColor: currentTheme.bg, color: currentTheme.text, minHeight: "100vh" }}>
      {/* Navbar */}
      <AppBar position="sticky" sx={{ backgroundColor: currentTheme.appBar, color: currentTheme.text, borderBottom: `1px solid ${currentTheme.border}` }}>
        <Toolbar>
          <DashboardIcon sx={{ mr: 1, color: "#1a9b8e" }} />
          <Typography variant="h6" sx={{ flex: 1, fontWeight: 700, color: currentTheme.text }}>
            akay - Yönetim Paneli
          </Typography>
          <Button
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={handleLogoutClick}
            sx={{ color: currentTheme.textSecondary }}
          >
            Çıkış
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Stats Cards */}
        {!loading && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {[
              { title: "Ürünler", value: stats.items, icon: "📦", color: "#3b82f6", bgColor: "#3b82f615" },
              { title: "Siparişler", value: stats.orders, icon: "📋", color: "#8b5cf6", bgColor: "#8b5cf615" },
              ...(adminRole !== "waiter" ? [{ title: "Gelir (Servis)", value: `₺${stats.revenue.toFixed(0)}`, icon: "💰", color: "#10b981", bgColor: "#10b98115" }] : []),
              { title: "Aktif Siparişler", value: stats.activeOrders, icon: "⏳", color: "#f59e0b", bgColor: "#f59e0b15" },
              { title: "Düşük Stok", value: items.filter(i => i.trackStock && i.stock <= i.lowStockThreshold).length, icon: "⚠️", color: "#ef4444", bgColor: "#ef444415" },
            ].map((stat, idx) => (
              <Grid item xs={12} sm={6} md={4} key={idx}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card sx={{ 
                    borderRadius: "12px", 
                    border: `1px solid ${currentTheme.border}`,
                    backgroundColor: currentTheme.card,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                  }}>
                    <CardContent>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                        <Box>
                          <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                            {stat.title}
                          </Typography>
                          <Typography variant="h4" sx={{ fontWeight: 700, color: currentTheme.text, mt: 1 }}>
                            {stat.value}
                          </Typography>
                        </Box>
                        <Box sx={{ 
                          backgroundColor: stat.bgColor, 
                          borderRadius: "12px", 
                          p: 1.5,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}>
                          <Typography sx={{ fontSize: "28px" }}>{stat.icon}</Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Tabs */}
        <Box sx={{ borderBottom: `1px solid ${currentTheme.border}`, mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={(e, v) => setTabValue(v)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              "& .MuiTab-root": { fontWeight: 600, color: currentTheme.textSecondary, minWidth: 'auto', flexShrink: 0 },
              "& .Mui-selected": { color: "#1a9b8e" },
              "& .MuiTabs-scrollButtons": { opacity: 1 },
            }}
          >
            <Tab value="items" label="📦 Ürünler" sx={{ minWidth: '120px' }} />
            <Tab value="orders" label="📋 Siparişler" sx={{ minWidth: '120px' }} />
            {(adminRole === "superadmin" || adminRole === "admin" || adminRole === "manager") && (
              <Tab value="analytics" label="📊 Analitik" sx={{ minWidth: '120px' }} />
            )}
            {(adminRole === "superadmin" || adminRole === "admin" || adminRole === "manager") && (
              <Tab value="analyst" label="🤖 AI Analist" sx={{ minWidth: '120px' }} />
            )}
            {(adminRole === "superadmin" || adminRole === "admin") && (
              <Tab value="users" label="👥 Kullanıcılar" sx={{ minWidth: '120px' }} />
            )}
            {adminRole === "superadmin" && (
              <Tab value="settings" label="⚙️ Ayarlar" sx={{ minWidth: '120px' }} />
            )}
          </Tabs>
        </Box>

        {/* Tab Content */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Ürünler */}
            {tabValue === "items" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {adminRole !== "waiter" && (
                <Box sx={{ mb: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenAddDialog}
                    sx={{
                      backgroundColor: "#1a9b8e",
                      "&:hover": { backgroundColor: "#158577" },
                    }}
                  >
                    Yeni Ürün
                  </Button>
                </Box>
                )}

                <TableContainer component={Paper}>
                  <Table>
                    <TableHead sx={{ backgroundColor: currentTheme.bgSecondary }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, color: currentTheme.text }}>Ürün Adı</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: currentTheme.text }}>Kategori</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: currentTheme.text }} align="right">
                          Fiyat
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: currentTheme.text }} align="center">
                          Stok
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: currentTheme.text }} align="center">
                          Durum
                        </TableCell>
                        {adminRole !== "waiter" && (
                        <TableCell sx={{ fontWeight: 700, color: currentTheme.text }} align="right">
                          İşlemler
                        </TableCell>
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.map((item) => {
                        const isLowStock = item.trackStock && item.stock <= item.lowStockThreshold;
                        return (
                        <TableRow key={item._id} hover>
                          <TableCell sx={{ fontWeight: 500, color: currentTheme.text }}>{item.title}</TableCell>
                          <TableCell sx={{ color: currentTheme.text }}>{item.category}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: "#1a9b8e" }}>
                            ₺{item.price}
                          </TableCell>
                          <TableCell align="center">
                            {item.trackStock ? (
                              <Chip
                                label={`${item.stock} adet`}
                                color={isLowStock ? "error" : "success"}
                                size="small"
                                icon={isLowStock ? <span>⚠️</span> : undefined}
                                sx={{ fontWeight: 600 }}
                              />
                            ) : (
                              <Typography variant="body2" sx={{ color: "#999" }}>—</Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={item.isAvailable ? "Mevcut" : "Tükendi"}
                              color={item.isAvailable ? "success" : "error"}
                              size="small"
                            />
                          </TableCell>
                          {adminRole !== "waiter" && (
                          <TableCell align="right">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleOpenEditDialog(item)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteItem(item._id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                          )}
                        </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </motion.div>
            )}

            {/* Siparişler */}
            {tabValue === "orders" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Box sx={{ mb: 3 }}>
                  {/* Status Filtreleri */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                      Duruma Göre Filtrele
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      {[
                        { value: "all", label: "Tümü", color: "#6b7280" },
                        { value: "pending", label: "Beklemede", color: "#f59e0b" },
                        { value: "confirmed", label: "Onaylandı", color: "#3b82f6" },
                        { value: "prepared", label: "Hazırlandı", color: "#8b5cf6" },
                        { value: "served", label: "Servis Edildi", color: "#10b981" },
                        { value: "cancelled", label: "İptal Edildi", color: "#ef4444" },
                      ].map((filter) => (
                        <Button
                          key={filter.value}
                          variant={statusFilter === filter.value ? "contained" : "outlined"}
                          onClick={() => setStatusFilter(filter.value)}
                          sx={{
                            backgroundColor: statusFilter === filter.value ? filter.color : "transparent",
                            borderColor: filter.color,
                            color: statusFilter === filter.value ? "#fff" : filter.color,
                            fontWeight: 600,
                            textTransform: "none",
                            "&:hover": {
                              backgroundColor: statusFilter === filter.value ? filter.color : filter.color + "15",
                            },
                          }}
                        >
                          {filter.label}
                        </Button>
                      ))}
                    </Box>
                  </Box>

                  {/* Arama */}
                  <Box sx={{ mb: 3 }}>
                    <TextField
                      placeholder="Masa veya müşteri adıyla ara..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      fullWidth
                      size="small"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                          "&:hover fieldset": { borderColor: "#1a9b8e" },
                          "&.Mui-focused fieldset": { borderColor: "#1a9b8e" },
                        },
                      }}
                    />
                  </Box>
                </Box>

                {filteredOrders.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 8 }}>
                    <Typography sx={{ color: "#999", fontSize: "16px" }}>
                      Sipariş bulunamadı
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead sx={{ backgroundColor: currentTheme.bgSecondary }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, color: currentTheme.text }}>Masa</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: currentTheme.text }}>Müşteri</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: currentTheme.text }} align="center">
                            Ürün Sayısı
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, color: currentTheme.text }} align="right">
                            Toplam
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, color: currentTheme.text }}>Durum</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: currentTheme.text }}>Zaman</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: currentTheme.text }} align="center">
                            İşlemler
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredOrders.map((order) => (
                          <TableRow key={order._id} hover>
                            <TableCell sx={{ fontWeight: 700, color: "#1a9b8e" }}>
                              {order.tableNumber ? `Masa ${order.tableNumber}` : "N/A"}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 500, color: currentTheme.text }}>
                              {order.customerName || "Bilinmeyen Müşteri"}
                            </TableCell>
                            <TableCell align="center" sx={{ color: currentTheme.text }}>{order.items?.length || 0}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, color: "#1a9b8e" }}>
                              ₺{order.total?.toFixed(2) || "0.00"}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={getStatusTurkish(order.status)}
                                color={
                                  order.status === "served"
                                    ? "success"
                                    : order.status === "cancelled"
                                    ? "error"
                                    : order.status === "prepared"
                                    ? "info"
                                    : order.status === "confirmed"
                                    ? "primary"
                                    : "warning"
                                }
                                size="small"
                                sx={{ fontWeight: 600 }}
                              />
                            </TableCell>
                            <TableCell sx={{ color: "#999", fontSize: "12px" }}>
                              {new Date(order.createdAt).toLocaleString("tr-TR")}
                            </TableCell>
                            <TableCell align="center">
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => handleOpenOrderDetails(order)}
                                sx={{
                                  backgroundColor: "#1a9b8e",
                                  "&:hover": { backgroundColor: "#158577" },
                                  fontSize: "11px",
                                  textTransform: "none",
                                }}
                              >
                                Detay
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </motion.div>
            )}

            {/* AI Analist */}
            {tabValue === "analyst" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <AdminAIChat adminToken={token} />
              </motion.div>
            )}

            {/* Analitik */}
            {tabValue === "analytics" && (adminRole === "superadmin" || adminRole === "admin" || adminRole === "manager") && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {analytics ? (
                  <Grid container spacing={3}>
                    {/* Tümü Siparişler Durumu */}
                    <Grid item xs={12} md={6}>
                      <Card sx={{ borderRadius: "12px", border: "1px solid #f0f0f0" }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                            Siparişler Durumu
                          </Typography>
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={Object.entries(analytics.ordersByStatus || {}).map(([name, value]) => ({ name, value }))}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, value }) => `${name}: ${value}`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                <Cell fill="#f59e0b" />
                                <Cell fill="#3b82f6" />
                                <Cell fill="#8b5cf6" />
                                <Cell fill="#10b981" />
                                <Cell fill="#ef4444" />
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* En Çok Sipariş Edilen Ürünler */}
                    <Grid item xs={12} md={6}>
                      <Card sx={{ borderRadius: "12px", border: "1px solid #f0f0f0" }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                            En Çok Sipariş Edilen Ürünler
                          </Typography>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={Array.isArray(analytics.mostOrderedItems) ? analytics.mostOrderedItems : []}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="title" angle={-45} textAnchor="end" height={100} fontSize={12} />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="count" fill="#1a9b8e" />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Günlük Gelir */}
                    <Grid item xs={12}>
                      <Card sx={{ borderRadius: "12px", border: "1px solid #f0f0f0" }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                            Son 7 Günün Geliri
                          </Typography>
                          <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={Array.isArray(analytics.dailyRevenue) ? analytics.dailyRevenue : []}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis />
                              <Tooltip formatter={(value) => `₺${value?.toFixed(2)}`} />
                              <Legend />
                              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Gelir (₺)" />
                            </LineChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Masa Bazlı Siparişler */}
                    <Grid item xs={12} md={6}>
                      <Card sx={{ borderRadius: "12px", border: "1px solid #f0f0f0" }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                            Masa Bazlı Siparişler
                          </Typography>
                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ backgroundColor: currentTheme.bgSecondary }}>
                                  <TableCell sx={{ fontWeight: 700, color: currentTheme.text }}>Masa</TableCell>
                                  <TableCell sx={{ fontWeight: 700, color: currentTheme.text }} align="right">
                                    Sipariş Sayısı
                                  </TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {(analytics.ordersByTable || []).map((row, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell>{row.table}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600, color: "#1a9b8e" }}>
                                      {row.count}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* İstatistikler */}
                    <Grid item xs={12} md={6}>
                      <Card sx={{ borderRadius: "12px", border: "1px solid #f0f0f0" }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                            Özet İstatistikler
                          </Typography>
                          <Stack spacing={2}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", pb: 1.5, borderBottom: "1px solid #f0f0f0" }}>
                              <Typography sx={{ color: "#666" }}>Toplam Siparişler</Typography>
                              <Typography sx={{ fontWeight: 600, color: "#1a9b8e" }}>{analytics.summary.totalOrders}</Typography>
                            </Box>
                            <Box sx={{ display: "flex", justifyContent: "space-between", pb: 1.5, borderBottom: "1px solid #f0f0f0" }}>
                              <Typography sx={{ color: "#666" }}>Tamamlanan</Typography>
                              <Typography sx={{ fontWeight: 600, color: "#10b981" }}>{analytics.summary.completedOrders}</Typography>
                            </Box>
                            <Box sx={{ display: "flex", justifyContent: "space-between", pb: 1.5, borderBottom: "1px solid #f0f0f0" }}>
                              <Typography sx={{ color: "#666" }}>Beklemede</Typography>
                              <Typography sx={{ fontWeight: 600, color: "#f59e0b" }}>{analytics.summary.pendingOrders}</Typography>
                            </Box>
                            <Box sx={{ display: "flex", justifyContent: "space-between", pb: 1.5, borderBottom: "1px solid #f0f0f0" }}>
                              <Typography sx={{ color: "#666" }}>İptal Edildi</Typography>
                              <Typography sx={{ fontWeight: 600, color: "#ef4444" }}>{analytics.summary.cancelledOrders}</Typography>
                            </Box>
                            <Box sx={{ display: "flex", justifyContent: "space-between", pt: 1 }}>
                              <Typography sx={{ color: "#666", fontWeight: 700 }}>Toplam Gelir</Typography>
                              <Typography sx={{ fontWeight: 700, color: "#10b981", fontSize: "18px" }}>₺{analytics.summary.totalRevenue}</Typography>
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Saatlik Sipariş Dağılımı */}
                    <Grid item xs={12}>
                      <Card sx={{ borderRadius: "12px", border: "1px solid #f0f0f0" }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                            Saatlik Sipariş Dağılımı
                          </Typography>
                          <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={Array.isArray(analytics.hourlyOrders) ? analytics.hourlyOrders : []}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="hour" label={{ value: "Saat", position: "insideBottomRight", offset: -5 }} />
                              <YAxis />
                              <Tooltip formatter={(value) => `${value} sipariş`} />
                              <Legend />
                              <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} name="Sipariş Sayısı" />
                            </LineChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Kategori Satışları */}
                    <Grid item xs={12} md={6}>
                      <Card sx={{ borderRadius: "12px", border: "1px solid #f0f0f0" }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                            Kategori Bazlı Satışlar
                          </Typography>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={Array.isArray(analytics.categoryStats) ? analytics.categoryStats : []}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="category" />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="count" fill="#3b82f6" name="Satış Sayısı" />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Gelir Karşılaştırması */}
                    <Grid item xs={12} md={6}>
                      <Card sx={{ borderRadius: "12px", border: "1px solid #f0f0f0" }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                            Gelir Karşılaştırması (Bugün vs Dün)
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Box sx={{ textAlign: "center", p: 2, backgroundColor: "#e8f5e9", borderRadius: "8px" }}>
                                <Typography sx={{ color: "#999", fontSize: "12px", mb: 1 }}>Bugün</Typography>
                                <Typography sx={{ fontWeight: 700, color: "#10b981", fontSize: "24px" }}>
                                  ₺{analytics.revenueComparison?.today || 0}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box sx={{ textAlign: "center", p: 2, backgroundColor: "#f3f4f6", borderRadius: "8px" }}>
                                <Typography sx={{ color: "#999", fontSize: "12px", mb: 1 }}>Dün</Typography>
                                <Typography sx={{ fontWeight: 700, color: "#6b7280", fontSize: "20px" }}>
                                  ₺{analytics.revenueComparison?.yesterday || 0}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12}>
                              <Box sx={{ textAlign: "center", p: 2, backgroundColor: (analytics.revenueComparison?.changePercent || 0) >= 0 ? "#f0fdf4" : "#fef2f2", borderRadius: "8px", border: `2px solid ${(analytics.revenueComparison?.changePercent || 0) >= 0 ? "#22c55e" : "#ef4444"}` }}>
                                <Typography sx={{ fontSize: "12px", color: "#999" }}>Değişim</Typography>
                                <Typography sx={{ fontWeight: 700, color: (analytics.revenueComparison?.changePercent || 0) >= 0 ? "#22c55e" : "#ef4444", fontSize: "20px" }}>
                                  {(analytics.revenueComparison?.changePercent || 0) >= 0 ? "↑" : "↓"} {Math.abs(analytics.revenueComparison?.changePercent || 0)}%
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Performans Metrikleri */}
                    <Grid item xs={12}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                          <Card sx={{ borderRadius: "12px", border: "1px solid #f0f0f0" }}>
                            <CardContent sx={{ textAlign: "center" }}>
                              <Typography sx={{ color: "#999", fontSize: "12px", mb: 1 }}>Tamamlanma Oranı</Typography>
                              <Typography sx={{ fontWeight: 700, color: "#10b981", fontSize: "28px", mb: 1 }}>
                                {analytics.summary.completionRate}%
                              </Typography>
                              <Chip label={`${analytics.summary.completedOrders}/${analytics.summary.totalOrders}`} size="small" color="success" />
                            </CardContent>
                          </Card>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                          <Card sx={{ borderRadius: "12px", border: "1px solid #f0f0f0" }}>
                            <CardContent sx={{ textAlign: "center" }}>
                              <Typography sx={{ color: "#999", fontSize: "12px", mb: 1 }}>İptal Oranı</Typography>
                              <Typography sx={{ fontWeight: 700, color: "#ef4444", fontSize: "28px", mb: 1 }}>
                                {analytics.summary.cancelRate}%
                              </Typography>
                              <Chip label={`${analytics.summary.cancelledOrders} sipariş`} size="small" color="error" />
                            </CardContent>
                          </Card>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                          <Card sx={{ borderRadius: "12px", border: "1px solid #f0f0f0" }}>
                            <CardContent sx={{ textAlign: "center" }}>
                              <Typography sx={{ color: "#999", fontSize: "12px", mb: 1 }}>Ort. Sipariş Değeri</Typography>
                              <Typography sx={{ fontWeight: 700, color: "#3b82f6", fontSize: "28px", mb: 1 }}>
                                ₺{analytics.summary.averageOrderValue}
                              </Typography>
                              <Chip label="Servis Edildi" size="small" color="primary" />
                            </CardContent>
                          </Card>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                          <Card sx={{ borderRadius: "12px", border: "1px solid #f0f0f0" }}>
                            <CardContent sx={{ textAlign: "center" }}>
                              <Typography sx={{ color: "#999", fontSize: "12px", mb: 1 }}>Masa Kullanım</Typography>
                              <Typography sx={{ fontWeight: 700, color: "#8b5cf6", fontSize: "28px", mb: 1 }}>
                                {analytics.summary.tableUtilization}%
                              </Typography>
                              <Chip label="Etkinlik Oranı" size="small" />
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>
                    </Grid>

                    {/* En Düşük Satılan Ürünler */}
                    <Grid item xs={12} md={6}>
                      <Card sx={{ borderRadius: "12px", border: "1px solid #f0f0f0" }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                            En Düşük Satılan Ürünler
                          </Typography>
                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ backgroundColor: "#f8f9fa" }}>
                                  <TableCell sx={{ fontWeight: 700 }}>Ürün Adı</TableCell>
                                  <TableCell sx={{ fontWeight: 700 }} align="right">
                                    Satış
                                  </TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {analytics.lowestPerformingItems?.map((item, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell sx={{ fontWeight: 500 }}>{item.title}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600, color: "#ef4444" }}>
                                      {item.count}x
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Ürün Kombinasyonları */}
                    <Grid item xs={12} md={6}>
                      <Card sx={{ borderRadius: "12px", border: "1px solid #f0f0f0" }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                            Sık Satılan Ürün Kombinasyonları
                          </Typography>
                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ backgroundColor: "#f8f9fa" }}>
                                  <TableCell sx={{ fontWeight: 700 }}>Kombinasyon</TableCell>
                                  <TableCell sx={{ fontWeight: 700 }} align="right">
                                    Sayı
                                  </TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {analytics.productCombinations?.map((combo, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell sx={{ fontWeight: 500, fontSize: "12px" }}>
                                      {combo.combo.length > 40 ? combo.combo.substring(0, 37) + "..." : combo.combo}
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600, color: "#1a9b8e" }}>
                                      {combo.count}x
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* === 6 YENİ PROFESYÖNEL METRİK === */}

                    {/* Müşteri Tekrar Satın Alma Oranı */}
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ borderRadius: "12px", border: "1px solid #f0f0f0", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
                        <CardContent sx={{ textAlign: "center" }}>
                          <Typography sx={{ color: "#fff", fontSize: "12px", mb: 1 }}>Müşteri Tekrar Oranı</Typography>
                          <Typography sx={{ fontWeight: 700, color: "#fff", fontSize: "32px", mb: 1 }}>
                            {analytics.repeatCustomerRate}%
                          </Typography>
                          <Typography sx={{ color: "rgba(255,255,255,0.8)", fontSize: "11px" }}>Tekrar satın alma</Typography>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Sipariş Hazırlama Süresi */}
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ borderRadius: "12px", border: "1px solid #f0f0f0", background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" }}>
                        <CardContent sx={{ textAlign: "center" }}>
                          <Typography sx={{ color: "#fff", fontSize: "12px", mb: 1 }}>Ort. Hazırlama Süresi</Typography>
                          <Typography sx={{ fontWeight: 700, color: "#fff", fontSize: "32px", mb: 1 }}>
                            {analytics.avgPrepTime}
                          </Typography>
                          <Typography sx={{ color: "rgba(255,255,255,0.8)", fontSize: "11px" }}>dakika</Typography>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Target vs Actual */}
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ borderRadius: "12px", border: "1px solid #f0f0f0", background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" }}>
                        <CardContent sx={{ textAlign: "center" }}>
                          <Typography sx={{ color: "#fff", fontSize: "12px", mb: 1 }}>Hedef vs Gerçek</Typography>
                          <Typography sx={{ fontWeight: 700, color: "#fff", fontSize: "28px", mb: 1 }}>
                            {analytics.targetVsActual?.percentage}%
                          </Typography>
                          <Typography sx={{ color: "rgba(255,255,255,0.8)", fontSize: "10px" }}>
                            ₺{analytics.targetVsActual?.actual} / ₺{analytics.targetVsActual?.target}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Peak Hours */}
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ borderRadius: "12px", border: "1px solid #f0f0f0", background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)" }}>
                        <CardContent sx={{ textAlign: "center" }}>
                          <Typography sx={{ color: "#333", fontSize: "12px", fontWeight: 700, mb: 2 }}>Yoğun Saatler</Typography>
                          <Stack spacing={1}>
                            {analytics.peakHours?.map((hour, idx) => (
                              <Typography key={idx} sx={{ color: "#333", fontSize: "11px", fontWeight: 600 }}>
                                ⏰ {hour}
                              </Typography>
                            ))}
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Kategori Performansı */}
                    <Grid item xs={12} md={6}>
                      <Card sx={{ borderRadius: "12px", border: "1px solid #f0f0f0" }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                            Kategori Performansı (Ort. Sipariş Değeri)
                          </Typography>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={Array.isArray(analytics.categoryPerformance) ? analytics.categoryPerformance : []}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} fontSize={12} />
                              <YAxis />
                              <Tooltip formatter={(value) => `₺${value}`} />
                              <Bar dataKey="avgValue" fill="#06b6d4" name="Ort. Değer" />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Haftalık KPI Karşılaştırması */}
                    <Grid item xs={12} md={6}>
                      <Card sx={{ borderRadius: "12px", border: "1px solid #f0f0f0" }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                            Haftalık KPI Karşılaştırması
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Box sx={{ p: 2.5, backgroundColor: "#f0f9ff", borderRadius: "8px", textAlign: "center" }}>
                                <Typography sx={{ color: "#999", fontSize: "11px", mb: 1, fontWeight: 700 }}>BU HAFTA</Typography>
                                <Typography sx={{ fontSize: "22px", fontWeight: 700, color: "#0284c7", mb: 1 }}>
                                  {analytics.weeklyComparison?.thisWeek?.orders}
                                </Typography>
                                <Typography sx={{ fontSize: "10px", color: "#666" }}>Sipariş</Typography>
                                <Typography sx={{ fontSize: "14px", fontWeight: 700, color: "#10b981", mt: 1 }}>
                                  ₺{analytics.weeklyComparison?.thisWeek?.revenue}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box sx={{ p: 2.5, backgroundColor: "#f5f3ff", borderRadius: "8px", textAlign: "center" }}>
                                <Typography sx={{ color: "#999", fontSize: "11px", mb: 1, fontWeight: 700 }}>GEÇEN HAFTA</Typography>
                                <Typography sx={{ fontSize: "22px", fontWeight: 700, color: "#6366f1", mb: 1 }}>
                                  {analytics.weeklyComparison?.lastWeek?.orders}
                                </Typography>
                                <Typography sx={{ fontSize: "10px", color: "#666" }}>Sipariş</Typography>
                                <Typography sx={{ fontSize: "14px", fontWeight: 700, color: "#8b5cf6", mt: 1 }}>
                                  ₺{analytics.weeklyComparison?.lastWeek?.revenue}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12}>
                              <Box sx={{ p: 2, backgroundColor: analytics.weeklyComparison?.changePercent >= 0 ? "#f0fdf4" : "#fef2f2", borderRadius: "8px", textAlign: "center", border: `2px solid ${analytics.weeklyComparison?.changePercent >= 0 ? "#22c55e" : "#ef4444"}` }}>
                                <Typography sx={{ fontSize: "12px", color: "#666", mb: 0.5 }}>Haftalık Değişim</Typography>
                                <Typography sx={{ fontSize: "24px", fontWeight: 700, color: analytics.weeklyComparison?.changePercent >= 0 ? "#22c55e" : "#ef4444" }}>
                                  {analytics.weeklyComparison?.changePercent >= 0 ? "↑" : "↓"} {Math.abs(analytics.weeklyComparison?.changePercent)}%
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                ) : (
                  <Box sx={{ textAlign: "center", py: 8 }}>
                    <Typography sx={{ color: "#999", mb: 2, fontSize: "16px" }}>
                      Analitik veriler yükleniyor...
                    </Typography>
                    <CircularProgress />
                  </Box>
                )}
              </motion.div>
            )}

            {/* Kullanıcılar */}
            {tabValue === "users" && (adminRole === "superadmin" || adminRole === "admin") && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Users adminRole={adminRole} apiUrl={apiUrl} getAuthHeaders={getAuthHeaders} />
              </motion.div>
            )}

            {/* Ayarlar */}
            {tabValue === "settings" && adminRole === "superadmin" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Grid container spacing={3}>
                  {/* Restoran Bilgileri */}
                  <Grid item xs={12} md={6}>
                    <Card sx={{ borderRadius: "12px", border: `1px solid ${currentTheme.border}`, backgroundColor: currentTheme.card }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: currentTheme.text }}>
                          🏪 Restoran Bilgileri
                        </Typography>
                        <Stack spacing={2}>
                          <Box>
                            <Typography sx={{ fontSize: "12px", fontWeight: 700, mb: 1, color: currentTheme.textSecondary }}>
                              Restoran Adı
                            </Typography>
                            <TextField
                              fullWidth
                              size="small"
                              value={settingsForm?.restaurantName || ""}
                              onChange={(e) => setSettingsForm({ ...settingsForm, restaurantName: e.target.value })}
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  backgroundColor: currentTheme.bgSecondary,
                                  color: currentTheme.text,
                                  "& fieldset": { borderColor: currentTheme.border },
                                },
                              }}
                            />
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: "12px", fontWeight: 700, mb: 1, color: currentTheme.textSecondary }}>
                              Slogan
                            </Typography>
                            <TextField
                              fullWidth
                              size="small"
                              value={settingsForm?.slogan || ""}
                              onChange={(e) => setSettingsForm({ ...settingsForm, slogan: e.target.value })}
                              placeholder="Örn: Kalitelinin adresi"
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  backgroundColor: currentTheme.bgSecondary,
                                  color: currentTheme.text,
                                  "& fieldset": { borderColor: currentTheme.border },
                                },
                              }}
                            />
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: "12px", fontWeight: 700, mb: 1, color: currentTheme.textSecondary }}>
                              Telefon
                            </Typography>
                            <TextField
                              fullWidth
                              size="small"
                              value={settingsForm?.phone || ""}
                              onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  backgroundColor: currentTheme.bgSecondary,
                                  color: currentTheme.text,
                                  "& fieldset": { borderColor: currentTheme.border },
                                },
                              }}
                            />
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: "12px", fontWeight: 700, mb: 1, color: currentTheme.textSecondary }}>
                              Adres
                            </Typography>
                            <TextField
                              fullWidth
                              size="small"
                              multiline
                              rows={2}
                              value={settingsForm?.address || ""}
                              onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  backgroundColor: currentTheme.bgSecondary,
                                  color: currentTheme.text,
                                  "& fieldset": { borderColor: currentTheme.border },
                                },
                              }}
                            />
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Çalışma Saatleri */}
                  <Grid item xs={12} md={6}>
                    <Card sx={{ borderRadius: "12px", border: `1px solid ${currentTheme.border}`, backgroundColor: currentTheme.card }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: currentTheme.text }}>
                          ⏰ Çalışma Saatleri
                        </Typography>
                        <Stack spacing={2}>
                          <Box>
                            <Typography sx={{ fontSize: "12px", fontWeight: 700, mb: 1, color: currentTheme.textSecondary }}>
                              Açılış Saati
                            </Typography>
                            <TextField
                              fullWidth
                              size="small"
                              type="time"
                              value={settingsForm?.businessHours?.open || "09:00"}
                              disabled={!settingsForm?.businessHours?.isEnabled || settingsForm?.businessHours?.is247}
                              onChange={(e) => setSettingsForm({
                                ...settingsForm,
                                businessHours: { ...settingsForm?.businessHours, open: e.target.value }
                              })}
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  backgroundColor: currentTheme.bgSecondary,
                                  color: currentTheme.text,
                                  "& fieldset": { borderColor: currentTheme.border },
                                },
                              }}
                            />
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: "12px", fontWeight: 700, mb: 1, color: currentTheme.textSecondary }}>
                              Kapanış Saati
                            </Typography>
                            <TextField
                              fullWidth
                              size="small"
                              type="time"
                              value={settingsForm?.businessHours?.close || "23:00"}
                              disabled={!settingsForm?.businessHours?.isEnabled || settingsForm?.businessHours?.is247}
                              onChange={(e) => setSettingsForm({
                                ...settingsForm,
                                businessHours: { ...settingsForm?.businessHours, close: e.target.value }
                              })}
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  backgroundColor: currentTheme.bgSecondary,
                                  color: currentTheme.text,
                                  "& fieldset": { borderColor: currentTheme.border },
                                },
                              }}
                            />
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: "12px", fontWeight: 700, mb: 1, color: currentTheme.textSecondary }}>
                              Zaman Dilimi
                            </Typography>
                            <TextField
                              fullWidth
                              size="small"
                              select
                              value={settingsForm?.businessHours?.timezone || "Europe/Istanbul"}
                              disabled={!settingsForm?.businessHours?.isEnabled || settingsForm?.businessHours?.is247}
                              onChange={(e) => setSettingsForm({
                                ...settingsForm,
                                businessHours: { ...settingsForm?.businessHours, timezone: e.target.value }
                              })}
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  backgroundColor: currentTheme.bgSecondary,
                                  color: currentTheme.text,
                                  "& fieldset": { borderColor: currentTheme.border },
                                },
                              }}
                            >
                              <MenuItem value="Europe/Istanbul">Europe/Istanbul (TRT)</MenuItem>
                              <MenuItem value="Europe/London">Europe/London (GMT)</MenuItem>
                              <MenuItem value="Europe/Paris">Europe/Paris (CET)</MenuItem>
                              <MenuItem value="America/New_York">America/New_York (EST)</MenuItem>
                              <MenuItem value="America/Los_Angeles">America/Los_Angeles (PST)</MenuItem>
                              <MenuItem value="Asia/Tokyo">Asia/Tokyo (JST)</MenuItem>
                              <MenuItem value="Asia/Dubai">Asia/Dubai (GST)</MenuItem>
                            </TextField>
                          </Box>
                          <Box>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={settingsForm?.businessHours?.is247 || false}
                                  onChange={(e) => setSettingsForm({
                                    ...settingsForm,
                                    businessHours: { ...settingsForm?.businessHours, is247: e.target.checked }
                                  })}
                                  color="primary"
                                />
                              }
                              label="7/24 Açık"
                              sx={{ color: currentTheme.text }}
                            />
                          </Box>
                          <Box>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={!settingsForm?.businessHours?.isEnabled}
                                  onChange={(e) => setSettingsForm({
                                    ...settingsForm,
                                    businessHours: { ...settingsForm?.businessHours, isEnabled: !e.target.checked }
                                  })}
                                  color="error"
                                />
                              }
                              label="Kapalıyız Modu (Manuel)"
                              sx={{ color: currentTheme.text }}
                            />
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Sipariş Ayarları */}
                  <Grid item xs={12} md={6}>
                    <Card sx={{ borderRadius: "12px", border: `1px solid ${currentTheme.border}`, backgroundColor: currentTheme.card }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: currentTheme.text }}>
                          📦 Sipariş Ayarları
                        </Typography>
                        <Stack spacing={2}>
                          <Box>
                            <Typography sx={{ fontSize: "12px", fontWeight: 700, mb: 1, color: currentTheme.textSecondary }}>
                              Minimum Sipariş Tutarı (₺)
                            </Typography>
                            <TextField
                              fullWidth
                              size="small"
                              type="number"
                              value={settingsForm?.minimumOrder || 25}
                              onChange={(e) => setSettingsForm({ ...settingsForm, minimumOrder: parseFloat(e.target.value) })}
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  backgroundColor: currentTheme.bgSecondary,
                                  color: currentTheme.text,
                                  "& fieldset": { borderColor: currentTheme.border },
                                },
                              }}
                            />
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: "12px", fontWeight: 700, mb: 1, color: currentTheme.textSecondary }}>
                              Global Indirim (%)
                            </Typography>
                            <TextField
                              fullWidth
                              size="small"
                              type="number"
                              inputProps={{ min: 0, max: 100 }}
                              value={settingsForm?.globalDiscount || 0}
                              onChange={(e) => setSettingsForm({ ...settingsForm, globalDiscount: parseFloat(e.target.value) })}
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  backgroundColor: currentTheme.bgSecondary,
                                  color: currentTheme.text,
                                  "& fieldset": { borderColor: currentTheme.border },
                                },
                              }}
                            />
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: "12px", fontWeight: 700, mb: 1, color: currentTheme.textSecondary }}>
                              Para Birimi
                            </Typography>
                            <TextField
                              fullWidth
                              size="small"
                              select
                              value={settingsForm?.currency || "₺"}
                              onChange={(e) => setSettingsForm({ ...settingsForm, currency: e.target.value })}
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  backgroundColor: currentTheme.bgSecondary,
                                  color: currentTheme.text,
                                  "& fieldset": { borderColor: currentTheme.border },
                                },
                              }}
                            >
                              <MenuItem value="₺">₺ Türk Lirası</MenuItem>
                              <MenuItem value="$">$ Dolar</MenuItem>
                              <MenuItem value="€">€ Euro</MenuItem>
                            </TextField>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Masa Yönetimi */}
                  <Grid item xs={12} md={6}>
                    <Card sx={{ borderRadius: "12px", border: `1px solid ${currentTheme.border}`, backgroundColor: currentTheme.card }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: currentTheme.text }}>
                          🪑 Masa Yönetimi
                        </Typography>
                        <Stack spacing={2}>
                          <Box>
                            <Typography sx={{ fontSize: "12px", fontWeight: 700, mb: 1, color: currentTheme.textSecondary }}>
                              Toplam Masa Sayısı
                            </Typography>
                            <TextField
                              fullWidth
                              size="small"
                              type="number"
                              inputProps={{ min: 1 }}
                              value={settingsForm?.tableSettings?.totalTables || 20}
                              onChange={(e) => setSettingsForm({
                                ...settingsForm,
                                tableSettings: { ...settingsForm?.tableSettings, totalTables: parseInt(e.target.value) }
                              })}
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  backgroundColor: currentTheme.bgSecondary,
                                  color: currentTheme.text,
                                  "& fieldset": { borderColor: currentTheme.border },
                                },
                              }}
                            />
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: "12px", fontWeight: 700, mb: 2, color: currentTheme.textSecondary }}>
                              İnaktif Masalar ({settingsForm?.tableSettings?.inactiveTables?.length || 0})
                            </Typography>
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                              {Array.from({ length: settingsForm?.tableSettings?.totalTables || 20 }, (_, i) => i + 1).map((table) => (
                                <Chip
                                  key={table}
                                  label={`Masa ${table}`}
                                  onClick={() => {
                                    const inactive = settingsForm?.tableSettings?.inactiveTables || [];
                                    const newInactive = inactive.includes(table)
                                      ? inactive.filter((t) => t !== table)
                                      : [...inactive, table];
                                    setSettingsForm({
                                      ...settingsForm,
                                      tableSettings: { ...settingsForm?.tableSettings, inactiveTables: newInactive }
                                    });
                                  }}
                                  color={settingsForm?.tableSettings?.inactiveTables?.includes(table) ? "error" : "default"}
                                  variant={settingsForm?.tableSettings?.inactiveTables?.includes(table) ? "filled" : "outlined"}
                                  sx={{ cursor: "pointer" }}
                                />
                              ))}
                            </Box>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Bildirim Ayarları */}
                  <Grid item xs={12} md={6}>
                    <Card sx={{ borderRadius: "12px", border: `1px solid ${currentTheme.border}`, backgroundColor: currentTheme.card }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: currentTheme.text }}>
                          🔔 Bildirim Ayarları
                        </Typography>
                        <Stack spacing={2}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={settingsForm?.notifications?.newOrder || false}
                                onChange={(e) => setSettingsForm({
                                  ...settingsForm,
                                  notifications: { ...settingsForm?.notifications, newOrder: e.target.checked }
                                })}
                              />
                            }
                            label={<Typography sx={{ color: currentTheme.text }}>Yeni Sipariş Bildirimi</Typography>}
                          />
                          <FormControlLabel
                            control={
                              <Switch
                                checked={settingsForm?.notifications?.statusChange || false}
                                onChange={(e) => setSettingsForm({
                                  ...settingsForm,
                                  notifications: { ...settingsForm?.notifications, statusChange: e.target.checked }
                                })}
                              />
                            }
                            label={<Typography sx={{ color: currentTheme.text }}>Durum Değişikliği Bildirimi</Typography>}
                          />
                          <FormControlLabel
                            control={
                              <Switch
                                checked={settingsForm?.notifications?.lowInventory || false}
                                onChange={(e) => setSettingsForm({
                                  ...settingsForm,
                                  notifications: { ...settingsForm?.notifications, lowInventory: e.target.checked }
                                })}
                              />
                            }
                            label={<Typography sx={{ color: currentTheme.text }}>Düşük Stok Bildirimi</Typography>}
                          />
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Tema Ayarları */}
                  <Grid item xs={12} md={6}>
                    <Card sx={{ borderRadius: "12px", border: `1px solid ${currentTheme.border}`, backgroundColor: currentTheme.card }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: currentTheme.text }}>
                          🎨 Tema Ayarları
                        </Typography>
                        <Stack spacing={2}>
                          <Box>
                            <Typography sx={{ fontSize: "12px", fontWeight: 700, mb: 1, color: currentTheme.textSecondary }}>
                              Tema
                            </Typography>
                            <TextField
                              fullWidth
                              size="small"
                              select
                              value={settingsForm?.theme || "light"}
                              onChange={(e) => setSettingsForm({ ...settingsForm, theme: e.target.value })}
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  backgroundColor: currentTheme.bgSecondary,
                                  color: currentTheme.text,
                                  "& fieldset": { borderColor: currentTheme.border },
                                },
                              }}
                            >
                              <MenuItem value="light">☀️ Açık Tema</MenuItem>
                              <MenuItem value="dark">🌙 Koyu Tema</MenuItem>
                            </TextField>
                          </Box>
                          <Alert severity="info" sx={{ mt: 2, backgroundColor: currentTheme.bgSecondary, color: currentTheme.text }}>
                            <Typography sx={{ fontSize: "12px", color: currentTheme.text }}>
                              ℹ️ Tema seçimi kaydedilir ve admin panelinde uygulanır.
                            </Typography>
                          </Alert>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Kaydet Butonu */}
                  <Grid item xs={12}>
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={savingSettings}
                      onClick={async () => {
                        try {
                          setSavingSettings(true);
                          await axios.put(`${apiUrl}/settings`, settingsForm, getAuthHeaders());
                          setSettings(settingsForm);
                          // Tema değişirse localStorage'a kaydet ve state'i güncelle
                          if (settingsForm.theme) {
                            localStorage.setItem("akay_admin_theme", settingsForm.theme);
                            setAdminTheme(settingsForm.theme);
                          }
                          toast.success("✅ Ayarlar kaydedildi!");
                        } catch (error) {
                          toast.error("❌ Ayarlar kaydedilemedi: " + error.message);
                        } finally {
                          setSavingSettings(false);
                        }
                      }}
                      sx={{
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: "16px",
                        py: 1.5,
                      }}
                    >
                      {savingSettings ? "Kaydediliyor..." : "💾 Ayarları Kaydet"}
                    </Button>
                  </Grid>

                  {/* Sistem Bilgileri */}
                  <Grid item xs={12}>
                    <Card sx={{ borderRadius: "12px", border: `1px solid ${currentTheme.border}`, backgroundColor: currentTheme.card }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: currentTheme.text }}>
                          ℹ️ Sistem Bilgileri
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={6} sm={3}>
                            <Typography sx={{ fontSize: "12px", color: currentTheme.textSecondary }}>Admin Hesabı</Typography>
                            <Typography sx={{ fontWeight: 700, color: currentTheme.text }}>admin / admin123</Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography sx={{ fontSize: "12px", color: currentTheme.textSecondary }}>Versiyon</Typography>
                            <Typography sx={{ fontWeight: 700, color: currentTheme.text }}>3.0.0 Pro</Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography sx={{ fontSize: "12px", color: currentTheme.textSecondary }}>Database</Typography>
                            <Typography sx={{ fontWeight: 700, color: currentTheme.text }}>MongoDB</Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography sx={{ fontSize: "12px", color: currentTheme.textSecondary }}>Durum</Typography>
                            <Typography sx={{ fontWeight: 700, color: "#10b981" }}>✓ Aktif</Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </motion.div>
            )}
          </>
        )}

        {/* Ürün Ekleme/Düzenleme Dialog */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: "16px",
              backgroundColor: currentTheme.bg,
            },
          }}
        >
          <DialogTitle
            sx={{
              fontWeight: 700,
              color: currentTheme.text,
              fontSize: "20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: currentTheme.bgSecondary,
              borderBottom: `1px solid ${currentTheme.border}`,
            }}
          >
            {dialogTitle}
            <IconButton
              onClick={handleCloseDialog}
              size="small"
              sx={{
                color: "#999",
                "&:hover": { backgroundColor: "#efefef" },
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ pt: 3, backgroundColor: currentTheme.bg }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {/* Resim Yükleme Bölümü */}
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 700,
                    color: currentTheme.text,
                    mb: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <ImageIcon sx={{ color: "#1a9b8e" }} />
                  Ürün Resmi
                </Typography>

                <Box
                  sx={{
                    backgroundColor: currentTheme.bgSecondary,
                    border: "2px dashed #1a9b8e",
                    borderRadius: "12px",
                    p: 3,
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      backgroundColor: currentTheme.bg,
                      borderColor: "#158577",
                    },
                  }}
                  component="label"
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    style={{ display: "none" }}
                  />

                  {imagePreview ? (
                    <Box sx={{ position: "relative" }}>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{
                          maxWidth: "100%",
                          maxHeight: "200px",
                          borderRadius: "8px",
                        }}
                      />
                      <IconButton
                        onClick={(e) => {
                          e.preventDefault();
                          handleRemoveImage();
                        }}
                        size="small"
                        sx={{
                          position: "absolute",
                          top: 5,
                          right: 5,
                          backgroundColor: "rgba(255,255,255,0.9)",
                          color: "#e74c3c",
                          "&:hover": { backgroundColor: "#fff" },
                        }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ) : (
                    <Box>
                      <CloudUploadIcon
                        sx={{
                          fontSize: 48,
                          color: "#1a9b8e",
                          mb: 1,
                        }}
                      />
                      <Typography sx={{ color: "#1a9b8e", fontWeight: 600 }}>
                        Resim Seçin veya Sürükleyin
                      </Typography>
                      <Typography sx={{ color: "#999", fontSize: "12px", mt: 0.5 }}>
                        PNG, JPG, GIF (Max 5MB)
                      </Typography>
                    </Box>
                  )}
                </Box>

                {imageFile && (
                  <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleUploadImage}
                      disabled={uploadingImage}
                      sx={{
                        backgroundColor: "#1a9b8e",
                        "&:hover": { backgroundColor: "#158577" },
                      }}
                    >
                      {uploadingImage ? "Yükleniyor..." : "Yükle"}
                    </Button>
                  </Box>
                )}
              </Box>

              <Divider sx={{ borderColor: "#e0e0e0" }} />

              {/* Temel Bilgiler */}
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 700,
                    color: currentTheme.text,
                    mb: 2,
                  }}
                >
                  Temel Bilgiler
                </Typography>

                <Stack spacing={2}>
                  <TextField
                    label="Ürün Adı"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    fullWidth
                    variant="outlined"
                    size="medium"
                    placeholder="Örn: Zesty Burger"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                        backgroundColor: "#fff",
                        "&:hover fieldset": { borderColor: "#1a9b8e" },
                        "&.Mui-focused fieldset": { borderColor: "#1a9b8e" },
                      },
                    }}
                  />

                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                    <TextField
                      label="Kategori"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      fullWidth
                      select
                      SelectProps={{ native: true }}
                      size="medium"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                          backgroundColor: "#fff",
                          "&:hover fieldset": { borderColor: "#1a9b8e" },
                          "&.Mui-focused fieldset": { borderColor: "#1a9b8e" },
                        },
                      }}
                    >
                      <option value="">Seçin...</option>
                      <option value="Burgers">Burgers</option>
                      <option value="Pizza">Pizza</option>
                      <option value="Salads">Salads</option>
                      <option value="Beverages">Beverages</option>
                      <option value="Desserts">Desserts</option>
                      <option value="Pasta">Pasta</option>
                    </TextField>

                    <TextField
                      label="Alt Kategori"
                      value={formData.subcategory}
                      onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                      fullWidth
                      size="medium"
                      placeholder="Opsiyonel"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                          backgroundColor: "#fff",
                          "&:hover fieldset": { borderColor: "#1a9b8e" },
                          "&.Mui-focused fieldset": { borderColor: "#1a9b8e" },
                        },
                      }}
                    />
                  </Box>

                  <TextField
                    label="Açıklama"
                    value={formData.desc}
                    onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                    fullWidth
                    multiline
                    rows={3}
                    variant="outlined"
                    placeholder="Ürünün detaylı açıklamasını yazın..."
                    size="medium"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                        backgroundColor: "#fff",
                        "&:hover fieldset": { borderColor: "#1a9b8e" },
                        "&.Mui-focused fieldset": { borderColor: "#1a9b8e" },
                      },
                    }}
                  />
                </Stack>
              </Box>

              <Divider sx={{ borderColor: "#e0e0e0" }} />

              {/* Fiyatlandırma */}
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 700,
                    color: currentTheme.text,
                    mb: 2,
                  }}
                >
                  Fiyatlandırma
                </Typography>

                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                  <TextField
                    label="Fiyat"
                    type="number"
                    inputProps={{ step: "0.01", min: "0" }}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || "" })}
                    fullWidth
                    size="medium"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AttachMoneyIcon sx={{ color: "#1a9b8e" }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                        backgroundColor: "#fff",
                        "&:hover fieldset": { borderColor: "#1a9b8e" },
                        "&.Mui-focused fieldset": { borderColor: "#1a9b8e" },
                      },
                    }}
                  />

                  <TextField
                    label="İndirim %"
                    type="number"
                    inputProps={{ step: "0.1", min: "0", max: "100" }}
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                    fullWidth
                    size="medium"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <DiscountIcon sx={{ color: "#1a9b8e" }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                        backgroundColor: "#fff",
                        "&:hover fieldset": { borderColor: "#1a9b8e" },
                        "&.Mui-focused fieldset": { borderColor: "#1a9b8e" },
                      },
                    }}
                  />
                </Box>

                {formData.price && formData.discount > 0 && (
                  <Alert
                    severity="info"
                    sx={{
                      mt: 2,
                      backgroundColor: "#e8f5e9",
                      color: "#1a9b8e",
                      borderRadius: "8px",
                      border: "1px solid #1a9b8e",
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      İndirimli Fiyat: ₺{(formData.price * (1 - formData.discount / 100)).toFixed(2)}
                    </Typography>
                  </Alert>
                )}
              </Box>

              <Divider sx={{ borderColor: "#e0e0e0" }} />

              {/* Stok Yönetimi */}
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 700,
                    color: currentTheme.text,
                    mb: 2,
                  }}
                >
                  📦 Stok Yönetimi
                </Typography>

                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.trackStock}
                      onChange={(e) => setFormData({ ...formData, trackStock: e.target.checked })}
                      sx={{
                        "& .MuiSwitch-switchBase.Mui-checked": {
                          color: "#1a9b8e",
                        },
                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                          backgroundColor: "#1a9b8e",
                        },
                      }}
                    />
                  }
                  label={formData.trackStock ? "✓ Stok Takibi Aktif" : "✗ Stok Takibi Kapalı"}
                  sx={{
                    backgroundColor: formData.trackStock ? "#e8f5e9" : "#ffebee",
                    px: 2,
                    py: 1,
                    borderRadius: "8px",
                    mb: 2,
                    m: 0,
                    width: "100%",
                  }}
                />

                {formData.trackStock && (
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                    <TextField
                      label="Stok Miktarı"
                      type="number"
                      inputProps={{ min: 0 }}
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                      fullWidth
                      size="medium"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">📦</InputAdornment>
                        ),
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                          backgroundColor: "#fff",
                          "&:hover fieldset": { borderColor: "#1a9b8e" },
                          "&.Mui-focused fieldset": { borderColor: "#1a9b8e" },
                        },
                      }}
                    />
                    <TextField
                      label="Kritik Stok Eşiği"
                      type="number"
                      inputProps={{ min: 0 }}
                      value={formData.lowStockThreshold}
                      onChange={(e) => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) || 0 })}
                      fullWidth
                      size="medium"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">⚠️</InputAdornment>
                        ),
                      }}
                      helperText="Bu değerin altında uyarı verir"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                          backgroundColor: "#fff",
                          "&:hover fieldset": { borderColor: "#1a9b8e" },
                          "&.Mui-focused fieldset": { borderColor: "#1a9b8e" },
                        },
                      }}
                    />
                  </Box>
                )}

                {formData.trackStock && formData.stock <= formData.lowStockThreshold && (
                  <Alert
                    severity="warning"
                    sx={{
                      mt: 2,
                      backgroundColor: "#fff3e0",
                      color: "#e65100",
                      borderRadius: "8px",
                      border: "1px solid #ff9800",
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      ⚠️ Düşük stok uyarısı! Stok: {formData.stock}, Eşik: {formData.lowStockThreshold}
                    </Typography>
                  </Alert>
                )}
              </Box>

              {/* Durum */}
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 700,
                    color: currentTheme.text,
                    mb: 2,
                  }}
                >
                  Durum
                </Typography>

                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isAvailable}
                      onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                      sx={{
                        "& .MuiSwitch-switchBase.Mui-checked": {
                          color: "#1a9b8e",
                        },
                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                          backgroundColor: "#1a9b8e",
                        },
                      }}
                    />
                  }
                  label={formData.isAvailable ? "✓ Mevcut" : "✗ Tükendi"}
                  sx={{
                    backgroundColor: formData.isAvailable ? "#e8f5e9" : "#ffebee",
                    px: 2,
                    py: 1,
                    borderRadius: "8px",
                    m: 0,
                  }}
                />
              </Box>
            </Box>
          </DialogContent>

          <DialogActions
            sx={{
              p: 2.5,
              gap: 1.5,
              backgroundColor: "#f8f9fa",
              borderTop: "1px solid #e0e0e0",
            }}
          >
            <Button
              onClick={handleCloseDialog}
              sx={{
                color: "#666",
                borderRadius: "8px",
                fontWeight: 600,
                "&:hover": { backgroundColor: "#efefef" },
              }}
            >
              İptal
            </Button>
            <Button
              onClick={handleSaveItem}
              variant="contained"
              sx={{
                backgroundColor: "#1a9b8e",
                borderRadius: "8px",
                fontWeight: 600,
                px: 3,
                "&:hover": { backgroundColor: "#158577" },
              }}
            >
              Kaydet
            </Button>
          </DialogActions>
        </Dialog>

        {/* Sipariş Detayları Dialog */}
        <Dialog
          open={openOrderDetails}
          onClose={handleCloseOrderDetails}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: "16px",
              backgroundColor: currentTheme.bg,
            }
          }}
        >
          <DialogTitle
            sx={{
              fontWeight: 700,
              color: currentTheme.text,
              fontSize: "18px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: currentTheme.bgSecondary,
              borderBottom: `1px solid ${currentTheme.border}`,
            }}
          >
            Sipariş Detayları
            <IconButton
              onClick={handleCloseOrderDetails}
              size="small"
              sx={{
                color: currentTheme.textSecondary,
                "&:hover": { backgroundColor: currentTheme.bgSecondary },
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ pt: 3, backgroundColor: currentTheme.bg }}>
            {selectedOrder && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                {/* Sipariş Bilgileri */}
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: currentTheme.text, mb: 1.5 }}>
                    Sipariş Bilgileri
                  </Typography>
                  <Stack spacing={1} sx={{ backgroundColor: currentTheme.bgSecondary, p: 2, borderRadius: "8px", border: `1px solid ${currentTheme.border}` }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" sx={{ color: "#666" }}>
                        Sipariş ID:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "#1a9b8e" }}>
                        #{selectedOrder._id.slice(-6).toUpperCase()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" sx={{ color: "#666" }}>
                        Masa:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {selectedOrder.tableNumber ? `Masa ${selectedOrder.tableNumber}` : "N/A"}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" sx={{ color: "#666" }}>
                        Müşteri:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {selectedOrder.customerName || "Bilinmeyen"}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                        Toplam:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "#1a9b8e" }}>
                        ₺{selectedOrder.total?.toFixed(2) || "0.00"}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                        Zaman:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: currentTheme.text }}>
                        {new Date(selectedOrder.createdAt).toLocaleString("tr-TR")}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                {/* Ürünler Listesi */}
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: currentTheme.text, mb: 1.5 }}>
                    Sipariş Edilen Ürünler ({selectedOrder.items?.length || 0})
                  </Typography>
                  <Stack spacing={1} sx={{ backgroundColor: currentTheme.bgSecondary, p: 2, borderRadius: "8px", border: `1px solid ${currentTheme.border}`, maxHeight: "200px", overflowY: "auto" }}>
                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map((item, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            paddingBottom: 1,
                            borderBottom: idx < selectedOrder.items.length - 1 ? `1px solid ${currentTheme.border}` : "none",
                          }}
                        >
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: currentTheme.text }}>
                              {item.title || "Bilinmeyen Ürün"}
                            </Typography>
                            <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                              x{item.quantity}
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: "#1a9b8e" }}>
                            ₺{(item.price * item.quantity).toFixed(2)}
                          </Typography>
                        </Box>
                      ))
                    ) : (
                      <Typography variant="body2" sx={{ color: currentTheme.textSecondary, textAlign: "center", py: 2 }}>
                        Ürün bilgisi yok
                      </Typography>
                    )}
                  </Stack>
                </Box>

                {/* Notlar */}
                {selectedOrder.notes && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: currentTheme.text, mb: 1.5 }}>
                      Notlar
                    </Typography>
                    <Typography variant="body2" sx={{ backgroundColor: currentTheme.bgSecondary, p: 2, borderRadius: "8px", border: `1px solid ${currentTheme.border}`, color: currentTheme.textSecondary }}>
                      {selectedOrder.notes}
                    </Typography>
                  </Box>
                )}

                {/* Durum Güncelleme */}
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: currentTheme.text, mb: 1.5 }}>
                    Durumu Güncelle
                  </Typography>
                  <Stack spacing={1.5}>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 1,
                      }}
                    >
                      {["pending", "confirmed", "prepared", "served", "cancelled"].map((status) => (
                        <Button
                          key={status}
                          variant={newStatus === status ? "contained" : "outlined"}
                          onClick={() => setNewStatus(status)}
                          sx={{
                            backgroundColor: newStatus === status 
                              ? (status === "cancelled" ? "#ef4444" : "#1a9b8e") 
                              : "transparent",
                            borderColor: status === "cancelled" ? "#ef4444" : "#1a9b8e",
                            color: newStatus === status 
                              ? "#fff" 
                              : (status === "cancelled" ? "#ef4444" : "#1a9b8e"),
                            fontWeight: 600,
                            textTransform: "capitalize",
                            "&:hover": {
                              backgroundColor: newStatus === status 
                                ? (status === "cancelled" ? "#dc2626" : "#158577") 
                                : (status === "cancelled" ? "#fef2f2" : "#f0fffe"),
                            },
                          }}
                        >
                          {status === "pending"
                            ? "Beklemede"
                            : status === "confirmed"
                            ? "Onaylandı"
                            : status === "prepared"
                            ? "Hazırlandı"
                            : status === "served"
                            ? "Servis Edildi"
                            : "İptal Edildi"}
                        </Button>
                      ))}
                    </Box>
                  </Stack>
                </Box>
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ backgroundColor: currentTheme.bgSecondary, borderTop: `1px solid ${currentTheme.border}`, p: 2 }}>
            <Button
              onClick={handleCloseOrderDetails}
              sx={{ color: currentTheme.textSecondary }}
            >
              İptal
            </Button>
            <Button
              onClick={handleUpdateOrderStatus}
              variant="contained"
              disabled={updatingOrderId === selectedOrder?._id || newStatus === selectedOrder?.status}
              sx={{
                backgroundColor: "#1a9b8e",
                "&:hover": { backgroundColor: "#158577" },
                "&:disabled": { backgroundColor: "#ccc" },
              }}
            >
              {updatingOrderId === selectedOrder?._id ? "Güncelleniyor..." : "Durumu Kaydet"}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </div>
  );

};

export default AdminDashboard;
