import { Routes, Route } from "react-router-dom";
import Login from "./Components/LayoutPublic/Login";
import Register from "./Components/LayoutPublic/Login";
import Home from "./Components/Home";
import MenuComponent from "./mainComponents/MenuComponente";
import Main from "./Components/TradeComponentes/Main";
import PrivateRoute from "./Components/PrivateRoute";
import "./API/trade_api"; // Solo para que window.apiTrade exista
import Dashboard from "./Components/AutomationVideoComponents/Dashboard";
import LayoutPublic from "./Components/LayoutPublic/LayoutPublic";


function App() {
  return (
      <Routes>
        {/* Rutas protegidas */}
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<Home />}>
            <Route index element={<MenuComponent />} />
            <Route path="trading" element={<Main />}>
            </Route>
            <Route path="task" element={<Dashboard />} />
          </Route>
        </Route>

        {/* Rutas públicas */}
        <Route element={<LayoutPublic />}>
          <Route path="/login" element={<Login mode="login" />} />
        </Route>
      </Routes>
  );
}

export default App;
