import api from "./axiosClient";

const authApi = {
  login: async (Credentials) => {
    const response = await api.post("/auth/login", Credentials);
    return response.data;
  },
};
export default authApi;
