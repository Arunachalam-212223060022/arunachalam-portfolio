"use client";

import { useEffect, useRef } from "react";

const NAV = [
  { label: "About",           href: "#about" },
  { label: "Skills",          href: "#skills" },
  { label: "Projects",        href: "#projects" },
  { label: "Experience",      href: "#experience" },
  { label: "Certifications",  href: "#certifications" },
  { label: "Achievements",    href: "#achievements" },
  { label: "Gallery",         href: "#evidence" },
  { label: "Terminal",        href: "#terminal" },
];

const LINKS = [
  { label: "GitHub",   href: "https://github.com/Arunachalam-212223060022",     icon: "⟨/⟩" },
  { label: "LinkedIn", href: "https://linkedin.com/in/arunachalam-p-12445b290", icon: "in" },
  { label: "Email",    href: "mailto:arunachalam862005@gmail.com",               icon: "@" },
];

const GLITCH_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*⚡◈≡";
const NAME = "ARUNACHALAM P";

export default function Footer() {
  const nameRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const el = nameRef.current;
    if (!el) return;

    let active = false;

    const runGlitch = () => {
      if (active) return;
      active = true;
      let frame = 0;
      const tick = () => {
        frame++;
        el.textContent = NAME.split("").map((ch, i) => {
          if (ch === " ") return " ";
          const revealed = frame > 18 && (i / NAME.length) * 20 < frame - 18;
          return revealed ? ch : GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
        }).join("");
        if (frame >= 32) {
          el.textContent = NAME;
          active = false;
          return;
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    };

    const t = setTimeout(runGlitch, 800);
    el.addEventListener("mouseenter", runGlitch);

    return () => {
      clearTimeout(t);
      el.removeEventListener("mouseenter", runGlitch);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const year = new Date().getFullYear();

  return (
    <>
      <style>{`
        .pf-footer{position:relative;background:linear-gradient(180deg,#060812 0%,#020306 100%);border-top:1px solid rgba(0,212,255,0.12);padding:64px 0 0;margin-top:80px;font-family:'Chakra Petch',sans-serif;overflow:hidden}
        .pf-footer::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent 0%,var(--accent) 30%,var(--accent-alt) 70%,transparent 100%);box-shadow:0 0 14px var(--accent)}
        .pf-inner{max-width:1050px;margin:0 auto;padding:0 24px}
        .pf-cols{display:grid;grid-template-columns:1fr 1.3fr 1fr;gap:48px;padding-bottom:48px;border-bottom:1px solid rgba(255,255,255,0.05)}
        .pf-col-label{font-family:'Share Tech Mono',monospace;font-size:0.68rem;letter-spacing:4px;color:var(--accent-alt);margin-bottom:14px}
        .pf-brand-name{font-size:1.25rem;font-weight:700;color:#fff;letter-spacing:1px;margin-bottom:10px}
        .pf-brand-sub{font-family:'Share Tech Mono',monospace;font-size:0.78rem;color:rgba(255,255,255,0.35);line-height:1.7}
        .pf-nav{display:grid;grid-template-columns:1fr 1fr;gap:4px 20px}
        .pf-nav a{color:rgba(255,255,255,0.45);text-decoration:none;font-size:0.84rem;padding:4px 0;letter-spacing:0.3px;transition:color 0.2s ease,padding-left 0.2s ease;display:block}
        .pf-nav a:hover{color:var(--accent);padding-left:6px}
        .pf-nav a::before{content:'▸ ';font-size:0.7rem;opacity:0.5}
        .pf-links{display:flex;flex-direction:column;gap:10px}
        .pf-link{display:flex;align-items:center;gap:12px;color:rgba(255,255,255,0.45);text-decoration:none;font-size:0.88rem;transition:color 0.2s ease}
        .pf-link:hover{color:var(--accent)}
        .pf-link-icon{width:32px;height:32px;border:1px solid rgba(var(--accent-rgb),0.25);border-radius:4px;display:flex;align-items:center;justify-content:center;font-family:'Share Tech Mono',monospace;font-size:0.68rem;color:var(--accent);flex-shrink:0;transition:border-color 0.2s,box-shadow 0.2s}
        .pf-link:hover .pf-link-icon{border-color:var(--accent);box-shadow:0 0 10px rgba(var(--accent-rgb),0.3)}
        .pf-status{margin-top:20px;padding:11px 15px;border:1px solid rgba(var(--accent-rgb),0.18);border-radius:4px;background:rgba(var(--accent-rgb),0.04);font-size:0.8rem;color:rgba(255,255,255,0.65);font-family:'Share Tech Mono',monospace}
        .pf-status-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#00ff9c;box-shadow:0 0 6px #00ff9c;margin-right:8px;animation:pulse 2s infinite}
        .pf-bigname-wrap{overflow:hidden;padding:36px 0 0;position:relative}
        .pf-bigname{font-family:'Chakra Petch',sans-serif;font-weight:700;font-size:clamp(36px,8.5vw,108px);color:transparent;-webkit-text-stroke:1px rgba(0,212,255,0.1);letter-spacing:0.08em;line-height:1;user-select:none;white-space:nowrap;cursor:default;transition:-webkit-text-stroke-color 0.3s}
        .pf-bigname:hover{-webkit-text-stroke-color:rgba(0,212,255,0.24)}
        .pf-bottom{display:flex;justify-content:space-between;align-items:center;padding:14px 0 24px;border-top:1px solid rgba(255,255,255,0.04);margin-top:6px}
        .pf-copy{font-family:'Share Tech Mono',monospace;font-size:0.7rem;color:rgba(255,255,255,0.2);letter-spacing:0.8px}
        .pf-tagline{font-family:'Share Tech Mono',monospace;font-size:0.7rem;color:rgba(var(--accent-rgb),0.35);letter-spacing:0.8px}
        .pf-scanline{position:absolute;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,rgba(var(--accent-rgb),0.3),transparent);animation:pf-scan 7s linear infinite;pointer-events:none}
        @keyframes pf-scan{0%{top:-2px;opacity:0.9}100%{top:100%;opacity:0}}
        @media(max-width:700px){.pf-cols{grid-template-columns:1fr;gap:32px}.pf-bigname{font-size:clamp(24px,10vw,54px)}.pf-bottom{flex-direction:column;gap:8px;text-align:center}}
      `}</style>

      <footer className="pf-footer">
        <div className="pf-scanline" />
        <div className="pf-inner">
          <div className="pf-cols">

            <div>
              <div className="pf-col-label">SYSTEM_IDENT</div>
              <div className="pf-brand-name">ARUNACHALAM P</div>
              <div className="pf-brand-sub">
                RTL Design · FPGA · ASIC<br />
                Saveetha Engineering College<br />
                Chennai, India · 2023–2027
              </div>
            </div>

            <div>
              <div className="pf-col-label">NAVIGATION</div>
              <nav className="pf-nav">
                {NAV.map(n => (
                  <a key={n.label} href={n.href}>{n.label}</a>
                ))}
              </nav>
            </div>

            <div>
              <div className="pf-col-label">CONNECT</div>
              <div className="pf-links">
                {LINKS.map(l => (
                  <a
                    key={l.label}
                    href={l.href}
                    className="pf-link"
                    target={l.href.startsWith("http") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                  >
                    <span className="pf-link-icon">{l.icon}</span>
                    {l.label}
                  </a>
                ))}
              </div>
              <div className="pf-status">
                <span className="pf-status-dot" />
                Open to RTL / ASIC Roles
              </div>
            </div>

          </div>

          <div className="pf-bigname-wrap">
            <div className="pf-bigname" ref={nameRef}>{NAME}</div>
          </div>

          <div className="pf-bottom">
            <div className="pf-copy">© {year} Arunachalam P · Next.js + Vercel</div>
            <div className="pf-tagline">RTL → SYNTHESIS → PnR → TAPE-OUT</div>
          </div>
        </div>
      </footer>
    </>
  );
}
