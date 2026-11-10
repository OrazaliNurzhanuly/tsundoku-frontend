import { Link } from "react-router-dom";
import { Cover, Empty } from "../components/ui";
import { formatName, money, useApp } from "../store";

export const FREE_DELIVERY_FROM = 15000;
export const DELIVERY_PRICE = 1500;

export function cartTotals(cart) {
  const sum = cart.reduce((a, i) => a + i.price * i.qty, 0);
  const discount = cart.reduce((a, i) => a + ((i.oldPrice || i.price) - i.price) * i.qty, 0);
  const delivery = sum >= FREE_DELIVERY_FROM ? 0 : DELIVERY_PRICE;
  return { sum, discount, delivery, count: cart.reduce((a, i) => a + i.qty, 0) };
}

export default function Cart() {
  const { cart, setQty } = useApp();
  if (!cart.length) {
    return (
      <Empty kanji="空" title="Корзина пуста">
        <p>Самое время добавить что-нибудь в стопку непрочитанного.</p>
        <Link to="/catalog" className="btn btn-accent" style={{ marginTop: 12 }}>В каталог</Link>
      </Empty>
    );
  }
  const { sum, discount, delivery, count } = cartTotals(cart);

  return (
    <>
      <div className="container page-head"><h1>Корзина</h1></div>
      <div className="container cart">
        <div>
          {cart.map(item => (
            <div key={item.id} className="cart-item">
              <Link to={`/product/${item.id}`}><Cover product={item} /></Link>
              <div>
                <Link to={`/product/${item.id}`} className="card-title">{item.title}</Link>
                <div className="card-author" style={{ marginTop: 2 }}>{item.author} · {formatName(item.format)}</div>
              </div>
              <div className="right">
                <div className="price">{money(item.price * item.qty)}</div>
                <div className="qty">
                  <button onClick={() => setQty(item.id, item.qty - 1)}>−</button>
                  <span>{item.qty}</span>
                  <button onClick={() => setQty(item.id, item.qty + 1)} disabled={item.qty >= item.stock}>+</button>
                </div>
                <button className="link-btn" onClick={() => setQty(item.id, 0)}>Удалить</button>
              </div>
            </div>
          ))}
        </div>
        <aside className="summary">
          <h3>Ваш заказ</h3>
          <div className="line"><span>Товары ({count})</span><span>{money(sum + discount)}</span></div>
          {discount > 0 && <div className="line" style={{ color: "var(--accent)" }}><span>Скидка</span><span>−{money(discount)}</span></div>}
          <div className="line"><span>Доставка</span><span>{delivery ? money(delivery) : "Бесплатно"}</span></div>
          {delivery > 0 && <small className="hint">Добавьте ещё на {money(FREE_DELIVERY_FROM - sum)} для бесплатной доставки</small>}
          <div className="line total"><span>Итого</span><span>{money(sum + delivery)}</span></div>
          <Link to="/checkout" className="btn btn-accent btn-block">Оформить заказ</Link>
        </aside>
      </div>
    </>
  );
}
