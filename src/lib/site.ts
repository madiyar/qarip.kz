export const SITE = {
  name: 'Qarip',
  /** Comes from `site` in astro.config.mjs. */
  url: import.meta.env.SITE.replace(/\/$/, ''),
  host: new URL(import.meta.env.SITE).host,
  email: 'abayemes@gmail.com',
  city: 'Алматы, Қазақстан',
  telegram: 'https://t.me/qarip',
  instagram: 'https://www.instagram.com/qarip_kz',
  /**
   * Search engine ownership codes (the `content` value of their meta tag).
   * Set them here or as GOOGLE_SITE_VERIFICATION / YANDEX_VERIFICATION environment variables.
   */
  verification: {
    google: import.meta.env.GOOGLE_SITE_VERIFICATION ?? '',
    yandex: import.meta.env.YANDEX_VERIFICATION ?? '',
  },
  /** Card details for donations. Leave empty to hide the donation block. */
  donation: { bank: 'Kaspi', card: '', holder: '' },
  /** Keyboard layout installer archive (public/…). Leave empty to hide the download button. */
  keyboardZip: '',
};

/** Top navigation (desktop). Tools are a separate drop-down. */
export const NAV = [
  { href: '/journal', label: 'Жорнал' },
  { href: '/services', label: 'Қызмет' },
];

/** Pages behind "More" in the mobile tab bar. */
export const MORE_NAV = [
  { href: '/journal', label: 'Жорнал' },
  { href: '/glossary', label: 'Сөздік' },
  { href: '/typography', label: 'Типография' },
  { href: '/services', label: 'Қызмет' },
  { href: '/licenses', label: 'Лицензия түрлері' },
  { href: '/faq', label: 'Жиі сұрақтар' },
  { href: '/about', label: 'Біз туралы' },
];

/**
 * Tools. `glyph` is drawn in `glyphFont` on the tool's tile (header menu, tools page);
 * `group` sorts them on the tools page.
 */
export const TOOLS = [
  { href: '/tools/tester', label: 'Тестер', title: 'Қаріп тестері', description: 'Файлдағы қазақ әріптерін тексеру', long: 'Файлды тастаңыз: қазақ әріптері, глифтер, OpenType, вариативті осьтер.', glyph: 'Әа', glyphFont: 'serif', group: 'check' },
  { href: '/tools/proofing', label: 'Баспа тексті', title: 'Баспа тексті', description: 'Сарқырама, тақырып, мәтін', long: 'Сарқырама, тақырыптар, мәтін, алфавит, кернинг — басып шығаруға дайын.', glyph: '¶', glyphFont: 'serif', group: 'check' },
  { href: '/tools/kerning', label: 'Кернинг жұптары', title: 'Кернинг жұптары', description: 'Жұптар мен үштіктер генераторы', long: 'Кернинг тексеруге арналған жұптар мен үштіктер, қазақ әріптерімен.', glyph: 'ҚА', glyphFont: 'sans', group: 'check' },
  { href: '/tools/converter', label: 'Конвертер', title: 'Веб-қаріп конвертері', description: 'TTF, OTF, WOFF, WOFF2', long: 'TTF, OTF, WOFF, WOFF2 арасында бірнеше файлды бірден түрлендіру.', glyph: '⇄', glyphFont: 'sans', group: 'convert' },
  { href: '/tools/freezer', label: 'Font Freezer', title: 'Font Freezer', description: 'OpenType мүмкіндіктерін бекіту', long: 'OpenType мүмкіндіктерін (ss01, tnum…) қаріпке тұрақты бекіту.', glyph: 'ss01', glyphFont: 'mono', group: 'convert' },
  { href: '/tools/pairing', label: 'Үйлесім', title: 'Қаріп үйлесімі', description: 'Тақырып пен мәтінге жұп', long: 'Тақырып пен мәтінге жарасатын қаріп жұбын табыңыз.', glyph: 'Aa', glyphFont: 'serif', group: 'choose' },
  { href: '/keyboard', label: 'Пернетақта', title: 'Қазақ пернетақтасы', description: 'Қазақ раскладкасы', long: 'Виртуалды пернетақта және раскладканы орнату нұсқаулығы.', glyph: 'Ә', glyphFont: 'sans', group: 'choose' },
  { href: '/tools/unicode', label: 'Юникодтар', title: 'Типографиялық юникодтар', description: 'Тире, тырнақша, ₸', long: 'Тире, тырнақша, бос орын түрлері, ₸ — бір басумен көшіру.', glyph: '«»', glyphFont: 'serif', group: 'choose' },
] as const;

export const TOOL_GROUPS = [
  { id: 'check', title: 'Тексеру' },
  { id: 'convert', title: 'Түрлендіру' },
  { id: 'choose', title: 'Таңдау және жазу' },
] as const;

export const PANGRAMS = [
  { label: 'Қазақша панграмма 1', text: 'Бұл гүлді қызға һәм ұлға бер, ал көрші Францияны Пырансы де, ой туғанда хатыңды жаз.' },
  { label: 'Қазақша панграмма 2', text: 'Киіз үйге барып ұғам: ою-өрнек үй іші һәр қазақтың жанын хас баурап алады-ау.' },
  { label: 'English pangram', text: 'The quick brown fox jumps over the lazy dog.' },
];

export const DEFAULT_PREVIEW = PANGRAMS[0].text;

export const CHARSETS = [
  { label: 'Бас әріптер (қазақша)', chars: 'АӘБВГҒДЕЁЖЗИЙКҚЛМНҢОӨПРСТУҰҮФХҺЦЧШЩЪЫІЬЭЮЯ' },
  { label: 'Кіші әріптер (қазақша)', chars: 'аәбвгғдеёжзийкқлмнңоөпрстуұүфхһцчшщъыіьэюя' },
  { label: 'Бас әріптер (латын)', chars: 'AÄBCDEFGĞHIİJKLMNÑOÖPQRSŞTUŪÜVWXYZ' },
  { label: 'Кіші әріптер (латын)', chars: 'aäbcdefgğhıijklmnñoöpqrsştuūüvwxyz' },
  { label: 'Сандар және белгілер', chars: '0123456789 .,:;!?¡¿…·•—–-_()[]{}«»‹›""\'\'/\\|@#$€₸₽%&*+=<>~^' },
];
