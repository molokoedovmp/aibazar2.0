import { CreditCard, ShieldCheck, Zap, CheckCircle, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function PaymentInstructionSection() {
  return (
    <section className="pt-16 pb-16 bg-white text-black relative overflow-hidden">
      {/* Тонкие линии для визуального интереса */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute h-px w-1/2 bg-gray-200 dark:bg-gray-800 top-1/3 -right-10 rotate-45"></div>
        <div className="absolute h-px w-1/2 bg-gray-200 dark:bg-gray-800 bottom-1/3 -left-10 -rotate-45"></div>
      </div>
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center mb-12 pt-8">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Простая и безопасная оплата
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Мы обеспечиваем быстрый и безопасный процесс оплаты для всех наших сервисов
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl p-8 transition-all duration-300 hover:shadow-lg">
            <div className="w-14 h-14 bg-black dark:bg-white rounded-full flex items-center justify-center mb-6">
              <CreditCard className="h-7 w-7 text-white dark:text-black" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Различные способы оплаты</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Мы предлагаем несколько вариантов оплаты, включая прямую ссылку, логин/пароль и одноразовую карту.
            </p>
          </div>

          <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl p-8 transition-all duration-300 hover:shadow-lg">
            <div className="w-14 h-14 bg-black dark:bg-white rounded-full flex items-center justify-center mb-6">
              <ShieldCheck className="h-7 w-7 text-white dark:text-black" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Безопасность данных</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Ваши данные надежно защищены. Мы используем современные технологии шифрования для обеспечения безопасности.
            </p>
          </div>

          <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl p-8 transition-all duration-300 hover:shadow-lg">
            <div className="w-14 h-14 bg-black dark:bg-white rounded-full flex items-center justify-center mb-6">
              <Zap className="h-7 w-7 text-white dark:text-black" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Быстрая активация</h3>
            <p className="text-gray-600 dark:text-gray-400">
              После подтверждения оплаты, ваша подписка активируется в течение нескольких минут.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <h3 className="text-3xl font-bold mb-6">Как оплатить AI сервисы из России</h3>
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="w-10 h-10 rounded-full bg-black dark:bg-white flex items-center justify-center mr-4 flex-shrink-0 mt-1">
                  <span className="text-white dark:text-black font-semibold">1</span>
                </div>
                <div>
                  <h4 className="text-xl font-semibold mb-2">Выберите сервис</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Определитесь с AI сервисом, который хотите оплатить (ChatGPT, Midjourney, Claude и др.)
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-10 h-10 rounded-full bg-black dark:bg-white flex items-center justify-center mr-4 flex-shrink-0 mt-1">
                  <span className="text-white dark:text-black font-semibold">2</span>
                </div>
                <div>
                  <h4 className="text-xl font-semibold mb-2">Свяжитесь с менеджером</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Напишите нашему менеджеру в Telegram и укажите выбранный сервис и тариф
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-10 h-10 rounded-full bg-black dark:bg-white flex items-center justify-center mr-4 flex-shrink-0 mt-1">
                  <span className="text-white dark:text-black font-semibold">3</span>
                </div>
                <div>
                  <h4 className="text-xl font-semibold mb-2">Оплатите подписку</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Получите реквизиты для оплаты, проведите платеж и отправьте подтверждение
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-10 h-10 rounded-full bg-black dark:bg-white flex items-center justify-center mr-4 flex-shrink-0 mt-1">
                  <span className="text-white dark:text-black font-semibold">4</span>
                </div>
                <div>
                  <h4 className="text-xl font-semibold mb-2">Получите доступ</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    После подтверждения оплаты, вы получите доступ к выбранному сервису
                  </p>
                </div>
              </div>
            </div>
            
            {/* Кнопка для перехода на страницу с подробной инструкцией */}
            <div className="mt-8">
              <Link href="/payment-instructions" passHref>
                <Button className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 px-6 py-3 rounded-full flex items-center">
                  Подробная инструкция <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="order-1 lg:order-2 relative">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-900 p-3 rounded-xl shadow-md">
                  <Image 
                    src="/tbank.svg" 
                    alt="Tinkoff Bank" 
                    width={80} 
                    height={40} 
                    className="h-8 object-contain invert-0 dark:invert"
                  />
                </div>
                <div className="bg-white dark:bg-gray-900 p-3 rounded-xl shadow-md">
                  <Image 
                    src="/yookassa.svg" 
                    alt="YooKassa" 
                    width={80} 
                    height={40} 
                    className="h-8 object-contain invert-0 dark:invert"
                  />
                </div>
              </div>
              <div className="space-y-4 mt-6">
                <div className="bg-white dark:bg-gray-900 p-3 rounded-xl shadow-md">
                  <Image 
                    src="/mir.svg" 
                    alt="Mir" 
                    width={80} 
                    height={40} 
                    className="h-8 object-contain invert-0 dark:invert"
                  />
                </div>
                <div className="bg-white dark:bg-gray-900 p-3 rounded-xl shadow-md">
                  <Image 
                    src="/sbp.svg" 
                    alt="SBP" 
                    width={80} 
                    height={40} 
                    className="h-8 object-contain invert-0 dark:invert"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 
