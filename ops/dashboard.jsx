import React, { useState, useMemo, useCallback, useEffect } from 'react'

/* ============================================================================
   BioHack Gold — owner's dashboard.

   Deliberately NOT part of the shop. It is its own page and its own bundle at
   /ops/, so no dashboard code ships to customers and there is no query string
   for anyone to guess their way in.

   It is entirely self-contained: an order already carries the product name,
   size, price and stack name, so this needs nothing from the shop's catalogue.
   It reads the same localStorage key the shop writes, which works because both
   pages sit on one origin.

   WHAT THIS IS NOT: secure, or complete. Orders currently live in each
   visitor's own browser, so this can only show orders placed on THIS device.
   Once orders move to a real backend, this screen reads live data for every
   customer — and at that point it needs real authentication before it is
   reachable at all.
   ========================================================================== */

const ORDERS_KEY = 'bhg.orders'

const P = {
  bg: '#0A0A0B', surface: '#131418', surfaceAlt: '#1A1C21', border: '#26282F',
  text: '#F3F0E9', muted: '#8B8880',
  primary: '#D6A94C',
  info: '#6AA8E0',   // 'payment received' — blue, not the ice accent, so it is
  good: '#6FCF97',   // clearly separable from 'dispatched' green (ΔE 17.6)
}

const money = n => '£' + Number(n || 0).toFixed(2)
const cx = (...a) => a.filter(Boolean).join(' ')

const STATUS_FLOW = [
  { id: 'awaiting_payment', label: 'Awaiting payment', cls: 'awaiting' },
  { id: 'paid', label: 'Payment received', cls: 'paid' },
  { id: 'fulfilled', label: 'Dispatched', cls: 'fulfilled' },
]

function readOrders() {
  try { return JSON.parse(localStorage.getItem(ORDERS_KEY)) || [] } catch { return [] }
}
function writeOrders(list) {
  try { localStorage.setItem(ORDERS_KEY, JSON.stringify(list)) } catch { /* private mode */ }
}

function StatTile({ label, value, sub, accent }) {
  return (
    <div className="tile">
      <span className="tile-label">{label}</span>
      <span className="tile-value" style={accent ? { color: P.primary } : undefined}>{value}</span>
      {sub && <span className="tile-sub">{sub}</span>}
    </div>
  )
}

/* Ranked magnitude: one hue at one step, because colour carries no identity
   here — the name beside each bar does. Values labelled directly, so no legend. */
function RankedBars({ rows, suffix = '' }) {
  const max = Math.max(...rows.map(r => r.value), 1)
  return (
    <div className="bars">
      {rows.map(r => (
        <div className="bar-row" key={r.label} title={`${r.label}: ${r.value}${suffix}`}>
          <span className="bar-name">{r.label}</span>
          <span className="bar-track">
            <span className="bar-fill" style={{ width: `${Math.max(2, (r.value / max) * 100)}%` }} />
          </span>
          <span className="bar-value">{r.value}{suffix}</span>
        </div>
      ))}
    </div>
  )
}

const SAMPLE = [
  { ids: [['BPC-157', '5mg', 49.99], ['TB-500', '5mg', 59.99]], stack: 'Wolverine Stack', pct: 15, status: 'fulfilled', days: 9, who: 'A. Whitfield' },
  { ids: [['GHK-Cu', '50mg', 49.99], ['Glutathione', '600mg', 44.99], ['BPC-157', '5mg', 49.99]], stack: 'Glow Stack', pct: 12, status: 'fulfilled', days: 7, who: 'R. Okonjo' },
  { ids: [['Semax', '10mg', 49.99]], stack: null, pct: 0, status: 'paid', days: 5, who: 'S. Bhatt' },
  { ids: [['CJC-1295', '2mg', 54.99], ['Ipamorelin', '5mg', 49.99]], stack: 'CJC-1295 / Ipamorelin', pct: 10, status: 'paid', days: 3, who: 'M. Lennox' },
  { ids: [['BPC-157', '5mg', 49.99], ['TB-500', '5mg', 59.99], ['KPV', '10mg', 54.99], ['GHK-Cu', '50mg', 49.99]], stack: 'KLOW Stack', pct: 20, status: 'awaiting_payment', days: 1, who: 'J. Farrow' },
  { ids: [['Epitalon', '10mg', 54.99], ['MOTS-c', '10mg', 59.99]], stack: null, pct: 5, status: 'awaiting_payment', days: 0, who: 'T. Nakamura' },
]

function makeSampleOrders() {
  return SAMPLE.map((s, i) => {
    const lines = s.ids.map(([name, size, price]) => ({ name, size, price, qty: 1, bundleId: s.stack ? 'demo' : null }))
    const subtotal = lines.reduce((a, l) => a + l.price * l.qty, 0)
    const discount = subtotal * s.pct / 100
    return {
      ref: 'BHG-DEMO' + (i + 1),
      createdAt: Date.now() - s.days * 86400000,
      status: s.status, demo: true, notified: true,
      customer: { name: s.who, email: 'sample@example.com', line1: '1 Example Road', city: 'London', postcode: 'SW1A 1AA' },
      lines,
      bundles: s.stack ? { demo: { id: 'demo', kind: 'stack', name: s.stack, discountPct: s.pct } } : {},
      subtotal, discount, total: subtotal - discount,
    }
  })
}

export default function Dashboard() {
  const [orders, setOrders] = useState(readOrders)

  useEffect(() => { writeOrders(orders) }, [orders])

  // The shop is a different page on the same origin, so pick up its writes.
  useEffect(() => {
    const onStorage = e => { if (e.key === ORDERS_KEY) setOrders(readOrders()) }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const setStatus = useCallback((ref, status) => {
    setOrders(list => list.map(o => (o.ref === ref ? { ...o, status } : o)))
  }, [])

  const hasDemo = orders.some(o => o.demo)

  const m = useMemo(() => {
    const sum = list => list.reduce((a, o) => a + (o.total || 0), 0)
    const received = orders.filter(o => o.status === 'paid' || o.status === 'fulfilled')
    const awaiting = orders.filter(o => o.status === 'awaiting_payment')
    const units = {}, stacks = {}
    let items = 0, discounted = 0
    for (const o of orders) {
      for (const l of o.lines || []) { units[l.name] = (units[l.name] || 0) + l.qty; items += l.qty }
      if (o.discount > 0) discounted += 1
      for (const b of Object.values(o.bundles || {})) {
        if (b.kind === 'stack') stacks[b.name] = (stacks[b.name] || 0) + 1
      }
    }
    const rank = obj => Object.entries(obj).map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value).slice(0, 6)
    return {
      count: orders.length, revenue: sum(received), awaiting: sum(awaiting),
      awaitingCount: awaiting.length,
      aov: orders.length ? sum(orders) / orders.length : 0,
      avgItems: orders.length ? items / orders.length : 0,
      stackShare: orders.length ? Math.round((discounted / orders.length) * 100) : 0,
      topUnits: rank(units), topStacks: rank(stacks),
    }
  }, [orders])

  return (
    <div className="ops">
      <style>{CSS}</style>

      <header className="ops-head">
        <div>
          <div className="eyebrow">BioHack Gold · Owner</div>
          <h1>Dashboard</h1>
        </div>
        <a className="btn btn-sm" href="../">Open the shop</a>
      </header>

      <p className="note">
        Orders placed on <b>this device</b>. There is no backend yet, so this cannot see anyone else’s —
        once the app moves to Base44 the same screen reads live orders for every customer.
      </p>

      {orders.length === 0 ? (
        <div className="empty">
          <p>No orders on this device yet.</p>
          <button className="btn btn-primary" onClick={() => setOrders(makeSampleOrders())}>
            Load six sample orders
          </button>
          <p className="tiny">Invented data, for showing the screen. Removable.</p>
        </div>
      ) : (
        <>
          {hasDemo && (
            <div className="demo-flag">
              <div>
                <b>Sample data loaded</b>
                <p className="tiny">Some of these orders are invented, for demonstration.</p>
              </div>
              <button className="btn btn-sm" onClick={() => setOrders(list => list.filter(o => !o.demo))}>Remove</button>
            </div>
          )}

          <div className="tiles">
            <StatTile label="Orders" value={m.count} sub={`${m.awaitingCount} awaiting payment`} />
            <StatTile label="Received" value={money(m.revenue)} accent sub="Paid and dispatched" />
            <StatTile label="Outstanding" value={money(m.awaiting)} sub="Not yet cleared" />
            <StatTile label="Average order" value={money(m.aov)} sub={`${m.avgItems.toFixed(1)} vials each`} />
          </div>

          <section>
            <h2>Orders</h2>
            <div className="stack">
              {orders.map(o => (
                <div className="card" key={o.ref}>
                  <div className="card-top">
                    <b className="mono ref">{o.ref}</b>
                    <span className="tiny">
                      {new Date(o.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      {' · '}{o.customer?.name || '—'}
                    </span>
                    <span className="grow" />
                    <b>{money(o.total)}</b>
                  </div>
                  <div className="tiny lines">{(o.lines || []).map(l => `${l.qty}× ${l.name}`).join(', ')}</div>
                  <div className="statusbar">
                    {STATUS_FLOW.map(s => (
                      <button key={s.id}
                        className={cx('status-btn', o.status === s.id && 'on', o.status === s.id && s.cls)}
                        onClick={() => setStatus(o.ref, s.id)}>
                        {o.status === s.id && '✓ '}{s.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {m.topUnits.length > 0 && (
            <section>
              <h2>Vials sold</h2>
              <div className="card"><RankedBars rows={m.topUnits} /></div>
            </section>
          )}

          <section>
            <h2>Is the bundling working?</h2>
            <div className="card">
              <div className="row"><span className="tiny">Orders that earned a discount</span><b>{m.stackShare}%</b></div>
              <div className="row"><span className="tiny">Average vials per order</span><b>{m.avgItems.toFixed(1)}</b></div>
              <div className="row"><span className="tiny">Average order value</span><b>{money(m.aov)}</b></div>
              {m.topStacks.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div className="tiny" style={{ marginBottom: 8 }}>Pre-built stacks taken</div>
                  <RankedBars rows={m.topStacks} />
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

const CSS = `
*,*::before,*::after { box-sizing:border-box; }
body { margin:0; background:${P.bg}; }
.ops {
  min-height:100dvh; background:${P.bg}; color:${P.text};
  font-family: ui-sans-serif,-apple-system,"SF Pro Text","Segoe UI",Inter,system-ui,sans-serif;
  -webkit-font-smoothing:antialiased; font-size:15px; line-height:1.5;
  max-width:1000px; margin:0 auto; padding:26px 16px 60px;
}
.mono { font-family:ui-monospace,"SF Mono",Menlo,monospace; }
h1 { margin:6px 0 0; font-size:27px; letter-spacing:-0.035em; }
h2 { margin:0 0 12px; font-size:19px; letter-spacing:-0.03em; }
p { margin:0; }
button { font:inherit; color:inherit; background:none; border:none; cursor:pointer; }
a { color:inherit; text-decoration:none; }
.eyebrow { font-size:10.5px; letter-spacing:.14em; text-transform:uppercase; color:${P.primary}; font-weight:700; }
.tiny { font-size:11.5px; color:${P.muted}; }
.grow { flex:1; }

.ops-head { display:flex; align-items:flex-end; gap:14px; margin-bottom:14px; }
.ops-head > div { flex:1; }
.note {
  font-size:12.5px; color:${P.muted}; line-height:1.6;
  border:1px solid ${P.border}; border-left:2px solid ${P.primary};
  border-radius:12px; padding:12px 14px; margin-bottom:20px;
}
.note b { color:${P.text}; }

.btn {
  display:inline-flex; align-items:center; justify-content:center; gap:8px;
  padding:11px 16px; border-radius:11px; font-weight:650; font-size:13.5px;
  border:1px solid ${P.border}; background:${P.surfaceAlt}; transition:.15s;
}
.btn:hover { border-color:${P.muted}; }
.btn-sm { padding:8px 12px; font-size:12.5px; border-radius:9px; }
.btn-primary { background:${P.primary}; color:#14120C; border-color:transparent; }

.empty { text-align:center; padding:56px 20px; color:${P.muted}; display:flex; flex-direction:column; align-items:center; gap:14px; }

.demo-flag {
  display:flex; align-items:center; gap:12px; margin-bottom:14px;
  border:1px solid color-mix(in srgb, ${P.primary} 40%, transparent);
  background:${P.surface}; border-radius:13px; padding:13px 14px;
}
.demo-flag > div { flex:1; }

.tiles { display:grid; grid-template-columns:repeat(2,1fr); gap:9px; margin-bottom:28px; }
.tile { background:${P.surface}; border:1px solid ${P.border}; border-radius:15px; padding:14px; display:flex; flex-direction:column; gap:3px; }
.tile-label { font-size:11px; letter-spacing:.09em; text-transform:uppercase; color:${P.muted}; font-weight:600; }
.tile-value { font-size:23px; font-weight:700; letter-spacing:-0.03em; }
.tile-sub { font-size:11.5px; color:${P.muted}; }

section { margin-bottom:28px; }
.stack { display:flex; flex-direction:column; gap:9px; }
.card { background:${P.surface}; border:1px solid ${P.border}; border-radius:15px; padding:14px; }
.card-top { display:flex; align-items:baseline; gap:9px; flex-wrap:wrap; }
.ref { color:${P.primary}; font-size:13.5px; }
.lines { margin-top:6px; }
.row { display:flex; justify-content:space-between; gap:12px; padding:9px 0; border-bottom:1px solid ${P.border}; }
.row:last-child { border-bottom:none; }

/* Thin marks, rounded ends, recessive track. */
.bars { display:flex; flex-direction:column; gap:9px; }
.bar-row { display:grid; grid-template-columns:minmax(92px,1.1fr) 3fr auto; align-items:center; gap:10px; }
.bar-name { font-size:12.5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.bar-track { height:10px; border-radius:5px; background:${P.surfaceAlt}; overflow:hidden; }
.bar-fill { display:block; height:100%; border-radius:5px; background:${P.primary}; }
.bar-value { font-size:12.5px; font-weight:650; font-variant-numeric:tabular-nums; color:${P.muted}; }

/* State is never colour alone — every option carries its label. */
.statusbar { display:flex; gap:6px; margin-top:12px; flex-wrap:wrap; }
.status-btn {
  padding:7px 11px; border-radius:9px; border:1px solid ${P.border};
  background:${P.surfaceAlt}; font-size:11.5px; font-weight:650; color:${P.muted}; transition:.15s;
}
.status-btn:hover { color:${P.text}; }
.status-btn.on.awaiting { background:color-mix(in srgb, ${P.primary} 17%, transparent); color:${P.primary}; border-color:color-mix(in srgb, ${P.primary} 45%, transparent); }
.status-btn.on.paid { background:color-mix(in srgb, ${P.info} 17%, transparent); color:${P.info}; border-color:color-mix(in srgb, ${P.info} 45%, transparent); }
.status-btn.on.fulfilled { background:color-mix(in srgb, ${P.good} 17%, transparent); color:${P.good}; border-color:color-mix(in srgb, ${P.good} 45%, transparent); }

@media (min-width:720px) { .tiles { grid-template-columns:repeat(4,1fr); } }
`
