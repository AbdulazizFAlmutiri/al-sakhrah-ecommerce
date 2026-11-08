import Header from "@/components/Header";
import { About, Contact, Footer, Hero, Products, Quality, Sectors, Vision, WhyUs } from "@/components/Sections";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />
        <Vision />
        <Quality />
        <Products />
        <Sectors />
        <WhyUs />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
