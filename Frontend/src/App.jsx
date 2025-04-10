import { Routes, Route } from "react-router-dom";
import Login from "./Components/Login";
import Register from "./Components/Register";
import Home from "./Components/Home";
import MenuComponent from "./mainComponents/MenuComponente";
import Main from "./Components/TradeComponentes/Main";
import PrivateRoute from "./Components/PrivateRoute";
import TradingHeader from "./Components/TradeComponentes/TradingHeader";
import "./API/trade_api"; // Solo para que window.apiTrade exista


function App() {
  return (
    <Routes>
      {/* Rutas protegidas */}
      <Route element={<PrivateRoute />}>
        <Route path="/" element={<Home />}>
          <Route index element={<MenuComponent />} />
          <Route path="trading" element={<Main />}>
            <Route path="charts" element={<TradingHeader />} />
          </Route>
          <Route path="task" element={<Register />} />
        </Route>
      </Route>
      
      {/* Rutas públicas */}
      <Route path="/login" element={<Login mode="login" />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  );
}

export default App;
