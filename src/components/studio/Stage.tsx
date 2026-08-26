import { Icon, SLOT_ICON } from '../Icon';
import { Badge, Panel } from '../ui';
import { inkOn } from '../Garment';
import { garmentById } from '../../data/catalog';
import { euShoeSize } from '../../lib/body';
import { displayLength, useUi } from '../../state/ui';
import { SLOTS, SLOT_LABEL, type BodyParams, type Worn } from '../../types';

/**
 * Die Bühne — Platzhalter für die spätere 3D-Ansicht.
 *
 * Bewusst ein eigenes Bauteil mit schmaler Schnittstelle (`worn`, `body`):
 * Wenn die 3D-Runde kommt, wird genau diese Datei ersetzt, und die Seite
 * drumherum bleibt unangetastet.
 */
export function Stage({ worn, body }: { worn: Worn; body: BodyParams }) {
  const unit = useUi((s) => s.unit);
  const wornSlots = SLOTS.filter((slot) => worn[slot]);

  return (
    <Panel className="stage">
      <div className="stage__floor" aria-hidden="true" />

      <div className="stage__inner">
        <div className="stage__mark" aria-hidden="true">
          <Icon name="cube" />
        </div>

        <div className="stack stack--sm">
          <strong className="h3">3D-Ansicht folgt</strong>
          <p className="small muted">
            Hier steht später dein Körper mit den angezogenen Teilen. Bis dahin
            rechnet die Passform schon mit deinen echten Maßen.
          </p>
        </div>

        <div className="row row--wrap" style={{ justifyContent: 'center' }}>
          <Badge>{displayLength(body.height, unit)} groß</Badge>
          <Badge>Brust {displayLength(body.chest, unit)}</Badge>
          <Badge>Taille {displayLength(body.waist, unit)}</Badge>
          <Badge>Schuh EU {euShoeSize(body.foot)}</Badge>
        </div>

        {wornSlots.length > 0 ? (
          <ul className="stage__worn">
            {wornSlots.map((slot) => {
              const item = worn[slot]!;
              const garment = garmentById(item.garmentId);
              if (!garment) return null;
              const color = garment.colorways[item.colorIndex] ?? garment.colorways[0];
              return (
                <li key={slot} className="rowitem">
                  <span className="rowitem__chip" style={{ background: color.hex, color: inkOn(color.hex) }}>
                    <Icon name={SLOT_ICON[slot]} />
                  </span>
                  <span className="rowitem__text">
                    <span className="rowitem__title">{garment.name}</span>
                    <span className="tiny muted">
                      {SLOT_LABEL[slot]} · {color.name} · Größe {item.sizeLabel}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="small muted">Noch nichts angezogen — such dir unten etwas aus.</p>
        )}
      </div>
    </Panel>
  );
}
