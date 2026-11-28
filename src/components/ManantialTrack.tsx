import Image from "next/image";
import Link from "next/link";
import { Poppins } from "next/font/google";
import { Activity, ArrowLeft, Database, Headset, PiggyBank } from "lucide-react";
import UnirseTrack from "@/components/UnirseTrack";
import ContadorTrack from "@/components/ContadorTrack";
import RetoCompleto from "@/components/RetoCompleto";
import HeroSponsor from "@/components/HeroSponsor";
import s from "./ManantialTrack.module.css";
import { desde } from "@/lib/enlaces";

/**
 * La página del reto de Manantial (sponsor del track «IA & Educación»).
 *
 * Todo su branding es el de Manantial (manantial.pe): el rojo vino de su logo y de su portada, el coral de sus
 * acentos, Poppins y fondo claro. Los textos sobre qué hace Manantial salen de su propia web. El reto en sí se
 * presenta en vivo el viernes 27 de noviembre; cuando Manantial lo entregue por escrito, se pone en «El reto».
 */
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

const SOLUCIONES = [
  { icono: Database, titulo: "Data Management", texto: "Convierte los datos en decisiones inteligentes: información ordenada, segura y siempre accesible." },
  { icono: Headset, titulo: "Contact Center", texto: "Atención al cliente con Amazon Connect: llamadas, chats y correos en una sola plataforma, con automatización e inteligencia artificial." },
  { icono: Activity, titulo: "Observabilidad", texto: "Visibilidad total para garantizar la continuidad de los servicios: monitoreo en tiempo real para detectar incidencias antes de que afecten." },
  { icono: PiggyBank, titulo: "FinOps", texto: "Estrategias para optimizar los costos en la nube: entender en qué se invierte y cómo aprovechar mejor cada recurso." },
];

export default function ManantialTrack({ slug }: { slug: string }) {
  return (
    <div className={`${s.man} ${poppins.className}`}>
      <header className={s.barra}>
        <div className={s.in}>
          <a href={desde("https://manantial.pe/")} target="_blank" rel="noopener" aria-label="Manantial">
            <Image src="/logos/manantial-color.png" width={3578} height={1386} alt="Manantial" unoptimized className={s.logo} priority />
          </a>
          <Link href="/tracks" className={s.volver}>
            <ArrowLeft aria-hidden size={15} />
            <span>Track de&nbsp;</span> <b>HACK[CIS] UNI 2026</b>
          </Link>
        </div>
      </header>

      <main>
        <HeroSponsor
          etiqueta="IA & Educación" nombre="Manantial" url={desde("https://manantial.pe/")}
          logo="/logos/manantial-color.png" logoAncho={3578} logoAlto={1386} logoMostrado={520}
          tema={{
            fondo: "radial-gradient(760px 440px at 100% 0, rgba(255,107,107,.26), transparent 62%), radial-gradient(640px 440px at 0 100%, rgba(145,43,43,.16), transparent 62%), #fff",
            tinta: "#212529", texto: "#4a4f55", acento: "#912b2b", acento2: "#ff6b6b", cinta: "#912b2b", cintaTexto: "#ffffff", botonTexto: "#ffffff",
          }}
          datos={["S/ 500 al equipo ganador", "5 equipos pasan a la final", "Gran Final · sáb 5 dic · UNI"]}
        >
          Manantial es una consultora peruana de tecnología que conecta <strong>innovación con personas</strong> para lograr
          grandes resultados. Especialistas en migración cloud, DevOps y ciberseguridad, ayudan a las empresas a acelerar su
          transformación digital. En HACK[CIS] propone un reto real para resolver junto a un agente de IA, el quinto miembro de tu equipo.
        </HeroSponsor>

        <section className={s.cifras}>
          <div className={s.in}>
            <div className={s.cifra}><b>+60</b><span>proyectos de transformación digital</span></div>
            <div className={s.cifra}><b>+16</b><span>clientes enterprise</span></div>
            <div className={s.cifra}><b>4 partners</b><span>AWS, Google Cloud, Oracle y Anthropic (Claude)</span></div>
          </div>
        </section>

        <section className={`${s.sec} ${s.gris}`}>
          <div className={s.in}>
            <p className={s.sobre}>Quién es Manantial</p>
            <h2>Tecnología con propósito</h2>
            <p className={`${s.lead} ${s.sub}`} style={{ marginTop: 14 }}>
              Manantial acompaña a las empresas en su camino a la nube: migra, automatiza, protege y cuida los costos, con el respaldo
              de sus aliados estratégicos AWS (Advanced Consulting Partner), Google Cloud, Oracle y Anthropic (Claude).
            </p>
            <div className={s.tarjetas}>
              {SOLUCIONES.map((t) => (
                <article key={t.titulo} className={s.tarjeta}>
                  <div className={s.ico}><t.icono aria-hidden size={22} strokeWidth={1.8} /></div>
                  <h3>{t.titulo}</h3>
                  <p>{t.texto}</p>
                </article>
              ))}
            </div>
            <p className={s.fuente}>
              Información de <a href={desde("https://manantial.pe/")} target="_blank" rel="noopener">manantial.pe</a>.
            </p>
          </div>
        </section>

        <section className={s.sec}>
          <div className={s.in}>
            <p className={s.sobre}>El reto</p>
            <h2>Un orientador de IA que ayuda a jóvenes a elegir qué estudiar</h2>
            <RetoCompleto slug="cloud" acento="#912b2b" premio="Premio del track: S/ 500 al equipo ganador" />
          </div>
        </section>

        <section className={`${s.sec} ${s.gris}`}>
          <div className={s.in}>
            <p className={s.sobre}>Cómo participar</p>
            <h2>Del Bootcamp a la Gran Final</h2>
            <div className={s.pasos}>
              <div className={s.paso}><b>El viernes 27 de noviembre</b>, cuando los tres sponsors terminen sus pitches (desde las 8:30 p. m.), cada equipo elige su track, con plazo hasta el domingo 29 a las 12:00 m.</div>
              <div className={s.paso}><b>El líder</b> se une al track y, automáticamente, todo su equipo se une con él.</div>
              <div className={s.paso}><b>Equipos de 2 a 4 personas</b>, de las carreras o facultades que quieran. A pedido de ustedes, ya no es obligatorio que sean distintas.</div>
              <div className={s.paso}><b>Del sábado 28 a las 00:00 al miércoles 2 a las 4:00 a. m.</b> construyen y entregan su proyecto. Los 5 finalistas del track se anuncian el sábado 5.</div>
            </div>
            <p className={s.nota}>
              El ganador del track se anuncia en la Gran Final del sábado 5 de diciembre, en el Auditorio de la FIIS de la UNI.
            </p>
          </div>
        </section>

        <section id="unete" className={s.unete}>
          <div className={s.in}>
            <div className={s.oscuro}>
              <p className={s.sobre} style={{ color: "#ff8d8d" }}>Únete a este track</p>
              <h2>¿Listos para el reto de Manantial?</h2>
              <p className={`${s.lead} ${s.sub}`} style={{ marginTop: 12, color: "#f3d6d6" }}>
                El líder del equipo se une desde aquí, el viernes 27, cuando se active la elección.
              </p>
              <ContadorTrack slug={slug} />
              <div className="box">
                <UnirseTrack slug={slug} />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className={s.pie}>
        <div className={s.in}>
          <a href={desde("https://manantial.pe/")} target="_blank" rel="noopener" className={s.pieOscuro} aria-label="Powered by Manantial">
            <span>Track powered by</span>
            <Image src="/logos/manantial.png" width={640} height={192} alt="Manantial" unoptimized className={s.logoPie} />
          </a>
          <div className={s.fila}>
            <Link href="/tracks">Todos los tracks</Link>
            <Link href="/bases">Bases</Link>
            <Link href="/">HACK[CIS] UNI 2026</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
