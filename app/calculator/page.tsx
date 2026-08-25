import { Footer } from "@/app/components/footer";
import { Navbar } from "@/app/components/navbar";
import PricingCalculator from "@/components/PricingCalculator";
import { getUsdFx } from "@/lib/pricing";

export const revalidate = 600;

export default async function CalculatorPage() {
  const fx = await getUsdFx();

  return (
    <div className="min-h-screen bg-[#f4f4f0] text-black">
      <Navbar />
      <main className="relative overflow-hidden px-5 py-14 sm:px-8 sm:py-20 lg:px-10">
        <div className="pointer-events-none absolute -left-40 top-10 h-96 w-96 rounded-full bg-violet-200/50 blur-3xl" />
        <div className="pointer-events-none absolute -right-40 bottom-10 h-96 w-96 rounded-full bg-blue-200/50 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1fr] lg:items-center lg:gap-20">
          <div className="max-w-xl">
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-black/45">
              Калькулятор цен
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-6xl">
              Узнайте стоимость подписки в рублях
            </h1>
            <p className="mt-6 text-base leading-7 text-black/60 sm:text-lg">
              Введите цену AI-инструмента в долларах. Калькулятор пересчитает её
              по актуальному курсу и покажет итоговую стоимость оплаты.
            </p>
          </div>

          <PricingCalculator fx={fx} />
        </div>
      </main>
      <div className="border-t border-black/10 bg-white">
        <Footer />
      </div>
    </div>
  );
}
