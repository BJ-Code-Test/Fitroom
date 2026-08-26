import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/Shell';
import { Button, Chip, Empty, Field, Panel, Select, TextInput } from '../components/ui';
import { GarmentTile } from '../components/Garment';
import { usePaywall } from '../components/Paywall';
import { PRICE_RANGE } from '../data/catalog';
import { PROVIDERS } from '../data/providers';
import { bestSize, CUT_LABEL, MATERIAL_LABEL } from '../lib/fit';
import { isProviderLocked } from '../lib/plan';
import { useApp } from '../state/app';
import { useCatalog } from '../state/catalog';
import { euro } from '../state/ui';
import { SLOTS, SLOT_LABEL, type FitCut, type Material, type Slot } from '../types';

type Sort = 'passform' | 'preis-auf' | 'preis-ab' | 'name';

const CUTS: FitCut[] = ['slim', 'regular', 'oversized'];
const MATERIALS: Material[] = ['cotton', 'denim', 'wool', 'leather', 'tech', 'knit'];

/** Der ganze Katalog mit Filtern — und dem Passform-Urteil direkt auf der Kachel. */
export default function Catalog() {
  const navigate = useNavigate();
  const paywall = usePaywall();

  const plan = useApp((s) => s.plan);
  const body = useApp((s) => s.body);
  const worn = useApp((s) => s.worn);
  const favorites = useApp((s) => s.favorites);
  const toggleFavorite = useApp((s) => s.toggleFavorite);

  const { allowed, lockedProviders } = useCatalog();

  const [search, setSearch] = useState('');
  const [slot, setSlot] = useState<Slot | 'alle'>('alle');
  const [provider, setProvider] = useState<string | 'alle'>('alle');
  const [cut, setCut] = useState<FitCut | 'alle'>('alle');
  const [material, setMaterial] = useState<Material | 'alle'>('alle');
  const [maxPrice, setMaxPrice] = useState(PRICE_RANGE[1]);
  const [onlyFits, setOnlyFits] = useState(false);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [sort, setSort] = useState<Sort>('passform');

  /** Passform je Teil einmal rechnen — die Kacheln und die Sortierung teilen sie. */
  const scored = useMemo(
    () =>
      allowed.map((g) => {
        const best = bestSize(g, body);
        return { garment: g, verdict: best?.report.verdict ?? 'unbekannt', score: best?.report.score ?? 0 };
      }),
    [allowed, body],
  );

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();

    const list = scored.filter(({ garment: g, verdict }) => {
      if (slot !== 'alle' && g.slot !== slot) return false;
      if (provider !== 'alle' && g.providerId !== provider) return false;
      if (cut !== 'alle' && g.cut !== cut) return false;
      if (material !== 'alle' && g.material !== material) return false;
      if (g.price > maxPrice) return false;
      if (onlyFavorites && !favorites.includes(g.id)) return false;
      if (onlyFits && verdict !== 'passt') return false;
      if (needle && !`${g.name} ${g.brand}`.toLowerCase().includes(needle)) return false;
      return true;
    });

    const sorters: Record<Sort, (a: (typeof list)[number], b: (typeof list)[number]) => number> = {
      passform: (a, b) => b.score - a.score || a.garment.price - b.garment.price,
      'preis-auf': (a, b) => a.garment.price - b.garment.price,
      'preis-ab': (a, b) => b.garment.price - a.garment.price,
      name: (a, b) => a.garment.name.localeCompare(b.garment.name, 'de'),
    };

    return [...list].sort(sorters[sort]);
  }, [scored, slot, provider, cut, material, maxPrice, onlyFavorites, onlyFits, favorites, search, sort]);

  const reset = () => {
    setSearch('');
    setSlot('alle');
    setProvider('alle');
    setCut('alle');
    setMaterial('alle');
    setMaxPrice(PRICE_RANGE[1]);
    setOnlyFits(false);
    setOnlyFavorites(false);
  };

  const active =
    (slot !== 'alle' ? 1 : 0) +
    (provider !== 'alle' ? 1 : 0) +
    (cut !== 'alle' ? 1 : 0) +
    (material !== 'alle' ? 1 : 0) +
    (maxPrice < PRICE_RANGE[1] ? 1 : 0) +
    (onlyFits ? 1 : 0) +
    (onlyFavorites ? 1 : 0) +
    (search ? 1 : 0);

  return (
    <AppShell title="Katalog">
      <div className="page page--wide">
        <Panel className="card">
          <div className="filters">
            <div className="row row--wrap">
              <TextInput
                icon="search"
                placeholder="Suchen nach Name oder Marke"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ng-input--sm"
                style={{ minWidth: 240, flex: '1 1 240px' }}
              />
              <Select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="ng-input--sm" style={{ maxWidth: 210 }}>
                <option value="passform">Beste Passform zuerst</option>
                <option value="preis-auf">Preis aufsteigend</option>
                <option value="preis-ab">Preis absteigend</option>
                <option value="name">Name</option>
              </Select>
              {active > 0 ? (
                <Button size="sm" variant="quiet" icon="x" onClick={reset}>
                  {active} Filter zurücksetzen
                </Button>
              ) : null}
            </div>

            <div className="chips">
              <Chip on={slot === 'alle'} onClick={() => setSlot('alle')}>
                Alles
              </Chip>
              {SLOTS.map((s) => (
                <Chip key={s} on={slot === s} onClick={() => setSlot(s)}>
                  {SLOT_LABEL[s]}
                </Chip>
              ))}
            </div>

            <div className="chips">
              <Chip on={provider === 'alle'} onClick={() => setProvider('alle')}>
                Alle Anbieter
              </Chip>
              {PROVIDERS.map((p) => {
                const locked = isProviderLocked(plan, p);
                return (
                  <Chip
                    key={p.id}
                    on={provider === p.id}
                    locked={locked}
                    title={locked ? 'Gehört zu Pro' : p.name}
                    onClick={() =>
                      locked
                        ? paywall.open(`${p.name} gehört zu den Pro-Anbietern.`)
                        : setProvider(provider === p.id ? 'alle' : p.id)
                    }
                  >
                    {p.name}
                  </Chip>
                );
              })}
            </div>

            <div className="row row--wrap" style={{ gap: 18 }}>
              <Field label="Schnitt">
                <Select
                  value={cut}
                  onChange={(e) => setCut(e.target.value as FitCut | 'alle')}
                  className="ng-input--sm"
                  style={{ minWidth: 150 }}
                >
                  <option value="alle">alle</option>
                  {CUTS.map((c) => (
                    <option key={c} value={c}>
                      {CUT_LABEL[c]}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Material">
                <Select
                  value={material}
                  onChange={(e) => setMaterial(e.target.value as Material | 'alle')}
                  className="ng-input--sm"
                  style={{ minWidth: 150 }}
                >
                  <option value="alle">alle</option>
                  {MATERIALS.map((m) => (
                    <option key={m} value={m}>
                      {MATERIAL_LABEL[m]}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label={`Preis bis ${euro(maxPrice)}`}>
                <input
                  className="slider__input"
                  type="range"
                  min={PRICE_RANGE[0]}
                  max={PRICE_RANGE[1]}
                  step={5}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  style={{ minWidth: 200 }}
                  aria-label="Höchstpreis"
                />
              </Field>

              <div className="chips" style={{ alignSelf: 'flex-end', paddingBottom: 4 }}>
                <Chip on={onlyFits} onClick={() => setOnlyFits(!onlyFits)}>
                  nur was passt
                </Chip>
                <Chip on={onlyFavorites} onClick={() => setOnlyFavorites(!onlyFavorites)}>
                  Favoriten
                </Chip>
              </div>
            </div>
          </div>
        </Panel>

        <Panel className="card">
          <div className="stack">
            <div className="row row--between">
              <h2 className="h2">{filtered.length} Teile</h2>
              {lockedProviders.length > 0 ? (
                <Button
                  size="sm"
                  icon="crown"
                  onClick={() =>
                    paywall.open(
                      `${lockedProviders.length} Anbieter sind noch verborgen: ${lockedProviders
                        .map((p) => p.name)
                        .join(', ')}.`,
                    )
                  }
                >
                  {lockedProviders.length} Anbieter mehr
                </Button>
              ) : null}
            </div>

            {filtered.length === 0 ? (
              <Empty
                icon="search"
                title="Nichts gefunden"
                text="Kein Teil passt zu dieser Kombination aus Filtern."
                action={
                  <Button size="sm" onClick={reset}>
                    Filter zurücksetzen
                  </Button>
                }
              />
            ) : (
              <div className="grid grid--tiles">
                {filtered.map(({ garment, verdict }) => (
                  <GarmentTile
                    key={garment.id}
                    garment={garment}
                    verdict={verdict}
                    favorite={favorites.includes(garment.id)}
                    selected={worn[garment.slot]?.garmentId === garment.id}
                    onFavorite={() => void toggleFavorite(garment.id)}
                    onClick={() => navigate(`/katalog/${garment.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
