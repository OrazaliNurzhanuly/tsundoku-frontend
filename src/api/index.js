// Все запросы к бэкенду собраны здесь. Если API поменяется — правим только этот файл.
import { request } from "./client";

const COVER_COLORS = [
  ["#1b1b1f", "#7a1f1f"], ["#2b2d6e", "#9d4edd"], ["#d8572a", "#f7b538"], ["#4a4e4d", "#a3593c"],
  ["#e85d04", "#370617"], ["#7fb7be", "#d3f3ee"], ["#b5838d", "#ffcdb2"], ["#22223b", "#9a8c98"],
  ["#6a040f", "#111111"], ["#bc6c25", "#fefae0"], ["#0077b6", "#e9c46a"], ["#03045e", "#ff4d6d"],
];

// Приводим товар из API к виду, удобному интерфейсу. Поля, которых пока нет в API, остаются null.
export function normalizeProduct(p) {
  const [c1, c2] = COVER_COLORS[p.id % COVER_COLORS.length];
  const genres = [p.category?.name, ...(p.tags || []).map(t => t.name)].filter(Boolean);
  return {
    id: p.id,
    sku: p.sku,
    title: p.title,
    author: p.author,
    format: p.format,
    description: p.description,
    price: Number(p.price),
    oldPrice: p.old_price ? Number(p.old_price) : null,
    stock: p.stock ?? 0,
    image: p.image_url || p.image_path || null,
    category: p.category || null,
    tags: p.tags || [],
    genres,
    rating: p.rating != null ? Number(p.rating) : null,
    reviewsCount: p.reviews_count ?? null,
    year: p.year ?? null,
    pages: p.pages ?? null,
    publisher: p.publisher ?? null,
    age: p.age_rating ?? null,
    isPublished: p.is_published ?? true,
    createdAt: p.created_at,
    c1, c2,
  };
}

const page = res => ({ items: res.data.map(normalizeProduct), meta: res.meta });

// ---------- Каталог ----------
export const SORTS = {
  new: { sort: "created_at", direction: "desc", label: "Сначала новые" },
  cheap: { sort: "price", direction: "asc", label: "Сначала дешевле" },
  expensive: { sort: "price", direction: "desc", label: "Сначала дороже" },
  title: { sort: "title", direction: "asc", label: "По названию" },
};

export async function getProducts({ sort = "new", ...filters } = {}) {
  const { sort: s, direction } = SORTS[sort] || SORTS.new;
  return page(await request("GET", "/products", { query: { ...filters, sort: s, direction } }));
}

export async function getProduct(id) {
  return normalizeProduct((await request("GET", `/products/${id}`)).data);
}

// Публичного списка категорий в API пока нет — если запрос не удался, собираем категории из товаров
let categoriesCache = null;
export function getCategories() {
  categoriesCache ??= request("GET", "/categories")
    .then(res => res.data)
    .catch(async () => {
      const { items } = await getProducts({ per_page: 100 });
      const map = new Map(items.filter(p => p.category).map(p => [p.category.id, p.category]));
      return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "ru"));
    })
    .catch(() => []);
  return categoriesCache;
}

// ---------- Отзывы ----------
export async function getReviews(productId) {
  return (await request("GET", `/products/${productId}/reviews`)).data;
}
export async function createReview(productId, { rating, body }) {
  return (await request("POST", `/products/${productId}/reviews`, { body: { rating, body } })).data;
}

// ---------- Авторизация ----------
export const login = (email, password) => request("POST", "/auth/login", { body: { email, password } });
export const register = (name, email, password) =>
  request("POST", "/auth/register", { body: { name, email, password, password_confirmation: password } });
export const logout = () => request("POST", "/auth/logout");
export const getMe = () => request("GET", "/user");

// ---------- Заказы ----------
export async function getOrders() {
  return (await request("GET", "/orders")).data;
}
export async function getOrder(id) {
  return (await request("GET", `/orders/${id}`)).data;
}
export async function createOrder({ shippingName, shippingAddress, items }) {
  const body = {
    shipping_name: shippingName,
    shipping_address: shippingAddress,
    items: items.map(i => ({ product_id: i.id, quantity: i.qty })),
  };
  return (await request("POST", "/orders", { body })).data;
}

export const ORDER_STATUSES = {
  new: { label: "Новый", tone: "new" },
  paid: { label: "Оплачен", tone: "way" },
  shipped: { label: "В пути", tone: "way" },
  delivered: { label: "Доставлен", tone: "done" },
  cancelled: { label: "Отменён", tone: "new" },
};

// ---------- Админка ----------
export const admin = {
  products: async (p = 1) => page(await request("GET", "/admin/products", { query: { page: p } })),
  createProduct: data => request("POST", "/admin/products", { body: data }),
  updateProduct: (id, data) => request("PUT", `/admin/products/${id}`, { body: data }),
  deleteProduct: id => request("DELETE", `/admin/products/${id}`),
  categories: async () => (await request("GET", "/admin/categories", { query: { per_page: 100 } })).data,
  createCategory: data => request("POST", "/admin/categories", { body: data }),
  deleteCategory: id => request("DELETE", `/admin/categories/${id}`),
  report: async () => (await request("GET", "/admin/reports/orders")).data,
};
