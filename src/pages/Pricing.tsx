import { useState } from 'react';
import { Icon } from '../components/Icon';
import { Badge, Button, Notice, Panel } from '../components/ui';
import { PublicShell } from '../components/layout/Shell';
import { usePaywall } from '../components/Paywall';
import { FEATURE_LABEL, PLAN_LIMITS, PRO_PRICE, type Feature } from '../lib/plan';
import { cancelSubscription } from '../lib/billing';
import { useApp } from '../state/app';
import { useAuth } from '../state/auth';

const FEATURES: Feature[] = ['allProviders', 'fitDetails', 'unlimitedSaves', 'hdExport', 'styleAdvisor'];

/** Preisseite: Free gegen Pro, ohne Kleingedrucktes zu verstecken. */
export default function Pricing() {
  const plan = useApp((s) => s.plan);
  const setPlan = useApp((s) => s.setPlan);
  const { user } = useAuth();
  const paywall = usePaywall();
  const [busy, setBusy] = useState(false);

  const saving = Math.round((1 - PRO_PRICE.yearly / (PRO_PRICE.monthly * 12)) * 100);

  const downgrade = async () => {
    setBusy(true);
    const result = await cancelSubscription(user?.id ?? null);
    setBusy(false);
    if (result.ok) setPlan(result.plan);
  };

  return (
    <PublicShell>
      <div className="page page--narrow">
        <div className="stack" style={{ textAlign: 'center', padding: '16px 0 8px' }}>
          <h1 className="h1">Zwei Tarife</h1>
          <p className="lead">
            Die Grundfunktion bleibt kostenlos. Pro ist für alle, die den Katalog ganz
            sehen und wissen wollen, wo genau es spannt.
          </p>
        </div>

        <div className="grid grid--2">
          <Panel className="pricecard">
            <div className="row row--between">
              <h2 className="h2">Free</h2>
              {plan === 'free' ? <Badge tone="ok">aktiv</Badge> : null}
            </div>
            <div className="pricecard__price">
              <span className="pricecard__amount">0 {PRO_PRICE.currency}</span>
              <span className="muted">für immer</span>
            </div>

            <ul className="checklist">
              <li>
                <Icon name="check" />
                <span>Eigene Maße und Avatar-Profil</span>
              </li>
              <li>
                <Icon name="check" />
                <span>Outfits zusammenstellen, so viele du willst</span>
              </li>
              <li>
                <Icon name="check" />
                <span>Passform-Urteil je Teil</span>
              </li>
              <li>
                <Icon name="check" />
                <span>Bis zu {PLAN_LIMITS.free.savedOutfits} gespeicherte Outfits</span>
              </li>
              {FEATURES.map((f) => (
                <li key={f} className="off">
                  <Icon name="x" />
                  <span>{FEATURE_LABEL[f]}</span>
                </li>
              ))}
            </ul>

            {plan === 'pro' ? (
              <Button block loading={busy} onClick={() => void downgrade()}>
                Auf Free zurück
              </Button>
            ) : (
              <Button block disabled>
                Dein Tarif
              </Button>
            )}
          </Panel>

          <Panel className="pricecard">
            <div className="row row--between">
              <h2 className="h2">Pro</h2>
              {plan === 'pro' ? (
                <Badge tone="ok">aktiv</Badge>
              ) : (
                <Badge tone="accent">{saving}% im Jahresabo</Badge>
              )}
            </div>
            <div className="pricecard__price">
              <span className="pricecard__amount">
                {PRO_PRICE.monthly.toFixed(2).replace('.', ',')} {PRO_PRICE.currency}
              </span>
              <span className="muted">pro Monat</span>
            </div>
            <p className="tiny muted" style={{ marginTop: -10 }}>
              oder {PRO_PRICE.yearly.toFixed(2).replace('.', ',')} {PRO_PRICE.currency} im Jahr
            </p>

            <ul className="checklist">
              <li>
                <Icon name="check" />
                <span>Alles aus Free</span>
              </li>
              {FEATURES.map((f) => (
                <li key={f}>
                  <Icon name="check" />
                  <span>{FEATURE_LABEL[f]}</span>
                </li>
              ))}
            </ul>

            {plan === 'pro' ? (
              <Button block disabled icon="crown">
                Dein Tarif
              </Button>
            ) : (
              <Button
                block
                variant="primary"
                icon="crown"
                onClick={() => paywall.open('Pro schaltet alle Anbieter, die Zonen-Analyse und unbegrenzte Outfits frei.')}
              >
                Pro aktivieren
              </Button>
            )}
          </Panel>
        </div>

        <Notice>
          Testbetrieb: die Zahlungsanbindung fehlt noch, es wird nichts abgebucht. Pro lässt
          sich zum Ausprobieren ein- und wieder ausschalten.
        </Notice>
      </div>
    </PublicShell>
  );
}
