// Requests outside any locale (rare: the middleware adds one) get a minimal page.
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "4rem 1rem", textAlign: "center" }}>
        <h1>404</h1>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages, react/jsx-no-literals */}
        <a href="/">Home</a>
      </body>
    </html>
  );
}
