"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import s from "./ChatWidget.module.scss";

function getOrCreateUserId(): string {
  if (typeof window === "undefined") return "anonymous";
  let id = localStorage.getItem("fv-chat-user-id");
  if (!id) {
    id = "user_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    localStorage.setItem("fv-chat-user-id", id);
  }
  return id;
}

function ChatPanel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const elementRef = useRef<any>(null);

  const getClientSecret = useCallback(async (existing: string | null) => {
    if (existing) return existing;

    const res = await fetch("/api/chatkit/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: getOrCreateUserId() }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Kunne ikke starte chat");
    }

    const { client_secret } = await res.json();
    return client_secret as string;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || elementRef.current) return;

    const el = document.createElement("openai-chatkit") as HTMLElement & {
      setOptions?: (opts: Record<string, unknown>) => void;
    };
    elementRef.current = el;
    el.style.width = "100%";
    el.style.height = "100%";
    el.style.display = "block";
    container.appendChild(el);

    const apply = () => {
      if (typeof (el as unknown as Record<string, unknown>).setOptions !== "function") {
        setTimeout(apply, 200);
        return;
      }
      (el as unknown as Record<string, CallableFunction>).setOptions({
        api: { getClientSecret },
        async onClientTool({ name, params }: { name: string; params: Record<string, unknown> }) {
          if (name === "create_booking") {
            const res = await fetch("/api/agent/booking", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(params),
            });
            return res.json();
          }
          throw new Error(`Unknown tool: ${name}`);
        },
        theme: {
          colorScheme: "dark" as const,
          color: {
            accent: { primary: "#CCCCCC", level: 2 },
          },
          radius: "round" as const,
          density: "compact" as const,
          typography: {
            fontFamily: "'CourierNewPSMT', 'Courier New', monospace",
          },
        },
        locale: "da-DK",
        history: { enabled: false },
        header: { title: "Få inspiration til din næste tattoo" },
        startScreen: {
          greeting: "Hej! Jeg er Falkvard Tattoo's booking assistent. Hvad kan jeg hjælpe dig med?",
          prompts: [
            { label: "Book en tatovering", prompt: "Jeg vil gerne booke en tid til en tatovering", icon: "write" },
            { label: "Se stilarter", prompt: "Hvilke stilarter tilbyder I?", icon: "search" },
            { label: "Priser og info", prompt: "Hvad koster en tatovering?", icon: "info" },
          ],
        },
        composer: {
          placeholder: "Skriv din besked...",
        },
      });
    };

    apply();

    return () => {
      if (elementRef.current && container.contains(elementRef.current)) {
        container.removeChild(elementRef.current);
      }
      elementRef.current = null;
    };
  }, [getClientSecret]);

  return <div ref={containerRef} className={s.chatkit} />;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const check = () => {
      if (customElements.get("openai-chatkit")) {
        setReady(true);
        return;
      }
      setTimeout(check, 300);
    };

    if (document.querySelector('script[src*="chatkit"]')) {
      check();
    } else {
      const script = document.createElement("script");
      script.src = "https://cdn.platform.openai.com/deployments/chatkit/chatkit.js";
      script.async = true;
      script.onload = () => check();
      document.head.appendChild(script);
    }
  }, []);

  return (
    <>
      <button
        className={`${s.fab} ${open ? s.fabOpen : ""}`}
        onClick={() => setOpen(!open)}
        aria-label={open ? "Luk chat" : "Mangler du inspiration til din næste tattoo?"}
      >
        {open ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className={s.fabLabel}>Mangler du inspiration til din næste tattoo?</span>
          </>
        )}
      </button>

      {open && (
        <div className={s.panel}>
          {ready ? (
            <ChatPanel />
          ) : (
            <div className={s.fallback}>
              <p className={s.fallbackText}>Indlæser chat...</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
