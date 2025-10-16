"use client";

import { useState, useEffect } from "react";
import { ArrowDown, Code, Smartphone, Search, Zap, Users, Award, Clock, CheckCircle, Phone, Mail, MapPin, Globe, Palette, Settings, TrendingUp, Shield, HeadphonesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction
} from "@/components/ui/alert-dialog";
import { Navbar } from "@/app/components/navbar";   
import { Footer } from "@/app/components/footer";

const Index = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const prevPadding = document.body.style.paddingTop;
    const prevMargin = document.body.style.marginTop;
    document.body.style.paddingTop = "0px";
    document.body.style.marginTop = "0px";
    return () => {
      document.body.style.paddingTop = prevPadding;
      document.body.style.marginTop = prevMargin;
    };
  }, []);

  const scrollToServices = () => {
    document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToPortfolio = () => {
    document.getElementById('portfolio')?.scrollIntoView({ behavior: 'smooth' });
  };

 

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const services = [
    {
      icon: Code,
      title: "Веб-разработка",
      description: "Создание сайтов на современных технологиях с адаптивным дизайном и высокой производительностью",
      features: ["React, Vue, Angular", "Адаптивная верстка", "Высокая производительность", "Чистый код"],
      price: "от 15 000 ₽"
    },
    {
      icon: Smartphone,
      title: "Мобильная адаптация",
      description: "Оптимизация для всех устройств - от смартфонов до настольных компьютеров",
      features: ["Mobile-First подход", "Все разрешения экранов", "Touch-оптимизация", "PWA поддержка"],
      price: "от 7 000 ₽"
    },
    {
      icon: Search,
      title: "SEO-оптимизация",
      description: "Настройка для поисковых систем и повышение позиций в выдаче Google и Яндекс",
      features: ["Техническое SEO", "Контентная оптимизация", "Аналитика и отчеты", "Локализация"],
      price: "от 10 000 ₽"
    },
    {
      icon: Zap,
      title: "Быстрая загрузка",
      description: "Оптимизация скорости загрузки страниц для лучшего пользовательского опыта",
      features: ["Оптимизация изображений", "Минификация кода", "CDN настройка", "Кэширование"],
      price: "от 5 000 ₽"
    },
    {
      icon: Globe,
      title: "E-commerce решения",
      description: "Интернет-магазины с полным функционалом для онлайн-продаж",
      features: ["Каталог товаров", "Корзина и оплата", "Личный кабинет", "Интеграции"],
      price: "от 30 000 ₽"
    },
    {
      icon: Palette,
      title: "UI/UX Дизайн",
      description: "Создание привлекательного и удобного пользовательского интерфейса",
      features: ["Wireframes", "Прототипирование", "Дизайн-система", "User Research"],
      price: "от 12 000 ₽"
    },
    {
      icon: Settings,
      title: "Техническая поддержка",
      description: "Постоянное обслуживание и поддержка вашего сайта",
      features: ["24/7 мониторинг", "Обновления системы", "Резервное копирование", "Техподдержка"],
      price: "от 3 000 ₽/мес"
    },
    {
      icon: HeadphonesIcon,
      title: "Консультации",
      description: "Экспертные консультации по цифровому развитию вашего бизнеса",
      features: ["Анализ конкурентов", "Стратегия развития", "Техническое ТЗ", "Выбор технологий"],
      price: "от 1 500 ₽/час"
    }
  ];

  const projects = [
    {
      title: "Сайт с ИИ-интеграцией",
      description: "Веб-платформа с интеграцией искусственного интеллекта для автоматизации и персонализации процессов",
      image: "/website/ai.png",
      category: "AI-интеграция",
      url: "https://www.ai-bazar.ru/"
    },
    {
      title: "Интернет-магазин",
      description: "E-commerce решение",
      image: "/website/lesopilka.png",
      category: "E-commerce",
      url: "https://vyborplus.ru/"
    },
    {
      title: "Лендинг страница",
      description: "Продающая страница услуг",
      image: "/website/kresla.png",
      category: "Landing",
      url: "https://www.ruskreslo.ru/index.html"
    },
    {
      title: "Портфолио дизайнера",
      description: "Креативное портфолио",
      image: "/website/design.png",
      category: "Портфолио",
      url: "https://asinteriordesignstudio.ru/"
    }
  ];

  const stats = [
    { icon: Users, number: "50+", text: "Довольных клиентов" },
    { icon: Award, number: "100+", text: "Завершенных проектов" },
    { icon: Clock, number: "5+", text: "Лет опыта" },
    { icon: CheckCircle, number: "24/7", text: "Поддержка клиентов" }
  ];

  return (
    <div className="min-h-screen bg-white" style={{ marginTop: 0, paddingTop: 0 }}>
      {/* Hero Section */}
      <Navbar />
      <section
        className="bg-black text-white flex flex-col justify-between items-center relative overflow-hidden"
        style={{ minHeight: "100vh", paddingTop: "4rem" }}
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="grid grid-cols-12 h-full">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="border-r border-white/20 h-full"></div>
              ))}
            </div>
            <div className="absolute inset-0">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="border-b border-white/10 h-12"></div>
              ))}
            </div>
          </div>

          {/* Floating Geometric Shapes */}
          <div className="absolute top-1/4 left-1/4 w-32 h-32 border-2 border-white/20 rotate-45 animate-pulse"></div>
          <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-white/10 animate-bounce" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-1/3 left-1/6 w-24 h-24 border border-white/30 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-2/3 right-1/3 w-8 h-8 bg-white/20 rotate-45 animate-bounce" style={{ animationDelay: '0.5s' }}></div>

          {/* Large Diagonal Lines */}
          <div className="absolute -top-1/2 -left-1/4 w-96 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent rotate-45 animate-pulse"></div>
          <div className="absolute -bottom-1/2 -right-1/4 w-96 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent rotate-45 animate-pulse" style={{ animationDelay: '1.5s' }}></div>

          {/* Corner Accents */}
          <div className="absolute top-0 left-0 w-32 h-32 border-l-4 border-t-4 border-white/30"></div>
          <div className="absolute top-0 right-0 w-32 h-32 border-r-4 border-t-4 border-white/30"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 border-l-4 border-b-4 border-white/30"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 border-r-4 border-b-4 border-white/30"></div>
        </div>

        {/* Navigation Indicators */}
        <div className="absolute left-8 top-1/2 transform -translate-y-1/2 space-y-4 z-10">
          <div className="w-1 h-8 bg-white"></div>
          <div className="w-1 h-4 bg-white/50"></div>
          <div className="w-1 h-4 bg-white/30"></div>
          <div className="w-1 h-4 bg-white/30"></div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 text-center flex-1 flex flex-col justify-center relative z-10">
          {/* Animated Badge */}
          
          {/* Main Title with Staggered Animation */}
          <div className="space-y-4 mb-8 mt-16">
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none">
              <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                СОЗДАЕМ
              </div>
              <div className="animate-fade-in flex items-center justify-center gap-4" style={{ animationDelay: '0.4s' }}>
                <div className="w-16 h-1 bg-white"></div>
                <span className="text-white">САЙТЫ</span>
                <div className="w-16 h-1 bg-white"></div>
              </div>
              <div className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
                БУДУЩЕГО
              </div>
            </h1>
          </div>

          {/* Subtitle with Typewriter Effect */}
          <div className="animate-fade-in" style={{ animationDelay: '0.8s' }}>
            <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto opacity-90 leading-relaxed">
              Профессиональная веб-разработка для вашего бизнеса. 
              <br />
              <span className="font-light">От идеи до запуска — воплощаем digital-проекты любой сложности.</span>
            </p>
          </div>

          {/* CTA Buttons with Hover Effects */}
          <div className="animate-fade-in flex flex-col sm:flex-row gap-6 justify-center mb-16" style={{ animationDelay: '1s' }}>
            <Button
              onClick={scrollToServices}
              className="group relative bg-white text-black border-2 border-white text-lg px-12 py-6 font-bold tracking-wide transition-all duration-500 overflow-hidden"
            >
              <span className="relative z-10 group-hover:text-black transition-colors">НАШИ УСЛУГИ</span>
              <div className="absolute inset-0 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
            </Button>
            <Button 
              onClick={scrollToPortfolio}
              className="group relative bg-transparent text-white hover:bg-white hover:text-black border-2 border-white text-lg px-12 py-6 font-bold tracking-wide transition-all duration-500 overflow-hidden"
            >
              <span className="relative z-10">ПОРТФОЛИО</span>
              <div className="absolute inset-0 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-right"></div>
            </Button>
          </div>

          {/* Statistics Bar */}
          <div className="animate-fade-in grid grid-cols-4 gap-4 max-w-2xl mx-auto mb-16" style={{ animationDelay: '1.2s' }}>
            <div className="text-center border-r border-white/30 last:border-r-0">
              <div className="text-2xl font-bold">100+</div>
              <div className="text-xs opacity-70">ПРОЕКТОВ</div>
            </div>
            <div className="text-center border-r border-white/30 last:border-r-0">
              <div className="text-2xl font-bold">5+</div>
              <div className="text-xs opacity-70">ЛЕТ ОПЫТА</div>
            </div>
            <div className="text-center border-r border-white/30 last:border-r-0">
              <div className="text-2xl font-bold">50+</div>
              <div className="text-xs opacity-70">КЛИЕНТОВ</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">24/7</div>
              <div className="text-xs opacity-70">ПОДДЕРЖКА</div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="animate-fade-in pb-8" style={{ animationDelay: '1.4s' }}>
          <div className="flex flex-col items-center space-y-2">
            <div className="text-sm font-medium tracking-widest opacity-70">SCROLL</div>
            <div className="w-px h-16 bg-gradient-to-b from-white to-transparent"></div>
            <div className="animate-bounce">
              <ArrowDown className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
     {/* Services Section */}
     <section id="services" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-black mb-6">
              НАШИ УСЛУГИ
            </h2>
            <div className="w-24 h-1 bg-black mx-auto mb-6"></div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Предлагаем полный спектр услуг по созданию и развитию веб-проектов. 
              От концепции до реализации — мы воплотим ваши идеи в жизнь.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {services.map((service, index) => (
              <div 
                key={index}
                className="group p-8 border-2 border-black hover:bg-black hover:text-white transition-all duration-300 cursor-pointer transform hover:scale-105"
              >
                <service.icon className="w-12 h-12 mb-6 group-hover:text-white transition-colors duration-300" />
                <h3 className="text-xl font-bold mb-4">{service.title}</h3>
                <p className="text-gray-600 group-hover:text-gray-300 transition-colors duration-300 mb-4">
                  {service.description}
                </p>
                <ul className="text-sm text-gray-600 group-hover:text-gray-300 mb-4 space-y-1">
                  {service.features.map((feature, i) => (
                    <li key={i} className="flex items-center">
                      <div className="w-2 h-2 bg-black group-hover:bg-white mr-2 flex-shrink-0"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="text-lg font-bold border-t border-gray-300 group-hover:border-gray-600 pt-4">
                  {service.price}
                </div>
              </div>
            ))}
          </div>

          {/* Additional Services Info */}
          <div className="bg-black text-white p-8 md:p-12">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Современные технологии</h3>
                <p className="text-gray-300">Используем только актуальные и надежные решения</p>
              </div>
              <div className="text-center">
                <Shield className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Гарантия качества</h3>
                <p className="text-gray-300">Предоставляем гарантию на все выполненные работы</p>
              </div>
              <div className="text-center">
                <Clock className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Соблюдение сроков</h3>
                <p className="text-gray-300">Всегда укладываемся в оговоренные временные рамки</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio Section */}
      <section id="portfolio" className="py-20 bg-black text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              НАШИ РАБОТЫ
            </h2>
            <div className="w-24 h-1 bg-white mx-auto"></div>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {projects.map((project, index) => (
              <a
                key={index}
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden cursor-pointer block"
                tabIndex={0}
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img 
                    src={project.image} 
                    alt={project.title}
                    className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="text-center">
                    <span className="inline-block px-3 py-1 bg-white text-black text-sm font-semibold mb-3">
                      {project.category}
                    </span>
                    <h3 className="text-2xl font-bold mb-2">{project.title}</h3>
                    <p className="text-gray-300">{project.description}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-black mb-8">
                О НАС
              </h2>
              <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                Мы — команда профессиональных веб-разработчиков, создающих качественные 
                и современные сайты для бизнеса любого масштаба.
              </p>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Наш подход основан на глубоком понимании потребностей клиента и 
                использовании передовых технологий для достижения максимального результата.
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-black mr-4"></div>
                  <span className="text-lg">Индивидуальный подход к каждому проекту</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-black mr-4"></div>
                  <span className="text-lg">Современные технологии и стандарты</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-black mr-4"></div>
                  <span className="text-lg">Постоянная поддержка и обслуживание</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center p-6 border-2 border-black hover:bg-black hover:text-white transition-all duration-300">
                  <stat.icon className="w-12 h-12 mx-auto mb-4" />
                  <div className="text-3xl font-bold mb-2">{stat.number}</div>
                  <div className="text-sm font-medium">{stat.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-black text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              СВЯЖИТЕСЬ С НАМИ
            </h2>
            <div className="w-24 h-1 bg-white mx-auto mb-6"></div>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Готовы обсудить ваш проект? Оставьте заявку, и мы свяжемся с вами в течение часа
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-16">
            <div>
              <h3 className="text-2xl font-bold mb-8">Контактная информация</h3>
              <div className="space-y-6">
                <div className="flex items-center">
                  <Phone className="w-6 h-6 mr-4" />
                  <div>
                    <div className="font-semibold">Телефон</div>
                    <div className="text-gray-300">+7 (993) 596-79-52</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Mail className="w-6 h-6 mr-4" />
                  <div>
                    <div className="font-semibold">Email</div>
                    <div className="text-gray-300">aiBazaru@yandex.com</div>
                  </div>
                </div>
                
              </div>
            </div>
            
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (loading) return;
                setLoading(true);
                try {
                  const res = await fetch('/api/leads', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      name: formData.name,
                      email: formData.email,
                      telegram: formData.phone,
                      message: formData.message,
                      source: 'webservices-contact',
                    }),
                  });
                  const json = await res.json().catch(() => ({}));
                  if (!res.ok || !json?.ok) throw new Error(json?.error || 'Ошибка отправки');
                  setDialogOpen(true);
                  setFormData({ name: '', email: '', phone: '', message: '' });
                } catch (err: any) {
                  alert(err?.message || 'Не удалось отправить заявку');
                } finally {
                  setLoading(false);
                }
              }}
              className="space-y-6"
            >
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  name="name"
                  placeholder="Ваше имя"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="bg-white text-black border-0 rounded-none h-12"
                />
                <Input
                  name="phone"
                  placeholder="Телефон"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="bg-white text-black border-0 rounded-none h-12"
                />
              </div>
              <Input
                name="email"
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
                className="bg-white text-black border-0 rounded-none h-12"
              />
              <Textarea
                name="message"
                placeholder="Расскажите о вашем проекте"
                value={formData.message}
                onChange={handleChange}
                required
                rows={5}
                className="bg-white text-black border-0 rounded-none resize-none"
              />
              <Button 
                type="submit"
                className="w-full bg-white text-black hover:bg-white/90 rounded-none h-12 text-lg font-semibold transition-all duration-300"
                disabled={loading}
              >
                {loading ? "Отправка..." : "ОТПРАВИТЬ ЗАЯВКУ"}
              </Button>
            </form>
            {/* AlertDialog для успешной отправки */}
            <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Спасибо!</AlertDialogTitle>
                  <AlertDialogDescription>
                    Ваше сообщение успешно отправлено. Мы свяжемся с вами в ближайшее время.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogAction onClick={() => setDialogOpen(false)}>
                    Закрыть
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </section>

      <Footer />    
    </div>
  );
};

export default Index;
