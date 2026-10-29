// Hardcoded eBay prohibited / restricted item exclusion list (server-side only).
// Overrides every ranking rule: an item that matches any category below is never shown.
export const POLICY_VERSION = 'v1';

export const EXCLUDED_CATEGORIES: { id: string; keywords: string[] }[] = [
  { id: 'counterfeit_replica', keywords: ['replica', 'counterfeit', 'fake', 'knockoff', 'knock-off', 'dupe', 'lookalike', 'look-alike', 'imitation', 'bootleg', 'unauthorized copy', 'inspired by', 'mirror quality', '1:1', 'aaa quality'] },
  { id: 'weapons_firearms', keywords: ['gun', 'firearm', 'rifle', 'pistol', 'handgun', 'airsoft', 'stun gun', 'taser', 'pepper spray', 'mace', 'brass knuckles', 'switchblade', 'butterfly knife', 'crossbow', 'sword', 'machete', 'silencer', 'suppressor', 'nunchaku', 'throwing star', 'slingshot'] },
  { id: 'ammunition_explosives', keywords: ['ammo', 'ammunition', 'bullet', 'gunpowder', 'firework', 'explosive', 'detonator', 'tannerite', 'grenade', 'blasting cap', 'black powder'] },
  { id: 'drugs_paraphernalia', keywords: ['drug', 'paraphernalia', 'cannabis', 'marijuana', 'weed', 'bong', 'rolling papers', 'cocaine', 'lsd', 'psilocybin', 'mushroom spores', 'stash box', 'dab rig', 'kratom'] },
  { id: 'tobacco_vape', keywords: ['tobacco', 'cigarette', 'cigar', 'vape', 'vaping', 'e-cig', 'e-liquid', 'e-juice', 'nicotine', 'juul', 'snus', 'hookah', 'shisha'] },
  { id: 'prescription_medical', keywords: ['prescription', 'rx', 'tretinoin', 'insulin', 'antibiotic', 'viagra', 'sildenafil', 'steroid', 'botox', 'dermal filler', 'syringe', 'hearing aid', 'contact lens', 'colored contacts', 'cosmetic lenses', 'laser hair removal', 'microneedle pen', 'dermapen', 'blood glucose'] },
  { id: 'fda_food', keywords: ['supplement', 'dietary', 'gummies', 'protein powder', 'slimming', 'weight loss', 'infant formula', 'baby formula', 'edible', 'herbal tea', 'energy drink', 'detox tea'] },
  { id: 'animals_wildlife', keywords: ['ivory', 'fur', 'pelt', 'taxidermy', 'coral', 'shark fin', 'live animal', 'rhino', 'tortoiseshell', 'real fur', 'animal skin'] },
  { id: 'recalled_unsafe', keywords: ['recalled', 'recall', 'banned', 'unsafe'] },
  { id: 'hazardous_flammable', keywords: ['flammable', 'aerosol', 'propane', 'butane', 'lighter fluid', 'fire starter', 'gel fuel', 'gasoline', 'mercury', 'asbestos', 'pesticide', 'insecticide', 'toxic', 'hazmat', 'corrosive'] },
  { id: 'adult_only', keywords: ['adult toy', 'sex toy', 'sex', 'erotic', 'xxx', 'fetish', 'vibrator', 'porn', 'adult only'] },
  { id: 'stolen_property', keywords: ['stolen', 'looted', 'fenced', 'serial number removed', 'no questions asked'] },
  { id: 'government_ids_documents', keywords: ['fake id', 'id card', 'passport', 'driver license', 'drivers license', 'social security', 'diploma', 'government seal', 'police badge'] },
  { id: 'currency_detection_circumvention', keywords: ['counterfeit detector bypass', 'prop money', 'fake money', 'money printer', 'bill detector bypass', 'currency detector bypass', 'banknote'] },
  { id: 'software_digital', keywords: ['software', 'license key', 'activation key', 'serial key', 'cracked', 'keygen', 'gift card code', 'digital download', 'ebook', 'streaming account', 'iptv'] },
  { id: 'requires_preapproval', keywords: ['cbd', 'hemp', 'gps jammer', 'signal jammer', 'phone jammer', 'lock pick', 'spy camera', 'hidden camera', 'night vision', 'high power laser', 'laser pointer'] },
];

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const COMPILED = EXCLUDED_CATEGORIES.map((c) => ({
  id: c.id,
  rx: new RegExp(`(^|[^a-z0-9])(${c.keywords.map(esc).join('|')})(s|es)?($|[^a-z0-9])`, 'i'),
}));

// Returns the list of matched category ids (empty = eligible).
export function ebayViolations(...texts: (string | undefined)[]): string[] {
  const hay = texts.filter(Boolean).join(' | ');
  return COMPILED.filter((c) => c.rx.test(hay)).map((c) => c.id);
}