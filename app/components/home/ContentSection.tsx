"use client";

import {
  DollarSignIcon,
  BotIcon,
  VideoIcon,
  MusicIcon,
  ImageIcon,
  TextIcon,
  TrendingUpIcon,
  HeadphonesIcon,
  BarChartIcon,
  CodeIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function ContentPage() {
  const router = useRouter();

  const handleCardClick = (path: string) => {
    router.push(`/services${path}`);
  };

  // Анимация для карточек
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <section className="py-16 relative overflow-hidden">
      {/* Тонкие круги для визуального интереса */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute h-64 w-64 border border-gray-200 dark:border-gray-800 rounded-full -top-32 -right-32"></div>
        <div className="absolute h-96 w-96 border border-gray-200 dark:border-gray-800 rounded-full -bottom-48 -left-48"></div>
      </div>
      
      <div className="container max-w-6xl px-4 md:px-6 relative z-10">
        <div className="space-y-6 text-center mb-12">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl text-center">
            Наши Услуги
          </h2>
          <p className="max-w-3xl text-base text-center mx-auto text-gray-600 dark:text-gray-400">
            Мы предлагаем широкий спектр AI-решений для различных задач — от создания контента до анализа данных. 
            Наши инструменты помогут вам автоматизировать рутинные задачи и сосредоточиться на развитии вашего бизнеса.
          </p>
        </div>
        
        <motion.div 
          className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <motion.div
            className="rounded-2xl bg-white dark:bg-black border border-gray-200 dark:border-gray-800 p-8 transition-all duration-300 hover:scale-105 hover:border-gray-300 dark:hover:border-gray-700 cursor-pointer group"
            onClick={() => handleCardClick("/")}
            variants={item}
          >
            <div className="bg-black dark:bg-white w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transform transition-all duration-300 group-hover:rotate-6">
              <DollarSignIcon className="h-7 w-7 text-white dark:text-black" />
            </div>
            <h3 className="text-xl font-semibold text-black dark:text-white mb-4">
              Оплата подписок
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Выберите нужный вам инструмент, посмотрите примеры его работы в нашем сообществе, и мы поможем оплатить подписку.
            </p>
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <span className="text-sm font-medium text-black dark:text-white">Популярные сервисы:</span>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-xs bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded-full">ChatGPT Plus</span>
                <span className="text-xs bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded-full">Midjourney</span>
                <span className="text-xs bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded-full">Claude Pro</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="rounded-2xl bg-white dark:bg-black border border-gray-200 dark:border-gray-800 p-8 transition-all duration-300 hover:scale-105 hover:border-gray-300 dark:hover:border-gray-700 cursor-pointer group"
            onClick={() => handleCardClick("/")}
            variants={item}
          >
            <div className="bg-black dark:bg-white w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transform transition-all duration-300 group-hover:rotate-6">
              <BotIcon className="h-7 w-7 text-white dark:text-black" />
            </div>
            <h3 className="text-xl font-semibold text-black dark:text-white mb-4">
              Создание чат-бота
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Создание чат-ботов для обработки клиентов, контроля работы колл-центра или как автоответчик в соцсетях.
            </p>
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <span className="text-sm font-medium text-black dark:text-white">Возможности:</span>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-xs bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded-full">Автоответы</span>
                <span className="text-xs bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded-full">Интеграция с CRM</span>
                <span className="text-xs bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded-full">Аналитика</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="rounded-2xl bg-white dark:bg-black border border-gray-200 dark:border-gray-800 p-8 transition-all duration-300 hover:scale-105 hover:border-gray-300 dark:hover:border-gray-700 cursor-pointer group"
            onClick={() => handleCardClick("/")}
            variants={item}
          >
            <div className="bg-black dark:bg-white w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transform transition-all duration-300 group-hover:rotate-6">
              <VideoIcon className="h-7 w-7 text-white dark:text-black" />
            </div>
            <h3 className="text-xl font-semibold text-black dark:text-white mb-4">
              Создание видео для соцсетей
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Создание и монтаж видео для социальных сетей, включая перевод, сценарии и нарезки.
            </p>
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <span className="text-sm font-medium text-black dark:text-white">Форматы:</span>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-xs bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded-full">Reels</span>
                <span className="text-xs bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded-full">TikTok</span>
                <span className="text-xs bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded-full">YouTube Shorts</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="rounded-2xl bg-white dark:bg-black border border-gray-200 dark:border-gray-800 p-8 transition-all duration-300 hover:scale-105 hover:border-gray-300 dark:hover:border-gray-700 cursor-pointer group"
            onClick={() => handleCardClick("/")}
            variants={item}
          >
            <div className="bg-black dark:bg-white w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transform transition-all duration-300 group-hover:rotate-6">
              <MusicIcon className="h-7 w-7 text-white dark:text-black" />
            </div>
            <h3 className="text-xl font-semibold text-black dark:text-white mb-4">
              Создание и генерация музыки
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Генерация оригинальных музыкальных треков, создание фоновой музыки и автоматическое написание мелодий.
            </p>
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <span className="text-sm font-medium text-black dark:text-white">Инструменты:</span>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-xs bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded-full">Suno</span>
                <span className="text-xs bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded-full">Udio</span>
                <span className="text-xs bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded-full">Soundraw</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="rounded-2xl bg-white dark:bg-black border border-gray-200 dark:border-gray-800 p-8 transition-all duration-300 hover:scale-105 hover:border-gray-300 dark:hover:border-gray-700 cursor-pointer group"
            onClick={() => handleCardClick("/")}
            variants={item}
          >
            <div className="bg-black dark:bg-white w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transform transition-all duration-300 group-hover:rotate-6">
              <ImageIcon className="h-7 w-7 text-white dark:text-black" />
            </div>
            <h3 className="text-xl font-semibold text-black dark:text-white mb-4">
              Обработка изображений
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Автоматическая ретушь фотографий, распознавание объектов и создание фильтров и эффектов.
            </p>
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <span className="text-sm font-medium text-black dark:text-white">Возможности:</span>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-xs bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded-full">Генерация</span>
                <span className="text-xs bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded-full">Ретушь</span>
                <span className="text-xs bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded-full">Апскейл</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="rounded-2xl bg-white dark:bg-black border border-gray-200 dark:border-gray-800 p-8 transition-all duration-300 hover:scale-105 hover:border-gray-300 dark:hover:border-gray-700 cursor-pointer group"
            onClick={() => handleCardClick("/")}
            variants={item}
          >
            <div className="bg-black dark:bg-white w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transform transition-all duration-300 group-hover:rotate-6">
              <TextIcon className="h-7 w-7 text-white dark:text-black" />
            </div>
            <h3 className="text-xl font-semibold text-black dark:text-white mb-4">
              Обработка текста и создание контента
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Генерация текстов, анализ тональности и автоматическое резюмирование.
            </p>
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <span className="text-sm font-medium text-black dark:text-white">Типы контента:</span>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-xs bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded-full">SEO-тексты</span>
                <span className="text-xs bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded-full">Статьи</span>
                <span className="text-xs bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded-full">Посты</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
        
        {/* Дополнительная секция с преимуществами */}
        <div className="mt-16 pt-16 border-t border-gray-200 dark:border-gray-800">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">Почему выбирают нас</h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Мы предлагаем комплексные решения для бизнеса любого масштаба, 
              помогая внедрять AI-технологии эффективно и с минимальными затратами.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-xl text-center">
              <div className="w-12 h-12 bg-black dark:bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUpIcon className="h-6 w-6 text-white dark:text-black" />
              </div>
              <h4 className="text-lg font-semibold mb-2">Повышение эффективности</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Автоматизация рутинных задач и ускорение рабочих процессов</p>
            </div>
            
            <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-xl text-center">
              <div className="w-12 h-12 bg-black dark:bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <HeadphonesIcon className="h-6 w-6 text-white dark:text-black" />
              </div>
              <h4 className="text-lg font-semibold mb-2">Техническая поддержка</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Помощь в настройке и использовании AI-инструментов</p>
            </div>
            
            <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-xl text-center">
              <div className="w-12 h-12 bg-black dark:bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChartIcon className="h-6 w-6 text-white dark:text-black" />
              </div>
              <h4 className="text-lg font-semibold mb-2">Аналитика результатов</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Отслеживание эффективности внедрения AI-решений</p>
            </div>
            
            <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-xl text-center">
              <div className="w-12 h-12 bg-black dark:bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <CodeIcon className="h-6 w-6 text-white dark:text-black" />
              </div>
              <h4 className="text-lg font-semibold mb-2">Индивидуальные решения</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Разработка кастомных AI-инструментов под ваши задачи</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
