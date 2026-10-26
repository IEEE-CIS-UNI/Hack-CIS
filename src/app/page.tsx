import Closing from "@/components/Closing";
import Community from "@/components/Community";
import DarkRoom from "@/components/DarkRoom";
import Faq from "@/components/Faq";
import Fifth from "@/components/Fifth";
import Footer from "@/components/Footer";
import HelpVideo from "@/components/HelpVideo";
import Hero from "@/components/Hero";
import Mission from "@/components/Mission";
import Nav from "@/components/Nav";
import Pulse from "@/components/Pulse";
import RescateDeSesion from "@/components/RescateDeSesion";
import Sponsors from "@/components/Sponsors";
import StarField from "@/components/StarField";
import Tracks from "@/components/Tracks";

export default function Home() {
  return (
    <>
      <RescateDeSesion />
      <StarField />
      <div className="nebula" aria-hidden />
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
