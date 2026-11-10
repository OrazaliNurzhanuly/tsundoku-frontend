import { Link } from "react-router-dom";
import { formatName, money, useApp } from "../store";

export function Cover({ product, big }) {
  if (product.image) {
    return <img className="cover cover-img" src={product.image} alt={product.title} />;
  }
  return (
    <div className={`cover ${product.format}`} style={{ "--c1": product.c1, "--c2": product.c2 }}>
      <div className="c-type">{formatName(product.format)}</div>
      <div>
        <div className="c-title" style={big ? { fontSize: 30 } : undefined}>{product.title}</div>
        <div className="c-author" style={big ? { fontSize: 14 } : undefined}>{product.author}</div>
      </div>
    </div>
  );
}

const HeartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z" />
  </svg>
);

export function Price({ value, old }) {
  return (
    <div className="price">
      {money(value)}
      {old ? <s>{money(old)}</s> : null}
    </div>
  );
}

export function Rating({ product }) {
  return (
    <div className="card-meta">
      {product.rating != null && <span className="stars">★ {product.rating}</span>}
      <span>{product.rating != null ? "· " : ""}{formatName(product.format)}</span>
    </div>
  );
}

export function ProductCard({ product }) {
  const { addToCart, inCart, isFav, toggleFav } = useApp();
  const fav = isFav(product.id);
  const added = inCart(product.id);
  return (
    <article className="card">
      <div className="card-cover">
        <Link to={`/product/${product.id}`}><Cover product={product} /></Link>
        {product.oldPrice && <span className="badge">Скидка</span>}
        <button className={`fav ${fav ? "on" : ""}`} onClick={() => toggleFav(product)} aria-label="В избранное">
          <HeartIcon />
        </button>
      </div>
      <Rating product={product} />
      <Link to={`/product/${product.id}`} className="card-title">{product.title}</Link>
      <div className="card-author">{product.author}</div>
      <div className="card-foot">
        <Price value={product.price} old={product.oldPrice} />
        {product.stock > 0 ? (
          <button className={`add ${added ? "in" : ""}`} onClick={() => addToCart(product)} aria-label="В корзину">
            {added ? "✓" : "+"}
          </button>
        ) : (
          <span className="out">Нет в наличии</span>
        )}
      </div>
    </article>
  );
}

export const Grid = ({ items }) => <div className="grid">{items.map(p => <ProductCard key={p.id} product={p} />)}</div>;
export const Rail = ({ items }) => <div className="rail">{items.map(p => <ProductCard key={p.id} product={p} />)}</div>;

export function GridSkeleton({ count = 5 }) {
  return (
    <div className="grid">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card"><div className="cover skeleton" /><div className="skeleton line" /><div className="skeleton line short" /></div>
      ))}
    </div>
  );
}

export function ErrorBox({ error, onRetry }) {
  return (
    <div className="empty">
      <div className="big">誤</div>
      <p>{error?.message || "Что-то пошло не так."}</p>
      {onRetry && <button className="btn btn-ghost btn-sm" onClick={onRetry}>Повторить</button>}
    </div>
  );
}

export function Empty({ kanji = "無", title, children }) {
  return (
    <div className="container empty" style={{ padding: "90px 16px" }}>
      <div className="big">{kanji}</div>
      {title && <h2 style={{ margin: "12px 0" }}>{title}</h2>}
      {children}
    </div>
  );
}

export function Pager({ meta, onPage }) {
  if (!meta || meta.last_page <= 1) return null;
  const pages = Array.from({ length: meta.last_page }, (_, i) => i + 1);
  return (
    <nav className="pager">
      {pages.map(n => (
        <button key={n} className={`chip ${n === meta.current_page ? "active" : ""}`} onClick={() => onPage(n)}>{n}</button>
      ))}
    </nav>
  );
}
