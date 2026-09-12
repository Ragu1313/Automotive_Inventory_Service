import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response Interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },

  async (error) => {
    const originalRequest = error.config;

    // 401 - Unauthorized
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      // Don't try to refresh the refresh request itself
      if (originalRequest.url === "/auth/refresh") {
        localStorage.clear();
        window.location.href = "/login";

        return Promise.reject(error);
      }

      originalRequest._retry = true;

      // Another request is already refreshing the token
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;

          return api(originalRequest);
        });
      }

      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
          throw new Error("Refresh token not found");
        }

        // Use normal axios so this request doesn't go through
        // the api interceptor again.
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          {
            refreshToken,
          },
        );

        const { accessToken } = response.data;

        // Store new access token
        localStorage.setItem("accessToken", accessToken);

        // Release queued requests
        processQueue(null, accessToken);

        // Update original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // Retry original request
        return api(originalRequest);
      } catch (refreshError) {
        // Reject all queued requests
        processQueue(refreshError, null);

        // Remove authentication data
        localStorage.clear();

        // Redirect to login
        window.location.href = "/login";

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle all other errors
    if (error.response) {
      const status = error.response.status;

      console.error(`Server Error (${status}):`, error.response.data);

      if (status === 403) {
        console.warn("Access denied. You do not have permission.");
      }
    } else if (error.request) {
      console.error("Network Error: Please check your internet connection.");
    } else {
      console.error("Error:", error.message);
    }

    return Promise.reject(error);
  },
);

export default api;
