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
    "Quién puede participar, cómo inscribirse, etapas y fechas, equipos y tracks, licencia piloto y tratamiento de datos de HACK[CIS] UNI 2026.",
};

/**
 * Las bases que acepta quien se inscribe.
 *
 * El formulario pide marcar «acepto las bases» y enlaza aquí: si esta página
 * no existe, se está pidiendo aceptar algo que nadie puede leer. Por eso el
 * contenido sale de lo que el sitio ya afirma (fechas, cupos, tracks, reglas de
 * equipo) y de cómo está hecho el sistema de inscripción, no de supuestos.
 *
 * Lo que todavía no está decidido aparece marcado como pendiente en vez de
 * rellenarse con algo verosímil: unas bases con un dato inventado son peores
 * que unas bases con un hueco honesto.
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

function Pendiente({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-amber-300/30 bg-amber-300/5 px-4 py-3 text-amber-200/90">
      <strong className="font-bold">Por definir.</strong> {children}
    </p>
  );
}

const B = ({ children }: { children: React.ReactNode }) => <strong className="text-white">{children}</strong>;

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
            HACK[CIS] UNI 2026 · The Agentic Era. Organizado por IEEE CIS UNI, DSC PUCP y DSC UNI.
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
                Hay <B>250 cupos</B> en la hackathon, por orden de inscripción. Al llenarse no se reservan más.
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
            <p>Las inscripciones abren el <B>13 de noviembre de 2026</B>. Hay dos formas de entrar:</p>
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
                Opcional en ambos: LinkedIn, GitHub, usuario de Discord y cómo te enteraste del evento.
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
                <B>Viernes 27 de noviembre</B> — los sponsors presentan su reto y los equipos eligen track.
              </li>
              <li>
                <B>Propuesta</B> — cada equipo entrega su primera propuesta, hasta la noche del sábado 28.
              </li>
              <li>
                <B>Finalistas</B> — el lunes 30 de noviembre a las 6:00 pm se anuncian los{" "}
                <B>15 equipos</B> que pasan, 5 por track. Los demás se llevan todo lo aprendido.
              </li>
              <li>
                <B>Build</B> — unas 100 horas, desde el lunes 30 de noviembre por la noche hasta la Gran Final,
                con mentores y mini-retos con premios.
              </li>
              <li>
                <B>Gran Final</B> — presencial, sábado 5 de diciembre, en el Auditorio CTIC de la UNI, durante
                todo el día. Habrá feria de stands. Para los finalistas, lo ideal es que al menos una
                persona del equipo pueda asistir en Lima.
              </li>
            </ul>
          </Seccion>

          <Seccion n="04" titulo="Equipos y tracks">
            <p>Los equipos se arman durante el Bootcamp, no al inscribirse.</p>
            <ul>
              <li>De <B>2 a 4 integrantes</B>, que estén inscritos en la hackathon y no tengan otro equipo.</li>
              <li>
                Al menos <B>2 carreras distintas</B> por equipo, según la carrera elegida en la inscripción.
              </li>
              <li>Hay <B>tres tracks</B>, y todavía son un secreto: los tracks y sus sponsors se anuncian pronto.</li>
              <li>
                El track <B>no se elige al inscribirse</B>. El viernes 27, después del pitch de los sponsors, la
                persona líder crea el equipo desde la página del track: pone el nombre del equipo y el DNI de
                sus compañeros, y todos quedan asignados a ese track.
              </li>
              <li>
                Cada equipo compite en un solo track. Mientras el plazo siga abierto, quien se equivocó puede
                salir de su equipo desde su panel.
              </li>
            </ul>
          </Seccion>

          <Seccion n="05" titulo="Evaluación y premios">
            <Pendiente>
              Los criterios de evaluación, la composición del jurado, los mentores y los premios dependen de
              los acuerdos con los sponsors y aún no están cerrados. Se publican aquí y en la comunidad de
              WhatsApp antes del inicio del Build.
            </Pendiente>
          </Seccion>

          <Seccion n="06" titulo="De quién es lo que construyes">
            <p>
              <B>La solución es de tu equipo.</B> La organización no reclama propiedad sobre el código, el
              diseño ni la idea.
            </p>
            <p>
              <B>Cláusula de licencia piloto:</B> el equipo ganador de cada track otorga al sponsor de ese track
              una licencia <B>no exclusiva, sin transferencia de propiedad</B>, con el único fin de evaluar y
              pilotear la solución. No incluye explotación comercial ni cesión a terceros, y el equipo conserva
              el derecho de usar, publicar y licenciar su trabajo a quien quiera.
            </p>
            <p>Los equipos que no ganan no otorgan licencia alguna.</p>
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
                sirve para impedir inscripciones duplicadas y para que tu líder pueda sumarte a su equipo, y nada más.
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
            </ul>
            <p className="font-bold text-white">Qué puedes hacer</p>
            <ul>
              <li>Ver y corregir tus datos cuando quieras en <Link href="/mi-inscripcion">tu panel</Link>.</li>
              <li>
                Pedir que borremos tu inscripción escribiéndonos por{" "}
                <a href={LINKS.instagram} target="_blank" rel="noopener noreferrer">Instagram</a> o{" "}
                <a href={LINKS.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>. La eliminamos
                completa, sin condiciones y sin pedirte explicaciones.
              </li>
            </ul>
            <p>
              No vendemos ni cedemos tus datos. Los sponsors reciben estadísticas agregadas, nunca tu
              información individual sin tu permiso expreso.
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
