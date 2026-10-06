export default function Visor({ mood = "idle" }: { mood?: "idle" | "happy" }) {
  return (
    <div data-mood={mood} className="visor" role="img" aria-label="Visor del agente de IA">
      <span className="visor-ear" style={{ left: "-3.2%" }} aria-hidden />
      <span className="visor-ear" style={{ right: "-3.2%" }} aria-hidden />
      <div className="visor-frame">
        <div className="visor-glass">
          <div className="visor-eyes" aria-hidden>
            <span className="eye" />
            <span className="eye" />
          </div>
          <div
            className="hud absolute top-[10%] left-1/2 hidden -translate-x-1/2 items-center gap-2 text-[0.65rem] whitespace-nowrap text-mist/70 sm:flex"
            aria-hidden
          >
            Agente #5 <span className="led size-1.5 rounded-full bg-glow" /> <span className="text-glow">En línea</span>
          </div>
        </div>
      </div>
    </div>
  );
}
