// app/page.tsx
import Header from "../components/layout/Header";
import Hero from "../components/sections/Hero";
import FeaturedCategories from "../components/sections/FeaturedCategories";
import WhyChooseUs from "../components/sections/WhyChooseUs";
import Footer from "../components/layout/Footer";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <FeaturedCategories />
        <WhyChooseUs />
      </main>
      <Footer />
    </>
  );
}