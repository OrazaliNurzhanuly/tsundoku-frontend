import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { isMockMode } from "../api/client";
import { storage } from "../api/storage";
import { useApp } from "../store";

const Icon = ({ d, children }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{d ? <path d={d} /> : children}</svg>
);

export const Logo = () => (
  <Link to="/" className="logo"><span className="logo-mark">積</span><span>Цундоку</span></Link>
);

function toggleTheme() {
  const root = document.documentElement;
  const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  root.dataset.theme = dark ? "light" : "dark";
  storage.set("theme", root.dataset.theme);
}

function Header() {
  const { user, cartCount, favs } = useApp();
  const [menu, setMenu] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => { setMenu(false); }, [location]);

  const search = e => {
    e.preventDefault();
    navigate(q.trim() ? `/catalog?search=${encodeURIComponent(q.trim())}` : "/catalog");
  };
  const isFormat = f => location.pathname === "/catalog" && new URLSearchParams(location.search).get("format") === f;

  return (
    <header className="site">
      <div className="container nav">
        <button className="icon-btn burger" onClick={() => setMenu(m => !m)} aria-label="Меню">
          <Icon d="M4 7h16M4 12h16M4 17h16" />
        </button>
        <Logo />
        <nav className={`nav-links ${menu ? "open" : ""}`}>
          <NavLink to="/catalog" end className={() => (location.pathname === "/catalog" && !location.search.includes("format=") ? "active" : "")}>Каталог</NavLink>
          <Link to="/catalog?format=manga" className={isFormat("manga") ? "active" : ""}>Манга</Link>
          <Link to="/catalog?format=book" className={isFormat("book") ? "active" : ""}>Книги</Link>
          {user?.role === "admin" && <NavLink to="/admin">Админка</NavLink>}
        </nav>
        <form className="search" onSubmit={search}>
          <Icon><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Icon>
          <input className="input" type="search" placeholder="Название или автор…" value={q} onChange={e => setQ(e.target.value)} />
        </form>
        <div className="nav-actions">
          <button className="icon-btn" onClick={toggleTheme} aria-label="Сменить тему">
            <Icon d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
          </button>
          <Link className="icon-btn" to="/account#favs" aria-label="Избранное">
            <Icon d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z" />
            {favs.length > 0 && <span className="count">{favs.length}</span>}
          </Link>
          <Link className="icon-btn" to="/cart" aria-label="Корзина">
            <Icon><path d="M5 7h14l-1.2 12.1a2 2 0 0 1-2 1.9H8.2a2 2 0 0 1-2-1.9L5 7z" /><path d="M9 7a3 3 0 0 1 6 0" /></Icon>
            {cartCount > 0 && <span className="count">{cartCount}</span>}
          </Link>
          <Link className="icon-btn" to={user ? "/account" : "/login"} aria-label="Профиль">
            <Icon><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Icon>
          </Link>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site">
      <div className="container">
        <div className="foot-grid">
          <div>
            <Logo />
            <p>積ん読 — привычка покупать книги быстрее, чем успеваешь их читать. Мы не против.</p>
          </div>
          <div><h5>Магазин</h5><Link to="/catalog?format=manga">Манга</Link><Link to="/catalog?format=book">Книги</Link><Link to="/catalog">Новинки</Link></div>
          <div><h5>Покупателям</h5><Link to="/cart">Корзина</Link><Link to="/account">Мои заказы</Link><Link to="/login">Вход</Link></div>
          <div><h5>Контакты</h5><span>Астана, пр. Мангилик Ел, 55</span><span>+7 (700) 000-00-00</span><span>hello@tsundoku.kz</span></div>
        </div>
        <div className="copy">© 2026 Цундоку · Курсовой проект, Astana Polytechnic</div>
      </div>
    </footer>
  );
}

export default function Layout() {
  const [mock, setMock] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => { isMockMode().then(setMock); }, []);
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  return (
    <>
      <div className="topbar">
        Бесплатная доставка по Астане от <b>15 000 ₸</b> · Самовывоз сегодня
        {mock && <span className="demo-badge" title="Бэкенд недоступен — используются тестовые данные">Демо-режим</span>}
      </div>
      <Header />
      <main><Outlet /></main>
      <Footer />
    </>
  );
}
