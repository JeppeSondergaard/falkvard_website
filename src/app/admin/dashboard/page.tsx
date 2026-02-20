"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminNav from "@/components/AdminNav";
import s from "./dashboard.module.scss";

type Booking = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  service: string;
  placement: string | null;
  size: string | null;
  description: string | null;
  reference_urls: string | null;
  status: string;
  source: string;
  created_at: string;
  updated_at: string;
};

type Filter = "all" | "pending" | "approved" | "rejected" | "completed";

export default function DashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const token = typeof window !== "undefined" ? localStorage.getItem("fv-admin-token") : null;

  const fetchBookings = useCallback(async () => {
    if (!token) {
      router.push("/admin");
      return;
    }

    const url = filter === "all" ? "/api/bookings" : `/api/bookings?status=${filter}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401) {
      localStorage.removeItem("fv-admin-token");
      router.push("/admin");
      return;
    }

    const data = await res.json();
    setBookings(data);
    setLoading(false);
  }, [token, filter, router]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  async function updateStatus(id: string, status: string) {
    if (!token) return;
    await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    fetchBookings();
  }

  function logout() {
    localStorage.removeItem("fv-admin-token");
    router.push("/admin");
  }

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    approved: bookings.filter((b) => b.status === "approved").length,
    agent: bookings.filter((b) => b.source === "agent").length,
  };

  if (loading) {
    return (
      <section className={s.section}>
        <p className={s.loading}>Indlæser...</p>
      </section>
    );
  }

  return (
    <>
    <AdminNav />
    <section className={s.section}>
      <div className={s.inner}>
        <div className={s.header}>
          <h1 className={s.title}>Bookings</h1>
          <button type="button" onClick={logout} className={s.logoutBtn}>
            Log ud
          </button>
        </div>

        <div className={s.statsGrid}>
          <div className={s.statCard}>
            <span className={s.statNum}>{stats.total}</span>
            <span className={s.statLabel}>Total</span>
          </div>
          <div className={s.statCard}>
            <span className={s.statNum}>{stats.pending}</span>
            <span className={s.statLabel}>Afventer</span>
          </div>
          <div className={s.statCard}>
            <span className={s.statNum}>{stats.approved}</span>
            <span className={s.statLabel}>Godkendt</span>
          </div>
          <div className={s.statCard}>
            <span className={s.statNum}>{stats.agent}</span>
            <span className={s.statLabel}>Via AI</span>
          </div>
        </div>

        <div className={s.filterBar}>
          {(["all", "pending", "approved", "rejected", "completed"] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              className={`${s.filterBtn} ${filter === f ? s.active : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "Alle" : f === "pending" ? "Afventer" : f === "approved" ? "Godkendt" : f === "rejected" ? "Afvist" : "Færdig"}
            </button>
          ))}
        </div>

        {bookings.length === 0 ? (
          <p className={s.empty}>Ingen bookings at vise.</p>
        ) : (
          <div className={s.list}>
            {bookings.map((b) => (
              <div key={b.id} className={s.bookingCard}>
                <button
                  type="button"
                  className={s.bookingHeader}
                  onClick={() => setExpanded(expanded === b.id ? null : b.id)}
                >
                  <div className={s.bookingMeta}>
                    <span className={s.bookingName}>{b.name}</span>
                    <span className={s.bookingService}>{b.service}</span>
                    {b.source === "agent" && <span className={s.agentBadge}>AI</span>}
                  </div>
                  <div className={s.bookingRight}>
                    <span className={`${s.statusBadge} ${s[b.status]}`}>
                      {b.status === "pending" ? "Afventer" : b.status === "approved" ? "Godkendt" : b.status === "rejected" ? "Afvist" : "Færdig"}
                    </span>
                    <span className={s.bookingDate}>
                      {new Date(b.created_at).toLocaleDateString("da-DK")}
                    </span>
                  </div>
                </button>

                {expanded === b.id && (
                  <div className={s.bookingDetails}>
                    <div className={s.detailGrid}>
                      <div><strong>Email:</strong> {b.email}</div>
                      {b.phone && <div><strong>Tlf:</strong> {b.phone}</div>}
                      {b.placement && <div><strong>Placering:</strong> {b.placement}</div>}
                      {b.size && <div><strong>Størrelse:</strong> {b.size}</div>}
                      {b.description && (
                        <div className={s.fullWidth}>
                          <strong>Beskrivelse:</strong>
                          <p className={s.descriptionText}>{b.description}</p>
                        </div>
                      )}
                      {b.reference_urls && (
                        <div className={s.fullWidth}>
                          <strong>Referencer:</strong> {b.reference_urls}
                        </div>
                      )}
                    </div>

                    {b.status === "pending" && (
                      <div className={s.actions}>
                        <button
                          type="button"
                          className={s.approveBtn}
                          onClick={() => updateStatus(b.id, "approved")}
                        >
                          Godkend
                        </button>
                        <button
                          type="button"
                          className={s.rejectBtn}
                          onClick={() => updateStatus(b.id, "rejected")}
                        >
                          Afvis
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
    </>
  );
}
