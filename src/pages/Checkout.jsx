import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { createOrder } from "../api";
import { Empty } from "../components/ui";
import { money, useApp } from "../store";
import { cartTotals } from "./Cart";

const DELIVERY = [
  ["courier", "Курьер", "Завтра, 10:00–22:00"],
  ["point", "Пункт выдачи", "Через 1–2 дня"],
  ["pickup", "Самовывоз из магазина", "Сегодня · пр. Мангилик Ел, 55"],
];
const PAYMENT = [["card", "Картой онлайн", "Visa, Mastercard"], ["kaspi", "Kaspi QR", "Оплата через приложение"], ["cash", "При получении", "Наличными или картой"]];

export default function Checkout() {
  const { user, cart, clearCart, toast } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: user?.name || "", phone: "", city: "Астана", address: "", delivery: "courier", payment: "card" });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [sending, setSending] = useState(false);

  if (!cart.length) return <Navigate to="/cart" replace />;
  const { sum, delivery } = cartTotals(cart);
  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setSending(true);
    setError("");
    setFieldErrors({});
    // В API пока есть только имя и адрес — телефон, доставку и оплату дописываем в адрес
    const way = DELIVERY.find(d => d[0] === form.delivery)[1];
    const pay = PAYMENT.find(p => p[0] === form.payment)[1];
    const place = form.delivery === "pickup" ? "Самовывоз: пр. Мангилик Ел, 55" : `${form.city}, ${form.address}`;
    try {
      const order = await createOrder({
        shippingName: form.name,
        shippingAddress: `${place}. Тел.: ${form.phone}. ${way}, оплата: ${pay}`,
        items: cart,
      });
      clearCart();
      toast("Заказ оформлен!");
      navigate(`/done/${order.id}`, { state: { order } });
    } catch (err) {
      setError(err.message);
      setFieldErrors(err.errors || {});
    } finally {
      setSending(false);
    }
  };

  const Radio = ({ name, value, title, sub }) => (
    <label className="radio-card">
      <input type="radio" name={name} checked={form[name] === value} onChange={() => setForm(f => ({ ...f, [name]: value }))} />
      <div><b>{title}</b><small>{sub}</small></div>
    </label>
  );

  return (
    <>
      <div className="container page-head">
        <div className="crumbs"><Link to="/cart">Корзина</Link> / Оформление</div>
        <h1>Оформление заказа</h1>
        <div className="steps"><span>1. Корзина</span><span className="on">2. Доставка и оплата</span><span>3. Готово</span></div>
      </div>
      <div className="container cart" style={{ paddingTop: 0 }}>
        <form onSubmit={submit} style={{ display: "grid", gap: 28 }}>
          <div>
            <h3 style={{ marginBottom: 14 }}>Получатель</h3>
            <div className="form-grid">
              <label className="field">Имя<input className="input" required value={form.name} onChange={set("name")} />
                {fieldErrors.shipping_name && <span className="form-error">{fieldErrors.shipping_name[0]}</span>}
              </label>
              <label className="field">Телефон<input className="input" required type="tel" placeholder="+7 (___) ___-__-__" value={form.phone} onChange={set("phone")} /></label>
            </div>
          </div>
          <div>
            <h3 style={{ marginBottom: 14 }}>Доставка</h3>
            <div style={{ display: "grid", gap: 10 }}>
              {DELIVERY.map(([v, t, s]) => <Radio key={v} name="delivery" value={v} title={t} sub={s} />)}
            </div>
          </div>
          {form.delivery !== "pickup" && (
            <div className="form-grid">
              <label className="field">Город<input className="input" required value={form.city} onChange={set("city")} /></label>
              <label className="field">Адрес<input className="input" required placeholder="Улица, дом, квартира" value={form.address} onChange={set("address")} />
                {fieldErrors.shipping_address && <span className="form-error">{fieldErrors.shipping_address[0]}</span>}
              </label>
            </div>
          )}
          <div>
            <h3 style={{ marginBottom: 14 }}>Оплата</h3>
            <div style={{ display: "grid", gap: 10 }}>
              {PAYMENT.map(([v, t, s]) => <Radio key={v} name="payment" value={v} title={t} sub={s} />)}
            </div>
          </div>
          {error && <div className="form-error">{error}</div>}
          <button className="btn btn-accent" disabled={sending}>{sending ? "Оформляем…" : "Подтвердить заказ"}</button>
        </form>
        <aside className="summary">
          <h3>Состав заказа</h3>
          {cart.map(i => <div key={i.id} className="line"><span>{i.title} × {i.qty}</span><span>{money(i.price * i.qty)}</span></div>)}
          <div className="line"><span>Доставка</span><span>{delivery ? money(delivery) : "Бесплатно"}</span></div>
          <div className="line total"><span>Итого</span><span>{money(sum + delivery)}</span></div>
        </aside>
      </div>
    </>
  );
}

export function OrderDone() {
  const { id } = useParams();
  const order = useLocation().state?.order;
  return (
    <Empty kanji="完" title={`Заказ №${id} оформлен!`}>
      {order && <p>Сумма товаров: <b>{money(order.total)}</b> (доставка оплачивается отдельно). Статус можно отслеживать в личном кабинете.</p>}
      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 16, flexWrap: "wrap" }}>
        <Link to="/account" className="btn">Мои заказы</Link>
        <Link to="/catalog" className="btn btn-ghost">Продолжить покупки</Link>
      </div>
    </Empty>
  );
}
