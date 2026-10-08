"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          background: "#f7f6f2",
          color: "#1c201e",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          margin: 0,
        }}
      >
        <main
          style={{
            margin: "0 auto",
            maxWidth: "42rem",
            padding: "5rem 1.25rem",
          }}
        >
          <p style={{ color: "#b42318", fontWeight: 650 }}>Unexpected error</p>
          <h1 style={{ fontSize: "2.25rem", letterSpacing: "-0.035em" }}>
            WebQuote needs to reload this page
          </h1>
          <p
            style={{ color: "#5e645f", fontSize: "1.125rem", lineHeight: 1.7 }}
          >
            Try again. If the problem continues, return to the application from
            your browser navigation.
          </p>
          <button
            onClick={reset}
            style={{
              background: "#0f6b5d",
              border: 0,
              borderRadius: "0.5rem",
              color: "white",
              cursor: "pointer",
              font: "inherit",
              fontWeight: 650,
              marginTop: "1rem",
              minHeight: "2.75rem",
              padding: "0.625rem 1rem",
            }}
            type="button"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
