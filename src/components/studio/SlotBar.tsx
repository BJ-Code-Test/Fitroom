import { Icon, SLOT_ICON } from '../Icon';
import { inkOn } from '../Garment';
import { garmentById } from '../../data/catalog';
import { SLOTS, SLOT_LABEL, type Slot, type Worn } from '../../types';

/**
 * Die Slot-Leiste: sechs Plätze, die entweder leer sind oder zeigen, was
 * dort hängt. Ein Klick wählt den Slot aus, den der Katalog daneben füllt.
 */
export function SlotBar({
  worn,
  active,
  onSelect,
}: {
  worn: Worn;
  active: Slot;
  onSelect: (slot: Slot) => void;
}) {
  return (
    <div className="slotbar" role="tablist" aria-label="Kleidungsplätze">
      {SLOTS.map((slot) => {
        const item = worn[slot];
        const garment = item ? garmentById(item.garmentId) : undefined;
        const color = garment?.colorways[item?.colorIndex ?? 0] ?? garment?.colorways[0];

        return (
          <button
            key={slot}
            role="tab"
            aria-selected={active === slot}
            className={`slot ${active === slot ? 'slot--on' : ''}`}
            onClick={() => onSelect(slot)}
          >
            <span
              className="slot__icon"
              style={{
                background: color ? color.hex : 'color-mix(in srgb, currentColor 12%, transparent)',
                color: color ? inkOn(color.hex) : 'inherit',
              }}
            >
              <Icon name={SLOT_ICON[slot]} />
            </span>
            <span className="slot__label">{SLOT_LABEL[slot]}</span>
            <span className="slot__item">{garment ? garment.name : '—'}</span>
          </button>
        );
      })}
    </div>
  );
}
