import React from "react";
import { Skeleton, Card, CardContent, Box } from "@mui/material";

/**
 * CardSkeleton Component
 * Loading skeleton for menu/product cards
 */
export const CardSkeleton = () => {
  return (
    <Card className="h-full">
      <Skeleton variant="rectangular" height={200} />
      <CardContent>
        <Skeleton variant="text" height={24} className="mb-2" />
        <Skeleton variant="text" height={16} className="mb-4" />
        <Skeleton variant="text" height={20} width="50%" />
      </CardContent>
    </Card>
  );
};

/**
 * TableSkeleton Component
 * Loading skeleton for admin dashboard tables
 */
export const TableSkeleton = ({ rows = 5, columns = 5 }) => {
  return (
    <Box className="w-full overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <td key={i} className="p-4">
                <Skeleton variant="text" height={20} />
              </td>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className="border-t border-gray-200">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="p-4">
                  <Skeleton variant="text" height={16} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  );
};

/**
 * GridSkeleton Component
 * Loading skeleton for grid layouts
 */
export const GridSkeleton = ({ items = 12, columns = 4 }) => {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-${columns} gap-4`}>
      {Array.from({ length: items }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
};

/**
 * FormSkeleton Component
 * Loading skeleton for form sections
 */
export const FormSkeleton = () => {
  return (
    <Box className="space-y-4">
      <Skeleton variant="text" height={32} width="50%" />
      <Skeleton variant="rectangular" height={40} className="rounded" />
      <Skeleton variant="rectangular" height={40} className="rounded" />
      <Skeleton variant="rectangular" height={100} className="rounded" />
      <Skeleton variant="rectangular" height={40} width="30%" className="rounded" />
    </Box>
  );
};

export default CardSkeleton;
