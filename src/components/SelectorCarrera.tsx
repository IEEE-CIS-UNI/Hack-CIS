"use client";

/**
 * Selector de carrera con búsqueda: escribes unas letras («sist», «civil», «psico»)
 * y la lista se acorta sola. Funciona con teclado (↑ ↓ Enter Esc) y en el celular
 * la lista baja debajo del campo, sin ventanas flotantes.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { SLUG_OTRA, porArea, type Carrera } from "@/lib/carreras";

const plano = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("es").trim();

export default function SelectorCarrera({
  id, carreras, valor, alElegir,
}: {
  id: string;
  carreras: Carrera[];
  valor: string;
  alElegir: (id: string) => void;
}) {
  const [texto, setTexto] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [activa, setActiva] = useState(0);
  const caja = useRef<HTMLInputElement>(null);

  // Con el teclado, la opción activa siempre queda a la vista.
  useEffect(() => {
    if (abierto) document.querySelector(`#${id}-lista .cs-op.on`)?.scrollIntoView({ block: "nearest" });
  }, [activa, abierto, id]);

  const elegida = carreras.find((c) => String(c.id) === valor);

  const { grupos, planas } = useMemo(() => {
    const palabras = plano(texto).split(/\s+/).filter(Boolean);
    const coincide = (c: Carrera) => {
      if (!palabras.length) return true;
      const pajar = plano(c.name + " " + c.field);
      return palabras.every((p) => pajar.includes(p));
    };
    const otra = carreras.find((c) => c.slug === SLUG_OTRA);
    const normales = carreras.filter((c) => c.slug !== SLUG_OTRA && coincide(c));
    const g = porArea(normales);
    const lista = normales.slice();
    if (otra) { g.push(["¿No la ves?", [otra]]); lista.push(otra); }
    return { grupos: g, planas: lista };
  }, [carreras, texto]);

  function elegir(c: Carrera) {
    alElegir(String(c.id));
    setTexto("");
    setAbierto(false);
    caja.current?.blur();
  }

  function teclas(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setAbierto(true); setActiva((a) => Math.min(a + 1, planas.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiva((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter") { if (abierto && planas[activa]) { e.preventDefault(); elegir(planas[activa]); } }
    else if (e.key === "Escape") { setAbierto(false); setTexto(""); }
  }

  return (
    <div className="cs">
      <input
        ref={caja}
        id={id}
        role="combobox"
        aria-expanded={abierto}
        aria-controls={id + "-lista"}
        aria-autocomplete="list"
        autoComplete="off"
        spellCheck={false}
        className="rg-input cs-in"
        value={abierto ? texto : (elegida?.name ?? texto)}
        placeholder="Escribe para buscar: sistemas, civil, psicología…"
        onFocus={() => { setAbierto(true); setTexto(""); setActiva(0); }}
        onClick={() => setAbierto(true)}
        onBlur={() => setAbierto(false)}
        onChange={(e) => { setTexto(e.target.value); setAbierto(true); setActiva(0); }}
        onKeyDown={teclas}
      />
      {elegida && !abierto && (
        <button type="button" className="cs-cambiar" onClick={() => { setAbierto(true); caja.current?.focus(); }}>
          Cambiar
        </button>
      )}

      {abierto && (
        <div className="cs-lista" id={id + "-lista"} role="listbox" onMouseDown={(e) => e.preventDefault()}>
          {planas.length === 0 && <p className="cs-vacio">No encontramos «{texto}». Prueba con otra palabra.</p>}
          {grupos.map(([area, lista]) => (
            <div key={area}>
              <p className="cs-area">{area}</p>
              {lista.map((c) => {
                const i = planas.indexOf(c);
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="option"
                    aria-selected={String(c.id) === valor}
                    className={"cs-op" + (i === activa ? " on" : "") + (String(c.id) === valor ? " sel" : "")}
                    onMouseEnter={() => setActiva(i)}
                    onClick={() => elegir(c)}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
