"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const msg = error.message || "";
    const isHydration =
      msg.includes("removeChild") ||
      msg.includes("insertBefore") ||
      msg.includes("Hydration") ||
      msg.includes("hydrating");

    if (isHydration) {
      window.location.reload();
      return;
    }

    const timer = setTimeout(() => reset(), 3000);
    return () => clearTimeout(timer);
  }, [error, reset]);

  return (
    <div style={{ padding: "4rem 2rem", textAlign: "center", color: "#aaa" }}>
      <p>Noget gik galt — genindlæser siden&hellip;</p>
    </div>
  );
}
