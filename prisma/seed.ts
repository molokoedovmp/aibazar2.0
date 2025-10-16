import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Начинаем заполнение БД тестовыми данными...');

  // Создаём категории
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Текст и письмо',
        description: 'Инструменты для создания и редактирования текста',
        icon: '📝',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Изображения',
        description: 'Генерация и обработка изображений',
        icon: '🎨',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Код и разработка',
        description: 'Помощники для программирования',
        icon: '💻',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Анализ данных',
        description: 'Инструменты для работы с данными',
        icon: '📊',
      },
    }),
  ]);

  console.log(`✅ Создано ${categories.length} категорий`);

  // Создаём AI инструменты
  const aiTools = await Promise.all([
    // Текст и письмо
    prisma.aiTool.create({
      data: {
        name: 'ChatGPT',
        description: 'Универсальный AI-ассистент для решения любых задач',
        coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400',
        url: 'https://chat.openai.com',
        type: 'chat',
        isActive: true,
        rating: 4.8,
        price: 20.0,
        startPrice: 0.0,
        categoryId: categories[0].id,
      },
    }),
    prisma.aiTool.create({
      data: {
        name: 'Claude',
        description: 'AI-ассистент от Anthropic с фокусом на безопасность',
        coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400',
        url: 'https://claude.ai',
        type: 'chat',
        isActive: true,
        rating: 4.7,
        price: 20.0,
        startPrice: 0.0,
        categoryId: categories[0].id,
      },
    }),
    prisma.aiTool.create({
      data: {
        name: 'Grammarly',
        description: 'Проверка грамматики и стиля письма',
        coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400',
        url: 'https://grammarly.com',
        type: 'writing',
        isActive: true,
        rating: 4.5,
        price: 12.0,
        startPrice: 0.0,
        categoryId: categories[0].id,
      },
    }),

    // Изображения
    prisma.aiTool.create({
      data: {
        name: 'Midjourney',
        description: 'Генерация изображений по текстовому описанию',
        coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400',
        url: 'https://midjourney.com',
        type: 'image-generation',
        isActive: true,
        rating: 4.9,
        price: 10.0,
        startPrice: 0.0,
        categoryId: categories[1].id,
      },
    }),
    prisma.aiTool.create({
      data: {
        name: 'DALL-E 3',
        description: 'Создание изображений от OpenAI',
        coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400',
        url: 'https://openai.com/dall-e-3',
        type: 'image-generation',
        isActive: true,
        rating: 4.6,
        price: 0.02,
        startPrice: 0.0,
        categoryId: categories[1].id,
      },
    }),
    prisma.aiTool.create({
      data: {
        name: 'Stable Diffusion',
        description: 'Открытая модель для генерации изображений',
        coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400',
        url: 'https://stablediffusionweb.com',
        type: 'image-generation',
        isActive: true,
        rating: 4.4,
        price: 0.0,
        startPrice: 0.0,
        categoryId: categories[1].id,
      },
    }),

    // Код и разработка
    prisma.aiTool.create({
      data: {
        name: 'GitHub Copilot',
        description: 'AI-помощник для написания кода',
        coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400',
        url: 'https://github.com/features/copilot',
        type: 'coding',
        isActive: true,
        rating: 4.7,
        price: 10.0,
        startPrice: 0.0,
        categoryId: categories[2].id,
      },
    }),
    prisma.aiTool.create({
      data: {
        name: 'Tabnine',
        description: 'Автодополнение кода с помощью AI',
        coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400',
        url: 'https://tabnine.com',
        type: 'coding',
        isActive: true,
        rating: 4.3,
        price: 12.0,
        startPrice: 0.0,
        categoryId: categories[2].id,
      },
    }),

    // Анализ данных
    prisma.aiTool.create({
      data: {
        name: 'DataRobot',
        description: 'Автоматизированное машинное обучение',
        coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400',
        url: 'https://datarobot.com',
        type: 'ml',
        isActive: true,
        rating: 4.5,
        price: 0.0,
        startPrice: 0.0,
        categoryId: categories[3].id,
      },
    }),
    prisma.aiTool.create({
      data: {
        name: 'Tableau AI',
        description: 'Анализ данных с помощью AI',
        coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400',
        url: 'https://tableau.com',
        type: 'analytics',
        isActive: true,
        rating: 4.4,
        price: 15.0,
        startPrice: 0.0,
        categoryId: categories[3].id,
      },
    }),
  ]);

  console.log(`✅ Создано ${aiTools.length} AI инструментов`);

  console.log('🎉 Заполнение БД завершено!');
}

main()
  .catch((e) => {
    console.error('❌ Ошибка при заполнении БД:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
