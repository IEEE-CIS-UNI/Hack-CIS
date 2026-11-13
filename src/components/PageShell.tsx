import Footer from "./Footer";
import Nav from "./Nav";
import StarField from "./StarField";

/** Marco común de las páginas internas: fondo, menú y pie. */
export default function PageShell({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <>
      <StarField />
      <div className="nebula" aria-hidden />
      <Nav />
      <main className="pg">
        <div className={wide ? "pg-in wide" : "pg-in"}>{children}</div>
      </main>
      <Footer />
    </>
  );
}
