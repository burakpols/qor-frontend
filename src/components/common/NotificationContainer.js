import React from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./NotificationContainer.css";

/**
 * NotificationContainer Component
 * Global toast notification container
 * Place this in your App.js
 */

export const NotificationContainer = () => {
  return (
    <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop={true}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
      limit={3}
    />
  );
};

/**
 * Notification Service
 * Centralized notification service for the app
 */

export const notificationService = {
  success: (message, options = {}) =>
    toast.success(message, {
      className: "notification-success",
      ...options,
    }),

  error: (message, options = {}) =>
    toast.error(message, {
      className: "notification-error",
      ...options,
    }),

  warning: (message, options = {}) =>
    toast.warning(message, {
      className: "notification-warning",
      ...options,
    }),

  info: (message, options = {}) =>
    toast.info(message, {
      className: "notification-info",
      ...options,
    }),

  loading: (message, options = {}) =>
    toast.loading(message, {
      className: "notification-loading",
      ...options,
    }),

  promise: (promise, messages, options = {}) =>
    toast.promise(
      promise,
      {
        pending: { render: messages.pending, className: "notification-loading" },
        success: { render: messages.success, className: "notification-success" },
        error: { render: messages.error, className: "notification-error" },
      },
      options
    ),

  dismiss: (toastId) =>
    toast.dismiss(toastId),

  dismissAll: () =>
    toast.dismiss(),
};

export default NotificationContainer;
