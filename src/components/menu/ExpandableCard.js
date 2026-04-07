import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardMedia, Typography, Chip, Box } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import "./ExpandableCard.css";

/**
 * ExpandableCard Component
 * 
 * Menu item card that expands on click with smooth animation
 * Features:
 * - Smooth expand/collapse animation
 * - Discount badge display
 * - Availability status
 * - Click outside to close
 * - Responsive sizing
 */

const ExpandableCard = ({
  id,
  title,
  description,
  price,
  image,
  category,
  discount,
  isAvailable,
  popularity,
  onSelect,
  onAddToCart,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const discountedPrice = discount ? (price * (1 - discount / 100)).toFixed(2) : null;

  const handleCardClick = (e) => {
    e.stopPropagation();
    setIsExpanded(true);
  };

  const handleBackdropClick = () => {
    setIsExpanded(false);
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart({
        id,
        title,
        price,
        image,
        discount,
      });
    }
  };

  return (
    <>
      {/* Regular Card View */}
      <motion.div
        layout
        className="cursor-pointer h-full"
        onClick={handleCardClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <Card
          className="h-full overflow-hidden shadow-md hover:shadow-lg transition-shadow"
          sx={{
            opacity: isAvailable ? 1 : 0.6,
            transition: "opacity 0.3s",
          }}
        >
          {/* Image Container */}
          <Box className="relative overflow-hidden h-48 bg-gray-200">
            {image ? (
              <CardMedia
                component="img"
                height="200"
                image={image}
                alt={title}
                className="w-full h-full object-cover"
              />
            ) : (
              <Box className="w-full h-full flex items-center justify-center bg-gray-300">
                <Typography variant="caption" className="text-gray-500">
                  No Image
                </Typography>
              </Box>
            )}

            {/* Discount Badge */}
            {discount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-2 right-2"
              >
                <Chip
                  label={`-${discount}%`}
                  color="error"
                  size="small"
                  className="font-bold"
                />
              </motion.div>
            )}

            {/* Availability Badge */}
            {!isAvailable && (
              <Box className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                <Chip label="Unavailable" color="error" variant="filled" />
              </Box>
            )}
          </Box>

          {/* Card Content */}
          <CardContent className="pb-3">
            <Typography variant="h6" className="font-bold line-clamp-2 mb-1">
              {title}
            </Typography>

            <Typography
              variant="body2"
              color="textSecondary"
              className="line-clamp-2 mb-3 min-h-10"
            >
              {description}
            </Typography>

            {/* Price */}
            <Box className="flex items-center gap-2 mb-2">
              {discount > 0 ? (
                <>
                  <Typography
                    variant="h6"
                    className="font-bold text-green-600"
                  >
                    ₺{discountedPrice}
                  </Typography>
                  <Typography
                    variant="body2"
                    className="line-through text-gray-400"
                  >
                    ₺{price.toFixed(2)}
                  </Typography>
                </>
              ) : (
                <Typography variant="h6" className="font-bold">
                  ₺{price.toFixed(2)}
                </Typography>
              )}
            </Box>

            {/* Popularity */}
            {popularity > 0 && (
              <Typography variant="caption" className="text-gray-500">
                ⭐ {popularity} orders
              </Typography>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Expanded Modal View */}
      <AnimatePresence>
        {isExpanded && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleBackdropClick}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
            />

            {/* Expanded Card */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <motion.div
                className="w-full max-w-md md:max-w-2xl pointer-events-auto"
                layoutId={`card-${id}`}
              >
                <Card className="overflow-hidden shadow-2xl">
                  {/* Close Button */}
                  <motion.button
                    onClick={handleBackdropClick}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
                  >
                    <CloseIcon />
                  </motion.button>

                  {/* Expanded Image */}
                  <Box className="relative overflow-hidden h-64 md:h-96 bg-gray-200">
                    {image ? (
                      <CardMedia
                        component="img"
                        height="400"
                        image={image}
                        alt={title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Box className="w-full h-full flex items-center justify-center bg-gray-300">
                        <Typography variant="h6" className="text-gray-500">
                          No Image
                        </Typography>
                      </Box>
                    )}

                    {/* Discount Badge Large */}
                    {discount > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-4 right-4"
                      >
                        <Chip
                          label={`Special Offer: -${discount}%`}
                          color="error"
                          className="text-base font-bold"
                        />
                      </motion.div>
                    )}
                  </Box>

                  {/* Expanded Content */}
                  <CardContent className="p-6 md:p-8">
                    <Typography variant="h4" className="font-bold mb-4">
                      {title}
                    </Typography>

                    <Typography
                      variant="body1"
                      color="textSecondary"
                      className="mb-6 leading-relaxed"
                    >
                      {description}
                    </Typography>

                    {/* Category */}
                    <Box className="mb-4">
                      <Chip label={category} size="small" variant="outlined" />
                    </Box>

                    {/* Price Section */}
                    <Box className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <Box className="flex items-center gap-4">
                        {discount > 0 ? (
                          <>
                            <Box>
                              <Typography variant="caption" className="text-gray-500">
                                Sale Price
                              </Typography>
                              <Typography variant="h5" className="font-bold text-green-600">
                                ₺{discountedPrice}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" className="text-gray-500">
                                Original
                              </Typography>
                              <Typography
                                variant="body1"
                                className="line-through text-gray-400"
                              >
                                ₺{price.toFixed(2)}
                              </Typography>
                            </Box>
                          </>
                        ) : (
                          <Typography variant="h5" className="font-bold">
                            ₺{price.toFixed(2)}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    {/* Availability & Popularity */}
                    <Box className="flex gap-4 mb-6">
                      <Chip
                        label={isAvailable ? "Available" : "Unavailable"}
                        color={isAvailable ? "success" : "error"}
                        variant="filled"
                      />
                      {popularity > 0 && (
                        <Chip
                          label={`⭐ ${popularity} orders`}
                          variant="outlined"
                        />
                      )}
                    </Box>

                    {/* Action Buttons */}
                    <Box className="flex gap-3 flex-col sm:flex-row">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleAddToCart}
                        disabled={!isAvailable}
                        className={`flex-1 py-3 px-4 rounded-lg font-bold text-white transition-all ${
                          isAvailable
                            ? "bg-primary-600 hover:bg-primary-700 cursor-pointer"
                            : "bg-gray-400 cursor-not-allowed"
                        }`}
                      >
                        Add to Cart
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleBackdropClick}
                        className="flex-1 py-3 px-4 rounded-lg font-bold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
                      >
                        Close
                      </motion.button>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default ExpandableCard;
