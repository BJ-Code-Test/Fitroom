import { useState } from 'react';
import { AppShell } from '../components/layout/Shell';
import { Badge, Button, Field, Modal, Notice, Panel } from '../components/ui';
import { clearLocal } from '../data/repo';
import { THEMES, useUi, type ThemeId } from '../state/ui';
import { useApp } from '../state/app';
import { useAuth } from '../state/auth';

/** Aussehen, Einheiten und lokale Daten. */
export default function Settings() {
  const { theme, unit, setTheme, setUnit } = useUi();
  const { user } = useAuth();
  const hydrate = useApp((s) => s.hydrate);
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <AppShell title="Einstellungen">
      <div className="page page--narrow">
        <Panel className="card">
          <div className="stack stack--lg">
            <div className="stack stack--sm">
              <h2 className="h2">Aussehen</h2>
              <p className="small muted">
                FitRoom hat genau eine Oberfläche: geformtes Material, Licht von oben links.
                Die Fläche bleibt farblos, damit die Farbe von der Kleidung kommt. Zur Wahl
                steht nur, wie hell der Werkstoff ist. Die Umstellung wirkt sofort.
              </p>
            </div>

            <Field label="Helligkeit">
              <div className="ng-tabs" role="tablist" aria-label="Helligkeit">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    role="tab"
                    className="ng-tab"
                    aria-selected={theme === t.id}
                    onClick={() => setTheme(t.id as ThemeId)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Einheit" hint="Gespeichert wird immer in Zentimetern.">
              <div className="ng-tabs" role="tablist" aria-label="Einheit">
                <button role="tab" className="ng-tab" aria-selected={unit === 'cm'} onClick={() => setUnit('cm')}>
                  Zentimeter
                </button>
                <button role="tab" className="ng-tab" aria-selected={unit === 'inch'} onClick={() => setUnit('inch')}>
                  Zoll
                </button>
              </div>
            </Field>

            <Notice>
              Weniger Bewegung stellt dein Betriebssystem ein — FitRoom richtet sich danach
              und schaltet Übergänge und Bewegung dann ab.
            </Notice>
          </div>
        </Panel>

        <Panel className="card">
          <div className="stack">
            <h2 className="h2">Lokale Daten</h2>
            <p className="small muted">
              {user
                ? 'Deine Daten liegen in deinem Konto. Hier lässt sich nur die Kopie in diesem Browser löschen.'
                : 'Als Gast liegt alles nur in diesem Browser. Löschen ist endgültig.'}
            </p>
            <div className="row row--wrap">
              <Badge>Maße</Badge>
              <Badge>Aktuelles Outfit</Badge>
              <Badge>Outfits</Badge>
              <Badge>Favoriten</Badge>
              <Badge>Tarif</Badge>
            </div>
            <div className="row">
              <Button variant="danger" icon="trash" onClick={() => setConfirmClear(true)}>
                Lokale Daten löschen
              </Button>
            </div>
          </div>
        </Panel>
      </div>

      <Modal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Lokale Daten löschen"
        footer={
          <>
            <Button variant="quiet" onClick={() => setConfirmClear(false)}>
              Abbrechen
            </Button>
            <Button
              variant="danger"
              icon="trash"
              onClick={() => {
                clearLocal();
                setConfirmClear(false);
                void hydrate(user?.id ?? null);
              }}
            >
              Endgültig löschen
            </Button>
          </>
        }
      >
        <Notice tone="bad">
          {user
            ? 'Die Kopie in diesem Browser wird entfernt. Was in deinem Konto liegt, bleibt.'
            : 'Maße, Outfits und Favoriten werden entfernt. Das lässt sich nicht rückgängig machen.'}
        </Notice>
      </Modal>
    </AppShell>
  );
}
