import { type ReactNode } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Icon, type IconName } from '../Icon';
import { Badge } from '../ui';
import { AccountMenu } from './AccountMenu';
import { useApp } from '../../state/app';

/**
 * Rahmen der App.
 *
 * `NgField` ist das Blob-Feld des Design-Systems und muss als erstes Element
 * im Body stehen — ohne farbige Flächen im Hintergrund hat `backdrop-filter`
 * nichts zu brechen und der ganze Stil fällt auf mattes Plastik zurück.
 */
export function NgField() {
  return (
    <div className="ng-field ng-drift" aria-hidden="true">
      <i />
      <i />
      <i />
    </div>
  );
}

interface NavEntry {
  to: string;
  label: string;
  icon: IconName;
  short: string;
}

const MAIN_NAV: NavEntry[] = [
  { to: '/studio', label: 'Ankleide', icon: 'studio', short: 'Ankleide' },
  { to: '/katalog', label: 'Katalog', icon: 'catalog', short: 'Katalog' },
  { to: '/kleiderschrank', label: 'Kleiderschrank', icon: 'wardrobe', short: 'Schrank' },
  { to: '/masse', label: 'Meine Maße', icon: 'ruler', short: 'Maße' },
];

const META_NAV: NavEntry[] = [
  { to: '/profil', label: 'Profil', icon: 'user', short: 'Profil' },
  { to: '/einstellungen', label: 'Einstellungen', icon: 'settings', short: 'Mehr' },
];

export function Brand({ compact }: { compact?: boolean }) {
  return (
    <Link to="/" className="brand" aria-label="FitRoom — zur Startseite">
      <span className="brand__mark">
        <Icon name="wardrobe" />
      </span>
      {!compact && <span>FitRoom</span>}
    </Link>
  );
}

function PlanBadge() {
  const plan = useApp((s) => s.plan);
  if (plan === 'pro') {
    return (
      <Badge tone="accent">
        <Icon name="crown" size={13} />
        Pro
      </Badge>
    );
  }
  return (
    <Link to="/preise">
      <Badge>Free</Badge>
    </Link>
  );
}

function NavList({ entries }: { entries: NavEntry[] }) {
  return (
    <ul className="nav">
      {entries.map((e) => (
        <li key={e.to}>
          <NavLink
            to={e.to}
            className={({ isActive }) => `nav__item ${isActive ? 'nav__item--active' : ''}`}
          >
            <Icon name={e.icon} />
            <span>{e.label}</span>
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

function TabBar() {
  const entries = [...MAIN_NAV, META_NAV[1]];
  return (
    <nav className="ng tabbar" aria-label="Hauptnavigation">
      {entries.map((e) => (
        <NavLink
          key={e.to}
          to={e.to}
          className={({ isActive }) => `tabbar__item ${isActive ? 'tabbar__item--active' : ''}`}
        >
          <Icon name={e.icon} />
          <span>{e.short}</span>
        </NavLink>
      ))}
    </nav>
  );
}

/** Rahmen für die Arbeitsseiten. */
export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <div className="shell">
        <div className="shell__brand">
          <Brand />
        </div>

        <header className="shell__top">
          <div className="topbar">
            <span className="topbar__title">{title}</span>
            <span className="topbar__spacer" />
            <PlanBadge />
            <AccountMenu />
          </div>
        </header>

        <nav className="shell__nav" aria-label="Bereiche">
          <NavList entries={MAIN_NAV} />
          <div className="nav__group">
            <div className="nav__label">Konto</div>
            <NavList entries={META_NAV} />
          </div>
        </nav>

        <main className="shell__main">{children}</main>
      </div>
      <TabBar />
    </>
  );
}

/** Die Links der öffentlichen Kopfzeile. */
const PUBLIC_LINKS = [
  { to: '/studio', label: 'Ankleide' },
  { to: '/katalog', label: 'Katalog' },
  { to: '/preise', label: 'Preise' },
];

/**
 * Kopfzeile der öffentlichen Seiten.
 *
 * Links Marke, rechts Konto. Die Seitenlinks stehen dazwischen und verschwinden
 * auf schmalen Bildschirmen — Marke und Konto bleiben immer, weil das die
 * beiden Dinge sind, die man in einer Kopfzeile sucht.
 */
function PublicHeader() {
  const { pathname } = useLocation();
  return (
    <header className="shell__top">
      <div className="masthead">
        <Brand />

        <nav className="masthead__links" aria-label="Bereiche">
          {PUBLIC_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`masthead__link ${pathname === l.to ? 'masthead__link--on' : ''}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <span className="topbar__spacer" />
        <AccountMenu />
      </div>
    </header>
  );
}

/**
 * Das Motto unter der Kopfzeile.
 *
 * Ein Satz, der sagt, wofür die App da ist — nicht was sie kann. Steht bewusst
 * über der Überschrift und nicht darin, damit er beim Seitenwechsel stehen
 * bleibt und zur Marke gehört statt zur Seite.
 */
export function Motto() {
  return (
    <p className="motto">
      <span className="motto__rule" aria-hidden="true" />
      Erst sehen, ob es passt. Dann bestellen.
      <span className="motto__rule" aria-hidden="true" />
    </p>
  );
}

/** Rahmen für die öffentlichen Seiten (Start, Preise, Anmeldung). */
export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="shell shell--public">
      <PublicHeader />
      <main className="shell__main">{children}</main>
    </div>
  );
}
