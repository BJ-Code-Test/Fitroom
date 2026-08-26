import { Icon, SLOT_ICON } from './Icon';
import { Badge } from './ui';
import { VERDICT_LABEL } from '../lib/fit';
import { euro } from '../state/ui';
import { providerById } from '../data/providers';
import type { FitVerdict, Garment } from '../types';

/**
 * Kontrastfarbe für alles, was auf einem Stoffton liegt.
 *
 * Die Oberfläche ist bewusst fast farblos — die Farbe kommt von der Kleidung.
 * Damit liegt das Symbol aber mal auf Off-White und mal auf Sumi-Schwarz, und
 * eine feste Farbe würde in einem der beiden Fälle verschwinden.
 */
export function inkOn(hex: string): string {
  const clean = hex.replace('#', '');
  const n = Number.parseInt(clean.length === 3 ? clean.replace(/(.)/g, '$1$1') : clean, 16);
  if (!Number.isFinite(n)) return 'rgba(255,255,255,.88)';
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  // Wahrgenommene Helligkeit nach ITU-R BT.601.
  const luminanz = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminanz > 0.62 ? 'rgba(28,31,38,.5)' : 'rgba(255,255,255,.9)';
}

/** Farbe des Urteils — dieselbe Zuordnung überall in der App. */
export function verdictTone(v: FitVerdict): 'ok' | 'warn' | 'bad' | 'default' {
  if (v === 'passt') return 'ok';
  if (v === 'eng' || v === 'locker') return 'warn';
  if (v === 'zu-eng' || v === 'zu-weit') return 'bad';
  return 'default';
}

export function FitBadge({ verdict }: { verdict: FitVerdict }) {
  return (
    <Badge tone={verdictTone(verdict)} className="badge--dot">
      {VERDICT_LABEL[verdict]}
    </Badge>
  );
}

/** Der Balken zur Gesamtnote eines Teils oder Outfits. */
export function ScoreMeter({ score }: { score: number }) {
  const color = score >= 85 ? '#6fd39a' : score >= 60 ? '#e8b464' : '#ec7d7d';
  return (
    <div className="meter" role="img" aria-label={`Passform ${score} von 100`}>
      <div className="meter__bar" style={{ width: `${Math.max(4, score)}%`, background: color }} />
    </div>
  );
}

interface TileProps {
  garment: Garment;
  colorIndex?: number;
  selected?: boolean;
  favorite?: boolean;
  verdict?: FitVerdict;
  onClick?: () => void;
  onFavorite?: () => void;
}

/**
 * Die Katalogkachel.
 *
 * Bewusst flach: bei einem Raster aus 40 Teilen wären 40 Glasflächen zu
 * teuer und zu unruhig — Glas trägt der Container, nicht die Kachel.
 */
export function GarmentTile({
  garment,
  colorIndex = 0,
  selected,
  favorite,
  verdict,
  onClick,
  onFavorite,
}: TileProps) {
  const color = garment.colorways[colorIndex] ?? garment.colorways[0];
  const provider = providerById(garment.providerId);

  return (
    <div
      className={`tile ${selected ? 'tile--on' : ''}`}
      style={{ ['--tile-color' as string]: color.hex, ['--tile-ink' as string]: inkOn(color.hex) }}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
    >
      <div className="tile__art">
        <Icon name={SLOT_ICON[garment.slot]} className="tile__glyph" />
        <div className="tile__corner">
          {onFavorite ? (
            <button
              type="button"
              className={`tile__fav ${favorite ? 'tile__fav--on' : ''}`}
              aria-label={favorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten'}
              aria-pressed={favorite}
              onClick={(e) => {
                e.stopPropagation();
                onFavorite();
              }}
            >
              <Icon name="heart" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="tile__body">
        <span className="tile__name">{garment.name}</span>
        <div className="tile__meta">
          <span
            style={{ fontWeight: 620 }}
            title={provider?.name}
          >
            {garment.brand}
          </span>
          <span className="tile__price">{euro(garment.price)}</span>
        </div>
        {verdict ? (
          <div style={{ marginTop: 2 }}>
            <FitBadge verdict={verdict} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
