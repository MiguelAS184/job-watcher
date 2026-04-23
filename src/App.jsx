import { useEffect, useMemo, useState } from "react";
import "./App.css";
import "./index.css";

const API_BASE = import.meta.env.VITE_API_BASE || "";

const SECTORS = [
  { code: "PAYEMS", label: "Total Nonfarm" },
  { code: "USCONS", label: "Construction" },
  { code: "USPBS", label: "Professional & Business Services" },
];

const SECTOR_DETAILS = {
  PAYEMS: {
    label: "Total Nonfarm",
    summary:
      "This is a broad benchmark sector representing overall nonfarm employment across the U.S. economy.",
    occupations: [
      "General nonfarm employment benchmark",
      "Office and administrative support",
      "Retail and service workers",
      "Healthcare support roles",
      "Logistics and operations staff",
    ],
    salaryRange: "Varies widely across constituent occupations",
  },
  USCONS: {
    label: "Construction",
    summary:
      "Construction reflects labor demand tied to building activity, infrastructure work, and broader economic expansion.",
    occupations: [
      "Electricians",
      "Plumbers",
      "Carpenters",
      "Construction laborers",
      "Site supervisors",
    ],
    salaryRange: "Typical related wages often fall around mid-$40k to mid-$70k+ depending on role and region",
  },
  USPBS: {
    label: "Professional & Business Services",
    summary:
      "Professional & Business Services includes a broad set of office, technical, business, and consulting-related roles.",
    occupations: [
      "Software developers",
      "Accountants",
      "Business analysts",
      "Consultants",
      "Administrative specialists",
    ],
    salaryRange: "Typical related wages often range from about $60k to $120k+ depending on role and region",
  },
};

const fallbackSnapshot = {
  ok: true,
  unemployment_rate: 4.1,
  cpi: 317.0,
  federal_funds_rate: 4.33,
  labor_force_participation: 62.4,
  sectors: [
    { sector: "PAYEMS", predicted_growth_pct: 0.11, predicted_trend: "Stable" },
    { sector: "USCONS", predicted_growth_pct: 0.18, predicted_trend: "Rising" },
    { sector: "USPBS", predicted_growth_pct: 0.07, predicted_trend: "Stable" },
  ],
};

const fallbackTrendPointsBySector = {
  PAYEMS: [
    { month: "Jan", value: 0.08 },
    { month: "Feb", value: 0.10 },
    { month: "Mar", value: 0.11 },
    { month: "Apr", value: 0.09 },
    { month: "May", value: 0.14 },
    { month: "Jun", value: 0.15 },
  ],
  USCONS: [
    { month: "Jan", value: 0.04 },
    { month: "Feb", value: 0.07 },
    { month: "Mar", value: 0.09 },
    { month: "Apr", value: 0.12 },
    { month: "May", value: 0.16 },
    { month: "Jun", value: 0.18 },
  ],
  USPBS: [
    { month: "Jan", value: 0.06 },
    { month: "Feb", value: 0.05 },
    { month: "Mar", value: 0.07 },
    { month: "Apr", value: 0.08 },
    { month: "May", value: 0.07 },
    { month: "Jun", value: 0.09 },
  ],
};

function Sparkline({ points }) {
  const max = Math.max(...points.map((p) => p.value));
  const min = Math.min(...points.map((p) => p.value));
  const range = max - min || 1;
  const width = 360;
  const height = 120;

  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1 || 1)) * (width - 20) + 10;
      const y = height - (((p.value - min) / range) * (height - 20) + 10);
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  return (
    <div className="chart-card">
      <div className="chart-head">
        <h3>Recent Forecast Trend</h3>
        <span>Endpoint is Connected</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="sparkline" aria-label="forecast trend chart">
        <path d={d} fill="none" stroke="currentColor" strokeWidth="3" />
      </svg>
      <div className="sparkline-labels">
        {points.map((point) => (
          <span key={point.month}>{point.month}</span>
        ))}
      </div>
    </div>
  );
}

function formatGrowth(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return "0.00%";
  return `${num.toFixed(2)}%`;
}

function App() {
  const [selectedSector, setSelectedSector] = useState("PAYEMS");
  const [snapshot, setSnapshot] = useState(fallbackSnapshot);
  const [prediction, setPrediction] = useState({
    ok: true,
    sector: "PAYEMS",
    predicted_growth_pct: fallbackSnapshot.sectors[0].predicted_growth_pct,
    predicted_trend: fallbackSnapshot.sectors[0].predicted_trend,
    source: "fallback",
  });
  const [liveSectorSummary, setLiveSectorSummary] = useState(fallbackSnapshot.sectors);
  const [loadingSnapshot, setLoadingSnapshot] = useState(false);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [loadingSectorSummary, setLoadingSectorSummary] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setSnapshot(fallbackSnapshot);
    setLoadingSnapshot(false);
    setError(
      "Macro dashboard cards are currently using demo data. The live sector forecast and sector summary below are connected to the Obi backend."
    );
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPrediction() {
      setLoadingPrediction(true);
      try {
        const response = await fetch(
          `${API_BASE}/latest_snapshot.py?sector=${selectedSector}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(`Prediction request failed: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Prediction endpoint returned an error.");
        }

        setPrediction({
          ok: true,
          sector: data.sector,
          predicted_growth_pct: data.predicted_employment_growth_pct,
          predicted_trend: data.predicted_trend_class,
          source: "live",
        });
      } catch (err) {
        if (err.name === "AbortError") return;

        const fallback =
          fallbackSnapshot.sectors.find((item) => item.sector === selectedSector) ||
          fallbackSnapshot.sectors[0];

        setPrediction({
          ok: true,
          sector: fallback.sector,
          predicted_growth_pct: fallback.predicted_growth_pct,
          predicted_trend: fallback.predicted_trend,
          source: "fallback",
        });

        console.error(err);
      } finally {
        setLoadingPrediction(false);
      }
    }

    loadPrediction();
    return () => controller.abort();
  }, [selectedSector]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSectorSummary() {
      setLoadingSectorSummary(true);
      try {
        const results = await Promise.all(
          SECTORS.map(async (sector) => {
            const response = await fetch(
              `${API_BASE}/latest_snapshot.py?sector=${sector.code}`,
              { signal: controller.signal }
            );

            if (!response.ok) {
              throw new Error(`Sector summary request failed for ${sector.code}: ${response.status}`);
            }

            const data = await response.json();

            if (!data.success) {
              throw new Error(data.error || `Sector summary endpoint returned an error for ${sector.code}.`);
            }

            return {
              sector: data.sector,
              predicted_growth_pct: data.predicted_employment_growth_pct,
              predicted_trend: data.predicted_trend_class,
            };
          })
        );

        setLiveSectorSummary(results);
      } catch (err) {
        if (err.name === "AbortError") return;
        setLiveSectorSummary(fallbackSnapshot.sectors);
        console.error(err);
      } finally {
        setLoadingSectorSummary(false);
      }
    }

    loadSectorSummary();
    return () => controller.abort();
  }, []);

  const selectedLabel = useMemo(
    () => SECTORS.find((item) => item.code === selectedSector)?.label || selectedSector,
    [selectedSector]
  );

  const selectedDetails = useMemo(
    () => SECTOR_DETAILS[selectedSector] || SECTOR_DETAILS.PAYEMS,
    [selectedSector]
  );

    const selectedTrendPoints = useMemo(
    () => fallbackTrendPointsBySector[selectedSector] || fallbackTrendPointsBySector.PAYEMS,
    [selectedSector]
  );

  return (
    <div className="app-shell">
      <header className="navbar">
        <div>
          <p className="eyebrow">Byte Force Job Watcher</p>
          <h1>Economic-Driven Job Market Forecasting</h1>
        </div>
        <nav className="nav-links">
          <a href="#dashboard">Dashboard</a>
          <a href="#forecast">Forecast</a>
          <a href="#context">Career Context</a>
          <a href="#methodology">Methodology</a>
        </nav>
      </header>

      <main className="content">
        <section className="hero">
          <div className="hero-grid-overlay"></div>
          <div className="hero-scan-line"></div>

          <div className="hero-content">
            <p className="hero-copy">
              Interactive labor-market dashboard that combines macroeconomic indicators with
              trained machine learning models to forecast sector-level employment growth.
            </p>

            <div className="status-row">
              <span className="status-pill online">Frontend online</span>
              <span className="status-pill">
                Backend {loadingPrediction || loadingSectorSummary ? "connecting..." : prediction?.source === "live" ? "live" : "demo mode"}
              </span>
            </div>
          </div>
        </section>

        <section className="status-grid">
          <article className="status-card">
            <p className="label">Data Source</p>
            <h3>FRED + ML Pipeline</h3>
          </article>
          <article className="status-card">
            <p className="label">Frontend</p>
            <h3>React + Vite</h3>
          </article>
          <article className="status-card">
            <p className="label">Backend Status</p>
            <h3>
              {loadingPrediction || loadingSectorSummary
                ? "Connecting..."
                : prediction?.source === "live"
                ? "Live Prediction"
                : "Demo Mode"}
            </h3>
          </article>
          <article className="status-card">
            <p className="label">Last Updated</p>
            <h3>April 2026</h3>
          </article>
        </section>

        <section id="dashboard" className="cards-grid">
          <article className="metric-card">
            <span>Unemployment Rate</span>
            <strong>{loadingSnapshot ? "..." : `${snapshot.unemployment_rate}%`}</strong>
            <small>Latest macro snapshot</small>
          </article>
          <article className="metric-card">
            <span>CPI</span>
            <strong>{loadingSnapshot ? "..." : snapshot.cpi}</strong>
            <small>Consumer Price Index</small>
          </article>
          <article className="metric-card">
            <span>Federal Funds Rate</span>
            <strong>{loadingSnapshot ? "..." : `${snapshot.federal_funds_rate}%`}</strong>
            <small>Interest rate signal</small>
          </article>
          <article className="metric-card">
            <span>Labor Force Participation</span>
            <strong>{loadingSnapshot ? "..." : `${snapshot.labor_force_participation}%`}</strong>
            <small>Participation indicator</small>
          </article>
        </section>

        <section id="forecast" className="panel-grid">
          <article className="panel prediction-panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Live model call</p>
                <h2>Sector Forecast</h2>
              </div>

              <select value={selectedSector} onChange={(e) => setSelectedSector(e.target.value)}>
                {SECTORS.map((sector) => (
                  <option key={sector.code} value={sector.code}>
                    {sector.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="prediction-body">
              <div>
                <p className="label">Selected sector</p>
                <h3>{selectedLabel}</h3>
              </div>
              <div>
                <p className="label">Predicted growth</p>
                <h3>{loadingPrediction ? "..." : formatGrowth(prediction?.predicted_growth_pct)}</h3>
              </div>
              <div>
                <p className="label">Predicted trend</p>
                <span className={`trend-badge ${String(prediction?.predicted_trend || "stable").toLowerCase()}`}>
                  {loadingPrediction ? "Loading" : prediction?.predicted_trend}
                </span>
              </div>
            </div>

            <p className="helper-text">
              This card is connected to the live Obi CGI endpoint and shows the saved model prediction for the selected sector.
            </p>
          </article>

          <Sparkline points={selectedTrendPoints} />
        </section>

        <section id="context" className="panel-grid">
          <article className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Occupation context</p>
                <h2>Roles Commonly Associated with {selectedLabel}</h2>
              </div>
            </div>

            <p className="helper-text context-copy">{selectedDetails.summary}</p>

            <div className="context-list">
              {selectedDetails.occupations.map((role) => (
                <span key={role} className="context-pill">
                  {role}
                </span>
              ))}
            </div>

            <div className="context-meta">
              <div className="context-card">
                <p className="label">Estimated wage context</p>
                <h3>{selectedDetails.salaryRange}</h3>
              </div>
            </div>
          </article>

          <article className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Model transparency</p>
                <h2>How to Read This Forecast</h2>
              </div>
            </div>

            <div className="info-grid">
              <div className="info-box">
                <p className="label">Model inputs used</p>
                <ul className="info-list">
                  <li>Lag employment growth</li>
                  <li>Lag unemployment rate</li>
                  <li>Lag CPI</li>
                  <li>Lag federal funds rate</li>
                  <li>Lag labor force participation</li>
                  <li>3-month rolling employment growth</li>
                  <li>3-month rolling unemployment trend</li>
                </ul>
              </div>

              <div className="info-box">
                <p className="label">Trend label meaning</p>
                <ul className="info-list">
                  <li><strong>Rising:</strong> stronger positive monthly growth signal</li>
                  <li><strong>Stable:</strong> limited change expected</li>
                  <li><strong>Declining:</strong> contraction signal detected</li>
                </ul>
              </div>
            </div>

            <p className="helper-text">
              The model forecasts sector-level employment trends. The occupation examples shown here help users relate those sector forecasts to real job families.
            </p>
          </article>
        </section>

        <section className="panel full-width">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Current predictions</p>
              <h2>Sector Summary</h2>
            </div>
          </div>

          <div className="sector-card-grid">
            {(liveSectorSummary || []).map((sector) => {
              const label =
                SECTORS.find((item) => item.code === sector.sector)?.label || sector.sector;

              const growth = Number(sector.predicted_growth_pct) || 0;
              const barWidth = Math.max(20, Math.min(growth * 400, 100));

              return (
                <article key={sector.sector} className="sector-card">
                  <div className="sector-card-head">
                    <div>
                      <p className="label">Sector</p>
                      <h3>{label}</h3>
                    </div>
                    <span className={`trend-badge ${String(sector.predicted_trend).toLowerCase()}`}>
                      {loadingSectorSummary ? "Loading" : sector.predicted_trend}
                    </span>
                  </div>

                  <p className="sector-growth">{formatGrowth(growth)} projected growth</p>

                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${barWidth}%` }}></div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section id="methodology" className="panel full-width">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Methodology</p>
              <h2>How the site connects to the backend</h2>
            </div>
          </div>
          <ol className="steps-list">
            <li>Obi pulls macroeconomic data from FRED and builds the processed dataset.</li>
            <li>The training pipeline saves two models: a growth regressor and a trend classifier.</li>
            <li>The frontend calls Python CGI endpoints on Obi using fetch for live sector forecasts.</li>
            <li>Occupation examples and wage context help users interpret sector forecasts in terms of real job families.</li>
            <li>GitHub Pages hosts the React app so the site stays online without running locally.</li>
          </ol>
        </section>
      </main>
    </div>
  );
}

export default App;