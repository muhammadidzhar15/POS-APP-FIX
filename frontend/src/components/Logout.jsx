import { useEffect } from "react";
import secureLocalStorage from "react-secure-storage"; // Pastikan ini diimpor dengan benar
import { useNavigate } from "react-router-dom"; // Untuk navigasi programatik

const Logout = () => {
  const navigate = useNavigate(); // Hook untuk navigasi ke halaman lain

  useEffect(() => {
    // Hapus data user dan token saat logout
    secureLocalStorage.removeItem("accessToken");
    secureLocalStorage.removeItem("refreshToken");
    secureLocalStorage.removeItem("user");

    // Redirect ke halaman login setelah logout
    navigate("/login"); // Arahkan pengguna ke halaman login
  }, [navigate]);

  return null; // Tidak ada tampilan yang ditampilkan saat proses logout
};

export default Logout;
