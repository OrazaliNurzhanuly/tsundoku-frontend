# Цундоку — фронтенд

Клиентская часть интернет-магазина книг и манги. React 18 + React Router 6, сборщик Vite 5, стили — обычный CSS с переменными (светлая и тёмная темы, адаптив под телефон).

## Запуск

```bash
npm install
npm run dev
```

Сайт откроется на http://localhost:5173.

## Подключение к бэкенду

Скопируйте `.env.example` в `.env` и укажите адрес API:

```dotenv
VITE_API_URL=http://127.0.0.1:8000/api
VITE_USE_MOCK=auto
```

- `auto` — если бэкенд не отвечает на `/api/health`, сайт работает на тестовых данных (в шапке появляется метка «Демо-режим»);
- `true` — всегда тестовые данные;
- `false` — только настоящий бэкенд.

Если бэкенд запущен на другом компьютере (`php artisan serve --host=0.0.0.0`), укажите его IP: `VITE_API_URL=http://192.168.1.25:8000/api`.

### Тестовые аккаунты демо-режима

| Роль | Email | Пароль |
|---|---|---|
| Администратор | admin@tsundoku.test | admin12345 |
| Покупатель | buyer@tsundoku.test | buyer12345 |

Данные демо-режима хранятся в `localStorage` браузера (ключ `mock-db-v1`); чтобы сбросить — очистите данные сайта.

## Структура

```
src/
  api/
    client.js   — fetch-обёртка: базовый URL, Bearer-токен, ошибки, выбор демо-режима
    index.js    — все запросы к API и приведение товара к виду интерфейса
    mock.js     — демо-бэкенд в браузере с тем же форматом ответов, что у Laravel API
    storage.js  — безопасная работа с localStorage
  components/   — шапка, подвал, карточка товара, обложка, пагинация
  pages/        — Главная, Каталог, Товар, Корзина, Оформление, Вход/Регистрация, Кабинет, Админка
  store.jsx     — общее состояние: пользователь, корзина, избранное, уведомления
  styles.css    — стили (из дизайн-прототипа)
```

## Что берётся из API

| Экран | Эндпоинты |
|---|---|
| Главная, каталог | `GET /products` (format, category_id, search, min_price, max_price, in_stock, sort, direction, page), `GET /categories`* |
| Карточка товара | `GET /products/{id}`, `GET/POST /products/{id}/reviews` |
| Вход, регистрация | `POST /auth/login`, `POST /auth/register`, `POST /auth/logout` |
| Оформление, кабинет | `POST /orders`, `GET /orders` |
| Админка | `/admin/products`, `/admin/categories`, `/admin/reports/orders` |

\* Публичного `/categories` в API пока нет — фронт собирает категории из товаров. Поля `rating`, `reviews_count`, `old_price`, `year`, `pages`, `publisher`, `age_rating`, `image_url` фронт показывает, если бэкенд их отдаёт, и скрывает, если нет.

Корзина и избранное хранятся на клиенте (`localStorage`).
