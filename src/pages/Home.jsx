import { Link } from "react-router-dom";
import { getCategories, getProducts } from "../api";
import { Cover, ErrorBox, Grid, GridSkeleton, Rail } from "../components/ui";
import { useLoad } from "../store";

function Stack({ items }) {
  return (
    <div className="stack">
      {items.slice(0, 3).map((p, i) => (
        <div key={p.id} style={{ "--r": `${[-10, 2, 12][i]}deg` }}><Cover product={p} /></div>
      ))}
    </div>
  );
}

function Section({ title, link, linkText, state, rail }) {
  return (
    <section className="section container">
      <div className="section-head"><h2>{title}</h2>{link && <Link to={link}>{linkText} →</Link>}</div>
      {state.loading ? <GridSkeleton /> : state.error ? <ErrorBox error={state.error} onRetry={state.reload} />
        : rail ? <Rail items={state.data.items} /> : <Grid items={state.data.items} />}
    </section>
  );
}

export default function Home() {
  const manga = useLoad(() => getProducts({ format: "manga", per_page: 10 }), []);
  const books = useLoad(() => getProducts({ format: "book", per_page: 10 }), []);
  const fresh = useLoad(() => getProducts({ sort: "new", per_page: 5 }), []);
  const categories = useLoad(getCategories, []);

  return (
    <>
      <section className="hero container">
        <div className="hero-grid">
          <div className="hero-main">
            <div className="halftone" style={{ position: "absolute", inset: 0, opacity: 0.6 }} />
            <div className="kanji">積ん読</div>
            <h1>Книги и манга,<br />которые <em>затянут</em></h1>
            <p>От классики и фантастики до свежих томов любимой манги. Доставка по всему Казахстану.</p>
            <div className="row">
              <Link to="/catalog" className="btn btn-accent">Перейти в каталог →</Link>
              <Link to="/catalog?sort=new" className="btn btn-ghost">Новинки</Link>
            </div>
          </div>
          <div className="hero-side">
            <Link to="/catalog?format=manga" className="promo manga">
              <div><h3>Манга</h3><span>{manga.data ? `${manga.data.meta?.total ?? manga.data.items.length} томов в каталоге` : "Сёнэн, сэйнэн, сёдзё"} →</span></div>
              {manga.data && <Stack items={manga.data.items} />}
            </Link>
            <Link to="/catalog?format=book" className="promo books">
              <div><h3>Книги</h3><span>Классика, фантастика, нон-фикшн →</span></div>
              {books.data && <Stack items={books.data.items} />}
            </Link>
          </div>
        </div>
      </section>

      {categories.data?.length > 0 && (
        <section className="section container">
          <div className="section-head"><h2>Жанры</h2></div>
          <div className="genres">
            {categories.data.map(c => <Link key={c.id} className="chip" to={`/catalog?category_id=${c.id}`}>{c.name}</Link>)}
          </div>
        </section>
      )}

      <Section title="Манга" link="/catalog?format=manga" linkText="Смотреть все" state={manga} rail />
      <Section title="Новинки" link="/catalog?sort=new" linkText="Все новинки" state={fresh} />
      <Section title="Книги" link="/catalog?format=book" linkText="Все книги" state={books} rail />

      <section className="section container">
        <div className="features">
          <div className="feature"><div className="ico">🚚</div><b>Доставка за 1 день</b><p>По Астане и Алматы — курьером или в пункт выдачи.</p></div>
          <div className="feature"><div className="ico">📦</div><b>Бережная упаковка</b><p>Каждый том в плёнке и картоне — углы останутся целыми.</p></div>
          <div className="feature"><div className="ico">⭐</div><b>Отзывы читателей</b><p>Оценки и рецензии от реальных покупателей.</p></div>
          <div className="feature"><div className="ico">🔔</div><b>Новый том вышел</b><p>Подпишитесь на серию — сообщим о продолжении.</p></div>
        </div>
      </section>
    </>
  );
}
