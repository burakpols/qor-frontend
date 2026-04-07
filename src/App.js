import React from "react"; // Import React
import { Route, Routes } from "react-router-dom";
import AdminLogin from "./components/admin/AdminLogin";
import AdminDashboard from "./components/admin/AdminDashboard";
import ModernQr from "./components/menu/ModernQr";

const App = (props) => {
  return (
    <Routes>
      <Route path="/" element={<ModernQr />} />
      <Route path="/qr" element={<ModernQr />} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
    </Routes>
  );
};

export default App;
