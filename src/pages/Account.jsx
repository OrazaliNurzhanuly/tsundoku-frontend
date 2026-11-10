import { useNavigate } from "react-router-dom";
import { getOrders, ORDER_STATUSES } from "../api";
import { ErrorBox, Grid } from "../components/ui";
import { money, useApp, useLoad } from "../store";

export function StatusBadge({ status }) {
  const s = ORDER_STATUSES[status] || { label: status, tone: "new" };
  return <span className={`status ${s.tone}`}>{s.label}</span>;
}

export const dateRu = iso => (iso ? new Date(iso).toLocaleDateString("ru-RU") : "—");

export default function Account() {
  const { user, favs, logout, toast } = useApp();
  const navigate = useNavigate();
  const orders = useLoad(getOrders, []);

  const exit = async () => {
    await logout();
    toast("Вы вышли из аккаунта");
    navigate("/");
  };

  return (
    <>
      <div className="container page-head"><h1>Личный кабинет</h1></div>
      <div className="container account">
        <nav className="side-menu">
          <a href="#profile" className="active">Профиль</a>
          <a href="#orders">Заказы</a>
          <a href="#favs">Избранное</a>
          <button onClick={exit}>Выйти</button>
        </nav>
        <div>
          <div className="profile-card" id="profile">
            <div className="avatar">{user.name[0]?.toUpperCase()}</div>
            <div>
              <h3>{user.name}</h3>
              <div className="hint" style={{ fontSize: 15 }}>{user.email} · {user.role === "admin" ? "Администратор" : "Покупатель"}</div>
            </div>
          </div>

          <h2 id="orders" style={{ fontSize: 22, marginBottom: 14 }}>Мои заказы</h2>
          {orders.loading && <p className="hint">Загрузка…</p>}
          {orders.error && <ErrorBox error={orders.error} onRetry={orders.reload} />}
          {orders.data?.length === 0 && <p className="hint">Заказов пока нет.</p>}
          {orders.data?.length > 0 && (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Номер</th><th>Дата</th><th>Состав</th><th>Сумма</th><th>Статус</th></tr></thead>
                <tbody>
                  {orders.data.map(o => (
                    <tr key={o.id}>
                      <td><b>№{o.id}</b></td>
                      <td>{dateRu(o.created_at)}</td>
                      <td className="order-items">{o.items?.map(i => `${i.title} × ${i.quantity}`).join(", ")}</td>
                      <td>{money(o.total)}</td>
                      <td><StatusBadge status={o.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h2 id="favs" style={{ fontSize: 22, margin: "32px 0 14px" }}>Избранное</h2>
          {favs.length ? <Grid items={favs} /> : <p className="hint">Пока пусто — нажмите ♡ на любой обложке.</p>}
        </div>
      </div>
    </>
  );
}
