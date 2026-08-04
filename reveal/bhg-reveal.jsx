import React, { useState, useEffect, useRef, useCallback } from "react";

/* ------------------------------------------------------------------ *
 * BioHack Gold — private reveal page.
 *
 * One page, handed to Karl. He breaks the sterile seal on a vial cap,
 * his name types on, the reconstitution plays, and the gate opens his
 * venture. The way back to Lee only exists after he has actually been
 * in and come out again.
 *
 * Everything re-skinnable lives in the three config objects below.
 * Nothing under them is hardcoded to this client.
 *
 * Lineage: the wax-seal reveal built for Karl Gardner. Same choreography
 * and the same hard-won rules (see the comments — they are load-bearing),
 * different seal, and deliberately NOT his serif identity.
 * ------------------------------------------------------------------ */

const BIZ = {
  firstName: "Karl",
  initial: "K",

  // His venture. Opened in a new tab from the gate.
  siteUrl: "https://leedavidsherriff.github.io/biohack-gold/",

  // The reconstitution clip. Paths are relative to /hello/ where this deploys.
  clipUrl: "../media/hero-01-reconstitution.mp4",
  clipPoster: "../media/hero-poster.jpg",

  // Photoreal seal, transparent, square, centred. Higgsfield — brushed gold
  // crimp cap with the K struck into it. Prompt filed in ASSET-PROMPTS.md.
  // Empty this and the built-in SVG cap takes over with no other changes.
  sealImage: "./assets/seal.webp",

  // Texture behind the gate button. Flat gold is the house look — try
  // "../media/goldleaf.webp" if a foil finish is ever wanted again.
  foilImage: "",

  copy: {
    sealLabel: "Break the sterile seal",
    nameSub: "Your venture is live.",
    clipCaption: "Your hero. It does this on every visit.",
    enterLabel: "Enter BioHack Gold",
  },

  timing: {
    crackMs: 1000,        // the cap flipping off
    typeMs: 90,           // per character of the name
    nameHoldMs: 1600,     // beat after the name finishes typing
    gateDelayMs: 5200,    // clip plays this long before the button appears
    contactDelayMs: 1400, // pause after "where it stands" before the seal
  },

  // Lifted straight from the app build so the two read as one thing.
  palette: {
    ground: "#131418",
    groundDeep: "#08080A",
    text: "#F3F0E9",
    textSoft: "rgba(243,240,233,0.64)",
    textFaint: "rgba(243,240,233,0.38)",
    gold: "#D6A94C",
    goldLit: "#F0D08B",
    goldDeep: "#8A6E31",
    ice: "#79C2D4",
    onGold: "#14120C",
  },
};

/* "Where it stands". Confident, never apologetic — but never overclaiming
   either. He is about to look at placeholder prices and dummy bank details,
   and it is far better that he hears it here than spots it himself. */
const PROGRESS = {
  eyebrow: "Where it stands",
  heading: "Built to carry the range.",
  body:
    "All of it is live and running — the catalogue, the stack builder that pushes the basket up as it fills, the bank-transfer checkout, the way it moves on a phone. What it is carrying at the moment is my read of your range: my prices, my batch numbers, my placeholder bank details. Sit down with me, hand over your real numbers and your lab reports, and they go straight in. Same frame, your business in it.",
  sealHeading: "Say the word.",
  sealSub: "Press and hold.",
  siteAgainLabel: "Open it again",
  replayLabel: "Watch from the start",
};

const CONTACT = {
  // "after-visit" (default) — contact only exists once he has been into the
  //                           live site and come back.
  // "always"                — available without leaving (testing / demo).
  // "never"                 — never renders.
  unlock: "after-visit",

  // He must be away at least this long, so a mis-tap does not unlock it.
  minSecondsAway: 8,

  channel: "whatsapp",          // "whatsapp" | "sms"
  whatsapp: "447933666396",     // international, digits only
  phone: "",                    // used when channel is "sms"
  message: "Lee, I love it. What's the damage?",

  holdMs: 1500,                 // press-and-hold duration
  hapticMs: 30,
  sealAriaLabel: "Press and hold to send Lee a message",
};

/* ------------------------------------------------------------------ */

const P = BIZ.palette;

function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function buildContactHref() {
  const msg = encodeURIComponent(CONTACT.message);
  if (CONTACT.channel === "sms") {
    const num = String(CONTACT.phone || "").replace(/[^\d+]/g, "");
    // `?&body=` is the form that survives both iOS and Android.
    return `sms:${num}?&body=${msg}`;
  }
  const wa = String(CONTACT.whatsapp || "").replace(/[^\d]/g, "");
  return `https://wa.me/${wa}?text=${msg}`;
}

/* -------------------------- The sterile seal ----------------------- */

/* The hold ring on its own, for when a photographed seal is in use — the
   SVG seal must never be drawn over the photograph. */
function ProgressRing({ size, progress }) {
  const r = 47;
  const circ = 2 * Math.PI * r;
  return (
    <svg
      viewBox="0 0 120 120" width={size} height={size}
      aria-hidden="true" focusable="false"
      style={{ position: "absolute", inset: 0, overflow: "visible" }}
    >
      <circle
        cx="60" cy="60" r={r} fill="none"
        stroke={P.goldLit} strokeWidth="2.5" strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - Math.min(Math.max(progress, 0), 1))}
        transform="rotate(-90 60 60)"
        style={{ opacity: progress > 0 ? 1 : 0 }}
      />
    </svg>
  );
}

function Seal(props) {
  const { size = 168, progress = 0, showRing = false } = props;
  const [failed, setFailed] = useState(false);

  if (BIZ.sealImage && !failed) {
    return (
      <div style={{ position: "relative", width: size, height: size, lineHeight: 0 }}>
        <img
          className="bhg-sealimg"
          src={BIZ.sealImage}
          alt=""
          aria-hidden="true"
          draggable={false}
          onError={() => setFailed(true)}
          style={{
            display: "block", width: "88%", height: "88%", margin: "6%",
            objectFit: "contain", userSelect: "none", WebkitUserDrag: "none",
          }}
        />
        {showRing && <ProgressRing size={size} progress={progress} />}
      </div>
    );
  }
  return <SvgSterileSeal {...props} />;
}

/* A vial's flip-off cap, seen from directly above: knurled aluminium crimp
   ring, raised centre disc, the initial debossed into it. The disc carries
   its own class so it can lift and flip away on its own — a cap does not
   crack like wax, it pops. */
function SvgSterileSeal({
  size = 168,
  initial = BIZ.initial,
  progress = 0,        // 0..1, drives the ring on the hold control
  showRing = false,
  idPrefix = "seal",
}) {
  const ringR = 52;
  const circ = 2 * Math.PI * ringR;

  const mId = `${idPrefix}-metal`;
  const dId = `${idPrefix}-disc`;
  const sId = `${idPrefix}-shade`;

  // Knurling around the crimp rim — the detail that says "aluminium seal".
  const teeth = [];
  for (let i = 0; i < 72; i += 1) {
    const a = (i / 72) * Math.PI * 2;
    const x1 = 60 + Math.cos(a) * 40.5;
    const y1 = 60 + Math.sin(a) * 40.5;
    const x2 = 60 + Math.cos(a) * 45.5;
    const y2 = 60 + Math.sin(a) * 45.5;
    teeth.push(
      <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
        stroke="rgba(0,0,0,0.30)" strokeWidth="0.9" strokeLinecap="round" />
    );
  }

  return (
    <svg
      viewBox="0 0 120 120" width={size} height={size}
      aria-hidden="true" focusable="false"
      style={{ display: "block", overflow: "visible" }}
    >
      <defs>
        {/* Light caught off-centre, top-left — same key as the product shots. */}
        <linearGradient id={mId} x1="18%" y1="6%" x2="82%" y2="96%">
          <stop offset="0%" stopColor={P.goldLit} />
          <stop offset="42%" stopColor={P.gold} />
          <stop offset="100%" stopColor={P.goldDeep} />
        </linearGradient>
        <radialGradient id={dId} cx="36%" cy="28%" r="82%">
          <stop offset="0%" stopColor={P.goldLit} />
          <stop offset="58%" stopColor={P.gold} />
          <stop offset="100%" stopColor={P.goldDeep} />
        </radialGradient>
        <radialGradient id={sId} cx="50%" cy="50%" r="50%">
          <stop offset="60%" stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.34)" />
        </radialGradient>
      </defs>

      {/* Crimp ring — stays put while the centre goes. */}
      <g className="bhg-ring">
        <circle cx="60" cy="60" r="46" fill={`url(#${mId})`} />
        <g>{teeth}</g>
        <circle cx="60" cy="60" r="46" fill={`url(#${sId})`} />
        {/* the shoulder the disc sits in */}
        <circle cx="60" cy="60" r="33" fill="rgba(0,0,0,0.42)" />
        <circle cx="60" cy="60" r="33" fill="none" stroke="rgba(255,238,190,0.18)" strokeWidth="0.8" />
      </g>

      {/* Flip-off centre */}
      <g className="bhg-disc">
        <circle cx="60" cy="60" r="30" fill={`url(#${dId})`} />
        <circle cx="60" cy="60" r="30" fill="none" stroke="rgba(0,0,0,0.28)" strokeWidth="1.1" />
        {/* debossed initial: a dark cut with a light lip above it */}
        <text x="60" y="60.8" textAnchor="middle" dominantBaseline="central"
          style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif", fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", fill: "rgba(0,0,0,0.42)" }}>
          {initial}
        </text>
        <text x="60" y="60" textAnchor="middle" dominantBaseline="central"
          style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif", fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", fill: "rgba(255,240,200,0.26)" }}>
          {initial}
        </text>
      </g>

      {/* Hold progress, riding outside the rim */}
      {showRing && (
        <circle
          cx="60" cy="60" r={ringR} fill="none"
          stroke={P.goldLit} strokeWidth="2.5" strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - Math.min(Math.max(progress, 0), 1))}
          transform="rotate(-90 60 60)"
          style={{ opacity: progress > 0 ? 1 : 0 }}
        />
      )}
    </svg>
  );
}

/* --------------------------- The page ----------------------------- */

export default function BioHackGoldReveal() {
  const reduced = useRef(prefersReducedMotion()).current;

  const cameBackAlready =
    typeof window !== "undefined" && window.location.hash === "#seen";

  const [stage, setStage] = useState(cameBackAlready ? "returned" : "seal");
  const [typed, setTyped] = useState("");
  const [showGate, setShowGate] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [cracking, setCracking] = useState(false);
  const [held, setHeld] = useState(0);

  const [unlocked, setUnlocked] = useState(() => {
    if (CONTACT.unlock === "never") return false;
    if (CONTACT.unlock === "always") return true;
    return cameBackAlready;
  });

  const leftAt = useRef(null);
  const rafRef = useRef(null);
  const timers = useRef([]);

  const later = useCallback((fn, ms) => {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  }, []);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    },
    []
  );

  /* --- return detection: away long enough == he actually went in --- */
  useEffect(() => {
    if (CONTACT.unlock !== "after-visit") return undefined;

    const markLeft = () => { leftAt.current = Date.now(); };

    const markBack = () => {
      if (leftAt.current == null) return;
      const away = (Date.now() - leftAt.current) / 1000;
      leftAt.current = null;
      if (away < CONTACT.minSecondsAway) return;  // mis-tap, stay put
      setUnlocked(true);
      setStage("returned");
    };

    const onVis = () => (document.hidden ? markLeft() : markBack());
    const onBlur = () => markLeft();
    const onFocus = () => markBack();

    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  /* --- stage choreography --- */
  useEffect(() => {
    if (stage !== "name") return;
    if (reduced) {
      setTyped(BIZ.firstName);
      later(() => setStage("clip"), 600);
      return;
    }
    let i = 0;
    const tick = () => {
      i += 1;
      setTyped(BIZ.firstName.slice(0, i));
      if (i < BIZ.firstName.length) later(tick, BIZ.timing.typeMs);
      else later(() => setStage("clip"), BIZ.timing.nameHoldMs);
    };
    later(tick, BIZ.timing.typeMs);
  }, [stage, reduced, later]);

  useEffect(() => {
    if (stage !== "clip") return;
    later(() => setShowGate(true), reduced ? 0 : BIZ.timing.gateDelayMs);
  }, [stage, reduced, later]);

  useEffect(() => {
    if (stage !== "returned") return;
    later(() => setShowContact(true), reduced ? 0 : BIZ.timing.contactDelayMs);
  }, [stage, reduced, later]);

  /* --- break the seal --- */
  const breakSeal = () => {
    if (reduced) { setStage("name"); return; }
    setCracking(true);
    later(() => setStage("name"), BIZ.timing.crackMs);
  };

  /* --- gate: into his venture --- */
  const enterSite = () => {
    // Written BEFORE we open, so a back button or a tab-replacing in-app
    // browser still lands him on the unlocked state.
    try {
      window.history.replaceState(null, "", "#seen");
    } catch (e) {
      /* replaceState can throw in odd embeds — the visit still counts */
    }
    leftAt.current = Date.now();
    window.open(BIZ.siteUrl, "_blank", "noopener,noreferrer");
    // First time through he has to actually go and look. On any later run he
    // has already earned it, so don't make him prove it twice.
    if (CONTACT.unlock === "always" || unlocked) setStage("returned");
  };

  /* --- run it again from the top --- */
  const replay = () => {
    cancelHold();
    setTyped("");
    setCracking(false);
    setShowGate(false);
    setShowContact(false);
    setStage("seal");
    // `unlocked` deliberately stays true — he has already earned the seal,
    // so a second viewing does not make him prove it again.
  };

  /* --- press and hold --- */
  const holdStart = useRef(0);

  const cancelHold = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    holdStart.current = 0;
    setHeld(0);
  }, []);

  const beginHold = useCallback((e) => {
    if (e && e.currentTarget && e.pointerId != null) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (err) {
        /* capture is a nicety, not a requirement */
      }
    }
    holdStart.current = performance.now();
    const run = () => {
      const p = (performance.now() - holdStart.current) / CONTACT.holdMs;
      if (p >= 1) {
        setHeld(1);
        rafRef.current = null;
        if (navigator.vibrate) navigator.vibrate(CONTACT.hapticMs);
        window.location.href = buildContactHref();
        return;
      }
      setHeld(p);
      rafRef.current = requestAnimationFrame(run);
    };
    rafRef.current = requestAnimationFrame(run);
  }, []);

  const contactRenders =
    CONTACT.unlock !== "never" && unlocked && stage === "returned" && showContact;

  /* ------------------------------ view ------------------------------ */

  return (
    <div className="bhg-root">
      <style>{CSS}</style>

      {/* 1 — Seal */}
      {stage === "seal" && (
        <div className="bhg-screen bhg-center">
          <button
            type="button"
            className={`bhg-sealbtn ${cracking ? "bhg-crack" : ""}`}
            onClick={breakSeal}
            aria-label={`${BIZ.copy.sealLabel} — begin`}
          >
            <Seal size={240} idPrefix="open" />
          </button>
          <p className="bhg-label bhg-label-seal">{BIZ.copy.sealLabel}</p>
        </div>
      )}

      {/* 2 — Name */}
      {stage === "name" && (
        <div className="bhg-screen bhg-center">
          <h1 className="bhg-name">
            {typed}
            {!reduced && typed.length < BIZ.firstName.length && (
              <span className="bhg-caret" aria-hidden="true" />
            )}
          </h1>
          <p className="bhg-sub bhg-fade">{BIZ.copy.nameSub}</p>
        </div>
      )}

      {/* 3 + 4 — Clip and gate */}
      {stage === "clip" && (
        <div className="bhg-screen bhg-clipwrap">
          <div className="bhg-frame">
            {BIZ.clipUrl ? (
              <video
                className="bhg-video"
                src={BIZ.clipUrl}
                poster={BIZ.clipPoster || undefined}
                autoPlay muted loop playsInline preload="auto"
                disablePictureInPicture
                controlsList="nodownload noplaybackrate noremoteplayback"
              />
            ) : (
              <div className="bhg-placeholder">
                <span className="bhg-label">Clip not set</span>
                <p>Add an mp4 to BIZ.clipUrl</p>
              </div>
            )}
            <div className="bhg-clipscrim" />
            <p className="bhg-caption">{BIZ.copy.clipCaption}</p>
          </div>

          {showGate && (
            <button type="button" className="bhg-enter bhg-fade" onClick={enterSite}>
              {BIZ.copy.enterLabel}
            </button>
          )}
        </div>
      )}

      {/* 5 + 6 — Where it stands, then the seal */}
      {stage === "returned" && (
        <div className="bhg-screen bhg-returned">
          <div className="bhg-block bhg-fade">
            <p className="bhg-label">{PROGRESS.eyebrow}</p>
            <h2 className="bhg-h2">{PROGRESS.heading}</h2>
            <p className="bhg-body">{PROGRESS.body}</p>
          </div>

          <div className="bhg-rule" aria-hidden="true" />

          <h3 className="bhg-h3">{PROGRESS.sealHeading}</h3>

          {contactRenders && (
            <div className="bhg-contact bhg-fade">
              <button
                type="button"
                className="bhg-sealbtn bhg-hold"
                aria-label={CONTACT.sealAriaLabel}
                onPointerDown={beginHold}
                onPointerUp={cancelHold}
                onPointerLeave={cancelHold}
                onPointerCancel={cancelHold}
                onContextMenu={(e) => e.preventDefault()}
                style={{ touchAction: "none" }}
              >
                <Seal size={168} idPrefix="send" progress={held} showRing />
              </button>
              <p className="bhg-label bhg-holdlabel">{PROGRESS.sealSub}</p>
            </div>
          )}

          {/* Ways out. Without these the final screen is a dead end — he can
              neither revisit the site nor watch it again. */}
          <div className="bhg-ways bhg-fade">
            <button type="button" className="bhg-way" onClick={enterSite}>
              {PROGRESS.siteAgainLabel}
            </button>
            <span className="bhg-way-sep" aria-hidden="true">·</span>
            <button type="button" className="bhg-way" onClick={replay}>
              {PROGRESS.replayLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ styles ----------------------------- */
/* System fonts only: no webfont request, instant paint, and it matches the
   app exactly. Deliberately not the serif used on other clients' work. */

const CSS = `
.bhg-root {
  min-height: 100dvh;
  background: radial-gradient(125% 95% at 50% 0%, ${P.ground} 0%, ${P.groundDeep} 100%);
  color: ${P.text};
  font-family: ui-sans-serif, -apple-system, "SF Pro Text", "Segoe UI", Inter, system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}
.bhg-screen {
  min-height: 100dvh;
  padding: 32px 24px calc(32px + env(safe-area-inset-bottom, 0px));
  box-sizing: border-box;
}
.bhg-center {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 26px;
}

.bhg-label {
  font-family: ui-monospace, "SF Mono", Menlo, monospace;
  font-size: 11px; letter-spacing: .3em; text-transform: uppercase;
  color: ${P.textFaint}; margin: 0; text-align: center;
}
.bhg-label-seal { color: ${P.textSoft}; }

.bhg-sealbtn {
  background: none; border: 0; padding: 10px; cursor: pointer;
  border-radius: 50%; line-height: 0;
  -webkit-tap-highlight-color: transparent;
  filter: drop-shadow(0 16px 34px rgba(0,0,0,.6));
}
.bhg-sealbtn:focus-visible { outline: 2px solid ${P.goldLit}; outline-offset: 6px; }
.bhg-hold { touch-action: none; user-select: none; -webkit-user-select: none; }

/* A cap does not crack, it pops: the centre lifts, tips over and goes,
   and the crimp ring is left behind for a beat before it fades. */
.bhg-disc, .bhg-ring { transform-box: fill-box; transform-origin: center; }
@keyframes bhg-pop {
  0%   { transform: none; opacity: 1; }
  22%  { transform: translateY(-7%) scale(1.05); }
  100% { transform: translateY(-118%) rotate(31deg) scale(.72); opacity: 0; }
}
@keyframes bhg-ringout {
  0%, 46% { transform: none; opacity: 1; }
  100%    { transform: scale(1.16); opacity: 0; }
}
.bhg-crack .bhg-disc { animation: bhg-pop ${BIZ.timing.crackMs}ms cubic-bezier(.3,.9,.35,1) forwards; }
.bhg-crack .bhg-ring { animation: bhg-ringout ${BIZ.timing.crackMs}ms cubic-bezier(.4,0,.2,1) forwards; }
/* A photographed seal is one piece, so it lifts and tips away whole rather
   than shedding a centre. Same beat, same easing. */
@keyframes bhg-popimg {
  0%   { transform: none; opacity: 1; }
  22%  { transform: translateY(-5%) scale(1.05); }
  100% { transform: translateY(-96%) rotate(24deg) scale(.76); opacity: 0; }
}
.bhg-crack .bhg-sealimg { animation: bhg-popimg ${BIZ.timing.crackMs}ms cubic-bezier(.3,.9,.35,1) forwards; }

.bhg-name {
  font-weight: 600; font-size: clamp(58px, 21vw, 108px);
  line-height: 1; margin: 0; letter-spacing: -.045em;
  display: inline-flex; align-items: baseline;
}
.bhg-caret {
  display: inline-block; width: 3px; height: .74em;
  background: ${P.gold}; margin-left: 7px;
  animation: bhg-blink 1s steps(2, start) infinite;
}
@keyframes bhg-blink { to { opacity: 0; } }
.bhg-sub { color: ${P.textSoft}; font-size: 15px; margin: 0; text-align: center; }

.bhg-clipwrap {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 30px;
}
/* 16:9 — the hero clip is landscape. A 9:16 frame would crop the vial out. */
.bhg-frame {
  position: relative; width: min(92vw, 620px); aspect-ratio: 16 / 9;
  border-radius: 10px; overflow: hidden; background: #000;
  box-shadow: 0 26px 64px rgba(0,0,0,.65);
}
.bhg-video { width: 100%; height: 100%; object-fit: cover; display: block; }
.bhg-video::-webkit-media-controls,
.bhg-video::-webkit-media-controls-start-playback-button,
.bhg-video::-webkit-media-controls-panel,
.bhg-video::-webkit-media-controls-overlay-play-button {
  display: none !important; -webkit-appearance: none;
}
.bhg-placeholder {
  position: absolute; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 10px; text-align: center;
  border: 1px dashed rgba(243,240,233,.18); color: ${P.textFaint}; padding: 20px;
}
.bhg-placeholder p { margin: 0; font-size: 13px; }
.bhg-clipscrim {
  position: absolute; inset: auto 0 0 0; height: 46%;
  background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,.8) 100%);
  pointer-events: none;
}
.bhg-caption {
  position: absolute; left: 18px; right: 18px; bottom: 15px; margin: 0;
  font-size: 13.5px; color: ${P.text}; text-shadow: 0 1px 10px rgba(0,0,0,.75);
}

.bhg-enter {
  background: ${BIZ.foilImage ? `url('${BIZ.foilImage}') center/cover no-repeat, ${P.gold}` : P.gold};
  color: ${P.onGold};
  border: 0; border-radius: 3px; cursor: pointer;
  padding: 17px 34px; min-height: 54px;
  font-family: ui-monospace, "SF Mono", Menlo, monospace;
  font-size: 12px; letter-spacing: .22em; text-transform: uppercase; font-weight: 500;
  -webkit-tap-highlight-color: transparent;
  box-shadow:
    inset 0 1px 0 rgba(255,242,205,.42),
    inset 0 -1px 0 rgba(0,0,0,.30),
    0 8px 22px rgba(0,0,0,.5);
  text-shadow: 0 1px 0 rgba(255,240,200,.28);
  transition: transform .12s ease, box-shadow .12s ease;
}
.bhg-enter:active {
  transform: translateY(1px);
  box-shadow:
    inset 0 1px 0 rgba(255,242,205,.30),
    inset 0 -1px 0 rgba(0,0,0,.34),
    0 4px 12px rgba(0,0,0,.45);
}
.bhg-enter:focus-visible { outline: 2px solid ${P.goldLit}; outline-offset: 4px; }

.bhg-returned {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 24px; text-align: center;
}
.bhg-block { max-width: 36rem; }
.bhg-h2 {
  font-weight: 600; font-size: clamp(30px, 8vw, 46px); line-height: 1.12;
  letter-spacing: -.035em; margin: 14px 0 0;
}
.bhg-body { color: ${P.textSoft}; font-size: 15.5px; line-height: 1.75; margin: 18px 0 0; }
.bhg-rule { width: 54px; height: 1px; background: ${P.gold}; opacity: .55; margin: 6px 0; }
.bhg-h3 { font-weight: 600; font-size: clamp(22px, 6vw, 30px); letter-spacing: -.03em; margin: 0; }
.bhg-contact { display: flex; flex-direction: column; align-items: center; gap: 14px; }
.bhg-holdlabel { color: ${P.textSoft}; }

/* Ways out — deliberately quiet, well below the seal. */
.bhg-ways {
  margin-top: 34px; display: flex; align-items: center;
  gap: 12px; flex-wrap: wrap; justify-content: center;
}
.bhg-way {
  background: none; border: 0; cursor: pointer;
  color: ${P.textFaint};
  font-family: ui-monospace, "SF Mono", Menlo, monospace;
  font-size: 11px; letter-spacing: .2em; text-transform: uppercase;
  padding: 10px 4px; min-height: 44px;
  border-bottom: 1px solid rgba(243,240,233,.16);
  -webkit-tap-highlight-color: transparent;
}
.bhg-way:hover { color: ${P.text}; border-bottom-color: ${P.gold}; }
.bhg-way:focus-visible { outline: 2px solid ${P.goldLit}; outline-offset: 4px; }
.bhg-way-sep { color: rgba(243,240,233,.22); }

@keyframes bhg-fadein { from { opacity: 0; transform: translateY(9px); } to { opacity: 1; transform: none; } }
.bhg-fade { animation: bhg-fadein .85s cubic-bezier(.2,.7,.3,1) both; }

@media (prefers-reduced-motion: reduce) {
  .bhg-fade, .bhg-caret { animation: none !important; }
  .bhg-crack .bhg-disc,
  .bhg-crack .bhg-ring,
  .bhg-crack .bhg-sealimg { animation: none !important; opacity: 0; }
}
`;
