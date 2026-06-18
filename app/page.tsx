// app/page.tsx
import Header from "../components/layout/Header";
import Hero from "../components/layout/Hero";
import FeaturedCategories from "../components/layout/FeaturedCategories";
import WhyChooseUs from "../components/layout/WhyChooseUs";
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