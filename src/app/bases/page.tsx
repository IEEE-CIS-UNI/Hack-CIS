import { Cinta } from "@/components/Nuevo";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Footer from "@/components/Footer";
import Nav from "@/components/Nav";
import StarField from "@/components/StarField";
import { SESIONES } from "@/lib/contenido";
import { LINKS } from "@/lib/config";

export const metadata: Metadata = {
  title: "Bases · HACK[CIS] UNI 2026",
  description:
    "Quién puede participar, cómo inscribirse, etapas y fechas, equipos y tracks, licencia open source (MIT) y tratamiento de datos de HACK[CIS] UNI 2026.",
};

/**
 * Las bases que acepta quien se inscribe.
 *
 * El formulario pide marcar «acepto las bases» y enlaza aquí: si esta página
 * no existe, se está pidiendo aceptar algo que nadie puede leer. Por eso el
 * contenido sale de lo que el sitio ya afirma (fechas, cupos, tracks, reglas de
 * equipo) y de cómo está hecho el sistema de inscripción, no de supuestos.
 *
 * Lo que todavía no está decidido se omite en vez de rellenarse con algo verosímil: unas bases con un dato
 * inventado son peores que unas bases con un hueco.
 */

function Seccion({ n, titulo, children }: { n: string; titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-14 first:mt-0">
      <p className="hud text-lavender">{n}</p>
      <h2 className="display mt-2 text-[clamp(1.5rem,4vw,2.4rem)]">{titulo}</h2>
      <div className="mt-4 flex flex-col gap-3 text-mist/85 [&_a]:text-lavender [&_a]:underline [&_a]:underline-offset-4 [&_li]:ml-5 [&_li]:list-disc">
        {children}
      </div>
    </section>
  );
}

const B = ({ children }: { children: React.ReactNode }) => <strong className="text-white">{children}</strong>;

/** Rúbrica de la primera propuesta: con ella se eligen los 25 equipos que construyen. Suma 100. */
const RUBRICA: [string, string, number][] = [
  ["Problema y reto del track", "Entiende el reto del sponsor y lo plantea con claridad: a quién afecta y por qué importa.", 20],
  ["Solución propuesta", "Responde al problema, aporta valor y se explica en pocas líneas.", 20],
  ["Uso de agentes de IA", "Qué hará el agente, con qué herramientas y por qué la solución lo necesita.", 20],
  ["Viabilidad y plan de desarrollo", "Alcanzable en 100 horas: alcance realista, hitos y roles del equipo.", 20],
  ["Estructura de la propuesta", "Incluye problema, solución, tecnología, plan y uso de IA. Ordenada y legible.", 20],
];
/** [track, equipos que pasan a construir, finalistas que hacen pitch] */
const PASAN: [string, string, string][] = [
  ["IA & Energía (Zeia)", "5", "5"],
  ["IA & Cloud (Manantial)", "5", "5"],
  ["IA & Fintech (Millennium), track dorado", "15", "5 de los 15"],
];
/** Rúbrica de la Gran Final: peso de cada criterio en porcentaje. */
const RUBRICA_FINAL: [string, number][] = [
  ["Impacto en el negocio (reto del track)", 50],
  ["Viabilidad técnica y prototipo", 20],
  ["Creatividad de la solución", 20],
  ["Uso de agentes de IA", 5],
  ["Calidad del pitch final", 5],
];
const celda = "border-b border-white/10 px-2.5 py-3 text-left align-top sm:px-3";
const cabeza = `${celda} hud text-lavender max-sm:!text-[0.5rem] max-sm:!tracking-[0.08em]`;

export default function BasesPage() {
  return (
    <>
      <StarField />
      <div className="nebula" aria-hidden />
      <Nav />
      <main className="px-5 pt-28 pb-20 sm:px-10">
        <div className="mx-auto w-full max-w-3xl">

          <p className="hud text-lavender">Bases</p>
          <h1 className="display mt-3 text-[clamp(2.2rem,7vw,4.5rem)]">
            Reglas del<br /><span className="text-lavender">juego</span>
          </h1>
          <p className="mt-6 text-lg text-mist/85">
            HACK[CIS] UNI 2026 · The Agentic Era. Organizado por IEEE CIS UNI y DSC UNI.
            Una hackathon nacional de 100 horas, con un bootcamp virtual de preparación y una
            Gran Final presencial.
          </p>

          <Seccion n="01" titulo="Quién puede participar">
            <ul>
              <li>
                <B>Hackathon:</B> estudiantes universitarios y de institutos de todo el país, con correo
                institucional de su universidad o instituto. La inscripción se verifica con ese correo: sin
                confirmarlo, no hay inscripción.
              </li>
              <li>
                Hay <B>250 cupos</B> en la hackathon, por orden de inscripción. Al llenarse queda una <B>lista de espera de hasta 50 personas</B>: si alguien libera su lugar, quien sigue en la lista sube solo. Por eso se pide confirmar la asistencia antes del miércoles 25 de noviembre, 3:00 p. m. (hora de Lima); quien no confirma puede perder su lugar.
              </li>
              <li>
                Quien sube de la lista de espera tiene su <B>propio plazo para confirmar</B>, indicado en el correo. Quien
                pierde su lugar por no confirmar y quiere volver, entra <B>al final de la fila</B>, si aún hay sitio.
              </li>
              <li>
                <B>Bootcamp:</B> abierto a cualquier persona, sin costo y sin límite de cupos. Puedes entrar
                con cualquier correo, participes o no en la hackathon.
              </li>
              <li>Te inscribes de forma individual, no en equipo.</li>
              <li>Una persona, una inscripción. El documento de identidad no se puede repetir.</li>
            </ul>
          </Seccion>

          <Seccion n="02" titulo="Cómo inscribirte">
            <p>Las inscripciones abren el <B>13 de noviembre de 2026</B>. Las de la <B>hackathon cierran el miércoles 25 de noviembre a las 11:59 p. m.</B> (hora de Lima); el bootcamp sigue abierto. Hay dos formas de entrar:</p>
            <ul>
              <li>
                <B>Hack + Bootcamp:</B> la hackathon y las sesiones del bootcamp que quieras. El bootcamp va
                incluido para quien entra a la hackathon.
              </li>
              <li><B>Solo Bootcamp:</B> eliges las sesiones que te interesen, sin DNI ni correo institucional.</li>
            </ul>
            <p className="font-bold text-white">Qué se pide</p>
            <ul>
              <li>
                Para la hackathon: DNI, nombres y apellidos, correo institucional, celular, carrera (de una
                lista) y ciclo del 1 al 10. El nivel es opcional.
              </li>
              <li>Para el bootcamp: nombres, apellidos y correo. El celular es opcional.</li>
              <li>
                Opcional en ambos: LinkedIn, GitHub, usuario de Discord, cómo te enteraste del evento y si quieres que
                las empresas sponsor te conozcan (ver la sección 07).
              </li>
            </ul>
            <p>
              Los datos de nombre y DNI los escribes tú y tienen que ser los tuyos. La organización puede
              pedirte tu documento de identidad para comprobarlos, y puede anular las inscripciones que
              tengan datos falsos.
            </p>
            <p>
              Después de confirmar tu correo, la hackathon te da una <B>card</B> para compartir, a la que puedes
              sumar tu foto o la imagen que quieras, y un <B>código personal</B> para entrar a Discord.
            </p>
          </Seccion>

          <Seccion n="03" titulo="Etapas y fechas">
            <ul>
              <li>
                <B>Bootcamp</B> — virtual, del 23 al 27 de noviembre. Cinco sesiones:{" "}
                {SESIONES.map((s) => s.title).join("; ")}.
              </li>
              <li>
                <B>Viernes 27 de noviembre, 8:30 p. m.</B> — presentación de sponsors: cada uno expone su reto y, durante esa sesión, se activa la elección de track.
              </li>
              <li>
                <B>Propuesta</B> — cada equipo entrega su primera propuesta <B>hasta el sábado 28 de noviembre a las 11:59 p. m.</B>, en la página <Link href="/equipos/mi-equipo">«Mi equipo»</Link>: enlace al repositorio, PDF con las láminas e idea. Sin equipo no se puede entregar.
              </li>
              <li>
                <B>Finalistas</B> — el lunes 30 de noviembre a las 6:00 pm se anuncian los{" "}
                <B>25 equipos</B> que pasan: 5 en Energía, 5 en Cloud y 15 en Fintech. En la Gran Final hacen pitch <B>15 finalistas, 5 por track</B>: los 5 de Fintech los elige Millennium entre sus 15 y se anuncian en la misma Gran Final. Los demás se llevan todo lo aprendido.
              </li>
              <li>
                <B>Build</B> — unas 100 horas, desde el lunes 30 de noviembre por la noche hasta la Gran Final,
                con mentores y mini-retos con premios. La solución debe responder al reto que el sponsor presenta el
                viernes 27; puedes apoyarte en herramientas, librerías y código abierto existentes.
              </li>
              <li>
                <B>Gran Final</B> — presencial, sábado 5 de diciembre, en el Auditorio CTIC de la UNI, durante
                todo el día. Habrá feria de stands, y los mini-retos y premios son para{" "}
                <B>todas las personas que asistan</B>, no solo para quienes participan en la hackathon. Para los
                finalistas, lo ideal es que al menos una persona del equipo pueda asistir en Lima.
              </li>
              <li>
                <B>Pitch final</B> — formato libre: cada equipo finalista tiene <B>hasta 4 minutos</B> de pitch y{" "}
                <B>hasta 2 minutos</B> de preguntas.
              </li>
            </ul>
          </Seccion>

          <Seccion n="04" titulo="Equipos y tracks">
            <p>Los equipos se arman durante el Bootcamp, no al inscribirse.</p>
            <ul>
              <li>De <B>2 a 4 integrantes</B>, que estén inscritos en la hackathon y no tengan otro equipo.</li>
              <li>
                <B>La plataforma de equipos abre el miércoles 25 de noviembre a las 8:00 p. m.</B> y cierra el jueves 26 a las 11:59 p. m. (hora de Lima). Ahí cada quien crea su equipo o se une a uno; el track se elige después.
              </li>
              <li>
                <Cinta chica /> <B>A pedido de ustedes, ya no es obligatorio</B> que el equipo tenga carreras o
                facultades distintas: es opcional. Un equipo diverso suele complementarse mejor, pero cada quien
                arma su equipo con quienes prefiera.
              </li>
              <li>Hay <B>tres tracks</B>. Son <B>IA &amp; Energía</B>, con Zeia como sponsor; <B>IA &amp; Cloud</B>, con Manantial; e <B>IA &amp; Fintech</B>, con Millennium: el <B>track dorado</B>.</li>
              <li>
                El track <B>no se elige al inscribirse</B>: el viernes 27, durante la presentación de sponsors (8:30 p. m.), cada
                equipo elige el suyo.
              </li>
              <li>
                Lo elige la <B>persona líder</B> para todo el equipo, que necesita al menos <B>2 integrantes</B>. La elección
                se activa en vivo durante la presentación y <B>cierra el sábado 28 a las 11:59 p. m.</B>
              </li>
              <li>
                <B>Fintech acepta hasta 40 equipos</B>, por orden de elección. Energía y Cloud no tienen tope.
              </li>
              <li>
                Cada equipo compite en un solo track. Mientras la elección siga abierta, la persona líder puede
                cambiarlo (a Fintech, solo si queda cupo).
              </li>
            </ul>
          </Seccion>

          <Seccion n="05" titulo="Evaluación y premios">
            <p className="font-bold text-white">Ronda 1 · selección de los 25 equipos (100 puntos)</p>
            <p>Se califica la primera propuesta de cada equipo con esta rúbrica:</p>
            <div className="overflow-hidden rounded-xl border border-white/15">
              <table className="w-full border-collapse text-[0.95rem]">
                <thead><tr><th scope="col" className={cabeza}>Criterio y qué se revisa</th><th scope="col" className={`${cabeza} w-20 !text-right`}>Puntos</th></tr></thead>
                <tbody>
                  {RUBRICA.map(([criterio, revisa, puntos]) => (
                    <tr key={criterio}><td className={celda}><B>{criterio}</B><br />{revisa}</td><td className={`${celda} !text-right font-bold text-white`}>{puntos}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 font-bold text-white">Proceso de selección</p>
            <ul>
              <li>Cada propuesta la revisan <B>2 revisores internos</B> por separado; el puntaje final es el <B>promedio</B>.</li>
              <li>Si la diferencia entre ambos supera los <B>15 puntos</B>, un <B>tercer revisor</B> también la puntúa y se promedian los dos puntajes más cercanos.</li>
              <li>Pasan a construir <B>25 equipos</B>: los de mayor puntaje en cada track, según la tabla.</li>
              <li><B>Desempate:</B> mayor puntaje en «Solución propuesta»; si sigue el empate, en «Viabilidad y plan de desarrollo».</li>
              <li><B>Conflicto de interés:</B> quien revisa lo declara si conoce a un equipo, y no lo puntúa.</li>
            </ul>
            <div className="overflow-hidden rounded-xl border border-white/15">
              <table className="w-full border-collapse text-[0.95rem]">
                <thead><tr><th scope="col" className={cabeza}>Track</th><th scope="col" className={cabeza}>Construyen</th><th scope="col" className={cabeza}>Pitch final</th></tr></thead>
                <tbody>
                  {PASAN.map(([track, construyen, pitch]) => (
                    <tr key={track}><td className={celda}><B>{track}</B></td><td className={celda}>{construyen}</td><td className={celda}>{pitch}</td></tr>
                  ))}
                  <tr><td className={celda}><B>Total</B></td><td className={`${celda} font-bold text-white`}>25</td><td className={`${celda} font-bold text-white`}>15</td></tr>
                </tbody>
              </table>
            </div>
            <p>En Fintech, los 5 finalistas los elige <B>Millennium</B> entre los 15 que construyen y se anuncian en la misma Gran Final.</p>
            <p className="mt-4 font-bold text-white">Gran Final · rúbrica de evaluación</p>
            <div className="overflow-hidden rounded-xl border border-white/15">
              <table className="w-full border-collapse text-[0.95rem]">
                <thead><tr><th scope="col" className={cabeza}>Criterio</th><th scope="col" className={`${cabeza} w-20 !text-right`}>Peso</th></tr></thead>
                <tbody>
                  {RUBRICA_FINAL.map(([criterio, peso]) => (
                    <tr key={criterio}><td className={celda}><B>{criterio}</B></td><td className={`${celda} !text-right font-bold text-white`}>{peso}%</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 font-bold text-white">Premios</p>
            <p>Premios confirmados hasta ahora. Se entregan <B>en vivo en la Gran Final</B> o, a más tardar, en <B>5 días hábiles</B>:</p>
            <ul>
              <li><B>S/ 500</B> para el equipo ganador de cada uno de los tracks Energía y Cloud (en total, <B>S/ 2 000</B> en premios entre los tres tracks).</li>
              <li><B>Track dorado (Fintech, con Millennium):</B> <B>S/ 1 000</B> para el equipo ganador y una <B>carta oferta para cada integrante</B> para entrar a trabajar en Millennium, con una entrevista de por medio.</li>
              <li><B>Sorteo de cursos en vivo</B>, durante la semana y en la Gran Final.</li>
              <li><B>Sorteo de merch.</B></li>
              <li>Mini-retos con premios para todas las personas que asistan a la Gran Final. Los sorteos de ese día son solo para quienes están en la sala.</li>
            </ul>
          </Seccion>

          <Seccion n="06" titulo="De quién es lo que construyes">
            <p>
              <B>La autoría es de tu equipo.</B> La organización no reclama propiedad sobre el código, el
              diseño ni la idea.
            </p>
            <p>
              <B>Open source con licencia MIT:</B> las soluciones quedan como un repositorio open source con
              licencia MIT. El equipo conserva su autoría (su nombre en el aviso de la licencia) y la solución queda
              a total disposición de las empresas, incluido el sponsor del track, para evaluarla y pilotearla sin
              comprarla.
            </p>
          </Seccion>

          <Seccion n="07" titulo="Tus datos personales">
            <p>
              Tratamos tus datos conforme a la <B>Ley 29733</B> de Protección de Datos Personales y su
              reglamento, con la única finalidad de organizar este evento.
            </p>
            <p className="font-bold text-white">Qué guardamos</p>
            <ul>
              <li>Tu nombre, tu correo y tu número de celular.</li>
              <li>Tu universidad o instituto (la deducimos del dominio de tu correo), tu carrera, tu ciclo y tu nivel.</li>
              <li>
                Tu DNI <B>no se guarda</B>: de él solo conservamos una huella criptográfica irreversible, que
                sirve para impedir inscripciones duplicadas, y nada más.
              </li>
              <li>Si los das: tu LinkedIn, tu GitHub, tu usuario de Discord, tu foto o imagen y cómo te enteraste del evento.</li>
              <li>Tus inscripciones (hackathon y sesiones del bootcamp) y tu equipo.</li>
            </ul>
            <p className="font-bold text-white">Para qué</p>
            <ul>
              <li>Verificar que eres estudiante y que la inscripción es tuya.</li>
              <li>Comunicarte lo del evento por correo y por mensajería.</li>
              <li>Darte acceso a la comunidad y a los canales de la hackathon en Discord.</li>
              <li>Armar y validar equipos.</li>
              <li>Estadísticas agregadas y anónimas sobre participación.</li>
              <li>Solo si tú lo autorizas: que las empresas sponsor te conozcan (abajo te contamos cómo).</li>
            </ul>
            <p className="font-bold text-white">Qué puedes hacer</p>
            <ul>
              <li>Ver y corregir tus datos cuando quieras en <Link href="/mi-inscripcion">tu panel</Link>.</li>
              <li>
                Pedir que borremos tu inscripción escribiéndonos por{" "}
                <a href={LINKS.instagram} target="_blank" rel="noopener noreferrer">Instagram</a> o{" "}
                <a href={LINKS.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>, o al correo{" "}
                <a href="mailto:ieee.cis@uni.edu.pe">ieee.cis@uni.edu.pe</a>. La eliminamos
                completa, sin condiciones y sin pedirte explicaciones.
              </li>
            </ul>
            <p className="font-bold text-white">Las empresas sponsor y tú</p>
            <p>
              Los sponsors apuestan por el talento joven y, al terminar el evento, les encantaría conocer a quienes
              participaron: para ofrecer prácticas, empleo o proyectos. Por eso te invitamos a marcar, si quieres, la casilla
              opcional <B>«Quiero que las empresas sponsor me conozcan»</B> al inscribirte.
            </p>
            <ul>
              <li>
                <B>Es tu decisión.</B> No marcarla no afecta tu participación ni tus premios.
              </li>
              <li>
                <B>Qué compartiríamos:</B> tu nombre, universidad o instituto, carrera, ciclo, nivel, correo, celular, y tu
                LinkedIn y GitHub si los pusiste. Tu DNI no, porque ni siquiera lo guardamos.
              </li>
              <li>
                <B>Cuándo:</B> una sola vez, al terminar el evento, con las empresas sponsor del evento. Les pedimos que
                usen los datos solo para contactarte por oportunidades relacionadas con el evento.
              </li>
              <li>
                <B>Cámbialo cuando quieras</B> desde <Link href="/mi-inscripcion">tu panel</Link>: si lo desmarcas, dejas
                de estar en esa lista.
              </li>
            </ul>
            <p>
              Si no lo marcas, tus datos individuales no se entregan a nadie: los sponsors solo reciben estadísticas
              agregadas y anónimas. No vendemos tus datos.
            </p>
          </Seccion>

          <Seccion n="08" titulo="Comunidad y Discord">
            <ul>
              <li>
                Los avisos oficiales van por la{" "}
                <a href={LINKS.whatsapp} target="_blank" rel="noopener noreferrer">comunidad de WhatsApp</a>, y el
                material del bootcamp y los canales de la hackathon, por el{" "}
                <a href={LINKS.discord} target="_blank" rel="noopener noreferrer">servidor de Discord</a>.
              </li>
              <li>
                Quien entra a la hackathon recibe un código de 4 letras y 4 números. Es personal y de un solo
                uso: se canjea en el bot del servidor y no debe compartirse.
              </li>
            </ul>
          </Seccion>

          <Seccion n="09" titulo="Conducta">
            <p>
              Esperamos respeto. Queda fuera del evento quien acose, discrimine o agreda a otra persona,
              presente trabajo ajeno como propio o manipule el proceso de inscripción o evaluación.
            </p>
            <p>
              Las decisiones sobre conducta las toma la organización y son inapelables, pero siempre se
              comunican con su motivo.
            </p>
          </Seccion>

          <Seccion n="10" titulo="Cambios en estas bases">
            <p>
              Si algo cambia, se actualiza esta página y se avisa por la comunidad de WhatsApp. Nunca se
              cambian las reglas de una etapa que ya empezó.
            </p>
            <ul>
              <li>
                <Cinta chica /> <B>25 de noviembre:</B> se publicaron las rúbricas y el proceso de selección, la presentación
                de sponsors quedó el viernes 27 a las 8:30 p. m. y se detallaron los plazos de tracks, entrega y premios.
              </li>
              <li>
                <Cinta chica /> <B>22 de noviembre:</B> se eliminó la regla de que el equipo tuviera al menos 2 carreras o
                facultades distintas; ahora es opcional.
              </li>
            </ul>
          </Seccion>

          <div className="mt-16">
            <Link
              href="/registro"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 font-bold text-white transition-colors hover:border-lavender hover:text-lavender"
            >
              <ArrowLeft className="size-5" aria-hidden /> Volver a la inscripción
            </Link>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
