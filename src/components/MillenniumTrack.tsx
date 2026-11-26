import Image from "next/image";
import Link from "next/link";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ArrowLeft, Briefcase, Trophy } from "lucide-react";
import UnirseTrack from "@/components/UnirseTrack";
import ContadorTrack from "@/components/ContadorTrack";
import RetoEnVivo from "@/components/RetoEnVivo";
import HeroSponsor from "@/components/HeroSponsor";
import s from "./MillenniumTrack.module.css";
import { desde } from "@/lib/enlaces";

/**
 * La página del reto de Millennium (sponsor del track «IA & Fintech»).
 *
 * Todo su branding es el de Millennium (millennium.ky): el azul de su isotipo, el azul marino de su nombre, fondo claro y
 * una tipografía geométrica como la de su logo. Millennium es un grupo con tres marcas —Millennium, Lima Bikes y Lizzo—,
 * así que la página las presenta juntas, cada una con su logo. Los textos sobre qué hacen salen de su propia web.
 * El reto en sí se presenta en vivo el viernes 27 de noviembre; cuando Millennium lo entregue por escrito, se pone en «El reto».
 */
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], display: "swap" });

const MARCAS = [
  {
    nombre: "Millennium",
    texto: "El grupo: finanzas con propósito social para la movilidad. Usa inteligencia artificial para que más personas accedan a financiamiento.",
    logo: { src: "/logos/millennium-color.png", width: 1000, height: 429 },
  },
  {
    nombre: "Lima Bikes",
    texto: "Financiamiento de motos para quienes están comprometidos con sus sueños, con una propuesta innovadora y un equipo enfocado en generar valor para el cliente.",
    logo: { src: "/logos/lima-bikes.png", width: 829, height: 247 },
  },
  {
    nombre: "Lizzo",
    texto: "Tu aliado para conseguir tu primer vehículo como herramienta de trabajo, como conductor de taxi. Crece junto a Yango, con acceso a programas de beneficios de alto impacto.",
    logo: { src: "/logos/lizzo.png", width: 920, height: 286 },
  },
];

export default function MillenniumTrack({ slug }: { slug: string }) {
  return (
    <div className={`${s.mil} ${jakarta.className}`}>
      <header className={s.barra}>
        <div className={s.in}>
          <a href={desde("https://millennium.ky/")} target="_blank" rel="noopener" aria-label="Millennium">
            <Image src="/logos/millennium-color.png" width={1000} height={429} alt="Millennium" unoptimized className={s.logo} priority />
          </a>
          <Link href="/tracks" className={s.volver}>
            <ArrowLeft aria-hidden size={15} />
            <span>Track de&nbsp;</span> <b>HACK[CIS] UNI 2026</b>
          </Link>
        </div>
      </header>

      <main>
        <HeroSponsor
          etiqueta="dorado · IA & Fintech" nombre="Millennium" url={desde("https://millennium.ky/")}
          logo="/logos/millennium-color.png" logoAncho={1000} logoAlto={429} logoMostrado={380}
          tema={{
            fondo: "radial-gradient(760px 440px at 100% 0, rgba(0,104,169,.22), transparent 62%), radial-gradient(640px 440px at 0 100%, rgba(0,104,169,.10), transparent 62%), #fff",
            tinta: "#101e4b", texto: "#46536b", acento: "#0068a9", acento2: "#35a7e6", cinta: "#f2b705", cintaTexto: "#101e4b", botonTexto: "#ffffff",
          }}
          datos={["★ Track dorado: S/ 1 000 + cartas oferta", "Hasta 40 equipos · 15 construyen", "Gran Final · sáb 5 dic · UNI"]}
        >
          Millennium es un grupo peruano de finanzas con foco en la <strong>inclusión financiera impulsada por IA</strong>: ayuda a
          conductores a conseguir su moto o su taxi como herramienta de trabajo, a través de sus marcas Lima Bikes y Lizzo. En
          HACK[CIS] propone un reto real de fintech para resolver junto a un agente de IA, el quinto miembro de tu equipo. Es el <strong>track dorado</strong>: el equipo ganador se lleva S/ 1 000 y cada integrante recibe una carta oferta para trabajar en Millennium.
        </HeroSponsor>

        <section className={s.cifras}>
          <div className={s.in}>
            <div className={s.cifra}><b>3 marcas</b><span>Millennium, Lima Bikes y Lizzo</span></div>
            <div className={s.cifra}><b>2 y 4 ruedas</b><span>motos y vehículos de trabajo para conductores</span></div>
            <div className={s.cifra}><b>IA + finanzas</b><span>inclusión financiera para quienes más la necesitan</span></div>
          </div>
        </section>

        <section className={s.dorado}>
          <div className={s.in}>
            <p className={s.sobreOro}>★ Track dorado</p>
            <h2>Un premio que va más allá del dinero</h2>
            <div className={s.premios}>
              <article className={s.premio}>
                <Trophy aria-hidden size={26} strokeWidth={1.8} />
                <b>S/ 1 000</b>
                <h3>Para el equipo ganador</h3>
                <p>El aporte de Millennium va íntegro al premio del equipo que gane el track Fintech.</p>
              </article>
              <article className={s.premio}>
                <Briefcase aria-hidden size={26} strokeWidth={1.8} />
                <b>Carta oferta</b>
                <h3>Para todo el equipo ganador</h3>
                <p>Todo el equipo ganador recibe cartas oferta para trabajar en Millennium: una para cada integrante, con una entrevista de por medio.</p>
              </article>
            </div>
          </div>
        </section>

        <section className={`${s.sec} ${s.gris}`}>
          <div className={s.in}>
            <p className={s.sobre}>Quién es Millennium</p>
            <h2>Finanzas que ponen a la gente en movimiento</h2>
            <p className={`${s.lead} ${s.sub}`} style={{ marginTop: 14 }}>
              Millennium es una «social automotive» para la inclusión financiera impulsada por IA. Acompaña a motociclistas y
              conductores para que su primer vehículo sea el punto de partida de su crecimiento económico.
            </p>
            <div className={s.tarjetas}>
              {MARCAS.map((m) => (
                <article key={m.nombre} className={s.tarjeta}>
                  <div className={s.marca}>
                    <Image src={m.logo.src} width={m.logo.width} height={m.logo.height} alt={m.nombre} unoptimized className={s.marcaLogo} />
                  </div>
                  <h3>{m.nombre}</h3>
                  <p>{m.texto}</p>
                </article>
              ))}
            </div>
            <p className={s.fuente}>
              Información de <a href={desde("https://millennium.ky/")} target="_blank" rel="noopener">millennium.ky</a>.
            </p>
          </div>
        </section>

        <section className={s.sec}>
          <div className={s.in}>
            <p className={s.sobre}>El reto</p>
            <h2>Un problema real de fintech, resuelto con IA</h2>
            <RetoEnVivo slug="fintech" sponsor="Millennium">
              <div className={s.reto}>
                <div className={s.retoCaja}>
                  <h3>Millennium lo presenta en vivo el viernes 27, 8:30 p. m.</h3>
                  <p>
                    En la presentación de sponsors, Millennium explica el problema que quiere resolver y cada equipo decide en qué track
                    competir. Ese día conocerás el reto completo y, si hay datos o herramientas disponibles, también se anuncian ahí.
                  </p>
                  <p style={{ marginBottom: 0 }}>
                    <b>La autoría es de tu equipo.</b> Las soluciones quedan como repositorio open source con licencia MIT,
                    a total disposición de Millennium para pilotearlas. <Link href="/bases" style={{ color: "#0068a9", fontWeight: 700 }}>Lee las bases</Link>.
                  </p>
                </div>
                <div className={s.calentar}>
                  <h3>Para ir calentando motores</h3>
                  <ul className={s.lista}>
                    <li><b>Acceso al crédito:</b> cómo evaluar a una persona que no tiene historial en el sistema financiero.</li>
                    <li><b>Vehículos de trabajo:</b> cómo hacer que financiar una moto o un taxi sea rápido y claro.</li>
                    <li><b>IA con sentido social:</b> cómo usar datos para incluir y no para excluir.</li>
                    <li><b>Experiencia del cliente:</b> cómo acompañar a un conductor durante todo su financiamiento.</li>
                  </ul>
                </div>
              </div>
            </RetoEnVivo>
          </div>
        </section>

        <section className={`${s.sec} ${s.gris}`}>
          <div className={s.in}>
            <p className={s.sobre}>Cómo participar</p>
            <h2>Del Bootcamp a la Gran Final</h2>
            <div className={s.pasos}>
              <div className={s.paso}><b>El viernes 27 de noviembre</b>, cuando los tres sponsors terminen sus pitches (desde las 8:30 p. m.), cada equipo elige su track.</div>
              <div className={s.paso}><b>El líder</b> se une al track y, automáticamente, todo su equipo se une con él.</div>
              <div className={s.paso}><b>Equipos de 2 a 4 personas</b>, de las carreras o facultades que quieran. <span className={s.nuevo}>Nuevo</span> A pedido de ustedes, ya no es obligatorio que sean distintas.</div>
              <div className={s.paso}><b>Antes del sábado 28 por la noche</b> el equipo entrega su primera propuesta. Fintech acepta hasta <b>40 equipos</b> (los primeros en elegirlo) y <b>15 pasan a construir</b>.</div>
            </div>
            <p className={s.nota}>
              En la Gran Final del sábado 5 de diciembre, en el Auditorio CTIC de la UNI, se anuncian los 5 equipos de Fintech que hacen pitch y, al final, el ganador del track.
            </p>
          </div>
        </section>

        <section id="unete" className={s.unete}>
          <div className={s.in}>
            <div className={s.oscuro}>
              <p className={s.sobre} style={{ color: "#7cc4ee" }}>Únete a este track</p>
              <h2>¿Listos para el reto de Millennium?</h2>
              <p className={`${s.lead} ${s.sub}`} style={{ marginTop: 12, color: "#cfe3f2" }}>
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
          <a href={desde("https://millennium.ky/")} target="_blank" rel="noopener" className={s.pieOscuro} aria-label="Powered by Millennium">
            <span>Track powered by</span>
            <Image src="/logos/millennium-blanco.png" width={640} height={274} alt="Millennium" unoptimized className={s.logoPie} />
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
