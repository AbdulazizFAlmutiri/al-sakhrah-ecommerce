import { About, Clients, Contact, Footer, Header, Hero, Products, Quality, Sectors, WhatsAppFab } from "@/components/Site";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Clients />
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
