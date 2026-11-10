import { Fragment, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { createReview, getProduct, getProducts, getReviews } from "../api";
import { Cover, Empty, ErrorBox, Grid, Price } from "../components/ui";
import { formatName, useApp, useLoad } from "../store";

const stars = n => "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);
const reviewsWord = n => {
  const [one, few, many] = ["отзыв", "отзыва", "отзывов"];
  const mod10 = n % 10, mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
};

function ReviewForm({ productId, onDone }) {
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      await createReview(productId, { rating, body });
      setBody("");
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <form className="review-form" onSubmit={submit}>
      <b>Ваш отзыв</b>
      <div className="star-pick">
        {[1, 2, 3, 4, 5].map(n => (
          <button type="button" key={n} className={n <= rating ? "on" : ""} onClick={() => setRating(n)} aria-label={`${n} из 5`}>★</button>
        ))}
      </div>
      <textarea className="input" placeholder="Что понравилось, что нет?" maxLength={2000} value={body} onChange={e => setBody(e.target.value)} />
      {error && <div className="form-error">{error}</div>}
      <button className="btn btn-accent btn-sm" disabled={sending} style={{ justifySelf: "start" }}>
        {sending ? "Отправляем…" : "Отправить"}
      </button>
    </form>
  );
}

export default function Product() {
  const { id } = useParams();
  const { user, addToCart, isFav, toggleFav } = useApp();
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState("about");

  const product = useLoad(() => getProduct(id), [id]);
  const reviews = useLoad(() => getReviews(id), [id]);
  const similar = useLoad(async () => {
    const p = await getProduct(id);
    const { items } = await getProducts(p.category ? { category_id: p.category.id, per_page: 6 } : { format: p.format, per_page: 6 });
    return items.filter(x => x.id !== p.id).slice(0, 5);
  }, [id]);

  if (product.loading) return <div className="container page-head"><p className="hint">Загрузка…</p></div>;
  if (product.error?.status === 404) {
    return <Empty kanji="無" title="Товар не найден"><Link to="/catalog" className="btn">В каталог</Link></Empty>;
  }
  if (product.error) return <div className="container"><ErrorBox error={product.error} onRetry={product.reload} /></div>;

  const p = product.data;
  const specs = [
    ["Автор", p.author], ["Категория", p.category?.name], ["Издательство", p.publisher], ["Год издания", p.year],
    ["Страниц", p.pages], ["Возраст", p.age], ["Артикул", p.sku],
  ].filter(([, v]) => v);
  const reviewList = reviews.data || [];
  const alreadyReviewed = user && reviewList.some(r => r.user?.name === user.name);

  return (
    <>
      <div className="container page-head">
        <div className="crumbs">
          <Link to="/">Главная</Link> / <Link to={`/catalog?format=${p.format}`}>{p.format === "manga" ? "Манга" : "Книги"}</Link> / {p.title}
        </div>
      </div>
      <div className="container product">
        <div className="cover-wrap"><Cover product={p} big /></div>
        <div>
          <div className="card-meta">
            {p.rating != null && <span className="stars">★ {p.rating}</span>}
            <span>{p.reviewsCount != null ? `· ${p.reviewsCount} ${reviewsWord(p.reviewsCount)} · ` : ""}{formatName(p.format)}</span>
          </div>
          <h1>{p.title}</h1>
          <div className="by">{p.author}</div>
          <div className="tags">
            {p.category && <Link className="tag" to={`/catalog?category_id=${p.category.id}`}>{p.category.name}</Link>}
            {p.tags.map(t => <span key={t.id} className="tag">{t.name}</span>)}
            {p.age && <span className="tag">{p.age}</span>}
          </div>

          <div className="buybox">
            <Price value={p.price} old={p.oldPrice} />
            {p.stock > 0 ? (
              <>
                <div className="qty">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                  <span>{qty}</span>
                  <button onClick={() => setQty(q => Math.min(p.stock, q + 1))}>+</button>
                </div>
                <button className="btn btn-accent" onClick={() => addToCart(p, qty)}>В корзину</button>
              </>
            ) : (
              <button className="btn" disabled>Нет в наличии</button>
            )}
            <button className="btn btn-ghost" onClick={() => toggleFav(p)}>{isFav(p.id) ? "♥ В избранном" : "♡ В избранное"}</button>
            <div className={`stock ${p.stock ? "" : "no"}`}>
              {p.stock ? `● В наличии: ${p.stock} шт. · доставка завтра` : "● Сообщим, когда появится"}
            </div>
          </div>

          <div className="tabs">
            <button className={tab === "about" ? "active" : ""} onClick={() => setTab("about")}>Описание</button>
            <button className={tab === "specs" ? "active" : ""} onClick={() => setTab("specs")}>Характеристики</button>
            <button className={tab === "reviews" ? "active" : ""} onClick={() => setTab("reviews")}>Отзывы ({reviewList.length})</button>
          </div>

          {tab === "about" && <p>{p.description || "Описание скоро появится."}</p>}
          {tab === "specs" && (
            <dl className="specs">{specs.map(([k, v]) => <Fragment key={k}><dt>{k}</dt><dd>{v}</dd></Fragment>)}</dl>
          )}
          {tab === "reviews" && (
            <div>
              {reviews.loading && <p className="hint">Загрузка отзывов…</p>}
              {reviews.error && <ErrorBox error={reviews.error} onRetry={reviews.reload} />}
              {!reviews.loading && reviewList.length === 0 && <p className="hint">Отзывов пока нет — станьте первым.</p>}
              {reviewList.map(r => (
                <div key={r.id} className="review">
                  <b>{r.user?.name || "Покупатель"}</b><span className="stars">{stars(r.rating)}</span>
                  {r.body && <p>{r.body}</p>}
                </div>
              ))}
              {!user && <p className="hint" style={{ marginTop: 16 }}><Link to="/login" style={{ color: "var(--accent)" }}>Войдите</Link>, чтобы оставить отзыв.</p>}
              {user && !alreadyReviewed && <ReviewForm productId={p.id} onDone={() => { reviews.reload(); product.reload(); }} />}
            </div>
          )}
        </div>
      </div>

      {similar.data?.length > 0 && (
        <section className="section container">
          <div className="section-head"><h2>Похожие</h2></div>
          <Grid items={similar.data} />
        </section>
      )}
    </>
  );
}
