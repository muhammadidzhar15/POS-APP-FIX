import React from "react";
import { BrowserRouter } from "react-router-dom"; // Pastikan BrowserRouter ada di sini
import RouteNavigation from "./auth/RouteNavigation.jsx";

function App() {
  return (
    <BrowserRouter>
      {" "}
      {/* BrowserRouter hanya perlu satu kali di sini */}
      <RouteNavigation />
    </BrowserRouter>
  );
}

export default App;
