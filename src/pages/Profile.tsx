import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/Shell';
import { Icon } from '../components/Icon';
import { Badge, Button, Field, Notice, Panel, TextInput } from '../components/ui';
import { usePaywall } from '../components/Paywall';
import { cancelSubscription } from '../lib/billing';
import { FEATURE_LABEL, PRO_PRICE, type Feature } from '../lib/plan';
import { exportAll } from '../data/repo';
import { useApp } from '../state/app';
import { useAuth } from '../state/auth';

const PRO_FEATURES: Feature[] = ['allProviders', 'fitDetails', 'unlimitedSaves', 'hdExport', 'styleAdvisor'];

/** Konto, Tarif und Datenexport. */
export default function Profile() {
  const navigate = useNavigate();
  const { user, signOut, available } = useAuth();
  const paywall = usePaywall();

  const plan = useApp((s) => s.plan);
  const setPlan = useApp((s) => s.setPlan);
  const outfits = useApp((s) => s.outfits);
  const favorites = useApp((s) => s.favorites);

  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const displayName = (user?.user_metadata?.display_name as string | undefined) ?? '';

  const downgrade = async () => {
    setBusy(true);
    const result = await cancelSubscription(user?.id ?? null);
    setBusy(false);
    setNote(result.message);
    if (result.ok) setPlan(result.plan);
  };

  const download = async () => {
    const data = await exportAll(user?.id ?? null);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitroom-daten-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell title="Profil">
      <div className="page page--narrow">
        <Panel className="card">
          <div className="stack stack--lg">
            <div className="row">
              <span className="rowitem__chip" style={{ background: 'var(--ng-accent)', width: 52, height: 52 }}>
                <Icon name="user" size={24} />
              </span>
              <div className="stack stack--sm" style={{ minWidth: 0 }}>
                <h2 className="h2">{displayName || user?.email?.split('@')[0] || 'Gast'}</h2>
                <span className="small muted">{user?.email ?? 'Nicht angemeldet'}</span>
              </div>
              <span className="spacer" />
              {plan === 'pro' ? (
                <Badge tone="accent">
                  <Icon name="crown" size={13} /> Pro
                </Badge>
              ) : (
                <Badge>Free</Badge>
              )}
            </div>

            {!user ? (
              <Notice>
                Du arbeitest als Gast — Maße und Outfits liegen nur in diesem Browser.{' '}
                {available ? (
                  <Link to="/login" className="strong">
                    Anmelden, damit sie auf allen Geräten gelten →
                  </Link>
                ) : (
                  'Die Anmeldung ist gerade nicht eingerichtet.'
                )}
              </Notice>
            ) : null}

            <div className="row row--wrap">
              <Badge>{outfits.length} Outfits</Badge>
              <Badge>{favorites.length} Favoriten</Badge>
            </div>
          </div>
        </Panel>

        <Panel className="card">
          <div className="stack">
            <div className="row row--between">
              <h2 className="h2">Tarif</h2>
              <Link to="/preise" className="small muted">
                Vergleich ansehen
              </Link>
            </div>

            {plan === 'pro' ? (
              <>
                <p className="small muted">
                  Pro ist aktiv. Alle Anbieter, die Zonen-Analyse und unbegrenzt viele Outfits
                  stehen dir offen.
                </p>
                <ul className="checklist">
                  {PRO_FEATURES.map((f) => (
                    <li key={f}>
                      <Icon name="check" />
                      <span>{FEATURE_LABEL[f]}</span>
                    </li>
                  ))}
                </ul>
                <div className="row">
                  <Button loading={busy} onClick={() => void downgrade()}>
                    Pro beenden
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="small muted">
                  Free deckt das Zusammenstellen und die Passform je Teil ab. Pro kostet{' '}
                  {PRO_PRICE.monthly.toFixed(2).replace('.', ',')} {PRO_PRICE.currency} im Monat.
                </p>
                <div className="row">
                  <Button
                    variant="primary"
                    icon="crown"
                    onClick={() => paywall.open('Pro schaltet alle Anbieter und die Zonen-Analyse frei.')}
                  >
                    Pro aktivieren
                  </Button>
                </div>
              </>
            )}

            {note ? <Notice tone="ok">{note}</Notice> : null}
          </div>
        </Panel>

        <Panel className="card">
          <div className="stack">
            <h2 className="h2">Deine Daten</h2>
            <p className="small muted">
              Maße, Outfits und Favoriten als JSON — lesbar und mitnehmbar.
            </p>
            <div className="row row--wrap">
              <Button icon="download" onClick={() => void download()}>
                Daten exportieren
              </Button>
              <Link to="/einstellungen">
                <Button variant="quiet" icon="settings">
                  Einstellungen
                </Button>
              </Link>
            </div>
          </div>
        </Panel>

        {user ? (
          <Panel className="card">
            <div className="stack">
              <h2 className="h2">Konto</h2>
              <Field label="Angemeldet als">
                <TextInput value={user.email ?? ''} readOnly icon="mail" />
              </Field>
              <div className="row">
                <Button
                  icon="logout"
                  onClick={async () => {
                    await signOut();
                    navigate('/');
                  }}
                >
                  Abmelden
                </Button>
              </div>
            </div>
          </Panel>
        ) : null}
      </div>
    </AppShell>
  );
}
