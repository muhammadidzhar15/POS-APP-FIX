import axios from "axios";
import secureLocalStorage from "react-secure-storage";
axios.defaults.baseURL = import.meta.env.VITE_API_URL;
axios.defaults.timeout = import.meta.env.VITE_API_TIMEOUT;
axios.defaults.headers.common["Content-Type"] = "application/json";

const api = axios.create();

api.interceptors.request.use((request) => {
  const token = secureLocalStorage.getItem("accessToken"); // Pastikan token ini ada
  console.log("Access Token: ", token); // Tambahkan log untuk memverifikasi token
  if (token) {
    request.headers["Authorization"] = `Bearer ${token}`;
  }
  return request;
});


const refreshAuthLogic = async (failedRequest) => {
  try {
    let headersList = {
      Authorization: "Bearer " + secureLocalStorage.getItem("refreshToken"),
      "Content-Type": "application/json",
    };
    let reqOptions = {
      url: `api/users/refresh`, // Pastikan URL refresh token ini benar
      method: "GET",
      headers: headersList,
    };
    const response = await axios.request(reqOptions);
    secureLocalStorage.setItem("accessToken", response.data.accessToken);
    secureLocalStorage.setItem("refreshToken", response.data.refreshToken);
    secureLocalStorage.setItem("user", response.data.result);
    console.log("Simpan Token Baru Berhasil....");
    failedRequest.headers["Authorization"] =
      "Bearer " + response.data.accessToken;
    return Promise.resolve();
  } catch (error) {
    secureLocalStorage.clear();
    console.log(error.message);
    window.location.href = "/"; // redirect ke halaman login jika refresh gagal
    return Promise.reject(error);
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      await refreshAuthLogic(originalRequest);
      return api(originalRequest);
    }
    return Promise.reject(error);
  }
);

export const axiosInstance = api;
