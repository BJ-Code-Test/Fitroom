import { Icon, SLOT_ICON } from '../Icon';
import { Badge, Empty, Panel } from '../ui';
import { FitBadge, ScoreMeter, verdictTone } from '../Garment';
import { ProLock } from '../Paywall';
import { garmentById } from '../../data/catalog';
import { checkFitWithHint, outfitScore } from '../../lib/fit';
import { can } from '../../lib/plan';
import { displayLength, useUi } from '../../state/ui';
import { SLOTS, SLOT_LABEL, type BodyParams, type FitReport, type Plan, type Worn } from '../../types';

/**
 * Passform-Panel.
 *
 * Free sieht das Gesamturteil je Teil. Die Aufschlüsselung nach Körperzone
 * — also die Antwort auf "wo genau spannt es" — ist der eigentliche Mehrwert
 * und damit Pro.
 */
export function FitPanel({ worn, body, plan }: { worn: Worn; body: BodyParams; plan: Plan }) {
  const unit = useUi((s) => s.unit);
  const detailed = can(plan, 'fitDetails');

  const entries = SLOTS.flatMap((slot) => {
    const item = worn[slot];
    if (!item) return [];
    const garment = garmentById(item.garmentId);
    if (!garment) return [];
    const report = checkFitWithHint(garment, item.sizeLabel, body);
    return [{ slot, garment, size: item.sizeLabel, report }];
  });

  if (entries.length === 0) {
    return (
      <Panel className="card">
        <Empty
          icon="ruler"
          title="Noch keine Passform"
          text="Sobald du etwas anziehst, rechnen wir es gegen deine Maße."
        />
      </Panel>
    );
  }

  const total = outfitScore(entries.map((e) => e.report));
  const problems = entries.filter((e) => e.report.verdict !== 'passt').length;

  return (
    <Panel className="card">
      <div className="stack stack--lg">
        <div className="stack stack--sm">
          <div className="row row--between">
            <h3 className="h3">Passform</h3>
            <Badge tone={total >= 85 ? 'ok' : total >= 60 ? 'warn' : 'bad'}>{total} / 100</Badge>
          </div>
          <ScoreMeter score={total} />
          <p className="tiny muted">
            {problems === 0
              ? 'Alle Teile sitzen wie vorgesehen.'
              : `${problems} von ${entries.length} Teilen sitzen nicht ideal.`}
          </p>
        </div>

        <hr className="divider" />

        <div className="stack">
          {entries.map(({ slot, garment, size, report }) => (
            <div key={slot} className="stack stack--sm">
              <div className="row">
                <Icon name={SLOT_ICON[slot]} size={16} className="muted" />
                <span className="small strong">{garment.name}</span>
                <span className="spacer" />
                <FitBadge verdict={report.verdict} />
              </div>

              <p className="tiny muted">
                {SLOT_LABEL[slot]} · Größe {size} — {report.advice}
              </p>

              {report.betterSize ? (
                <p className="tiny" style={{ color: 'var(--ng-accent)' }}>
                  Besser: Größe {report.betterSize}
                </p>
              ) : null}

              {report.zones.length > 0 ? (
                <ProLock
                  locked={!detailed}
                  reason="Die Aufschlüsselung nach Körperzone zeigt, wo genau es spannt oder schlackert. Das gehört zu Pro."
                  label="Zonen ansehen"
                >
                  <ZoneList report={report} unit={unit} />
                </ProLock>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function ZoneList({ report, unit }: { report: FitReport; unit: 'cm' | 'inch' }) {
  return (
    <div style={{ padding: '2px 0' }}>
      {report.zones.map((z) => {
        const diff = z.garment - z.body;
        // -8 cm (spannt) bis +26 cm (schlackert) auf die Breite abbilden.
        const pos = Math.min(100, Math.max(0, ((diff + 8) / 34) * 100));
        const tone = verdictTone(z.verdict);
        const color =
          tone === 'ok' ? '#6fd39a' : tone === 'warn' ? '#e8b464' : tone === 'bad' ? '#ec7d7d' : '#9aa0ac';

        return (
          <div className="zone" key={z.zone}>
            <span className="small">{z.zone}</span>
            <span className="tiny mono muted">
              {displayLength(z.body, unit)} → {displayLength(z.garment, unit)}
              {diff !== 0 ? ` (${diff > 0 ? '+' : ''}${Math.round(diff * 10) / 10})` : ''}
            </span>
            <div className="zone__scale">
              <span className="zone__pin" style={{ left: `${pos}%`, background: color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
