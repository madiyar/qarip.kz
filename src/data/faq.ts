import type { Lang } from '../i18n';

/** FAQ entries. Answers are trusted HTML written by the editors. */
export const FAQ: Record<Lang, { q: string; a: string }>[] = [
  {
    kk: {
      q: 'Қаріпті Windows жүйесіне қалай орнатамын?',
      a: '<p>Қаріпті жүктеп алып, .zip мұрағатының ішіндегі қаріп файлын (.otf не .ttf) ашыңыз. Шыққан терезеде «Орнату» батырмасын басыңыз. Жүйеңіз ескі болып, ондай функциясы болмаса, <code>C:\\Windows\\Fonts</code> бумасына қаріп файлын көшіріңіз.</p>',
    },
    en: {
      q: 'How do I install a font on Windows?',
      a: '<p>Download the font, open the font file (.otf or .ttf) inside the .zip archive and click “Install”. On older systems copy the file into <code>C:\\Windows\\Fonts</code>.</p>',
    },
  },
  {
    kk: {
      q: 'Қаріпті macOS жүйесіне қалай орнатамын?',
      a: '<p>Мұрағатты ашып, қаріп файлын екі рет басыңыз. «Font Book» бағдарламасы ашылады — «Install Font» батырмасын басыңыз. Немесе файлды <code>~/Library/Fonts</code> бумасына көшіріңіз.</p>',
    },
    en: {
      q: 'How do I install a font on macOS?',
      a: '<p>Extract the archive and double-click the font file. Font Book opens — click “Install Font”. Or copy the file into <code>~/Library/Fonts</code>.</p>',
    },
  },
  {
    kk: {
      q: 'Қаріпті Linux жүйесіне қалай орнатамын?',
      a: '<p>Қаріп файлдарын (.ttf не .otf) <code>~/.local/share/fonts</code> бумасына көшіріп, <code>fc-cache -f</code> командасын орындаңыз. Кейбір файл менеджерлерде <code>fonts://</code> бумасына көшіру жеткілікті.</p>',
    },
    en: {
      q: 'How do I install a font on Linux?',
      a: '<p>Copy the font files (.ttf or .otf) into <code>~/.local/share/fonts</code> and run <code>fc-cache -f</code>. Some file managers also accept copying into <code>fonts://</code>.</p>',
    },
  },
  {
    kk: {
      q: 'Лицензия туралы не білуім керек?',
      a: '<p>Лицензияға байланысты қаріптің өз шектеуі болады.</p><p><strong>Жеке мақсатқа</strong> арналған қаріпті пұл таппайтын мақсатта ғана қолдануға болады: өзіңізге арналған шағын кітап, жеке сайт не блог графикасы, дос-туысқа шақыру қағазы, қайырымдылық ұйымдары, өзіңізге арналған киім дизайны.</p><p><strong>Коммерциялық</strong> мақсатқа арналған қаріпті пұл табу мақсатында қолдануға болады: сатылатын кітап, тапсырыспен жасалған графика, ақылы іс-шараның шақыруы, сататын киім дизайны және т.б.</p><p>Қаріп коммерциялық мақсатқа арналса да, оны сатуға құқыңыз жоқ — авторлық құқы иесіне тиесілі. <a href="/licenses">Лицензия түрлері</a></p>',
    },
    en: {
      q: 'What should I know about licenses?',
      a: '<p>Every font’s license sets its own limits.</p><p>Fonts for <strong>personal use</strong> may only be used where you make no money: a small book for yourself, graphics for a personal site or blog, invitations for friends and family, charities, clothing designs for yourself.</p><p>Fonts licensed for <strong>commercial use</strong> may be used to make money: books for sale, client work, invitations to paid events, merchandise and so on.</p><p>Even with a commercial license you may not sell the font itself — the copyright stays with its author. <a href="/licenses">License types</a></p>',
    },
  },
  {
    kk: {
      q: 'Қаріпті орнатқан соң неге көрінбей тұр?',
      a: '<p>Қаріп қолданатын бағдарламада орнатқан қарпіңіз жоқ болса, бағдарламаны өшіріп қайта қосыңыз. Онда да жоқ болса, компьютерді қайта қосыңыз.</p>',
    },
    en: {
      q: 'Why doesn’t the font show up after installing?',
      a: '<p>If the font does not appear in your app, restart the app. If it is still missing, restart your computer.</p>',
    },
  },
  {
    kk: {
      q: 'Неге интернетте бар қазақша қаріптің көбін сайттан таба алмадым?',
      a: '<p>Интернетте неше түрлі ақылы қаріптің қазақша нұсқалары тарап жүр. Оларды жариялауға құқымыз жоқ. Ақылы қаріпті иесінің сайтынан іздеңіз. <a href="/journal/license-turleri">Лицензия туралы толығырақ</a></p>',
    },
    en: {
      q: 'Why can’t I find many of the Kazakh fonts I’ve seen online here?',
      a: '<p>Many Kazakh versions of paid fonts circulate online. We have no right to publish them — look for paid fonts on their authors’ sites. <a href="/journal/license-turleri">More about licenses</a></p>',
    },
  },
  {
    kk: {
      q: 'Маған керек қаріпті таба алмай тұрмын.',
      a: '<p>Ақылы қаріп болып, қазақша әріптері жоқ болса, иесіне жазып, қазақша нұсқасын сұраңыз. Тегін қаріптің қазақша нұсқасын таба алмасаңыз, бізден қазақшалауға <a href="/services">тапсырыс бере аласыз</a>.</p>',
    },
    en: {
      q: 'I can’t find the font I need.',
      a: '<p>If a paid font lacks Kazakh letters, ask its author for a Kazakh version. If you can’t find a Kazakh version of a free font, you can <a href="/services">order one from us</a>.</p>',
    },
  },
  {
    kk: {
      q: 'Жүктеп алған қарпімде қазақша әріптер жоқ.',
      a: '<p>Қаріпте ӘәІіҢңҒғҮүҰұҚқӨөҺһ әріптері жоқ болса, бізге жазып, қай қаріп екенін айтыңыз. Файлды тексеріп, жаңа нұсқасын жүктейміз не мүлде алып тастаймыз. Өз файлыңызды <a href="/tools/tester">Қаріп тестері</a> арқылы тексере аласыз.</p>',
    },
    en: {
      q: 'The font I downloaded has no Kazakh letters.',
      a: '<p>If the font lacks ӘәІіҢңҒғҮүҰұҚқӨөҺһ, tell us which font it is. We will check it and upload a fixed version or remove it. You can check any file with the <a href="/tools/tester">Font tester</a>.</p>',
    },
  },
  {
    kk: {
      q: 'Таңдаулылар мен каталогтар қайда сақталады?',
      a: '<p>Таңдаулылар, жүктеу тарихы және каталогтар тек сіздің браузеріңізде (localStorage) сақталады. Серверге ештеңе жіберілмейді, тіркелу қажет емес.</p>',
    },
    en: {
      q: 'Where are favorites and catalogs stored?',
      a: '<p>Favorites, download history and catalogs are stored only in your browser (localStorage). Nothing is sent to a server and no sign-up is needed.</p>',
    },
  },
];
