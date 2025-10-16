import { Footer } from "@/app/components/footer";
import { Landingsecond } from "@/app/components/home/landingsecond";
import { Navbar } from "@/app/components/navbar";

const MarketingPage = () => {
  return (
    <div className="min-h-full flex flex-col dark:bg-[#1F1F1F] ">
      <Navbar overlay />
      <Landingsecond />
      <Footer />
    </div>
  );
}

export default MarketingPage;
