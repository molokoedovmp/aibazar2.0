import { createHash } from "node:crypto";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { icons, type LucideIcon } from "lucide-react";

export type CategoryDefinition = {
  source: string;
  name: string;
  icon: keyof typeof icons;
  aliases?: string[];
};

export const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  { source: "3D", name: "3D", icon: "Box" },
  { source: "Agriculture", name: "Сельское хозяйство", icon: "Sprout" },
  { source: "App Builder", name: "Конструкторы приложений", icon: "Blocks" },
  { source: "Art", name: "Искусство", icon: "Palette" },
  { source: "Audio & Speech", name: "Аудио и речь", icon: "AudioLines" },
  { source: "Avatars", name: "Аватары", icon: "CircleUserRound" },
  { source: "Browsers", name: "Браузеры", icon: "Globe" },
  { source: "Business", name: "Бизнес", icon: "BriefcaseBusiness", aliases: ["Бизнес"] },
  { source: "Chatbots", name: "Чат-боты", icon: "Bot" },
  { source: "Cooking", name: "Кулинария", icon: "CookingPot" },
  { source: "Copywriting", name: "Копирайтинг", icon: "PenLine" },
  { source: "Crypto", name: "Криптовалюты", icon: "Bitcoin" },
  { source: "Customer Support", name: "Поддержка клиентов", icon: "Headphones" },
  { source: "Data & BI", name: "Данные и аналитика", icon: "ChartColumn", aliases: ["Excel"] },
  { source: "Dating", name: "Знакомства", icon: "Heart" },
  { source: "Design", name: "Дизайн", icon: "Paintbrush", aliases: ["Дизайн"] },
  {
    source: "Developer Tools",
    name: "Разработка",
    icon: "CodeXml",
    aliases: ["Developer", "Код и разработка"],
  },
  { source: "Document Processing", name: "Работа с документами", icon: "Files" },
  { source: "E-Commerce", name: "Электронная коммерция", icon: "ShoppingCart" },
  { source: "Education", name: "Образование", icon: "GraduationCap", aliases: ["Математика"] },
  { source: "Email Assistant", name: "Email-ассистенты", icon: "Mail" },
  { source: "Experiments", name: "Экспериментальные", icon: "FlaskConical", aliases: ["Особые"] },
  { source: "Fashion", name: "Мода", icon: "Shirt" },
  { source: "Finance", name: "Финансы", icon: "Landmark" },
  { source: "Fitness", name: "Фитнес", icon: "Dumbbell" },
  { source: "Fun Tools", name: "Развлечения", icon: "Sparkles" },
  { source: "Gaming", name: "Игры", icon: "Gamepad2" },
  { source: "Gift Ideas", name: "Идеи подарков", icon: "Gift" },
  { source: "HealthCare", name: "Здоровье", icon: "HeartPulse" },
  { source: "Human Resources", name: "HR и подбор персонала", icon: "Users" },
  { source: "Image Classification", name: "Распознавание изображений", icon: "ScanSearch" },
  { source: "Image Editing", name: "Редактирование изображений", icon: "Images" },
  { source: "Image Generator", name: "Генерация изображений", icon: "ImagePlus" },
  { source: "Interior Designing", name: "Дизайн интерьера", icon: "Sofa" },
  {
    source: "Legal",
    name: "Юридические инструменты",
    icon: "Scale",
    aliases: ["Legal Assistant"],
  },
  { source: "Marketing", name: "Маркетинг", icon: "Megaphone" },
  { source: "Meeting", name: "Встречи", icon: "CalendarClock" },
  { source: "Models", name: "Модели ИИ", icon: "BrainCircuit", aliases: ["Model", "LLM модели"] },
  { source: "Music", name: "Создание музыки", icon: "Music2", aliases: ["Создание музыки"] },
  { source: "Paraphraser", name: "Перефразирование", icon: "Replace" },
  { source: "Personal Assistant", name: "Персональные ассистенты", icon: "UserRound" },
  {
    source: "Presentation",
    name: "Презентации",
    icon: "Presentation",
    aliases: ["Presentations", "Презентации"],
  },
  { source: "Productivity", name: "Продуктивность", icon: "Gauge" },
  { source: "Prompts", name: "Промпты", icon: "MessageSquareText" },
  { source: "Psychology", name: "Психология", icon: "Brain" },
  { source: "Real Estate", name: "Недвижимость", icon: "House" },
  { source: "Religion", name: "Религия", icon: "Church" },
  { source: "Research", name: "Исследования", icon: "Microscope" },
  { source: "Resume", name: "Резюме", icon: "FileUser" },
  { source: "SEO", name: "SEO", icon: "SearchCheck" },
  { source: "Sales", name: "Продажи", icon: "BadgeDollarSign" },
  { source: "Search Engine", name: "Поиск", icon: "Search" },
  { source: "Social Media", name: "Социальные сети", icon: "Share2" },
  { source: "Summarizer", name: "Суммаризация", icon: "ListCollapse" },
  { source: "Translation", name: "Перевод", icon: "Languages" },
  { source: "Travel", name: "Путешествия", icon: "Plane" },
  { source: "Video", name: "Видео", icon: "Video", aliases: ["Видео"] },
  { source: "Weather", name: "Погода", icon: "CloudSun" },
  { source: "Writing", name: "Работа с текстом", icon: "FileText" },
];

export function normalizeCategoryKey(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("en-US")
    .replace(/\s+/g, " ");
}

const CATEGORY_BY_ALIAS = new Map<string, CategoryDefinition>();
for (const definition of CATEGORY_DEFINITIONS) {
  for (const alias of [definition.source, definition.name, ...(definition.aliases ?? [])]) {
    CATEGORY_BY_ALIAS.set(normalizeCategoryKey(alias), definition);
  }
}

export function categoryDefinitionFor(value: unknown): CategoryDefinition | undefined {
  return CATEGORY_BY_ALIAS.get(normalizeCategoryKey(value));
}

export function categoryIdFor(definition: CategoryDefinition): string {
  const digest = createHash("sha256")
    .update(normalizeCategoryKey(definition.source))
    .digest("hex")
    .slice(0, 24);
  return `cat_collective_${digest}`;
}

export function categoryIconDataUrl(definition: CategoryDefinition): string {
  const Icon = icons[definition.icon] as LucideIcon;
  const svg = renderToStaticMarkup(
    createElement(Icon, {
      xmlns: "http://www.w3.org/2000/svg",
      width: 24,
      height: 24,
      color: "currentColor",
      strokeWidth: 2,
    }),
  );
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export function categoryDescription(definition: CategoryDefinition): string {
  return `Подборка AI-инструментов в категории «${definition.name}».`;
}
