import { About, Contact, Footer, Header, Hero, Products, Quality, Sectors, WhatsAppFab } from "@/components/Site";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />
        <Products />
        <Sectors />
        <Quality />
        <Contact />
      </main>
      <Footer />
      <WhatsAppFab />
    </>
  );
}
