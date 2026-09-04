import { Footer } from "@/app/components/footer";
import { Landingsecond } from "@/app/components/home/landingsecond";
import { Navbar } from "@/app/components/navbar";

const MarketingPage = () => {
  return (
    <div className="flex min-h-full flex-col bg-white dark:bg-black">
      <Navbar overlay />
      <Landingsecond />
      <Footer />
    </div>
  );
};

export default MarketingPage;
