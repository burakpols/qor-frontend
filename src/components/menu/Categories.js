import React, { useState, useRef } from "react";

const Categories = ({ categories, filterItems }) => {
  const [currentCategory, setCurrentCategory] = useState(0);
  const containerRef = useRef(null);

  const handleCategoryClick = (categoryIndex, category) => {
    filterItems(category);
    setCurrentCategory(categoryIndex);
  };

  return (
    <div
      className="btn-container"
      ref={containerRef}
      style={{ overflowX: "auto", whiteSpace: "nowrap" }}
    >
      {categories.map((category, index) => (
        <button
          type="button"
          className={`filter-btn ${index === currentCategory ? "active" : ""}`}
          key={index}
          onClick={() => handleCategoryClick(index, category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
};

export default Categories;
