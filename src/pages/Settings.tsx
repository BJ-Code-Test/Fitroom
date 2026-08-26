import { useState } from 'react';
import { AppShell } from '../components/layout/Shell';
import { Badge, Button, Field, Modal, Notice, Panel } from '../components/ui';
import { clearLocal } from '../data/repo';
import { INTENSITIES, PALETTES, useUi, type Intensity, type PaletteId } from '../state/ui';
import { useApp } from '../state/app';
import { useAuth } from '../state/auth';

/** Aussehen, Einheiten und lokale Daten. */
export default function Settings() {
  const { palette, intensity, unit, setPalette, setIntensity, setUnit } = useUi();
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
                Die Palette bestimmt die Farben im Hintergrund, die Stufe, wie stark sie
                durchkommen. Beides wirkt sofort.
              </p>
            </div>

            <Field label="Palette">
              <div className="chips">
                {PALETTES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`chip ${palette === p.id ? 'chip--on' : ''}`}
                    onClick={() => setPalette(p.id as PaletteId)}
                    aria-pressed={palette === p.id}
                  >
                    <span style={{ display: 'inline-flex', gap: 3, marginRight: 3 }}>
                      {p.swatch.map((hex) => (
                        <span
                          key={hex}
                          style={{
                            width: 9,
                            height: 9,
                            borderRadius: '50%',
                            background: hex,
                            display: 'inline-block',
                          }}
                        />
                      ))}
                    </span>
                    {p.label}
                    {p.dark ? '' : ' (hell)'}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Farbintensität">
              <div className="ng-tabs" role="tablist" aria-label="Intensität">
                {INTENSITIES.map((i) => (
                  <button
                    key={i.id}
                    role="tab"
                    className="ng-tab"
                    aria-selected={intensity === i.id}
                    onClick={() => setIntensity(i.id as Intensity)}
                    title={i.hint}
                  >
                    {i.label}
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
              und schaltet dann Glanz und Bewegung ab.
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
