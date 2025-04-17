import { Route, Routes } from "react-router-dom";
import secureLocalStorage from "react-secure-storage";
import { ToastContainer } from "react-toastify";
import Home from "../components/Home";
import Login from "../components/Login";
import Logout from "../components/Logout";
import ListCategory from "../components/category/ListCategory";
import AddCategory from "../components/category/AddCategory";
import EditCategory from "../components/category/EditCategory";
import NoPage from "../components/category/NoPage";

const RouteNavigation = () => {
  const refreshToken = secureLocalStorage.getItem("refreshToken");

  const ProtectedRoute = ({ children }) => {
    if (!refreshToken) {
      // Jika tidak ada token, arahkan ke halaman Login
      return <Login />;
    }
    return children; // Tampilkan komponen anak jika ada token
  };

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        {/* Route untuk Logout, akan memicu Logout.jsx untuk logout dan redirect */}
        <Route path="/logout" element={<Logout />} />
        <Route path="/login" element={<Login />} />
        {/* category routes */}
        <Route
          path="/category"
          element={
            <ProtectedRoute>
              <ListCategory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/category/add"
          element={
            <ProtectedRoute>
              <AddCategory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/category/:id"
          element={
            <ProtectedRoute>
              <EditCategory />
            </ProtectedRoute>
          }
        />
        <Route path="*" element ={<NoPage/>}/>
        {/* Pastikan ada route ke login */}
        <Route path="*" element={<Login />} />{" "}
        {/* Untuk halaman yang tidak ditemukan */}
      </Routes>
      <ToastContainer />
    </>
  );
};

export default RouteNavigation;
