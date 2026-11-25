import Image from "next/image";
import Link from "next/link";
import { Poppins } from "next/font/google";
import { ArrowLeft, BarChart3, BellRing, Gauge, Power, Receipt, Zap } from "lucide-react";
import UnirseTrack from "@/components/UnirseTrack";
import HeroSponsor from "@/components/HeroSponsor";
import s from "./ZeiaTrack.module.css";
import { desde } from "@/lib/enlaces";

/**
 * La página del reto de Zeia (sponsor del track «IA & Energía»).
 *
 * Todo su branding es el de Zeia (zeia.com.pe): fondo claro, degradado cian → menta del
 * logo, tipografía Poppins y botones menta. Los textos sobre qué hace Zeia salen de su
 * propia web. El reto en sí se presenta en vivo el viernes 27 de noviembre; cuando Zeia
 * lo entregue por escrito, se pone en la sección «El reto».
 */
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

const LO_QUE_HACE = [
  { icono: Zap, titulo: "Monitoreo en tiempo real", texto: "Mira cómo cada decisión operativa impacta en tu tarifa, al segundo." },
  { icono: Gauge, titulo: "Detección de sobreconsumo", texto: "Descubre qué equipos inflan la factura y dónde se va el presupuesto energético." },
  { icono: Receipt, titulo: "Anticípate a tu factura", texto: "Proyecta el cierre de mes con datos reales, no con suposiciones." },
  { icono: BellRing, titulo: "Alertas automáticas", texto: "Avisos minuto a minuto cuando algo se sale de lo normal." },
  { icono: Power, titulo: "Automatización energética", texto: "Apaga o regula equipos de forma automática." },
  { icono: BarChart3, titulo: "Informes a medida", texto: "Comparativos claros y reportes personalizados para decidir rápido." },
];

export default function ZeiaTrack({ slug }: { slug: string }) {
  return (
    <div className={`${s.zeia} ${poppins.className}`}>
      <header className={s.barra}>
        <div className={s.in}>
          <a href={desde("https://zeia.com.pe/")} target="_blank" rel="noopener" aria-label="Zeia">
            <Image src="/logos/zeia.png" width={308} height={92} alt="Zeia" unoptimized className={s.logo} priority />
          </a>
          <Link href="/tracks" className={s.volver}>
            <ArrowLeft aria-hidden size={15} />
            <span>Track de&nbsp;</span> <b>HACK[CIS] UNI 2026</b>
          </Link>
        </div>
      </header>

      <main>
        <HeroSponsor
          etiqueta="IA & Energía" nombre="Zeia" url={desde("https://zeia.com.pe/")}
          logo="/logos/zeia.png" logoAncho={308} logoAlto={92} logoMostrado={340}
          tema={{
            fondo: "radial-gradient(900px 480px at 88% -8%, rgba(135,227,196,.5), transparent 62%), radial-gradient(700px 480px at -8% 24%, rgba(0,183,215,.16), transparent 62%), #fff",
            tinta: "#1f292e", texto: "#4d5a63", acento: "#00b7d7", acento2: "#4fd9b8", cinta: "#87e3c4", cintaTexto: "#1f292e", botonTexto: "#1f292e",
          }}
          datos={["El reto se presenta en vivo el vie 27 nov", "5 equipos pasan a la final", "Gran Final · sáb 5 dic · UNI"]}
        >
          Zeia es una empresa peruana de <strong>monitoreo energético en tiempo real</strong>. Instala sensores en los tableros
          eléctricos, conecta todo a la nube y da visibilidad total sobre cada sol que se consume. En HACK[CIS] propone un reto
          real para resolver junto a un agente de IA, el quinto miembro de tu equipo.
        </HeroSponsor>

        <section className={s.cifras}>
          <div className={s.in}>
            <div className={s.cifra}><b>+26 mil horas</b><span>de monitoreo en la Clínica Ricardo Palma</span></div>
            <div className={s.cifra}><b>Minuto a minuto</b><span>alertas automáticas sobre el consumo</span></div>
            <div className={s.cifra}><b>Sin internet</b><span>sensores LoRaWAN que siguen midiendo</span></div>
          </div>
        </section>

        <section className={`${s.sec} ${s.gris}`}>
          <div className={s.in}>
            <p className={s.sobre}>Quién es Zeia</p>
            <h2>No puedes optimizar lo que no puedes medir</h2>
            <p className={`${s.lead} ${s.sub}`} style={{ marginTop: 14 }}>
              Zeia ayuda a empresas peruanas a dejar de pagar de más en energía: mide cada tablero, detecta el desperdicio y
              convierte los datos en decisiones.
            </p>
            <div className={s.tarjetas}>
              {LO_QUE_HACE.map((t) => (
                <article key={t.titulo} className={s.tarjeta}>
                  <div className={s.ico}><t.icono aria-hidden size={22} strokeWidth={1.8} /></div>
                  <h3>{t.titulo}</h3>
                  <p>{t.texto}</p>
                </article>
              ))}
            </div>
            <p className={s.fuente}>
              Información de <a href={desde("https://zeia.com.pe/")} target="_blank" rel="noopener">zeia.com.pe</a>.
            </p>
          </div>
        </section>

        <section className={s.sec}>
          <div className={s.in}>
            <p className={s.sobre}>El reto</p>
            <h2>Un problema real de energía, resuelto con IA</h2>
            <div className={s.reto}>
              <div className={s.retoCaja}>
                <h3>Zeia lo presenta en vivo el viernes 27 de noviembre</h3>
                <p>
                  Al cierre del Bootcamp, Zeia explica el problema que quiere resolver y cada equipo decide en qué track
                  competir. Ese día conocerás el reto completo y, si hay datos o herramientas disponibles, también se
                  anuncian ahí.
                </p>
                <p style={{ marginBottom: 0 }}>
                  <b>La autoría es de tu equipo.</b> Las soluciones quedan como repositorio open source con licencia MIT,
                  a total disposición de Zeia para pilotearlas. <Link href="/bases" style={{ color: "#0a8f86", fontWeight: 600 }}>Lee las bases</Link>.
                </p>
              </div>
              <div className={s.calentar}>
                <h3>Para ir calentando motores</h3>
                <ul className={s.lista}>
                  <li><b>Series de tiempo:</b> consumo, demanda y potencia eléctrica a lo largo del día.</li>
                  <li><b>Anomalías:</b> cómo detectar cuándo un equipo gasta de más.</li>
                  <li><b>Agentes de IA:</b> cómo convertir lecturas en alertas y decisiones.</li>
                  <li><b>Costos:</b> cómo se arma una factura eléctrica y qué la encarece.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className={`${s.sec} ${s.gris}`}>
          <div className={s.in}>
            <p className={s.sobre}>Cómo participar</p>
            <h2>Del Bootcamp a la Gran Final</h2>
            <div className={s.pasos}>
              <div className={s.paso}><b>El viernes 27 de noviembre</b>, después del pitch de los sponsors, cada equipo elige su track.</div>
              <div className={s.paso}><b>El líder</b> se une al track y, automáticamente, todo su equipo se une con él.</div>
              <div className={s.paso}><b>Equipos de 2 a 4 personas</b>, de las carreras o facultades que quieran. <span className={s.nuevo}>Nuevo</span> A pedido de ustedes, ya no es obligatorio que sean distintas.</div>
              <div className={s.paso}><b>Antes del sábado 28 por la noche</b> el equipo entrega su primera propuesta. Pasan 5 equipos por track.</div>
            </div>
            <p className={s.nota}>
              El ganador del track se anuncia en la Gran Final del sábado 5 de diciembre, en el Auditorio CTIC de la UNI.
            </p>
          </div>
        </section>

        <section id="unete" className={s.unete}>
          <div className={s.in}>
            <div className={s.oscuro}>
              <p className={s.sobre} style={{ color: "#87e3c4" }}>Únete a este track</p>
              <h2>¿Listos para el reto de Zeia?</h2>
              <p className={`${s.lead} ${s.sub}`} style={{ marginTop: 12, color: "#cdeee3" }}>
                El líder del equipo se une desde aquí, el viernes 27 de noviembre.
              </p>
              <div className="box">
                <UnirseTrack slug={slug} />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className={s.pie}>
        <div className={s.in}>
          <a href={desde("https://zeia.com.pe/")} target="_blank" rel="noopener" className={s.pieOscuro} aria-label="Powered by Zeia">
            <span>Track powered by</span>
            <Image src="/logos/zeia-blanco.png" width={154} height={50} alt="Zeia" unoptimized className={s.logoPie} />
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
