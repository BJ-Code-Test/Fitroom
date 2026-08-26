import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Icon } from './Icon';
import { Badge, Button, Modal, Notice } from './ui';
import { PRO_PITCH, PRO_PRICE } from '../lib/plan';
import { startCheckout, type Interval } from '../lib/billing';
import { useApp } from '../state/app';
import { useAuth } from '../state/auth';

/**
 * Die Paywall.
 *
 * Sie taucht überall dort auf, wo eine Free-Grenze greift, und sagt jedes Mal
 * dazu, **warum** sie gerade auftaucht — eine Schranke ohne Begründung wirkt
 * wie ein Fehler.
 */

interface PaywallApi {
  /** Oeffnet die Paywall mit dem Grund, der zum Anlass passt. */
  open: (reason: string) => void;
}

const PaywallContext = createContext<PaywallApi | null>(null);

export function PaywallProvider({ children }: { children: ReactNode }) {
  const [reason, setReason] = useState<string | null>(null);
  const api = useMemo<PaywallApi>(() => ({ open: setReason }), []);

  return (
    <PaywallContext.Provider value={api}>
      {children}
      <PaywallModal reason={reason} onClose={() => setReason(null)} />
    </PaywallContext.Provider>
  );
}

export function usePaywall(): PaywallApi {
  const ctx = useContext(PaywallContext);
  if (!ctx) throw new Error('usePaywall außerhalb von <PaywallProvider>');
  return ctx;
}

function PaywallModal({ reason, onClose }: { reason: string | null; onClose: () => void }) {
  const [interval, setInterval] = useState<Interval>('monthly');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const setPlan = useApp((s) => s.setPlan);

  const upgrade = useCallback(async () => {
    setBusy(true);
    setError(null);
    const result = await startCheckout(user?.id ?? null, interval);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setPlan(result.plan);
    onClose();
  }, [interval, onClose, setPlan, user]);

  const price = interval === 'yearly' ? PRO_PRICE.yearly : PRO_PRICE.monthly;
  const per = interval === 'yearly' ? 'pro Jahr' : 'pro Monat';
  const saving = Math.round((1 - PRO_PRICE.yearly / (PRO_PRICE.monthly * 12)) * 100);

  return (
    <Modal open={reason !== null} onClose={onClose} title="FitRoom Pro">
      <div className="stack stack--lg">
        {reason ? <Notice>{reason}</Notice> : null}

        <div className="ng-tabs" role="tablist" aria-label="Abrechnung">
          <button
            role="tab"
            className="ng-tab"
            aria-selected={interval === 'monthly'}
            onClick={() => setInterval('monthly')}
          >
            Monatlich
          </button>
          <button
            role="tab"
            className="ng-tab"
            aria-selected={interval === 'yearly'}
            onClick={() => setInterval('yearly')}
          >
            Jährlich · {saving}% günstiger
          </button>
        </div>

        <div className="pricecard__price">
          <span className="pricecard__amount">
            {price.toFixed(2).replace('.', ',')} {PRO_PRICE.currency}
          </span>
          <span className="muted">{per}</span>
        </div>

        <ul className="checklist">
          {PRO_PITCH.map((line) => (
            <li key={line}>
              <Icon name="check" />
              <span>{line}</span>
            </li>
          ))}
        </ul>

        {error ? <Notice tone="bad">{error}</Notice> : null}

        {!user ? (
          <Notice>
            Ohne Konto gilt Pro nur in diesem Browser. Melde dich an, damit es auf allen
            Geräten gilt.
          </Notice>
        ) : null}

        <Notice tone="ok">
          Testbetrieb: es wird nichts abgebucht. Die Zahlungsanbindung kommt später.
        </Notice>

        <div className="row">
          <Button variant="quiet" onClick={onClose}>
            Später
          </Button>
          <span className="spacer" />
          <Button variant="primary" icon="crown" loading={busy} onClick={() => void upgrade()}>
            Pro aktivieren
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Hülle für gesperrte Inhalte.
 *
 * Der Inhalt wird angedeutet statt versteckt: so ist zu sehen, was Pro
 * bringt, ohne dass die Zahlen lesbar sind.
 */
export function ProLock({
  locked,
  reason,
  label = 'Mit Pro freischalten',
  children,
}: {
  locked: boolean;
  reason: string;
  label?: string;
  children: ReactNode;
}) {
  const paywall = usePaywall();

  if (!locked) return <>{children}</>;

  return (
    <div className="lock">
      <div className="lock__veil">
        <Badge tone="accent">
          <Icon name="crown" size={13} /> Pro
        </Badge>
        <Button size="sm" icon="lock" onClick={() => paywall.open(reason)}>
          {label}
        </Button>
      </div>
      <div className="lock__content" aria-hidden="true">
        {children}
      </div>
    </div>
  );
}
