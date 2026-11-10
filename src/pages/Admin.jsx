import { useState } from "react";
import { admin, ORDER_STATUSES } from "../api";
import { ErrorBox, Pager } from "../components/ui";
import { formatName, money, useApp, useLoad } from "../store";

const EMPTY_PRODUCT = { category_id: "", sku: "", title: "", author: "", format: "manga", description: "", price: "", stock: 0, is_published: true };

function ProductForm({ initial, categories, onClose, onSaved }) {
  const { toast } = useApp();
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const set = key => e => setForm(f => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const editing = Boolean(initial.id);

  const submit = async e => {
    e.preventDefault();
    setSending(true);
    setErrors({});
    setError("");
    const data = { ...form, category_id: Number(form.category_id), price: Number(form.price), stock: Number(form.stock) };
    delete data.id;
    try {
      if (editing) await admin.updateProduct(initial.id, data);
      else await admin.createProduct(data);
      toast(editing ? "Товар обновлён" : "Товар добавлен");
      onSaved();
    } catch (err) {
      setErrors(err.errors || {});
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const Err = ({ name }) => (errors[name] ? <span className="form-error">{errors[name][0]}</span> : null);

  return (
    <div className="modal-back" onClick={e => e.target === e.currentTarget && onClose()}>
      <form className="modal" onSubmit={submit}>
        <h3>{editing ? "Изменить товар" : "Новый товар"}</h3>
        <div className="form-grid">
          <label className="field full">Название<input className="input" required value={form.title} onChange={set("title")} /><Err name="title" /></label>
          <label className="field">Автор<input className="input" required value={form.author} onChange={set("author")} /><Err name="author" /></label>
          <label className="field">Артикул (SKU)<input className="input" required value={form.sku} onChange={set("sku")} /><Err name="sku" /></label>
          <label className="field">Формат
            <select className="input" value={form.format} onChange={set("format")}><option value="manga">Манга</option><option value="book">Книга</option></select>
          </label>
          <label className="field">Категория
            <select className="input" required value={form.category_id} onChange={set("category_id")}>
              <option value="">— выберите —</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <Err name="category_id" />
          </label>
          <label className="field">Цена, ₸<input className="input" type="number" min="0.01" step="0.01" required value={form.price} onChange={set("price")} /><Err name="price" /></label>
          <label className="field">Остаток, шт.<input className="input" type="number" min="0" value={form.stock} onChange={set("stock")} /><Err name="stock" /></label>
          <label className="field full">Описание<textarea className="input" value={form.description || ""} onChange={set("description")} /></label>
          <label className="check full"><input type="checkbox" checked={form.is_published} onChange={set("is_published")} /> Опубликован в каталоге</label>
        </div>
        {error && !Object.keys(errors).length && <div className="form-error">{error}</div>}
        <div className="row">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Отмена</button>
          <button className="btn btn-accent" disabled={sending}>{sending ? "Сохраняем…" : "Сохранить"}</button>
        </div>
      </form>
    </div>
  );
}

function Products({ categories }) {
  const { toast } = useApp();
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const products = useLoad(() => admin.products(page), [page]);

  const remove = async p => {
    if (!window.confirm(`Удалить «${p.title}»? Это действие нельзя отменить.`)) return;
    try {
      await admin.deleteProduct(p.id);
      toast("Товар удалён");
      products.reload();
    } catch (err) {
      toast(err.message);
    }
  };

  const edit = p => setEditing({
    id: p.id, category_id: p.category?.id ?? "", sku: p.sku, title: p.title, author: p.author, format: p.format,
    description: p.description || "", price: p.price, stock: p.stock, is_published: p.isPublished,
  });

  return (
    <>
      <div className="toolbar">
        <h2 style={{ fontSize: 22 }}>Товары</h2>
        <button className="btn btn-accent btn-sm" onClick={() => setEditing(EMPTY_PRODUCT)}>+ Добавить товар</button>
      </div>
      {products.error ? <ErrorBox error={products.error} onRetry={products.reload} /> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>ID</th><th>Название</th><th>Тип</th><th>Автор</th><th>Цена</th><th>Остаток</th><th>Статус</th><th /></tr></thead>
            <tbody>
              {products.loading && <tr><td colSpan={8} className="hint">Загрузка…</td></tr>}
              {products.data?.items.map(p => (
                <tr key={p.id}>
                  <td>{p.id}</td><td><b>{p.title}</b></td><td>{formatName(p.format)}</td><td>{p.author}</td>
                  <td>{money(p.price)}</td>
                  <td>{p.stock || <span className="status new">0</span>}</td>
                  <td>{p.isPublished ? <span className="status done">В каталоге</span> : <span className="status new">Скрыт</span>}</td>
                  <td>
                    <button className="link-btn" onClick={() => edit(p)}>Изменить</button>{" "}
                    <button className="link-btn" style={{ color: "var(--accent)" }} onClick={() => remove(p)}>Удалить</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager meta={products.data?.meta} onPage={setPage} />
      {editing && (
        <ProductForm initial={editing} categories={categories} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); products.reload(); }} />
      )}
    </>
  );
}

function Categories({ categories, reload }) {
  const { toast } = useApp();
  const [form, setForm] = useState({ name: "", slug: "" });
  const [error, setError] = useState("");

  const add = async e => {
    e.preventDefault();
    setError("");
    try {
      await admin.createCategory(form);
      setForm({ name: "", slug: "" });
      toast("Категория добавлена");
      reload();
    } catch (err) {
      setError(err.message);
    }
  };
  const remove = async c => {
    if (!window.confirm(`Удалить категорию «${c.name}»?`)) return;
    try {
      await admin.deleteCategory(c.id);
      toast("Категория удалена");
      reload();
    } catch (err) {
      toast(err.message);
    }
  };

  return (
    <>
      <h2 style={{ fontSize: 22, marginBottom: 14 }}>Категории</h2>
      <form className="inline-form" onSubmit={add}>
        <input className="input" required placeholder="Название, например «Сёнэн»" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        <input className="input" required pattern="[A-Za-z0-9_\-]+" placeholder="slug, например shonen" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} />
        <button className="btn btn-accent btn-sm">Добавить</button>
      </form>
      {error && <p className="form-error">{error}</p>}
      <div className="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>Название</th><th>Slug</th><th /></tr></thead>
          <tbody>
            {categories.map(c => (
              <tr key={c.id}>
                <td>{c.id}</td><td><b>{c.name}</b></td><td>{c.slug}</td>
                <td><button className="link-btn" style={{ color: "var(--accent)" }} onClick={() => remove(c)}>Удалить</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Report() {
  const report = useLoad(admin.report, []);
  if (report.loading) return <p className="hint">Загрузка…</p>;
  if (report.error) return <ErrorBox error={report.error} onRetry={report.reload} />;
  const r = report.data;
  return (
    <>
      <div className="stats">
        <div className="stat"><small>Сумма заказов</small><b>{money(r.total_order_value)}</b></div>
        <div className="stat"><small>Заказов</small><b>{r.total_orders}</b></div>
        <div className="stat"><small>Продано единиц</small><b>{r.total_units_ordered}</b></div>
        <div className="stat"><small>Статусы</small>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
            {r.orders_by_status.map(s => <span key={s.status} className="status way">{ORDER_STATUSES[s.status]?.label || s.status}: {s.count}</span>)}
          </div>
        </div>
      </div>
      <h3 style={{ marginBottom: 12 }}>Топ товаров</h3>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Товар</th><th>Продано</th><th>Сумма</th></tr></thead>
          <tbody>
            {r.top_products.length === 0 && <tr><td colSpan={3} className="hint">Заказов пока нет.</td></tr>}
            {r.top_products.map(p => <tr key={p.product_id}><td><b>{p.title}</b></td><td>{p.units_ordered}</td><td>{money(p.ordered_value)}</td></tr>)}
          </tbody>
        </table>
      </div>
    </>
  );
}

const TABS = [["report", "Отчёт"], ["products", "Товары"], ["categories", "Категории"]];

export default function Admin() {
  const [tab, setTab] = useState("report");
  const categories = useLoad(admin.categories, []);

  return (
    <>
      <div className="container page-head">
        <div className="crumbs">Панель администратора</div>
        <h1>Управление магазином</h1>
      </div>
      <div className="container account">
        <nav className="side-menu">
          {TABS.map(([v, l]) => <button key={v} className={tab === v ? "active" : ""} onClick={() => setTab(v)}>{l}</button>)}
        </nav>
        <div>
          {tab === "report" && <Report />}
          {tab === "products" && <Products categories={categories.data || []} />}
          {tab === "categories" && <Categories categories={categories.data || []} reload={categories.reload} />}
        </div>
      </div>
    </>
  );
}
