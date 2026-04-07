import React from "react";
import { Grid, Container, useMediaQuery, useTheme } from "@mui/material";

/**
 * ResponsiveGrid Component
 * 
 * Tailwind CSS + MUI Grid integration for responsive layouts
 * Breakpoints:
 * - xs: 320px - 640px (mobile)
 * - sm: 640px - 768px (tablet small)
 * - md: 768px - 1024px (tablet)
 * - lg: 1024px - 1280px (desktop)
 * - xl: 1280px+ (large desktop)
 */

export const ResponsiveGrid = ({ children, className = "", spacing = 2 }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  return (
    <Container
      maxWidth={false}
      className={`w-full px-2 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8 ${className}`}
    >
      <Grid container spacing={spacing}>
        {children}
      </Grid>
    </Container>
  );
};

/**
 * ResponsiveGridItem Component
 * 
 * Configurable grid item with Tailwind + MUI responsive behavior
 * 
 * Example:
 * <ResponsiveGridItem xs={12} sm={6} md={4} lg={3} xl={2.4}>
 *   <Card>Content</Card>
 * </ResponsiveGridItem>
 */

export const ResponsiveGridItem = ({
  children,
  xs = 12,
  sm = 6,
  md = 4,
  lg = 3,
  xl = 3,
  className = "",
}) => {
  return (
    <Grid
      item
      xs={xs}
      sm={sm}
      md={md}
      lg={lg}
      xl={xl}
      className={`flex justify-center ${className}`}
    >
      {children}
    </Grid>
  );
};

/**
 * MenuGrid Component
 * 
 * Optimized grid layout for menu items/products
 * Mobile: 1 column
 * Tablet: 2 columns
 * Desktop: 3-4 columns
 */

export const MenuGrid = ({ children, className = "" }) => {
  return (
    <div className={`w-full ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 px-2 sm:px-4 md:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
};

/**
 * AdminGrid Component
 * 
 * Optimized grid layout for admin dashboard
 * Mobile: Full width
 * Tablet: 2 columns
 * Desktop: 3-4 columns
 */

export const AdminGrid = ({ children, className = "" }) => {
  return (
    <div className={`w-full ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 px-3 sm:px-6 md:px-8">
        {children}
      </div>
    </div>
  );
};

/**
 * HeroSection Component
 * 
 * Full-width responsive hero section
 */

export const HeroSection = ({ children, className = "" }) => {
  return (
    <section
      className={`w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-12 md:py-20 lg:py-24 px-4 sm:px-6 md:px-8 ${className}`}
    >
      <div className="max-w-6xl mx-auto">
        {children}
      </div>
    </section>
  );
};

/**
 * Breakpoint Helper Hooks
 */

export const useBreakpoints = () => {
  const theme = useTheme();

  return {
    isMobile: useMediaQuery(theme.breakpoints.down("sm")),
    isTabletSmall: useMediaQuery(theme.breakpoints.between("sm", "md")),
    isTablet: useMediaQuery(theme.breakpoints.between("md", "lg")),
    isDesktop: useMediaQuery(theme.breakpoints.up("lg")),
    isLargeDesktop: useMediaQuery(theme.breakpoints.up("xl")),
  };
};

export default ResponsiveGrid;
