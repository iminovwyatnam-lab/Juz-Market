import { useState } from 'react';
import { setPreference, translate as t, useLanguage } from './preferences';
import ProfileSupport from '../support/ProfileSupport';
import '../market/features.css';
import './theme.css';
const EMAIL = 'juzsupport@gmail.com';
export default function ProfileSettings({ user }) {
  const { language, theme } = useLanguage();
  const [error, setError] = useState('');
  function change(key, value) { try { setPreference(key, value); setError(''); } catch { setError(t('Не удалось сохранить настройки в браузере.')); } }
  const mail = subject => `mailto:${EMAIL}?subject=${encodeURIComponent(`Juz Market — ${t(subject)}`)}&body=${encodeURIComponent(t('Опишите проблему, укажите номер заказа или ссылку на товар. При необходимости приложите фото.'))}`;
  return <section className="jm-settings" id="settings">
    <h2>{t('Настройки')}</h2>
    <div className="jm-settings-controls">
      <label>{t('Язык сайта')}<select value={language} onChange={event => change('language', event.target.value)}><option value="ru">Русский</option><option value="uz">O‘zbekcha</option></select></label>
      <label>{t('Тема')}<select value={theme} onChange={event => change('theme', event.target.value)}><option value="light">{t('Светлая')}</option><option value="dark">{t('Тёмная')}</option></select></label>
    </div>
    {error && <p role="alert" className="jm-feature-error">{error}</p>}
    <div className="jm-settings-support">
      <h3>{t('Поддержка')}</h3><p>{t('Нашли баг, недоработку или столкнулись с обманом продавца? Напишите нам в чат или на почту.')}</p>
      <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
      <a href={mail('Ошибка на сайте')}>{t('Сообщить об ошибке')}</a>
      <a href={mail('Жалоба на продавца')}>{t('Пожаловаться на продавца')}</a>
      <p>{t('Откроется ваше почтовое приложение. Добавьте описание и фото, затем отправьте письмо.')}</p>
      <ProfileSupport key={user.id} user={user} />
    </div>
  </section>;
}
