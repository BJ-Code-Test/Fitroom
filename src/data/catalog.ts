import type { Garment, SizeSpec, Slot } from '../types';
import { PROVIDERS } from './providers';

/**
 * Der mitgelieferte Katalog.
 *
 * Die Anbieter sind erfunden — echte Shops liefern später über den
 * `ProviderAdapter` dieselbe `Garment`-Form. Die Größenläufe sind
 * Körpermaße in cm (nicht Stoffmasse): "dieses M ist für 98 cm
 * Brustumfang gemacht". Was daraus an Luft wird, rechnet `lib/fit.ts`
 * aus Schnitt und Material.
 */

// ------------------------------------------------------------ Größenläufe

const TOP_SIZES: SizeSpec[] = [
  { label: 'XS', chest: 86, waist: 74 },
  { label: 'S', chest: 92, waist: 80 },
  { label: 'M', chest: 98, waist: 86 },
  { label: 'L', chest: 106, waist: 94 },
  { label: 'XL', chest: 114, waist: 102 },
  { label: 'XXL', chest: 122, waist: 110 },
];

/** Hosen: Bundweite in Zoll als Label, Körpermaße in cm. */
const pantSizes = (inseam: number): SizeSpec[] =>
  [
    { w: 28, waist: 74, hip: 90 },
    { w: 30, waist: 79, hip: 95 },
    { w: 32, waist: 84, hip: 100 },
    { w: 34, waist: 89, hip: 105 },
    { w: 36, waist: 95, hip: 111 },
    { w: 38, waist: 101, hip: 117 },
  ].map(({ w, waist, hip }) => ({
    label: `${w}/${Math.round(inseam / 2.54)}`,
    waist,
    hip,
    inseam,
  }));

/** Röcke und Shorts hängen an der Hüfte, nicht an der Beinlänge. */
const hipSizes = (inseam?: number): SizeSpec[] =>
  [
    { label: 'XS', waist: 66, hip: 88 },
    { label: 'S', waist: 72, hip: 94 },
    { label: 'M', waist: 78, hip: 100 },
    { label: 'L', waist: 86, hip: 108 },
    { label: 'XL', waist: 94, hip: 116 },
  ].map((s) => (inseam === undefined ? s : { ...s, inseam }));

/** EU-Schuhgröße -> Fußlänge in cm. */
const SHOE_SIZES: SizeSpec[] = [38, 39, 40, 41, 42, 43, 44, 45, 46].map((eu) => ({
  label: `EU ${eu}`,
  foot: Math.round(((eu - 2) / 1.5) * 10) / 10,
}));

const BELT_SIZES: SizeSpec[] = [
  { label: '85 cm', waist: 76 },
  { label: '95 cm', waist: 86 },
  { label: '105 cm', waist: 96 },
  { label: '115 cm', waist: 106 },
];

const ONE_SIZE: SizeSpec[] = [{ label: 'Einheitsgröße' }];

// ------------------------------------------------------------------ Farben

const c = (name: string, hex: string, accentHex?: string) => ({ name, hex, accentHex });

const NEUTRALS = [c('Schwarz', '#1c1d21'), c('Nebelgrau', '#9aa0ac'), c('Off-White', '#ece7dd')];

// --------------------------------------------------------------- Katalog

export const CATALOG: Garment[] = [
  // ------------------------------------------------------ Nordstil (free)
  {
    id: 'ns-tee-basic',
    name: 'Everyday T-Shirt',
    brand: 'Nordstil',
    providerId: 'nordstil',
    slot: 'top',
    shape: 'tee',
    cut: 'regular',
    material: 'cotton',
    price: 19.9,
    colorways: [...NEUTRALS, c('Tiefblau', '#2b3a63')],
    sizes: TOP_SIZES,
  },
  {
    id: 'ns-tee-slim',
    name: 'Fitted Tee',
    brand: 'Nordstil',
    providerId: 'nordstil',
    slot: 'top',
    shape: 'tee',
    cut: 'slim',
    material: 'cotton',
    price: 24.9,
    colorways: [c('Schwarz', '#1c1d21'), c('Bordeaux', '#5d2230'), c('Salbei', '#8ba38c')],
    sizes: TOP_SIZES,
  },
  {
    id: 'ns-longsleeve',
    name: 'Ribbed Longsleeve',
    brand: 'Nordstil',
    providerId: 'nordstil',
    slot: 'top',
    shape: 'longsleeve',
    cut: 'slim',
    material: 'knit',
    price: 34.9,
    colorways: [c('Anthrazit', '#33363d'), c('Creme', '#e6ddcb'), c('Rost', '#9b4f2c')],
    sizes: TOP_SIZES,
  },
  {
    id: 'ns-oxford',
    name: 'Oxford-Hemd',
    brand: 'Nordstil',
    providerId: 'nordstil',
    slot: 'top',
    shape: 'shirt',
    cut: 'regular',
    material: 'cotton',
    price: 49.9,
    colorways: [c('Weiß', '#f2f0eb'), c('Hellblau', '#a9c4dd'), c('Streifen Marine', '#31456e')],
    sizes: TOP_SIZES,
  },
  {
    id: 'ns-chino',
    name: 'Chino Tapered',
    brand: 'Nordstil',
    providerId: 'nordstil',
    slot: 'bottom',
    shape: 'pants',
    cut: 'regular',
    material: 'cotton',
    price: 59.9,
    colorways: [c('Sand', '#c8b295'), c('Oliv', '#5c6248'), c('Marine', '#28324c')],
    sizes: pantSizes(81),
  },
  {
    id: 'ns-chino-long',
    name: 'Chino Tapered Long',
    brand: 'Nordstil',
    providerId: 'nordstil',
    slot: 'bottom',
    shape: 'pants',
    cut: 'regular',
    material: 'cotton',
    price: 59.9,
    colorways: [c('Sand', '#c8b295'), c('Schwarz', '#1f2024')],
    sizes: pantSizes(86),
  },
  {
    id: 'ns-jacket-harrington',
    name: 'Harrington-Jacke',
    brand: 'Nordstil',
    providerId: 'nordstil',
    slot: 'outer',
    shape: 'jacket',
    cut: 'regular',
    material: 'cotton',
    price: 89.9,
    colorways: [c('Marine', '#242f4a'), c('Beige', '#c4b49a')],
    sizes: TOP_SIZES,
  },
  {
    id: 'ns-sneaker-court',
    name: 'Court Sneaker',
    brand: 'Nordstil',
    providerId: 'nordstil',
    slot: 'shoes',
    shape: 'sneaker',
    cut: 'regular',
    material: 'leather',
    price: 79.9,
    colorways: [c('Weiß', '#efeee9', '#d8d5cc'), c('Schwarz', '#202126', '#3a3b42')],
    sizes: SHOE_SIZES,
  },

  // -------------------------------------------------- Urban Thread (free)
  {
    id: 'ut-hoodie-heavy',
    name: 'Heavy Hoodie 480g',
    brand: 'Urban Thread',
    providerId: 'urban',
    slot: 'top',
    shape: 'hoodie',
    cut: 'oversized',
    material: 'cotton',
    price: 69.9,
    colorways: [c('Schwarz', '#191a1e'), c('Grau meliert', '#8d9199'), c('Waldgrün', '#2f4535')],
    sizes: TOP_SIZES,
  },
  {
    id: 'ut-tee-box',
    name: 'Boxy Tee',
    brand: 'Urban Thread',
    providerId: 'urban',
    slot: 'top',
    shape: 'tee',
    cut: 'oversized',
    material: 'cotton',
    price: 29.9,
    colorways: [c('Off-White', '#e9e4da'), c('Schwarz', '#1b1c20'), c('Lavendel', '#9b8fc4')],
    sizes: TOP_SIZES,
  },
  {
    id: 'ut-jeans-baggy',
    name: 'Baggy Denim',
    brand: 'Urban Thread',
    providerId: 'urban',
    slot: 'bottom',
    shape: 'jeans',
    cut: 'oversized',
    material: 'denim',
    price: 79.9,
    colorways: [c('Mid Blue', '#5878a3'), c('Washed Black', '#3a3a3f'), c('Ecru', '#ddd3c0')],
    sizes: pantSizes(81),
  },
  {
    id: 'ut-jeans-slim',
    name: 'Slim Denim Stretch',
    brand: 'Urban Thread',
    providerId: 'urban',
    slot: 'bottom',
    shape: 'jeans',
    cut: 'slim',
    material: 'denim',
    price: 69.9,
    colorways: [c('Rinse Blue', '#33456a'), c('Schwarz', '#232428')],
    sizes: pantSizes(84),
  },
  {
    id: 'ut-shorts-cargo',
    name: 'Cargo Shorts',
    brand: 'Urban Thread',
    providerId: 'urban',
    slot: 'bottom',
    shape: 'shorts',
    cut: 'regular',
    material: 'cotton',
    price: 44.9,
    colorways: [c('Khaki', '#988a6b'), c('Schwarz', '#1f2024')],
    sizes: hipSizes(20),
  },
  {
    id: 'ut-bomber',
    name: 'Nylon Bomber',
    brand: 'Urban Thread',
    providerId: 'urban',
    slot: 'outer',
    shape: 'jacket',
    cut: 'oversized',
    material: 'tech',
    price: 119.0,
    colorways: [c('Schwarz', '#17181c'), c('Silber', '#b7bcc4'), c('Ziegel', '#8f4033')],
    sizes: TOP_SIZES,
  },
  {
    id: 'ut-sneaker-runner',
    name: 'Chunky Runner',
    brand: 'Urban Thread',
    providerId: 'urban',
    slot: 'shoes',
    shape: 'sneaker',
    cut: 'oversized',
    material: 'tech',
    price: 129.0,
    colorways: [c('Weiß/Grau', '#e6e4df', '#9ea3ab'), c('Triple Black', '#1a1b1f', '#2a2b30')],
    sizes: SHOE_SIZES,
  },
  {
    id: 'ut-cap',
    name: 'Six-Panel Cap',
    brand: 'Urban Thread',
    providerId: 'urban',
    slot: 'head',
    shape: 'cap',
    cut: 'regular',
    material: 'cotton',
    price: 24.9,
    colorways: [c('Schwarz', '#1c1d21'), c('Marine', '#26314d'), c('Beige', '#cbbda3')],
    sizes: ONE_SIZE,
  },

  // -------------------------------------------------------- Basiq (free)
  {
    id: 'bq-tee-pack',
    name: 'Basic Tee',
    brand: 'Basiq',
    providerId: 'basiq',
    slot: 'top',
    shape: 'tee',
    cut: 'regular',
    material: 'cotton',
    price: 9.9,
    colorways: NEUTRALS,
    sizes: TOP_SIZES,
  },
  {
    id: 'bq-sweat',
    name: 'Crew Sweater',
    brand: 'Basiq',
    providerId: 'basiq',
    slot: 'top',
    shape: 'longsleeve',
    cut: 'regular',
    material: 'cotton',
    price: 29.9,
    colorways: [c('Grau', '#9498a0'), c('Marine', '#2a3450'), c('Bordeaux', '#5a2531')],
    sizes: TOP_SIZES,
  },
  {
    id: 'bq-jogger',
    name: 'Jogger Sweat',
    brand: 'Basiq',
    providerId: 'basiq',
    slot: 'bottom',
    shape: 'pants',
    cut: 'regular',
    material: 'knit',
    price: 34.9,
    colorways: [c('Grau', '#9498a0'), c('Schwarz', '#1e1f23')],
    sizes: pantSizes(79),
  },
  {
    id: 'bq-skirt',
    name: 'A-Linien-Rock',
    brand: 'Basiq',
    providerId: 'basiq',
    slot: 'bottom',
    shape: 'skirt',
    cut: 'regular',
    material: 'cotton',
    price: 39.9,
    colorways: [c('Schwarz', '#1c1d21'), c('Karo Grau', '#7d818b'), c('Camel', '#b18a5c')],
    sizes: hipSizes(),
  },
  {
    id: 'bq-parka',
    name: 'Regen-Parka',
    brand: 'Basiq',
    providerId: 'basiq',
    slot: 'outer',
    shape: 'coat',
    cut: 'oversized',
    material: 'tech',
    price: 99.0,
    colorways: [c('Oliv', '#4e563f'), c('Schwarz', '#1a1b1f')],
    sizes: TOP_SIZES,
  },
  {
    id: 'bq-beanie',
    name: 'Rippmütze',
    brand: 'Basiq',
    providerId: 'basiq',
    slot: 'head',
    shape: 'beanie',
    cut: 'regular',
    material: 'knit',
    price: 14.9,
    colorways: [c('Schwarz', '#1c1d21'), c('Senf', '#b8893a'), c('Grau', '#8f939b')],
    sizes: ONE_SIZE,
  },
  {
    id: 'bq-belt',
    name: 'Ledergürtel 3,5 cm',
    brand: 'Basiq',
    providerId: 'basiq',
    slot: 'accessory',
    shape: 'belt',
    cut: 'regular',
    material: 'leather',
    price: 29.9,
    colorways: [c('Schwarz', '#1a1b1e', '#b9bcc2'), c('Cognac', '#8a5730', '#c8a86a')],
    sizes: BELT_SIZES,
  },
  {
    id: 'bq-boot-chelsea',
    name: 'Chelsea Boot',
    brand: 'Basiq',
    providerId: 'basiq',
    slot: 'shoes',
    shape: 'boot',
    cut: 'regular',
    material: 'leather',
    price: 89.9,
    colorways: [c('Schwarz', '#1d1e22', '#2c2d32'), c('Braun', '#6b4530', '#3f2a1e')],
    sizes: SHOE_SIZES,
  },

  // ---------------------------------------------------- Atelier Vion (pro)
  {
    id: 'av-shirt-poplin',
    name: 'Popeline-Hemd',
    brand: 'Atelier Vion',
    providerId: 'atelier',
    slot: 'top',
    shape: 'shirt',
    cut: 'slim',
    material: 'cotton',
    price: 129.0,
    colorways: [c('Elfenbein', '#efe9dd'), c('Nachtblau', '#1f2740'), c('Graphit', '#3b3d43')],
    sizes: TOP_SIZES,
  },
  {
    id: 'av-knit-merino',
    name: 'Merino-Feinstrick',
    brand: 'Atelier Vion',
    providerId: 'atelier',
    slot: 'top',
    shape: 'longsleeve',
    cut: 'slim',
    material: 'wool',
    price: 159.0,
    colorways: [c('Kamel', '#b2895c'), c('Schwarz', '#1a1b1f'), c('Marine', '#232c46')],
    sizes: TOP_SIZES,
  },
  {
    id: 'av-coat-wool',
    name: 'Wollmantel Cashmere-Mix',
    brand: 'Atelier Vion',
    providerId: 'atelier',
    slot: 'outer',
    shape: 'coat',
    cut: 'regular',
    material: 'wool',
    price: 449.0,
    colorways: [c('Anthrazit', '#333941'), c('Kamel', '#ab7f52')],
    sizes: TOP_SIZES,
  },
  {
    id: 'av-trouser-wool',
    name: 'Bundfaltenhose Wolle',
    brand: 'Atelier Vion',
    providerId: 'atelier',
    slot: 'bottom',
    shape: 'pants',
    cut: 'regular',
    material: 'wool',
    price: 189.0,
    colorways: [c('Anthrazit', '#35383e'), c('Marine', '#252e46'), c('Taupe', '#8e8172')],
    sizes: pantSizes(84),
  },
  {
    id: 'av-derby',
    name: 'Derby Rahmengenäht',
    brand: 'Atelier Vion',
    providerId: 'atelier',
    slot: 'shoes',
    shape: 'boot',
    cut: 'slim',
    material: 'leather',
    price: 329.0,
    colorways: [c('Schwarz', '#1b1c20', '#2e2f34'), c('Dunkelbraun', '#4a3122', '#2d1e15')],
    sizes: SHOE_SIZES,
  },
  {
    id: 'av-scarf',
    name: 'Kaschmirschal',
    brand: 'Atelier Vion',
    providerId: 'atelier',
    slot: 'accessory',
    shape: 'scarf',
    cut: 'regular',
    material: 'wool',
    price: 119.0,
    colorways: [c('Grau', '#8b8f97'), c('Kamel', '#b4885a'), c('Bordeaux', '#5a2632')],
    sizes: ONE_SIZE,
  },

  // ---------------------------------------------------- Terra Supply (pro)
  {
    id: 'ts-fleece',
    name: 'Grid-Fleece Halfzip',
    brand: 'Terra Supply',
    providerId: 'terra',
    slot: 'top',
    shape: 'longsleeve',
    cut: 'regular',
    material: 'tech',
    price: 99.0,
    colorways: [c('Moos', '#4a5a41'), c('Sand', '#c1ab86'), c('Schiefer', '#4b5560')],
    sizes: TOP_SIZES,
  },
  {
    id: 'ts-shell',
    name: '3-Lagen Hardshell',
    brand: 'Terra Supply',
    providerId: 'terra',
    slot: 'outer',
    shape: 'jacket',
    cut: 'regular',
    material: 'tech',
    price: 279.0,
    colorways: [c('Signalorange', '#c4622b'), c('Schwarz', '#191a1e'), c('Petrol', '#1f4a52')],
    sizes: TOP_SIZES,
  },
  {
    id: 'ts-pants-trek',
    name: 'Trekkinghose',
    brand: 'Terra Supply',
    providerId: 'terra',
    slot: 'bottom',
    shape: 'pants',
    cut: 'regular',
    material: 'tech',
    price: 139.0,
    colorways: [c('Schiefer', '#4d5560'), c('Sand', '#b8a583')],
    sizes: pantSizes(83),
  },
  {
    id: 'ts-boot-hike',
    name: 'Approach-Schuh',
    brand: 'Terra Supply',
    providerId: 'terra',
    slot: 'shoes',
    shape: 'boot',
    cut: 'regular',
    material: 'tech',
    price: 169.0,
    colorways: [c('Moos/Sand', '#5a6349', '#c2ad88'), c('Schwarz', '#1c1d21', '#43454b')],
    sizes: SHOE_SIZES,
  },
  {
    id: 'ts-cap-run',
    name: 'Trail Cap',
    brand: 'Terra Supply',
    providerId: 'terra',
    slot: 'head',
    shape: 'cap',
    cut: 'regular',
    material: 'tech',
    price: 39.0,
    colorways: [c('Moos', '#4d5a44'), c('Schwarz', '#1b1c20')],
    sizes: ONE_SIZE,
  },

  // ----------------------------------------------------- Koban Tokyo (pro)
  {
    id: 'kt-tee-drape',
    name: 'Drape Tee',
    brand: 'Koban Tokyo',
    providerId: 'koban',
    slot: 'top',
    shape: 'tee',
    cut: 'oversized',
    material: 'tech',
    price: 89.0,
    colorways: [c('Sumi-Schwarz', '#16171a'), c('Asche', '#7e838c'), c('Indigo', '#2c3a5c')],
    sizes: TOP_SIZES,
  },
  {
    id: 'kt-shirt-band',
    name: 'Bandkragen-Hemd',
    brand: 'Koban Tokyo',
    providerId: 'koban',
    slot: 'top',
    shape: 'shirt',
    cut: 'oversized',
    material: 'cotton',
    price: 149.0,
    colorways: [c('Indigo', '#2b3757'), c('Naturweiß', '#e8e2d5')],
    sizes: TOP_SIZES,
  },
  {
    id: 'kt-hakama',
    name: 'Wide Trouser',
    brand: 'Koban Tokyo',
    providerId: 'koban',
    slot: 'bottom',
    shape: 'pants',
    cut: 'oversized',
    material: 'cotton',
    price: 169.0,
    colorways: [c('Sumi-Schwarz', '#17181c'), c('Indigo', '#293755'), c('Stein', '#8d8a82')],
    sizes: pantSizes(80),
  },
  {
    id: 'kt-noragi',
    name: 'Noragi-Jacke',
    brand: 'Koban Tokyo',
    providerId: 'koban',
    slot: 'outer',
    shape: 'jacket',
    cut: 'oversized',
    material: 'denim',
    price: 229.0,
    colorways: [c('Indigo', '#2a3a5e'), c('Schwarz', '#1a1b1f')],
    sizes: TOP_SIZES,
  },
  {
    id: 'kt-sandal',
    name: 'Leder-Slip-on',
    brand: 'Koban Tokyo',
    providerId: 'koban',
    slot: 'shoes',
    shape: 'sneaker',
    cut: 'slim',
    material: 'leather',
    price: 199.0,
    colorways: [c('Schwarz', '#1a1b1e', '#0f1012'), c('Naturleder', '#b08a5f', '#7a5837')],
    sizes: SHOE_SIZES,
  },
  {
    id: 'kt-tote',
    name: 'Canvas-Gurt',
    brand: 'Koban Tokyo',
    providerId: 'koban',
    slot: 'accessory',
    shape: 'belt',
    cut: 'oversized',
    material: 'cotton',
    price: 59.0,
    colorways: [c('Schwarz', '#1b1c20', '#8a8d94'), c('Natur', '#c9bda3', '#6f6754')],
    sizes: BELT_SIZES,
  },
  {
    id: 'kt-scarf-gauze',
    name: 'Gauze-Tuch',
    brand: 'Koban Tokyo',
    providerId: 'koban',
    slot: 'accessory',
    shape: 'scarf',
    cut: 'oversized',
    material: 'cotton',
    price: 69.0,
    colorways: [c('Indigo', '#2c3a5c'), c('Naturweiß', '#e6e0d3')],
    sizes: ONE_SIZE,
  },
];

// -------------------------------------------------------------- Zugriffe

export const garmentById = (id: string): Garment | undefined =>
  CATALOG.find((g) => g.id === id);

export const garmentsBySlot = (slot: Slot): Garment[] =>
  CATALOG.filter((g) => g.slot === slot);

/** Alle Teile, die dieser Plan sehen darf — die Anbieterstufe entscheidet. */
export function catalogForProviders(providerIds: Set<string>): Garment[] {
  return CATALOG.filter((g) => providerIds.has(g.providerId));
}

export const PRICE_RANGE: [number, number] = [
  Math.floor(Math.min(...CATALOG.map((g) => g.price))),
  Math.ceil(Math.max(...CATALOG.map((g) => g.price))),
];

/** Wird beim Start einmal geprüft: ein Teil ohne bekannten Anbieter ist ein Fehler. */
export function catalogIntegrity(): string[] {
  const problems: string[] = [];
  const providerIds = new Set(PROVIDERS.map((p) => p.id));
  const seen = new Set<string>();

  for (const g of CATALOG) {
    if (seen.has(g.id)) problems.push(`doppelte ID: ${g.id}`);
    seen.add(g.id);
    if (!providerIds.has(g.providerId)) problems.push(`${g.id}: unbekannter Anbieter ${g.providerId}`);
    if (g.colorways.length === 0) problems.push(`${g.id}: keine Farbe`);
    if (g.sizes.length === 0) problems.push(`${g.id}: keine Größe`);
    for (const cw of g.colorways) {
      if (!/^#[0-9a-fA-F]{6}$/.test(cw.hex)) problems.push(`${g.id}: ungültige Farbe ${cw.hex}`);
    }
  }
  return problems;
}
