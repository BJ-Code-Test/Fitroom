import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '../Icon';
import { Badge, Button } from '../ui';
import { useApp } from '../../state/app';
import { useAuth } from '../../state/auth';

/**
 * Konto in der Kopfzeile.
 *
 * Angemeldet: ein Menü mit Konto und Abmelden. Abgemeldet: Anmelden und
 * Registrieren als zwei getrennte Wege — wer noch kein Konto hat, soll nicht
 * erst auf der Anmeldeseite merken, dass er falsch ist.
 */
export function AccountMenu() {
  const { user, signOut } = useAuth();
  const plan = useApp((s) => s.plan);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointer = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) {
    return (
      <div className="row" style={{ gap: 8 }}>
        <Link to="/login">
          <Button size="sm" variant="quiet" icon="user">
            Anmelden
          </Button>
        </Link>
        <Link to="/registrieren">
          <Button size="sm" variant="primary">
            Konto anlegen
          </Button>
        </Link>
      </div>
    );
  }

  const name =
    (user.user_metadata?.display_name as string | undefined) ??
    user.email?.split('@')[0] ??
    'Konto';
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  return (
    <div className="account" ref={boxRef}>
      <button
        type="button"
        className="account__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="account__avatar" aria-hidden="true">
          {initial}
        </span>
        <span className="account__name">{name}</span>
        <Icon name="chevronDown" size={15} />
      </button>

      {open ? (
        <div className="ng account__menu" role="menu">
          <div className="account__head">
            <span className="strong">{name}</span>
            <span className="tiny muted">{user.email}</span>
            <span style={{ marginTop: 6 }}>
              {plan === 'pro' ? (
                <Badge tone="accent">
                  <Icon name="crown" size={12} /> Pro
                </Badge>
              ) : (
                <Badge>Free</Badge>
              )}
            </span>
          </div>

          <hr className="divider" />

          <Link to="/profil" role="menuitem" className="account__item" onClick={() => setOpen(false)}>
            <Icon name="user" size={17} />
            Konto
          </Link>
          <Link
            to="/einstellungen"
            role="menuitem"
            className="account__item"
            onClick={() => setOpen(false)}
          >
            <Icon name="settings" size={17} />
            Einstellungen
          </Link>
          {plan === 'free' ? (
            <Link to="/preise" role="menuitem" className="account__item" onClick={() => setOpen(false)}>
              <Icon name="crown" size={17} />
              Auf Pro wechseln
            </Link>
          ) : null}

          <hr className="divider" />

          <button
            type="button"
            role="menuitem"
            className="account__item account__item--danger"
            onClick={async () => {
              setOpen(false);
              await signOut();
              navigate('/');
            }}
          >
            <Icon name="logout" size={17} />
            Abmelden
          </button>
        </div>
      ) : null}
    </div>
  );
}
