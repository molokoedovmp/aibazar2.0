"use client"

import { Brain, Search, FileText, Presentation, ArrowRight, CheckCircle, Sparkles, Zap, Target, Users, Play, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { Navbar } from "@/app/components/navbar";
import { Footer } from "@/app/components/footer";

const AITools = () => {
  const router = useRouter();
  const [showSignIn, setShowSignIn] = React.useState(false);



  

  const tools = [
    {
      id: "ai-search",
      icon: Search,
      title: "AI Поиск",
      subtitle: "Умный поисковый сервис",
      description: "Наш умный поисковый сервис анализирует ваши потребности и подбирает оптимальные AI-инструменты среди сотен доступных решений. Благодаря продвинутым алгоритмам и обширной базе данных, мы предлагаем точные рекомендации, учитывающие специфику вашей отрасли, бюджет и технические требования.",
      features: [
        "Анализ более 500+ AI инструментов",
        "Персонализированные рекомендации",
        "Фильтрация по бюджету и отрасли",
        "Сравнение характеристик",
        "Интеграция с популярными платформами"
      ],
      benefits: [
        "Экономия времени на поиск",
        "Профессиональная экспертиза",
        "Актуальная база данных",
        "Техническая поддержка"
      ],
      screenshot: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop&crop=center",
      demoText: "Попробуйте найти AI инструмент для вашего бизнеса",
      youtubeId: "dQw4w9WgXcQ",
      vkVideo: "https://vkvideo.ru/video_ext.php?oid=-231242204&id=456239017&hd=2&autoplay=1"
    },
    {
      id: "gpt-presentations",
      icon: Presentation,
      title: "GPT для презентаций",
      subtitle: "Автоматизированное создание слайдов",
      description: "Революционный сервис автоматизированного создания презентаций на базе искусственного интеллекта. Просто опишите ваши идеи, и наш GPT превратит их в стильные, структурированные слайды с оптимальным сочетанием текста, графики и визуальных элементов.",
      features: [
        "Генерация слайдов из текста",
        "Автоматический дизайн",
        "Множество шаблонов",
        "Экспорт в популярные форматы",
        "Интеграция с PowerPoint/Google Slides"
      ],
      benefits: [
        "Создание за минуты, не часы",
        "Профессиональный дизайн",
        "Структурированный контент",
        "Готовность к презентации"
      ],
      screenshot: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=600&fit=crop&crop=center",
      demoText: "Создайте презентацию из простого текста",
      youtubeId: "ScMzIvxBSi4",
      vkVideo: "https://vkvideo.ru/video_ext.php?oid=-231242204&id=456239018&hd=2&autoplay=1"
    },
    {
      id: "gpt-articles",
      icon: FileText,
      title: "GPT для статей",
      subtitle: "Автоматизированное создание контента",
      description: "Революционный сервис автоматизированного создания статей на базе искусственного интеллекта. Просто опишите ваши идеи, и наш GPT превратит их в качественный, структурированный текст, готовый для публикации.",
      features: [
        "Генерация уникального контента",
        "SEO-оптимизация текста",
        "Различные стили и тоны",
        "Проверка на плагиат",
        "Адаптация под целевую аудиторию"
      ],
      benefits: [
        "Быстрое создание контента",
        "Высокое качество текста",
        "SEO-готовые статьи",
        "Экономия ресурсов"
      ],
      screenshot: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=600&fit=crop&crop=center",
      demoText: "Напишите статью на любую тему за секунды",
      youtubeId: "jNQXAC9IVRw",
      vkVideo: "https://vkvideo.ru/video_ext.php?oid=-231242204&id=456239019&hd=2&autoplay=1"
    }
  ];


  return (
    <div className="min-h-screen bg-white">

    <Navbar />
    
      {/* Hero Section */}
      <section className="min-h-screen bg-black text-white relative overflow-hidden flex items-center">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-32 h-32 border-2 border-white/10 rotate-45 animate-pulse"></div>
          <div className="absolute top-40 right-20 w-24 h-24 border border-white/20 rotate-12 animate-bounce"></div>
          <div className="absolute bottom-20 left-20 w-16 h-16 bg-white/5 rotate-45 animate-pulse"></div>
          <div className="absolute bottom-40 right-40 w-20 h-20 border-2 border-white/15 -rotate-12 animate-bounce"></div>
          <div className="absolute top-1/2 left-1/4 w-64 h-64 border border-white/5 rounded-full animate-pulse"></div>
          <div className="absolute top-1/3 right-1/3 w-48 h-48 border border-white/10 rounded-full animate-bounce"></div>
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="grid grid-cols-20 grid-rows-20 w-full h-full">
              {Array.from({ length: 400 }, (_, i) => (
                <div key={i} className="border border-white/20"></div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="animate-fade-in">
            <div className="mb-8 relative">
              <Brain className="w-20 h-20 mx-auto mb-6 text-white animate-pulse" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full animate-ping"></div>
            </div>
            
            <h1 className="text-3xl md:text-7xl font-black mb-8 tracking-tighter leading-none">
              <span className="block">AI</span>
              <span className="block text-white drop-shadow-2xl">ИНСТРУМЕНТЫ</span>
              <span className="block text-3xl md:text-6xl mt-4 font-light">БУДУЩЕГО</span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-12 max-w-4xl mx-auto opacity-90 leading-relaxed">
              Откройте для себя мощь искусственного интеллекта с нашими революционнами инструментами.<br/>
              <span className="text-lg opacity-70">Автоматизируйте рутинные задачи и повысьте продуктивность в разы.</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <Button
                className="bg-white text-black hover:bg-gray-200 text-lg px-8 py-6 rounded-none font-bold transition-all duration-300 transform hover:scale-105 shadow-2xl"
                onClick={() => {}}
              >
                <Play className="mr-3 w-6 h-6" />
                НАЧАТЬ ИСПОЛЬЗОВАТЬ
                <ArrowRight className="ml-3 w-6 h-6" />
              </Button>
            </div>
            
            {/* Scroll Indicator */}
            <div className="animate-bounce mt-8">
              <div className="flex flex-col items-center">
                <span className="text-sm mb-2 opacity-70">Узнать больше</span>
                <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
                  <div className="w-1 h-3 bg-white rounded-full mt-2 animate-bounce"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      <section className="py-32 bg-white relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-transparent via-gray-100 to-transparent"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-black text-black mb-8 tracking-tight">
              НАШИ AI ИНСТРУМЕНТЫ
            </h2>
            <div className="w-32 h-2 bg-black mx-auto mb-8"></div>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Три революционных инструмента, которые изменят ваш подход к работе с информацией и контентом.<br/>
              <span className="text-lg text-gray-500">Каждый инструмент разработан для максимальной эффективности и простоты использования.</span>
            </p>
          </div>

          <div className="space-y-32">
            {tools.map((tool, index) => (
              <div key={tool.id} className={`relative ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''} lg:flex items-center gap-20`}>
                {/* Tool Preview */}
                <div className="lg:w-1/2 mb-12 lg:mb-0">
                  <div className="relative group">
                    {/* YouTube Video Player */}
                    <div className="bg-black text-white rounded-3xl p-8 transform hover:scale-105 transition-all duration-500 shadow-2xl relative overflow-hidden">
                      {/* Background Pattern */}
                      <div className="absolute inset-0 opacity-10">
                        <div className="grid grid-cols-6 grid-rows-6 w-full h-full">
                          {Array.from({ length: 36 }, (_, i) => (
                            <div key={i} className="border border-white/20"></div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="relative z-10">
                        <div className="flex items-center mb-6">
                          <tool.icon className="w-16 h-16 text-white mr-4" />
                          <div>
                            <h3 className="text-3xl font-bold mb-1">{tool.title}</h3>
                            <p className="text-lg opacity-90">{tool.subtitle}</p>
                          </div>
                        </div>
                        
                        {/* VK Video Preview (если есть) */}
                        {tool.vkVideo ? (
                          <div className="relative mb-6 aspect-video rounded-xl overflow-hidden border-2 border-white/20">
                            <iframe
                              src={tool.vkVideo}
                              width="100%"
                              height="100%"
                              allow="autoplay; encrypted-media"
                              allowFullScreen
                              className="w-full h-full"
                              title={`${tool.title} VK видео`}
                            ></iframe>
                          </div>
                        ) : (
                          <div className="relative mb-6 aspect-video rounded-xl overflow-hidden border-2 border-white/20">
                            <iframe
                              width="100%"
                              height="100%"
                              src={`https://www.youtube.com/embed/${tool.youtubeId}?rel=0&modestbranding=1`}
                              title={`${tool.title} демо`}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="w-full h-full"
                            ></iframe>
                          </div>
                        )}
                        
                        <div className="text-center">
                          <p className="text-lg opacity-80 mb-4">{tool.demoText}</p>
                          <Button
                            className="bg-white text-black hover:bg-gray-200 font-bold px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105"
                            onClick={() => {}}
                          >
                            Попробовать бесплатно
                            <ArrowRight className="ml-2 w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tool Details */}
                <div className="lg:w-1/2">
                  <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-gray-50 rounded-3xl overflow-hidden">
                    <CardHeader className="pb-8">
                      <div className="flex items-center mb-4">
                        <div className="w-3 h-3 bg-black rounded-full mr-3"></div>
                        <CardTitle className="text-3xl font-black text-black">
                          Возможности инструмента
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="px-8 pb-8">
                      <p className="text-gray-700 mb-8 leading-relaxed text-lg">
                        {tool.description}
                      </p>
                      
                      <div className="grid md:grid-cols-2 gap-8">
                        <div>
                          <h4 className="font-bold text-black mb-4 flex items-center text-lg">
                            <Sparkles className="w-6 h-6 mr-3 text-black" />
                            Основные функции
                          </h4>
                          <ul className="space-y-3">
                            {tool.features.map((feature, i) => (
                              <li key={i} className="flex items-start group">
                                <CheckCircle className="w-5 h-5 text-black mr-3 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
                                <span className="text-gray-700 leading-relaxed">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-bold text-black mb-4 flex items-center text-lg">
                            <Target className="w-6 h-6 mr-3 text-black" />
                            Преимущества
                          </h4>
                          <ul className="space-y-3">
                            {tool.benefits.map((benefit, i) => (
                              <li key={i} className="flex items-start group">
                                <Star className="w-5 h-5 text-black mr-3 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
                                <span className="text-gray-700 leading-relaxed">{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-32 bg-white text-black relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-40 h-40 border border-black/10 rotate-45 animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-32 h-32 border border-black/10 -rotate-45 animate-pulse"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-black mb-8">
              КАК ЭТО РАБОТАЕТ
            </h2>
            <div className="w-32 h-2 bg-black mx-auto mb-8"></div>
            <p className="text-xl opacity-90 max-w-3xl mx-auto">
              Простой процесс использования наших AI инструментов
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold group-hover:scale-110 transition-transform duration-300">
                1
              </div>
              <h3 className="text-2xl font-bold mb-4">Выберите инструмент</h3>
              <p className="text-gray-600 leading-relaxed">
                Определите, какой AI инструмент лучше всего подходит для вашей задачи
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold group-hover:scale-110 transition-transform duration-300">
                2
              </div>
              <h3 className="text-2xl font-bold mb-4">Введите данные</h3>
              <p className="text-gray-600 leading-relaxed">
                Опишите вашу задачу или загрузите необходимые материалы
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold group-hover:scale-110 transition-transform duration-300">
                3
              </div>
              <h3 className="text-2xl font-bold mb-4">Получите результат</h3>
              <p className="text-gray-600 leading-relaxed">
                Наш AI мгновенно обработает данные и предоставит готовое решение
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-black text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <Users className="w-16 h-16 mx-auto mb-6" />
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              ГОТОВЫ НАЧАТЬ?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Присоединяйтесь к тысячам пользователей, которые уже используют наши AI инструменты 
              для повышения продуктивности и автоматизации рутинных задач.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                className="bg-white text-black hover:bg-gray-200 text-lg px-8 py-6 rounded-none font-semibold transition-all duration-300 w-48"
                onClick={() => {}}
              >
                СОЗДАТЬ АККАУНТ
              </Button>
                <a>
                  <Button className="border-2 border-white text-white hover:bg-white hover:text-black text-lg px-8 py-6 rounded-none font-semibold transition-all duration-300 w-48">
                    УЗНАТЬ БОЛЬШЕ
                  </Button>
                </a>
            </div>
          </div>
        </div>
      </section>

    <Footer />

      
    </div>
  );
};

export default AITools;