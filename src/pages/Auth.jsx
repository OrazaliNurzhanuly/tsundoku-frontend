import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../store";

function AuthForm({ mode }) {
  const reg = mode === "register";
  const { login, register, toast } = useApp();
  const navigate = useNavigate();
  const from = useLocation().state?.from || "/account";
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setSending(true);
    setError("");
    setErrors({});
    try {
      const user = reg ? await register(form.name, form.email, form.password) : await login(form.email, form.password);
      toast(`Добро пожаловать, ${user.name}!`);
      navigate(user.role === "admin" && from === "/account" ? "/admin" : from, { replace: true });
    } catch (err) {
      setErrors(err.errors || {});
      if (!Object.keys(err.errors || {}).length) setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const FieldError = ({ name }) => (errors[name] ? <span className="form-error">{errors[name][0]}</span> : null);

  return (
    <div className="container auth halftone">
      <form className="auth-card" onSubmit={submit}>
        <h1>{reg ? "Регистрация" : "Вход"}</h1>
        <p className="muted">
          {reg ? "Создайте аккаунт, чтобы отслеживать заказы и оставлять отзывы." : "С возвращением! Ваша стопка книг скучала."}
        </p>
        {reg && (
          <label className="field">Имя
            <input className="input" required maxLength={255} placeholder="Как к вам обращаться" value={form.name} onChange={set("name")} />
            <FieldError name="name" />
          </label>
        )}
        <label className="field">Email
          <input className="input" type="email" required placeholder="you@mail.kz" value={form.email} onChange={set("email")} />
          <FieldError name="email" />
        </label>
        <label className="field">Пароль
          <input className="input" type="password" required minLength={reg ? 8 : undefined} placeholder={reg ? "Минимум 8 символов" : ""} value={form.password} onChange={set("password")} />
          <FieldError name="password" />
        </label>
        {error && <div className="form-error">{error}</div>}
        <button className="btn btn-accent btn-block" disabled={sending}>
          {sending ? "Подождите…" : reg ? "Создать аккаунт" : "Войти"}
        </button>
        <div className="auth-switch">
          {reg ? <>Уже есть аккаунт? <Link to="/login">Войти</Link></> : <>Нет аккаунта? <Link to="/register">Зарегистрироваться</Link></>}
        </div>
      </form>
    </div>
  );
}

export const Login = () => <AuthForm mode="login" />;
export const Register = () => <AuthForm mode="register" />;
