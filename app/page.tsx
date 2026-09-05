import { Footer } from "@/app/components/footer";
import { Landingsecond } from "@/app/components/home/landingsecond";
import { Navbar } from "@/app/components/navbar";

const MarketingPage = () => {
  return (
    <div className="min-h-screen text-foreground">
      <Navbar overlay />
      <Landingsecond />
      <Footer className="!bg-transparent !bg-none" />
    </div>
  );
};

export default MarketingPage;
