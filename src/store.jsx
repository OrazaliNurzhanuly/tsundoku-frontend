import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import * as api from "./api";
import { setToken } from "./api/client";
import { storage } from "./api/storage";

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

// Снимок товара для корзины и избранного — чтобы не запрашивать каждый товар заново
const snapshot = p => ({
  id: p.id, title: p.title, author: p.author, format: p.format, price: p.price,
  oldPrice: p.oldPrice, stock: p.stock, image: p.image, c1: p.c1, c2: p.c2, genres: p.genres,
  rating: p.rating, reviewsCount: p.reviewsCount,
});

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => storage.get("user"));
  const [cart, setCart] = useState(() => storage.get("cart", []));
  const [favs, setFavs] = useState(() => storage.get("favs", []));
  const [toastText, setToastText] = useState("");
  const toastTimer = useRef();

  useEffect(() => { storage.set("user", user); }, [user]);
  useEffect(() => { storage.set("cart", cart); }, [cart]);
  useEffect(() => { storage.set("favs", favs); }, [favs]);

  const toast = useCallback(text => {
    setToastText(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastText(""), 2000);
  }, []);

  // ---------- Авторизация ----------
  const applyAuth = res => {
    setToken(res.token);
    setUser(res.data);
    return res.data;
  };
  const login = async (email, password) => applyAuth(await api.login(email, password));
  const register = async (name, email, password) => applyAuth(await api.register(name, email, password));
  const logout = useCallback(async () => {
    try { await api.logout(); } catch {}
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const onExpired = () => { setToken(null); setUser(null); };
    window.addEventListener("auth:expired", onExpired);
    return () => window.removeEventListener("auth:expired", onExpired);
  }, []);

  // ---------- Корзина ----------
  const addToCart = (product, qty = 1) => {
    setCart(items => {
      const found = items.find(i => i.id === product.id);
      if (found) return items.map(i => (i.id === product.id ? { ...i, qty: Math.min(i.stock, i.qty + qty) } : i));
      return [...items, { ...snapshot(product), qty: Math.min(product.stock, qty) }];
    });
    toast(`«${product.title}» в корзине`);
  };
  const setQty = (id, qty) =>
    setCart(items => items.flatMap(i => (i.id !== id ? [i] : qty <= 0 ? [] : [{ ...i, qty: Math.min(i.stock, qty) }])));
  const clearCart = () => setCart([]);

  // ---------- Избранное ----------
  const isFav = id => favs.some(f => f.id === id);
  const toggleFav = product => {
    const on = isFav(product.id);
    setFavs(list => (on ? list.filter(f => f.id !== product.id) : [...list, snapshot(product)]));
    toast(on ? "Убрано из избранного" : "Добавлено в избранное");
  };

  const value = {
    user, login, register, logout,
    cart, cartCount: cart.reduce((a, i) => a + i.qty, 0), inCart: id => cart.some(i => i.id === id),
    addToCart, setQty, clearCart,
    favs, isFav, toggleFav,
    toast,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
      <div className={`toast ${toastText ? "show" : ""}`}>{toastText}</div>
    </AppContext.Provider>
  );
}

// Загрузка данных с состояниями «загрузка / ошибка / готово»
export function useLoad(loader, deps) {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const reload = useCallback(() => {
    let cancelled = false;
    setState(s => ({ ...s, loading: true, error: null }));
    loader()
      .then(data => !cancelled && setState({ loading: false, error: null, data }))
      .catch(error => !cancelled && setState({ loading: false, error, data: null }));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(reload, [reload]);
  return useMemo(() => ({ ...state, reload }), [state, reload]);
}

export const money = n =>
  Number(n).toLocaleString("ru-RU", { maximumFractionDigits: 2 }) + " ₸";
export const formatName = f => (f === "manga" ? "Манга" : "Книга");
