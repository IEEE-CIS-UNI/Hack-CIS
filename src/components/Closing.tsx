import Image from "next/image";
import Countdown from "./Countdown";

export default function Closing() {
  return (
    <section className="closing">
      <div className="rb">
        <Image src="/robot.webp" width={330} height={300} unoptimized alt="Robot de CIS UNI con un megáfono" />
        <p className="bubble">¡A construir!</p>
      </div>
      <h2 className="h2" style={{ marginTop: 34 }}>
        Ya empezó.
        <br />
        <span className="lav">A construir.</span>
      </h2>
      <div className="cta-row">
        <a className="cta" href="/mi-inscripcion">
          Iniciar sesión →
        </a>
        <Countdown />
      </div>
    </section>
  );
}
