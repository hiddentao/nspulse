import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Legend } from "recharts";

const MONTHLY_DATA = [
  { month: "2024-09", "Fitness & Sports": 1, "Health & Wellness": 1, "Tech & Engineering": 3, "AI & Data": 2, "Business & Startups": 0, "Social & Community": 5, "Education & Learning": 4, "Creative & Arts": 3, "Governance & Policy": 2, "Conference & Summit": 0, "Food & Dining": 0, "Outdoor & Adventure": 2, Other: 1, total: 15 },
  { month: "2024-10", "Fitness & Sports": 27, "Health & Wellness": 25, "Tech & Engineering": 22, "AI & Data": 9, "Business & Startups": 9, "Social & Community": 16, "Education & Learning": 47, "Creative & Arts": 10, "Governance & Policy": 4, "Conference & Summit": 3, "Food & Dining": 0, "Outdoor & Adventure": 17, Other: 59, total: 199 },
  { month: "2024-11", "Fitness & Sports": 11, "Health & Wellness": 3, "Tech & Engineering": 8, "AI & Data": 3, "Business & Startups": 6, "Social & Community": 14, "Education & Learning": 21, "Creative & Arts": 2, "Governance & Policy": 2, "Conference & Summit": 4, "Food & Dining": 1, "Outdoor & Adventure": 2, Other: 12, total: 69 },
  { month: "2024-12", "Fitness & Sports": 7, "Health & Wellness": 1, "Tech & Engineering": 5, "AI & Data": 1, "Business & Startups": 3, "Social & Community": 6, "Education & Learning": 7, "Creative & Arts": 0, "Governance & Policy": 1, "Conference & Summit": 3, "Food & Dining": 0, "Outdoor & Adventure": 0, Other: 10, total: 36 },
  { month: "2025-03", "Fitness & Sports": 31, "Health & Wellness": 35, "Tech & Engineering": 11, "AI & Data": 15, "Business & Startups": 9, "Social & Community": 17, "Education & Learning": 29, "Creative & Arts": 14, "Governance & Policy": 4, "Conference & Summit": 3, "Food & Dining": 0, "Outdoor & Adventure": 4, Other: 36, total: 181 },
  { month: "2025-04", "Fitness & Sports": 40, "Health & Wellness": 33, "Tech & Engineering": 16, "AI & Data": 11, "Business & Startups": 17, "Social & Community": 17, "Education & Learning": 49, "Creative & Arts": 16, "Governance & Policy": 1, "Conference & Summit": 3, "Food & Dining": 0, "Outdoor & Adventure": 7, Other: 70, total: 247 },
  { month: "2025-05", "Fitness & Sports": 27, "Health & Wellness": 36, "Tech & Engineering": 12, "AI & Data": 11, "Business & Startups": 34, "Social & Community": 20, "Education & Learning": 42, "Creative & Arts": 17, "Governance & Policy": 0, "Conference & Summit": 0, "Food & Dining": 3, "Outdoor & Adventure": 8, Other: 54, total: 226 },
  { month: "2025-06", "Fitness & Sports": 23, "Health & Wellness": 51, "Tech & Engineering": 9, "AI & Data": 9, "Business & Startups": 22, "Social & Community": 22, "Education & Learning": 37, "Creative & Arts": 16, "Governance & Policy": 4, "Conference & Summit": 0, "Food & Dining": 0, "Outdoor & Adventure": 1, Other: 20, total: 175 },
  { month: "2025-07", "Fitness & Sports": 40, "Health & Wellness": 32, "Tech & Engineering": 13, "AI & Data": 14, "Business & Startups": 11, "Social & Community": 13, "Education & Learning": 37, "Creative & Arts": 13, "Governance & Policy": 4, "Conference & Summit": 1, "Food & Dining": 1, "Outdoor & Adventure": 10, Other: 36, total: 187 },
  { month: "2025-08", "Fitness & Sports": 40, "Health & Wellness": 19, "Tech & Engineering": 10, "AI & Data": 27, "Business & Startups": 34, "Social & Community": 19, "Education & Learning": 33, "Creative & Arts": 6, "Governance & Policy": 4, "Conference & Summit": 2, "Food & Dining": 5, "Outdoor & Adventure": 2, Other: 43, total: 216 },
  { month: "2025-09", "Fitness & Sports": 33, "Health & Wellness": 23, "Tech & Engineering": 12, "AI & Data": 10, "Business & Startups": 33, "Social & Community": 30, "Education & Learning": 29, "Creative & Arts": 13, "Governance & Policy": 4, "Conference & Summit": 1, "Food & Dining": 3, "Outdoor & Adventure": 15, Other: 73, total: 238 },
  { month: "2025-10", "Fitness & Sports": 23, "Health & Wellness": 28, "Tech & Engineering": 10, "AI & Data": 8, "Business & Startups": 17, "Social & Community": 23, "Education & Learning": 35, "Creative & Arts": 14, "Governance & Policy": 6, "Conference & Summit": 5, "Food & Dining": 2, "Outdoor & Adventure": 6, Other: 126, total: 270 },
  { month: "2025-11", "Fitness & Sports": 40, "Health & Wellness": 6, "Tech & Engineering": 10, "AI & Data": 12, "Business & Startups": 20, "Social & Community": 47, "Education & Learning": 66, "Creative & Arts": 9, "Governance & Policy": 22, "Conference & Summit": 1, "Food & Dining": 0, "Outdoor & Adventure": 6, Other: 107, total: 302 },
  { month: "2025-12", "Fitness & Sports": 5, "Health & Wellness": 5, "Tech & Engineering": 2, "AI & Data": 11, "Business & Startups": 8, "Social & Community": 15, "Education & Learning": 23, "Creative & Arts": 9, "Governance & Policy": 3, "Conference & Summit": 0, "Food & Dining": 0, "Outdoor & Adventure": 3, Other: 42, total: 108 },
  { month: "2026-01", "Fitness & Sports": 38, "Health & Wellness": 16, "Tech & Engineering": 16, "AI & Data": 29, "Business & Startups": 24, "Social & Community": 36, "Education & Learning": 59, "Creative & Arts": 13, "Governance & Policy": 15, "Conference & Summit": 2, "Food & Dining": 5, "Outdoor & Adventure": 16, Other: 86, total: 277 },
  { month: "2026-02", "Fitness & Sports": 34, "Health & Wellness": 4, "Tech & Engineering": 6, "AI & Data": 15, "Business & Startups": 11, "Social & Community": 31, "Education & Learning": 24, "Creative & Arts": 6, "Governance & Policy": 10, "Conference & Summit": 1, "Food & Dining": 2, "Outdoor & Adventure": 16, Other: 59, total: 182 },
];

const CATEGORIES = [
  "Education & Learning",
  "Fitness & Sports",
  "Health & Wellness",
  "Social & Community",
  "Business & Startups",
  "AI & Data",
  "Tech & Engineering",
  "Creative & Arts",
  "Outdoor & Adventure",
  "Governance & Policy",
  "Conference & Summit",
  "Food & Dining",
  "Other",
];

const CAT_COLORS = {
  "Education & Learning": "#E8590C",
  "Fitness & Sports": "#2B8A3E",
  "Health & Wellness": "#5C7CFA",
  "Social & Community": "#F76707",
  "Business & Startups": "#AE3EC9",
  "AI & Data": "#0CA678",
  "Tech & Engineering": "#1971C2",
  "Creative & Arts": "#E64980",
  "Outdoor & Adventure": "#74B816",
  "Governance & Policy": "#495057",
  "Conference & Summit": "#F59F00",
  "Food & Dining": "#D6336C",
  Other: "#868E96",
};

const CAT_ICONS = {
  "Education & Learning": "📚",
  "Fitness & Sports": "🏃",
  "Health & Wellness": "🧘",
  "Social & Community": "🤝",
  "Business & Startups": "🚀",
  "AI & Data": "🤖",
  "Tech & Engineering": "⚙️",
  "Creative & Arts": "🎨",
  "Outdoor & Adventure": "🌿",
  "Governance & Policy": "🏛️",
  "Conference & Summit": "🎤",
  "Food & Dining": "🍜",
  Other: "📌",
};

const formatMonth = (m) => {
  const [y, mo] = m.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(mo) - 1]} ${y.slice(2)}`;
};

const StatCard = ({ label, value, sub, accent }) => (
  <div style={{
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: "20px 24px",
    flex: "1 1 200px",
    minWidth: 160,
  }}>
    <div style={{ fontSize: 13, color: "#868E96", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
    <div style={{ fontSize: 36, fontWeight: 700, color: accent || "#F1F3F5", fontFamily: "'DM Sans', sans-serif", lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 13, color: "#5C5F66", marginTop: 6 }}>{sub}</div>}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#1A1B1E",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 8,
      padding: "12px 16px",
      fontSize: 13,
      color: "#C1C2C5",
    }}>
      <div style={{ fontWeight: 600, marginBottom: 6, color: "#F1F3F5" }}>{label}</div>
      {payload.filter(p => p.value > 0).sort((a, b) => b.value - a.value).map((p) => (
        <div key={p.name} style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 2 }}>
          <span style={{ color: p.color }}>{p.name}</span>
          <span style={{ fontWeight: 600 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function NSPulse() {
  const [selectedCats, setSelectedCats] = useState(new Set(CATEGORIES));
  const [view, setView] = useState("overview");

  const totalEvents = useMemo(() => MONTHLY_DATA.reduce((s, m) => s + m.total, 0), []);
  const avgPerMonth = useMemo(() => Math.round(totalEvents / MONTHLY_DATA.filter(m => m.total > 5).length), [totalEvents]);
  const peakMonth = useMemo(() => {
    const m = MONTHLY_DATA.reduce((a, b) => a.total > b.total ? a : b);
    return { month: formatMonth(m.month), count: m.total };
  }, []);

  const categoryTotals = useMemo(() => {
    const totals = {};
    CATEGORIES.forEach((c) => {
      totals[c] = MONTHLY_DATA.reduce((s, m) => s + (m[c] || 0), 0);
    });
    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, []);

  const chartData = useMemo(() =>
    MONTHLY_DATA.filter(m => m.total > 5).map((m) => ({
      ...m,
      name: formatMonth(m.month),
    })), []);

  const pieData = useMemo(() =>
    categoryTotals.filter(([c]) => c !== "Other").map(([name, value]) => ({
      name,
      value,
      color: CAT_COLORS[name],
    })), [categoryTotals]);

  const toggleCat = (cat) => {
    setSelectedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const activeCats = CATEGORIES.filter((c) => selectedCats.has(c) && c !== "Other");

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0D0E10",
      color: "#C1C2C5",
      fontFamily: "'DM Sans', -apple-system, sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "32px 48px",
        background: "linear-gradient(180deg, rgba(232,89,12,0.04) 0%, transparent 100%)",
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", color: "#E8590C", letterSpacing: "0.15em", textTransform: "uppercase" }}>NS Pulse</span>
          <span style={{ fontSize: 11, color: "#495057" }}>•</span>
          <span style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", color: "#495057" }}>network school community dashboard</span>
        </div>
        <h1 style={{
          fontSize: 42,
          fontWeight: 700,
          color: "#F1F3F5",
          margin: "8px 0 0",
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
        }}>
          Community Pulse
        </h1>
        <p style={{ fontSize: 15, color: "#5C5F66", marginTop: 8, maxWidth: 600 }}>
          Live analytics from {totalEvents.toLocaleString()} events hosted by Network School since Sep 2024.
          Data sourced from lu.ma/ns.
        </p>
      </div>

      <div style={{ padding: "32px 48px", maxWidth: 1200 }}>

        {/* Stats Row */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 40 }}>
          <StatCard label="Total Events" value={totalEvents.toLocaleString()} sub="Since Sep 2024" accent="#E8590C" />
          <StatCard label="Avg / Month" value={avgPerMonth} sub="Active months only" />
          <StatCard label="Peak Month" value={peakMonth.count} sub={peakMonth.month} accent="#5C7CFA" />
          <StatCard label="Categories" value={CATEGORIES.length - 1} sub="+ uncategorized" />
        </div>

        {/* Nav */}
        <div style={{ display: "flex", gap: 4, marginBottom: 32 }}>
          {["overview", "categories", "trends"].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: "8px 20px",
                borderRadius: 6,
                border: "none",
                background: view === v ? "rgba(232,89,12,0.15)" : "transparent",
                color: view === v ? "#E8590C" : "#5C5F66",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                fontFamily: "'Space Mono', monospace",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Overview */}
        {view === "overview" && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: "#F1F3F5", marginBottom: 20 }}>Events Over Time</h2>
            <div style={{ height: 360, marginBottom: 48 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#E8590C" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#E8590C" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" tick={{ fill: "#5C5F66", fontSize: 11, fontFamily: "Space Mono" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#5C5F66", fontSize: 11, fontFamily: "Space Mono" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="total" stroke="#E8590C" strokeWidth={2} fill="url(#totalGrad)" dot={{ r: 3, fill: "#E8590C" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <h2 style={{ fontSize: 20, fontWeight: 600, color: "#F1F3F5", marginBottom: 20 }}>Category Breakdown</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
              <div>
                {categoryTotals.map(([cat, count]) => {
                  const pct = Math.round((count / totalEvents) * 100);
                  return (
                    <div key={cat} style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 13, color: "#C1C2C5" }}>
                          {CAT_ICONS[cat]} {cat}
                        </span>
                        <span style={{ fontSize: 13, fontFamily: "'Space Mono', monospace", color: "#868E96" }}>
                          {count} <span style={{ color: "#495057" }}>({pct}%)</span>
                        </span>
                      </div>
                      <div style={{ height: 6, background: "rgba(255,255,255,0.04)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{
                          height: "100%",
                          width: `${(count / categoryTotals[0][1]) * 100}%`,
                          background: CAT_COLORS[cat],
                          borderRadius: 3,
                          transition: "width 0.6s ease",
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                <ResponsiveContainer width={300} height={300}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} innerRadius={60} paddingAngle={2} strokeWidth={0}>
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#1A1B1E", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 13, color: "#C1C2C5" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Categories View */}
        {view === "categories" && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: "#F1F3F5", marginBottom: 16 }}>Category Filter</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
              {CATEGORIES.filter((c) => c !== "Other").map((cat) => (
                <button
                  key={cat}
                  onClick={() => toggleCat(cat)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 20,
                    border: `1px solid ${selectedCats.has(cat) ? CAT_COLORS[cat] : "rgba(255,255,255,0.08)"}`,
                    background: selectedCats.has(cat) ? `${CAT_COLORS[cat]}22` : "transparent",
                    color: selectedCats.has(cat) ? CAT_COLORS[cat] : "#5C5F66",
                    fontSize: 12,
                    cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 500,
                    transition: "all 0.2s",
                  }}
                >
                  {CAT_ICONS[cat]} {cat}
                </button>
              ))}
            </div>
            <div style={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" tick={{ fill: "#5C5F66", fontSize: 11, fontFamily: "Space Mono" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#5C5F66", fontSize: 11, fontFamily: "Space Mono" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  {activeCats.map((cat) => (
                    <Bar key={cat} dataKey={cat} stackId="a" fill={CAT_COLORS[cat]} radius={0} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Trends View */}
        {view === "trends" && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: "#F1F3F5", marginBottom: 20 }}>Category Trends</h2>
            <div style={{ height: 400, marginBottom: 40 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <XAxis dataKey="name" tick={{ fill: "#5C5F66", fontSize: 11, fontFamily: "Space Mono" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#5C5F66", fontSize: 11, fontFamily: "Space Mono" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  {["Education & Learning", "Fitness & Sports", "Health & Wellness", "Social & Community", "Business & Startups", "AI & Data"].map((cat) => (
                    <Area key={cat} type="monotone" dataKey={cat} stroke={CAT_COLORS[cat]} fill={CAT_COLORS[cat]} fillOpacity={0.1} strokeWidth={2} dot={false} />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <h2 style={{ fontSize: 20, fontWeight: 600, color: "#F1F3F5", marginBottom: 20 }}>Key Insights</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                { title: "Education dominates", desc: "Learning events consistently lead all categories, with workshops, language classes, and book clubs forming the backbone of NS community life." },
                { title: "Fitness is a core pillar", desc: "Running groups, morning rucks, climbing, and sports make up the second largest category — physical fitness is deeply embedded in NS culture." },
                { title: "AI & Business surging", desc: "AI-focused events and startup/business events have grown significantly since mid-2025, reflecting the community's tech-forward ethos." },
                { title: "Nov 2025 peak: 302 events", desc: "The most active month saw over 300 events — roughly 10 per day. Social and governance events spiked, suggesting a community-building push." },
              ].map((insight) => (
                <div key={insight.title} style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 10,
                  padding: 20,
                }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#F1F3F5", marginBottom: 6 }}>{insight.title}</div>
                  <div style={{ fontSize: 13, color: "#868E96", lineHeight: 1.5 }}>{insight.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          marginTop: 64,
          paddingTop: 24,
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          justifyContent: "space-between",
          fontSize: 11,
          fontFamily: "'Space Mono', monospace",
          color: "#495057",
        }}>
          <span>nspulse.com · data from lu.ma/ns</span>
          <span>categorized via keyword matching · {Math.round((1 - 843 / totalEvents) * 100)}% coverage</span>
        </div>
      </div>
    </div>
  );
}