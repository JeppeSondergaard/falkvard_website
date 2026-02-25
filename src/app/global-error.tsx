"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    window.location.reload();
  }, [error]);

  return (
    <html lang="da">
      <body style={{ margin: 0, background: "#0a0a0a", color: "#aaa", display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <p>Genindlæser&hellip;</p>
      </body>
    </html>
  );
}
