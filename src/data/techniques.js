// ─────────────────────────────────────────────────────────────
// Контент техник — всё что видит пользователь на странице техники.
// Ключ: латинское название техники (совпадает с ключом TECHNIQUE_VIDEOS).
// Редактируется через AdminPanel → Иккаджо.
// ─────────────────────────────────────────────────────────────
export const TECHNIQUE_CONTENT = {
  'Ippondori': {
    description: 'Иппондори — первая и фундаментальная техника раздела Татиай. Контроль запястья с одновременным выводом из равновесия.',
    principles: [
      'Движение начинается от бёдер — руки лишь направляют усилие.',
      'Сохраняйте низкий центр тяжести на протяжении всей техники.',
      'Непрерывный контакт с укэ — не допускайте разрыва.',
      'Входите в технику через расслабление, а не через силу.',
    ],
    mistakes: [
      { title: 'Тянуть руками',    desc: 'Попытка выполнить технику силой рук вместо всего тела приводит к потере контроля.' },
      { title: 'Потеря оси',       desc: 'Нарушение вертикальной оси в момент входа разрушает структуру и контроль.' },
      { title: 'Разрыв контакта',  desc: 'Любой разрыв даёт укэ возможность освободиться или контратаковать.' },
    ],
    senseiQuote: 'Иппондори — не техника захвата, это техника единения. Цель не зафиксировать руку, а управлять центром тяжести укэ через эту руку.',
  },
  'Kurumadaoshi': {
    description: 'Курумадаоси — техника переворота через круговое движение. Используется круговая траектория для создания неустойчивости.',
    principles: [
      'Вращение происходит вокруг оси тела укэ, а не вашей.',
      'Скорость важнее силы — плавное круговое ускорение.',
      'Точка приложения усилия — кисть и локоть одновременно.',
    ],
    mistakes: [
      { title: 'Линейное давление', desc: 'Попытка толкнуть по прямой вместо кругового движения — техника не работает.' },
      { title: 'Слишком высокий захват', desc: 'Захват выше локтя теряет рычаг и контроль.' },
    ],
    senseiQuote: 'Курумадаоси буквально означает «переворот колеса». Вы не опрокидываете человека — вы становитесь осью его падения.',
  },
  'Gyakuudedori': {
    description: 'Гьякудэдори — работа с захватом руки снаружи. Принцип движения отличается от прямого захвата за счёт другого угла воздействия.',
    principles: [
      'Обратный захват требует смещения на 45° от линии атаки.',
      'Управляйте локтевым суставом, не только запястьем.',
      'Вход должен быть одновременным с захватом, не после.',
    ],
    mistakes: [
      { title: 'Задержка входа', desc: 'Вход после захвата вместо одновременного — теряется момент.' },
      { title: 'Игнорирование локтя', desc: 'Работа только с запястьем без контроля локтя — неполная фиксация.' },
    ],
    senseiQuote: 'В Гьякудэдори важно понять: обратный захват меняет всё. Угол, движение, точку воздействия. Изучите это досконально.',
  },
  'Koshiguruma': {
    description: 'Косигурума — бросок через бедро с круговым движением. Использует бёдра как ось вращения.',
    principles: [
      'Бёдра должны войти ниже центра тяжести укэ.',
      'Контакт спиной и поясницей — ключ к броску.',
      'Бросок происходит за счёт разгибания ног, не рук.',
    ],
    mistakes: [
      { title: 'Высокий вход', desc: 'Вход бёдрами выше центра тяжести укэ делает бросок невозможным.' },
      { title: 'Бросок руками', desc: 'Попытка бросить через руки — потеря структуры и силы.' },
    ],
    senseiQuote: 'Косигурума требует полного доверия — войти спиной к укэ. Только это доверие открывает технику.',
  },
  'Karaminage': {
    description: 'Караминагэ — бросок запутыванием. Используется запутывание руки укэ для создания болевого контроля и броска.',
    principles: [
      'Запутывание происходит мягко, без резких рывков.',
      'Направление — по естественной траектории сустава.',
      'Контролируйте всю руку от плеча до кисти.',
    ],
    mistakes: [
      { title: 'Грубое запутывание', desc: 'Резкое движение вместо мягкого ведения — укэ чувствует сопротивление.' },
      { title: 'Потеря плеча', desc: 'Контроль только кисти без плеча — неполная фиксация.' },
    ],
    senseiQuote: 'Карами — паутина, а не капкан. Укэ должен войти в неё сам, движимый инерцией своей атаки.',
  },
  'Uraotoshi': {
    description: 'Ураотоси — бросок с подножкой сзади. Сочетает выведение из равновесия и подбив опорной ноги.',
    principles: [
      'Выведение из равновесия предшествует подножке.',
      'Подбив происходит в момент максимальной нагрузки на ногу.',
      'Направление броска — назад и вниз, не вверх.',
    ],
    mistakes: [
      { title: 'Подножка без вывода', desc: 'Подножка без предварительного вывода из равновесия — нет эффекта.' },
      { title: 'Неверный момент', desc: 'Подбив в момент когда нога не нагружена — укэ легко переставит ногу.' },
    ],
    senseiQuote: 'Ураотоси — это не подножка. Это момент когда вы становитесь опорой, которую убираете.',
  },
  'Shihonage': {
    description: 'Сихонагэ — бросок в четыре стороны. Одна из самых важных техник, применимая в любом направлении.',
    principles: [
      'Рука укэ ведётся по дуге над его головой.',
      'Разворот выполняется под рукой, не через неё.',
      'Финальный контроль — давление на лучезапястный сустав вниз.',
    ],
    mistakes: [
      { title: 'Прямая траектория', desc: 'Попытка вести руку по прямой вместо дуги — техника не работает.' },
      { title: 'Разворот через руку', desc: 'Разворот поверх захваченной руки вместо под ней — потеря контроля.' },
      { title: 'Слабый финал', desc: 'Недостаточное давление в финальной фазе — укэ может выйти.' },
    ],
    senseiQuote: 'Сихонагэ — техника на все случаи жизни. Мастер айкидзюдзюцу должен выполнять её в любую сторону, не думая.',
  },
  'Kotegaeshi': {
    description: 'Котэгаэси — выворот запястья. Болевое воздействие на лучезапястный сустав с одновременным броском.',
    principles: [
      'Захват кисти должен быть мягким, но точным.',
      'Выворот происходит по оси предплечья укэ.',
      'Бросок следует немедленно за болевым воздействием.',
    ],
    mistakes: [
      { title: 'Захват пальцами', desc: 'Сильный захват пальцами вместо ладонного — потеря чувствительности.' },
      { title: 'Задержка броска', desc: 'Пауза между выворотом и броском — укэ успевает адаптироваться.' },
    ],
    senseiQuote: 'Котэгаэси — не ломающая техника. Цель — создать болевое ощущение достаточное для броска, не больше.',
  },
  'Obiotoshi': {
    description: 'Обиотоси — сброс через захват пояса. Использует захват пояса или одежды для броска через бедро.',
    principles: [
      'Захват пояса — у позвоночника, не сбоку.',
      'Тяга — вниз и по дуге, не прямолинейно.',
      'Вход близко к укэ, тело к телу.',
    ],
    mistakes: [
      { title: 'Дальний вход', desc: 'Вход на расстоянии от укэ — потеря рычага и контроля.' },
      { title: 'Тяга вверх', desc: 'Тянуть пояс вверх вместо дуги вниз — укэ сохраняет равновесие.' },
    ],
    senseiQuote: 'В Обиотоси нет ничего сложного — только расстояние и направление. Войдите вплотную и ведите вниз.',
  },
  'Hijigaeshi': {
    description: 'Хидзигаэси — выворот локтя. Болевое воздействие на локтевой сустав, применяется из положения сидя.',
    principles: [
      'Локтевой сустав работает строго по своей оси.',
      'Воздействие мягкое, но непрерывное.',
      'Контроль плеча обязателен для полной фиксации.',
    ],
    mistakes: [
      { title: 'Воздействие не по оси', desc: 'Скручивание локтя не по анатомической оси — риск травмы и потеря контроля.' },
      { title: 'Нет контроля плеча', desc: 'Без фиксации плеча укэ может освободить локоть через плечо.' },
    ],
    senseiQuote: 'Хидзигаэси из положения идори — проверка точности. Без точности ни сила ни скорость не помогут.',
  },
};

export const DB_SECTIONS = [
  { id:'ikkajo',  label:'Иккаджо',  kanji:'一', sublabel:'Программа 6–1 кю',       desc:'Базовые техники контроля. Программа ученических степеней от 6 кю до 1 кю.', price:'2 900 ₽', requiredLevel:'6kyu', techniques:30 },
  { id:'nikkajo', label:'Никаджо',  kanji:'二', sublabel:'Программа 1 дан → 2 дан', desc:'Техники болевого контроля запястья. Подготовка ко второму дану.',            price:'2 900 ₽', requiredLevel:'1dan',  techniques:28 },
  { id:'sankajo', label:'Санкаджо', kanji:'三', sublabel:'Программа 2 дан → 3 дан', desc:'Техники скручивания. Подготовка к третьему дану.',                           price:'2 900 ₽', requiredLevel:'2dan',  techniques:25 },
];

// Единый пул видео — ключ: латинское имя техники
// В реальном проекте videoUrl заменяется на реальную ссылку (Mux, Supabase Storage и т.д.)
export const TECHNIQUE_VIDEOS = {
  'Ippondori': [
    { id:'ip1', title:'Иппондори — Общий вид',                  duration:'4:12', category:'overview',   videoUrl:'' },
    { id:'ip2', title:'Иппондори — Ура-хэнка',                  duration:'3:40', category:'overview',   videoUrl:'' },
    { id:'ip3', title:'Иппондори — Работа рук и захват',        duration:'3:20', category:'details',    videoUrl:'' },
    { id:'ip4', title:'Иппондори — Позиция корпуса',            duration:'2:55', category:'details',    videoUrl:'' },
    { id:'ip5', title:'Иппондори — Управление балансом укэ',    duration:'3:40', category:'details',    videoUrl:'' },
    { id:'ip6', title:'Иппондори — Ошибки при захвате',         duration:'2:30', category:'mistakes',   videoUrl:'' },
    { id:'ip7', title:'Иппондори — Ошибки в движении',          duration:'2:10', category:'mistakes',   videoUrl:'' },
    { id:'ip8', title:'Иппондори — Вариация при сопротивлении', duration:'4:15', category:'variations', videoUrl:'' },
    { id:'ip9', title:'Иппондори — Применение в рандори',       duration:'3:50', category:'variations', videoUrl:'' },
  ],
  'Kurumadaoshi': [
    { id:'ku1', title:'Курумадаоси — Общий вид',        duration:'3:55', category:'overview',   videoUrl:'' },
    { id:'ku2', title:'Курумадаоси — Базовая форма',    duration:'2:48', category:'overview',   videoUrl:'' },
    { id:'ku3', title:'Курумадаоси — Работа рук',       duration:'3:10', category:'details',    videoUrl:'' },
    { id:'ku4', title:'Курумадаоси — Вращение корпуса', duration:'2:50', category:'details',    videoUrl:'' },
    { id:'ku5', title:'Курумадаоси — Ошибки',           duration:'2:20', category:'mistakes',   videoUrl:'' },
    { id:'ku6', title:'Курумадаоси — Вариации',         duration:'3:30', category:'variations', videoUrl:'' },
  ],
  'Gyakuudedori': [
    { id:'gy1', title:'Гьякудэдори — Общий вид',       duration:'3:30', category:'overview',   videoUrl:'' },
    { id:'gy2', title:'Гьякудэдори — Разбор захвата',  duration:'3:10', category:'overview',   videoUrl:'' },
    { id:'gy3', title:'Гьякудэдори — Детальный разбор',duration:'3:00', category:'details',    videoUrl:'' },
    { id:'gy4', title:'Гьякудэдори — Ошибки',          duration:'2:15', category:'mistakes',   videoUrl:'' },
    { id:'gy5', title:'Гьякудэдори — Вариации',        duration:'3:40', category:'variations', videoUrl:'' },
  ],
  'Koshiguruma': [
    { id:'ko1', title:'Косигурума — Общий вид',    duration:'4:05', category:'overview',   videoUrl:'' },
    { id:'ko2', title:'Косигурума — Вход и захват',duration:'3:22', category:'overview',   videoUrl:'' },
    { id:'ko3', title:'Косигурума — Работа бёдер', duration:'3:45', category:'details',    videoUrl:'' },
    { id:'ko4', title:'Косигурума — Ошибки',       duration:'2:30', category:'mistakes',   videoUrl:'' },
    { id:'ko5', title:'Косигурума — Вариации',     duration:'3:55', category:'variations', videoUrl:'' },
  ],
  'Karaminage': [
    { id:'ka1', title:'Караминагэ — Общий вид',   duration:'4:50', category:'overview',   videoUrl:'' },
    { id:'ka2', title:'Караминагэ — Запутывание', duration:'3:15', category:'overview',   videoUrl:'' },
    { id:'ka3', title:'Караминагэ — Детали',      duration:'3:30', category:'details',    videoUrl:'' },
    { id:'ka4', title:'Караминагэ — Ошибки',      duration:'2:20', category:'mistakes',   videoUrl:'' },
    { id:'ka5', title:'Караминагэ — Вариации',    duration:'4:00', category:'variations', videoUrl:'' },
  ],
  'Uraotoshi': [
    { id:'ur1', title:'Ураотоси — Базовая форма',     duration:'5:30', category:'overview',   videoUrl:'' },
    { id:'ur2', title:'Ураотоси — Ура-хэнка',         duration:'3:45', category:'overview',   videoUrl:'' },
    { id:'ur3', title:'Ураотоси — Работа ног',        duration:'3:20', category:'details',    videoUrl:'' },
    { id:'ur4', title:'Ураотоси — Ошибки при подножке',duration:'2:40',category:'mistakes',   videoUrl:'' },
    { id:'ur5', title:'Ураотоси — Вариации',          duration:'4:10', category:'variations', videoUrl:'' },
  ],
  'Obiotoshi': [
    { id:'ob1', title:'Обиотоси — Общий вид',    duration:'3:50', category:'overview',   videoUrl:'' },
    { id:'ob2', title:'Обиотоси — Захват пояса', duration:'3:00', category:'details',    videoUrl:'' },
    { id:'ob3', title:'Обиотоси — Ошибки',       duration:'2:10', category:'mistakes',   videoUrl:'' },
    { id:'ob4', title:'Обиотоси — Вариации',     duration:'3:20', category:'variations', videoUrl:'' },
  ],
  'Kirikaeshi': [
    { id:'ki1', title:'Кирикаэси — Общий вид',          duration:'4:20', category:'overview',   videoUrl:'' },
    { id:'ki2', title:'Кирикаэси — Возвратное движение', duration:'3:10', category:'details',    videoUrl:'' },
    { id:'ki3', title:'Кирикаэси — Ошибки',             duration:'2:00', category:'mistakes',   videoUrl:'' },
    { id:'ki4', title:'Кирикаэси — Вариации',           duration:'3:30', category:'variations', videoUrl:'' },
  ],
  'Kotegaeshi': [
    { id:'kt1', title:'Котэгаэси — Общий вид',          duration:'4:10', category:'overview',   videoUrl:'' },
    { id:'kt2', title:'Котэгаэси — Выворот запястья',   duration:'3:25', category:'details',    videoUrl:'' },
    { id:'kt3', title:'Котэгаэси — Ошибки при захвате', duration:'2:30', category:'mistakes',   videoUrl:'' },
    { id:'kt4', title:'Котэгаэси — Вариации',           duration:'3:50', category:'variations', videoUrl:'' },
  ],
  'Shihonage': [
    { id:'sh1', title:'Сихонагэ — Базовая форма',   duration:'6:00', category:'overview',   videoUrl:'' },
    { id:'sh2', title:'Сихонагэ — Ура-хэнка',       duration:'4:30', category:'overview',   videoUrl:'' },
    { id:'sh3', title:'Сихонагэ — Вход и разворот', duration:'3:50', category:'details',    videoUrl:'' },
    { id:'sh4', title:'Сихонагэ — Ошибки',          duration:'2:45', category:'mistakes',   videoUrl:'' },
    { id:'sh5', title:'Сихонагэ — Вариации',        duration:'4:20', category:'variations', videoUrl:'' },
  ],
  'Hijigaeshi': [
    { id:'hi1', title:'Хидзигаэси — Общий вид',    duration:'3:55', category:'overview',   videoUrl:'' },
    { id:'hi2', title:'Хидзигаэси — Выворот локтя',duration:'3:10', category:'details',    videoUrl:'' },
    { id:'hi3', title:'Хидзигаэси — Ошибки',       duration:'2:15', category:'mistakes',   videoUrl:'' },
    { id:'hi4', title:'Хидзигаэси — Вариации',     duration:'3:30', category:'variations', videoUrl:'' },
  ],
  'Shimekaeshi': [
    { id:'sm1', title:'Симэкаэси — Общий вид', duration:'3:30', category:'overview', videoUrl:'' },
    { id:'sm2', title:'Симэкаэси — Детали',    duration:'2:50', category:'details',  videoUrl:'' },
    { id:'sm3', title:'Симэкаэси — Ошибки',    duration:'2:00', category:'mistakes', videoUrl:'' },
  ],
  'Dakijime': [
    { id:'da1', title:'Дакидзимэ — Общий вид', duration:'3:45', category:'overview',   videoUrl:'' },
    { id:'da2', title:'Дакидзимэ — Захват',    duration:'3:00', category:'details',    videoUrl:'' },
    { id:'da3', title:'Дакидзимэ — Ошибки',    duration:'2:10', category:'mistakes',   videoUrl:'' },
    { id:'da4', title:'Дакидзимэ — Вариации',  duration:'3:20', category:'variations', videoUrl:'' },
  ],
  'Nukitedori': [
    { id:'nu1', title:'Нукитэдори — Общий вид',    duration:'3:15', category:'overview', videoUrl:'' },
    { id:'nu2', title:'Нукитэдори — Освобождение', duration:'2:40', category:'details',  videoUrl:'' },
    { id:'nu3', title:'Нукитэдори — Ошибки',       duration:'2:00', category:'mistakes', videoUrl:'' },
  ],
  'Hizajime': [
    { id:'hz1', title:'Хидзадзимэ — Общий вид',         duration:'3:25', category:'overview', videoUrl:'' },
    { id:'hz2', title:'Хидзадзимэ — Болевой на колено', duration:'2:55', category:'details',  videoUrl:'' },
    { id:'hz3', title:'Хидзадзимэ — Ошибки',            duration:'1:50', category:'mistakes', videoUrl:'' },
  ],
  'Tateeridori': [
    { id:'ta1', title:'Татээридори — Общий вид',           duration:'4:30', category:'overview',   videoUrl:'' },
    { id:'ta2', title:'Татээридори — Захват за воротник',  duration:'3:20', category:'details',    videoUrl:'' },
    { id:'ta3', title:'Татээридори — Ошибки',              duration:'2:20', category:'mistakes',   videoUrl:'' },
    { id:'ta4', title:'Татээридори — Вариации',            duration:'3:40', category:'variations', videoUrl:'' },
  ],
  'Ryokatahineri': [
    { id:'rk1', title:'Рёкатахинэри — Общий вид',        duration:'4:15', category:'overview', videoUrl:'' },
    { id:'rk2', title:'Рёкатахинэри — Скручивание плеч', duration:'3:30', category:'details',  videoUrl:'' },
    { id:'rk3', title:'Рёкатахинэри — Ошибки',           duration:'2:15', category:'mistakes', videoUrl:'' },
  ],
  'Ryohijigaeshi': [
    { id:'rh1', title:'Рёхидзигаэси — Общий вид',       duration:'3:50', category:'overview', videoUrl:'' },
    { id:'rh2', title:'Рёхидзигаэси — Выворот локтей',  duration:'3:10', category:'details',  videoUrl:'' },
    { id:'rh3', title:'Рёхидзигаэси — Ошибки',          duration:'2:00', category:'mistakes', videoUrl:'' },
  ],
  'Dakijimedori': [
    { id:'dd1', title:'Дакидзимэдори — Общий вид',   duration:'4:00', category:'overview',   videoUrl:'' },
    { id:'dd2', title:'Дакидзимэдори — Освобождение',duration:'3:15', category:'details',    videoUrl:'' },
    { id:'dd3', title:'Дакидзимэдори — Ошибки',      duration:'2:10', category:'mistakes',   videoUrl:'' },
    { id:'dd4', title:'Дакидзимэдори — Вариации',    duration:'3:30', category:'variations', videoUrl:'' },
  ],
  'Kataotoshi': [
    { id:'kto1', title:'Катаотоси — Общий вид',        duration:'3:45', category:'overview',   videoUrl:'' },
    { id:'kto2', title:'Катаотоси — Сброс через плечо',duration:'3:00', category:'details',    videoUrl:'' },
    { id:'kto3', title:'Катаотоси — Ошибки',           duration:'2:00', category:'mistakes',   videoUrl:'' },
    { id:'kto4', title:'Катаотоси — Вариации',         duration:'3:20', category:'variations', videoUrl:'' },
  ],
  'Hanminage': [
    { id:'hm1', title:'Ханминагэ — Общий вид',              duration:'4:40', category:'overview',   videoUrl:'' },
    { id:'hm2', title:'Ханминагэ — Бросок из полустойки',   duration:'3:30', category:'details',    videoUrl:'' },
    { id:'hm3', title:'Ханминагэ — Ошибки',                 duration:'2:20', category:'mistakes',   videoUrl:'' },
    { id:'hm4', title:'Ханминагэ — Вариации',               duration:'3:50', category:'variations', videoUrl:'' },
  ],
  'Izori': [
    { id:'iz1', title:'Изори — Общий вид',        duration:'3:30', category:'overview', videoUrl:'' },
    { id:'iz2', title:'Изори — Техника скольжения',duration:'2:50', category:'details',  videoUrl:'' },
    { id:'iz3', title:'Изори — Ошибки',           duration:'1:55', category:'mistakes', videoUrl:'' },
  ],
  'Iriminage': [
    { id:'ir1', title:'Ириминагэ — Общий вид',    duration:'4:20', category:'overview',   videoUrl:'' },
    { id:'ir2', title:'Ириминагэ — Вход и бросок',duration:'3:40', category:'details',    videoUrl:'' },
    { id:'ir3', title:'Ириминагэ — Ошибки',       duration:'2:30', category:'mistakes',   videoUrl:'' },
    { id:'ir4', title:'Ириминагэ — Вариации',     duration:'4:00', category:'variations', videoUrl:'' },
  ],
};

export const VIDEO_CATS = [
  { id:'overview',   label:'Общий вид',       icon:'▶', color:'#1a1a1a' },
  { id:'details',    label:'Детальный разбор', icon:'◎', color:'#3060b0' },
  { id:'mistakes',   label:'Типичные ошибки',  icon:'✕', color:'#b04030' },
  { id:'variations', label:'Вариации',         icon:'⟳', color:'#8B6914' },
];

export const KYU_DATA = [
  {
    id:'6kyu', label:'6 кю', kanji:'六', belt:'6kyu',
    sections:[{
      id:'tachiai', name:'Tachiai', nameRu:'Татиай', subtitle:'Стоя лицом друг к другу',
      techniques:[
        {id:'6-1',name:'Ippondori',    nameRu:'Иппондори'},
        {id:'6-2',name:'Kurumadaoshi', nameRu:'Курумадаоси'},
        {id:'6-3',name:'Gyakuudedori', nameRu:'Гьякудэдори'},
      ]
    }]
  },
  {
    id:'5kyu', label:'5 кю', kanji:'五', belt:'5kyu',
    sections:[{
      id:'tachiai', name:'Tachiai', nameRu:'Татиай', subtitle:'Стоя лицом друг к другу',
      techniques:[
        {id:'5-1',name:'Ippondori',    nameRu:'Иппондори'},
        {id:'5-2',name:'Kurumadaoshi', nameRu:'Курумадаоси'},
        {id:'5-3',name:'Gyakuudedori', nameRu:'Гьякудэдори'},
        {id:'5-4',name:'Koshiguruma',  nameRu:'Косигурума'},
        {id:'5-5',name:'Karaminage',   nameRu:'Караминагэ'},
      ]
    }]
  },
  {
    id:'4kyu', label:'4 кю', kanji:'四', belt:'4kyu',
    note:'Техники 5 кю плюс:',
    sections:[{
      id:'tachiai', name:'Tachiai', nameRu:'Татиай', subtitle:'Стоя лицом друг к другу',
      techniques:[
        {id:'4-1',name:'Ippondori',    nameRu:'Иппондори'},
        {id:'4-2',name:'Kurumadaoshi', nameRu:'Курумадаоси'},
        {id:'4-3',name:'Gyakuudedori', nameRu:'Гьякудэдори'},
        {id:'4-4',name:'Koshiguruma',  nameRu:'Косигурума'},
        {id:'4-5',name:'Karaminage',   nameRu:'Караминагэ'},
        {id:'4-6',name:'Uraotoshi',    nameRu:'Ураотоси'},
        {id:'4-7',name:'Obiotoshi',    nameRu:'Обиотоси'},
        {id:'4-8',name:'Kirikaeshi',   nameRu:'Кирикаэси'},
        {id:'4-9',name:'Kotegaeshi',   nameRu:'Котэгаэси'},
        {id:'4-10',name:'Shihonage',   nameRu:'Сихонагэ'},
      ]
    }]
  },
  {
    id:'3kyu', label:'3 кю', kanji:'三', belt:'3kyu',
    note:'Техники 4 кю плюс раздел Идори:',
    sections:[
      {
        id:'tachiai', name:'Tachiai', nameRu:'Татиай', subtitle:'Стоя лицом друг к другу',
        techniques:[
          {id:'3-t1',name:'Ippondori',    nameRu:'Иппондори'},
          {id:'3-t2',name:'Kurumadaoshi', nameRu:'Курумадаоси'},
          {id:'3-t3',name:'Gyakuudedori', nameRu:'Гьякудэдори'},
          {id:'3-t4',name:'Koshiguruma',  nameRu:'Косигурума'},
          {id:'3-t5',name:'Karaminage',   nameRu:'Караминагэ'},
          {id:'3-t6',name:'Uraotoshi',    nameRu:'Ураотоси'},
          {id:'3-t7',name:'Obiotoshi',    nameRu:'Обиотоси'},
          {id:'3-t8',name:'Kirikaeshi',   nameRu:'Кирикаэси'},
          {id:'3-t9',name:'Kotegaeshi',   nameRu:'Котэгаэси'},
          {id:'3-t10',name:'Shihonage',   nameRu:'Сихонагэ'},
        ]
      },
      {
        id:'idori', name:'Idori', nameRu:'Идори', subtitle:'Из положения сидя на коленях',
        techniques:[
          {id:'3-i1',name:'Ippondori',    nameRu:'Иппондори'},
          {id:'3-i2',name:'Gyakuudedori', nameRu:'Гьякуудэдори'},
          {id:'3-i3',name:'Hijigaeshi',   nameRu:'Хидзигаэси'},
          {id:'3-i4',name:'Kurumadaoshi', nameRu:'Курумадаоси'},
          {id:'3-i5',name:'Shimekaeshi',  nameRu:'Симэкаэси'},
          {id:'3-i6',name:'Dakijime',     nameRu:'Дакидзимэ'},
          {id:'3-i7',name:'Karaminage',   nameRu:'Караминагэ'},
          {id:'3-i8',name:'Kotegaeshi',   nameRu:'Котэгаэси'},
          {id:'3-i9',name:'Nukitedori',   nameRu:'Нукитэдори'},
          {id:'3-i10',name:'Hizajime',    nameRu:'Хидзадзимэ'},
        ]
      },
    ]
  },
  {
    id:'2kyu', label:'2 кю', kanji:'二', belt:'2kyu',
    note:'Техники 3 кю плюс раздел Усиродори:',
    sections:[
      {
        id:'tachiai', name:'Tachiai', nameRu:'Татиай', subtitle:'Стоя лицом друг к другу',
        techniques:[
          {id:'2-t1',name:'Ippondori',    nameRu:'Иппондори'},
          {id:'2-t2',name:'Kurumadaoshi', nameRu:'Курумадаоси'},
          {id:'2-t3',name:'Gyakuudedori', nameRu:'Гьякудэдори'},
          {id:'2-t4',name:'Koshiguruma',  nameRu:'Косигурума'},
          {id:'2-t5',name:'Karaminage',   nameRu:'Караминагэ'},
          {id:'2-t6',name:'Uraotoshi',    nameRu:'Ураотоси'},
          {id:'2-t7',name:'Obiotoshi',    nameRu:'Обиотоси'},
          {id:'2-t8',name:'Kirikaeshi',   nameRu:'Кирикаэси'},
          {id:'2-t9',name:'Kotegaeshi',   nameRu:'Котэгаэси'},
          {id:'2-t10',name:'Shihonage',   nameRu:'Сихонагэ'},
        ]
      },
      {
        id:'idori', name:'Idori', nameRu:'Идори', subtitle:'Сидя на коленях',
        techniques:[
          {id:'2-i1',name:'Ippondori',    nameRu:'Иппондори'},
          {id:'2-i2',name:'Gyakuudedori', nameRu:'Гьякуудэдори'},
          {id:'2-i3',name:'Hijigaeshi',   nameRu:'Хидзигаэси'},
          {id:'2-i4',name:'Kurumadaoshi', nameRu:'Курумадаоси'},
          {id:'2-i5',name:'Shimekaeshi',  nameRu:'Симэкаэси'},
          {id:'2-i6',name:'Dakijime',     nameRu:'Дакидзимэ'},
          {id:'2-i7',name:'Karaminage',   nameRu:'Караминагэ'},
          {id:'2-i8',name:'Kotegaeshi',   nameRu:'Котэгаэси'},
          {id:'2-i9',name:'Nukitedori',   nameRu:'Нукитэдори'},
          {id:'2-i10',name:'Hizajime',    nameRu:'Хидзадзимэ'},
        ]
      },
      {
        id:'ushirodori', name:'Ushirodori', nameRu:'Усиродори', subtitle:'Атаки сзади',
        techniques:[
          {id:'2-u1',name:'Tateeridori',   nameRu:'Татээридори'},
          {id:'2-u2',name:'Ryokatahineri', nameRu:'Рёкатахинэри'},
          {id:'2-u3',name:'Ryohijigaeshi', nameRu:'Рёхидзигаэси'},
          {id:'2-u4',name:'Dakijimedori',  nameRu:'Дакидзимэдори'},
          {id:'2-u5',name:'Kataotoshi',    nameRu:'Катаотоси'},
        ]
      },
    ]
  },
  {
    id:'1kyu', label:'1 кю', kanji:'一', belt:'1kyu',
    note:'Техники 2 кю плюс раздел Хандзахандати:',
    sections:[
      {
        id:'tachiai', name:'Tachiai', nameRu:'Татиай', subtitle:'Стоя лицом друг к другу',
        techniques:[
          {id:'1-t1',name:'Ippondori',    nameRu:'Иппондори'},
          {id:'1-t2',name:'Kurumadaoshi', nameRu:'Курумадаоси'},
          {id:'1-t3',name:'Gyakuudedori', nameRu:'Гьякудэдори'},
          {id:'1-t4',name:'Koshiguruma',  nameRu:'Косигурума'},
          {id:'1-t5',name:'Karaminage',   nameRu:'Караминагэ'},
          {id:'1-t6',name:'Uraotoshi',    nameRu:'Ураотоси'},
          {id:'1-t7',name:'Obiotoshi',    nameRu:'Обиотоси'},
          {id:'1-t8',name:'Kirikaeshi',   nameRu:'Кирикаэси'},
          {id:'1-t9',name:'Kotegaeshi',   nameRu:'Котэгаэси'},
          {id:'1-t10',name:'Shihonage',   nameRu:'Сихонагэ'},
        ]
      },
      {
        id:'idori', name:'Idori', nameRu:'Идори', subtitle:'Сидя на коленях',
        techniques:[
          {id:'1-i1',name:'Ippondori',    nameRu:'Иппондори'},
          {id:'1-i2',name:'Gyakuudedori', nameRu:'Гьякуудэдори'},
          {id:'1-i3',name:'Hijigaeshi',   nameRu:'Хидзигаэси'},
          {id:'1-i4',name:'Kurumadaoshi', nameRu:'Курумадаоси'},
          {id:'1-i5',name:'Shimekaeshi',  nameRu:'Симэкаэси'},
          {id:'1-i6',name:'Dakijime',     nameRu:'Дакидзимэ'},
          {id:'1-i7',name:'Karaminage',   nameRu:'Караминагэ'},
          {id:'1-i8',name:'Kotegaeshi',   nameRu:'Котэгаэси'},
          {id:'1-i9',name:'Nukitedori',   nameRu:'Нукитэдори'},
          {id:'1-i10',name:'Hizajime',    nameRu:'Хидзадзимэ'},
        ]
      },
      {
        id:'ushirodori', name:'Ushirodori', nameRu:'Усиродори', subtitle:'Атаки сзади',
        techniques:[
          {id:'1-u1',name:'Tateeridori',   nameRu:'Татээридори'},
          {id:'1-u2',name:'Ryokatahineri', nameRu:'Рёкатахинэри'},
          {id:'1-u3',name:'Ryohijigaeshi', nameRu:'Рёхидзигаэси'},
          {id:'1-u4',name:'Dakijimedori',  nameRu:'Дакидзимэдори'},
          {id:'1-u5',name:'Kataotoshi',    nameRu:'Катаотоси'},
        ]
      },
      {
        id:'hanzahandachi', name:'Hanzahandachi', nameRu:'Хандзахандати', subtitle:'Один сидит, нападающий стоит',
        techniques:[
          {id:'1-h1',name:'Hanminage',  nameRu:'Ханминагэ'},
          {id:'1-h2',name:'Uraotoshi',  nameRu:'Ураотоси'},
          {id:'1-h3',name:'Izori',      nameRu:'Изори'},
          {id:'1-h4',name:'Kataotoshi', nameRu:'Катаотоси'},
          {id:'1-h5',name:'Iriminage',  nameRu:'Ириминагэ'},
        ]
      },
    ]
  },
];

// Поисковый индекс
export const FLAT_INDEX = [];
KYU_DATA.forEach(kyu =>
  kyu.sections.forEach(section =>
    section.techniques.forEach(tech =>
      FLAT_INDEX.push({ kyu, section, tech })
    )
  )
);
export { BELT } from '@/data/users';
