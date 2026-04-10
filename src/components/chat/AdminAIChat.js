import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  CircularProgress,
  Chip,
  Button,
  Avatar,
} from "@mui/material";
import {
  Send as SendIcon,
  SmartToy as SmartToyIcon,
  Analytics as AnalyticsIcon,
  Restaurant as RestaurantIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";

const AdminAIChat = ({ adminToken }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const messagesEndRef = useRef(null);

  // Dynamic API URL
  const getApiUrl = () => {
    if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      return process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api/v1` : "";
    }
    return `http://localhost:3800/api/v1`;
  };

  const apiUrl = getApiUrl();

  useEffect(() => {
    // Add welcome message
    setMessages([
      {
        id: 1,
        role: "assistant",
        content:
          "Merhaba! Ben AI Yönetici Asistanınızım 🤖\n\nSize nasıl yardımcı olabilirim?\n\n📦 Menü ve ürün yönetimi\n📊 Analitik veri analizi\n💰 İşletme önerileri\n🍽️ Sipariş optimizasyonu",
      },
    ]);

    // Check AI service status
    const checkStatus = async () => {
      try {
        const res = await fetch(`${apiUrl}/ai/status`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setIsAvailable(data.available ?? true);
        } else {
          setIsAvailable(true); // Backend çalışıyorsa AI'ı aktif göster
        }
      } catch (error) {
        console.warn("AI status check failed:", error);
        setIsAvailable(true); // Bağlantı hatasında bile aktif göster
      }
    };
    checkStatus();
  }, [apiUrl, adminToken]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const conversationHistory = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res = await fetch(`${apiUrl}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          message: input.trim(),
          conversationHistory: conversationHistory.slice(-10),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const assistantMessage = {
          id: Date.now() + 1,
          role: "assistant",
          content: data.response,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(data.message || "AI hizmeti yanıt vermiyor");
      }
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: `⚠️ Bir hata oluştu: ${error.message}\n\nLütfen tekrar deneyin veya GROQ API anahtarınızı kontrol edin.`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyticsInsight = async () => {
    setIsLoading(true);
    const userMessage = {
      id: Date.now(),
      role: "user",
      content: "📊 Analitik verilerimi analiz et",
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const res = await fetch(`${apiUrl}/ai/analytics-insight`, {
        method: "GET",
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      const data = await res.json();

      if (res.ok) {
        const assistantMessage = {
          id: Date.now() + 1,
          role: "assistant",
          content: `📊 **Analitik Analiz Sonucu:**\n\n${data.insight}`,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(data.message || "Analiz alınamadı");
      }
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: `⚠️ Hata: ${error.message}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { label: "Popüler Ürünler", icon: <RestaurantIcon />, query: "En popüler ürünler hangileri?" },
    { label: "Yoğun Saatler", icon: <ScheduleIcon />, query: "Hangi saatlerde en yoğun?" },
    { label: "Kazanç Önerileri", icon: <TrendingUpIcon />, query: "Kazancımı nasıl artırabilirim?" },
    { label: "Analiz Yap", icon: <AnalyticsIcon />, action: handleAnalyticsInsight },
  ];

  return (
    <Paper
      elevation={3}
      sx={{
        borderRadius: "16px",
        overflow: "hidden",
        border: "1px solid #e0e0e0",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #1a9b8e 0%, #158577 100%)",
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar
            sx={{
              bgcolor: "rgba(255,255,255,0.2)",
              width: 48,
              height: 48,
            }}
          >
            <SmartToyIcon sx={{ fontSize: 28, color: "#fff" }} />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700, fontSize: "16px" }}>
              AI Yönetici Asistanı
            </Typography>
            <Chip
              label={isAvailable ? "Çevrimiçi" : "Çevrimdışı"}
              size="small"
              sx={{
                bgcolor: isAvailable ? "#10b981" : "#ef4444",
                color: "#fff",
                fontWeight: 600,
                fontSize: "11px",
                height: 22,
              }}
            />
          </Box>
        </Box>
        <Button
          onClick={handleAnalyticsInsight}
          disabled={isLoading}
          startIcon={<AnalyticsIcon />}
          sx={{
            bgcolor: "rgba(255,255,255,0.2)",
            color: "#fff",
            "&:hover": { bgcolor: "rgba(255,255,255,0.3)" },
            textTransform: "none",
            fontWeight: 600,
            borderRadius: "8px",
            px: 2,
          }}
        >
          Analiz Yap
        </Button>
      </Box>

      {/* Messages */}
      <Box
        sx={{
          height: 400,
          overflowY: "auto",
          p: 3,
          bgcolor: "#f8f9fa",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {messages.map((message) => (
          <Box
            key={message.id}
            sx={{
              display: "flex",
              justifyContent: message.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <Box
              sx={{
                maxWidth: "85%",
                px: 2.5,
                py: 1.5,
                borderRadius: message.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                bgcolor: message.role === "user" ? "#1a9b8e" : "#fff",
                color: message.role === "user" ? "#fff" : "#333",
                boxShadow: message.role === "user" ? "none" : "0 1px 3px rgba(0,0,0,0.1)",
                border: message.role === "user" ? "none" : "1px solid #e0e0e0",
              }}
            >
              <Typography
                sx={{
                  fontSize: "14px",
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  fontFamily: message.role === "user" ? "'Inter', sans-serif" : "'Inter', sans-serif",
                }}
              >
                {message.content}
              </Typography>
            </Box>
          </Box>
        ))}
        {isLoading && (
          <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
            <Box
              sx={{
                px: 3,
                py: 2,
                borderRadius: "18px 18px 18px 4px",
                bgcolor: "#fff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                border: "1px solid #e0e0e0",
              }}
            >
              <Box sx={{ display: "flex", gap: 0.5 }}>
                <CircularProgress size={8} sx={{ color: "#1a9b8e" }} />
                <CircularProgress size={8} sx={{ color: "#1a9b8e", animationDelay: "0.1s" }} />
                <CircularProgress size={8} sx={{ color: "#1a9b8e", animationDelay: "0.2s" }} />
              </Box>
            </Box>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Quick Actions */}
      <Box
        sx={{
          px: 3,
          py: 2,
          bgcolor: "#fff",
          borderTop: "1px solid #f0f0f0",
          display: "flex",
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        {quickActions.map((action, idx) => (
          <Button
            key={idx}
            size="small"
            variant="outlined"
            startIcon={action.icon}
            onClick={() => {
              if (action.action) {
                action.action();
              } else if (action.query) {
                setInput(action.query);
              }
            }}
            disabled={isLoading}
            sx={{
              textTransform: "none",
              fontSize: "12px",
              fontWeight: 600,
              borderColor: "#1a9b8e",
              color: "#1a9b8e",
              borderRadius: "20px",
              "&:hover": {
                bgcolor: "#e8f5e9",
                borderColor: "#1a9b8e",
              },
            }}
          >
            {action.label}
          </Button>
        ))}
      </Box>

      {/* Input */}
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          p: 2,
          bgcolor: "#fff",
          borderTop: "1px solid #f0f0f0",
          display: "flex",
          gap: 1,
        }}
      >
        <TextField
          fullWidth
          size="small"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Mesajınızı yazın..."
          disabled={isLoading}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "24px",
              bgcolor: "#f8f9fa",
              "&:hover fieldset": { borderColor: "#1a9b8e" },
              "&.Mui-focused fieldset": { borderColor: "#1a9b8e" },
            },
          }}
        />
        <IconButton
          type="submit"
          disabled={!input.trim() || isLoading}
          sx={{
            bgcolor: "#1a9b8e",
            color: "#fff",
            "&:hover": { bgcolor: "#158577" },
            "&:disabled": { bgcolor: "#ccc" },
            width: 40,
            height: 40,
          }}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Paper>
  );
};

export default AdminAIChat;