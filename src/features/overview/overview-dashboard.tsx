"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { usePrivacy } from "@/components/shell/privacy-context";

interface CardData {
  id: string;
  name: string;
  kind: string;
  last4: string;
  holder: string;
  exp: string;
  spent: number;
  limit: number;
  skin: string;
  frozen: boolean;
  online: boolean;
  abroad: boolean;
}

const CARDS: CardData[] = [
  {
    id: "everyday",
    name: "Everyday",
    kind: "Debit · joint account",
    last4: "4182",
    holder: "Ines Okafor",
    exp: "09/29",
    spent: 1461.23,
    limit: 3200,
    skin: "1",
    frozen: false,
    online: true,
    abroad: true,
  },
  {
    id: "travel",
    name: "Travel",
    kind: "Credit card",
    last4: "7730",
    holder: "Jonas Lindqvist",
    exp: "11/28",
    spent: 448.0,
    limit: 6000,
    skin: "2",
    frozen: false,
    online: true,
    abroad: true,
  },
  {
    id: "ada",
    name: "Ada's card",
    kind: "Prepaid · allowance",
    last4: "2056",
    holder: "Ada Lindqvist",
    exp: "04/27",
    spent: 115.0,
    limit: 260,
    skin: "3",
    frozen: false,
    online: true,
    abroad: false,
  },
];

const FLOW_DATA = [
  { month: "Dec", inVal: 65, outVal: 50 },
  { month: "Jan", inVal: 80, outVal: 70 },
  { month: "Feb", inVal: 60, outVal: 55 },
  { month: "Mar", inVal: 85, outVal: 60 },
  { month: "Apr", inVal: 70, outVal: 65 },
  { month: "May", inVal: 75, outVal: 60 },
  { month: "Jun", inVal: 90, outVal: 70 },
  { month: "Jul", inVal: 80, outVal: 65 },
  { month: "Aug", inVal: 85, outVal: 70 },
  { month: "Sep", inVal: 75, outVal: 60 },
  { month: "Oct", inVal: 100, outVal: 85 },
  { month: "Nov", inVal: 90, outVal: 45 },
];

const CATEGORIES = [
  { name: "Home", pct: 71, amt: "$3,544", icon: "home" },
  { name: "Groceries", pct: 7, amt: "$370", icon: "bag" },
  { name: "Eating out", pct: 7, amt: "$339", icon: "cup" },
  { name: "Kids", pct: 5, amt: "$257", icon: "heart" },
];

const TRANSACTIONS = [
  {
    id: "tx-1",
    name: "Marlow Market",
    sub: "1 h ago · Groceries · Jonas",
    amt: "-$84.36",
    icon: "bag",
  },
  {
    id: "tx-2",
    name: "Sound Transit",
    sub: "2 h ago · Transport · Ada",
    amt: "-$4.25",
    icon: "truck",
  },
  {
    id: "tx-3",
    name: "Juniper Café",
    sub: "2 h ago · Eating out · Ines",
    amt: "-$6.40",
    icon: "cup",
  },
  {
    id: "tx-4",
    name: "Streamly",
    sub: "5 h ago · Subscriptions · Ines",
    amt: "-$22.99",
    icon: "repeat",
  },
];

export function OverviewDashboard({
  userName = "Ines",
  balanceTotal = "$29,253.82",
}: {
  userName?: string;
  balanceTotal?: string;
}) {
  const { privacy, setPrivacy } = usePrivacy();
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [cards, setCards] = useState<CardData[]>(CARDS);
  const [flipped, setFlipped] = useState(false);
  const [flowPeriod, setFlowPeriod] = useState<"Quarter" | "6 months" | "Year">("Year");
  const [noticeIndex, setNoticeIndex] = useState(0);

  const activeCard = cards[activeCardIndex] ?? cards[0];
  const cardSpentRatio = Math.min(1, activeCard.spent / activeCard.limit);

  const toggleFreeze = () => {
    setCards((prev) =>
      prev.map((c, i) =>
        i === activeCardIndex ? { ...c, frozen: !c.frozen } : c,
      ),
    );
  };

  const nextCard = () => {
    setActiveCardIndex((prev) => (prev + 1) % cards.length);
    setFlipped(false);
  };

  const prevCard = () => {
    setActiveCardIndex((prev) => (prev - 1 + cards.length) % cards.length);
    setFlipped(false);
  };

  const notices = [
    {
      title: "Eating out is up 15%",
      text: "$339 so far against $295 by this day in October.",
      link: "See spending →",
    },
    {
      title: "Sound Transit top-up due",
      text: "Ada used 85% of her monthly transport allowance.",
      link: "Manage allowance →",
    },
    {
      title: "Electric bill scheduled",
      text: "$140 goes out in 4 days from Joint Everyday.",
      link: "View subscriptions →",
    },
    {
      title: "Lisbon pot reached 61%",
      text: "At $500/month you will hit the target by April 2027.",
      link: "View savings →",
    },
  ];

  const currentNotice = notices[noticeIndex] ?? notices[0];

  return (
    <div className="page-stack">
      {/* Header */}
      <header className="phead">
        <div className="phead__text">
          <span className="eyebrow">Thursday, November 12</span>
          <h1>Good morning, {userName}</h1>
          <p>
            {userName} is paid in 3 days. Four bills go out before then.
          </p>
        </div>
        <div className="phead__actions">
          <button type="button" className="btn">
            <Icon name="download" size={16} />
            <span>Statement</span>
          </button>
          <Link href="/transactions/new" className="btn btn--primary">
            <Icon name="send" size={16} />
            <span>Send money</span>
          </Link>
        </div>
      </header>

      {/* Main Grid */}
      <div className="ov__grid">
        {/* Wallet / Cards */}
        <section className="card ov__wallet" aria-labelledby="ov-wallet-title">
          <div className="chead">
            <div className="chead__text">
              <h2 id="ov-wallet-title">Cards</h2>
              <p>Throw the top card aside, or tap it to turn it over</p>
            </div>
            <Link className="linkbtn" href="/accounts">
              All cards
            </Link>
          </div>

          <div className="wallet">
            <div
              className="wallet__stack"
              role="group"
              aria-label={`Cards, ${activeCardIndex + 1} of ${cards.length}: ${activeCard.name}`}
              onClick={() => setFlipped(!flipped)}
              style={{ cursor: "pointer" }}
            >
              {cards.map((c, i) => {
                const order = (i - activeCardIndex + cards.length) % cards.length;
                const isTop = i === activeCardIndex;
                return (
                  <div
                    key={c.id}
                    className={`vcard vcard--${c.skin}`}
                    style={
                      {
                        "--i": order,
                        zIndex: 10 - order,
                        display: order > 2 ? "none" : "flex",
                      } as React.CSSProperties
                    }
                  >
                    <div className="vcard__top">
                      <span className="vcard__name">{c.name}</span>
                      <Icon name="wifi" size={20} className="vcard__nfc" />
                    </div>
                    <span className="vcard__chip">
                      <i />
                      <i />
                      <i />
                    </span>
                    <span className="vcard__num">
                      •••• &nbsp;•••• &nbsp;•••• &nbsp;{c.last4}
                    </span>
                    <div className="vcard__bottom">
                      <span>
                        <small>Holder</small>
                        <b>{c.holder}</b>
                      </span>
                      <span>
                        <small>Exp</small>
                        <b>{c.exp}</b>
                      </span>
                      {c.frozen ? (
                        <span className="badge badge--bad">Frozen</span>
                      ) : (
                        <span className="badge badge--good">Live</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Wallet Controls */}
            <div className="wallet__bar">
              <button
                type="button"
                className="btn btn--sm btn--ghost"
                aria-label="Previous card"
                onClick={(e) => {
                  e.stopPropagation();
                  prevCard();
                }}
              >
                <Icon name="chevL" size={14} />
              </button>
              <span className="wallet__dots" aria-hidden="true">
                {cards.map((c, i) => (
                  <i
                    key={c.id}
                    className={i === activeCardIndex ? "is-on" : ""}
                  />
                ))}
              </span>
              <button
                type="button"
                className="btn btn--sm btn--ghost"
                aria-label="Next card"
                onClick={(e) => {
                  e.stopPropagation();
                  nextCard();
                }}
              >
                <Icon name="chevR" size={14} />
              </button>
              <span className="wallet__spacer" />
              <button
                type="button"
                className="btn btn--sm btn--ghost"
                aria-label="Flip card"
                onClick={(e) => {
                  e.stopPropagation();
                  setFlipped(!flipped);
                }}
              >
                <Icon name="flipCard" size={14} />
              </button>
              <button
                type="button"
                className={`btn btn--sm ${activeCard.frozen ? "btn--primary" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFreeze();
                }}
              >
                <Icon name="snow" size={14} />
                <span>{activeCard.frozen ? "Unfreeze" : "Freeze"}</span>
              </button>
            </div>

            {/* Monthly Progress on Card */}
            <div style={{ marginTop: "14px" }}>
              <div className="cardmonth__row">
                <span>{activeCard.name} · this month</span>
                <span>
                  <b>
                    {privacy
                      ? "$ ••••••"
                      : `$${activeCard.spent.toLocaleString()}`}
                  </b>{" "}
                  <small>of ${activeCard.limit.toLocaleString()}</small>
                </span>
              </div>
              <span
                className="meter"
                role="img"
                aria-label={`${activeCard.name}: ${Math.round(cardSpentRatio * 100)}% of the monthly limit used`}
              >
                <i
                  style={
                    {
                      "--f": cardSpentRatio,
                    } as React.CSSProperties
                  }
                />
              </span>
              <div className="cardmonth__flags">
                {activeCard.frozen ? (
                  <span className="badge badge--bad">Frozen</span>
                ) : (
                  <span className="badge badge--info">Live</span>
                )}
                <span className="badge badge--plain">Online on</span>
                <span className="badge badge--plain">Abroad on</span>
              </div>
            </div>
          </div>
        </section>

        {/* Joint Balance */}
        <section
          className="card ov__balance"
          aria-labelledby="ov-balance-title"
        >
          <div className="chead">
            <div className="chead__text">
              <h2 id="ov-balance-title">Joint balance</h2>
              <p>Everyday account · •••• 0457</p>
            </div>
            <button
              type="button"
              className="btn btn--sm btn--ghost"
              aria-label={privacy ? "Show balance" : "Hide balance"}
              aria-pressed={privacy}
              onClick={() => setPrivacy(!privacy)}
            >
              <Icon name={privacy ? "eye" : "eyeoff"} size={16} />
            </button>
          </div>

          <div className="bal">
            <div className="bal__fig">
              <span className="bal__num">
                {privacy ? "$ ••••••" : balanceTotal}
              </span>
              <span className="delta delta--up">
                <span>↑</span>
                <span>24% against a month ago</span>
              </span>
            </div>
            <div className="pace">
              <div className="pace__item">
                <small>Today</small>
                <b>{privacy ? "••••" : "$118"}</b>
              </div>
              <div className="pace__item">
                <small>This week</small>
                <b>{privacy ? "••••" : "$803"}</b>
              </div>
              <div className="pace__item">
                <small>This month</small>
                <b>{privacy ? "••••" : "$5,005"}</b>
              </div>
              <div className="pace__item">
                <small>This year</small>
                <b>{privacy ? "••••" : "$81,361"}</b>
              </div>
            </div>
          </div>

          {/* Sparkline curve */}
          <div style={{ marginTop: "16px" }}>
            <svg
              className="sparkline-svg"
              viewBox="0 0 500 100"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient
                  id="sparkGrad"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop
                    offset="0%"
                    stopColor="var(--accent)"
                    stopOpacity="0.25"
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--accent)"
                    stopOpacity="0"
                  />
                </linearGradient>
              </defs>
              <path
                d="M 0 70 Q 60 72 100 50 T 180 55 T 260 30 T 340 50 T 420 35 T 500 40 L 500 100 L 0 100 Z"
                fill="url(#sparkGrad)"
              />
              <path
                className="sparkline-track"
                d="M 0 70 Q 60 72 100 50 T 180 55 T 260 30 T 340 50 T 420 35 T 500 40"
              />
              <circle cx="260" cy="30" r="5" fill="var(--accent)" />
              <circle cx="340" cy="50" r="4" fill="#f59e0b" />
              <circle cx="420" cy="35" r="4" fill="#3b82f6" />
              <circle cx="500" cy="40" r="5" fill="var(--accent)" />
            </svg>
            <div className="sparkline-legend">
              <span style={{ color: "var(--accent)" }}>— Balance</span>
              <span style={{ color: "var(--muted)" }}>··· Forecast</span>
              <span style={{ color: "#3b82f6" }}>• Payday</span>
              <span style={{ color: "#f59e0b" }}>• Bill</span>
              <span style={{ marginLeft: "auto", fontWeight: 600 }}>
                Nov 30 $33,649
              </span>
            </div>
          </div>
        </section>

        {/* Money In & Out */}
        <section className="card ov__flow" aria-labelledby="ov-flow-title">
          <div className="chead">
            <div className="chead__text">
              <h2 id="ov-flow-title">Money in & out</h2>
              <p>The last twelve months</p>
            </div>
            <div className="phead__actions">
              {(["Quarter", "6 months", "Year"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`btn btn--sm ${flowPeriod === p ? "btn--primary" : "btn--ghost"}`}
                  onClick={() => setFlowPeriod(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flow-legend" style={{ marginBottom: "12px" }}>
            <span>
              <i className="is-in" /> In $126,242
            </span>
            <span>
              <i className="is-out" /> Out $88,726
            </span>
            <span style={{ marginLeft: "auto", fontWeight: 600 }}>
              Kept $37,516
            </span>
          </div>

          <div className="flow-chart">
            {FLOW_DATA.map((d) => (
              <div key={d.month} className="flow-col">
                <div className="flow-bars">
                  <div
                    className="flow-bar flow-bar--in"
                    style={{ height: `${d.inVal}px` }}
                  />
                  <div
                    className="flow-bar flow-bar--out"
                    style={{ height: `${d.outVal}px` }}
                  />
                </div>
                <span className="flow-label">{d.month}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Where November Went */}
        <section className="card ov__where" aria-labelledby="ov-where-title">
          <div className="chead">
            <div className="chead__text">
              <h2 id="ov-where-title">Where November went</h2>
              <p>12 of 30 days in · $5,005 spent</p>
            </div>
            <Link className="linkbtn" href="/budgets">
              Details
            </Link>
          </div>

          {/* Segmented bar */}
          <div
            style={{
              display: "flex",
              height: "10px",
              borderRadius: "999px",
              overflow: "hidden",
              gap: "3px",
              marginBottom: "16px",
            }}
          >
            <div style={{ flex: 71, background: "var(--accent)" }} />
            <div style={{ flex: 7, background: "var(--c2)" }} />
            <div style={{ flex: 7, background: "#f59e0b" }} />
            <div style={{ flex: 5, background: "#ef4444" }} />
            <div style={{ flex: 10, background: "var(--line-2)" }} />
          </div>

          <div className="cats">
            {CATEGORIES.map((cat) => (
              <div key={cat.name} className="cat">
                <span className="cat-ico">
                  <Icon name={cat.icon} size={18} />
                </span>
                <span className="cat__name">{cat.name}</span>
                <span className="cat__pct">{cat.pct}%</span>
                <b>{privacy ? "••••" : cat.amt}</b>
              </div>
            ))}
          </div>
        </section>

        {/* Latest Payments */}
        <section className="card ov__recent" aria-labelledby="ov-recent-title">
          <div className="chead">
            <div className="chead__text">
              <h2 id="ov-recent-title">Latest payments</h2>
              <p>Everyone, every card</p>
            </div>
            <Link className="linkbtn" href="/transactions">
              See all
            </Link>
          </div>

          <div className="txlist">
            {TRANSACTIONS.map((tx) => (
              <Link
                key={tx.id}
                href="/transactions"
                className="txrow"
              >
                <span className="cat-ico">
                  <Icon name={tx.icon} size={18} />
                </span>
                <span className="cell__text">
                  <b>{tx.name}</b>
                  <small>{tx.sub}</small>
                </span>
                <span className="amt">{privacy ? "••••" : tx.amt}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Noticed Carousel */}
        <section className="card ov__side" aria-labelledby="ov-noticed-title">
          <div className="chead">
            <div className="chead__text">
              <h2 id="ov-noticed-title">
                <Icon name="sparkles" size={18} /> Noticed
              </h2>
              <p>{noticeIndex + 1} of {notices.length}</p>
            </div>
            <div className="phead__actions">
              <button
                type="button"
                className="btn btn--sm btn--ghost"
                aria-label="Previous notice"
                onClick={() =>
                  setNoticeIndex(
                    (prev) => (prev - 1 + notices.length) % notices.length,
                  )
                }
              >
                <Icon name="chevL" size={14} />
              </button>
              <button
                type="button"
                className="btn btn--sm btn--ghost"
                aria-label="Next notice"
                onClick={() =>
                  setNoticeIndex((prev) => (prev + 1) % notices.length)
                }
              >
                <Icon name="chevR" size={14} />
              </button>
            </div>
          </div>

          <div className="noticed-card">
            <span className="noticed-ico">
              <Icon name="cup" size={20} />
            </span>
            <h3 className="noticed-title">{currentNotice.title}</h3>
            <p className="noticed-body">{currentNotice.text}</p>
            <Link
              href="/insights"
              className="linkbtn"
              style={{ marginTop: "4px" }}
            >
              {currentNotice.link}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
