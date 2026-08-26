import {
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';
import { Icon, type IconName } from './Icon';

/**
 * Die Bausteine, die überall wiederkehren.
 *
 * Sie setzen nur die Klassen des Design-Systems zusammen — kein Baustein
 * erfindet ein eigenes Schatten- oder Glasrezept, sonst driftet der Stil.
 */

// ------------------------------------------------------------------ Fläche

export function Panel({
  children,
  className = '',
  inset = false,
  as: Tag = 'div',
  ...rest
}: {
  children: ReactNode;
  className?: string;
  inset?: boolean;
  as?: 'div' | 'section' | 'aside' | 'article' | 'form';
} & Record<string, unknown>) {
  return (
    <Tag className={`${inset ? 'ng-inset' : 'ng'} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

// ------------------------------------------------------------------- Knopf

type ButtonVariant = 'default' | 'primary' | 'quiet' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'xs' | 'sm' | 'md';
  block?: boolean;
  icon?: IconName;
  iconOnly?: boolean;
  loading?: boolean;
}

export function Button({
  variant = 'default',
  size = 'md',
  block,
  icon,
  iconOnly,
  loading,
  children,
  className = '',
  disabled,
  ...rest
}: ButtonProps) {
  const classes = [
    'ng-btn',
    variant === 'primary' && 'ng-btn--primary',
    variant === 'quiet' && 'ng-btn--quiet',
    variant === 'danger' && 'ng-btn--danger',
    size === 'sm' && 'ng-btn--sm',
    size === 'xs' && 'ng-btn--xs',
    block && 'ng-btn--block',
    iconOnly && 'ng-btn--icon',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} disabled={disabled || loading} {...rest}>
      {loading ? <Spinner /> : icon ? <Icon name={icon} /> : null}
      {!iconOnly && children}
    </button>
  );
}

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" width={17} height={17} aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.4" opacity=".25" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 12 12"
          to="360 12 12"
          dur="0.8s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  );
}

// ---------------------------------------------------------------- Abzeichen

export function Badge({
  children,
  tone = 'default',
  className = '',
}: {
  children: ReactNode;
  tone?: 'default' | 'accent' | 'ok' | 'warn' | 'bad';
  className?: string;
}) {
  const map = { default: '', accent: 'badge--accent', ok: 'badge--ok', warn: 'badge--warn', bad: 'badge--bad' };
  return <span className={`badge ${map[tone]} ${className}`}>{children}</span>;
}

// ---------------------------------------------------------------- Formulare

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  htmlFor?: string;
}

export function Field({ label, hint, error, children, htmlFor }: FieldProps) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? <span className="field__error">{error}</span> : hint ? <span className="field__hint">{hint}</span> : null}
    </div>
  );
}

export function TextInput({
  icon,
  className = '',
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { icon?: IconName }) {
  return (
    <div className={`ng-input ${className}`}>
      {icon ? <Icon name={icon} size={17} className="muted" /> : null}
      <input {...rest} />
    </div>
  );
}

export function Select({
  className = '',
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={`ng-input ${className}`}>
      <select {...rest}>{children}</select>
      <Icon name="chevronDown" size={16} className="muted" />
    </div>
  );
}

// ------------------------------------------------------------------- Regler

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
  id?: string;
}

export function Slider({ label, value, min, max, step = 1, onChange, format, id }: SliderProps) {
  return (
    <div className="slider">
      <div className="slider__head">
        <label className="slider__name" htmlFor={id}>
          {label}
        </label>
        <span className="slider__value">{format ? format(value) : value}</span>
      </div>
      <input
        id={id}
        className="slider__input"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

// ------------------------------------------------------------------ Schalter

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      className="ng-toggle"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
    >
      <i />
    </button>
  );
}

// --------------------------------------------------------------------- Chip

export function Chip({
  on,
  onClick,
  children,
  locked,
  title,
}: {
  on?: boolean;
  onClick?: () => void;
  children: ReactNode;
  locked?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      className={`chip ${on ? 'chip--on' : ''} ${locked ? 'chip--locked' : ''}`}
      onClick={onClick}
      aria-pressed={on}
      title={title}
    >
      {locked ? <Icon name="lock" size={12} /> : null}
      {children}
    </button>
  );
}

// -------------------------------------------------------------------- Modal

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
  footer?: ReactNode;
}) {
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    // Fokus in den Dialog holen, sonst bleibt die Tastatur draussen hängen.
    boxRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={boxRef}
        className={`ng modal ${wide ? 'modal--wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <div className="row row--between" style={{ marginBottom: 18 }}>
          <h2 className="h2">{title}</h2>
          <Button variant="quiet" size="sm" iconOnly icon="x" onClick={onClose} aria-label="Schließen" />
        </div>
        {children}
        {footer ? <div className="row row--end" style={{ marginTop: 22, gap: 10 }}>{footer}</div> : null}
      </div>
    </div>
  );
}

// -------------------------------------------------------------- Leerzustand

export function Empty({
  icon = 'info',
  title,
  text,
  action,
}: {
  icon?: IconName;
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <Icon name={icon} />
      <div className="stack stack--sm">
        {/* Eine echte Überschrift, nicht nur fett gesetzter Text: der Leerzustand
            ist die Aussage der Seite. Wer mit Screenreader oder Tastatur von
            Überschrift zu Überschrift springt, muss ihn finden. */}
        <h3 className="h3">{title}</h3>
        {text ? <p className="small">{text}</p> : null}
      </div>
      {action}
    </div>
  );
}

// ------------------------------------------------------------------ Hinweis

export function Notice({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'ok' | 'bad';
  children: ReactNode;
}) {
  const icon: IconName = tone === 'bad' ? 'alert' : tone === 'ok' ? 'check' : 'info';
  return (
    <div className={`notice ${tone === 'bad' ? 'notice--bad' : tone === 'ok' ? 'notice--ok' : ''}`}>
      <Icon name={icon} />
      <div>{children}</div>
    </div>
  );
}

// ----------------------------------------------------------------- Skelett

export function Skeleton({ height = 16, width = '100%' }: { height?: number; width?: number | string }) {
  return <div className="skeleton" style={{ height, width }} />;
}
