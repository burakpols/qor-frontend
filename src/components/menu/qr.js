import React, { useState, useEffect } from "react";
import Menu from "./Menu";
import Categories from "./Categories";
import "./qr.css"; // Import the CSS file
import axios from "axios";

const Qr = () => {
  const [items, setItems] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState(["Hepsi"]);
  const [loading, setLoading] = useState(true); // Add loading state
  const mainUrl = process.env.REACT_APP_API_URL || "http://localhost:3800/api/v1"; // Define main URL
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await axios.get(`${mainUrl}/items`);
        setItems(response.data);
      } catch (error) {
        console.error("Error fetching items:", error);
      } finally {
        setLoading(false); // Set loading to false regardless of success or failure
      }
    };

    fetchItems();
  }, []);

  useEffect(() => {
    const allCategories = [
      "Hepsi",
      ...new Set(items.map((item) => item.category)),
    ];
    setCategories(allCategories);
    setMenuItems(items);
  }, [items]);

  const filterItems = (category) => {
    const newItems =
      category === "Hepsi"
        ? items
        : items.filter((item) => item.category === category);
    setIsTransitioning(true); // Start transition
    setTimeout(() => {
      setMenuItems(newItems);
      setIsTransitioning(false); // End transition after a short delay
    }, 300); // Adjust the delay as needed for your transition duration
  };

  return (
    <main>
      <section className="menu section">
        <div className="title">
          <h2>Mihman Menü</h2>
          <div className="underline" />
        </div>
        <Categories categories={categories} filterItems={filterItems} />
        <div className={`menu-items ${isTransitioning ? 'transitioning' : ''}`}>
          {loading ? (
            <div className="loader"></div>
          ) : (
            <Menu items={menuItems} />
          )}
        </div>
      </section>
    </main>
  );
};

export default Qr;
