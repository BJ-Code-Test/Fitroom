import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { PaywallProvider } from './components/Paywall';
import { AuthProvider, useAuth } from './state/auth';
import { useApp } from './state/app';
import { applyTheme, useUi } from './state/ui';

import Home from './pages/Home';
import Pricing from './pages/Pricing';
import Studio from './pages/Studio';
import Catalog from './pages/Catalog';
import GarmentDetail from './pages/GarmentDetail';
import Wardrobe from './pages/Wardrobe';
import Measurements from './pages/Measurements';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import { Login, Register } from './pages/Auth';
import NotFound from './pages/NotFound';

/** Alle Routen der App an einer Stelle — auch die Prüfung liest sie hier. */
export const ROUTES = [
  '/',
  '/preise',
  '/studio',
  '/katalog',
  '/katalog/:id',
  '/kleiderschrank',
  '/masse',
  '/profil',
  '/einstellungen',
  '/login',
  '/registrieren',
] as const;

/** Das gewählte Aussehen auf <html> spiegeln. */
function ThemeBridge() {
  const theme = useUi((s) => s.theme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return null;
}

/**
 * Lädt die Daten neu, sobald sich die Anmeldung ändert.
 * Als Gast ist `userId` null — dann kommt alles aus dem localStorage.
 */
function DataBridge() {
  const { user, loading } = useAuth();
  const hydrate = useApp((s) => s.hydrate);

  useEffect(() => {
    if (loading) return;
    void hydrate(user?.id ?? null);
  }, [user?.id, loading, hydrate]);

  return null;
}

/** Beim Seitenwechsel nach oben — sonst startet die neue Seite mittendrin. */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeBridge />
      <DataBridge />
      <ScrollToTop />
      <PaywallProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/preise" element={<Pricing />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/katalog" element={<Catalog />} />
          <Route path="/katalog/:id" element={<GarmentDetail />} />
          <Route path="/kleiderschrank" element={<Wardrobe />} />
          <Route path="/masse" element={<Measurements />} />
          <Route path="/profil" element={<Profile />} />
          <Route path="/einstellungen" element={<Settings />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registrieren" element={<Register />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </PaywallProvider>
    </AuthProvider>
  );
}
