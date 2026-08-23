import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: "24px", textAlign: "center" }}>
      <div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(3rem, 10vw, 7rem)", margin: 0 }}>Lost at sea.</h1>
        <p style={{ color: "var(--paper-muted)" }}>This project coordinate does not exist yet.</p>
        <Link href="/#projects">Return to projects</Link>
      </div>
    </main>
  );
}
