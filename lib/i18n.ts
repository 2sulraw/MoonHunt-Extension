export type ExtensionLocaleCode = 'en' | 'fa' | 'es' | 'pt' | 'ru' | 'ja' | 'zh' | 'ar'

export interface ExtensionLocaleInfo {
  code: ExtensionLocaleCode
  label: string
  flag: string
}

export const EXTENSION_LOCALES: ExtensionLocaleInfo[] = [
  { code: 'en', label: 'English', flag: 'flags/en.png' },
  { code: 'fa', label: 'فارسی', flag: 'flags/fa.png' },
  { code: 'es', label: 'Español', flag: 'flags/es.png' },
  { code: 'pt', label: 'Português', flag: 'flags/pt.png' },
  { code: 'ru', label: 'Русский', flag: 'flags/ru.png' },
  { code: 'ja', label: '日本語', flag: 'flags/ja.png' },
  { code: 'zh', label: '中文', flag: 'flags/zh.png' },
  { code: 'ar', label: 'العربية', flag: 'flags/ar.png' },
]

type Messages = Record<string, string>

const en: Messages = {
  'A polished desktop download manager built for speed, structure, and a calm experience.': 'A polished desktop download manager built for speed, structure, and a calm experience.',
  'Built with care by': 'Built with care by',
  'Open MoonHunt': 'Open MoonHunt',
  'App Status': 'App Status',
  'MoonHunt is running': 'MoonHunt is running',
  'MoonHunt is closed': 'MoonHunt is closed',
  'check your token': 'check your token',
}

const fa: Messages = {
  'Extension Settings': 'تنظیمات افزونه',
  General: 'عمومی',
  Appearance: 'ظاهر',
  About: 'درباره',
  'Save Changes': 'ذخیره تغییرات',
  'Connection and feature settings for the MoonHunt integration': 'تنظیمات اتصال و امکانات برای یکپارچه‌سازی MoonHunt',
  Connection: 'اتصال',
  Host: 'میزبان',
  Port: 'پورت',
  Features: 'امکانات',
  'Intercept Downloads': 'گرفتن دانلودها',
  'Automatically capture download links from pages': 'به‌طور خودکار لینک‌های دانلود را از صفحات بگیرید',
  'Cookie Sharing': 'اشتراک‌گذاری کوکی',
  'Share YouTube session cookies with the desktop app': 'کوکی‌های نشست YouTube را با برنامه دسکتاپ به اشتراک بگذارید',
  'Test Connection': 'آزمایش اتصال',
  'Testing…': 'در حال آزمایش…',
  'Theme and accent color for the extension popup': 'تم و رنگ تاکیدی برای پنجره افزونه',
  Theme: 'تم',
  Dark: 'تاریک',
  Light: 'روشن',
  Linear: 'خطی',
  'MoonHunt Browser Extension': 'افزونه مرورگر MoonHunt',
  'Extension v0.1.0': 'افزونه نسخه ۰٫۱٫۰',
  'Download with MoonHunt': 'دانلود با MoonHunt',
  'Seamlessly bridge your browser downloads with the MoonHunt desktop download manager.': 'دانلودهای مرورگر خود را به‌سادگی به مدیر دانلود دسکتاپ MoonHunt متصل کنید.',
  'One-click capture': 'گرفتن با یک کلیک',
  'Intercept downloads directly and send them to MoonHunt.': 'دانلودها را مستقیم بگیرید و به MoonHunt بفرستید.',
  'Cookie sharing': 'اشتراک کوکی',
  'Share authenticated sessions for media downloads.': 'نشست‌های احراز هویت شده را برای دانلود رسانه به اشتراک بگذارید.',
  'Secure bridge between browser and desktop app.': 'پل امن بین مرورگر و برنامه دسکتاپ.',
  Language: 'زبان',
  'Open MoonHunt': 'باز کردن MoonHunt',
  Settings: 'تنظیمات',
  Active: 'فعال',
  Speed: 'سرعت',
  Done: 'انجام شد',
  Enabled: 'فعال',
  Disabled: 'غیرفعال',
  'Checking…': 'در حال بررسی…',
  Connected: 'متصل',
  Disconnected: 'قطع',
  Saved: 'ذخیره شد',
  'Connection failed': 'اتصال ناموفق بود',
  'Connected — MoonHunt v': 'متصل — MoonHunt نسخه ',
  'Copy port': 'کپی پورت',
  'Toggle visibility': 'تغییر نمایش',
  'A polished desktop download manager built for speed, structure, and a calm experience.': 'مدیر دانلود دسکتاپی حرفه‌ای که برای سرعت، نظم و تجربه‌ای آرام ساخته شده است.',
  'Built with care by': 'ساخته‌شده با دقت توسط',
}

const es: Messages = {
  'Extension Settings': 'Ajustes de la extensión',
  General: 'General',
  Appearance: 'Apariencia',
  About: 'Acerca de',
  'Save Changes': 'Guardar cambios',
  'Connection and feature settings for the MoonHunt integration': 'Ajustes de conexión y funciones para la integración con MoonHunt',
  Connection: 'Conexión',
  Host: 'Host',
  Port: 'Puerto',
  Features: 'Funciones',
  'Intercept Downloads': 'Capturar descargas',
  'Automatically capture download links from pages': 'Captura automáticamente enlaces de descarga de las páginas',
  'Cookie Sharing': 'Compartir cookies',
  'Share YouTube session cookies with the desktop app': 'Comparte cookies de sesión de YouTube con la aplicación de escritorio',
  'Test Connection': 'Probar conexión',
  'Testing…': 'Probando…',
  'Theme and accent color for the extension popup': 'Tema y color de acento para la ventana emergente',
  Theme: 'Tema',
  Dark: 'Oscuro',
  Light: 'Claro',
  Linear: 'Lineal',
  'MoonHunt Browser Extension': 'Extensión de navegador MoonHunt',
  'Extension v0.1.0': 'Extensión v0.1.0',
  'Download with MoonHunt': 'Descargar con MoonHunt',
  'Seamlessly bridge your browser downloads with the MoonHunt desktop download manager.': 'Conecta sin problemas tus descargas del navegador con el administrador de descargas de escritorio MoonHunt.',
  'One-click capture': 'Captura con un clic',
  'Intercept downloads directly and send them to MoonHunt.': 'Captura las descargas directamente y envíalas a MoonHunt.',
  'Cookie sharing': 'Compartir cookies',
  'Share authenticated sessions for media downloads.': 'Comparte sesiones autenticadas para descargas de medios.',
  'Secure bridge between browser and desktop app.': 'Puente seguro entre el navegador y la aplicación de escritorio.',
  Language: 'Idioma',
  'Open MoonHunt': 'Abrir MoonHunt',
  Settings: 'Ajustes',
  Active: 'Activas',
  Speed: 'Velocidad',
  Done: 'Hecho',
  Enabled: 'Activado',
  Disabled: 'Desactivado',
  'Checking…': 'Comprobando…',
  Connected: 'Conectado',
  Disconnected: 'Desconectado',
  Saved: 'Guardado',
  'Connection failed': 'Conexión fallida',
  'Connected — MoonHunt v': 'Conectado — MoonHunt v',
  'Copy port': 'Copiar puerto',
  'Toggle visibility': 'Cambiar visibilidad',
  'A polished desktop download manager built for speed, structure, and a calm experience.': 'Un gestor de descargas de escritorio pulido, creado para la velocidad, el orden y una experiencia tranquila.',
  'Built with care by': 'Hecho con cuidado por',
}

const pt: Messages = {
  'Extension Settings': 'Configurações da extensão',
  General: 'Geral',
  Appearance: 'Aparência',
  About: 'Sobre',
  'Save Changes': 'Salvar alterações',
  'Connection and feature settings for the MoonHunt integration': 'Configurações de conexão e recursos para a integração com MoonHunt',
  Connection: 'Conexão',
  Host: 'Host',
  Port: 'Porta',
  Features: 'Recursos',
  'Intercept Downloads': 'Capturar downloads',
  'Automatically capture download links from pages': 'Capturar automaticamente links de download das páginas',
  'Cookie Sharing': 'Compartilhamento de cookies',
  'Share YouTube session cookies with the desktop app': 'Compartilhe cookies de sessão do YouTube com o aplicativo de desktop',
  'Test Connection': 'Testar conexão',
  'Testing…': 'Testando…',
  'Theme and accent color for the extension popup': 'Tema e cor de destaque para o popup da extensão',
  Theme: 'Tema',
  Dark: 'Escuro',
  Light: 'Claro',
  Linear: 'Linear',
  Language: 'Idioma',
  'MoonHunt Browser Extension': 'Extensão para navegador MoonHunt',
  'Extension v0.1.0': 'Extensão v0.1.0',
  'Download with MoonHunt': 'Baixar com MoonHunt',
  'Seamlessly bridge your browser downloads with the MoonHunt desktop download manager.': 'Integre suas descargas do navegador com o gerenciador de downloads de desktop MoonHunt sem fricções.',
  'One-click capture': 'Captura em um clique',
  'Intercept downloads directly and send them to MoonHunt.': 'Capture downloads diretamente e envie para o MoonHunt.',
  'Cookie sharing': 'Compartilhamento de cookies',
  'Share authenticated sessions for media downloads.': 'Compartilhe sessões autenticadas para downloads de mídia.',
  'Secure bridge between browser and desktop app.': 'Ponte segura entre navegador e aplicativo desktop.',
  'Open MoonHunt': 'Abrir MoonHunt',
  Settings: 'Configurações',
  Active: 'Ativas',
  Speed: 'Velocidade',
  Done: 'Concluído',
  Enabled: 'Ativado',
  Disabled: 'Desativado',
  'Checking…': 'Verificando…',
  Connected: 'Conectado',
  Disconnected: 'Desconectado',
  Saved: 'Salvo',
  'Connection failed': 'Conexão falhou',
  'Connected — MoonHunt v': 'Conectado — MoonHunt v',
  'Copy port': 'Copiar porta',
  'Toggle visibility': 'Alternar visibilidade',
  'A polished desktop download manager built for speed, structure, and a calm experience.': 'Um gerenciador de downloads para desktop, criado para velocidade, organização e uma experiência tranquila.',
  'Built with care by': 'Feito com cuidado por',
}

const ru: Messages = {
  'Extension Settings': 'Настройки расширения',
  General: 'Общие',
  Appearance: 'Внешний вид',
  About: 'О программе',
  'Save Changes': 'Сохранить изменения',
  'Connection and feature settings for the MoonHunt integration': 'Настройки подключения и функций для интеграции с MoonHunt',
  Connection: 'Подключение',
  Host: 'Хост',
  Port: 'Порт',
  Features: 'Возможности',
  'Intercept Downloads': 'Перехватывать загрузки',
  'Automatically capture download links from pages': 'Автоматически захватывать ссылки загрузок со страниц',
  'Cookie Sharing': 'Обмен cookie',
  'Share YouTube session cookies with the desktop app': 'Делиться cookie сессии YouTube с настольным приложением',
  'Test Connection': 'Проверить подключение',
  'Testing…': 'Проверка…',
  'Theme and accent color for the extension popup': 'Тема и акцентный цвет для окна расширения',
  Theme: 'Тема',
  Dark: 'Темная',
  Light: 'Светлая',
  Linear: 'Линейная',
  Language: 'Язык',
  'MoonHunt Browser Extension': 'Расширение браузера MoonHunt',
  'Extension v0.1.0': 'Расширение v0.1.0',
  'Download with MoonHunt': 'Загрузить с MoonHunt',
  'Seamlessly bridge your browser downloads with the MoonHunt desktop download manager.': 'Легко свяжите загрузки браузера с настольным менеджером загрузок MoonHunt.',
  'One-click capture': 'Захват в один клик',
  'Intercept downloads directly and send them to MoonHunt.': 'Перехватывайте загрузки напрямую и отправляйте в MoonHunt.',
  'Cookie sharing': 'Обмен cookie',
  'Share authenticated sessions for media downloads.': 'Делитесь авторизованными сессиями для загрузки медиа.',
  'Secure bridge between browser and desktop app.': 'Безопасный мост между браузером и настольным приложением.',
  'Open MoonHunt': 'Открыть MoonHunt',
  Settings: 'Настройки',
  Active: 'Активные',
  Speed: 'Скорость',
  Done: 'Готово',
  Enabled: 'Вкл',
  Disabled: 'Выкл',
  'Checking…': 'Проверка…',
  Connected: 'Подключено',
  Disconnected: 'Отключено',
  Saved: 'Сохранено',
  'Connection failed': 'Ошибка подключения',
  'Connected — MoonHunt v': 'Подключено — MoonHunt v',
  'Copy port': 'Копировать порт',
  'Toggle visibility': 'Переключить видимость',
  'A polished desktop download manager built for speed, structure, and a calm experience.': 'Продуманный десктопный менеджер загрузок для скорости, порядка и спокойной работы.',
  'Built with care by': 'Сделано с заботой',
}

const ja: Messages = {
  'Extension Settings': '拡張機能の設定',
  General: '一般',
  Appearance: '外観',
  About: '情報',
  'Save Changes': '保存',
  'Connection and feature settings for the MoonHunt integration': 'MoonHunt連携の接続と機能の設定',
  Connection: '接続',
  Host: 'ホスト',
  Port: 'ポート',
  Features: '機能',
  'Intercept Downloads': 'ダウンロードを取得',
  'Automatically capture download links from pages': 'ページからダウンロードリンクを自動取得',
  'Cookie Sharing': 'Cookie共有',
  'Share YouTube session cookies with the desktop app': 'YouTubeセッションCookieをデスクトップアプリと共有',
  'Test Connection': '接続テスト',
  'Testing…': 'テスト中…',
  'Theme and accent color for the extension popup': '拡張機能ポップアップのテーマとアクセントカラー',
  Theme: 'テーマ',
  Dark: 'ダーク',
  Light: 'ライト',
  Linear: 'リニア',
  Language: '言語',
  'MoonHunt Browser Extension': 'MoonHunt ブラウザ拡張機能',
  'Extension v0.1.0': '拡張機能 v0.1.0',
  'Download with MoonHunt': 'MoonHuntでダウンロード',
  'Seamlessly bridge your browser downloads with the MoonHunt desktop download manager.': 'ブラウザのダウンロードをMoonHuntデスクトップのダウンロードマネージャーにシームレスに接続します。',
  'One-click capture': 'ワンクリック取得',
  'Intercept downloads directly and send them to MoonHunt.': 'ダウンロードを直接取得してMoonHuntに送信します。',
  'Cookie sharing': 'Cookie共有',
  'Share authenticated sessions for media downloads.': 'メディアダウンロード用に認証済みセッションを共有します。',
  'Secure bridge between browser and desktop app.': 'ブラウザとデスクトップアプリ間の安全なブリッジ。',
  'Open MoonHunt': 'MoonHuntを開く',
  Active: 'アクティブ',
  Done: '完了',
  Enabled: '有効',
  Disabled: '無効',
  Saved: '保存しました',
  Connected: '接続済み',
  Disconnected: '未接続',
  'Checking…': '確認中…',
  Settings: '設定',
  Speed: '速度',
  'Connection failed': '接続に失敗しました',
  'Connected — MoonHunt v': '接続済み — MoonHunt v',
  'Copy port': 'ポートをコピー',
  'Toggle visibility': '表示の切り替え',
  'A polished desktop download manager built for speed, structure, and a calm experience.': 'スピード、整理、そして落ち着いた体験のために作られた洗練されたデスクトップダウンロードマネージャー。',
  'Built with care by': '丁寧に作られました',
}

const zh: Messages = {
  'Extension Settings': '扩展设置',
  General: '常规',
  Appearance: '外观',
  About: '关于',
  'Save Changes': '保存更改',
  'Connection and feature settings for the MoonHunt integration': 'MoonHunt 集成的连接和功能设置',
  Connection: '连接',
  Host: '主机',
  Port: '端口',
  Features: '功能',
  'Intercept Downloads': '拦截下载',
  'Automatically capture download links from pages': '自动从页面捕获下载链接',
  'Cookie Sharing': 'Cookie 共享',
  'Share YouTube session cookies with the desktop app': '与桌面应用共享 YouTube 会话 Cookie',
  'Test Connection': '测试连接',
  'Testing…': '测试中…',
  'Theme and accent color for the extension popup': '扩展弹窗的主题和强调色',
  Theme: '主题',
  Dark: '深色',
  Light: '浅色',
  Linear: '线性',
  Language: '语言',
  'MoonHunt Browser Extension': 'MoonHunt 浏览器扩展',
  'Extension v0.1.0': '扩展 v0.1.0',
  'Download with MoonHunt': '使用 MoonHunt 下载',
  'Seamlessly bridge your browser downloads with the MoonHunt desktop download manager.': '将浏览器下载与 MoonHunt 桌面下载管理器无缝连接。',
  'One-click capture': '一键捕获',
  'Intercept downloads directly and send them to MoonHunt.': '直接拦截下载并发送到 MoonHunt。',
  'Cookie sharing': 'Cookie 共享',
  'Share authenticated sessions for media downloads.': '共享经过身份验证的会话，用于媒体下载。',
  'Secure bridge between browser and desktop app.': '浏览器与桌面应用之间的安全桥梁。',
  'Open MoonHunt': '打开 MoonHunt',
  Settings: '设置',
  Active: '活动',
  Speed: '速度',
  Done: '完成',
  Enabled: '已启用',
  Disabled: '已禁用',
  'Checking…': '检查中…',
  Connected: '已连接',
  Disconnected: '未连接',
  Saved: '已保存',
  'Connection failed': '连接失败',
  'Connected — MoonHunt v': '已连接 — MoonHunt v',
  'Copy port': '复制端口',
  'Toggle visibility': '切换可见性',
  'A polished desktop download manager built for speed, structure, and a calm experience.': '一款为速度、秩序和安静体验而打造的精致桌面下载管理器。',
  'Built with care by': '由…精心打造',
}

const ar: Messages = {
  'Extension Settings': 'إعدادات الإضافة',
  General: 'عام',
  Appearance: 'المظهر',
  About: 'حول',
  'Save Changes': 'حفظ التغييرات',
  'Connection and feature settings for the MoonHunt integration': 'إعدادات الاتصال والميزات لتكامل MoonHunt',
  Connection: 'الاتصال',
  Host: 'المضيف',
  Port: 'المنفذ',
  Features: 'الميزات',
  'Intercept Downloads': 'التقاط التنزيلات',
  'Automatically capture download links from pages': 'التقط روابط التنزيل تلقائيًا من الصفحات',
  'Cookie Sharing': 'مشاركة الكوكيز',
  'Share YouTube session cookies with the desktop app': 'شارك كوكيز جلسة يوتيوب مع تطبيق سطح المكتب',
  'Test Connection': 'اختبار الاتصال',
  'Testing…': 'جارٍ الاختبار…',
  'Theme and accent color for the extension popup': 'السمة ولون التمييز لنافذة الإضافة',
  Theme: 'السمة',
  Dark: 'داكن',
  Light: 'فاتح',
  Linear: 'خطي',
  Language: 'اللغة',
  'MoonHunt Browser Extension': 'إضافة متصفح MoonHunt',
  'Extension v0.1.0': 'الإضافة v0.1.0',
  'Download with MoonHunt': 'تنزيل باستخدام MoonHunt',
  'Seamlessly bridge your browser downloads with the MoonHunt desktop download manager.': 'اربط تنزيلات متصفحك بسلاسة مع مدير تنزيلات سطح المكتب MoonHunt.',
  'One-click capture': 'التقاط بنقرة واحدة',
  'Intercept downloads directly and send them to MoonHunt.': 'التقط التنزيلات مباشرة وأرسلها إلى MoonHunt.',
  'Cookie sharing': 'مشاركة الكوكيز',
  'Share authenticated sessions for media downloads.': 'شارك الجلسات الموثّقة لتنزيل الوسائط.',
  'Secure bridge between browser and desktop app.': 'جسر آمن بين المتصفح وتطبيق سطح المكتب.',
  'Open MoonHunt': 'فتح MoonHunt',
  Settings: 'الإعدادات',
  Active: 'نشط',
  Speed: 'السرعة',
  Done: 'تم',
  Enabled: 'مفعّل',
  Disabled: 'معطّل',
  'Checking…': 'جارٍ الفحص…',
  Connected: 'متصل',
  Disconnected: 'غير متصل',
  Saved: 'تم الحفظ',
  'Connection failed': 'فشل الاتصال',
  'Connected — MoonHunt v': 'متصل — MoonHunt v',
  'Copy port': 'نسخ المنفذ',
  'Toggle visibility': 'تبديل الإظهار',
  'A polished desktop download manager built for speed, structure, and a calm experience.': 'مدير تنزيلات سطح مكتب متقن صُمم للسرعة والتنظيم وتجربة هادئة.',
  'Built with care by': 'صُنع بعناية بواسطة',
}

const messages: Record<ExtensionLocaleCode, Messages> = { en, fa, es, pt, ru, ja, zh, ar }

let currentLocale: ExtensionLocaleCode = 'en'

export function normalizeExtensionLocale(value: string | null | undefined): ExtensionLocaleCode {
  return EXTENSION_LOCALES.some((l) => l.code === value) ? (value as ExtensionLocaleCode) : 'en'
}

export function getExtensionLocale(): ExtensionLocaleCode {
  return currentLocale
}

export function t(key: string): string {
  return messages[currentLocale]?.[key] ?? key
}

export function loadExtensionLocale(): Promise<ExtensionLocaleCode> {
  return new Promise((resolve) => {
    chrome.storage.sync.get({ language: 'en' }, (items: Record<string, unknown>) => {
      currentLocale = normalizeExtensionLocale(String(items.language ?? 'en'))
      resolve(currentLocale)
    })
  })
}

export function applyExtensionLocale(root: Document | HTMLElement = document) {
  document.documentElement.lang = currentLocale
  document.documentElement.dir = 'ltr'
  root.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    setTranslatedText(el, t(el.dataset.i18n || ''))
  })
  root.querySelectorAll<HTMLInputElement>('[data-i18n-placeholder]').forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder || '')
  })
  root.querySelectorAll<HTMLElement>('[data-i18n-title]').forEach((el) => {
    el.title = t(el.dataset.i18nTitle || '')
  })
}

function setTranslatedText(el: HTMLElement, text: string) {
  let replaced = false
  for (const child of Array.from(el.childNodes)) {
    if (child.nodeType !== Node.TEXT_NODE) continue
    const value = (child.textContent || '').trim()
    if (value) {
      child.textContent = text
      replaced = true
    } else if (replaced) {
      child.textContent = ''
    }
  }
  if (replaced) return

  // No direct text node (for example, a label composed entirely of nested spans);
  // fall back to the first text node in the tree so icons stay intact where present.
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  const first = walker.nextNode() as Text | null
  if (first) first.textContent = text
  else el.textContent = text
}

export function setExtensionLocale(code: ExtensionLocaleCode) {
  currentLocale = normalizeExtensionLocale(code)
  chrome.storage.sync.set({ language: currentLocale })
  applyExtensionLocale()
}

/** Apply a locale to the UI without persisting it (staged until Save). */
export function applyExtensionLocaleOnly(code: ExtensionLocaleCode) {
  currentLocale = normalizeExtensionLocale(code)
  applyExtensionLocale()
}
