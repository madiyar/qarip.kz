/**
 * Search-facing copy: titles, descriptions and intro texts written per language
 * around what people actually type ("казахские шрифты скачать", "қазақша шрифт",
 * "kazakh fonts"), plus JSON-LD builders.
 *
 * "Шрифт" is far more searched than "қаріп", so Kazakh copy uses both words.
 */
import type { Lang } from '../i18n';
import { localePath } from '../i18n';

type L<T = string> = Record<Lang, T>;

export const KZ_LETTERS = 'Ә, Ғ, Қ, Ң, Ө, Ұ, Ү, Һ, І';

export const HOME: { title: L; description: L; aboutTitle: L; about: L<string[]> } = {
  title: {
    kk: 'Қазақша қаріптер (шрифттер) — тегін жүктеу | Qarip',
    ru: 'Казахские шрифты — скачать бесплатно шрифты с казахскими буквами | Qarip',
    en: 'Kazakh fonts — free download of fonts with Kazakh letters | Qarip',
  },
  description: {
    kk: `Qarip — қазақша қаріп (шрифт) қоры. Қазақ әріптері (${KZ_LETTERS}) бар шрифттерді тегін жүктеп алыңыз: кирилл мен латын, тақырыпқа, логотипке, мәтінге арналған қаріптер.`,
    ru: `Qarip — библиотека казахских шрифтов. Скачайте бесплатно шрифты с казахскими буквами (${KZ_LETTERS}): кириллица и латиница, для заголовков, логотипов и текста.`,
    en: `Qarip is a library of Kazakh fonts. Download free fonts with Kazakh letters (${KZ_LETTERS}) — Cyrillic and Latin, for headings, logos and body text.`,
  },
  aboutTitle: {
    kk: 'Қазақша шрифттер бір жерде',
    ru: 'Шрифты с казахскими буквами в одном месте',
    en: 'Fonts with Kazakh letters in one place',
  },
  about: {
    kk: [
      `Qarip — қазақ тілін қолдайтын қаріптердің (шрифттердің) тегін қоры. Мұндағы әр шрифтте қазақ әліпбиінің ерекше әріптері бар: ${KZ_LETTERS}. Сондықтан мәтінде бөтен қаріппен шыққан «секірген» әріптер болмайды.`,
      'Шрифтті өз мәтініңізбен тексеріп, барлық стилін көріп, лицензиясын оқып, бір батырмамен ZIP архив ретінде жүктей аласыз. Каталогта кесілген (sans serif), кертілген (serif), көрнекі, қолжазба және басқа шрифттер бар — логотипке, тақырыпқа, баспаға және сайтқа.',
      'Сонымен қатар тегін құралдар бар: шрифт тестері, TTF/OTF/WOFF2 конвертері, қаріп үйлесімі, қазақша пернетақта және типографиялық юникод таңбалары.',
    ],
    ru: [
      `Qarip — бесплатная библиотека шрифтов с поддержкой казахского языка. В каждом шрифте есть специфические буквы казахского алфавита: ${KZ_LETTERS}. Поэтому в тексте не будет «выпадающих» букв, набранных чужим шрифтом.`,
      'Казахский шрифт можно проверить на своём тексте, посмотреть все начертания, прочитать лицензию и скачать одним ZIP-архивом. В каталоге есть шрифты без засечек (sans serif), с засечками (serif), акцидентные, рукописные и другие — для логотипов, заголовков, печати и сайтов.',
      'Кроме шрифтов на сайте есть бесплатные инструменты: тестер шрифтов, конвертер TTF/OTF/WOFF2, подбор шрифтовых пар, казахская клавиатура и таблица типографических символов Unicode.',
    ],
    en: [
      `Qarip is a free library of fonts that support the Kazakh language. Every font includes the letters specific to the Kazakh alphabet: ${KZ_LETTERS} — so your text never falls back to another typeface.`,
      'Test a Kazakh font with your own text, see every style, read its license and download it as a single ZIP. The catalog covers sans serif, serif, display, handwritten and other fonts — for logos, headings, print and the web.',
      'There are free tools as well: a font tester, a TTF/OTF/WOFF2 converter, font pairing, a Kazakh keyboard and a table of typographic Unicode characters.',
    ],
  },
};

export const CATALOG: { title: L; description: L; h1: L; lead: L } = {
  title: {
    kk: 'Қазақша шрифттер каталогы — барлық қаріпті тегін жүктеу',
    ru: 'Каталог казахских шрифтов — скачать шрифты на казахском бесплатно',
    en: 'Kazakh fonts catalog — download fonts for the Kazakh language',
  },
  description: {
    kk: 'Қазақ әріптері бар барлық шрифт (қаріп): іздеңіз, категория мен лицензия бойынша сүзіңіз, өз мәтініңізбен тексеріп, тегін жүктеп алыңыз.',
    ru: 'Все шрифты с казахскими буквами: поиск, фильтры по категории и лицензии, проверка на своём тексте и бесплатное скачивание.',
    en: 'Every font with Kazakh letters: search, filter by category and license, test with your own text and download for free.',
  },
  h1: { kk: 'Түгел қаріп', ru: 'Казахские шрифты', en: 'Kazakh fonts' },
  lead: {
    kk: 'Қазақ тілін қолдайтын шрифттерден керегін таңдап ал',
    ru: 'Все шрифты с казахскими буквами — выберите подходящий и скачайте бесплатно',
    en: 'Every font with Kazakh letters — pick one and download it for free',
  },
};

export const TOP: { title: L; description: L } = {
  title: {
    kk: 'Ең танымал қазақша шрифттер — топ қаріптер',
    ru: 'Топ казахских шрифтов — самые популярные шрифты с казахскими буквами',
    en: 'Top Kazakh fonts — the most popular fonts with Kazakh letters',
  },
  description: {
    kk: 'Қолданушылар ең көп жүктеген қазақша шрифттер (қаріптер) рейтингі.',
    ru: 'Рейтинг самых скачиваемых шрифтов с поддержкой казахского языка.',
    en: 'A ranking of the most downloaded fonts that support the Kazakh language.',
  },
};

/** Category names and copy for the static category pages. */
export const CATEGORY: Record<string, { name: L; description: L }> = {
  sans: {
    name: { kk: 'Кесілген қаріптер (sans serif)', ru: 'Шрифты без засечек (sans serif)', en: 'Sans serif fonts' },
    description: {
      kk: 'Кертігі жоқ, таза әрі заманауи шрифттер. Сайтқа, интерфейске, презентацияға жақсы жарасады.',
      ru: 'Чистые и современные шрифты без засечек. Хорошо подходят для сайтов, интерфейсов и презентаций.',
      en: 'Clean, modern typefaces without serifs. A good fit for websites, interfaces and presentations.',
    },
  },
  serif: {
    name: { kk: 'Кертілген қаріптер (serif)', ru: 'Шрифты с засечками (serif)', en: 'Serif fonts' },
    description: {
      kk: 'Классикалық кертілген шрифттер. Кітап, газет-журнал және ұзақ мәтінге ыңғайлы.',
      ru: 'Классические шрифты с засечками. Удобны для книг, прессы и длинных текстов.',
      en: 'Classic typefaces with serifs. Comfortable for books, press and long reading.',
    },
  },
  display: {
    name: { kk: 'Көрнекі қаріптер (display)', ru: 'Акцидентные и декоративные шрифты', en: 'Display fonts' },
    description: {
      kk: 'Тақырыпқа, логотипке, афишаға, комикске арналған мінезі бар көрнекі шрифттер.',
      ru: 'Характерные шрифты для заголовков, логотипов, афиш и комиксов.',
      en: 'Expressive typefaces for headings, logos, posters and comics.',
    },
  },
  slab: {
    name: { kk: 'Қырлы қаріптер (slab serif)', ru: 'Брусковые шрифты (slab serif)', en: 'Slab serif fonts' },
    description: {
      kk: 'Төртбұрыш кертігі бар салмақты шрифттер. Тақырып пен жарнамаға сай.',
      ru: 'Уверенные шрифты с прямоугольными засечками. Для заголовков и рекламы.',
      en: 'Sturdy typefaces with block serifs. For headings and advertising.',
    },
  },
  handwritten: {
    name: { kk: 'Қолжазба қаріптер', ru: 'Рукописные шрифты', en: 'Handwritten fonts' },
    description: {
      kk: 'Қолмен жазғандай көрінетін шрифттер: шақыру қағазына, открыткаға, комикске.',
      ru: 'Шрифты, имитирующие письмо от руки: для приглашений, открыток и комиксов.',
      en: 'Typefaces that imitate handwriting: for invitations, cards and comics.',
    },
  },
  monospace: {
    name: { kk: 'Бірке қаріптер (monospace)', ru: 'Моноширинные шрифты', en: 'Monospace fonts' },
    description: {
      kk: 'Әр таңбасының ені бірдей шрифттер. Кодқа және кестеге арналған.',
      ru: 'Шрифты с одинаковой шириной всех знаков. Для кода и таблиц.',
      en: 'Typefaces where every character has the same width. For code and tables.',
    },
  },
};

export function categoryTitle(lang: Lang, id: string, fallback: string): string {
  const name = CATEGORY[id]?.name[lang] ?? fallback;
  return {
    kk: `${name} — қазақша шрифттерді тегін жүктеу`,
    ru: `${name} с казахскими буквами — скачать бесплатно`,
    en: `${name} with Kazakh letters — free download`,
  }[lang];
}

const SCRIPT_NAMES: Record<string, L> = {
  kazakh: { kk: 'қазақ кирилл', ru: 'казахская кириллица', en: 'Kazakh Cyrillic' },
  'kazakh-latin': { kk: 'қазақ латын', ru: 'казахская латиница', en: 'Kazakh Latin' },
  cyrillic: { kk: 'кирилл', ru: 'кириллица', en: 'Cyrillic' },
  latin: { kk: 'латын', ru: 'латиница', en: 'Latin' },
};

export interface FontSeoInput {
  name: string;
  designer: string;
  category: string;
  styles: number;
  glyphs: number;
  scripts: string[];
  license: string;
  commercial: boolean;
  formats: string;
}

export function fontTitle(lang: Lang, name: string): string {
  return {
    kk: `${name} қарпі (шрифт) — тегін жүктеу`,
    ru: `Шрифт ${name} — скачать бесплатно, казахский шрифт`,
    en: `${name} font — free download, Kazakh font`,
  }[lang];
}

/** One factual paragraph about a font, used as meta description and visible text. */
export function fontSummary(lang: Lang, f: FontSeoInput): string {
  const scripts = f.scripts.map((s) => SCRIPT_NAMES[s]?.[lang] ?? s).join(', ');
  const hasKazakh = f.scripts.includes('kazakh');
  const cat = CATEGORY[f.category]?.name[lang] ?? f.category;
  if (lang === 'ru') {
    return [
      `${f.name} — шрифт${hasKazakh ? ' с казахскими буквами' : ''} от дизайнера ${f.designer}.`,
      `Категория: ${cat.toLowerCase()}. Стилей: ${f.styles}${f.glyphs ? `, глифов: ${f.glyphs}` : ''}. Алфавиты: ${scripts}.`,
      `Лицензия: ${f.license} — ${f.commercial ? 'можно использовать в коммерческих проектах' : 'бесплатно для личного использования'}.`,
      `Скачать шрифт ${f.name} можно бесплатно одним архивом (${f.formats}).`,
    ].join(' ');
  }
  if (lang === 'en') {
    return [
      `${f.name} is a font${hasKazakh ? ' with Kazakh letters' : ''} by ${f.designer}.`,
      `Category: ${cat}. Styles: ${f.styles}${f.glyphs ? `, glyphs: ${f.glyphs}` : ''}. Alphabets: ${scripts}.`,
      `License: ${f.license} — ${f.commercial ? 'allowed in commercial projects' : 'free for personal use'}.`,
      `Download ${f.name} for free as a single archive (${f.formats}).`,
    ].join(' ');
  }
  return [
    `${f.name} — ${f.designer} жасаған${hasKazakh ? ' қазақ әріптері бар' : ''} қаріп (шрифт).`,
    `Категориясы: ${cat}. Стиль саны: ${f.styles}${f.glyphs ? `, глиф саны: ${f.glyphs}` : ''}. Әліпбилер: ${scripts}.`,
    `Лицензиясы: ${f.license} — ${f.commercial ? 'коммерциялық жобада қолдануға болады' : 'жеке мақсатта тегін'}.`,
    `${f.name} шрифтін бір архивпен (${f.formats}) тегін жүктеп алыңыз.`,
  ].join(' ');
}

// JSON-LD --------------------------------------------------------------------

const abs = (site: URL | string, path: string) => new URL(path, site).toString();

export function websiteLd(site: URL, lang: Lang) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': abs(site, '/#website'),
        url: abs(site, localePath(lang, '/')),
        name: 'Qarip',
        alternateName: ['Qarip — қазақ қаріп қоры', 'Qarip — казахские шрифты', 'Kazakh fonts'],
        description: HOME.description[lang],
        inLanguage: ['kk', 'ru', 'en'],
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${abs(site, localePath(lang, '/fonts'))}?q={search_term_string}` },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Organization',
        '@id': abs(site, '/#organization'),
        name: 'Qarip',
        url: abs(site, '/'),
        logo: abs(site, '/favicon.svg'),
      },
    ],
  };
}

export function breadcrumbLd(site: URL, items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: abs(site, item.path) })),
  };
}

export function itemListLd(site: URL, lang: Lang, name: string, fonts: { slug: string; name: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: fonts.length,
      itemListElement: fonts.map((f, i) => ({ '@type': 'ListItem', position: i + 1, name: f.name, url: abs(site, localePath(lang, `/fonts/${f.slug}`)) })),
    },
  };
}
