import Closing from "@/components/Closing";
import Community from "@/components/Community";
import CursorGlow from "@/components/CursorGlow";
import DarkRoom from "@/components/DarkRoom";
import Faq from "@/components/Faq";
import Fifth from "@/components/Fifth";
import Footer from "@/components/Footer";
import HelpVideo from "@/components/HelpVideo";
import Hero from "@/components/Hero";
import Mission from "@/components/Mission";
import Nav from "@/components/Nav";
import Pulse from "@/components/Pulse";
import Shader from "@/components/Shader";
import Sponsors from "@/components/Sponsors";
import Tracks from "@/components/Tracks";

export default function Home() {
  return (
    <>
      <Shader />
      <CursorGlow />
      <Nav />
      <main>
        <Hero />
        <Mission />
        <Tracks />
        <Fifth />
        <DarkRoom />
        <Pulse />
        <Sponsors />
        <Community />
        <Faq />
        <Closing />
      </main>
      <Footer />
      <HelpVideo />
    </>
  );
}
