import { Link } from 'react-router-dom';
import { AppShell } from '../components/layout/Shell';
import { Badge, Button, Chip, Field, Notice, Panel, Slider } from '../components/ui';
import { DEFAULT_BODY, LIMITS, PRESETS, euShoeSize } from '../lib/body';
import { useApp } from '../state/app';
import { displayLength, useUi } from '../state/ui';
import type { BodyPreset } from '../types';

const PRESET_LABEL: Record<BodyPreset, string> = {
  neutral: 'Neutral',
  schlank: 'Schlank',
  athletisch: 'Athletisch',
  kurvig: 'Kurvig',
  kraeftig: 'Kräftig',
};

const SKIN_TONES = ['#f2d3bb', '#e0b192', '#c98d68', '#a06841', '#7a4b2c', '#4b2e1c'];
const HAIR_TONES = ['#2b2118', '#5a3a24', '#a9762f', '#d8c39b', '#8d8d92', '#1b1b1f'];

/**
 * Das Massprofil.
 *
 * Alle Werte sind Körpermaße in cm — die Anzeige rechnet nur um, gespeichert
 * wird immer metrisch. Wer seine Zahlen nicht kennt, fängt mit einer Vorlage an.
 */
export default function Measurements() {
  const body = useApp((s) => s.body);
  const setBody = useApp((s) => s.setBody);
  const usePreset = useApp((s) => s.usePreset);
  const resetBody = useApp((s) => s.resetBody);
  const unit = useUi((s) => s.unit);
  const setUnit = useUi((s) => s.setUnit);

  const len = (cm: number) => displayLength(cm, unit);

  /** Grobe Konfektionsgröße aus dem Brustumfang — nur als Anhaltspunkt. */
  const konfektion =
    body.chest < 89 ? 'XS' : body.chest < 95 ? 'S' : body.chest < 103 ? 'M' : body.chest < 111 ? 'L' : body.chest < 119 ? 'XL' : 'XXL';

  return (
    <AppShell title="Meine Maße">
      <div className="page">
        <div className="grid grid--2">
          <Panel className="card">
            <div className="stack stack--lg">
              <div className="row row--between">
                <h2 className="h2">Körpermaße</h2>
                <div className="ng-tabs" role="tablist" aria-label="Einheit">
                  <button role="tab" className="ng-tab" aria-selected={unit === 'cm'} onClick={() => setUnit('cm')}>
                    cm
                  </button>
                  <button role="tab" className="ng-tab" aria-selected={unit === 'inch'} onClick={() => setUnit('inch')}>
                    inch
                  </button>
                </div>
              </div>

              <Field label="Vorlage" hint="Setzt die Umfänge passend zur Körperhöhe. Danach frei nachschieben.">
                <div className="chips">
                  {(Object.keys(PRESETS) as BodyPreset[]).map((p) => (
                    <Chip key={p} on={body.preset === p} onClick={() => usePreset(p)}>
                      {PRESET_LABEL[p]}
                    </Chip>
                  ))}
                </div>
              </Field>

              <Slider
                id="m-height"
                label="Körperhöhe"
                value={body.height}
                min={LIMITS.height[0]}
                max={LIMITS.height[1]}
                step={0.5}
                format={len}
                onChange={(height) => setBody({ height })}
              />
              <Slider
                id="m-shoulder"
                label="Schulterbreite"
                value={body.shoulder}
                min={LIMITS.shoulder[0]}
                max={LIMITS.shoulder[1]}
                step={0.5}
                format={len}
                onChange={(shoulder) => setBody({ shoulder })}
              />
              <Slider
                id="m-chest"
                label="Brustumfang"
                value={body.chest}
                min={LIMITS.chest[0]}
                max={LIMITS.chest[1]}
                step={0.5}
                format={len}
                onChange={(chest) => setBody({ chest })}
              />
              <Slider
                id="m-waist"
                label="Taillenumfang"
                value={body.waist}
                min={LIMITS.waist[0]}
                max={LIMITS.waist[1]}
                step={0.5}
                format={len}
                onChange={(waist) => setBody({ waist })}
              />
              <Slider
                id="m-hip"
                label="Hüftumfang"
                value={body.hip}
                min={LIMITS.hip[0]}
                max={LIMITS.hip[1]}
                step={0.5}
                format={len}
                onChange={(hip) => setBody({ hip })}
              />
              <Slider
                id="m-inseam"
                label="Innenbeinlänge"
                value={body.inseam}
                min={LIMITS.inseam[0]}
                max={LIMITS.inseam[1]}
                step={0.5}
                format={len}
                onChange={(inseam) => setBody({ inseam })}
              />
              <Slider
                id="m-foot"
                label="Fußlänge"
                value={body.foot}
                min={LIMITS.foot[0]}
                max={LIMITS.foot[1]}
                step={0.5}
                format={len}
                onChange={(foot) => setBody({ foot })}
              />
              <Slider
                id="m-tone"
                label="Statur"
                value={Math.round(body.tone * 100)}
                min={0}
                max={100}
                format={(v) => (v < 33 ? 'schlank' : v < 67 ? 'mittel' : 'kraeftig')}
                onChange={(v) => setBody({ tone: v / 100 })}
              />

              <div className="row">
                <Button variant="quiet" size="sm" onClick={resetBody}>
                  Auf Standard zurücksetzen
                </Button>
              </div>
            </div>
          </Panel>

          <div className="stack">
            <Panel className="card">
              <div className="stack">
                <h2 className="h2">Daraus folgt</h2>
                <div className="row row--wrap">
                  <Badge tone="accent">Konfektion {konfektion}</Badge>
                  <Badge>Schuh EU {euShoeSize(body.foot)}</Badge>
                  <Badge>
                    Bundweite {Math.round(body.waist / 2.54)}&quot; / {Math.round(body.inseam / 2.54)}&quot;
                  </Badge>
                </div>

                <hr className="divider" />

                <table className="table">
                  <tbody>
                    <tr>
                      <td>Körperhöhe</td>
                      <td className="num strong">{len(body.height)}</td>
                    </tr>
                    <tr>
                      <td>Brust</td>
                      <td className="num strong">{len(body.chest)}</td>
                    </tr>
                    <tr>
                      <td>Taille</td>
                      <td className="num strong">{len(body.waist)}</td>
                    </tr>
                    <tr>
                      <td>Hüfte</td>
                      <td className="num strong">{len(body.hip)}</td>
                    </tr>
                    <tr>
                      <td>Verhältnis Taille zu Hüfte</td>
                      <td className="num strong">{(body.waist / body.hip).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>Beinlänge zu Höhe</td>
                      <td className="num strong">{Math.round((body.inseam / body.height) * 100)} %</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Panel>

            <Panel className="card">
              <div className="stack">
                <h2 className="h2">Aussehen</h2>
                <Field label="Hautton">
                  <div className="swatches">
                    {SKIN_TONES.map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        className={`swatch ${body.skin === hex ? 'swatch--on' : ''}`}
                        style={{ background: hex }}
                        aria-label={`Hautton ${hex}`}
                        aria-pressed={body.skin === hex}
                        onClick={() => setBody({ skin: hex })}
                      />
                    ))}
                  </div>
                </Field>
                <Field label="Haarfarbe">
                  <div className="swatches">
                    {HAIR_TONES.map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        className={`swatch ${body.hair === hex ? 'swatch--on' : ''}`}
                        style={{ background: hex }}
                        aria-label={`Haarfarbe ${hex}`}
                        aria-pressed={body.hair === hex}
                        onClick={() => setBody({ hair: hex })}
                      />
                    ))}
                  </div>
                </Field>
                <p className="tiny muted">
                  Haut und Haar wirken sich erst mit der 3D-Ansicht sichtbar aus — die Werte
                  werden aber schon gespeichert.
                </p>
              </div>
            </Panel>

            <Notice>
              Miss am besten über der Unterwäsche und halte das Band waagerecht.{' '}
              {body.height === DEFAULT_BODY.height ? 'Die Körperhöhe steht noch auf dem Standardwert.' : ''}{' '}
              <Link to="/studio" className="strong">
                Danach direkt anprobieren →
              </Link>
            </Notice>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
