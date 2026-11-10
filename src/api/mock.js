// Демо-бэкенд в браузере: отвечает в том же формате, что и Laravel API.
// Включается, когда настоящий сервер недоступен (см. VITE_USE_MOCK в .env.example).
// Тестовые аккаунты демо-режима: admin@tsundoku.test / admin12345, buyer@tsundoku.test / buyer12345
import { storage } from "./storage";

const CATEGORIES = [
  [1, "Сёнэн", "shonen"], [2, "Сэйнэн", "seinen"], [3, "Сёдзё", "shojo"], [4, "Классика", "classic"],
  [5, "Фантастика", "sci-fi"], [6, "Фэнтези", "fantasy"], [7, "Нон-фикшн", "non-fiction"],
].map(([id, name, slug]) => ({ id, name, slug, description: null }));

const TAGS = [
  [1, "Экшен"], [2, "Приключения"], [3, "Драма"], [4, "Хоррор"], [5, "Комедия"],
  [6, "Детектив"], [7, "Мистика"], [8, "Антиутопия"], [9, "Роман"], [10, "Детская"],
].map(([id, name]) => ({ id, name, slug: `tag-${id}` }));

// [id, format, title, author, price, old, stock, category, tags, year, pages, publisher, age, description]
const PRODUCTS = [
  [1, "manga", "Берсерк. Том 1", "Кэнтаро Миура", 4990, 5890, 14, 2, [6, 3], 2023, 448, "Альт Граф", "18+", "Тёмное фэнтези о Гатсе — наёмнике с огромным мечом, который бросает вызов судьбе и демоническим силам."],
  [2, "manga", "Магическая битва. Том 1", "Гэгэ Акутами", 3490, null, 30, 1, [1], 2024, 192, "Азбука", "16+", "Школьник Юдзи Итадори проглатывает проклятый палец и оказывается в мире магов и проклятий."],
  [3, "manga", "Ван-Пис. Том 1", "Эйитиро Ода", 3290, null, 22, 1, [2, 5], 2022, 384, "Азбука", "12+", "Монки Д. Луффи отправляется в море, чтобы найти легендарное сокровище и стать Королём пиратов."],
  [4, "manga", "Атака титанов. Том 1", "Хадзимэ Исаяма", 3790, 4290, 0, 1, [3, 1], 2021, 400, "Азбука", "16+", "Человечество живёт за стенами, защищаясь от гигантов-людоедов. Пока стены не падают."],
  [5, "manga", "Человек-бензопила. Том 1", "Тацуки Фудзимото", 3590, null, 9, 1, [4, 1], 2024, 384, "Комильфо", "18+", "Дэндзи сливается со своим псом-демоном и становится охотником на демонов."],
  [6, "manga", "Фрирен. Том 1", "Канэхито Ямада", 3390, null, 18, 1, [2], 2025, 192, "Истари", "12+", "Эльфийка-волшебница переживает своих товарищей и заново учится понимать людей."],
  [7, "manga", "Монолог фармацевта. Том 1", "Нацу Хюга", 3190, null, 11, 3, [6], 2025, 176, "Истари", "16+", "Девушка-травница во дворце императора раскрывает тайны с помощью знаний о ядах и лекарствах."],
  [8, "manga", "Ванпанчмен. Том 1", "ONE, Юсукэ Мурата", 3290, null, 25, 2, [5, 1], 2023, 400, "Азбука", "16+", "Сайтама побеждает любого противника одним ударом — и страдает от скуки."],
  [9, "book", "Мастер и Маргарита", "Михаил Булгаков", 2890, null, 40, 4, [7, 9], 2020, 480, "АСТ", "16+", "Роман о визите дьявола в Москву 1930-х, любви, творчестве и свободе."],
  [10, "book", "1984", "Джордж Оруэлл", 2490, 2990, 33, 4, [8], 2021, 320, "АСТ", "16+", "Мир тотальной слежки, где Большой Брат следит за каждым."],
  [11, "book", "Дюна", "Фрэнк Герберт", 4290, null, 12, 5, [2], 2022, 704, "АСТ", "16+", "Пол Атрейдес оказывается на пустынной планете Арракис — единственном источнике пряности."],
  [12, "book", "Путь Абая", "Мухтар Ауэзов", 3990, null, 16, 4, [9], 2023, 928, "Фолиант", "12+", "Эпопея о жизни Абая Кунанбаева и казахской степи XIX века."],
  [13, "book", "Атомные привычки", "Джеймс Клир", 3590, null, 50, 7, [], 2024, 304, "Питер", "12+", "Как маленькие изменения дают большие результаты."],
  [14, "book", "Ведьмак. Последнее желание", "Анджей Сапковский", 2990, null, 7, 6, [2], 2022, 352, "АСТ", "16+", "Геральт из Ривии — ведьмак, охотник на чудовищ за деньги."],
  [15, "book", "Маленький принц", "Антуан де Сент-Экзюпери", 1990, null, 60, 4, [10], 2021, 112, "Эксмо", "6+", "Философская сказка о дружбе, любви и ответственности."],
  [16, "book", "Задача трёх тел", "Лю Цысинь", 3890, null, 19, 5, [8], 2024, 464, "Fanzon", "16+", "Контакт с внеземной цивилизацией, начатый во времена Культурной революции."],
].map(([id, format, title, author, price, old, stock, category_id, tagIds, year, pages, publisher, age_rating, description], i) => ({
  id, sku: `TSN-${String(id).padStart(5, "0")}`, format, title, author, price: price.toFixed(2),
  old_price: old ? old.toFixed(2) : null, stock, category_id, tagIds, year, pages, publisher, age_rating, description,
  image_path: null, is_published: true, created_at: new Date(Date.UTC(2026, 9, 1 + i)).toISOString(),
}));

const SEED_REVIEWS = [
  [1, 2, 5, "Отличное издание, качественная бумага. Доставили за день!"],
  [1, 3, 4, "Перевод хороший, упаковка надёжная. Жду следующий том."],
  [3, 2, 5, "Классика, которую должен прочитать каждый."],
  [6, 3, 5, "Очень тёплая и грустная история."],
  [9, 2, 5, "Перечитываю каждый год."],
  [11, 3, 4, "Тяжело начинается, но потом не оторваться."],
];

function freshDb() {
  return {
    users: [
      { id: 1, name: "Администратор", email: "admin@tsundoku.test", password: "admin12345", role: "admin" },
      { id: 2, name: "Айгерим", email: "buyer@tsundoku.test", password: "buyer12345", role: "buyer" },
      { id: 3, name: "Данияр", email: "daniyar@tsundoku.test", password: "buyer12345", role: "buyer" },
    ],
    tokens: {},
    categories: CATEGORIES,
    products: PRODUCTS,
    reviews: SEED_REVIEWS.map(([product_id, user_id, rating, body], i) => ({
      id: i + 1, product_id, user_id, rating, body, created_at: "2026-10-20T10:00:00+00:00",
    })),
    orders: [
      { id: 1, user_id: 2, status: "delivered", shipping_name: "Айгерим", shipping_address: "Астана, пр. Мангилик Ел, 10", created_at: "2026-10-12T09:00:00+00:00",
        items: [{ id: 1, product_id: 1, quantity: 1, unit_price: "4990.00" }] },
      { id: 2, user_id: 2, status: "shipped", shipping_name: "Айгерим", shipping_address: "Астана, пр. Мангилик Ел, 10", created_at: "2026-10-28T09:00:00+00:00",
        items: [{ id: 2, product_id: 9, quantity: 2, unit_price: "2890.00" }, { id: 3, product_id: 6, quantity: 1, unit_price: "3390.00" }] },
    ],
    seq: { user: 3, product: 16, category: 7, review: SEED_REVIEWS.length, order: 2, item: 3 },
  };
}

const DB_KEY = "mock-db-v1";
let db = storage.get(DB_KEY) || freshDb();
const save = () => storage.set(DB_KEY, db);

// ---------- Форматы ответов как в Laravel Resources ----------
const ok = (body, status = 200) => ({ status, body });
const fail = (status, message, errors) => ({ status, body: errors ? { message, errors } : { message } });
const invalid = (field, message) => fail(422, message, { [field]: [message] });

const userResource = u => ({ id: u.id, name: u.name, email: u.email, role: u.role, created_at: "2026-10-01T00:00:00+00:00" });
const categoryById = id => db.categories.find(c => c.id === id);

function productResource(p) {
  const reviews = db.reviews.filter(r => r.product_id === p.id);
  const { tagIds, category_id, ...rest } = p;
  const category = categoryById(category_id);
  return {
    ...rest,
    category: category ? { id: category.id, name: category.name, slug: category.slug } : null,
    tags: TAGS.filter(t => tagIds.includes(t.id)),
    rating: reviews.length ? Math.round((reviews.reduce((a, r) => a + r.rating, 0) / reviews.length) * 10) / 10 : null,
    reviews_count: reviews.length,
  };
}

function orderResource(o) {
  const items = o.items.map(i => ({
    ...i,
    title: db.products.find(p => p.id === i.product_id)?.title,
    subtotal: (Number(i.unit_price) * i.quantity).toFixed(2),
  }));
  return {
    id: o.id, status: o.status, shipping_name: o.shipping_name, shipping_address: o.shipping_address,
    items, total: items.reduce((a, i) => a + Number(i.subtotal), 0).toFixed(2), created_at: o.created_at,
  };
}

function paginate(list, query, map = x => x) {
  const perPage = Math.min(100, Number(query.per_page) || 15);
  const lastPage = Math.max(1, Math.ceil(list.length / perPage));
  const current = Math.min(lastPage, Math.max(1, Number(query.page) || 1));
  const slice = list.slice((current - 1) * perPage, current * perPage);
  return {
    data: slice.map(map),
    links: {},
    meta: {
      current_page: current, last_page: lastPage, per_page: perPage, total: list.length,
      from: slice.length ? (current - 1) * perPage + 1 : null, to: slice.length ? (current - 1) * perPage + slice.length : null,
    },
  };
}

function issueToken(user) {
  const token = `mock-${user.id}-${Math.random().toString(36).slice(2)}`;
  db.tokens[token] = user.id;
  save();
  return token;
}

function validateProduct(data, partial) {
  const required = ["category_id", "sku", "title", "author", "format", "price"];
  for (const f of required) if (!partial && (data[f] === undefined || data[f] === "")) return invalid(f, `Поле ${f} обязательно.`);
  if (data.format !== undefined && !["book", "manga"].includes(data.format)) return invalid("format", "Формат должен быть book или manga.");
  if (data.price !== undefined && !(Number(data.price) > 0)) return invalid("price", "Цена должна быть больше нуля.");
  if (data.category_id !== undefined && !categoryById(Number(data.category_id))) return invalid("category_id", "Категория не найдена.");
  return null;
}

// ---------- Маршруты ----------
const routes = [];
const route = (method, pattern, handler, guard) =>
  routes.push({ method, regex: new RegExp(`^${pattern.replace(/:\w+/g, "(\\d+)")}$`), handler, guard });

route("GET", "/health", () => ok({ application: "Book Manga Shop (demo)", database: "mock" }));

route("POST", "/auth/register", ({ body }) => {
  if (!body.name) return invalid("name", "Укажите имя.");
  if (!/^\S+@\S+\.\S+$/.test(body.email || "")) return invalid("email", "Некорректный email.");
  if ((body.password || "").length < 8) return invalid("password", "Пароль должен быть не короче 8 символов.");
  if (body.password !== body.password_confirmation) return invalid("password", "Пароли не совпадают.");
  if (db.users.some(u => u.email === body.email)) return invalid("email", "Такой email уже зарегистрирован.");
  const user = { id: ++db.seq.user, name: body.name, email: body.email, password: body.password, role: "buyer" };
  db.users.push(user);
  return ok({ data: userResource(user), token: issueToken(user), token_type: "Bearer" }, 201);
});

route("POST", "/auth/login", ({ body }) => {
  const user = db.users.find(u => u.email === body.email && u.password === body.password);
  if (!user) return invalid("email", "Неверный email или пароль.");
  return ok({ data: userResource(user), token: issueToken(user), token_type: "Bearer" });
});

route("POST", "/auth/logout", ({ token }) => {
  delete db.tokens[token];
  save();
  return ok({ message: "Выход выполнен." });
}, "auth");

route("GET", "/user", ({ user }) => ok(userResource(user)), "auth");

route("GET", "/categories", () => ok({ data: db.categories }));

route("GET", "/products", ({ query }) => {
  let list = db.products.filter(p => p.is_published);
  const q = (query.search || "").toLowerCase();
  if (q) list = list.filter(p => (p.title + " " + p.author).toLowerCase().includes(q));
  if (query.category_id) list = list.filter(p => p.category_id === Number(query.category_id));
  if (query.format) list = list.filter(p => p.format === query.format);
  if (query.min_price) list = list.filter(p => Number(p.price) >= Number(query.min_price));
  if (query.max_price) list = list.filter(p => Number(p.price) <= Number(query.max_price));
  if (query.in_stock !== undefined) {
    const want = ["1", "true", true].includes(query.in_stock);
    list = list.filter(p => (want ? p.stock > 0 : p.stock === 0));
  }
  const key = query.sort || "created_at";
  const dir = query.direction === "asc" ? 1 : -1;
  list = [...list].sort((a, b) => {
    const [x, y] = key === "price" ? [Number(a.price), Number(b.price)] : [a[key], b[key]];
    return (typeof x === "string" ? x.localeCompare(y, "ru") : x - y) * dir;
  });
  return ok(paginate(list, query, productResource));
});

const findPublished = id => db.products.find(p => p.id === id && p.is_published);

route("GET", "/products/:id", ({ params }) => {
  const p = findPublished(params[0]);
  return p ? ok({ data: productResource(p) }) : fail(404, "Товар не найден.");
});

route("GET", "/products/:id/reviews", ({ params, query }) => {
  if (!findPublished(params[0])) return fail(404, "Товар не найден.");
  const list = db.reviews.filter(r => r.product_id === params[0]).sort((a, b) => b.id - a.id);
  return ok(paginate(list, query, r => ({
    id: r.id, rating: r.rating, body: r.body, user: { name: db.users.find(u => u.id === r.user_id)?.name }, created_at: r.created_at,
  })));
});

route("POST", "/products/:id/reviews", ({ params, body, user }) => {
  if (!findPublished(params[0])) return fail(404, "Товар не найден.");
  const rating = Number(body.rating);
  if (!(rating >= 1 && rating <= 5)) return invalid("rating", "Оценка от 1 до 5.");
  if (db.reviews.some(r => r.product_id === params[0] && r.user_id === user.id)) return invalid("product", "Вы уже оставили отзыв на этот товар.");
  const review = { id: ++db.seq.review, product_id: params[0], user_id: user.id, rating, body: body.body || null, created_at: new Date().toISOString() };
  db.reviews.push(review);
  save();
  return ok({ data: { id: review.id, rating, body: review.body, user: { name: user.name }, created_at: review.created_at } }, 201);
}, "auth");

route("GET", "/orders", ({ user, query }) => {
  const list = db.orders.filter(o => user.role === "admin" || o.user_id === user.id).sort((a, b) => b.id - a.id);
  return ok(paginate(list, query, orderResource));
}, "auth");

route("GET", "/orders/:id", ({ user, params }) => {
  const o = db.orders.find(x => x.id === params[0]);
  if (!o) return fail(404, "Заказ не найден.");
  if (user.role !== "admin" && o.user_id !== user.id) return fail(403, "This action is unauthorized.");
  return ok({ data: orderResource(o) });
}, "auth");

route("POST", "/orders", ({ user, body }) => {
  if (!body.shipping_name) return invalid("shipping_name", "Укажите имя получателя.");
  if (!body.shipping_address) return invalid("shipping_address", "Укажите адрес доставки.");
  if (!Array.isArray(body.items) || !body.items.length) return invalid("items", "Корзина пуста.");
  for (const item of body.items) {
    const p = db.products.find(x => x.id === item.product_id);
    if (!p) return invalid("items", "Товар не найден.");
    if (!p.is_published) return fail(409, `Товар «${p.title}» недоступен.`);
    if (p.stock < item.quantity) return fail(409, `Недостаточно товара «${p.title}» на складе.`);
  }
  const order = {
    id: ++db.seq.order, user_id: user.id, status: "new", shipping_name: body.shipping_name,
    shipping_address: body.shipping_address, created_at: new Date().toISOString(),
    items: body.items.map(item => {
      const p = db.products.find(x => x.id === item.product_id);
      p.stock -= item.quantity;
      return { id: ++db.seq.item, product_id: p.id, quantity: item.quantity, unit_price: p.price };
    }),
  };
  db.orders.push(order);
  save();
  return ok({ data: orderResource(order) }, 201);
}, "auth");

// ---------- Админка ----------
route("GET", "/admin/products", ({ query }) =>
  ok(paginate([...db.products].sort((a, b) => b.id - a.id), query, productResource)), "admin");

route("POST", "/admin/products", ({ body }) => {
  const error = validateProduct(body, false);
  if (error) return error;
  if (db.products.some(p => p.sku === body.sku)) return invalid("sku", "Такой артикул уже существует.");
  const p = {
    id: ++db.seq.product, tagIds: [], image_path: null, created_at: new Date().toISOString(), is_published: true,
    stock: 0, description: null, ...body, category_id: Number(body.category_id), price: Number(body.price).toFixed(2),
  };
  db.products.push(p);
  save();
  return ok({ data: productResource(p) }, 201);
}, "admin");

route("PUT", "/admin/products/:id", ({ params, body }) => {
  const p = db.products.find(x => x.id === params[0]);
  if (!p) return fail(404, "Товар не найден.");
  const error = validateProduct(body, true);
  if (error) return error;
  Object.assign(p, body, {
    category_id: Number(body.category_id ?? p.category_id),
    price: Number(body.price ?? p.price).toFixed(2),
    stock: Number(body.stock ?? p.stock),
  });
  save();
  return ok({ data: productResource(p) });
}, "admin");

route("DELETE", "/admin/products/:id", ({ params }) => {
  const used = db.orders.some(o => o.items.some(i => i.product_id === params[0])) || db.reviews.some(r => r.product_id === params[0]);
  if (used) return fail(409, "Нельзя удалить товар, связанный с заказом или отзывом.");
  db.products = db.products.filter(p => p.id !== params[0]);
  save();
  return ok(null, 204);
}, "admin");

route("GET", "/admin/categories", ({ query }) =>
  ok(paginate([...db.categories].sort((a, b) => a.name.localeCompare(b.name, "ru")), query)), "admin");

route("POST", "/admin/categories", ({ body }) => {
  if (!body.name) return invalid("name", "Укажите название.");
  if (!/^[\w-]+$/.test(body.slug || "")) return invalid("slug", "Slug: латиница, цифры, дефис.");
  if (db.categories.some(c => c.name === body.name || c.slug === body.slug)) return invalid("name", "Такая категория уже есть.");
  const c = { id: ++db.seq.category, name: body.name, slug: body.slug, description: body.description || null };
  db.categories.push(c);
  save();
  return ok({ data: c }, 201);
}, "admin");

route("DELETE", "/admin/categories/:id", ({ params }) => {
  if (db.products.some(p => p.category_id === params[0])) return fail(409, "Нельзя удалить категорию, пока в ней есть товары.");
  db.categories = db.categories.filter(c => c.id !== params[0]);
  save();
  return ok(null, 204);
}, "admin");

route("GET", "/admin/reports/orders", () => {
  const items = db.orders.flatMap(o => o.items);
  const byStatus = {};
  for (const o of db.orders) byStatus[o.status] = (byStatus[o.status] || 0) + 1;
  const byProduct = {};
  for (const i of items) {
    const row = (byProduct[i.product_id] ??= { product_id: i.product_id, title: db.products.find(p => p.id === i.product_id)?.title, units_ordered: 0, ordered_value: 0 });
    row.units_ordered += i.quantity;
    row.ordered_value += i.quantity * Number(i.unit_price);
  }
  return ok({
    data: {
      total_orders: db.orders.length,
      orders_by_status: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
      total_units_ordered: items.reduce((a, i) => a + i.quantity, 0),
      total_order_value: items.reduce((a, i) => a + i.quantity * Number(i.unit_price), 0).toFixed(2),
      top_products: Object.values(byProduct).sort((a, b) => b.units_ordered - a.units_ordered).slice(0, 5)
        .map(r => ({ ...r, ordered_value: r.ordered_value.toFixed(2) })),
    },
  });
}, "admin");

export async function mockRequest(method, path, { query = {}, body = {}, token }) {
  await new Promise(r => setTimeout(r, 150)); // имитация сети
  const user = db.users.find(u => u.id === db.tokens[token]);
  for (const r of routes) {
    const match = r.method === method && path.match(r.regex);
    if (!match) continue;
    if (r.guard && !user) return fail(401, "Unauthenticated.");
    if (r.guard === "admin" && user.role !== "admin") return fail(403, "Недостаточно прав.");
    return r.handler({ params: match.slice(1).map(Number), query, body: body || {}, user, token });
  }
  return fail(404, "Маршрут не найден.");
}

export function resetMockDb() {
  db = freshDb();
  save();
}
