import { useState, useEffect, useCallback } from "react";

/* ─────────────── TOKENS ─────────────── */
const T = {
  bg:        "#07101F",
  surface:   "#0C1828",
  raised:    "#101F35",
  border:    "#1A2F4A",
  borderHi:  "#253F60",
  accent:    "#FF4E17",
  accentLo:  "rgba(255,78,23,.12)",
  teal:      "#00D4A0",
  tealLo:    "rgba(0,212,160,.10)",
  blue:      "#4A9EFF",
  blueLo:    "rgba(74,158,255,.10)",
  gold:      "#F5C842",
  goldLo:    "rgba(245,200,66,.10)",
  violet:    "#9B7FFF",
  violetLo:  "rgba(155,127,255,.10)",
  white:     "#EAF0FF",
  mid:       "#8FA8CC",
  dim:       "#3D5875",
  font:      "'Barlow', sans-serif",
  fontCond:  "'Barlow Condensed', sans-serif",
  fontMono:  "'IBM Plex Mono', monospace",
};

/* ─────────────── DATA ─────────────── */
const SUITES = [
  {
    id: "revenue", label: "Revenue Suite", color: T.accent, icon: "◈",
    desc: "Capture, convert and track every dollar",
    modules: [
      { id:"sales",   name:"Direct Sales",   icon:"⟡", tag:"Pipeline",     color:T.accent,  desc:"Visual pipeline, lead scoring, AI-driven next-step recommendations and forecast.",  services:9, phase:1 },
      { id:"finance", name:"Direct Finance", icon:"◇", tag:"Financial",    color:T.teal,    desc:"Cash flow, P&L, receivables, payables, projections and financial health alerts.",    services:8, phase:2 },
      { id:"crm",     name:"Direct CRM",     icon:"◉", tag:"Relationship", color:T.gold,    desc:"360° contact profiles, segmentation, enrichment and full interaction timeline.",      services:7, phase:2 },
    ],
  },
  {
    id: "operations", label: "Operations Suite", color: T.teal, icon: "▣",
    desc: "Run teams, spaces and digital presence",
    modules: [
      { id:"people",  name:"Direct People",  icon:"◎", tag:"Team",     color:T.violet, desc:"Onboarding, playbooks, task boards, training tracks and productivity monitoring.",  services:7, phase:3 },
      { id:"sites",   name:"Direct Sites",   icon:"▤", tag:"Digital",  color:T.blue,   desc:"Visual page builder, landing pages, forms, SEO and CDN-powered publishing.",         services:6, phase:3 },
      { id:"academy", name:"Direct Academy", icon:"▷", tag:"Learning", color:T.accent, desc:"Courses, onboarding flows, contextual help, progress tracking and certifications.",   services:5, phase:3 },
      { id:"local",   name:"Direct Local",   icon:"◑", tag:"Physical", color:T.teal,   desc:"Multi-unit scheduling, appointment queues, local presence and WhatsApp integration.", services:6, phase:3 },
    ],
  },
  {
    id: "intelligence", label: "Intelligence Suite", color: T.violet, icon: "✦",
    desc: "Data, automation and AI across every module",
    modules: [
      { id:"insight",  name:"Direct Insight",  icon:"◈", tag:"Analytics",   color:T.gold,   desc:"Executive dashboards, KPIs, trend alerts, cohort reports and actionable insights.", services:6, phase:3 },
      { id:"automate", name:"Direct Automate", icon:"⟳", tag:"Automation",  color:T.blue,   desc:"Visual workflow builder, cross-module triggers, retry queues and execution logs.",   services:6, phase:3 },
      { id:"ai",       name:"Direct AI",       icon:"✦", tag:"AI Layer",    color:T.violet, desc:"Contextual assistant, RAG/FAISS retrieval, token budget manager and tenant memory.", services:9, phase:2 },
    ],
  },
];

const CORE = { id:"core", name:"Direct Core", icon:"⬡", tag:"Foundation", color:T.blue,
  desc:"Auth, multi-tenancy, RBAC, billing hooks, notifications, audit logs and platform shell.", services:12, phase:1 };

const FREE_TOOLS = [
  { id:"ezer",   name:"Ezer",   icon:"◈", color:T.blue,   desc:"Structured business planning for early-stage entrepreneurs.", audience:"Startups" },
  { id:"chefe",  name:"Chefe",  icon:"◉", color:T.teal,   desc:"Lightweight task organizer and follow-up assistant.", audience:"SMBs" },
  { id:"kairos", name:"Kairos", icon:"▷", color:T.gold,   desc:"Creative calendar and content idea generator.", audience:"Media teams" },
  { id:"yafa",   name:"Yafah",  icon:"◎", color:T.accent, desc:"Beauty-sector niche content and local campaign tool.", audience:"Beauty biz" },
];

const PHASES = [
  { n:1, label:"Foundation",    q:"Q1 2025", color:T.blue,   pct:100,
    items:["Monorepo scaffold","Direct Core (auth/tenant/RBAC)","Docker Compose env","Billing gateway stubs","Observability (OTel + Prometheus)","CI/CD pipeline"] },
  { n:2, label:"Revenue Core",  q:"Q2 2025", color:T.accent, pct:60,
    items:["Direct Sales (pipeline/scoring)","Direct Finance (ledger/cashflow)","Direct CRM (360° profile)","Direct AI (RAG + FAISS + token budget)","WebSocket real-time layer","Mobile-first responsive UI"] },
  { n:3, label:"Full Platform", q:"Q3 2025", color:T.teal,   pct:10,
    items:["Direct Sites (page builder)","Direct People (team ops)","Direct Automate (workflow engine)","Direct Insight (BI dashboards)","Direct Academy (LMS)","Direct Local (scheduling)"] },
  { n:4, label:"Global Scale",  q:"Q4 2025", color:T.gold,   pct:0,
    items:["Multi-region deployment","9-language i18n","Regional billing (Pix / Boleto / SEPA)","Auto-scaling K8s workers","Advanced RAG fine-tuning","Community free products launch"] },
];

const ARCH_LAYERS = [
  { layer:"Frontend",     tech:"React + TypeScript · Zustand · i18next · Tailwind",      color:T.blue   },
  { layer:"API Gateway",  tech:"NestJS/Fastify · OpenAPI 3.1 · JWT + Refresh · Rate Limit", color:T.accent },
  { layer:"Services",     tech:"NestJS modules · Zod · RBAC/ABAC · Domain events",       color:T.teal   },
  { layer:"Data",         tech:"MongoDB per service · Redis cache · S3 assets",           color:T.gold   },
  { layer:"Messaging",    tech:"NATS JetStream · Dead-letter queues · Idempotency keys",  color:T.violet },
  { layer:"AI",           tech:"LangChain · RAG · FAISS · Token budget · Tenant memory",  color:T.violet },
  { layer:"Observability",tech:"OpenTelemetry · Prometheus · Grafana · Structured logs",  color:T.blue   },
  { layer:"Infra",        tech:"Docker Compose → K8s · Terraform · CDN · Multi-region",   color:T.teal   },
];

const DOMAINS = [
  { name:"Identity",     services:["auth","tenant","user","permission","session","audit"],                color:T.blue   },
  { name:"Commerce",     services:["billing","subscription","invoice","payment","plan"],                  color:T.teal   },
  { name:"Sales",        services:["lead","pipeline","opportunity","forecast","scoring"],                  color:T.accent },
  { name:"Finance",      services:["ledger","cashflow","receivables","payables","projection"],             color:T.gold   },
  { name:"Relationship", services:["contact","company","segment","interaction","enrichment"],              color:T.gold   },
  { name:"People Ops",   services:["employee","onboarding","task","process","training"],                   color:T.violet },
  { name:"Intelligence", services:["metrics","analytics","kpi","alert","reporting"],                       color:T.blue   },
  { name:"AI Gateway",   services:["orchestration","rag","faiss","token-budget","embeddings","memory"],    color:T.violet },
];

const EVENTS = [
  { domain:"sales",   event:"direct.sales.lead.created",          payload:"leadId · score · stage · assignedTo" },
  { domain:"sales",   event:"direct.sales.opportunity.won",       payload:"dealId · value · tenantId · closedBy" },
  { domain:"finance", event:"direct.finance.payment.received",    payload:"invoiceId · amount · currency · method" },
  { domain:"crm",     event:"direct.crm.contact.updated",         payload:"contactId · changedFields · triggeredBy" },
  { domain:"automate",event:"direct.automate.workflow.executed",  payload:"workflowId · triggerId · status · duration" },
  { domain:"ai",      event:"direct.ai.tokens.budget.exceeded",   payload:"tenantId · module · used · limit · period" },
];

const BILLING_PLANS = [
  { name:"Starter",    price:"$0",    period:"/mo", color:T.blue,   highlight:false,
    includes:["Direct Core","Ezer + Chefe (free tools)","1 user · 1 org","Community support"] },
  { name:"Growth",     price:"$79",   period:"/mo", color:T.accent, highlight:true,
    includes:["Direct Sales + CRM","Direct Finance","500k AI tokens/mo","10 users · 1 org","Email support"] },
  { name:"Scale",      price:"$249",  period:"/mo", color:T.teal,   highlight:false,
    includes:["All 11 modules","5M AI tokens/mo","Unlimited users · 5 orgs","Direct Automate + Insight","Priority support"] },
  { name:"Enterprise", price:"Custom",period:"",    color:T.gold,   highlight:false,
    includes:["Full platform + SLA","Dedicated infra","Custom AI budget","White-label options","Dedicated CSM"] },
];

/* ─────────────── NAV ─────────────── */
const NAV = [
  { section:"PLATFORM" },
  { id:"dashboard",  label:"Dashboard",    icon:"⬡" },
  { section:"PRODUCTS" },
  { id:"revenue",    label:"Revenue Suite",     icon:"◈", color:T.accent },
  { id:"operations", label:"Operations Suite",  icon:"▣", color:T.teal   },
  { id:"intelligence",label:"Intelligence",     icon:"✦", color:T.violet },
  { section:"SYSTEM" },
  { id:"architecture",label:"Architecture",    icon:"◇" },
  { id:"billing",    label:"Billing & Plans",   icon:"▤" },
  { id:"roadmap",    label:"Roadmap",           icon:"▷" },
  { section:"COMMUNITY" },
  { id:"community",  label:"Free Tools",        icon:"◎" },
];

/* ─────────────── TINY UTILS ─────────────── */
const css = (base, extra = {}) => ({ ...base, ...extra });
const Badge = ({ label, color }) => (
  <span style={{ fontSize:10, padding:"2px 8px", borderRadius:20, background:color+"18", color, border:`1px solid ${color}28`, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase" }}>{label}</span>
);
const Chip = ({ label, color = T.mid }) => (
  <span style={{ fontSize:10, padding:"3px 9px", borderRadius:6, background:T.raised, color, border:`1px solid ${T.border}`, fontFamily:T.fontMono }}>{label}</span>
);

/* ─────────────── LOGO ─────────────── */
function Logo({ size = 40 }) {
  return (
    <svg width={size} height={size * .65} viewBox="0 0 80 52" fill="none">
      <path d="M6 2 L50 2 Q72 2 72 26 Q72 50 50 50 L6 50 Z" fill="none" stroke="#C8D8F0" strokeWidth="6" strokeLinejoin="round"/>
      <path d="M6 2 L26 26 L6 50" fill="none" stroke="#C8D8F0" strokeWidth="6" strokeLinejoin="round"/>
      <path d="M26 26 L2 42" stroke="#C8D8F0" strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M20 36 L2 49 L32 49 L52 36 Z" fill={T.accent}/>
      <path d="M52 36 L32 49" stroke="#FF6B35" strokeWidth="1.5"/>
    </svg>
  );
}

/* ─────────────── SIDEBAR ─────────────── */
function Sidebar({ active, setActive, open, setOpen }) {
  return (
    <aside style={{
      width: open ? 220 : 60, minHeight:"100vh",
      background:T.surface, borderRight:`1px solid ${T.border}`,
      display:"flex", flexDirection:"column",
      transition:"width .28s cubic-bezier(.4,0,.2,1)",
      overflow:"hidden", flexShrink:0, position:"relative", zIndex:20,
    }}>
      {/* brand */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{ padding:"18px 14px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10, cursor:"pointer", userSelect:"none" }}
      >
        <Logo size={38}/>
        {open && (
          <div>
            <div style={{ color:T.white, fontFamily:T.fontCond, fontWeight:900, fontSize:20, letterSpacing:"0.1em" }}>DIRECT</div>
            <div style={{ color:T.dim, fontSize:9, letterSpacing:"0.22em", textTransform:"uppercase" }}>Global Platform</div>
          </div>
        )}
      </div>

      {/* nav */}
      <nav style={{ flex:1, padding:"10px 0", overflowY:"auto", overflowX:"hidden" }}>
        {NAV.map((item, i) => {
          if (item.section) return open ? (
            <div key={i} style={{ padding:"16px 16px 4px", color:T.dim, fontSize:9, letterSpacing:"0.22em", fontWeight:700 }}>{item.section}</div>
          ) : <div key={i} style={{ height:14 }}/>;

          const isActive = active === item.id;
          return (
            <button key={item.id} onClick={() => setActive(item.id)} style={{
              display:"flex", alignItems:"center", gap:10, width:"100%",
              padding: open ? "10px 16px" : "12px 18px",
              background: isActive ? T.accentLo : "transparent",
              border:"none", borderLeft:`2px solid ${isActive ? T.accent : "transparent"}`,
              cursor:"pointer", transition:"all .18s", textAlign:"left",
            }}>
              <span style={{ color: isActive ? T.accent : item.color || T.mid, fontSize:15, flexShrink:0, transition:"color .18s" }}>{item.icon}</span>
              {open && <span style={{ color: isActive ? T.white : T.mid, fontSize:13, fontWeight: isActive ? 600 : 400, whiteSpace:"nowrap", transition:"color .18s", letterSpacing:"0.02em" }}>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* footer badge */}
      {open && (
        <div style={{ padding:12, borderTop:`1px solid ${T.border}` }}>
          <div style={{ background:T.raised, borderRadius:8, padding:"10px 12px", border:`1px solid ${T.border}` }}>
            <div style={{ color:T.accent, fontSize:9, letterSpacing:"0.18em", fontWeight:700 }}>PHASE 1 · LIVE</div>
            <div style={{ color:T.dim, fontSize:10, marginTop:2 }}>Foundation complete</div>
          </div>
        </div>
      )}
    </aside>
  );
}

/* ─────────────── TOPBAR ─────────────── */
function Topbar({ view }) {
  const label = NAV.find(n => n.id === view)?.label || "Dashboard";
  return (
    <div style={{
      borderBottom:`1px solid ${T.border}`, background:T.surface,
      padding:"13px 28px", display:"flex", alignItems:"center", justifyContent:"space-between",
      position:"sticky", top:0, zIndex:10,
    }}>
      <div style={{ color:T.white, fontFamily:T.fontCond, fontWeight:700, fontSize:17, letterSpacing:"0.06em" }}>{label.toUpperCase()}</div>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        {/* lang picker */}
        <div style={{ display:"flex", gap:4 }}>
          {["EN","PT","ES"].map((l,i) => (
            <button key={l} style={{
              padding:"3px 9px", borderRadius:5, border:`1px solid ${i===0 ? T.accent : T.border}`,
              background: i===0 ? T.accentLo : "transparent",
              color: i===0 ? T.accent : T.dim, fontSize:10, fontWeight:700, cursor:"pointer",
            }}>{l}</button>
          ))}
        </div>
        {/* notif */}
        <div style={{ position:"relative" }}>
          <div style={{ width:34, height:34, borderRadius:8, background:T.raised, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center", color:T.mid, fontSize:14, cursor:"pointer" }}>◎</div>
          <div style={{ position:"absolute", top:6, right:6, width:6, height:6, borderRadius:"50%", background:T.accent }}/>
        </div>
        {/* avatar */}
        <div style={{ width:34, height:34, borderRadius:8, background:`linear-gradient(135deg,${T.accent},#FF6B35)`, display:"flex", alignItems:"center", justifyContent:"center", color:T.white, fontWeight:800, fontSize:14, fontFamily:T.fontCond }}>M</div>
      </div>
    </div>
  );
}

/* ─────────────── MODULE CARD ─────────────── */
function ModCard({ mod, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={() => onClick && onClick(mod)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? T.raised : T.surface,
        border:`1px solid ${hov ? mod.color+"50" : T.border}`,
        borderRadius:12, padding:"18px",
        cursor: onClick ? "pointer" : "default",
        transition:"all .22s",
        transform: hov ? "translateY(-2px)" : "none",
        boxShadow: hov ? `0 8px 28px ${mod.color}18` : "none",
        position:"relative", overflow:"hidden",
      }}
    >
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background: hov ? `linear-gradient(90deg,${mod.color},transparent)` : "transparent", transition:"all .3s" }}/>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
        <div style={{ width:38, height:38, borderRadius:9, background:mod.color+"15", border:`1px solid ${mod.color}35`, display:"flex", alignItems:"center", justifyContent:"center", color:mod.color, fontSize:17 }}>{mod.icon}</div>
        <Badge label={mod.tag} color={mod.color}/>
      </div>
      <div style={{ fontFamily:T.fontCond, fontWeight:700, fontSize:15, color:T.white, marginBottom:5, letterSpacing:"0.03em" }}>{mod.name}</div>
      <div style={{ color:T.mid, fontSize:12, lineHeight:1.55, marginBottom:12 }}>{mod.desc}</div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ color:T.dim, fontSize:11 }}>{mod.services} services</span>
        <span style={{ color:mod.color, fontSize:11, fontWeight:600 }}>Phase {mod.phase}</span>
      </div>
    </div>
  );
}

/* ─────────────── SECTION TITLE ─────────────── */
function SecTitle({ icon, title, sub, color = T.accent }) {
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ display:"flex", alignItems:"center", gap:9 }}>
        <span style={{ color, fontSize:16 }}>{icon}</span>
        <h2 style={{ color:T.white, fontFamily:T.fontCond, fontWeight:800, fontSize:22, letterSpacing:"0.04em", margin:0 }}>{title}</h2>
      </div>
      {sub && <p style={{ color:T.mid, fontSize:13, marginTop:4, paddingLeft:25, margin:"4px 0 0 25px" }}>{sub}</p>}
    </div>
  );
}

/* ─────────────── VIEWS ─────────────── */

/* DASHBOARD */
function DashView({ setActive }) {
  const [count, setCount] = useState([0,0,0,0]);
  const targets = [15,90,9,8];
  useEffect(() => {
    let frame;
    const animate = () => {
      setCount(c => {
        const next = c.map((v,i) => v < targets[i] ? Math.min(v + Math.ceil((targets[i]-v)/8)+1, targets[i]) : v);
        if (next.some((v,i) => v < targets[i])) frame = requestAnimationFrame(animate);
        return next;
      });
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  const stats = [
    { label:"Modules",    value:count[0], unit:"products", color:T.accent },
    { label:"Services",   value:`${count[1]}+`, unit:"microservices", color:T.blue },
    { label:"Languages",  value:count[2], unit:"locales", color:T.teal },
    { label:"Domains",    value:count[3], unit:"bounded ctx", color:T.gold },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:28 }}>

      {/* hero */}
      <div style={{
        background:`linear-gradient(135deg, ${T.raised} 0%, ${T.surface} 70%, #0D0A1E 100%)`,
        border:`1px solid ${T.border}`, borderRadius:16, padding:"36px 40px",
        position:"relative", overflow:"hidden",
      }}>
        <div style={{ position:"absolute", top:-60, right:-60, width:280, height:280, background:T.accentLo, borderRadius:"50%", filter:"blur(70px)" }}/>
        <div style={{ position:"absolute", bottom:-30, left:160, width:180, height:180, background:T.blueLo, borderRadius:"50%", filter:"blur(50px)" }}/>
        <div style={{ position:"relative" }}>
          <div style={{ display:"flex", alignItems:"center", gap:18, marginBottom:18 }}>
            <Logo size={52}/>
            <div>
              <div style={{ fontFamily:T.fontCond, fontWeight:900, fontSize:40, color:T.white, letterSpacing:"0.08em", lineHeight:1 }}>DIRECT</div>
              <div style={{ color:T.accent, fontSize:11, letterSpacing:"0.28em", fontWeight:700 }}>GLOBAL BUSINESS PLATFORM</div>
            </div>
          </div>
          <p style={{ color:T.mid, fontSize:14, maxWidth:580, lineHeight:1.75, marginBottom:22, margin:"0 0 22px" }}>
            Modular · Multi-tenant · Global. One platform covering revenue, operations, intelligence and AI — built to scale from a single team to enterprise across 5 continents.
          </p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
            {["TypeScript","NestJS","MongoDB","Redis","NATS JetStream","LangChain","FAISS","Docker → K8s"].map(t => (
              <Chip key={t} label={t}/>
            ))}
          </div>
        </div>
      </div>

      {/* metrics */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background:T.raised, border:`1px solid ${T.border}`, borderRadius:12, padding:"20px 22px", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:-8, right:-8, width:50, height:50, background:s.color+"15", borderRadius:"50%", filter:"blur(16px)" }}/>
            <div style={{ fontFamily:T.fontCond, fontWeight:800, fontSize:38, color:T.white, lineHeight:1 }}>{s.value}</div>
            <div style={{ color:s.color, fontSize:11, fontWeight:700, letterSpacing:"0.1em", marginTop:5 }}>{s.label}</div>
            <div style={{ color:T.dim, fontSize:11 }}>{s.unit}</div>
          </div>
        ))}
      </div>

      {/* suites quick nav */}
      <div>
        <SecTitle icon="▣" title="Product Suites" sub="Three integrated suites — click to explore"/>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
          {SUITES.map(suite => (
            <div key={suite.id} onClick={() => setActive(suite.id)} style={{
              background:T.raised, border:`1px solid ${suite.color}40`,
              borderRadius:12, padding:"22px", cursor:"pointer",
              transition:"all .22s", position:"relative", overflow:"hidden",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow=`0 8px 30px ${suite.color}20`; }}
              onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="none"; }}
            >
              <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:suite.color }}/>
              <div style={{ color:suite.color, fontSize:24, marginBottom:10 }}>{suite.icon}</div>
              <div style={{ fontFamily:T.fontCond, fontWeight:800, fontSize:18, color:T.white, marginBottom:6 }}>{suite.label}</div>
              <div style={{ color:T.mid, fontSize:12, marginBottom:14 }}>{suite.desc}</div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {suite.modules.map(m => <Badge key={m.id} label={m.name.replace("Direct ","")} color={suite.color}/>)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* core + phase */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        {/* core */}
        <div>
          <SecTitle icon="⬡" title="Direct Core" sub="Foundation — always included" color={T.blue}/>
          <ModCard mod={CORE}/>
        </div>
        {/* phase progress */}
        <div>
          <SecTitle icon="▷" title="Phase Progress" sub="Current build status" color={T.teal}/>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {PHASES.map(p => (
              <div key={p.n} style={{ background:T.raised, border:`1px solid ${T.border}`, borderRadius:10, padding:"13px 16px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                  <div>
                    <span style={{ fontFamily:T.fontCond, fontWeight:700, color:T.white, fontSize:13 }}>Phase {p.n} — {p.label}</span>
                    <span style={{ color:T.dim, fontSize:11, marginLeft:8 }}>{p.q}</span>
                  </div>
                  <span style={{ color:p.color, fontWeight:700, fontSize:12 }}>{p.pct}%</span>
                </div>
                <div style={{ height:4, background:T.border, borderRadius:4, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${p.pct}%`, background:`linear-gradient(90deg,${p.color},${p.color}AA)`, borderRadius:4, transition:"width 1s" }}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* SUITE VIEW (Revenue / Operations / Intelligence) */
function SuiteView({ suiteId, setDetail }) {
  const suite = SUITES.find(s => s.id === suiteId);
  if (!suite) return null;
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      {/* suite header */}
      <div style={{ background:T.raised, border:`1px solid ${suite.color}40`, borderRadius:14, padding:"28px 32px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:suite.color }}/>
        <div style={{ position:"absolute", top:-40, right:-40, width:180, height:180, background:suite.color+"10", borderRadius:"50%", filter:"blur(50px)" }}/>
        <div style={{ position:"relative" }}>
          <span style={{ color:suite.color, fontSize:32, display:"block", marginBottom:10 }}>{suite.icon}</span>
          <div style={{ fontFamily:T.fontCond, fontWeight:900, fontSize:26, color:T.white, letterSpacing:"0.04em", marginBottom:6 }}>{suite.label}</div>
          <div style={{ color:T.mid, fontSize:14 }}>{suite.desc}</div>
        </div>
      </div>
      {/* modules grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))", gap:14 }}>
        {suite.modules.map(mod => <ModCard key={mod.id} mod={mod} onClick={setDetail}/>)}
      </div>
      {/* events for this suite */}
      <div>
        <SecTitle icon="◇" title="Domain Events" sub="CloudEvents 1.0 spec · Published to NATS JetStream" color={suite.color}/>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {EVENTS.filter(e => e.domain === suiteId || suite.modules.some(m => m.id === e.domain)).map(e => (
            <div key={e.event} style={{ background:T.raised, border:`1px solid ${T.border}`, borderRadius:8, padding:"12px 16px", display:"flex", gap:16, alignItems:"flex-start" }}>
              <span style={{ fontFamily:T.fontMono, fontSize:11, color:suite.color, minWidth:0, flex:"0 0 auto", maxWidth:280, wordBreak:"break-all" }}>{e.event}</span>
              <span style={{ color:T.dim, fontSize:11, fontFamily:T.fontMono }}>{e.payload}</span>
            </div>
          ))}
          {EVENTS.filter(e => e.domain === suiteId || suite.modules.some(m => m.id === e.domain)).length === 0 && (
            <div style={{ color:T.dim, fontSize:13, padding:"12px 0" }}>See Architecture → Domain Events for all {suite.modules.length * 3}+ events.</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ARCHITECTURE */
function ArchView() {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:28 }}>
      <SecTitle icon="◈" title="Platform Architecture" sub="Modular monolith → microservices-ready · Isolated domains · No shared collections"/>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:12 }}>
        {ARCH_LAYERS.map(l => (
          <div key={l.layer} style={{ background:T.raised, border:`1px solid ${T.border}`, borderLeft:`3px solid ${l.color}`, borderRadius:10, padding:"15px 16px" }}>
            <div style={{ color:l.color, fontWeight:700, fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>{l.layer}</div>
            <div style={{ color:T.mid, fontSize:12, lineHeight:1.65 }}>{l.tech}</div>
          </div>
        ))}
      </div>

      <SecTitle icon="▣" title="Bounded Contexts" sub="8 domains · 1 MongoDB per service · No cross-domain collection sharing"/>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:12 }}>
        {DOMAINS.map(d => (
          <div key={d.name} style={{ background:T.raised, border:`1px solid ${T.border}`, borderRadius:10, padding:"16px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:d.color, flexShrink:0 }}/>
              <span style={{ color:T.white, fontFamily:T.fontCond, fontWeight:700, fontSize:14, letterSpacing:"0.04em" }}>{d.name}</span>
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {d.services.map(s => <Chip key={s} label={s} color={d.color+"CC"}/>)}
            </div>
          </div>
        ))}
      </div>

      <SecTitle icon="◇" title="Domain Event Contract" sub="CloudEvents 1.0 · NATS JetStream · Idempotency keys"/>
      <div style={{ background:T.raised, border:`1px solid ${T.border}`, borderRadius:10, padding:"20px 22px", fontFamily:T.fontMono, fontSize:12, color:T.mid, lineHeight:2, overflowX:"auto" }}>
        <span style={{ color:T.dim }}>{"// Every service event follows this contract"}</span>{"\n"}
        <span style={{ color:T.blue }}>{"{"}</span>{"\n"}
        {"  "}<span style={{ color:T.gold }}>"specversion"</span>{": "}<span style={{ color:T.teal }}>"1.0"</span>,{"\n"}
        {"  "}<span style={{ color:T.gold }}>"type"</span>{": "}<span style={{ color:T.teal }}>"direct.{`{domain}`}.{`{entity}`}.{`{verb}`}"</span>,{"\n"}
        {"  "}<span style={{ color:T.gold }}>"source"</span>{": "}<span style={{ color:T.teal }}>"/direct/{`{service}`}"</span>,{"\n"}
        {"  "}<span style={{ color:T.gold }}>"tenantId"</span>{": "}<span style={{ color:T.accent }}>"tenant_uuid"</span>,{"\n"}
        {"  "}<span style={{ color:T.gold }}>"idempotencyKey"</span>{": "}<span style={{ color:T.accent }}>"uuid-v4"</span>,{"\n"}
        {"  "}<span style={{ color:T.gold }}>"data"</span>{": { "}<span style={{ color:T.violet }}>...payload</span>{" }"}{"\n"}
        <span style={{ color:T.blue }}>{"}"}</span>
      </div>

      <SecTitle icon="✦" title="All Domain Events" sub={`${EVENTS.length} defined · grows to 60+ at full platform`}/>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {EVENTS.map(e => {
          const suite = SUITES.find(s => s.modules.some(m => m.id === e.domain)) || SUITES[0];
          const color = suite?.color || T.mid;
          return (
            <div key={e.event} style={{ background:T.raised, border:`1px solid ${T.border}`, borderRadius:8, padding:"12px 16px", display:"flex", gap:14, alignItems:"center", flexWrap:"wrap" }}>
              <Badge label={e.domain} color={color}/>
              <span style={{ fontFamily:T.fontMono, fontSize:12, color:T.white, flex:1 }}>{e.event}</span>
              <span style={{ fontFamily:T.fontMono, fontSize:11, color:T.dim }}>{e.payload}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* BILLING */
function BillingView() {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:28 }}>
      <SecTitle icon="▤" title="Billing & Plans" sub="Module · Bundle · Full platform · Usage-based AI · Regional payment methods"/>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:16 }}>
        {BILLING_PLANS.map(p => (
          <div key={p.name} style={{
            background: p.highlight ? p.color+"10" : T.raised,
            border:`1px solid ${p.highlight ? p.color+"70" : T.border}`,
            borderRadius:14, padding:"26px 22px", position:"relative", overflow:"hidden",
          }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:p.color }}/>
            {p.highlight && <div style={{ position:"absolute", top:12, right:14, fontSize:9, padding:"2px 7px", borderRadius:10, background:p.color, color:"#fff", fontWeight:800, letterSpacing:"0.1em" }}>POPULAR</div>}
            <div style={{ color:p.color, fontWeight:800, fontSize:11, letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:10 }}>{p.name}</div>
            <div style={{ display:"flex", alignItems:"baseline", gap:3, marginBottom:18 }}>
              <span style={{ fontFamily:T.fontCond, fontSize:34, fontWeight:800, color:T.white }}>{p.price}</span>
              <span style={{ color:T.dim, fontSize:13 }}>{p.period}</span>
            </div>
            {p.includes.map(item => (
              <div key={item} style={{ color:T.mid, fontSize:12, padding:"5px 0", borderBottom:`1px solid ${T.border}`, display:"flex", gap:8 }}>
                <span style={{ color:p.color }}>✓</span>{item}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
        {[
          { title:"Payment Methods", color:T.teal,
            items:["Credit Card (global)","PIX (Brazil)","Boleto (Brazil)","SEPA Debit (EU)","ACH Transfer (US)","Local methods (LATAM/Asia)"] },
          { title:"AI Credit Tiers", color:T.violet,
            items:["Starter: 0 tokens","Growth: 500k/mo","Scale: 5M/mo","Add-on: pay-per-token","Budget cap per module","Overage alerts & hard stops"] },
          { title:"Billing Architecture", color:T.blue,
            items:["Stripe-compatible abstraction","Per-module metering","Usage events via NATS","Invoice generation service","Dunning management","Multi-currency support"] },
        ].map(col => (
          <div key={col.title} style={{ background:T.raised, border:`1px solid ${T.border}`, borderLeft:`3px solid ${col.color}`, borderRadius:10, padding:"18px" }}>
            <div style={{ color:col.color, fontWeight:700, fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:12 }}>{col.title}</div>
            {col.items.map(it => (
              <div key={it} style={{ color:T.mid, fontSize:12, padding:"5px 0", borderBottom:`1px solid ${T.border}15` }}>{it}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ROADMAP */
function RoadmapView() {
  const RISKS = [
    { risk:"Multi-tenant data leak",  sev:"CRITICAL", color:T.accent, fix:"TenantId middleware on every DB query + integration test suite." },
    { risk:"AI cost overrun",         sev:"HIGH",     color:T.gold,   fix:"Hard token caps per plan. Response caching. Graceful LLM degradation." },
    { risk:"Monolith boundary drift", sev:"HIGH",     color:T.gold,   fix:"NestJS module isolation. CI checks on cross-domain imports." },
    { risk:"Event ordering",          sev:"HIGH",     color:T.gold,   fix:"NATS JetStream sequences + idempotency keys on all consumers." },
    { risk:"i18n inconsistency",      sev:"MED",      color:T.blue,   fix:"i18next centralized keys. CI lint against hardcoded strings." },
    { risk:"Billing edge cases",      sev:"MED",      color:T.blue,   fix:"Billing as single source of truth. Stripe-compatible abstraction layer." },
  ];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:28 }}>
      <SecTitle icon="▷" title="Roadmap" sub="4 phases · Foundation → Global scale"/>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {PHASES.map(p => (
          <div key={p.n} style={{ background:T.raised, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
            <div style={{ background:p.color+"10", borderBottom:`1px solid ${p.color}25`, padding:"16px 22px", display:"flex", alignItems:"center", gap:16 }}>
              <div style={{ width:38, height:38, borderRadius:9, background:p.color+"20", border:`2px solid ${p.color}50`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:T.fontCond, fontWeight:900, color:p.color, fontSize:18 }}>{p.n}</div>
              <div style={{ flex:1 }}>
                <span style={{ fontFamily:T.fontCond, fontWeight:800, color:T.white, fontSize:16, letterSpacing:"0.04em" }}>Phase {p.n} — {p.label}</span>
                <span style={{ color:p.color, fontSize:11, fontWeight:700, marginLeft:10 }}>{p.q}</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:80, height:5, background:T.border, borderRadius:3, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${p.pct}%`, background:p.color, borderRadius:3 }}/>
                </div>
                <span style={{ color:p.color, fontSize:11, fontWeight:700, minWidth:30 }}>{p.pct}%</span>
              </div>
            </div>
            <div style={{ padding:"16px 22px", display:"flex", flexWrap:"wrap", gap:8 }}>
              {p.items.map(it => (
                <span key={it} style={{ fontSize:12, padding:"5px 12px", borderRadius:20, background:T.surface, color:T.mid, border:`1px solid ${T.border}` }}>✓ {it}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <SecTitle icon="◎" title="Technical Risks & Mitigation" sub="Identified at architecture phase"/>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:12 }}>
        {RISKS.map(r => (
          <div key={r.risk} style={{ background:T.raised, border:`1px solid ${T.border}`, borderRadius:10, padding:"16px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <span style={{ color:T.white, fontWeight:700, fontSize:13 }}>{r.risk}</span>
              <span style={{ fontSize:9, padding:"3px 8px", borderRadius:10, background:r.color+"18", color:r.color, fontWeight:800 }}>{r.sev}</span>
            </div>
            <div style={{ color:T.mid, fontSize:12, lineHeight:1.6 }}>{r.fix}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* COMMUNITY */
function CommunityView() {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      <SecTitle icon="◎" title="Free Community Tools" sub="4 free products · Gateway into the Direct ecosystem · No credit card required"/>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:16 }}>
        {FREE_TOOLS.map(p => (
          <div key={p.id} style={{ background:T.raised, border:`1px solid ${T.border}`, borderRadius:14, padding:"26px 22px", position:"relative" }}>
            <div style={{ position:"absolute", top:14, right:16 }}><Badge label="FREE" color={T.teal}/></div>
            <div style={{ width:46, height:46, borderRadius:12, background:p.color+"15", border:`1px solid ${p.color}35`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:21, color:p.color, marginBottom:16 }}>{p.icon}</div>
            <div style={{ fontFamily:T.fontCond, fontWeight:900, fontSize:22, color:T.white, marginBottom:6 }}>{p.name}</div>
            <div style={{ color:T.mid, fontSize:13, lineHeight:1.65, marginBottom:14 }}>{p.desc}</div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <Badge label={p.audience} color={p.color}/>
              <button style={{ padding:"7px 16px", background:p.color+"15", border:`1px solid ${p.color}35`, borderRadius:8, color:p.color, fontSize:12, fontWeight:700, cursor:"pointer" }}>Open →</button>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background:T.raised, border:`1px solid ${T.border}`, borderRadius:12, padding:"22px 26px" }}>
        <div style={{ color:T.white, fontFamily:T.fontCond, fontWeight:800, fontSize:17, marginBottom:8 }}>Conversion Strategy</div>
        <p style={{ color:T.mid, fontSize:13, lineHeight:1.8, margin:0 }}>
          All free tools share the Direct Core identity layer — same login, same design, same platform shell. Free users see upgrade CTAs contextually when hitting limits (10k AI tokens/mo). Upsell is one click. Churn risk is low because moving data out requires rebuilding from scratch. Community grows the brand; paid converts the results.
        </p>
      </div>
    </div>
  );
}

/* MODULE DETAIL MODAL */
const MODULE_FRONTEND = {
  sales:   ["Kanban pipeline with drag & drop","Lead profile with full timeline","AI suggestion sidebar — next best action","Forecast dashboard with targets","Sequence builder for follow-ups","Mobile-first quick-add lead"],
  finance: ["Cash flow calendar view","P&L summary dashboard","Scenario simulator (optimistic / base / pessimistic)","Receivables & payables cards","Financial health indicator","Scheduled report delivery"],
  crm:     ["Contact list with advanced filters","360° profile — deals, payments, interactions","Segment builder with tag rules","Enrichment status indicator","Import/export with field mapping","Engagement recurrence panel"],
  people:  ["Team board by department","Onboarding checklist per role","Process builder with steps","Playbook library with search","Training track progress per employee","Productivity heatmap"],
  sites:   ["Drag-and-drop visual editor","Template library with preview","SEO metadata panel per page","Form builder integrated with CRM","Version history and restore","One-click publish with CDN invalidation"],
  academy: ["Learning track overview","Lesson cards with progress bar","Contextual help panel inside modules","Search across all content","Certificate on completion","Onboarding flow per role"],
  local:   ["Multi-unit dashboard","Visual weekly schedule","Appointment queue per unit","Service area map view","WhatsApp quick-send integration","Status board — waiting / in progress / done"],
  insight: ["Executive KPI grid","Trend line charts per metric","Alert inbox with severity levels","Period comparison — MoM, YoY","Cohort analysis panel","Automated report scheduler"],
  automate:["Visual flow builder with nodes","Trigger catalog — event / schedule / webhook","Action library across all modules","Test sandbox with trace log","Active workflows status board","Dead-letter queue viewer"],
  ai:      ["Chat panel — contextual to current module","Suggestion cards — actionable, short","Token budget indicator per session","Knowledge base manager","Prompt history and re-run","Response cache status"],
  core:    ["Platform shell & top nav","Org switcher","RBAC role builder","Notification center (push / email / WA)","Audit log timeline","Plan & billing overview dashboard"],
};
const MODULE_BACKEND = {
  sales:   ["lead-service","opportunity-service","pipeline-service","forecast-service","scoring-engine","interaction-history","reminder-engine","sales-analytics","ai-sales-orchestrator"],
  finance: ["ledger-service","cashflow-service","receivables-service","payables-service","pricing-calculator","financial-analytics","projection-engine","alert-rules-engine"],
  crm:     ["contact-service","company-service","tagging-service","segmentation-service","interaction-service","enrichment-service","customer-profile-aggregator"],
  people:  ["employee-service","onboarding-service","task-service","process-service","playbook-service","training-service","productivity-tracker"],
  sites:   ["page-builder-service","template-service","form-service","publish-service","seo-metadata-service","asset-management"],
  academy: ["lesson-service","course-service","onboarding-flow-service","progress-tracking","help-content-service"],
  local:   ["location-service","schedule-service","appointment-service","unit-service","service-area-service","local-communication-service"],
  insight: ["metrics-service","analytics-service","alert-engine","reporting-service","recommendation-engine","kpi-aggregation"],
  automate:["workflow-engine","trigger-service","action-service","integration-service","execution-log","rule-engine"],
  ai:      ["ai-gateway","prompt-orchestration","context-builder","retrieval-service","token-budget-manager","session-memory","tenant-memory","knowledge-base","embeddings-pipeline"],
  core:    ["auth-service","tenant-service","user-service","permission-service","notification-service","audit-log-service","billing-hooks","config-service","org-service","session-manager","webhook-service","feature-flags"],
};

function ModDetail({ mod, onClose }) {
  if (!mod) return null;
  const fe = MODULE_FRONTEND[mod.id] || [];
  const be = MODULE_BACKEND[mod.id] || [];
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(4,8,18,.88)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:20, backdropFilter:"blur(8px)" }} onClick={onClose}>
      <div style={{ background:T.surface, border:`1px solid ${mod.color}50`, borderRadius:16, maxWidth:680, width:"100%", maxHeight:"88vh", overflow:"auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ position:"sticky", top:0, background:T.surface, borderBottom:`1px solid ${T.border}`, padding:"20px 24px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:44, height:44, borderRadius:10, background:mod.color+"18", border:`1px solid ${mod.color}40`, display:"flex", alignItems:"center", justifyContent:"center", color:mod.color, fontSize:20 }}>{mod.icon}</div>
            <div>
              <div style={{ fontFamily:T.fontCond, fontWeight:800, fontSize:20, color:T.white }}>{mod.name}</div>
              <div style={{ color:mod.color, fontSize:11, fontWeight:600 }}>{mod.tag} · Phase {mod.phase} · {mod.services} services</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:T.dim, fontSize:20, cursor:"pointer", lineHeight:1 }}>✕</button>
        </div>
        <div style={{ padding:"24px", display:"flex", flexDirection:"column", gap:22 }}>
          <p style={{ color:T.mid, fontSize:13, lineHeight:1.7, margin:0 }}>{mod.desc}</p>
          <div>
            <div style={{ color:T.accent, fontSize:10, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:12 }}>FRONTEND</div>
            {fe.map(f => (
              <div key={f} style={{ display:"flex", gap:10, padding:"7px 0", borderBottom:`1px solid ${T.border}10` }}>
                <span style={{ color:mod.color, fontSize:11, marginTop:1 }}>▹</span>
                <span style={{ color:T.mid, fontSize:13 }}>{f}</span>
              </div>
            ))}
          </div>
          <div>
            <div style={{ color:T.blue, fontSize:10, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:12 }}>BACKEND SERVICES</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
              {be.map(s => <Chip key={s} label={s} color={T.blue+"CC"}/>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── APP ROOT ─────────────── */
export default function App() {
  const [view, setView]     = useState("dashboard");
  const [sideOpen, setSideOpen] = useState(true);
  const [detail, setDetail] = useState(null);

  const renderView = useCallback(() => {
    if (view === "dashboard")     return <DashView setActive={setView}/>;
    if (view === "revenue")       return <SuiteView suiteId="revenue" setDetail={setDetail}/>;
    if (view === "operations")    return <SuiteView suiteId="operations" setDetail={setDetail}/>;
    if (view === "intelligence")  return <SuiteView suiteId="intelligence" setDetail={setDetail}/>;
    if (view === "architecture")  return <ArchView/>;
    if (view === "billing")       return <BillingView/>;
    if (view === "roadmap")       return <RoadmapView/>;
    if (view === "community")     return <CommunityView/>;
    return null;
  }, [view]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:${T.bg};min-height:100vh;}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-track{background:${T.surface};}
        ::-webkit-scrollbar-thumb{background:${T.border};border-radius:3px;}
        ::-webkit-scrollbar-thumb:hover{background:${T.accent};}
        button{font-family:${T.font};}
      `}</style>

      <div style={{ display:"flex", minHeight:"100vh", fontFamily:T.font, background:T.bg }}>
        <Sidebar active={view} setActive={setView} open={sideOpen} setOpen={setSideOpen}/>
        <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
          <Topbar view={view}/>
          <main style={{ flex:1, padding:"28px 32px", overflowY:"auto" }}>
            {renderView()}
          </main>
        </div>
      </div>

      {detail && <ModDetail mod={detail} onClose={() => setDetail(null)}/>}
    </>
  );
}
