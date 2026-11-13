import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Footer from "@/components/Footer";
import Nav from "@/components/Nav";
import StarField from "@/components/StarField";

export const metadata: Metadata = {
  title: "Bases · HACK[CIS] UNI 2026",
  description: "Reglas de participación, tratamiento de datos y licencia piloto de HACK[CIS] UNI 2026.",
};

/**
 * Las bases que acepta quien se inscribe.
 *
 * El formulario pide marcar «acepto las bases» y enlaza aquí: si esta página
 * no existe, se está pidiendo aceptar algo que nadie puede leer. Por eso el
 * contenido sale de lo que el sitio ya afirma (preguntas frecuentes, tracks,
 * cupos) y de cómo está hecho el sistema de inscripción, no de supuestos.
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
            HACK[CIS] UNI 2026 · The Agentic Era. Organizado por IEEE CIS UNI, DSC PUCP
            y DSC UNI.
          </p>

          <Seccion n="01" titulo="Quién puede participar">
            <p>
              Estudiantes universitarios y de institutos de todo el país, con matrícula
              vigente y correo institucional propio. La inscripción se verifica contra ese correo: sin confirmarlo, no hay
              inscripción.
            </p>
            <ul>
              <li>Hay <strong className="text-white">250 cupos</strong>, por orden de inscripción.</li>
              <li>Te inscribes de forma individual, no en equipo.</li>
              <li>Una persona, una inscripción. El documento de identidad no se puede repetir.</li>
            </ul>
          </Seccion>

          <Seccion n="02" titulo="Equipos">
            <p>
              Los equipos se arman durante el Bootcamp, no al inscribirse.
            </p>
            <ul>
              <li>De <strong className="text-white">2 a 4 integrantes</strong>.</li>
              <li>Al menos <strong className="text-white">2 carreras o facultades distintas</strong> por equipo.</li>
              <li>Cada equipo compite en un solo track.</li>
            </ul>
          </Seccion>

          <Seccion n="03" titulo="Tracks">
            <ul>
              <li><strong className="text-white">IA &amp; Energía</strong></li>
              <li>Otros dos tracks, por anunciar.</li>
            </ul>
            <p>El track se elige al inscribirse y se puede cambiar desde tu ficha hasta el cierre del Bootcamp.</p>
          </Seccion>

          <Seccion n="04" titulo="Etapas">
            <ul>
              <li><strong className="text-white">Bootcamp</strong> — virtual, del 23 al 27 de noviembre. Abierto a todos los inscritos.</li>
              <li><strong className="text-white">Build</strong> — desde el 30 de noviembre, pasan <strong className="text-white">15 equipos</strong>.</li>
              <li><strong className="text-white">Gran Final</strong> — presencial, sábado 5 de diciembre, Auditorio CTIC de la UNI.</li>
            </ul>
            <p>Las inscripciones abren el 13 de noviembre de 2026.</p>
          </Seccion>

          <Seccion n="05" titulo="Evaluación y premios">
            <Pendiente>
              Los criterios de evaluación, la composición del jurado y los premios dependen de
              los acuerdos con los sponsors y aún no están cerrados. Se publican aquí antes del
              inicio del Bootcamp y se avisa por correo a todos los inscritos.
            </Pendiente>
          </Seccion>

          <Seccion n="06" titulo="De quién es lo que construyes">
            <p>
              <strong className="text-white">La solución es de tu equipo.</strong> La organización no
              reclama propiedad sobre el código, el diseño ni la idea.
            </p>
            <p>
              <strong className="text-white">Cláusula de licencia piloto:</strong> el equipo ganador de
              cada track otorga al sponsor de ese track una licencia{" "}
              <strong className="text-white">no exclusiva, sin transferencia de propiedad</strong>, con el
              único fin de evaluar y pilotear la solución. No incluye explotación comercial ni
              cesión a terceros, y el equipo conserva el derecho de usar, publicar y licenciar su
              trabajo a quien quiera.
            </p>
            <p>
              Los equipos que no ganan no otorgan licencia alguna.
            </p>
          </Seccion>

          <Seccion n="07" titulo="Tus datos personales">
            <p>
              Tratamos tus datos conforme a la <strong className="text-white">Ley 29733</strong> de
              Protección de Datos Personales y su reglamento, con la única finalidad de organizar
              este evento.
            </p>
            <p className="font-bold text-white">Qué guardamos</p>
            <ul>
              <li>Tu nombre, tal como figura en tu documento de identidad.</li>
              <li>Tu correo institucional y tu número de celular.</li>
              <li>Tu universidad, carrera, año de estudios, track y nivel.</li>
              <li>
                Tu DNI <strong className="text-white">no se guarda</strong>: de él solo conservamos
                una huella criptográfica irreversible, que sirve para impedir inscripciones
                duplicadas y para que tu líder pueda sumarte a su equipo, y nada más.
              </li>
            </ul>
            <p className="font-bold text-white">Para qué</p>
            <ul>
              <li>Verificar que eres estudiante y que la inscripción es tuya.</li>
              <li>Comunicarte lo del evento por correo y por mensajería.</li>
              <li>Darte acceso a los canales de tu track en Discord.</li>
              <li>Estadísticas agregadas y anónimas sobre participación.</li>
            </ul>
            <p className="font-bold text-white">Qué puedes hacer</p>
            <ul>
              <li>Ver y corregir tus datos cuando quieras en <Link href="/mi-inscripcion">tu ficha</Link>.</li>
              <li>
                Pedir que borremos tu inscripción escribiéndonos. La eliminamos completa, sin
                condiciones y sin pedirte explicaciones.
              </li>
            </ul>
            <p>
              No vendemos ni cedemos tus datos. Los sponsors reciben estadísticas agregadas,
              nunca tu información individual sin tu permiso expreso.
            </p>
            <Pendiente>
              Falta publicar aquí el correo de contacto para ejercer estos derechos.
            </Pendiente>
          </Seccion>

          <Seccion n="08" titulo="Conducta">
            <p>
              Esperamos respeto. Queda fuera del evento quien acose, discrimine o agreda a otra
              persona, presente trabajo ajeno como propio o manipule el proceso de inscripción
              o evaluación.
            </p>
            <p>
              Las decisiones sobre conducta las toma la organización y son inapelables, pero
              siempre se comunican con su motivo.
            </p>
          </Seccion>

          <Seccion n="09" titulo="Cambios en estas bases">
            <p>
              Si algo cambia, se actualiza esta página y se avisa por correo a todos los
              inscritos. Nunca se cambian las reglas de una etapa que ya empezó.
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
