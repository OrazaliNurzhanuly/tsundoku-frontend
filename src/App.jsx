import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import Layout from "./components/Layout";
import { Empty } from "./components/ui";
import { useApp } from "./store";
import Account from "./pages/Account";
import Admin from "./pages/Admin";
import { Login, Register } from "./pages/Auth";
import Cart from "./pages/Cart";
import Catalog from "./pages/Catalog";
import Checkout, { OrderDone } from "./pages/Checkout";
import Home from "./pages/Home";
import Order from "./pages/Order";
import Product from "./pages/Product";

// Страница только для вошедших (и, при необходимости, только для админа)
function RequireAuth({ children, role }) {
  const { user } = useApp();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (role && user.role !== role) {
    return <Empty kanji="禁" title="Недостаточно прав"><p>Эта страница доступна только администратору.</p></Empty>;
  }
  return children;
}

const NotFound = () => (
  <Empty kanji="404" title="Страница потерялась между томами">
    <Link to="/" className="btn" style={{ marginTop: 12 }}>На главную</Link>
  </Empty>
);

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="catalog" element={<Catalog />} />
        <Route path="product/:id" element={<Product />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
        <Route path="done/:id" element={<RequireAuth><OrderDone /></RequireAuth>} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="account" element={<RequireAuth><Account /></RequireAuth>} />
        <Route path="orders/:id" element={<RequireAuth><Order /></RequireAuth>} />
        <Route path="admin" element={<RequireAuth role="admin"><Admin /></RequireAuth>} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
