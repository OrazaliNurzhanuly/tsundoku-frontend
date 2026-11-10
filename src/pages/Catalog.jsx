import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getCategories, getProducts, SORTS } from "../api";
import { ErrorBox, Grid, GridSkeleton, Pager } from "../components/ui";
import { useLoad } from "../store";

const FORMATS = [["", "Всё"], ["book", "Книги"], ["manga", "Манга"]];

export default function Catalog() {
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filters = Object.fromEntries(params);
  const key = params.toString();

  const products = useLoad(() => getProducts({ per_page: 12, ...filters }), [key]);
  const categories = useLoad(getCategories, []);

  // Любое изменение фильтра сбрасывает страницу на первую
  const set = (name, value) => {
    const next = new URLSearchParams(params);
    if (value === "" || value === null || value === undefined) next.delete(name);
    else next.set(name, value);
    if (name !== "page") next.delete("page");
    setParams(next);
  };

  const format = filters.format || "";
  const title = filters.search ? `Поиск: «${filters.search}»` : format === "manga" ? "Манга" : format === "book" ? "Книги" : "Каталог";

  return (
    <>
      <div className="container page-head">
        <div className="crumbs"><Link to="/">Главная</Link> / Каталог</div>
        <h1>{title}</h1>
      </div>
      <div className="container catalog">
        <aside className={`filters ${filtersOpen ? "open" : ""}`}>
          <div>
            <h4>Тип</h4>
            <div className="seg">
              {FORMATS.map(([v, l]) => (
                <button key={v} className={format === v ? "active" : ""} onClick={() => set("format", v)}>{l}</button>
              ))}
            </div>
          </div>
          {categories.data?.length > 0 && (
            <div>
              <h4>Жанр</h4>
              <label className="check">
                <input type="radio" name="cat" checked={!filters.category_id} onChange={() => set("category_id", "")} /> Все жанры
              </label>
              {categories.data.map(c => (
                <label key={c.id} className="check">
                  <input type="radio" name="cat" checked={filters.category_id === String(c.id)} onChange={() => set("category_id", c.id)} /> {c.name}
                </label>
              ))}
            </div>
          )}
          <div>
            <h4>Цена, ₸</h4>
            <div className="price-range">
              <input className="input" type="number" min="0" key={"min" + (filters.min_price || "")} placeholder="от" defaultValue={filters.min_price || ""} onBlur={e => set("min_price", e.target.value)} />
              <input className="input" type="number" min="0" key={"max" + (filters.max_price || "")} placeholder="до" defaultValue={filters.max_price || ""} onBlur={e => set("max_price", e.target.value)} />
            </div>
          </div>
          <label className="check">
            <input type="checkbox" checked={filters.in_stock === "1"} onChange={e => set("in_stock", e.target.checked ? "1" : "")} /> Только в наличии
          </label>
          <Link to="/catalog" className="btn btn-ghost btn-sm">Сбросить фильтры</Link>
        </aside>

        <div>
          <div className="toolbar">
            <button className="btn btn-ghost btn-sm filters-toggle" onClick={() => setFiltersOpen(o => !o)}>Фильтры</button>
            <span className="found">{products.data ? `Найдено: ${products.data.meta?.total ?? products.data.items.length}` : "Загрузка…"}</span>
            <select className="input" value={filters.sort || "new"} onChange={e => set("sort", e.target.value)}>
              {Object.entries(SORTS).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
            </select>
          </div>
          {products.loading ? <GridSkeleton count={8} />
            : products.error ? <ErrorBox error={products.error} onRetry={products.reload} />
            : products.data.items.length === 0 ? (
              <div className="empty"><div className="big">無</div><p>Ничего не нашлось. Попробуйте изменить фильтры.</p></div>
            ) : (
              <>
                <Grid items={products.data.items} />
                <Pager meta={products.data.meta} onPage={n => { set("page", n); window.scrollTo(0, 0); }} />
              </>
            )}
        </div>
      </div>
    </>
  );
}
