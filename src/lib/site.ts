export const SITE = {
  name: 'Qarip',
  /** Comes from `site` in astro.config.mjs. */
  url: import.meta.env.SITE.replace(/\/$/, ''),
  host: new URL(import.meta.env.SITE).host,
  email: 'abayemes@gmail.com',
  city: 'Алматы, Қазақстан',
  telegram: 'https://t.me/qarip',
  instagram: 'https://www.instagram.com/qarip_kz',
  /** Card details for donations. Leave empty to hide the donation block. */
  donation: { bank: 'Kaspi', card: '', holder: '' },
  /** Keyboard layout installer archive (public/…). Leave empty to hide the download button. */
  keyboardZip: '',
};

export const NAV = [
  { href: '/fonts', label: 'Қаріптер' },
  { href: '/services', label: 'Қызметтер' },
  { href: '/journal', label: 'Journal' },
  { href: '/about', label: 'Біз туралы' },
];

export const TOOLS = [
  { href: '/tools/tester', label: 'Тестер', title: 'Қаріп тестері', description: 'Өз қаріп файлыңызды браузерде тексеріңіз', icon: 'type' },
  { href: '/tools/converter', label: 'Конвертер', title: 'Веб-қаріп конвертері', description: 'TTF, OTF, WOFF, WOFF2 арасында конвертациялау', icon: 'repeat' },
  { href: '/tools/pairing', label: 'Үйлесім', title: 'Қаріп үйлесімі', description: 'Тақырып пен мәтінге қаріп жұбын табыңыз', icon: 'layers' },
  { href: '/tools/proofing', label: 'Баспа тексту', title: 'Баспа тексту', description: 'Сарқырама, алфавит, кернинг — басып шығаруға дайын', icon: 'printer' },
  { href: '/tools/freezer', label: 'Font Freezer', title: 'Font Freezer', description: 'OpenType мүмкіндіктерін қаріпке бекіту', icon: 'snowflake' },
  { href: '/tools/kerning', label: 'Кернинг жұптары', title: 'Кернинг жұптары генераторы', description: 'Кернинг тексеруге арналған таңба комбинациялары', icon: 'kerning' },
  { href: '/keyboard', label: 'Пернетақта', title: 'Қазақ пернетақтасы', description: 'Раскладка және виртуалды пернетақта', icon: 'keyboard' },
] as const;

export const PANGRAMS = [
  { label: 'Қазақша панграмма 1', text: 'Бұл гүлді қызға һәм ұлға бер, ал көрші Францияны Пырансы де, ой туғанда хатыңды жаз.' },
  { label: 'Қазақша панграмма 2', text: 'Киіз үйге барып ұғам: ою-өрнек үй іші һәр қазақтың жанын хас баурап алады-ау.' },
  { label: 'Латын панграмма', text: 'Bul güldi qyzğa häm ūlğa ber, al körşı Fransiany Pyransy de, oi tuğanda hatyñdy jaz.' },
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
