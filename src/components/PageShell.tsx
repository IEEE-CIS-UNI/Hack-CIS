import Footer from "./Footer";
import Nav from "./Nav";
import StarField from "./StarField";

/** Marco común de las páginas internas: fondo, menú y pie. */
export default function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StarField />
      <div className="nebula" aria-hidden />
      <Nav />
      <main className="pg">
        <div className="pg-in">{children}</div>
      </main>
      <Footer />
    </>
  );
}
