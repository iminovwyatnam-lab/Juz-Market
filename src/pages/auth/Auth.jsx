import { translate as t, useLanguage } from '../../preferences/preferences';
// src/pages/auth/Auth.jsx
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './auth.css';
import { register, login } from '../../auth/authApi';
import juz_logo from '../../assets/Juz-Market-Photo/juz-market-logo-for-header.png';

const EMPTY = {
  name: '',
  surname: '',
  login: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export default function Auth() {
    useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isRegister = mode === 'register';

  function change(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function switchMode(next) {
    setMode(next);
    setForm(EMPTY);
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (isRegister) {
      if (!form.name.trim() || !form.surname.trim() || !form.login.trim() || !form.email.trim()) {
        setError(t("Заполните все поля"));
        return;
      }
      if (form.password.length < 8) {
        setError(t("Пароль должен быть не короче 8 символов"));
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError(t("Пароли не совпадают"));
        return;
      }
    } else if (!form.login.trim() || !form.password) {
      setError(t("Введите логин и пароль"));
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        await register({
          name: form.name.trim(),
          surname: form.surname.trim(),
          login: form.login.trim(),
          email: form.email.trim(),
          password: form.password,
          confirmPassword: form.confirmPassword,
        });
      } else {
        await login(form.login.trim(), form.password);
      }
      navigate(location.state?.from || '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/">
          <img className="auth-logo" src={juz_logo} alt="Juz Market" />
        </Link>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === 'login' ? 'auth-tab active' : 'auth-tab'}
            onClick={() => switchMode('login')}
          >{t("Вход")}</button>
          <button
            type="button"
            className={mode === 'register' ? 'auth-tab active' : 'auth-tab'}
            onClick={() => switchMode('register')}
          >{t("Регистрация")}</button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {isRegister && (
            <div className="auth-row">
              <label className="auth-label">{t("Имя")}<input
                  className="auth-input"
                  type="text"
                  value={form.name}
                  onChange={change('name')}
                  autoComplete="given-name"
                />
              </label>
              <label className="auth-label">{t("Фамилия")}<input
                  className="auth-input"
                  type="text"
                  value={form.surname}
                  onChange={change('surname')}
                  autoComplete="family-name"
                />
              </label>
            </div>
          )}

          <label className="auth-label">{t("Логин")}<input
              className="auth-input"
              type="text"
              value={form.login}
              onChange={change('login')}
              placeholder={t("например, xdkkin")}
              autoComplete="username"
            />
          </label>

          {isRegister && (
            <label className="auth-label">{t("Почта")}<input
                className="auth-input"
                type="email"
                value={form.email}
                onChange={change('email')}
                placeholder="name@gmail.com"
                autoComplete="email"
              />
            </label>
          )}

          <label className="auth-label">{t("Пароль")}<input
              className="auth-input"
              type="password"
              value={form.password}
              onChange={change('password')}
              placeholder={isRegister ? t("не короче 8 символов") : ''}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
            />
          </label>

          {isRegister && (
            <label className="auth-label">{t("Подтвердите пароль")}<input
                className="auth-input"
                type="password"
                value={form.confirmPassword}
                onChange={change('confirmPassword')}
                autoComplete="new-password"
              />
            </label>
          )}

          {error && <p className="auth-error">{t(error)}</p>}

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? t("Подождите...") : isRegister ? t("Зарегистрироваться") : t("Войти")}
          </button>
        </form>

        <p className="auth-hint">
          {isRegister ? (
            <>{t("Уже есть аккаунт?")}{' '}
              <button type="button" className="auth-link" onClick={() => switchMode('login')}>{t("Войти")}</button>
            </>
          ) : (
            <>{t("Нет аккаунта?")}{' '}
              <button type="button" className="auth-link" onClick={() => switchMode('register')}>{t("Зарегистрироваться")}</button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
