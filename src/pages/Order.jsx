import { Link, useParams } from "react-router-dom";
import { getOrder } from "../api";
import { Empty, ErrorBox } from "../components/ui";
import { money, useLoad } from "../store";
import { dateRu, StatusBadge } from "./Account";

export default function Order() {
  const { id } = useParams();
  const order = useLoad(() => getOrder(id), [id]);

  if (order.loading) return <div className="container page-head"><p className="hint">Загрузка…</p></div>;
  if (order.error?.status === 404 || order.error?.status === 403) {
    return <Empty kanji="無" title="Заказ не найден"><Link to="/account" className="btn">В личный кабинет</Link></Empty>;
  }
  if (order.error) return <div className="container"><ErrorBox error={order.error} onRetry={order.reload} /></div>;

  const o = order.data;
  return (
    <>
      <div className="container page-head">
        <div className="crumbs"><Link to="/account">Личный кабинет</Link> / Заказ №{o.id}</div>
        <h1>Заказ №{o.id}</h1>
      </div>
      <div className="container cart">
        <div className="table-wrap" style={{ alignSelf: "start" }}>
          <table>
            <thead><tr><th>Товар</th><th>Цена</th><th>Кол-во</th><th>Сумма</th></tr></thead>
            <tbody>
              {o.items.map(i => (
                <tr key={i.id}>
                  <td style={{ whiteSpace: "normal" }}><Link to={`/product/${i.product_id}`}><b>{i.title || `Товар #${i.product_id}`}</b></Link></td>
                  <td>{money(i.unit_price)}</td>
                  <td>{i.quantity}</td>
                  <td>{money(i.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <aside className="summary">
          <div className="line"><span>Статус</span><StatusBadge status={o.status} /></div>
          <div className="line"><span>Дата</span><span>{dateRu(o.created_at)}</span></div>
          <div><small className="hint">Получатель</small><div>{o.shipping_name}</div></div>
          <div><small className="hint">Доставка</small><div>{o.shipping_address}</div></div>
          <div className="line total"><span>Итого</span><span>{money(o.total)}</span></div>
        </aside>
      </div>
    </>
  );
}
