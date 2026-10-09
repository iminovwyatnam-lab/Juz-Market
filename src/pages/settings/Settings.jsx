import { translate as t, useLanguage } from '../../preferences/preferences';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../auth/authApi';
import ProfileSettings from '../../preferences/ProfileSettings';
import '../profile/profile.css';

export default function Settings() {
  useLanguage();
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" state={{ from: '/settings' }} replace />;
  return (
    <main className="pf-page">
      <Link to="/profile" className="pf-back">← {t("Профиль")}</Link>
      <ProfileSettings key={user.id} user={user} />
    </main>
  );
}
