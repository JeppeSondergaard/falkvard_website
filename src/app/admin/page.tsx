"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import s from "./admin.module.scss";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Login fejlede");
      }

      const { token } = await res.json();
      localStorage.setItem("fv-admin-token", token);
      router.push("/admin/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ukendt fejl");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={s.section}>
      <div className={s.card}>
        <h1 className={s.title}>Admin</h1>
        <form onSubmit={handleSubmit} className={s.form}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Adgangskode"
            className={s.input}
            autoFocus
          />
          {error && <p className={s.error}>{error}</p>}
          <button type="submit" className={s.btn} disabled={loading}>
            {loading ? "Logger ind..." : "Log ind"}
          </button>
        </form>
      </div>
    </section>
  );
}
