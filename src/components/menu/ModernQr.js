import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Chip,
  Box,
  TextField,
  CircularProgress,
  Container,
  Grid,
  Button,
  Dialog,
  DialogContent,
  Divider,
  IconButton,
  DialogTitle,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  TableContainer,
  Alert,
} from "@mui/material";
import {
  Search as SearchIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Restaurant as RestaurantIcon,
  Delete as DeleteIcon,
  ShoppingCart as ShoppingCartIcon,
  Payment as PaymentIcon,
} from "@mui/icons-material";
import axios from "axios";
import { toast } from "react-toastify";
import { useSearchParams } from "react-router-dom";
import "./ModernQr.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "../chat/AIMenuChat.css";

// Get dynamic API URL - Railway backend URL for production, localhost for local dev
const getApiUrl = () => {
  // Production'da Railway backend URL'i kullan
  if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    // Environment variable'dan Railway backend URL al
    return process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api/v1` : "";
  }
  // Local development
  return `http://localhost:3800/api/v1`;
};

const ModernQr = () => {
  const [searchParams] = useSearchParams();
  const tableNumber = searchParams.get("table") || "";

  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [categories, setCategories] = useState(["Tümü"]);
  const [selectedCategory, setSelectedCategory] = useState("Tümü");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // Ürün seçildiğinde miktarı 1'e sıfırla
  const handleSelectItem = (item) => {
    setQuantity(1);
    setSelectedItem(item);
  };
  const [cart, setCart] = useState([]);
  const [openCart, setOpenCart] = useState(false);
  const [customerEmail, setCustomerEmail] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);
  const [openSuccess, setOpenSuccess] = useState(false);
  const [settings, setSettings] = useState(null);
  const [tableError, setTableError] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("akay_theme") || "light");
  
  // Settings ilk yükleme - localStorage cache'den isOpen hesaplama (lazy initialization)
  const [isOpen, setIsOpen] = useState(() => {
    const cachedSettings = localStorage.getItem("qor_settings");
    if (cachedSettings) {
      try {
        const parsed = JSON.parse(cachedSettings);
        // Inline business hours check - same logic as checkBusinessHours
        if (!parsed?.businessHours) return true;
        if (parsed.businessHours.is247) return true;
        if (parsed.businessHours.isEnabled === false) return false;
        if (!parsed.businessHours.open || !parsed.businessHours.close) return true;
        
        const timezone = parsed.businessHours.timezone || "Europe/Istanbul";
        const now = new Date();
        let localTime;
        try {
          const options = { timeZone: timezone, hour: 'numeric', minute: 'numeric', hour12: false };
          const formatter = new Intl.DateTimeFormat('en-US', options);
          const parts = formatter.formatToParts(now);
          const hours = parseInt(parts.find(p => p.type === 'hour').value);
          const minutes = parseInt(parts.find(p => p.type === 'minute').value);
          localTime = hours * 60 + minutes;
        } catch (e) {
          localTime = now.getHours() * 60 + now.getMinutes();
        }
        
        const [openHour, openMin] = parsed.businessHours.open.split(":").map(Number);
        const [closeHour, closeMin] = parsed.businessHours.close.split(":").map(Number);
        const openTime = openHour * 60 + openMin;
        const closeTime = closeHour * 60 + closeMin;
        
        let isOpenNow;
        if (openTime <= closeTime) {
          isOpenNow = localTime >= openTime && localTime < closeTime;
        } else {
          isOpenNow = localTime >= openTime || localTime < closeTime;
        }
        
        console.log(`🕐 Initial isOpen from cache: timezone=${timezone}, localTime=${localTime}, open=${openTime}, close=${closeTime}, isOpen=${isOpenNow}`);
        return isOpenNow;
      } catch (e) {
        console.warn("⚠️ Cache parse error in initial state");
        return true;
      }
    }
    return true;
  });

  // AI Chat States
  const [openChat, setOpenChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      content: "Merhaba! Ben AI asistanınızım. Menümüz hakkında sorular sorabilir, öneriler alabilirsiniz. Size nasıl yardımcı olabilirim?"
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(null);
  const chatEndRef = useRef(null);

  const apiUrl = getApiUrl();
  const apiUrlVer = apiUrl;

  // AI Chat API handler
  const handleChatSubmit = async (message) => {
    const msgToSend = message || chatInput;
    if (!msgToSend.trim() || chatLoading) return;

    // User message
    const userMsg = { role: "user", content: msgToSend };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    // Scroll to bottom
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

    try {
      const history = chatMessages.map(m => ({ role: m.role, content: m.content }));
      const res = await fetch(`${apiUrl}/ai/menu-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msgToSend, conversationHistory: history.slice(0, 10) })
      });
      const data = await res.json();
      
      if (res.ok) {
        setChatMessages(prev => [...prev, { role: "assistant", content: data.response }]);
        setAiAvailable(true);
      } else {
        throw new Error(data.message || "AI hatası");
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { role: "assistant", content: `Hata: ${err.message}` }]);
    } finally {
      setChatLoading(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  // Check AI availability
  useEffect(() => {
    fetch(`${apiUrl}/ai/status`)
      .then(res => res.json())
      .then(data => setAiAvailable(data.available))
      .catch(() => setAiAvailable(false));
  }, [apiUrl]);

  // Çalışma saati kontrolü
  const checkBusinessHours = (settings) => {
    // Eğer businessHours ayarı yoksa veya isEnabled false ise (manuel kapalı)
    if (!settings?.businessHours) {
      return true; // Ayar yoksa açık kabul et
    }
    
    // 7/24 açık modu
    if (settings.businessHours.is247) {
      return true;
    }
    
    // Manuel kapalı modu (isEnabled false)
    if (settings.businessHours.isEnabled === false) {
      return false;
    }
    
    if (!settings.businessHours.open || !settings.businessHours.close) {
      return true; // Saat ayarlanmamışsa açık kabul et
    }
    
    // Timezone desteği
    const timezone = settings.businessHours.timezone || "Europe/Istanbul";
    const now = new Date();
    
    // Timezone'a göre saat hesaplama
    let localTime;
    try {
      const options = { timeZone: timezone, hour: 'numeric', minute: 'numeric', hour12: false };
      const formatter = new Intl.DateTimeFormat('en-US', options);
      const parts = formatter.formatToParts(now);
      const hours = parseInt(parts.find(p => p.type === 'hour').value);
      const minutes = parseInt(parts.find(p => p.type === 'minute').value);
      localTime = hours * 60 + minutes;
    } catch (e) {
      // Timezone hatası olursa sistem saatini kullan
      localTime = now.getHours() * 60 + now.getMinutes();
    }
    
    const [openHour, openMin] = settings.businessHours.open.split(":").map(Number);
    const [closeHour, closeMin] = settings.businessHours.close.split(":").map(Number);
    
    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;
    
    // Gece yarısı geçişi (örn: 22:00 - 06:00)
    let isOpen;
    if (openTime <= closeTime) {
      // Normal aralık (örn: 09:00 - 23:00)
      isOpen = localTime >= openTime && localTime < closeTime;
    } else {
      // Gece yarısı geçişi (örn: 22:00 - 06:00)
      isOpen = localTime >= openTime || localTime < closeTime;
    }
    
    console.log(`🕐 CheckBusinessHours: timezone=${timezone}, localTime=${localTime}, open=${openTime}, close=${closeTime}, isOpen=${isOpen}`);
    return isOpen;
  };

  // Theme colors
  const themeColors = {
    light: {
      bg: "#ffffff",
      text: "#0d1b2a",
      bgSecondary: "#f8f9fa",
      border: "#e0e0e0",
      chip: "#e8f5e9",
      chipText: "#2e7d32",
    },
    dark: {
      bg: "#0d1b2a",
      text: "#ffffff",
      bgSecondary: "#666",
      border: "#666",
      chip: "#2e7d32",
      chipText: "#e8f5e9",
    },
  };
  const colors = themeColors[theme];

  useEffect(() => {
    const fetchSettings = async () => {
      // LocalStorage cache kontrolü
      const cachedSettings = localStorage.getItem("qor_settings");
      const cacheTimestamp = localStorage.getItem("qor_settings_timestamp");
      const CACHE_DURATION = 1 * 60 * 1000; // 1 DAKİKA cache süresi - Daha hızlı güncellenme için düşürüldü

      // Eğer cache var ve süresi dolmamışsa cached veriyi kullan
      if (cachedSettings && cacheTimestamp && (Date.now() - parseInt(cacheTimestamp)) < CACHE_DURATION) {
        try {
          const parsedSettings = JSON.parse(cachedSettings);
          setSettings(parsedSettings);
          
          // Theme sync
          if (parsedSettings.theme) {
            localStorage.setItem("akay_theme", parsedSettings.theme);
            setTheme(parsedSettings.theme);
          }

          // Çalışma saati kontrolü - cache'den yüklenirken de yap
          const openStatus = checkBusinessHours(parsedSettings);
          setIsOpen(openStatus);

          // Masa validasyonu
          if (tableNumber) {
            const tableNum = parseInt(tableNumber);
            const isInactive = parsedSettings.tableSettings?.inactiveTables?.includes(tableNum);
            const isOutOfRange = tableNum > parsedSettings.tableSettings?.totalTables;
            
            if (isInactive || isOutOfRange) {
              setTableError(true);
            }
          }
          
          console.log("✅ Settings loaded from cache");
          return;
        } catch (e) {
          console.warn("⚠️ Cache parse error, fetching fresh data");
        }
      }

      // Cache yok veya süresi dolmuşsa backend'den çek
      try {
        const response = await axios.get(`${apiUrl}/settings`);
        console.log("📡 Settings response:", response.data);
        setSettings(response.data);
        
        // Cache'e kaydet
        localStorage.setItem("qor_settings", JSON.stringify(response.data));
        localStorage.setItem("qor_settings_timestamp", Date.now().toString());
        
        // Sync theme from backend
        if (response.data.theme) {
          localStorage.setItem("akay_theme", response.data.theme);
          setTheme(response.data.theme);
        }
        
        // Çalışma saati kontrolü - settings state'i güncellendikten sonra
        const openStatus = checkBusinessHours(response.data);
        console.log("🚪 Open status after fetch:", openStatus);
        setIsOpen(openStatus);
        
        // Masa validasyonu
        if (tableNumber) {
          const tableNum = parseInt(tableNumber);
          const isInactive = response.data.tableSettings?.inactiveTables?.includes(tableNum);
          const isOutOfRange = tableNum > response.data.tableSettings?.totalTables;
          
          if (isInactive || isOutOfRange) {
            setTableError(true);
            toast.error(
              isOutOfRange 
                ? `Masa ${tableNumber} mevcut değil (Max: Masa ${response.data.tableSettings?.totalTables})`
                : `Masa ${tableNumber} şu anda kapalı`
            );
          }
        }

        console.log("✅ Settings loaded from server and cached");
      } catch (error) {
        console.error("❌ Settings fetch error:", error.message);
        
        // Hata durumunda cache'de veri varsa onu kullan
        if (cachedSettings) {
          try {
            const parsedCached = JSON.parse(cachedSettings);
            setSettings(parsedCached);
            // Çalışma saati kontrolü - hata durumunda da yap
            const openStatus = checkBusinessHours(parsedCached);
            setIsOpen(openStatus);
            console.log("✅ Used cached settings after network error");
          } catch (e) {}
        }
      }
    };
    
    fetchSettings();
  }, [apiUrl, tableNumber]);
  
  // Settings her değiştiğinde çalışma saati kontrolü yap
  useEffect(() => {
    if (settings) {
      const openStatus = checkBusinessHours(settings);
      console.log(`🚪 isOpen updated: ${openStatus}`);
      setIsOpen(openStatus);
    }
  }, [settings]);
  
  // Her dakika çalışma saati kontrolü yap
  useEffect(() => {
    const interval = setInterval(() => {
      if (settings) {
        const openStatus = checkBusinessHours(settings);
        setIsOpen(openStatus);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [settings]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${apiUrl}/items`);
        const itemsWithImage = response.data.map((item) => ({
          ...item,
          image: item.img || item.image || "",
        }));
        setItems(itemsWithImage);
        const uniqueCategories = ["Tümü", ...new Set(itemsWithImage.map((item) => item.category))];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error("❌ Fetch error:", error.message);
        toast.error(`Menü yüklenemedi: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [apiUrl]);

  useEffect(() => {
    let filtered = items;
    if (selectedCategory !== "Tümü") {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.desc.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredItems(filtered);
  }, [items, selectedCategory, searchQuery]);

  const handleAddToCart = (item) => {
    // ⬇️ STOK KONTROLÜ - Sepete eklerken stok yeterliliğini kontrol et
    if (item.trackStock) {
      const currentStock = item.stock || 0;
      const existingItem = cart.find((cartItem) => cartItem._id === item._id);
      const currentCartQty = existingItem ? existingItem.quantity : 0;
      const newTotalQty = currentCartQty + quantity;
      
      // Eğer mevcut stok + sepetteki miktar < istenen miktar → uyarı ver
      if (currentStock < newTotalQty) {
        if (currentStock === 0) {
          toast.error(`❌ ${item.title} stokta tükendi!`);
          return;
        }
        toast.warning(
          <div>
            <strong>⚠️ Stok Yetersiz!</strong><br/>
            <span>{item.title}</span><br/>
            <span style={{ fontSize: "12px", opacity: 0.9 }}>
              Mevcut stok: <strong>{currentStock} adet</strong><br/>
              Sepette zaten: <strong>{currentCartQty} adet</strong><br/>
              Talep edilen: <strong>{newTotalQty} adet</strong>
            </span>
          </div>,
          { autoClose: 5000 }
        );
        return;
      }
    }
    
    const existingItem = cart.find((cartItem) => cartItem._id === item._id);
    if (existingItem) {
      setCart(
        cart.map((cartItem) =>
          cartItem._id === item._id
            ? { ...cartItem, quantity: cartItem.quantity + quantity }
            : cartItem
        )
      );
    } else {
      setCart([...cart, { ...item, quantity }]);
    }
    toast.success(`${item.title} sepete eklendi`);
    setSelectedItem(null);
    setQuantity(1);
  };

  const getCategoryEmoji = (category) => {
    const emojiMap = {
      Burgers: "🍔",
      Pizza: "🍕",
      Salads: "🥗",
      Beverages: "☕",
      Desserts: "🍰",
      Pasta: "🍝",
    };
    return emojiMap[category] || "🍽️";
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => {
      const discountedPrice = item.price * (1 - (item.discount || 0) / 100);
      return sum + discountedPrice * item.quantity;
    }, 0);
  };

  const handleRemoveFromCart = (id) => {
    setCart(cart.filter((item) => item._id !== id));
    toast.info("Ürün sepetten çıkarıldı");
  };

  const handleSubmitOrder = async () => {
    if (!tableNumber) {
      toast.error("❌ Lütfen geçerli bir masa numarası ile erişin");
      return;
    }
    
    if (tableError) {
      toast.error("❌ Bu masa şu anda kullanılamıyor");
      return;
    }
    
    if (cart.length === 0) {
      toast.error("Sepet boş");
      return;
    }

    const total = calculateTotal();
    if (settings?.minimumOrder && total < settings.minimumOrder) {
      toast.error(`Minimum sipariş tutarı: ₺${settings.minimumOrder}`);
      return;
    }

    try {
      setSubmittingOrder(true);
      const orderData = {
        customerName: `Masa ${tableNumber}`,
        customerEmail,
        tableNumber,
        items: cart.map((item) => ({
          menuItemId: item._id,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          discount: item.discount || 0,
        })),
        total: total,
        notes: orderNotes,
        status: "pending",
      };

      const response = await axios.post(`${apiUrl}/orders`, orderData);
      
      // Success modal göster
      setSuccessOrder({
        id: response.data._id.slice(-6).toUpperCase(),
        tableNumber,
        total: response.data.total,
        itemCount: cart.length,
      });
      setOpenSuccess(true);
      setOpenCart(false);
      
      // 3 saniye sonra success modal'ı kapat
      setTimeout(() => {
        setOpenSuccess(false);
        // Reset
        setCart([]);
        setCustomerEmail("");
        setOrderNotes("");
        setSuccessOrder(null);
      }, 3000);
      
    } catch (error) {
      toast.error("Sipariş gönderilemedi: " + (error.response?.data?.message || error.message));
      console.error("Order error:", error);
    } finally {
      setSubmittingOrder(false);
    }
  };

  return (
    <div className="modern-qr-container" style={{ backgroundColor: colors.bg, color: colors.text, minHeight: "100vh", transition: "all 0.3s ease" }}>
      {/* Professional Header */}
      <motion.div
        className="qr-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ backgroundColor: colors.bgSecondary, borderBottom: `1px solid ${colors.border}`, transition: "all 0.3s ease" }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 2 }}>
            {/* Logo & Brand - Dinamik from Settings */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box sx={{ fontSize: "32px" }}>🍽️</Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: colors.text, lineHeight: 1.2 }}>
                  {settings?.restaurantName || "akay"}
                </Typography>
                <Typography variant="caption" sx={{ color: "#1a9b8e", fontWeight: 600 }}>
                  {settings?.slogan || "Kalitelinin adresi"}
                </Typography>
              </Box>
            </Box>

            {/* Status Badge - Dinamik Çalışma Saati Gösterimi */}
            <Box sx={{ textAlign: "right" }}>
              <Chip
                label={isOpen ? "🟢 Açık" : "🔴 Kapalı"}
                sx={{
                  backgroundColor: isOpen ? "#e8f5e9" : "#fef2f2",
                  color: isOpen ? "#2e7d32" : "#dc2626",
                  fontWeight: 600,
                  fontSize: "12px",
                }}
              />
            </Box>
          </Box>
        </Container>
      </motion.div>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* TABLE ERROR - Show this if table is invalid */}
        {tableError && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Box
              sx={{
                textAlign: "center",
                py: 6,
                backgroundColor: "#fef2f2",
                border: "2px solid #fca5a5",
                borderRadius: "16px",
                mb: 4,
              }}
            >
              <Box sx={{ fontSize: "80px", mb: 2 }}>❌</Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "#dc2626", mb: 1 }}>
                {!tableNumber
                  ? "Masa Numarası Bulunamadı"
                  : settings?.tableSettings?.inactiveTables?.includes(parseInt(tableNumber))
                  ? `Masa ${tableNumber} Şu Anda Kapalı`
                  : `Masa ${tableNumber} Mevcut Değil`}
              </Typography>
              <Typography sx={{ color: "#991b1b", mb: 3 }}>
                {!tableNumber
                  ? "Lütfen geçerli bir QR kodu ile erişin"
                  : settings?.tableSettings?.inactiveTables?.includes(parseInt(tableNumber))
                  ? "Bu masa bakım altında veya kullanılamıyor"
                  : `Maksimum masa sayısı: ${settings?.tableSettings?.totalTables}`}
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={() => window.location.href = "/"}
                sx={{
                  backgroundColor: "#dc2626",
                  color: "#fff",
                  fontWeight: 700,
                  "&:hover": { backgroundColor: "#b91c1c" },
                }}
              >
                ← Geri Dön
              </Button>
            </Box>
          </motion.div>
        )}

        {/* MENU - Only show if table is valid and within business hours */}
        {!tableError && isOpen ? (
          <>
        {/* Arama */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <TextField
            fullWidth
            placeholder="Yemek ara..."
            variant="outlined"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1.5, color: colors.textSecondary, fontSize: 20 }} />,
            }}
            sx={{
              mb: 3,
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                backgroundColor: colors.bgSecondary,
                border: `1px solid ${colors.border}`,
                transition: "all 0.2s",
                "&:hover": {
                  backgroundColor: colors.bgSecondary,
                  borderColor: colors.border,
                },
                "&.Mui-focused": {
                  backgroundColor: colors.bg,
                  borderColor: "#1a9b8e",
                  boxShadow: "0 0 0 3px rgba(26, 155, 142, 0.1)",
                },
              },
              "& .MuiOutlinedInput-input": {
                fontSize: "14px",
                color: colors.text,
                "&::placeholder": {
                  color: colors.textSecondary,
                  opacity: 1,
                },
              },
            }}
          />
        </motion.div>

        {/* Kategoriler - Material UI Chips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          style={{ marginBottom: 32 }}
        >
          <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: "12px", mb: 1.5, fontWeight: 600 }}>
            KATEGORİLER
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {categories.map((category, index) => (
              <Chip
                key={category}
                label={category}
                clickable
                onClick={() => setSelectedCategory(category)}
                variant={selectedCategory === category ? "filled" : "outlined"}
                sx={{
                  borderRadius: "20px",
                  backgroundColor: selectedCategory === category ? "#1a9b8e" : "transparent",
                  color: selectedCategory === category ? "#fff" : colors.text,
                  borderColor: selectedCategory === category ? "#1a9b8e" : colors.border,
                  fontWeight: 500,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: selectedCategory === category ? "#158577" : colors.bgSecondary,
                    transform: "translateY(-2px)",
                  },
                }}
              />
            ))}
          </Box>
        </motion.div>

        {/* Loading */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress size={40} sx={{ color: "#1a9b8e" }} />
          </Box>
        ) : filteredItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Box sx={{ textAlign: "center", py: 8 }}>
              <Typography variant="body1" sx={{ color: colors.textSecondary }}>
                Sonuç bulunamadı
              </Typography>
            </Box>
          </motion.div>
        ) : (
          /* Grid */
          <Grid container spacing={2}>
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item, index) => (
                <Grid item xs={12} sm={6} md={4} key={item._id}>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card
                      className="menu-card"
                      onClick={() => handleSelectItem(item)}
                      sx={{
                        height: "100%",
                        cursor: "pointer",
                        borderRadius: "12px",
                        border: `1px solid ${colors.border}`,
                        backgroundColor: colors.bg,
                        transition: "all 0.3s cubic-bezier(0.2, 0.6, 0.3, 1)",
                        "&:hover": {
                          borderColor: "#1a9b8e",
                          boxShadow: "0 8px 24px rgba(26, 155, 142, 0.12)",
                          transform: "translateY(-2px)",
                        },
                      }}
                    >
                      {/* Image or Emoji Header */}
                      {item.image && item.image.trim() ? (
                        <CardMedia
                          component="img"
                          height="140"
                          image={item.image}
                          alt={item.title}
                          sx={{
                            objectFit: "cover",
                            backgroundColor: colors.bgSecondary,
                          }}
                          onError={(e) => {
                            e.target.style.display = "none";
                            if (e.target.nextSibling) {
                              e.target.nextSibling.style.display = "flex";
                            }
                          }}
                        />
                      ) : null}
                      {/* Fallback Icon */}
                      <Box
                        id="image-fallback"
                        sx={{
                          height: 140,
                          backgroundColor: colors.bgSecondary,
                          display: item.image && item.image.trim() ? "none" : "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderBottom: `1px solid ${colors.border}`,
                          transition: "transform 0.2s",
                          flexDirection: "column",
                          gap: 1,
                        }}
                      >
                        <RestaurantIcon sx={{ fontSize: 56, color: "#1a9b8e", opacity: 0.6 }} />
                        <Typography sx={{ fontSize: "12px", color: colors.textSecondary }}>
                          Resim Yok
                        </Typography>
                      </Box>

                      <CardContent sx={{ p: 2 }}>
                        {/* Title */}
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 600,
                            color: colors.text,
                            mb: 0.5,
                            fontSize: "15px",
                          }}
                        >
                          {item.title}
                        </Typography>

                        {/* Description */}
                        <Typography
                          variant="caption"
                          sx={{
                            color: colors.textSecondary,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            mb: 1.5,
                            fontSize: "12px",
                          }}
                        >
                          {item.desc}
                        </Typography>

                        {/* Badges */}
                        <Box sx={{ display: "flex", gap: 0.5, mb: 1.5, flexWrap: "wrap" }}>
                          <Chip
                            label={item.category}
                            size="small"
                            sx={{
                              height: 24,
                              backgroundColor: colors.bgSecondary,
                              color: colors.text,
                              fontSize: "11px",
                              fontWeight: 500,
                            }}
                          />
                          {item.discount > 0 && (
                            <Chip
                              label={`-%${item.discount}`}
                              size="small"
                              sx={{
                                height: 24,
                                backgroundColor: "#ffebee",
                                color: "#c62828",
                                fontSize: "11px",
                                fontWeight: 600,
                              }}
                            />
                          )}
                          {item.popularity > 0 && (
                            <Chip
                              label={`⭐ ${item.popularity}`}
                              size="small"
                              sx={{
                                height: 24,
                                backgroundColor: "#fff3e0",
                                color: "#e65100",
                                fontSize: "11px",
                                fontWeight: 500,
                              }}
                            />
                          )}
                        </Box>

                        {/* Price */}
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                          <Box>
                            {item.discount > 0 ? (
                              <>
                                <Typography
                                  sx={{
                                    fontSize: "12px",
                                    color: colors.textSecondary,
                                    textDecoration: "line-through",
                                  }}
                                >
                                  ₺{item.price}
                                </Typography>
                                <Typography
                                  sx={{
                                    fontSize: "16px",
                                    fontWeight: 700,
                                    color: "#1a9b8e",
                                  }}
                                >
                                  ₺{(item.price * (1 - item.discount / 100)).toFixed(2)}
                                </Typography>
                              </>
                            ) : (
                              <Typography
                                sx={{
                                  fontSize: "16px",
                                  fontWeight: 700,
                                  color: colors.text,
                                }}
                              >
                                ₺{item.price}
                              </Typography>
                            )}
                          </Box>

                          <Typography
                            sx={{
                              fontSize: "12px",
                              color: item.isAvailable ? colors.textSecondary : "#c62828",
                              fontWeight: 500,
                            }}
                          >
                            {item.isAvailable ? "Mevcut" : "Tükendi"}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </AnimatePresence>
          </Grid>
        )}
        </>
        ) : null}

        {/* CLOSED MESSAGE - Show when outside business hours */}
        {!tableError && !isOpen && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Box
              sx={{
                textAlign: "center",
                py: 6,
                backgroundColor: "#fef2f2",
                border: "2px solid #fca5a5",
                borderRadius: "16px",
                mb: 4,
              }}
            >
              <Box sx={{ fontSize: "80px", mb: 2 }}>😴</Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "#dc2626", mb: 1 }}>
                Şu Anda Kapalıyız
              </Typography>
              <Typography sx={{ color: "#991b1b", mb: 2 }}>
                Restoranımız şu anda hizmet dışıdır.
              </Typography>
              <Box sx={{ 
                backgroundColor: "#fff3cd", 
                border: "1px solid #ffc107", 
                borderRadius: "8px", 
                p: 2, 
                display: "inline-block",
                mb: 2
              }}>
                <Typography sx={{ color: "#856404", fontWeight: 600 }}>
                  ⏰ Çalışma Saatleri
                </Typography>
                <Typography sx={{ color: "#856404", fontSize: "14px" }}>
                  {settings?.businessHours?.open || "10:00"} - {settings?.businessHours?.close || "22:00"}
                </Typography>
              </Box>
              <Typography sx={{ color: "#991b1b", fontSize: "14px" }}>
                Lütfen belirtilen saatler içinde tekrar deneyin.
              </Typography>
            </Box>
          </motion.div>
        )}
      </Container>

      {/* AI Chat Button - Fixed Position */}
      <button
        onClick={() => setOpenChat(!openChat)}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 9999,
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          backgroundColor: openChat ? "#6b7280" : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          background: openChat ? "#6b7280" : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 20px rgba(99, 102, 241, 0.4)",
          transition: "all 0.3s ease",
        }}
      >
        {openChat ? (
          <span style={{ fontSize: "24px", color: "#fff" }}>✕</span>
        ) : (
          <span style={{ fontSize: "28px" }}>💬</span>
        )}
      </button>

      {/* AI Chat Popup - Fixed Position */}
      {openChat && (
        <div
          style={{
            position: "fixed",
            bottom: "90px",
            right: "24px",
            zIndex: 9998,
            width: "380px",
            height: "520px",
            backgroundColor: "#fff",
            borderRadius: "16px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Chat Header */}
          <div
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              padding: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                }}
              >
                🤖
              </div>
              <div>
                <div style={{ color: "#fff", fontWeight: 600, fontSize: "14px" }}>
                  AI Asistan
                </div>
                <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "11px" }}>
                  {aiAvailable === null ? "Yükleniyor..." : aiAvailable ? "Çevrimiçi" : "Çevrimdışı"}
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpenChat(false)}
              style={{
                background: "none",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                fontSize: "20px",
              }}
            >
              ✕
            </button>
          </div>

          {/* Chat Messages */}
          <div
            ref={chatEndRef}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px",
              backgroundColor: "#f9fafb",
            }}
          >
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    maxWidth: "80%",
                    padding: "12px 16px",
                    borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    backgroundColor: msg.role === "user" ? "#6366f1" : "#fff",
                    color: msg.role === "user" ? "#fff" : "#374151",
                    fontSize: "14px",
                    lineHeight: 1.5,
                    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                  }}
                >
                  {msg.role === "assistant" ? (
                    <div className="ai-markdown-content">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "12px" }}>
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: "16px",
                    backgroundColor: "#fff",
                    display: "flex",
                    gap: "6px",
                  }}
                >
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: "#9ca3af",
                      animation: "bounce 1s infinite",
                    }}
                  />
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: "#9ca3af",
                      animation: "bounce 1s infinite 0.1s",
                    }}
                  />
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: "#9ca3af",
                      animation: "bounce 1s infinite 0.2s",
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Quick Questions */}
          {chatMessages.length === 1 && (
            <div style={{ padding: "8px 16px", borderTop: "1px solid #e5e7eb" }}>
              <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "8px" }}>
                Hızlı sorular:
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {["En popüler yemekler?", "Vejetaryen var mı?", "Tatlı önerin?"].map((q, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setChatInput(q);
                      handleChatSubmit(q);
                    }}
                    style={{
                      fontSize: "11px",
                      padding: "4px 10px",
                      backgroundColor: "#f3f4f6",
                      border: "none",
                      borderRadius: "12px",
                      cursor: "pointer",
                      color: "#374151",
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Input */}
          <div
            style={{
              padding: "12px 16px",
              borderTop: "1px solid #e5e7eb",
              display: "flex",
              gap: "8px",
            }}
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleChatSubmit()}
              placeholder="Mesajınızı yazın..."
              style={{
                flex: 1,
                padding: "10px 16px",
                borderRadius: "20px",
                border: "1px solid #e5e7eb",
                fontSize: "14px",
                outline: "none",
              }}
            />
            <button
              onClick={() => handleChatSubmit()}
              disabled={!chatInput.trim() || chatLoading}
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                opacity: !chatInput.trim() || chatLoading ? 0.5 : 1,
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {/* Cart FAB - Bottom of screen */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 300 }}
            style={{ position: "fixed", bottom: "24px", right: openChat ? "420px" : "100px", zIndex: 9997, transition: "right 0.3s ease" }}
          >
            <Button
              variant="contained"
              onClick={() => setOpenCart(!openCart)}
              sx={{
                borderRadius: "50%",
                width: 64,
                height: 64,
                backgroundColor: "#1a9b8e",
                boxShadow: "0 8px 24px rgba(26, 155, 142, 0.3)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.3,
                transition: "all 0.2s",
                "&:hover": {
                  backgroundColor: "#158577",
                  boxShadow: "0 12px 32px rgba(26, 155, 142, 0.4)",
                },
              }}
            >
              <Typography sx={{ fontSize: "20px" }}>🛒</Typography>
              <Typography sx={{ fontSize: "12px", fontWeight: 700 }}>{cart.length}</Typography>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Dialog */}
      <Dialog
        open={Boolean(selectedItem)}
        onClose={() => handleSelectItem(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            backgroundColor: colors.bg,
            color: colors.text,
          },
        }}
      >
        {selectedItem && (
          <>
            {/* Header */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                p: 2,
                borderBottom: `1px solid ${colors.border}`,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, color: colors.text }}>
                {selectedItem.title}
              </Typography>
              <IconButton
                onClick={() => handleSelectItem(null)}
                size="small"
                sx={{ color: colors.textSecondary }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            <DialogContent sx={{ p: 3 }}>
              {/* Product Image */}
              {selectedItem.image && selectedItem.image.trim() ? (
                <Box
                  component="img"
                  src={selectedItem.image}
                  alt={selectedItem.title}
                  sx={{
                    width: "100%",
                    height: "200px",
                    objectFit: "cover",
                    borderRadius: "12px",
                    marginBottom: 2,
                  }}
                  onError={(e) => {
                    e.target.style.display = "none";
                    if (e.target.nextSibling) {
                      e.target.nextSibling.style.display = "flex";
                    }
                  }}
                />
              ) : null}
              {/* Fallback Icon in Dialog */}
              <Box
                id="dialog-image-fallback"
                sx={{
                  width: "100%",
                  height: "200px",
                  backgroundColor: colors.bgSecondary,
                  display: selectedItem.image && selectedItem.image.trim() ? "none" : "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "12px",
                  marginBottom: 2,
                  flexDirection: "column",
                  gap: 1.5,
                }}
              >
                <RestaurantIcon sx={{ fontSize: 80, color: "#1a9b8e", opacity: 0.4 }} />
                <Typography sx={{ color: colors.textSecondary, fontWeight: 600 }}>
                  Ürün Resmi Mevcut Değil
                </Typography>
              </Box>

              {/* Description */}
              <Typography variant="body2" sx={{ color: colors.textSecondary, mb: 2, lineHeight: 1.6 }}>
                {selectedItem.desc}
              </Typography>

              <Divider sx={{ my: 2, borderColor: colors.border }} />

              {/* Info Grid */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: "#999", display: "block", mb: 0.5 }}>
                    Kategori
                  </Typography>
                  <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#0d1b2a" }}>
                    {selectedItem.category}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: "#999", display: "block", mb: 0.5 }}>
                    Popülarite
                  </Typography>
                  <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#0d1b2a" }}>
                    {selectedItem.popularity} sipariş
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Price Section */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ color: "#999", display: "block", mb: 1 }}>
                  Fiyat
                </Typography>
                {selectedItem.discount > 0 ? (
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    <Typography
                      sx={{
                        fontSize: "14px",
                        color: "#999",
                        textDecoration: "line-through",
                      }}
                    >
                      ₺{selectedItem.price}
                    </Typography>
                    <Typography sx={{ fontSize: "22px", fontWeight: 700, color: "#1a9b8e" }}>
                      ₺{(selectedItem.price * (1 - selectedItem.discount / 100)).toFixed(2)}
                    </Typography>
                    <Chip
                      label={`-%${selectedItem.discount}`}
                      size="small"
                      sx={{
                        backgroundColor: "#ffebee",
                        color: "#c62828",
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                ) : (
                  <Typography sx={{ fontSize: "22px", fontWeight: 700, color: colors.text }}>
                    ₺{selectedItem.price}
                  </Typography>
                )}
              </Box>

              {/* Quantity Selector */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ color: colors.textSecondary, display: "block", mb: 1 }}>
                  Miktar
                  {selectedItem.trackStock && selectedItem.stock !== undefined && (
                    <Chip 
                      label={`Stok: ${selectedItem.stock}`} 
                      size="small" 
                      sx={{ 
                        ml: 1, 
                        height: 20, 
                        fontSize: "10px",
                        backgroundColor: selectedItem.stock <= (selectedItem.lowStockThreshold || 5) ? "#ffebee" : "#e8f5e9",
                        color: selectedItem.stock <= (selectedItem.lowStockThreshold || 5) ? "#c62828" : "#2e7d32"
                      }} 
                    />
                  )}
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    width: "fit-content",
                    backgroundColor: colors.bgSecondary,
                    borderRadius: "8px",
                    p: 0.5,
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    sx={{ color: quantity <= 1 ? "#ccc" : "#1a9b8e" }}
                  >
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                  <Typography sx={{ fontWeight: 600, minWidth: "20px", textAlign: "center", color: colors.text }}>
                    {quantity}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => {
                      if (selectedItem.trackStock && selectedItem.stock !== undefined) {
                        const existingItem = cart.find((c) => c._id === selectedItem._id);
                        const currentCartQty = existingItem ? existingItem.quantity : 0;
                        const maxAllowed = selectedItem.stock - currentCartQty;
                        if (quantity < maxAllowed) {
                          setQuantity(quantity + 1);
                        } else {
                          toast.info(`⚠️ Maksimum ${maxAllowed} adet ekleyebilirsiniz (Stok: ${selectedItem.stock})`);
                        }
                      } else {
                        setQuantity(quantity + 1);
                      }
                    }}
                    sx={{ color: "#1a9b8e" }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>
                {selectedItem.trackStock && selectedItem.stock !== undefined && (
                  <Typography variant="caption" sx={{ color: "#999", display: "block", mt: 0.5, fontSize: "11px" }}>
                    {(() => {
                      const existingItem = cart.find((c) => c._id === selectedItem._id);
                      const currentCartQty = existingItem ? existingItem.quantity : 0;
                      const remaining = selectedItem.stock - currentCartQty;
                      return remaining > 0 ? `${remaining} adet eklenebilir` : "Stok limitine ulaşıldı";
                    })()}
                  </Typography>
                )}
              </Box>
            </DialogContent>

            {/* Actions */}
            <Box sx={{ p: 2, borderTop: `1px solid ${colors.border}` }}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => handleAddToCart(selectedItem)}
                disabled={!selectedItem.isAvailable}
                sx={{
                  backgroundColor: "#1a9b8e",
                  height: 44,
                  fontWeight: 600,
                  borderRadius: "8px",
                  transition: "all 0.2s",
                  "&:hover": {
                    backgroundColor: "#158577",
                  },
                  "&:disabled": {
                    backgroundColor: "#ccc",
                  },
                }}
              >
                {selectedItem.isAvailable ? "Sepete Ekle" : "Tükendi"}
              </Button>
            </Box>
          </>
        )}
      </Dialog>

      {/* Cart Modal Dialog */}
      <Dialog
        open={openCart}
        onClose={() => setOpenCart(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            maxHeight: "90vh",
            backgroundColor: colors.bg,
            color: colors.text,
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            color: colors.text,
            fontSize: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: colors.bgSecondary,
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          🛒 {tableNumber ? `Masa ${tableNumber}` : "Sepetim"} ({cart.length} Ürün)
          <IconButton onClick={() => setOpenCart(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          {cart.length === 0 ? (
            <Alert severity="info" sx={{ textAlign: "center" }}>
              Sepet boş. Ürün ekleyin!
            </Alert>
          ) : (
            <>
              {/* Sepet Tablosu */}
              <TableContainer sx={{ mb: 3 }}>
                <Table size="small">
                  <TableHead sx={{ backgroundColor: "#f8f9fa" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Ürün</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        Birim Fiyat
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>
                        Miktar
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        Toplam
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>
                        İşlem
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cart.map((item) => (
                      <TableRow key={item._id}>
                        <TableCell sx={{ fontWeight: 500 }}>{item.title}</TableCell>
                        <TableCell align="right" sx={{ color: "#1a9b8e", fontWeight: 600 }}>
                          ₺{item.price}
                        </TableCell>
                        <TableCell align="center">{item.quantity}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          ₺
                          {(item.price * (1 - (item.discount || 0) / 100) * item.quantity).toFixed(2)}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveFromCart(item._id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Sipariş Bilgisi */}
              <Box sx={{ mb: 3, p: 2, backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
                <Typography sx={{ fontWeight: 700, mb: 2, color: "#0d1b2a" }}>
                  📋 Sipariş Bilgisi
                </Typography>
                
                {tableNumber ? (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    🎯 <strong>Masa {tableNumber}</strong> - Siparişiniz hazırlandığında çağrılacaksınız.
                  </Alert>
                ) : (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    ❌ Lütfen geçerli bir QR kodu tarayarak sipariş verin. (örn: ?table=1)
                  </Alert>
                )}
                
                <TextField
                  label="Notlar (Örn: Acılı, Katkısız vb)"
                  fullWidth
                  multiline
                  rows={2}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  size="small"
                />
              </Box>

              {/* Toplam */}
              <Box sx={{ p: 2, backgroundColor: "#e8f5e9", borderRadius: "8px", mb: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography sx={{ fontWeight: 600 }}>Ara Toplam:</Typography>
                  <Typography sx={{ fontWeight: 600 }}>₺{calculateTotal().toFixed(2)}</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography sx={{ fontWeight: 700, fontSize: "16px", color: "#1a9b8e" }}>
                    Genel Toplam:
                  </Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: "18px", color: "#1a9b8e" }}>
                    ₺{calculateTotal().toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </>
          )}
        </DialogContent>

        {cart.length > 0 && (
          <DialogActions sx={{ p: 2.5, backgroundColor: "#f8f9fa", gap: 1.5 }}>
            <Button onClick={() => setOpenCart(false)} sx={{ color: "#666" }}>
              Devam Et
            </Button>
            <Button
              onClick={handleSubmitOrder}
              disabled={submittingOrder || !tableNumber}
              variant="contained"
              startIcon={<PaymentIcon />}
              title={!tableNumber ? "QR kod tarayarak sipariş verin" : ""}
              sx={{
                backgroundColor: !tableNumber ? "#ccc" : "#1a9b8e",
                "&:hover": { backgroundColor: !tableNumber ? "#ccc" : "#158577" },
              }}
            >
              {submittingOrder ? "Gönderiliyor..." : "Siparişi Onayla"}
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {/* SUCCESS ORDER MODAL */}
      <Dialog
        open={openSuccess}
        onClose={() => setOpenSuccess(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            backgroundColor: "#e8f5e9",
          },
        }}
      >
        {successOrder && (
          <Box
            sx={{
              py: 4,
              px: 3,
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            {/* Checkmark Animation */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
            >
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  backgroundColor: "#1a9b8e",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "48px",
                }}
              >
                ✓
              </Box>
            </motion.div>

            {/* Title */}
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: "#1a9b8e",
              }}
            >
              Siparişiniz Alındı!
            </Typography>

            {/* Order Details */}
            <Box
              sx={{
                backgroundColor: "#fff",
                borderRadius: "12px",
                p: 2,
                width: "100%",
                border: "2px solid #1a9b8e",
              }}
            >
              <Box sx={{ mb: 1.5 }}>
                <Typography sx={{ color: "#999", fontSize: "12px", fontWeight: 600 }}>
                  SIPARIŞ ID
                </Typography>
                <Typography sx={{ fontSize: "20px", fontWeight: 700, color: "#0d1b2a" }}>
                  #{successOrder.id}
                </Typography>
              </Box>

              <Divider sx={{ my: 1.5 }} />

              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                <Box>
                  <Typography sx={{ color: "#999", fontSize: "12px", fontWeight: 600 }}>
                    MASA
                  </Typography>
                  <Typography sx={{ fontSize: "18px", fontWeight: 700, color: "#1a9b8e" }}>
                    {successOrder.tableNumber}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ color: "#999", fontSize: "12px", fontWeight: 600 }}>
                    ÜRÜN SAYISI
                  </Typography>
                  <Typography sx={{ fontSize: "18px", fontWeight: 700, color: "#1a9b8e" }}>
                    {successOrder.itemCount}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 1.5 }} />

              <Box>
                <Typography sx={{ color: "#999", fontSize: "12px", fontWeight: 600 }}>
                  TOPLAM
                </Typography>
                <Typography sx={{ fontSize: "22px", fontWeight: 700, color: "#1a9b8e" }}>
                  ₺{successOrder.total.toFixed(2)}
                </Typography>
              </Box>
            </Box>

            {/* Message */}
            <Typography
              sx={{
                color: "#666",
                fontSize: "14px",
                fontStyle: "italic",
                textAlign: "center",
              }}
            >
              Siparişiniz hazırlandığında masaya çağrılacaksınız.
            </Typography>

            {/* Close Button */}
            <Button
              onClick={() => setOpenSuccess(false)}
              variant="contained"
              sx={{
                backgroundColor: "#1a9b8e",
                px: 4,
                mt: 1,
              }}
            >
              Kapat
            </Button>

            {/* Auto-close info */}
            <Typography sx={{ fontSize: "12px", color: "#999" }}>
              (Otomatik olarak kapanacak)
            </Typography>
          </Box>
        )}
      </Dialog>

      {/* Professional Footer - Theme uyumlu */}
      <Box
        component="footer"
        sx={{ 
          backgroundColor: colors.bgSecondary, 
          borderTop: `1px solid ${colors.border}`,
          mt: "auto",
          position: "relative",
          zIndex: 1
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} sx={{ py: 4 }}>
            {/* İşletme Bilgisi - Dinamik from Settings */}
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: colors.text, mb: 2 }}>
                🏢 {settings?.restaurantName || "akay"}
              </Typography>
              <Typography variant="body2" sx={{ color: colors.textSecondary, lineHeight: 1.8 }}>
                {settings?.slogan || "Kalitelinin adresi"}
              </Typography>
            </Grid>

              {/* İletişim */}
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: colors.text, mb: 2 }}>
                📞 İletişim
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <PhoneIcon sx={{ fontSize: 18, color: "#1a9b8e" }} />
                  <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                    {settings?.phone || "+90 555 123 45 67"}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <EmailIcon sx={{ fontSize: 18, color: "#1a9b8e" }} />
                  <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                    {settings?.email || "info@akay.com"}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Adres */}
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: colors.text, mb: 2 }}>
                📍 Adres
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <LocationIcon sx={{ fontSize: 18, color: "#1a9b8e", flexShrink: 0, mt: 0.3 }} />
                <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                  {settings?.address || "Merkez Cad. No:123<br />Şehir, 12345"}
                </Typography>
              </Box>
            </Grid>

            {/* Saatler */}
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: colors.text, mb: 2 }}>
                ⏰ Çalışma Saatleri
              </Typography>
              <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                {settings?.businessHours?.open || "10:00"} - {settings?.businessHours?.close || "22:00"}<br />
                7/24 Hizmet
              </Typography>
            </Grid>
          </Grid>

          {/* Divider */}
          <Divider sx={{ my: 3, borderColor: colors.border }} />

          {/* Copyright */}
          <Box sx={{ py: 2, textAlign: "center" }}>
            <Typography variant="caption" sx={{ color: colors.textSecondary }}>
              © 2026 qor menü. Tüm hakları saklıdır.
            </Typography>
          </Box>
        </Container>
      </Box>

    </div>
  );
};

export default ModernQr;
