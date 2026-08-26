import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/layout/Shell';
import { Icon, SLOT_ICON } from '../components/Icon';
import { Badge, Button, Empty, Field, Modal, Notice, Panel, Select, TextInput } from '../components/ui';
import { GarmentTile } from '../components/Garment';
import { Stage } from '../components/studio/Stage';
import { SlotBar } from '../components/studio/SlotBar';
import { FitPanel } from '../components/studio/FitPanel';
import { usePaywall } from '../components/Paywall';
import { garmentById } from '../data/catalog';
import { bestSize } from '../lib/fit';
import { canSaveMore, PLAN_LIMITS, remainingSaves } from '../lib/plan';
import { useApp } from '../state/app';
import { useCatalog } from '../state/catalog';
import { euro } from '../state/ui';
import { SLOT_LABEL, type Slot } from '../types';

/** Die Ankleide: Bühne, Slot-Leiste, Katalog für den gewählten Slot, Passform. */
export default function Studio() {
  const { worn, body, plan, outfits } = useApp();
  const wear = useApp((s) => s.wear);
  const unwear = useApp((s) => s.unwear);
  const setColor = useApp((s) => s.setColor);
  const setSize = useApp((s) => s.setSize);
  const clearOutfit = useApp((s) => s.clearOutfit);
  const saveOutfit = useApp((s) => s.saveOutfit);

  const [slot, setSlot] = useState<Slot>('top');
  const [saveOpen, setSaveOpen] = useState(false);

  const { allowed, lockedProviders } = useCatalog();
  const paywall = usePaywall();

  const forSlot = useMemo(() => allowed.filter((g) => g.slot === slot), [allowed, slot]);
  const current = worn[slot];
  const currentGarment = current ? garmentById(current.garmentId) : undefined;

  const total = useMemo(
    () =>
      Object.values(worn).reduce((sum, item) => {
        const g = item ? garmentById(item.garmentId) : undefined;
        return sum + (g?.price ?? 0);
      }, 0),
    [worn],
  );

  const canSave = canSaveMore(plan, outfits.length);

  const onSaveClick = () => {
    if (!canSave) {
      paywall.open(
        `Free speichert ${PLAN_LIMITS.free.savedOutfits} Outfits. Deine sind belegt — mit Pro sind es beliebig viele.`,
      );
      return;
    }
    setSaveOpen(true);
  };

  return (
    <AppShell title="Ankleide">
      <div className="page page--wide studio">
        <div className="studio__left">
          <Stage worn={worn} body={body} />

          <Panel className="card card--tight">
            <div className="stack">
              <SlotBar worn={worn} active={slot} onSelect={setSlot} />

              <div className="row row--wrap">
                <Badge>{Object.keys(worn).length} von 6 Plätzen</Badge>
                {total > 0 ? <Badge>Gesamt {euro(total)}</Badge> : null}
                <span className="spacer" />
                <Button size="sm" variant="quiet" icon="trash" onClick={clearOutfit} disabled={Object.keys(worn).length === 0}>
                  Alles ausziehen
                </Button>
                <Button size="sm" variant="primary" icon="plus" onClick={onSaveClick} disabled={Object.keys(worn).length === 0}>
                  Outfit speichern
                </Button>
              </div>

              {plan === 'free' ? (
                <p className="tiny muted">
                  Noch {remainingSaves(plan, outfits.length)} von {PLAN_LIMITS.free.savedOutfits}{' '}
                  Speicherplätzen frei.
                </p>
              ) : null}
            </div>
          </Panel>
        </div>

        <div className="studio__right">
          {currentGarment && current ? (
            <Panel className="card">
              <div className="stack">
                <div className="row row--between">
                  <h3 className="h3">{SLOT_LABEL[slot]}</h3>
                  <Button size="xs" variant="quiet" icon="x" onClick={() => unwear(slot)}>
                    ausziehen
                  </Button>
                </div>

                <div className="row">
                  <Icon name={SLOT_ICON[slot]} size={18} className="muted" />
                  <div className="stack stack--sm" style={{ minWidth: 0 }}>
                    <span className="small strong">{currentGarment.name}</span>
                    <span className="tiny muted">
                      {currentGarment.brand} · {euro(currentGarment.price)}
                    </span>
                  </div>
                </div>

                <Field label="Farbe">
                  <div className="swatches">
                    {currentGarment.colorways.map((cw, i) => (
                      <button
                        key={cw.name}
                        type="button"
                        className={`swatch ${current.colorIndex === i ? 'swatch--on' : ''}`}
                        style={{ background: cw.hex }}
                        title={cw.name}
                        aria-label={cw.name}
                        aria-pressed={current.colorIndex === i}
                        onClick={() => setColor(slot, i)}
                      />
                    ))}
                  </div>
                </Field>

                <Field
                  label="Größe"
                  hint={
                    bestSize(currentGarment, body)?.size.label === current.sizeLabel
                      ? 'Das ist die Größe, die zu deinen Maßen am besten passt.'
                      : `Empfohlen: ${bestSize(currentGarment, body)?.size.label ?? '—'}`
                  }
                >
                  <Select value={current.sizeLabel} onChange={(e) => setSize(slot, e.target.value)}>
                    {currentGarment.sizes.map((s) => (
                      <option key={s.label} value={s.label}>
                        {s.label}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Link to={`/katalog/${currentGarment.id}`} className="small muted">
                  Alle Details ansehen →
                </Link>
              </div>
            </Panel>
          ) : null}

          <Panel className="card">
            <div className="stack">
              <div className="row row--between">
                <h3 className="h3">{SLOT_LABEL[slot]} wählen</h3>
                <Badge>{forSlot.length}</Badge>
              </div>

              {forSlot.length === 0 ? (
                <Empty
                  icon="catalog"
                  title="Nichts verfügbar"
                  text="Für diesen Platz gibt es in deinem Tarif noch keine Teile."
                />
              ) : (
                <div className="grid grid--tiles grid--mini picker">
                  {forSlot.map((g) => (
                    <GarmentTile
                      key={g.id}
                      garment={g}
                      selected={current?.garmentId === g.id}
                      colorIndex={current?.garmentId === g.id ? current.colorIndex : 0}
                      onClick={() => wear(g)}
                    />
                  ))}
                </div>
              )}

              {lockedProviders.length > 0 ? (
                <Notice>
                  {lockedProviders.length} weitere Anbieter ({lockedProviders.map((p) => p.name).join(', ')})
                  gehören zu Pro.{' '}
                  <button
                    className="ng-btn ng-btn--quiet ng-btn--xs"
                    onClick={() => paywall.open('Diese Anbieter gehören zu Pro.')}
                  >
                    Ansehen
                  </button>
                </Notice>
              ) : null}
            </div>
          </Panel>

          <FitPanel worn={worn} body={body} plan={plan} />
        </div>
      </div>

      <SaveDialog open={saveOpen} onClose={() => setSaveOpen(false)} onSave={saveOutfit} />
    </AppShell>
  );
}

function SaveDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<unknown>;
}) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const clean = name.trim() || `Look vom ${new Date().toLocaleDateString('de-DE')}`;
    setBusy(true);
    setError(null);
    try {
      await onSave(clean);
      setName('');
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Speichern fehlgeschlagen.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Outfit speichern"
      footer={
        <>
          <Button variant="quiet" onClick={onClose}>
            Abbrechen
          </Button>
          <Button variant="primary" loading={busy} onClick={() => void submit()}>
            Speichern
          </Button>
        </>
      }
    >
      <div className="stack">
        <Field label="Name" hint="Leer lassen für das heutige Datum.">
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Büro Montag"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && void submit()}
          />
        </Field>
        {error ? <Notice tone="bad">{error}</Notice> : null}
      </div>
    </Modal>
  );
}
