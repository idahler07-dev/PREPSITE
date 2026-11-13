"use client";

/* eslint-disable react/jsx-no-literals, @next/next/no-img-element -- generated from the approved design file (scripts/port-reference-landing.py); copy and values are kept exactly as designed */
import { Fragment, useState } from "react";
import { Link } from "@/i18n/navigation";

const CSS =
  ".ref-lp,.ref-lp *,.ref-lp *::before,.ref-lp *::after{all:revert-layer}.ref-lp{display:block;line-height:normal;background:#fff}.ref-lp svg,.ref-lp img,.ref-lp video{display:inline;vertical-align:baseline;max-width:none;height:revert-layer}.ref-lp :is(h1,h2,h3,h4,h5,h6){font-family:inherit;font-weight:bold;letter-spacing:normal;word-spacing:normal;text-wrap:wrap}.ref-lp *{border-color:currentColor;font-variant-numeric:normal;text-wrap:wrap;hyphens:manual}\n\n.ref-lp a{color:#3A3A3C;text-decoration:none}.ref-lp a:hover{color:#0B0B0C}\n.btn-o{transition:transform .15s ease, box-shadow .15s ease}\n.btn-o:hover{color:#fff;transform:translateY(-1px)}\n.btn-w:hover{color:#0B0B0C;border-color:#C9C4BA}\n.faq-q:hover{background:#FCFBF8}\n.choice:hover{border-color:#C9C4BA}\n.feat{transition:transform .18s ease}\n.feat:hover{transform:translateY(-3px)}\n.dots{background-image:radial-gradient(#E3DED4 1.2px, transparent 1.2px);background-size:22px 22px;-webkit-mask-image:radial-gradient(ellipse 60% 70% at 50% 40%, #000 30%, transparent 75%);mask-image:radial-gradient(ellipse 60% 70% at 50% 40%, #000 30%, transparent 75%)}\n@media (max-width: 1180px){.floaty{display:none}}\n@media (prefers-reduced-motion: no-preference){.bob{animation:bob 5s ease-in-out infinite}.bob2{animation:bob 6s ease-in-out -2s infinite}}\n@keyframes bob{0%,100%{translate:0 0}50%{translate:0 -8px}}\n@keyframes rot{0%,18%{transform:translateY(0)}25%,43%{transform:translateY(-1.08em)}50%,68%{transform:translateY(-2.16em)}75%,93%{transform:translateY(-3.24em)}100%{transform:translateY(-4.32em)}}\n@keyframes marquee{to{transform:translateX(calc(-50% - 20px))}}\n@media (prefers-reduced-motion: no-preference){.rot-track{animation:rot 11s cubic-bezier(.76,0,.24,1) infinite}.marquee-track{animation:marquee 80s linear infinite}}\n.marquee:hover .marquee-track{animation-play-state:paused}\n";

function camel(p: string) {
  return p.startsWith("-webkit-")
    ? "Webkit" +
        p
          .slice(8)
          .replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
          .replace(/^./, (c) => c.toUpperCase())
    : p.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}
/** Style strings computed at runtime (quiz states, FAQ rows) to React style objects. */
function css(str: string): React.CSSProperties {
  const o: Record<string, string> = {};
  for (const decl of str.split(";")) {
    const i = decl.indexOf(":");
    if (i > 0) o[camel(decl.slice(0, i).trim())] = decl.slice(i + 1).trim();
  }
  return o as React.CSSProperties;
}

const CORRECT = "B";
const RAW = [
  {
    letter: "A",
    text: "For instance,",
    explain:
      "“For instance” brings in an example of the first idea. Being colorblind isn’t an example of changing color fast. It’s a surprise next to it. The two facts pull against each other, so you need a contrast word: However.",
  },
  {
    letter: "B",
    text: "However,",
    explain:
      "Right. Changing color to match a background sounds like it needs color vision, yet they probably can’t see color. Two ideas that pull against each other need a contrast word, and “However” is the one here.",
  },
  {
    letter: "C",
    text: "Therefore,",
    explain:
      "“Therefore” says the second fact is caused by the first. Changing skin color doesn’t make an animal colorblind. The facts clash instead, so you need a contrast word: However.",
  },
  {
    letter: "D",
    text: "Likewise,",
    explain:
      "“Likewise” says the second idea is similar to the first. Fast color change and colorblindness are opposites in spirit, not a matching pair. You need a contrast word: However.",
  },
];
const FAQ = [
  [
    "Is it the same as the real Digital SAT?",
    "Mock tests follow the Digital SAT format: two sections, two adaptive modules each, the on-screen timer and the built-in Desmos calculator. Our questions are written to match official difficulty, but only the College Board writes the real test.",
  ],
  [
    "Should I still use Bluebook and Khan Academy?",
    "Yes. Take the official practice tests in Bluebook, they are the closest thing to test day. Use WilloPrep for what happens between those tests: a daily plan, your mistakes coming back, and explanations when you are stuck.",
  ],
  [
    "What does Willo, the AI tutor, actually do?",
    "Willo explains why the answer you picked is wrong, gives hints before full solutions, shows Desmos shortcuts for math, and notices patterns across your mistakes so your plan can target them.",
  ],
  [
    "What’s the difference between Free and Premium?",
    "Free gives you daily practice, Desmos, the score calculator and vocabulary decks, forever. Premium adds full adaptive mock tests, Willo on every question, your daily plan and the full score report.",
  ],
  [
    "How is my predicted score calculated?",
    "It is your most recent full practice test or the official score you logged. Once you have four scores, Willo also projects a range for test day from your trend, always marked as an estimate.",
  ],
  [
    "Can I cancel Premium anytime?",
    "Yes. Cancel in one click from settings. You keep Premium until the end of the period you paid for, then drop back to Free with your history saved.",
  ],
] as const;

/** The WilloPrep landing page, ported 1:1 from the approved design file. */
export function ReferenceLanding({
  nextLabel,
  daysLeft,
  regBy,
}: {
  nextLabel: string;
  daysLeft: number;
  regBy: string;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState(0);

  const base =
    "width: 100%; font-family: inherit; text-align: left; cursor: pointer; display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 12px; font-size: 15px; font-weight: 600; color: #0B0B0C; ";
  const letterBase =
    "flex: none; width: 26px; height: 26px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; ";
  let explain = "";
  const choices = RAW.map((c) => {
    const isPicked = picked === c.letter;
    const isCorrect = c.letter === CORRECT;
    let boxStyle = base + "background: #FFFFFF; border: 1.5px solid #E8E4DC;";
    let letterStyle =
      letterBase + "border: 1.5px solid #D6D1C7; color: #3A3A3C;";
    let tag = "";
    let tagColor = "#0F6B78";
    if (picked) {
      if (isCorrect) {
        boxStyle = base + "background: #E7F1F2; border: 1.5px solid #0F6B78;";
        letterStyle =
          letterBase +
          "background: #0F6B78; border: 1.5px solid #0F6B78; color: #FFFFFF;";
        tag = "Correct";
      } else if (isPicked) {
        boxStyle = base + "background: #FFF1E8; border: 1.5px solid #FF6A1A;";
        letterStyle =
          letterBase +
          "background: #FF6A1A; border: 1.5px solid #FF6A1A; color: #FFFFFF;";
        tag = "Your answer";
        tagColor = "#C2410C";
      } else {
        boxStyle =
          base +
          "background: #FFFFFF; border: 1.5px solid #ECE9E3; color: #8A8A86;";
      }
    }
    if (isPicked) explain = c.explain;
    return {
      letter: c.letter,
      text: c.text,
      boxStyle,
      letterStyle,
      tag,
      tagColor,
      pressed: isPicked,
      pick: () => setPicked(c.letter),
    };
  });
  const hasPick = !!picked;
  const reset = () => setPicked(null);
  const faqs = FAQ.map(([q, a], idx) => {
    const open = openFaq === idx;
    return {
      q,
      a,
      open,
      sign: open ? "−" : "+",
      rowStyle: idx < FAQ.length - 1 ? "border-bottom: 1px solid #ECE9E3" : "",
      toggle: () => setOpenFaq(open ? -1 : idx),
    };
  });
  const price = "$9.99";
  const per = "/ month";
  const priceNote = "Cancel anytime";
  void reset;

  return (
    <div className="ref-lp">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div
        style={{
          width: "100%",
          background: "#FFFFFF",
          fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
          color: "#0B0B0C",
          WebkitFontSmoothing: "antialiased",
          overflowX: "hidden",
        }}
      >
        {/* shared illustration parts */}
        <svg
          width="0"
          height="0"
          aria-hidden="true"
          style={{ position: "absolute" }}
        >
          <defs>
            <linearGradient id="gold" x1="0" y1="0" x2="0.4" y2="1">
              <stop offset="0" stopColor="#F7D774"></stop>
              <stop offset="0.55" stopColor="#E2AA2E"></stop>
              <stop offset="1" stopColor="#A9730E"></stop>
            </linearGradient>
            <linearGradient id="tileGrad" x1="0" y1="0" x2="0.35" y2="1">
              <stop offset="0" stopColor="#1A8794"></stop>
              <stop offset="0.55" stopColor="#0F6B78"></stop>
              <stop offset="1" stopColor="#0A3D46"></stop>
            </linearGradient>
            <radialGradient id="tileShine" cx="0.25" cy="0.05" r="0.75">
              <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.26"></stop>
              <stop offset="1" stopColor="#FFFFFF" stopOpacity="0"></stop>
            </radialGradient>
            <linearGradient
              id="antlerCream"
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="40"
              x2="0"
              y2="7"
            >
              <stop offset="0" stopColor="#FFF7E6"></stop>
              <stop offset="0.65" stopColor="#FFE8AE"></stop>
              <stop offset="1" stopColor="#F6CC62"></stop>
            </linearGradient>
            <linearGradient
              id="antlerTealG"
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="40"
              x2="0"
              y2="7"
            >
              <stop offset="0" stopColor="#0F6B78"></stop>
              <stop offset="1" stopColor="#22A0AE"></stop>
            </linearGradient>
            <g
              id="antlerHalfLines"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 37 C11.5 31 8.5 22 9.5 9.5"></path>
              <path d="M15.6 31.5 C18 26 20 22.5 22.3 18.8"></path>
              <path d="M9.4 20 C10.3 16.2 11.6 13.4 13.6 11"></path>
              <path d="M13.8 38.6 H20.6" strokeWidth="3.8"></path>
            </g>
            <g id="antlerLines">
              <use href="#antlerHalfLines"></use>
              <use
                href="#antlerHalfLines"
                transform="matrix(-1 0 0 1 48 0)"
              ></use>
            </g>
            <g id="antlerHLHalf" fill="none" strokeLinecap="round">
              <path d="M9.3 26.4 C8.2 22 7.6 17 7.9 12.2"></path>
              <path d="M16.5 27.6 C17.8 24.7 19 22.4 20.5 20"></path>
              <path d="M8.7 16.2 C9.2 14.6 9.9 13.3 10.9 12"></path>
            </g>
            <g id="antlerHL">
              <use href="#antlerHLHalf"></use>
              <use href="#antlerHLHalf" transform="matrix(-1 0 0 1 48 0)"></use>
            </g>
            <g id="antler3d">
              <use
                href="#antlerLines"
                stroke="#C88A27"
                strokeWidth="5.8"
                transform="translate(0.5 1.05)"
              ></use>
              <use
                href="#antlerLines"
                stroke="url(#antlerCream)"
                strokeWidth="5.6"
              ></use>
              <use
                href="#antlerHL"
                stroke="#FFFFFF"
                strokeWidth="1.3"
                opacity="0.9"
              ></use>
            </g>
            <g id="antler3dTeal">
              <use
                href="#antlerLines"
                stroke="#073038"
                strokeWidth="5.8"
                transform="translate(0.5 1.05)"
              ></use>
              <use
                href="#antlerLines"
                stroke="url(#antlerTealG)"
                strokeWidth="5.6"
              ></use>
              <use
                href="#antlerHL"
                stroke="#FFFFFF"
                strokeWidth="1.3"
                opacity="0.5"
              ></use>
            </g>
            <g id="tile">
              <defs>
                <linearGradient id="rtt" x1="0" y1="0" x2=".3" y2="1">
                  <stop offset="0" stopColor="#2093A1" />
                  <stop offset=".55" stopColor="#0E6F7C" />
                  <stop offset="1" stopColor="#07313B" />
                </linearGradient>
                <radialGradient id="rts" cx=".22" cy="0" r=".85">
                  <stop offset="0" stopColor="#fff" stopOpacity=".32" />
                  <stop offset="1" stopColor="#fff" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="rtg" cx=".5" cy=".5" r=".5">
                  <stop offset="0" stopColor="#52C0CC" stopOpacity=".6" />
                  <stop offset="1" stopColor="#52C0CC" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="rtv" x1="0" y1=".55" x2="0" y2="1">
                  <stop offset="0" stopColor="#000" stopOpacity="0" />
                  <stop offset="1" stopColor="#000" stopOpacity=".28" />
                </linearGradient>
                <linearGradient
                  id="rta"
                  gradientUnits="userSpaceOnUse"
                  x1="0"
                  y1="40"
                  x2="0"
                  y2="6"
                >
                  <stop offset="0" stopColor="#FFB347" />
                  <stop offset=".6" stopColor="#FFD98A" />
                  <stop offset="1" stopColor="#FFF1C9" />
                </linearGradient>
                <filter id="rtb" x="-20%" y="-20%" width="140%" height="150%">
                  <feGaussianBlur stdDeviation=".8" />
                </filter>
              </defs>
              <rect width="48" height="48" rx="13" fill="url(#rtt)" />
              <ellipse cx="24" cy="23" rx="20" ry="19" fill="url(#rtg)" />
              <rect width="48" height="48" rx="13" fill="url(#rtv)" />
              <rect width="48" height="48" rx="13" fill="url(#rts)" />
              <rect
                x=".6"
                y=".6"
                width="46.8"
                height="46.8"
                rx="12.5"
                fill="none"
                stroke="#fff"
                strokeOpacity=".22"
                strokeWidth="1.1"
              />
              <g transform="translate(24 24) scale(1) translate(-24 -24)">
                <g>
                  <g
                    filter="url(#rtb)"
                    fill="none"
                    stroke="#3D1C04"
                    strokeOpacity="0.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    transform="translate(0 1.7)"
                  >
                    <path
                      d="M17 37 C11.5 31 8.5 22 9.5 9.5"
                      strokeWidth="5.50"
                    />
                    <path
                      d="M15.6 31.5 C18 26 20 22.5 22.3 18.8"
                      strokeWidth="3.80"
                    />
                    <path
                      d="M9.4 20 C10.3 16.2 11.6 13.4 13.6 11"
                      strokeWidth="3.80"
                    />
                    <path d="M13.8 38.6 H20.6" strokeWidth="3.40" />
                  </g>
                </g>
                <g transform="matrix(-1 0 0 1 48 0)">
                  <g
                    filter="url(#rtb)"
                    fill="none"
                    stroke="#3D1C04"
                    strokeOpacity="0.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    transform="translate(0 1.7)"
                  >
                    <path
                      d="M17 37 C11.5 31 8.5 22 9.5 9.5"
                      strokeWidth="5.50"
                    />
                    <path
                      d="M15.6 31.5 C18 26 20 22.5 22.3 18.8"
                      strokeWidth="3.80"
                    />
                    <path
                      d="M9.4 20 C10.3 16.2 11.6 13.4 13.6 11"
                      strokeWidth="3.80"
                    />
                    <path d="M13.8 38.6 H20.6" strokeWidth="3.40" />
                  </g>
                </g>
                <g>
                  <g
                    fill="none"
                    stroke="#3D1C04"
                    strokeOpacity="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    transform="translate(0.35 0.9)"
                  >
                    <path
                      d="M17 37 C11.5 31 8.5 22 9.5 9.5"
                      strokeWidth="5.94"
                    />
                    <path
                      d="M15.6 31.5 C18 26 20 22.5 22.3 18.8"
                      strokeWidth="4.10"
                    />
                    <path
                      d="M9.4 20 C10.3 16.2 11.6 13.4 13.6 11"
                      strokeWidth="4.10"
                    />
                    <path d="M13.8 38.6 H20.6" strokeWidth="3.67" />
                  </g>
                </g>
                <g transform="matrix(-1 0 0 1 48 0)">
                  <g
                    fill="none"
                    stroke="#3D1C04"
                    strokeOpacity="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    transform="translate(0.35 0.9)"
                  >
                    <path
                      d="M17 37 C11.5 31 8.5 22 9.5 9.5"
                      strokeWidth="5.94"
                    />
                    <path
                      d="M15.6 31.5 C18 26 20 22.5 22.3 18.8"
                      strokeWidth="4.10"
                    />
                    <path
                      d="M9.4 20 C10.3 16.2 11.6 13.4 13.6 11"
                      strokeWidth="4.10"
                    />
                    <path d="M13.8 38.6 H20.6" strokeWidth="3.67" />
                  </g>
                </g>
                <g>
                  <g
                    fill="none"
                    stroke="url(#rta)"
                    strokeOpacity="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    transform="translate(0 0)"
                  >
                    <path
                      d="M17 37 C11.5 31 8.5 22 9.5 9.5"
                      strokeWidth="5.50"
                    />
                    <path
                      d="M15.6 31.5 C18 26 20 22.5 22.3 18.8"
                      strokeWidth="3.80"
                    />
                    <path
                      d="M9.4 20 C10.3 16.2 11.6 13.4 13.6 11"
                      strokeWidth="3.80"
                    />
                    <path d="M13.8 38.6 H20.6" strokeWidth="3.40" />
                  </g>
                </g>
                <g transform="matrix(-1 0 0 1 48 0)">
                  <g
                    fill="none"
                    stroke="url(#rta)"
                    strokeOpacity="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    transform="translate(0 0)"
                  >
                    <path
                      d="M17 37 C11.5 31 8.5 22 9.5 9.5"
                      strokeWidth="5.50"
                    />
                    <path
                      d="M15.6 31.5 C18 26 20 22.5 22.3 18.8"
                      strokeWidth="3.80"
                    />
                    <path
                      d="M9.4 20 C10.3 16.2 11.6 13.4 13.6 11"
                      strokeWidth="3.80"
                    />
                    <path d="M13.8 38.6 H20.6" strokeWidth="3.40" />
                  </g>
                </g>
                <g>
                  <g
                    fill="none"
                    stroke="#C4620F"
                    strokeOpacity="0.35"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    transform="translate(0.6 0.7)"
                  >
                    <path
                      d="M17 37 C11.5 31 8.5 22 9.5 9.5"
                      strokeWidth="1.98"
                    />
                    <path
                      d="M15.6 31.5 C18 26 20 22.5 22.3 18.8"
                      strokeWidth="1.37"
                    />
                    <path
                      d="M9.4 20 C10.3 16.2 11.6 13.4 13.6 11"
                      strokeWidth="1.37"
                    />
                    <path d="M13.8 38.6 H20.6" strokeWidth="1.22" />
                  </g>
                </g>
                <g transform="matrix(-1 0 0 1 48 0)">
                  <g
                    fill="none"
                    stroke="#C4620F"
                    strokeOpacity="0.35"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    transform="translate(0.6 0.7)"
                  >
                    <path
                      d="M17 37 C11.5 31 8.5 22 9.5 9.5"
                      strokeWidth="1.98"
                    />
                    <path
                      d="M15.6 31.5 C18 26 20 22.5 22.3 18.8"
                      strokeWidth="1.37"
                    />
                    <path
                      d="M9.4 20 C10.3 16.2 11.6 13.4 13.6 11"
                      strokeWidth="1.37"
                    />
                    <path d="M13.8 38.6 H20.6" strokeWidth="1.22" />
                  </g>
                </g>
                <g>
                  <g
                    fill="none"
                    stroke="#FFFBEA"
                    strokeOpacity="0.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    transform="translate(-0.7 -0.7)"
                  >
                    <path
                      d="M17 37 C11.5 31 8.5 22 9.5 9.5"
                      strokeWidth="1.43"
                    />
                    <path
                      d="M15.6 31.5 C18 26 20 22.5 22.3 18.8"
                      strokeWidth="0.99"
                    />
                    <path
                      d="M9.4 20 C10.3 16.2 11.6 13.4 13.6 11"
                      strokeWidth="0.99"
                    />
                    <path d="M13.8 38.6 H20.6" strokeWidth="0.88" />
                  </g>
                </g>
                <g transform="matrix(-1 0 0 1 48 0)">
                  <g
                    fill="none"
                    stroke="#FFFBEA"
                    strokeOpacity="0.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    transform="translate(-0.7 -0.7)"
                  >
                    <path
                      d="M17 37 C11.5 31 8.5 22 9.5 9.5"
                      strokeWidth="1.43"
                    />
                    <path
                      d="M15.6 31.5 C18 26 20 22.5 22.3 18.8"
                      strokeWidth="0.99"
                    />
                    <path
                      d="M9.4 20 C10.3 16.2 11.6 13.4 13.6 11"
                      strokeWidth="0.99"
                    />
                    <path d="M13.8 38.6 H20.6" strokeWidth="0.88" />
                  </g>
                </g>
              </g>
            </g>
            <g id="wmark">
              <path
                d="M5 11 L11.5 30 L18 16 L24.5 30 L31 11 M5 11 L2 4 M5 11 L9.5 5 M31 11 L34 4 M31 11 L26.5 5"
                fill="none"
                stroke="currentColor"
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
            </g>
            <g id="laurel">
              <path
                d="M92 214 Q10 150 40 18"
                fill="none"
                stroke="#C8961E"
                strokeWidth="3.2"
                strokeLinecap="round"
              ></path>
              <g fill="url(#gold)">
                <path
                  d="M0 0 C9 -9 26 -9 36 0 C26 9 9 9 0 0Z"
                  transform="translate(75 197) rotate(-155)"
                ></path>
                <path
                  d="M0 0 C9 -9 26 -9 36 0 C26 9 9 9 0 0Z"
                  transform="translate(75 197) rotate(-18)"
                ></path>
                <path
                  d="M0 0 C9 -9 26 -9 36 0 C26 9 9 9 0 0Z"
                  transform="translate(57 176) rotate(-148)"
                ></path>
                <path
                  d="M0 0 C9 -9 26 -9 36 0 C26 9 9 9 0 0Z"
                  transform="translate(57 176) rotate(-28)"
                ></path>
                <path
                  d="M0 0 C9 -9 26 -9 36 0 C26 9 9 9 0 0Z"
                  transform="translate(44 151) rotate(-140)"
                ></path>
                <path
                  d="M0 0 C9 -9 26 -9 36 0 C26 9 9 9 0 0Z"
                  transform="translate(44 151) rotate(-38)"
                ></path>
                <path
                  d="M0 0 C9 -9 26 -9 36 0 C26 9 9 9 0 0Z"
                  transform="translate(35 123) rotate(-132)"
                ></path>
                <path
                  d="M0 0 C9 -9 26 -9 36 0 C26 9 9 9 0 0Z"
                  transform="translate(35 123) rotate(-48)"
                ></path>
                <path
                  d="M0 0 C8 -8 23 -8 32 0 C23 8 8 8 0 0Z"
                  transform="translate(32 92) rotate(-124)"
                ></path>
                <path
                  d="M0 0 C8 -8 23 -8 32 0 C23 8 8 8 0 0Z"
                  transform="translate(32 92) rotate(-58)"
                ></path>
                <path
                  d="M0 0 C7 -7 20 -7 28 0 C20 7 7 7 0 0Z"
                  transform="translate(34 58) rotate(-116)"
                ></path>
                <path
                  d="M0 0 C7 -7 20 -7 28 0 C20 7 7 7 0 0Z"
                  transform="translate(34 58) rotate(-66)"
                ></path>
                <path
                  d="M0 0 C7 -8 20 -8 28 0 C20 8 7 8 0 0Z"
                  transform="translate(40 20) rotate(-84)"
                ></path>
              </g>
            </g>
            <g id="willo">
              <g
                fill="none"
                stroke="#7A4A23"
                strokeWidth="9"
                strokeLinecap="round"
              >
                <path d="M98 100 C82 72 70 56 72 30 M78 58 C62 55 52 45 48 32 M74 42 C84 30 88 22 90 12"></path>
                <path d="M162 100 C178 72 190 56 188 30 M182 58 C198 55 208 45 212 32 M186 42 C176 30 172 22 170 12"></path>
              </g>
              <ellipse
                cx="76"
                cy="112"
                rx="28"
                ry="15"
                transform="rotate(-25 76 112)"
                fill="#FF6A1A"
              ></ellipse>
              <ellipse
                cx="78"
                cy="112"
                rx="16"
                ry="7"
                transform="rotate(-25 78 112)"
                fill="#FFC9A3"
              ></ellipse>
              <ellipse
                cx="184"
                cy="112"
                rx="28"
                ry="15"
                transform="rotate(25 184 112)"
                fill="#FF6A1A"
              ></ellipse>
              <ellipse
                cx="182"
                cy="112"
                rx="16"
                ry="7"
                transform="rotate(25 182 112)"
                fill="#FFC9A3"
              ></ellipse>
              <ellipse
                cx="130"
                cy="150"
                rx="60"
                ry="64"
                fill="#FF7A2E"
              ></ellipse>
              <circle cx="122" cy="106" r="4" fill="#FFB27F"></circle>
              <circle cx="136" cy="100" r="3" fill="#FFB27F"></circle>
              <circle cx="140" cy="112" r="3.5" fill="#FFB27F"></circle>
              <ellipse
                cx="130"
                cy="184"
                rx="35"
                ry="25"
                fill="#FFE6D3"
              ></ellipse>
              <circle cx="94" cy="166" r="9" fill="#FF9B63"></circle>
              <circle cx="166" cy="166" r="9" fill="#FF9B63"></circle>
              <circle cx="107" cy="142" r="8" fill="#1B1B1B"></circle>
              <circle cx="110" cy="139" r="2.8" fill="#FFFFFF"></circle>
              <circle cx="153" cy="142" r="8" fill="#1B1B1B"></circle>
              <circle cx="156" cy="139" r="2.8" fill="#FFFFFF"></circle>
              <ellipse
                cx="130"
                cy="170"
                rx="11"
                ry="8"
                fill="#3A2414"
              ></ellipse>
              <path
                d="M116 186 Q130 200 144 186"
                fill="none"
                stroke="#3A2414"
                strokeWidth="4"
                strokeLinecap="round"
              ></path>
              <path
                d="M74 200 C100 224 160 224 186 200 L192 224 C162 248 98 248 68 224 Z"
                fill="#0F6B78"
              ></path>
              <path
                d="M156 230 L178 272 L148 264 L142 234 Z"
                fill="#0C3A43"
              ></path>
              <path
                d="M80 222 C104 238 156 238 182 222"
                fill="none"
                stroke="#F2C14E"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="1 10"
              ></path>
            </g>
            <g id="spark">
              <path d="M0 -8 C1 -2 2 -1 8 0 C2 1 1 2 0 8 C-1 2 -2 1 -8 0 C-2 -1 -1 -2 0 -8Z"></path>
            </g>
            <g id="il-core-score">
              <rect
                x="85"
                y="91"
                width="22"
                height="34"
                rx="7"
                fill="#073038"
              ></rect>
              <rect
                x="82"
                y="88"
                width="22"
                height="34"
                rx="7"
                fill="#2A8F9C"
              ></rect>
              <path
                d="M88 95 V113"
                stroke="#FFFFFF"
                strokeOpacity="0.55"
                strokeWidth="2.6"
                strokeLinecap="round"
              ></path>
              <rect
                x="115"
                y="73"
                width="22"
                height="52"
                rx="7"
                fill="#073038"
              ></rect>
              <rect
                x="112"
                y="70"
                width="22"
                height="52"
                rx="7"
                fill="#3EA6B2"
              ></rect>
              <path
                d="M118 77 V113"
                stroke="#FFFFFF"
                strokeOpacity="0.55"
                strokeWidth="2.6"
                strokeLinecap="round"
              ></path>
              <rect
                x="145"
                y="55"
                width="22"
                height="70"
                rx="7"
                fill="#0F5560"
              ></rect>
              <rect
                x="142"
                y="52"
                width="22"
                height="70"
                rx="7"
                fill="#7FC6CF"
              ></rect>
              <path
                d="M148 59 V113"
                stroke="#FFFFFF"
                strokeOpacity="0.55"
                strokeWidth="2.6"
                strokeLinecap="round"
              ></path>
              <rect
                x="175"
                y="33"
                width="22"
                height="92"
                rx="7"
                fill="#A9390A"
              ></rect>
              <rect
                x="172"
                y="30"
                width="22"
                height="92"
                rx="7"
                fill="#FF6A1A"
              ></rect>
              <path
                d="M178 37 V113"
                stroke="#FFFFFF"
                strokeOpacity="0.55"
                strokeWidth="2.6"
                strokeLinecap="round"
              ></path>
              <path
                d="M66 22 H214"
                stroke="#F2C14E"
                strokeWidth="2.5"
                strokeDasharray="4 6"
                strokeLinecap="round"
              ></path>
              <path
                d="M212 6 V26"
                stroke="#FFF3DD"
                strokeWidth="3"
                strokeLinecap="round"
              ></path>
              <path d="M213 6 L230 11 L213 16Z" fill="#F2C14E"></path>
              <path
                d="M76 104 C108 96 140 74 190 36"
                fill="none"
                stroke="#FFF3DD"
                strokeWidth="3.2"
                strokeLinecap="round"
              ></path>
              <path
                d="M180 35 L191 35 L189 46"
                fill="none"
                stroke="#FFF3DD"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
              <rect
                x="31"
                y="47"
                width="46"
                height="24"
                rx="12"
                fill="#C88A27"
              ></rect>
              <rect
                x="28"
                y="44"
                width="46"
                height="24"
                rx="12"
                fill="#FFF3DD"
              ></rect>
              <text
                x="51"
                y="60.5"
                textAnchor="middle"
                fontFamily="Inter, sans-serif"
                fontSize="12"
                fontWeight="900"
                fill="#0C3A43"
              >
                +60
              </text>
              <use
                href="#spark"
                fill="#F2C14E"
                transform="translate(240 58) scale(0.8)"
              ></use>
              <use
                href="#spark"
                fill="#7FC6CF"
                transform="translate(48 100) scale(0.6)"
              ></use>
            </g>
            <g id="il-score">
              <circle
                cx="140"
                cy="74"
                r="74"
                fill="#FFFFFF"
                opacity="0.045"
              ></circle>
              <circle
                cx="140"
                cy="74"
                r="50"
                fill="#FFFFFF"
                opacity="0.035"
              ></circle>
              <ellipse
                cx="140"
                cy="130"
                rx="92"
                ry="9"
                fill="#04232A"
                opacity="0.45"
              ></ellipse>
              <use href="#il-core-score"></use>
            </g>
            <g id="il-core-note">
              <path
                d="M73 44 Q108 36 143 46 V122 Q108 112 73 120Z"
                fill="#B9A27C"
              ></path>
              <path
                d="M143 46 Q178 36 213 44 V120 Q178 112 143 122Z"
                fill="#B9A27C"
              ></path>
              <path
                d="M70 40 Q105 32 140 42 V118 Q105 108 70 116Z"
                fill="#FFF7EA"
              ></path>
              <path
                d="M140 42 Q175 32 210 40 V116 Q175 108 140 118Z"
                fill="#FFFDF8"
              ></path>
              <path d="M140 42 V118" stroke="#E3D3B5" strokeWidth="2"></path>
              <g stroke="#E6DCC8" strokeWidth="3" strokeLinecap="round">
                <path d="M84 56 H124"></path>
                <path d="M84 67 H118"></path>
                <path d="M156 84 H196"></path>
                <path d="M156 95 H188"></path>
              </g>
              <g stroke="#FF6A1A" strokeWidth="6" strokeLinecap="round">
                <path d="M92 82 L110 100"></path>
                <path d="M110 82 L92 100"></path>
              </g>
              <circle cx="177" cy="62" r="13" fill="#0F6B78"></circle>
              <path
                d="M171 62 l4.5 4.5 l8 -9"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
              <path d="M192 36 V64 L198 58 L204 64 V36Z" fill="#F2C14E"></path>
              <path
                d="M195 38 V56"
                stroke="#FFFFFF"
                strokeOpacity="0.6"
                strokeWidth="2"
                strokeLinecap="round"
              ></path>
              <g transform="translate(206 112) rotate(-32)">
                <rect
                  x="3"
                  y="3"
                  width="46"
                  height="10"
                  rx="3"
                  fill="#A9730E"
                ></rect>
                <rect
                  x="0"
                  y="0"
                  width="46"
                  height="10"
                  rx="3"
                  fill="#F2C14E"
                ></rect>
                <rect
                  x="0"
                  y="0"
                  width="9"
                  height="10"
                  rx="3"
                  fill="#FF9B63"
                ></rect>
                <path d="M46 0 L58 5 L46 10Z" fill="#F7DDB0"></path>
                <path d="M54.5 3.5 L58 5 L54.5 6.5Z" fill="#3A2414"></path>
                <path
                  d="M12 3 H42"
                  stroke="#FFFFFF"
                  strokeOpacity="0.55"
                  strokeWidth="2"
                  strokeLinecap="round"
                ></path>
              </g>
              <use
                href="#spark"
                fill="#F2C14E"
                transform="translate(56 46) scale(0.8)"
              ></use>
              <use
                href="#spark"
                fill="#7FC6CF"
                transform="translate(228 80) scale(0.6)"
              ></use>
            </g>
            <g id="il-note">
              <circle
                cx="140"
                cy="74"
                r="74"
                fill="#FFFFFF"
                opacity="0.045"
              ></circle>
              <circle
                cx="140"
                cy="74"
                r="50"
                fill="#FFFFFF"
                opacity="0.035"
              ></circle>
              <ellipse
                cx="140"
                cy="130"
                rx="92"
                ry="9"
                fill="#04232A"
                opacity="0.45"
              ></ellipse>
              <use href="#il-core-note"></use>
            </g>
            <g id="il-core-willo">
              <image
                href="/mascot/formats/sticker-wink.png"
                x="58"
                y="6"
                width="104"
                height="104"
              />
              <path
                d="M176 26 h52 a18 18 0 0 1 18 18 v6 a18 18 0 0 1 -18 18 h-36 l-14 12 l2 -12 a18 18 0 0 1 -18 -18 v-6 a18 18 0 0 1 18 -18z"
                fill="#C88A27"
                transform="translate(3 3)"
              ></path>
              <path
                d="M176 26 h52 a18 18 0 0 1 18 18 v6 a18 18 0 0 1 -18 18 h-36 l-14 12 l2 -12 a18 18 0 0 1 -18 -18 v-6 a18 18 0 0 1 18 -18z"
                fill="#FFF3DD"
              ></path>
              <path
                d="M172 34 h40"
                stroke="#FFFFFF"
                strokeWidth="2.4"
                strokeLinecap="round"
                opacity="0.8"
              ></path>
              <circle cx="186" cy="48" r="4.5" fill="#0F6B78"></circle>
              <circle
                cx="202"
                cy="48"
                r="4.5"
                fill="#0F6B78"
                opacity="0.7"
              ></circle>
              <circle
                cx="218"
                cy="48"
                r="4.5"
                fill="#0F6B78"
                opacity="0.4"
              ></circle>
              <use
                href="#spark"
                fill="#F2C14E"
                transform="translate(50 40) scale(0.9)"
              ></use>
              <use
                href="#spark"
                fill="#F2C14E"
                transform="translate(240 96) scale(0.7)"
              ></use>
              <use
                href="#spark"
                fill="#7FC6CF"
                transform="translate(60 96) scale(0.5)"
              ></use>
            </g>
            <g id="il-willo">
              <circle
                cx="140"
                cy="74"
                r="74"
                fill="#FFFFFF"
                opacity="0.045"
              ></circle>
              <circle
                cx="140"
                cy="74"
                r="50"
                fill="#FFFFFF"
                opacity="0.035"
              ></circle>
              <ellipse
                cx="140"
                cy="130"
                rx="92"
                ry="9"
                fill="#04232A"
                opacity="0.45"
              ></ellipse>
              <use href="#il-core-willo"></use>
            </g>
            <g id="il-core-desmos">
              <rect
                x="73"
                y="21"
                width="140"
                height="102"
                rx="14"
                fill="#B9A27C"
              ></rect>
              <rect
                x="70"
                y="18"
                width="140"
                height="102"
                rx="14"
                fill="#FFF7EA"
              ></rect>
              <g stroke="#EFE4D0" strokeWidth="1">
                <path d="M84 20 V120"></path>
                <path d="M98 20 V120"></path>
                <path d="M112 20 V120"></path>
                <path d="M126 20 V120"></path>
                <path d="M140 20 V120"></path>
                <path d="M154 20 V120"></path>
                <path d="M168 20 V120"></path>
                <path d="M182 20 V120"></path>
                <path d="M196 20 V120"></path>
                <path d="M72 32 H208"></path>
                <path d="M72 46 H208"></path>
                <path d="M72 60 H208"></path>
                <path d="M72 74 H208"></path>
                <path d="M72 88 H208"></path>
                <path d="M72 102 H208"></path>
                <path d="M72 116 H208"></path>
              </g>
              <g stroke="#C9B796" strokeWidth="2">
                <path d="M112 22 V116"></path>
                <path d="M74 92 H206"></path>
              </g>
              <path
                d="M86 30 Q140 150 194 30"
                fill="none"
                stroke="#FF6A1A"
                strokeWidth="4.5"
                strokeLinecap="round"
              ></path>
              <circle
                cx="140"
                cy="90"
                r="6"
                fill="#FFFFFF"
                stroke="#0F6B78"
                strokeWidth="3.5"
              ></circle>
              <rect
                x="80"
                y="26"
                width="58"
                height="20"
                rx="10"
                fill="#0C3A43"
              ></rect>
              <text
                x="109"
                y="40"
                textAnchor="middle"
                fontFamily="Inter, sans-serif"
                fontSize="11"
                fontWeight="800"
                fill="#FFFFFF"
              >
                y = x² − 4
              </text>
              <rect
                x="199"
                y="73"
                width="48"
                height="56"
                rx="12"
                fill="#073038"
              ></rect>
              <rect
                x="196"
                y="70"
                width="48"
                height="56"
                rx="12"
                fill="#2A8F9C"
              ></rect>
              <rect
                x="203"
                y="77"
                width="34"
                height="12"
                rx="4"
                fill="#CFEBEE"
              ></rect>
              <g fill="#FFF3DD">
                <circle cx="207" cy="99" r="4"></circle>
                <circle cx="220" cy="99" r="4"></circle>
                <circle cx="233" cy="99" r="4"></circle>
                <circle cx="207" cy="113" r="4"></circle>
                <circle cx="220" cy="113" r="4"></circle>
              </g>
              <circle cx="233" cy="113" r="4" fill="#FF6A1A"></circle>
              <use
                href="#spark"
                fill="#F2C14E"
                transform="translate(54 60) scale(0.8)"
              ></use>
              <use
                href="#spark"
                fill="#F2C14E"
                transform="translate(236 40) scale(0.6)"
              ></use>
            </g>
            <g id="il-desmos">
              <circle
                cx="140"
                cy="74"
                r="74"
                fill="#FFFFFF"
                opacity="0.045"
              ></circle>
              <circle
                cx="140"
                cy="74"
                r="50"
                fill="#FFFFFF"
                opacity="0.035"
              ></circle>
              <ellipse
                cx="140"
                cy="130"
                rx="92"
                ry="9"
                fill="#04232A"
                opacity="0.45"
              ></ellipse>
              <use href="#il-core-desmos"></use>
            </g>
            <g id="il-core-vocab">
              <g transform="rotate(-16 140 150)">
                <rect
                  x="97"
                  y="33"
                  width="92"
                  height="64"
                  rx="13"
                  fill="#0F5560"
                ></rect>
                <rect
                  x="94"
                  y="30"
                  width="92"
                  height="64"
                  rx="13"
                  fill="#7FC6CF"
                ></rect>
                <path
                  d="M104 38 H150"
                  stroke="#FFFFFF"
                  strokeOpacity="0.55"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                ></path>
              </g>
              <g transform="rotate(-5 140 150)">
                <rect
                  x="97"
                  y="33"
                  width="92"
                  height="64"
                  rx="13"
                  fill="#A9730E"
                ></rect>
                <rect
                  x="94"
                  y="30"
                  width="92"
                  height="64"
                  rx="13"
                  fill="#F2C14E"
                ></rect>
                <path
                  d="M104 38 H150"
                  stroke="#FFFFFF"
                  strokeOpacity="0.55"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                ></path>
              </g>
              <g transform="rotate(7 140 150)">
                <rect
                  x="97"
                  y="33"
                  width="92"
                  height="64"
                  rx="13"
                  fill="#B9A27C"
                ></rect>
                <rect
                  x="94"
                  y="30"
                  width="92"
                  height="64"
                  rx="13"
                  fill="#FFF7EA"
                ></rect>
                <path
                  d="M104 38 H150"
                  stroke="#FFFFFF"
                  strokeOpacity="0.55"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                ></path>
                <text
                  x="140"
                  y="64"
                  textAnchor="middle"
                  fontFamily="Inter, sans-serif"
                  fontSize="17"
                  fontWeight="900"
                  fill="#0C3A43"
                  letterSpacing="-0.5"
                >
                  candid
                </text>
                <text
                  x="140"
                  y="80"
                  textAnchor="middle"
                  fontFamily="Inter, sans-serif"
                  fontSize="10"
                  fontWeight="700"
                  fill="#8A8A86"
                >
                  adj. · honest, frank
                </text>
                <circle cx="176" cy="40" r="4" fill="#FF6A1A"></circle>
              </g>
              <use
                href="#spark"
                fill="#F2C14E"
                transform="translate(64 44) scale(0.9)"
              ></use>
              <use
                href="#spark"
                fill="#7FC6CF"
                transform="translate(224 34) scale(0.7)"
              ></use>
              <use
                href="#spark"
                fill="#F2C14E"
                transform="translate(232 100) scale(0.5)"
              ></use>
            </g>
            <g id="il-vocab">
              <circle
                cx="140"
                cy="74"
                r="74"
                fill="#FFFFFF"
                opacity="0.045"
              ></circle>
              <circle
                cx="140"
                cy="74"
                r="50"
                fill="#FFFFFF"
                opacity="0.035"
              ></circle>
              <ellipse
                cx="140"
                cy="130"
                rx="92"
                ry="9"
                fill="#04232A"
                opacity="0.45"
              ></ellipse>
              <use href="#il-core-vocab"></use>
            </g>
            <g id="il-core-count">
              <rect
                x="113"
                y="21"
                width="96"
                height="98"
                rx="16"
                fill="#B9A27C"
              ></rect>
              <rect
                x="110"
                y="18"
                width="96"
                height="98"
                rx="16"
                fill="#FFF7EA"
              ></rect>
              <path
                d="M110 34 a16 16 0 0 1 16 -16 h64 a16 16 0 0 1 16 16 v10 h-96z"
                fill="#FF6A1A"
              ></path>
              <text
                x="158"
                y="38"
                textAnchor="middle"
                fontFamily="Inter, sans-serif"
                fontSize="12"
                fontWeight="900"
                fill="#FFFFFF"
                letterSpacing="1"
              >
                SAT
              </text>
              <rect
                x="128"
                y="10"
                width="7"
                height="18"
                rx="3.5"
                fill="#0C3A43"
              ></rect>
              <rect
                x="181"
                y="10"
                width="7"
                height="18"
                rx="3.5"
                fill="#0C3A43"
              ></rect>
              <circle
                cx="158"
                cy="80"
                r="22"
                fill="none"
                stroke="#EFE4D0"
                strokeWidth="7"
              ></circle>
              <circle
                cx="158"
                cy="80"
                r="22"
                fill="none"
                stroke="#0F6B78"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray="100 139"
                transform="rotate(-90 158 80)"
              ></circle>
              <path
                d="M149 80 l6 6 l11 -12"
                fill="none"
                stroke="#0F6B78"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
              <circle cx="93" cy="101" r="21" fill="#A9390A"></circle>
              <circle cx="90" cy="98" r="21" fill="#FF6A1A"></circle>
              <circle cx="90" cy="98" r="14.5" fill="#FFF7EA"></circle>
              <rect
                x="86"
                y="72"
                width="8"
                height="7"
                rx="2"
                fill="#FF6A1A"
              ></rect>
              <path
                d="M90 98 V89 M90 98 L96 102"
                stroke="#0C3A43"
                strokeWidth="3"
                strokeLinecap="round"
              ></path>
              <path
                d="M78 90 a14 14 0 0 1 6 -6"
                stroke="#FFFFFF"
                strokeOpacity="0.7"
                strokeWidth="2.4"
                strokeLinecap="round"
                fill="none"
              ></path>
              <use
                href="#spark"
                fill="#F2C14E"
                transform="translate(226 40) scale(0.8)"
              ></use>
              <use
                href="#spark"
                fill="#7FC6CF"
                transform="translate(56 52) scale(0.6)"
              ></use>
            </g>
            <g id="il-count">
              <circle
                cx="140"
                cy="74"
                r="74"
                fill="#FFFFFF"
                opacity="0.045"
              ></circle>
              <circle
                cx="140"
                cy="74"
                r="50"
                fill="#FFFFFF"
                opacity="0.035"
              ></circle>
              <ellipse
                cx="140"
                cy="130"
                rx="92"
                ry="9"
                fill="#04232A"
                opacity="0.45"
              ></ellipse>
              <use href="#il-core-count"></use>
            </g>
            <g id="il-core-diag">
              <rect
                x="101"
                y="23"
                width="84"
                height="112"
                rx="13"
                fill="#0A3D46"
              ></rect>
              <rect
                x="98"
                y="20"
                width="84"
                height="112"
                rx="13"
                fill="#0F6B78"
              ></rect>
              <path
                d="M104 32 V120"
                stroke="#FFFFFF"
                strokeOpacity="0.22"
                strokeWidth="3"
                strokeLinecap="round"
              ></path>
              <rect
                x="107"
                y="33"
                width="66"
                height="92"
                rx="7"
                fill="#FFFDF8"
              ></rect>
              <rect
                x="122"
                y="15"
                width="40"
                height="16"
                rx="6"
                fill="#0A3D46"
              ></rect>
              <rect
                x="120"
                y="13"
                width="40"
                height="16"
                rx="6"
                fill="#0C3A43"
              ></rect>
              <path
                d="M126 17.5 H148"
                stroke="#FFFFFF"
                strokeOpacity="0.35"
                strokeWidth="2"
                strokeLinecap="round"
              ></path>
              <rect
                x="116"
                y="40"
                width="30"
                height="4"
                rx="2"
                fill="#E6DCC8"
              ></rect>
              <circle
                cx="124"
                cy="54"
                r="4.6"
                fill="none"
                stroke="#D8CCB5"
                strokeWidth="1.8"
              ></circle>
              <circle cx="138" cy="54" r="5" fill="#FF6A1A"></circle>
              <circle
                cx="152"
                cy="54"
                r="4.6"
                fill="none"
                stroke="#D8CCB5"
                strokeWidth="1.8"
              ></circle>
              <circle
                cx="166"
                cy="54"
                r="4.6"
                fill="none"
                stroke="#D8CCB5"
                strokeWidth="1.8"
              ></circle>
              <text
                x="113"
                y="57.5"
                textAnchor="middle"
                fontFamily="Inter, sans-serif"
                fontSize="9"
                fontWeight="800"
                fill="#A8A49B"
              >
                1
              </text>
              <circle
                cx="124"
                cy="69"
                r="4.6"
                fill="none"
                stroke="#D8CCB5"
                strokeWidth="1.8"
              ></circle>
              <circle
                cx="138"
                cy="69"
                r="4.6"
                fill="none"
                stroke="#D8CCB5"
                strokeWidth="1.8"
              ></circle>
              <circle
                cx="152"
                cy="69"
                r="4.6"
                fill="none"
                stroke="#D8CCB5"
                strokeWidth="1.8"
              ></circle>
              <circle cx="166" cy="69" r="5" fill="#FF6A1A"></circle>
              <text
                x="113"
                y="72.5"
                textAnchor="middle"
                fontFamily="Inter, sans-serif"
                fontSize="9"
                fontWeight="800"
                fill="#A8A49B"
              >
                2
              </text>
              <circle cx="124" cy="84" r="5" fill="#FF6A1A"></circle>
              <circle
                cx="138"
                cy="84"
                r="4.6"
                fill="none"
                stroke="#D8CCB5"
                strokeWidth="1.8"
              ></circle>
              <circle
                cx="152"
                cy="84"
                r="4.6"
                fill="none"
                stroke="#D8CCB5"
                strokeWidth="1.8"
              ></circle>
              <circle
                cx="166"
                cy="84"
                r="4.6"
                fill="none"
                stroke="#D8CCB5"
                strokeWidth="1.8"
              ></circle>
              <text
                x="113"
                y="87.5"
                textAnchor="middle"
                fontFamily="Inter, sans-serif"
                fontSize="9"
                fontWeight="800"
                fill="#A8A49B"
              >
                3
              </text>
              <circle
                cx="124"
                cy="99"
                r="4.6"
                fill="none"
                stroke="#D8CCB5"
                strokeWidth="1.8"
              ></circle>
              <circle
                cx="138"
                cy="99"
                r="4.6"
                fill="none"
                stroke="#D8CCB5"
                strokeWidth="1.8"
              ></circle>
              <circle cx="152" cy="99" r="5" fill="#FF6A1A"></circle>
              <circle
                cx="166"
                cy="99"
                r="4.6"
                fill="none"
                stroke="#D8CCB5"
                strokeWidth="1.8"
              ></circle>
              <text
                x="113"
                y="102.5"
                textAnchor="middle"
                fontFamily="Inter, sans-serif"
                fontSize="9"
                fontWeight="800"
                fill="#A8A49B"
              >
                4
              </text>
              <rect
                x="116"
                y="110"
                width="48"
                height="8"
                rx="4"
                fill="#E7F1F2"
              ></rect>
              <rect
                x="116"
                y="110"
                width="24"
                height="8"
                rx="4"
                fill="#0F6B78"
              ></rect>
              <g transform="translate(186 34) rotate(38)">
                <rect
                  x="3"
                  y="3"
                  width="50"
                  height="11"
                  rx="3"
                  fill="#A9730E"
                ></rect>
                <rect
                  x="0"
                  y="0"
                  width="50"
                  height="11"
                  rx="3"
                  fill="#F2C14E"
                ></rect>
                <rect
                  x="0"
                  y="0"
                  width="10"
                  height="11"
                  rx="3"
                  fill="#FF9B63"
                ></rect>
                <path d="M50 0 L63 5.5 L50 11Z" fill="#F7DDB0"></path>
                <path d="M59 3.8 L63 5.5 L59 7.2Z" fill="#3A2414"></path>
                <path
                  d="M14 3.2 H45"
                  stroke="#FFFFFF"
                  strokeOpacity="0.6"
                  strokeWidth="2"
                  strokeLinecap="round"
                ></path>
              </g>
              <circle cx="83" cy="103" r="17" fill="#A9390A"></circle>
              <circle cx="80" cy="100" r="17" fill="#FF6A1A"></circle>
              <rect
                x="76"
                y="77"
                width="8"
                height="7"
                rx="2"
                fill="#FF6A1A"
              ></rect>
              <circle cx="80" cy="100" r="11" fill="#FFF7EA"></circle>
              <path
                d="M80 100 V93 M80 100 L85 104"
                stroke="#0C3A43"
                strokeWidth="2.8"
                strokeLinecap="round"
              ></path>
              <path
                d="M67 94 a13 13 0 0 1 6 -6"
                stroke="#FFFFFF"
                strokeOpacity="0.7"
                strokeWidth="2.2"
                strokeLinecap="round"
                fill="none"
              ></path>
              <use
                href="#spark"
                fill="#F2C14E"
                transform="translate(70 46) scale(0.9)"
              ></use>
              <use
                href="#spark"
                fill="#7FC6CF"
                transform="translate(214 112) scale(0.7)"
              ></use>
              <use
                href="#spark"
                fill="#F2C14E"
                transform="translate(222 28) scale(0.6)"
              ></use>
            </g>
            <g id="il-diag">
              <circle
                cx="140"
                cy="74"
                r="72"
                fill="#FFFFFF"
                opacity="0.75"
              ></circle>
              <circle
                cx="140"
                cy="74"
                r="50"
                fill="#FFFFFF"
                opacity="0.6"
              ></circle>
              <ellipse
                cx="140"
                cy="136"
                rx="80"
                ry="7"
                fill="#3A2414"
                opacity="0.10"
              ></ellipse>
              <use href="#il-core-diag"></use>
            </g>
            <g id="il-core-plan">
              <rect
                x="87"
                y="25"
                width="104"
                height="100"
                rx="16"
                fill="#E3D3B5"
              ></rect>
              <rect
                x="84"
                y="22"
                width="104"
                height="100"
                rx="16"
                fill="#FFFDF8"
              ></rect>
              <path
                d="M84 38 a16 16 0 0 1 16 -16 h72 a16 16 0 0 1 16 16 v12 h-104z"
                fill="#FF6A1A"
              ></path>
              <path
                d="M96 30 H140"
                stroke="#FFFFFF"
                strokeOpacity="0.45"
                strokeWidth="2.4"
                strokeLinecap="round"
              ></path>
              <text
                x="136"
                y="45"
                textAnchor="middle"
                fontFamily="Inter, sans-serif"
                fontSize="10"
                fontWeight="900"
                fill="#FFFFFF"
                letterSpacing="1.2"
              >
                THIS WEEK
              </text>
              <rect
                x="104"
                y="12"
                width="7"
                height="18"
                rx="3.5"
                fill="#0C3A43"
              ></rect>
              <rect
                x="161"
                y="12"
                width="7"
                height="18"
                rx="3.5"
                fill="#0C3A43"
              ></rect>
              <circle cx="102" cy="68" r="6.2" fill="#FF6A1A"></circle>
              <path
                d="M100.4 66 H103"
                stroke="#FFFFFF"
                strokeOpacity="0.6"
                strokeWidth="1.6"
                strokeLinecap="round"
              ></path>
              <circle cx="120" cy="68" r="6.2" fill="#FF6A1A"></circle>
              <path
                d="M118.4 66 H121"
                stroke="#FFFFFF"
                strokeOpacity="0.6"
                strokeWidth="1.6"
                strokeLinecap="round"
              ></path>
              <circle cx="138" cy="68" r="6.2" fill="#FF6A1A"></circle>
              <path
                d="M136.4 66 H139"
                stroke="#FFFFFF"
                strokeOpacity="0.6"
                strokeWidth="1.6"
                strokeLinecap="round"
              ></path>
              <circle cx="156" cy="68" r="6.2" fill="#FF6A1A"></circle>
              <path
                d="M154.4 66 H157"
                stroke="#FFFFFF"
                strokeOpacity="0.6"
                strokeWidth="1.6"
                strokeLinecap="round"
              ></path>
              <circle cx="174" cy="68" r="6.2" fill="#FF6A1A"></circle>
              <path
                d="M172.4 66 H175"
                stroke="#FFFFFF"
                strokeOpacity="0.6"
                strokeWidth="1.6"
                strokeLinecap="round"
              ></path>
              <circle cx="102" cy="86" r="6.2" fill="#FF6A1A"></circle>
              <path
                d="M100.4 84 H103"
                stroke="#FFFFFF"
                strokeOpacity="0.6"
                strokeWidth="1.6"
                strokeLinecap="round"
              ></path>
              <circle cx="120" cy="86" r="6.2" fill="#FF6A1A"></circle>
              <path
                d="M118.4 84 H121"
                stroke="#FFFFFF"
                strokeOpacity="0.6"
                strokeWidth="1.6"
                strokeLinecap="round"
              ></path>
              <circle
                cx="138"
                cy="86"
                r="8.5"
                fill="#FFFFFF"
                stroke="#0F6B78"
                strokeWidth="3.4"
              ></circle>
              <circle cx="156" cy="86" r="6.2" fill="#EFE7DA"></circle>
              <circle cx="174" cy="86" r="6.2" fill="#EFE7DA"></circle>
              <circle cx="102" cy="104" r="6.2" fill="#EFE7DA"></circle>
              <circle cx="120" cy="104" r="6.2" fill="#EFE7DA"></circle>
              <circle cx="138" cy="104" r="6.2" fill="#EFE7DA"></circle>
              <circle cx="156" cy="104" r="6.2" fill="#EFE7DA"></circle>
              <circle cx="174" cy="104" r="6.2" fill="#EFE7DA"></circle>
              <rect
                x="175"
                y="53"
                width="74"
                height="62"
                rx="13"
                fill="#0A3D46"
              ></rect>
              <rect
                x="172"
                y="50"
                width="74"
                height="62"
                rx="13"
                fill="#0F6B78"
              ></rect>
              <path
                d="M180 56 H214"
                stroke="#FFFFFF"
                strokeOpacity="0.25"
                strokeWidth="2"
                strokeLinecap="round"
              ></path>
              <circle cx="187" cy="66" r="6" fill="#F2C14E"></circle>
              <path
                d="M184 66 l2.2 2.2 l4 -4.4"
                fill="none"
                stroke="#0C3A43"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
              <rect
                x="198"
                y="64"
                width="38"
                height="4.5"
                rx="2.2"
                fill="#FFF7EA"
                opacity="0.55"
              ></rect>
              <circle cx="187" cy="82" r="6" fill="#F2C14E"></circle>
              <path
                d="M184 82 l2.2 2.2 l4 -4.4"
                fill="none"
                stroke="#0C3A43"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
              <rect
                x="198"
                y="80"
                width="38"
                height="4.5"
                rx="2.2"
                fill="#FFF7EA"
                opacity="0.55"
              ></rect>
              <circle
                cx="187"
                cy="98"
                r="5.4"
                fill="none"
                stroke="#FFF7EA"
                strokeWidth="2"
              ></circle>
              <rect
                x="198"
                y="96"
                width="30"
                height="4.5"
                rx="2.2"
                fill="#FFF7EA"
                opacity="0.9"
              ></rect>
              <use
                href="#spark"
                fill="#F2C14E"
                transform="translate(66 40) scale(0.9)"
              ></use>
              <use
                href="#spark"
                fill="#7FC6CF"
                transform="translate(62 108) scale(0.6)"
              ></use>
              <use
                href="#spark"
                fill="#F2C14E"
                transform="translate(236 30) scale(0.7)"
              ></use>
            </g>
            <g id="il-plan">
              <circle
                cx="140"
                cy="74"
                r="72"
                fill="#FFFFFF"
                opacity="0.75"
              ></circle>
              <circle
                cx="140"
                cy="74"
                r="50"
                fill="#FFFFFF"
                opacity="0.6"
              ></circle>
              <ellipse
                cx="140"
                cy="136"
                rx="80"
                ry="7"
                fill="#3A2414"
                opacity="0.10"
              ></ellipse>
              <use href="#il-core-plan"></use>
            </g>
            <g id="il-core-trophy">
              <rect
                x="70"
                y="30"
                width="6"
                height="3"
                rx="1.5"
                fill="#FF6A1A"
                transform="rotate(30 70 30)"
              ></rect>
              <rect
                x="214"
                y="26"
                width="6"
                height="3"
                rx="1.5"
                fill="#0F6B78"
                transform="rotate(-25 214 26)"
              ></rect>
              <rect
                x="62"
                y="74"
                width="6"
                height="3"
                rx="1.5"
                fill="#F2C14E"
                transform="rotate(60 62 74)"
              ></rect>
              <rect
                x="222"
                y="70"
                width="6"
                height="3"
                rx="1.5"
                fill="#FF6A1A"
                transform="rotate(-50 222 70)"
              ></rect>
              <rect
                x="92"
                y="16"
                width="6"
                height="3"
                rx="1.5"
                fill="#7FC6CF"
                transform="rotate(15 92 16)"
              ></rect>
              <rect
                x="194"
                y="12"
                width="6"
                height="3"
                rx="1.5"
                fill="#F2C14E"
                transform="rotate(40 194 12)"
              ></rect>
              <g transform="translate(70 34) scale(0.4)">
                <use href="#laurel"></use>
              </g>
              <g transform="translate(210 34) scale(-0.4 0.4)">
                <use href="#laurel"></use>
              </g>
              <path
                d="M106 40 C86 40 84 74 110 76"
                fill="none"
                stroke="#A9730E"
                strokeWidth="8"
                strokeLinecap="round"
                transform="translate(2 2)"
              ></path>
              <path
                d="M174 40 C194 40 196 74 170 76"
                fill="none"
                stroke="#A9730E"
                strokeWidth="8"
                strokeLinecap="round"
                transform="translate(2 2)"
              ></path>
              <path
                d="M106 40 C86 40 84 74 110 76"
                fill="none"
                stroke="#E2AA2E"
                strokeWidth="8"
                strokeLinecap="round"
              ></path>
              <path
                d="M174 40 C194 40 196 74 170 76"
                fill="none"
                stroke="#E2AA2E"
                strokeWidth="8"
                strokeLinecap="round"
              ></path>
              <path
                d="M106 32 H174 V62 C174 88 158 100 140 100 C122 100 106 88 106 62 Z"
                fill="#A9730E"
                transform="translate(3 3)"
              ></path>
              <path
                d="M106 32 H174 V62 C174 88 158 100 140 100 C122 100 106 88 106 62 Z"
                fill="url(#gold)"
              ></path>
              <rect
                x="102"
                y="27"
                width="76"
                height="10"
                rx="5"
                fill="#F7D774"
              ></rect>
              <path
                d="M116 42 V62 C116 76 121 86 128 91"
                fill="none"
                stroke="#FFFFFF"
                strokeOpacity="0.6"
                strokeWidth="5"
                strokeLinecap="round"
              ></path>
              <g transform="translate(140 62)" fill="#FFFFFF">
                <path d="M0 -11 L3.2 -3.6 L11 -3.2 L5 1.8 L7 9.6 L0 5.4 L-7 9.6 L-5 1.8 L-11 -3.2 L-3.2 -3.6Z"></path>
              </g>
              <rect x="132" y="99" width="16" height="13" fill="#C8961E"></rect>
              <rect
                x="113"
                y="113"
                width="60"
                height="24"
                rx="6"
                fill="#0A3D46"
              ></rect>
              <rect
                x="110"
                y="110"
                width="60"
                height="24"
                rx="6"
                fill="#0F6B78"
              ></rect>
              <rect
                x="120"
                y="116"
                width="40"
                height="12"
                rx="3"
                fill="#F2C14E"
              ></rect>
              <text
                x="140"
                y="125.5"
                textAnchor="middle"
                fontFamily="Inter, sans-serif"
                fontSize="9.5"
                fontWeight="900"
                fill="#0C3A43"
              >
                1600
              </text>
              <use
                href="#spark"
                fill="#F2C14E"
                transform="translate(240 100) scale(0.7)"
              ></use>
              <use
                href="#spark"
                fill="#7FC6CF"
                transform="translate(46 104) scale(0.6)"
              ></use>
            </g>
            <g id="il-trophy">
              <circle
                cx="140"
                cy="74"
                r="72"
                fill="#FFFFFF"
                opacity="0.75"
              ></circle>
              <circle
                cx="140"
                cy="74"
                r="50"
                fill="#FFFFFF"
                opacity="0.6"
              ></circle>
              <ellipse
                cx="140"
                cy="136"
                rx="80"
                ry="7"
                fill="#3A2414"
                opacity="0.10"
              ></ellipse>
              <use href="#il-core-trophy"></use>
            </g>
          </defs>
        </svg>
        {/* ============ TOP BAR ============ */}
        <header
          style={{
            height: "72px",
            borderBottom: "1px solid #ECE9E3",
            background: "rgba(255,255,255,0.88)",
            backdropFilter: "saturate(1.4) blur(12px)",
            WebkitBackdropFilter: "saturate(1.4) blur(12px)",
            position: "sticky",
            top: "0",
            zIndex: "20",
          }}
        >
          <div
            style={{
              maxWidth: "1240px",
              height: "100%",
              margin: "0 auto",
              padding: "0 32px",
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "24px",
            }}
          >
            <Link
              href="/"
              aria-label="WilloPrep home"
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <svg
                width="34"
                height="34"
                viewBox="0 0 48 48"
                aria-hidden="true"
                style={{
                  flex: "none",
                  filter: "drop-shadow(0 4px 8px rgba(12,58,67,0.30))",
                }}
              >
                <use href="#tile"></use>
              </svg>
              <span
                style={{
                  fontSize: "21px",
                  fontWeight: "800",
                  letterSpacing: "-0.045em",
                  color: "#0B0B0C",
                }}
              >
                Willo<span style={{ color: "#0F6B78" }}>Prep</span>
              </span>
            </Link>
            <nav
              aria-label="Main"
              style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}
            >
              <Link
                href="/practice"
                style={{
                  fontSize: "14px",
                  fontWeight: "700",
                  color: "#3A3A3C",
                }}
              >
                Practice
              </Link>
              <Link
                href="/mocks"
                style={{
                  fontSize: "14px",
                  fontWeight: "700",
                  color: "#3A3A3C",
                }}
              >
                Mock tests
              </Link>
              <Link
                href="/sat/score-calculator"
                style={{
                  fontSize: "14px",
                  fontWeight: "700",
                  color: "#3A3A3C",
                }}
              >
                Score calculator
              </Link>
              <a
                href="#pricing"
                style={{
                  fontSize: "14px",
                  fontWeight: "700",
                  color: "#3A3A3C",
                }}
              >
                Pricing
              </a>
            </nav>
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <Link
                href="/login"
                style={{
                  fontSize: "14px",
                  fontWeight: "800",
                  color: "#0B0B0C",
                }}
              >
                Log in
              </Link>
              <Link
                href="/login"
                className="btn-o"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  height: "38px",
                  padding: "0 18px",
                  borderRadius: "999px",
                  background: "#FF6A1A",
                  color: "#FFFFFF",
                  fontSize: "13px",
                  fontWeight: "800",
                  letterSpacing: "0.04em",
                }}
              >
                START <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </header>
        {/* ============ HERO ============ */}
        <section
          style={{
            position: "relative",
            padding: "64px 32px 80px",
            textAlign: "center",
          }}
        >
          <div
            className="dots"
            aria-hidden="true"
            style={{ position: "absolute", inset: "0", pointerEvents: "none" }}
          ></div>
          {/* floating product chips */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: "0",
              maxWidth: "1240px",
              margin: "0 auto",
              pointerEvents: "none",
            }}
          >
            <div
              className="floaty bob"
              style={{
                position: "absolute",
                left: "40px",
                top: "150px",
                width: "210px",
                background: "#0C3A43",
                color: "#FFFFFF",
                borderRadius: "18px",
                padding: "16px 18px",
                textAlign: "left",
                transform: "rotate(-5deg)",
                boxShadow: "0 24px 48px -20px rgba(12,58,67,0.55)",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: "800",
                  letterSpacing: "0.08em",
                  color: "#A7C9CE",
                }}
              >
                PREDICTED SCORE
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "8px",
                  marginTop: "4px",
                }}
              >
                <span
                  style={{
                    fontSize: "36px",
                    fontWeight: "900",
                    letterSpacing: "-0.06em",
                  }}
                >
                  1430
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "800",
                    color: "#F2C14E",
                  }}
                >
                  +60
                </span>
              </div>
              <div
                style={{
                  marginTop: "10px",
                  height: "6px",
                  borderRadius: "9px",
                  background: "rgba(255,255,255,0.15)",
                }}
              >
                <div
                  style={{
                    width: "74%",
                    height: "100%",
                    borderRadius: "9px",
                    background: "#FF6A1A",
                  }}
                ></div>
              </div>
            </div>
            <div
              className="floaty bob2"
              style={{
                position: "absolute",
                left: "90px",
                top: "340px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: "#FFFFFF",
                border: "1px solid #ECE9E3",
                borderRadius: "999px",
                padding: "8px 16px 8px 8px",
                transform: "rotate(3deg)",
                boxShadow: "0 16px 36px -18px rgba(58,36,20,0.30)",
              }}
            >
              <span
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  background: "#FFF1E8",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#FF6A1A">
                  <path d="M12 2c1 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-5 3-7 0 2 1 3 2 3 0-3-1-5 1-7z"></path>
                </svg>
              </span>
              <span style={{ fontSize: "13px", fontWeight: "800" }}>
                12-day streak
              </span>
            </div>
            <div
              className="floaty bob2"
              style={{
                position: "absolute",
                right: "30px",
                top: "140px",
                width: "250px",
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
                background: "#FFFFFF",
                border: "1px solid #ECE9E3",
                borderRadius: "18px",
                padding: "14px",
                textAlign: "left",
                transform: "rotate(4deg)",
                boxShadow: "0 24px 48px -22px rgba(58,36,20,0.35)",
              }}
            >
              <span
                style={{
                  flex: "none",
                  width: "42px",
                  height: "42px",
                  position: "relative",
                  display: "inline-block",
                }}
              >
                <img
                  alt=""
                  src="/mascot/formats/avatar-wink.png"
                  style={{
                    position: "absolute",
                    left: "0",
                    bottom: "0",
                    width: "42px",
                  }}
                />
              </span>
              <span
                style={{
                  fontSize: "13px",
                  lineHeight: "1.45",
                  fontWeight: "600",
                  color: "#2A2A2A",
                }}
              >
                <b style={{ fontWeight: "900" }}>Willo:</b> You picked
                “Therefore”, but the two facts clash. Try a contrast word.
              </span>
            </div>
            <div
              className="floaty bob"
              style={{
                position: "absolute",
                right: "70px",
                top: "330px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: "#FFFFFF",
                border: "1px solid #ECE9E3",
                borderRadius: "14px",
                padding: "10px 14px",
                transform: "rotate(-3deg)",
                boxShadow: "0 16px 36px -18px rgba(58,36,20,0.30)",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "800",
                  letterSpacing: "0.06em",
                  color: "#FFFFFF",
                  background: "#0F6B78",
                  borderRadius: "6px",
                  padding: "4px 8px",
                }}
              >
                MODULE 2
              </span>
              <span style={{ fontSize: "13px", fontWeight: "800" }}>
                Hard path unlocked
              </span>
            </div>
          </div>
          <div style={{ position: "relative" }}>
            <Link
              href="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                height: "36px",
                padding: "0 14px 0 6px",
                border: "1px solid #ECE9E3",
                borderRadius: "999px",
                fontSize: "13px",
                fontWeight: "600",
                color: "#3A3A3C",
                background: "#FFFFFF",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#0C3A43",
                  color: "#FFFFFF",
                  fontSize: "11px",
                  fontWeight: "800",
                  letterSpacing: "0.06em",
                  padding: "5px 10px",
                  borderRadius: "999px",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#F2C14E",
                  }}
                ></span>
                {nextLabel}
              </span>
              <span>
                <b style={{ fontWeight: "800", color: "#0B0B0C" }}>
                  {daysLeft} days left.
                </b>{" "}
                Register by {regBy}.
              </span>
              <span aria-hidden="true" style={{ color: "#8A8A86" }}>
                →
              </span>
            </Link>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                marginTop: "36px",
              }}
            >
              <svg
                width="104"
                height="218"
                viewBox="0 0 110 230"
                aria-hidden="true"
              >
                <use href="#laurel"></use>
              </svg>
              <div
                style={{
                  fontSize: "168px",
                  lineHeight: "0.9",
                  fontWeight: "900",
                  letterSpacing: "-0.075em",
                  color: "#0B0B0C",
                  padding: "0 12px 0 0",
                }}
              >
                1600
              </div>
              <svg
                width="104"
                height="218"
                viewBox="0 0 110 230"
                aria-hidden="true"
                style={{ transform: "scaleX(-1)" }}
              >
                <use href="#laurel"></use>
              </svg>
            </div>
            <h1
              aria-label="Hit your target SAT score on your first try"
              style={{
                margin: "28px auto 0",
                maxWidth: "960px",
                fontSize: "58px",
                lineHeight: "1.04",
                fontWeight: "900",
                letterSpacing: "-0.05em",
                color: "#0B0B0C",
              }}
            >
              <span aria-hidden="true" style={{ display: "block" }}>
                Hit your target SAT score
              </span>
              <span
                aria-hidden="true"
                style={{
                  position: "relative",
                  display: "block",
                  height: "1.08em",
                  overflow: "hidden",
                  color: "#0F6B78",
                }}
              >
                <span className="rot-track" style={{ display: "block" }}>
                  <span
                    style={{
                      display: "block",
                      height: "1.08em",
                      lineHeight: "1.08em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    on your first try
                  </span>
                  <span
                    style={{
                      display: "block",
                      height: "1.08em",
                      lineHeight: "1.08em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    without a tutor
                  </span>
                  <span
                    style={{
                      display: "block",
                      height: "1.08em",
                      lineHeight: "1.08em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    from your mistakes
                  </span>
                  <span
                    style={{
                      display: "block",
                      height: "1.08em",
                      lineHeight: "1.08em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    one day at a time
                  </span>
                  <span
                    style={{
                      display: "block",
                      height: "1.08em",
                      lineHeight: "1.08em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    on your first try
                  </span>
                </span>
              </span>
              <svg
                aria-hidden="true"
                width="300"
                height="16"
                viewBox="0 0 300 16"
                style={{ display: "block", margin: "2px auto 0" }}
              >
                <path
                  d="M6 11 C70 3 150 2 294 8"
                  fill="none"
                  stroke="#F2C14E"
                  strokeWidth="5"
                  strokeLinecap="round"
                ></path>
              </svg>
            </h1>
            <p
              style={{
                margin: "22px auto 0",
                maxWidth: "600px",
                fontSize: "19px",
                lineHeight: "1.5",
                fontWeight: "500",
                letterSpacing: "-0.01em",
                color: "#5E5E5B",
              }}
            >
              A daily plan from your mistakes, real adaptive mock tests, and
              Willo, your AI tutor. All in one place.
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "14px",
                marginTop: "36px",
                flexWrap: "wrap",
              }}
            >
              <Link
                href="/login"
                className="btn-o"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  height: "56px",
                  padding: "0 32px",
                  borderRadius: "999px",
                  background: "#FF6A1A",
                  color: "#FFFFFF",
                  fontSize: "15px",
                  fontWeight: "800",
                  letterSpacing: "0.04em",
                  boxShadow:
                    "0 12px 32px -6px rgba(255,106,26,0.55), 0 0 0 6px rgba(255,106,26,0.10)",
                }}
              >
                START PREPARING <span aria-hidden="true">→</span>
              </Link>
              <a
                href="#try"
                className="btn-w"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  height: "56px",
                  padding: "0 30px",
                  borderRadius: "999px",
                  background: "#FFFFFF",
                  border: "1px solid #DCD7CD",
                  color: "#0B0B0C",
                  fontSize: "15px",
                  fontWeight: "800",
                  letterSpacing: "0.04em",
                  boxSizing: "border-box",
                }}
              >
                TRY A QUESTION{" "}
                <span aria-hidden="true" style={{ color: "#8A8A86" }}>
                  ↓
                </span>
              </a>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "18px",
                flexWrap: "wrap",
                marginTop: "18px",
                fontSize: "13px",
                fontWeight: "600",
                color: "#6E6E6A",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0F6B78"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12l5 5 9-10"></path>
                </svg>
                No card needed
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0F6B78"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12l5 5 9-10"></path>
                </svg>
                Free plan forever
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0F6B78"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12l5 5 9-10"></path>
                </svg>
                Premium $9.99/month
              </span>
            </div>
          </div>
        </section>
        {/* ============ FACTS STRIP ============ */}
        <section
          style={{
            maxWidth: "1176px",
            margin: "0 auto",
            borderTop: "1px solid #ECE9E3",
            borderBottom: "1px solid #ECE9E3",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          }}
        >
          <div
            style={{ padding: "28px 32px", borderRight: "1px solid #ECE9E3" }}
          >
            <div
              style={{
                fontSize: "30px",
                fontWeight: "900",
                letterSpacing: "-0.045em",
              }}
            >
              Digital SAT
            </div>
            <div
              style={{
                marginTop: "4px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#6E6E6A",
              }}
            >
              format, timer and tools
            </div>
          </div>
          <div
            style={{ padding: "28px 32px", borderRight: "1px solid #ECE9E3" }}
          >
            <div
              style={{
                fontSize: "30px",
                fontWeight: "900",
                letterSpacing: "-0.045em",
              }}
            >
              2 modules
            </div>
            <div
              style={{
                marginTop: "4px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#6E6E6A",
              }}
            >
              adaptive, like test day
            </div>
          </div>
          <div
            style={{ padding: "28px 32px", borderRight: "1px solid #ECE9E3" }}
          >
            <div
              style={{
                fontSize: "30px",
                fontWeight: "900",
                letterSpacing: "-0.045em",
              }}
            >
              Desmos
            </div>
            <div
              style={{
                marginTop: "4px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#6E6E6A",
              }}
            >
              calculator built in
            </div>
          </div>
          <div style={{ padding: "28px 32px" }}>
            <div
              style={{
                fontSize: "30px",
                fontWeight: "900",
                letterSpacing: "-0.045em",
              }}
            >
              8 skill areas
            </div>
            <div
              style={{
                marginTop: "4px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#6E6E6A",
              }}
            >
              tracked question by question
            </div>
          </div>
        </section>
        {/* ============ ILLUSTRATION RIBBON ============ */}
        <section
          className="marquee"
          aria-label="WilloPrep tools"
          style={{
            marginTop: "56px",
            overflow: "hidden",
            WebkitMaskImage:
              "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)",
            maskImage:
              "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)",
          }}
        >
          <div
            className="marquee-track"
            style={{
              display: "flex",
              gap: "40px",
              width: "max-content",
              padding: "8px 0",
            }}
          >
            <div style={{ display: "flex", gap: "40px" }}>
              <div
                style={{
                  position: "relative",
                  flex: "none",
                  width: "210px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "4px",
                    width: "180px",
                    height: "128px",
                    transform: "translateX(-50%)",
                    borderRadius: "50%",
                    background:
                      "radial-gradient(closest-side, #E3F0F1, rgba(255,255,255,0))",
                  }}
                ></div>
                <svg
                  aria-hidden="true"
                  width="200"
                  height="128"
                  viewBox="44 2 192 132"
                  style={{ position: "relative", display: "block" }}
                >
                  <ellipse
                    cx="140"
                    cy="130"
                    rx="62"
                    ry="5"
                    fill="#3A2414"
                    opacity="0.08"
                  ></ellipse>
                  <use href="#il-core-diag"></use>
                </svg>
                <span
                  style={{
                    position: "relative",
                    marginTop: "10px",
                    fontSize: "13px",
                    fontWeight: "700",
                    letterSpacing: "-0.01em",
                    color: "#6E6E6A",
                  }}
                >
                  Diagnostic
                </span>
              </div>
              <div
                style={{
                  position: "relative",
                  flex: "none",
                  width: "210px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "4px",
                    width: "180px",
                    height: "128px",
                    transform: "translateX(-50%)",
                    borderRadius: "50%",
                    background:
                      "radial-gradient(closest-side, #FFE9DB, rgba(255,255,255,0))",
                  }}
                ></div>
                <svg
                  aria-hidden="true"
                  width="200"
                  height="128"
                  viewBox="44 2 192 132"
                  style={{ position: "relative", display: "block" }}
                >
                  <ellipse
                    cx="140"
                    cy="130"
                    rx="62"
                    ry="5"
                    fill="#3A2414"
                    opacity="0.08"
                  ></ellipse>
                  <use href="#il-core-score"></use>
                </svg>
                <span
                  style={{
                    position: "relative",
                    marginTop: "10px",
                    fontSize: "13px",
                    fontWeight: "700",
                    letterSpacing: "-0.01em",
                    color: "#6E6E6A",
                  }}
                >
                  Score prediction
                </span>
              </div>
              <div
                style={{
                  position: "relative",
                  flex: "none",
                  width: "210px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "4px",
                    width: "180px",
                    height: "128px",
                    transform: "translateX(-50%)",
                    borderRadius: "50%",
                    background:
                      "radial-gradient(closest-side, #FFF1CC, rgba(255,255,255,0))",
                  }}
                ></div>
                <svg
                  aria-hidden="true"
                  width="200"
                  height="128"
                  viewBox="44 2 192 132"
                  style={{ position: "relative", display: "block" }}
                >
                  <ellipse
                    cx="140"
                    cy="130"
                    rx="62"
                    ry="5"
                    fill="#3A2414"
                    opacity="0.08"
                  ></ellipse>
                  <use href="#il-core-note"></use>
                </svg>
                <span
                  style={{
                    position: "relative",
                    marginTop: "10px",
                    fontSize: "13px",
                    fontWeight: "700",
                    letterSpacing: "-0.01em",
                    color: "#6E6E6A",
                  }}
                >
                  Mistake notebook
                </span>
              </div>
              <div
                style={{
                  position: "relative",
                  flex: "none",
                  width: "210px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "4px",
                    width: "180px",
                    height: "128px",
                    transform: "translateX(-50%)",
                    borderRadius: "50%",
                    background:
                      "radial-gradient(closest-side, #E3F0F1, rgba(255,255,255,0))",
                  }}
                ></div>
                <svg
                  aria-hidden="true"
                  width="200"
                  height="128"
                  viewBox="44 2 192 132"
                  style={{ position: "relative", display: "block" }}
                >
                  <ellipse
                    cx="140"
                    cy="130"
                    rx="62"
                    ry="5"
                    fill="#3A2414"
                    opacity="0.08"
                  ></ellipse>
                  <use href="#il-core-plan"></use>
                </svg>
                <span
                  style={{
                    position: "relative",
                    marginTop: "10px",
                    fontSize: "13px",
                    fontWeight: "700",
                    letterSpacing: "-0.01em",
                    color: "#6E6E6A",
                  }}
                >
                  Daily plan
                </span>
              </div>
              <div
                style={{
                  position: "relative",
                  flex: "none",
                  width: "210px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "4px",
                    width: "180px",
                    height: "128px",
                    transform: "translateX(-50%)",
                    borderRadius: "50%",
                    background:
                      "radial-gradient(closest-side, #FFE9DB, rgba(255,255,255,0))",
                  }}
                ></div>
                <svg
                  aria-hidden="true"
                  width="200"
                  height="128"
                  viewBox="44 2 192 132"
                  style={{ position: "relative", display: "block" }}
                >
                  <ellipse
                    cx="140"
                    cy="130"
                    rx="62"
                    ry="5"
                    fill="#3A2414"
                    opacity="0.08"
                  ></ellipse>
                  <use href="#il-core-willo"></use>
                </svg>
                <span
                  style={{
                    position: "relative",
                    marginTop: "10px",
                    fontSize: "13px",
                    fontWeight: "700",
                    letterSpacing: "-0.01em",
                    color: "#6E6E6A",
                  }}
                >
                  Willo AI tutor
                </span>
              </div>
              <div
                style={{
                  position: "relative",
                  flex: "none",
                  width: "210px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "4px",
                    width: "180px",
                    height: "128px",
                    transform: "translateX(-50%)",
                    borderRadius: "50%",
                    background:
                      "radial-gradient(closest-side, #FFF1CC, rgba(255,255,255,0))",
                  }}
                ></div>
                <svg
                  aria-hidden="true"
                  width="200"
                  height="128"
                  viewBox="44 2 192 132"
                  style={{ position: "relative", display: "block" }}
                >
                  <ellipse
                    cx="140"
                    cy="130"
                    rx="62"
                    ry="5"
                    fill="#3A2414"
                    opacity="0.08"
                  ></ellipse>
                  <use href="#il-core-desmos"></use>
                </svg>
                <span
                  style={{
                    position: "relative",
                    marginTop: "10px",
                    fontSize: "13px",
                    fontWeight: "700",
                    letterSpacing: "-0.01em",
                    color: "#6E6E6A",
                  }}
                >
                  Desmos built in
                </span>
              </div>
              <div
                style={{
                  position: "relative",
                  flex: "none",
                  width: "210px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "4px",
                    width: "180px",
                    height: "128px",
                    transform: "translateX(-50%)",
                    borderRadius: "50%",
                    background:
                      "radial-gradient(closest-side, #E3F0F1, rgba(255,255,255,0))",
                  }}
                ></div>
                <svg
                  aria-hidden="true"
                  width="200"
                  height="128"
                  viewBox="44 2 192 132"
                  style={{ position: "relative", display: "block" }}
                >
                  <ellipse
                    cx="140"
                    cy="130"
                    rx="62"
                    ry="5"
                    fill="#3A2414"
                    opacity="0.08"
                  ></ellipse>
                  <use href="#il-core-trophy"></use>
                </svg>
                <span
                  style={{
                    position: "relative",
                    marginTop: "10px",
                    fontSize: "13px",
                    fontWeight: "700",
                    letterSpacing: "-0.01em",
                    color: "#6E6E6A",
                  }}
                >
                  Mock tests
                </span>
              </div>
              <div
                style={{
                  position: "relative",
                  flex: "none",
                  width: "210px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "4px",
                    width: "180px",
                    height: "128px",
                    transform: "translateX(-50%)",
                    borderRadius: "50%",
                    background:
                      "radial-gradient(closest-side, #FFE9DB, rgba(255,255,255,0))",
                  }}
                ></div>
                <svg
                  aria-hidden="true"
                  width="200"
                  height="128"
                  viewBox="44 2 192 132"
                  style={{ position: "relative", display: "block" }}
                >
                  <ellipse
                    cx="140"
                    cy="130"
                    rx="62"
                    ry="5"
                    fill="#3A2414"
                    opacity="0.08"
                  ></ellipse>
                  <use href="#il-core-vocab"></use>
                </svg>
                <span
                  style={{
                    position: "relative",
                    marginTop: "10px",
                    fontSize: "13px",
                    fontWeight: "700",
                    letterSpacing: "-0.01em",
                    color: "#6E6E6A",
                  }}
                >
                  Vocabulary decks
                </span>
              </div>
              <div
                style={{
                  position: "relative",
                  flex: "none",
                  width: "210px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "4px",
                    width: "180px",
                    height: "128px",
                    transform: "translateX(-50%)",
                    borderRadius: "50%",
                    background:
                      "radial-gradient(closest-side, #FFF1CC, rgba(255,255,255,0))",
                  }}
                ></div>
                <svg
                  aria-hidden="true"
                  width="200"
                  height="128"
                  viewBox="44 2 192 132"
                  style={{ position: "relative", display: "block" }}
                >
                  <ellipse
                    cx="140"
                    cy="130"
                    rx="62"
                    ry="5"
                    fill="#3A2414"
                    opacity="0.08"
                  ></ellipse>
                  <use href="#il-core-count"></use>
                </svg>
                <span
                  style={{
                    position: "relative",
                    marginTop: "10px",
                    fontSize: "13px",
                    fontWeight: "700",
                    letterSpacing: "-0.01em",
                    color: "#6E6E6A",
                  }}
                >
                  Test-day countdown
                </span>
              </div>
            </div>
            <div aria-hidden="true" style={{ display: "flex", gap: "40px" }}>
              <div
                style={{
                  position: "relative",
                  flex: "none",
                  width: "210px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "4px",
                    width: "180px",
                    height: "128px",
                    transform: "translateX(-50%)",
                    borderRadius: "50%",
                    background:
                      "radial-gradient(closest-side, #E3F0F1, rgba(255,255,255,0))",
                  }}
                ></div>
                <svg
                  aria-hidden="true"
                  width="200"
                  height="128"
                  viewBox="44 2 192 132"
                  style={{ position: "relative", display: "block" }}
                >
                  <ellipse
                    cx="140"
                    cy="130"
                    rx="62"
                    ry="5"
                    fill="#3A2414"
                    opacity="0.08"
                  ></ellipse>
                  <use href="#il-core-diag"></use>
                </svg>
                <span
                  style={{
                    position: "relative",
                    marginTop: "10px",
                    fontSize: "13px",
                    fontWeight: "700",
                    letterSpacing: "-0.01em",
                    color: "#6E6E6A",
                  }}
                >
                  Diagnostic
                </span>
              </div>
              <div
                style={{
                  position: "relative",
                  flex: "none",
                  width: "210px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "4px",
                    width: "180px",
                    height: "128px",
                    transform: "translateX(-50%)",
                    borderRadius: "50%",
                    background:
                      "radial-gradient(closest-side, #FFE9DB, rgba(255,255,255,0))",
                  }}
                ></div>
                <svg
                  aria-hidden="true"
                  width="200"
                  height="128"
                  viewBox="44 2 192 132"
                  style={{ position: "relative", display: "block" }}
                >
                  <ellipse
                    cx="140"
                    cy="130"
                    rx="62"
                    ry="5"
                    fill="#3A2414"
                    opacity="0.08"
                  ></ellipse>
                  <use href="#il-core-score"></use>
                </svg>
                <span
                  style={{
                    position: "relative",
                    marginTop: "10px",
                    fontSize: "13px",
                    fontWeight: "700",
                    letterSpacing: "-0.01em",
                    color: "#6E6E6A",
                  }}
                >
                  Score prediction
                </span>
              </div>
              <div
                style={{
                  position: "relative",
                  flex: "none",
                  width: "210px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "4px",
                    width: "180px",
                    height: "128px",
                    transform: "translateX(-50%)",
                    borderRadius: "50%",
                    background:
                      "radial-gradient(closest-side, #FFF1CC, rgba(255,255,255,0))",
                  }}
                ></div>
                <svg
                  aria-hidden="true"
                  width="200"
                  height="128"
                  viewBox="44 2 192 132"
                  style={{ position: "relative", display: "block" }}
                >
                  <ellipse
                    cx="140"
                    cy="130"
                    rx="62"
                    ry="5"
                    fill="#3A2414"
                    opacity="0.08"
                  ></ellipse>
                  <use href="#il-core-note"></use>
                </svg>
                <span
                  style={{
                    position: "relative",
                    marginTop: "10px",
                    fontSize: "13px",
                    fontWeight: "700",
                    letterSpacing: "-0.01em",
                    color: "#6E6E6A",
                  }}
                >
                  Mistake notebook
                </span>
              </div>
              <div
                style={{
                  position: "relative",
                  flex: "none",
                  width: "210px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "4px",
                    width: "180px",
                    height: "128px",
                    transform: "translateX(-50%)",
                    borderRadius: "50%",
                    background:
                      "radial-gradient(closest-side, #E3F0F1, rgba(255,255,255,0))",
                  }}
                ></div>
                <svg
                  aria-hidden="true"
                  width="200"
                  height="128"
                  viewBox="44 2 192 132"
                  style={{ position: "relative", display: "block" }}
                >
                  <ellipse
                    cx="140"
                    cy="130"
                    rx="62"
                    ry="5"
                    fill="#3A2414"
                    opacity="0.08"
                  ></ellipse>
                  <use href="#il-core-plan"></use>
                </svg>
                <span
                  style={{
                    position: "relative",
                    marginTop: "10px",
                    fontSize: "13px",
                    fontWeight: "700",
                    letterSpacing: "-0.01em",
                    color: "#6E6E6A",
                  }}
                >
                  Daily plan
                </span>
              </div>
              <div
                style={{
                  position: "relative",
                  flex: "none",
                  width: "210px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "4px",
                    width: "180px",
                    height: "128px",
                    transform: "translateX(-50%)",
                    borderRadius: "50%",
                    background:
                      "radial-gradient(closest-side, #FFE9DB, rgba(255,255,255,0))",
                  }}
                ></div>
                <svg
                  aria-hidden="true"
                  width="200"
                  height="128"
                  viewBox="44 2 192 132"
                  style={{ position: "relative", display: "block" }}
                >
                  <ellipse
                    cx="140"
                    cy="130"
                    rx="62"
                    ry="5"
                    fill="#3A2414"
                    opacity="0.08"
                  ></ellipse>
                  <use href="#il-core-willo"></use>
                </svg>
                <span
                  style={{
                    position: "relative",
                    marginTop: "10px",
                    fontSize: "13px",
                    fontWeight: "700",
                    letterSpacing: "-0.01em",
                    color: "#6E6E6A",
                  }}
                >
                  Willo AI tutor
                </span>
              </div>
              <div
                style={{
                  position: "relative",
                  flex: "none",
                  width: "210px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "4px",
                    width: "180px",
                    height: "128px",
                    transform: "translateX(-50%)",
                    borderRadius: "50%",
                    background:
                      "radial-gradient(closest-side, #FFF1CC, rgba(255,255,255,0))",
                  }}
                ></div>
                <svg
                  aria-hidden="true"
                  width="200"
                  height="128"
                  viewBox="44 2 192 132"
                  style={{ position: "relative", display: "block" }}
                >
                  <ellipse
                    cx="140"
                    cy="130"
                    rx="62"
                    ry="5"
                    fill="#3A2414"
                    opacity="0.08"
                  ></ellipse>
                  <use href="#il-core-desmos"></use>
                </svg>
                <span
                  style={{
                    position: "relative",
                    marginTop: "10px",
                    fontSize: "13px",
                    fontWeight: "700",
                    letterSpacing: "-0.01em",
                    color: "#6E6E6A",
                  }}
                >
                  Desmos built in
                </span>
              </div>
              <div
                style={{
                  position: "relative",
                  flex: "none",
                  width: "210px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "4px",
                    width: "180px",
                    height: "128px",
                    transform: "translateX(-50%)",
                    borderRadius: "50%",
                    background:
                      "radial-gradient(closest-side, #E3F0F1, rgba(255,255,255,0))",
                  }}
                ></div>
                <svg
                  aria-hidden="true"
                  width="200"
                  height="128"
                  viewBox="44 2 192 132"
                  style={{ position: "relative", display: "block" }}
                >
                  <ellipse
                    cx="140"
                    cy="130"
                    rx="62"
                    ry="5"
                    fill="#3A2414"
                    opacity="0.08"
                  ></ellipse>
                  <use href="#il-core-trophy"></use>
                </svg>
                <span
                  style={{
                    position: "relative",
                    marginTop: "10px",
                    fontSize: "13px",
                    fontWeight: "700",
                    letterSpacing: "-0.01em",
                    color: "#6E6E6A",
                  }}
                >
                  Mock tests
                </span>
              </div>
              <div
                style={{
                  position: "relative",
                  flex: "none",
                  width: "210px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "4px",
                    width: "180px",
                    height: "128px",
                    transform: "translateX(-50%)",
                    borderRadius: "50%",
                    background:
                      "radial-gradient(closest-side, #FFE9DB, rgba(255,255,255,0))",
                  }}
                ></div>
                <svg
                  aria-hidden="true"
                  width="200"
                  height="128"
                  viewBox="44 2 192 132"
                  style={{ position: "relative", display: "block" }}
                >
                  <ellipse
                    cx="140"
                    cy="130"
                    rx="62"
                    ry="5"
                    fill="#3A2414"
                    opacity="0.08"
                  ></ellipse>
                  <use href="#il-core-vocab"></use>
                </svg>
                <span
                  style={{
                    position: "relative",
                    marginTop: "10px",
                    fontSize: "13px",
                    fontWeight: "700",
                    letterSpacing: "-0.01em",
                    color: "#6E6E6A",
                  }}
                >
                  Vocabulary decks
                </span>
              </div>
              <div
                style={{
                  position: "relative",
                  flex: "none",
                  width: "210px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "4px",
                    width: "180px",
                    height: "128px",
                    transform: "translateX(-50%)",
                    borderRadius: "50%",
                    background:
                      "radial-gradient(closest-side, #FFF1CC, rgba(255,255,255,0))",
                  }}
                ></div>
                <svg
                  aria-hidden="true"
                  width="200"
                  height="128"
                  viewBox="44 2 192 132"
                  style={{ position: "relative", display: "block" }}
                >
                  <ellipse
                    cx="140"
                    cy="130"
                    rx="62"
                    ry="5"
                    fill="#3A2414"
                    opacity="0.08"
                  ></ellipse>
                  <use href="#il-core-count"></use>
                </svg>
                <span
                  style={{
                    position: "relative",
                    marginTop: "10px",
                    fontSize: "13px",
                    fontWeight: "700",
                    letterSpacing: "-0.01em",
                    color: "#6E6E6A",
                  }}
                >
                  Test-day countdown
                </span>
              </div>
            </div>
          </div>
        </section>
        {/* ============ PRODUCT TOUR ============ */}
        <section
          id="tour"
          style={{ padding: "112px 32px 0", textAlign: "center" }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: "800",
              letterSpacing: "0.14em",
              color: "#A9730E",
            }}
          >
            THE PLATFORM
          </div>
          <h2
            style={{
              margin: "12px 0 0",
              fontSize: "44px",
              lineHeight: "1.05",
              fontWeight: "900",
              letterSpacing: "-0.05em",
            }}
          >
            Take a look inside the platform
          </h2>
          <div
            role="tablist"
            aria-label="Platform sections"
            style={{
              display: "inline-flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "2px",
              marginTop: "32px",
              padding: "5px",
              background: "#F3F1EC",
              borderRadius: "999px",
            }}
          >
            <button
              type="button"
              role="tab"
              aria-selected="true"
              style={{
                fontFamily: "inherit",
                border: "0",
                cursor: "pointer",
                height: "38px",
                padding: "0 18px",
                borderRadius: "999px",
                background: "#FFFFFF",
                boxShadow:
                  "0 1px 2px rgba(58,36,20,0.06), 0 4px 12px rgba(58,36,20,0.08)",
                fontSize: "14px",
                fontWeight: "800",
                color: "#0B0B0C",
              }}
            >
              Dashboard
            </button>
            <button
              type="button"
              role="tab"
              aria-selected="false"
              style={{
                fontFamily: "inherit",
                border: "0",
                cursor: "pointer",
                height: "38px",
                padding: "0 18px",
                borderRadius: "999px",
                background: "transparent",
                fontSize: "14px",
                fontWeight: "700",
                color: "#6E6E6A",
              }}
            >
              Study plan
            </button>
            <button
              type="button"
              role="tab"
              aria-selected="false"
              style={{
                fontFamily: "inherit",
                border: "0",
                cursor: "pointer",
                height: "38px",
                padding: "0 18px",
                borderRadius: "999px",
                background: "transparent",
                fontSize: "14px",
                fontWeight: "700",
                color: "#6E6E6A",
              }}
            >
              Mock tests
            </button>
            <button
              type="button"
              role="tab"
              aria-selected="false"
              style={{
                fontFamily: "inherit",
                border: "0",
                cursor: "pointer",
                height: "38px",
                padding: "0 18px",
                borderRadius: "999px",
                background: "transparent",
                fontSize: "14px",
                fontWeight: "700",
                color: "#6E6E6A",
              }}
            >
              Willo AI
            </button>
            <button
              type="button"
              role="tab"
              aria-selected="false"
              style={{
                fontFamily: "inherit",
                border: "0",
                cursor: "pointer",
                height: "38px",
                padding: "0 18px",
                borderRadius: "999px",
                background: "transparent",
                fontSize: "14px",
                fontWeight: "700",
                color: "#6E6E6A",
              }}
            >
              Mistakes
            </button>
            <button
              type="button"
              role="tab"
              aria-selected="false"
              style={{
                fontFamily: "inherit",
                border: "0",
                cursor: "pointer",
                height: "38px",
                padding: "0 18px",
                borderRadius: "999px",
                background: "transparent",
                fontSize: "14px",
                fontWeight: "700",
                color: "#6E6E6A",
              }}
            >
              Vocabulary
            </button>
            <button
              type="button"
              role="tab"
              aria-selected="false"
              style={{
                fontFamily: "inherit",
                border: "0",
                cursor: "pointer",
                height: "38px",
                padding: "0 18px",
                borderRadius: "999px",
                background: "transparent",
                fontSize: "14px",
                fontWeight: "700",
                color: "#6E6E6A",
              }}
            >
              Score report
            </button>
          </div>
          <div
            style={{
              position: "relative",
              maxWidth: "1120px",
              margin: "120px auto 0",
            }}
          >
            <img
              alt="Willo"
              src="/mascot/formats/behind-wink.png"
              style={{
                position: "absolute",
                right: "96px",
                top: "-128px",
                width: "150px",
                zIndex: "0",
              }}
            />
            {/* Browser window */}
            <div
              style={{
                position: "relative",
                zIndex: "2",
                margin: "0",
                borderRadius: "18px",
                border: "1px solid #E8E4DC",
                background: "#FFFFFF",
                overflow: "hidden",
                boxShadow:
                  "0 50px 120px -30px rgba(12,58,67,0.38), 0 18px 40px -20px rgba(12,58,67,0.20)",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  height: "46px",
                  background: "#F7F7F4",
                  borderBottom: "1px solid #ECE9E3",
                  display: "flex",
                  alignItems: "center",
                  padding: "0 18px",
                  gap: "8px",
                }}
              >
                <span
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    background: "#FF5F57",
                  }}
                ></span>
                <span
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    background: "#FEBC2E",
                  }}
                ></span>
                <span
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    background: "#28C840",
                  }}
                ></span>
                <div
                  style={{
                    flex: "1",
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      width: "360px",
                      maxWidth: "100%",
                      height: "28px",
                      borderRadius: "8px",
                      background: "#FFFFFF",
                      border: "1px solid #E8E4DC",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#5E5E5B",
                    }}
                  >
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#8A8A86"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      aria-hidden="true"
                    >
                      <rect x="5" y="11" width="14" height="10" rx="2"></rect>
                      <path d="M8 11V7a4 4 0 0 1 8 0v4"></path>
                    </svg>
                    willoprep.com
                  </div>
                </div>
                <span style={{ width: "52px" }}></span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  minHeight: "560px",
                }}
              >
                {/* app sidebar */}
                <div
                  style={{
                    flex: "0 0 210px",
                    borderRight: "1px solid #ECE9E3",
                    padding: "20px 14px",
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "0 8px 18px",
                    }}
                  >
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                      style={{ flex: "none" }}
                    >
                      <use href="#tile"></use>
                    </svg>
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: "800",
                        letterSpacing: "-0.045em",
                        color: "#0B0B0C",
                      }}
                    >
                      Willo<span style={{ color: "#0F6B78" }}>Prep</span>
                    </span>
                  </div>
                  <div
                    style={{
                      padding: "9px 10px",
                      borderRadius: "9px",
                      background: "#FFF1E8",
                      color: "#C2410C",
                      fontSize: "13px",
                      fontWeight: "800",
                    }}
                  >
                    Dashboard
                  </div>
                  <div
                    style={{
                      padding: "9px 10px",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#5E5E5B",
                    }}
                  >
                    Study plan
                  </div>
                  <div
                    style={{
                      padding: "9px 10px",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#5E5E5B",
                    }}
                  >
                    Practice
                  </div>
                  <div
                    style={{
                      padding: "9px 10px",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#5E5E5B",
                    }}
                  >
                    Mock tests
                  </div>
                  <div
                    style={{
                      padding: "9px 10px",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#5E5E5B",
                    }}
                  >
                    Willo AI
                  </div>
                  <div
                    style={{
                      padding: "9px 10px",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#5E5E5B",
                    }}
                  >
                    Mistakes
                  </div>
                  <div
                    style={{
                      padding: "9px 10px",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#5E5E5B",
                    }}
                  >
                    Vocabulary
                  </div>
                  <div
                    style={{
                      padding: "9px 10px",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#5E5E5B",
                    }}
                  >
                    Score report
                  </div>
                </div>
                {/* app main */}
                <div
                  style={{
                    flex: "999 1 560px",
                    minWidth: "0",
                    padding: "26px 28px",
                    boxSizing: "border-box",
                    background: "#FCFBF8",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-end",
                      gap: "16px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: "700",
                          color: "#6E6E6A",
                        }}
                      >
                        Thursday · Test day in 38 days
                      </div>
                      <div
                        style={{
                          marginTop: "4px",
                          fontSize: "26px",
                          fontWeight: "900",
                          letterSpacing: "-0.045em",
                        }}
                      >
                        Good evening, Aziz
                      </div>
                    </div>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        height: "34px",
                        padding: "0 14px",
                        borderRadius: "999px",
                        background: "#FF6A1A",
                        color: "#FFFFFF",
                        fontSize: "12px",
                        fontWeight: "800",
                        letterSpacing: "0.04em",
                      }}
                    >
                      CONTINUE TODAY&apos;S PLAN →
                    </div>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                      gap: "14px",
                      marginTop: "22px",
                    }}
                  >
                    {/* predicted score */}
                    <div
                      style={{
                        gridColumn: "span 2",
                        background: "#0C3A43",
                        color: "#FFFFFF",
                        borderRadius: "16px",
                        padding: "20px 22px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "12px",
                            fontWeight: "700",
                            color: "#A7C9CE",
                            letterSpacing: "0.06em",
                          }}
                        >
                          PREDICTED SCORE
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            fontWeight: "700",
                            color: "#F2C14E",
                          }}
                        >
                          Target 1550
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: "10px",
                          marginTop: "6px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "54px",
                            fontWeight: "900",
                            letterSpacing: "-0.06em",
                            lineHeight: "1",
                          }}
                        >
                          1430
                        </div>
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: "800",
                            color: "#F2C14E",
                          }}
                        >
                          +60 since last mock
                        </div>
                      </div>
                      <div
                        style={{
                          marginTop: "18px",
                          height: "8px",
                          borderRadius: "999px",
                          background: "rgba(255,255,255,0.14)",
                          position: "relative",
                        }}
                      >
                        <div
                          style={{
                            width: "74%",
                            height: "100%",
                            borderRadius: "999px",
                            background: "#FF6A1A",
                          }}
                        ></div>
                        <div
                          style={{
                            position: "absolute",
                            left: "86%",
                            top: "-4px",
                            width: "3px",
                            height: "16px",
                            borderRadius: "2px",
                            background: "#F2C14E",
                          }}
                        ></div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginTop: "8px",
                          fontSize: "11px",
                          fontWeight: "600",
                          color: "#A7C9CE",
                        }}
                      >
                        <span>400</span>
                        <span>Reading & Writing 700 · Math 730</span>
                        <span>1600</span>
                      </div>
                    </div>
                    {/* streak */}
                    <div
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid #ECE9E3",
                        borderRadius: "16px",
                        padding: "20px 22px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: "700",
                          color: "#6E6E6A",
                          letterSpacing: "0.06em",
                        }}
                      >
                        STREAK
                      </div>
                      <div
                        style={{
                          marginTop: "6px",
                          fontSize: "40px",
                          fontWeight: "900",
                          letterSpacing: "-0.05em",
                        }}
                      >
                        12 days
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                          gap: "5px",
                          marginTop: "14px",
                        }}
                      >
                        <span
                          style={{
                            height: "22px",
                            borderRadius: "6px",
                            background: "#FF6A1A",
                          }}
                        ></span>
                        <span
                          style={{
                            height: "22px",
                            borderRadius: "6px",
                            background: "#FF6A1A",
                          }}
                        ></span>
                        <span
                          style={{
                            height: "22px",
                            borderRadius: "6px",
                            background: "#FF6A1A",
                          }}
                        ></span>
                        <span
                          style={{
                            height: "22px",
                            borderRadius: "6px",
                            background: "#FF6A1A",
                          }}
                        ></span>
                        <span
                          style={{
                            height: "22px",
                            borderRadius: "6px",
                            background: "#FF6A1A",
                          }}
                        ></span>
                        <span
                          style={{
                            height: "22px",
                            borderRadius: "6px",
                            background: "#FFD3B8",
                          }}
                        ></span>
                        <span
                          style={{
                            height: "22px",
                            borderRadius: "6px",
                            background: "#F3F1EC",
                          }}
                        ></span>
                      </div>
                    </div>
                    {/* today's plan */}
                    <div
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid #ECE9E3",
                        borderRadius: "16px",
                        padding: "20px 22px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "15px",
                          fontWeight: "900",
                          letterSpacing: "-0.03em",
                        }}
                      >
                        Today&apos;s plan
                      </div>
                      <div
                        style={{
                          marginTop: "12px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            fontSize: "13px",
                            fontWeight: "600",
                            color: "#8A8A86",
                            textDecoration: "line-through",
                          }}
                        >
                          <span
                            style={{
                              width: "18px",
                              height: "18px",
                              borderRadius: "50%",
                              background: "#0F6B78",
                              flex: "none",
                            }}
                          ></span>
                          Linear equations · 10 Qs
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            fontSize: "13px",
                            fontWeight: "600",
                            color: "#8A8A86",
                            textDecoration: "line-through",
                          }}
                        >
                          <span
                            style={{
                              width: "18px",
                              height: "18px",
                              borderRadius: "50%",
                              background: "#0F6B78",
                              flex: "none",
                            }}
                          ></span>
                          Review 6 mistakes
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            fontSize: "13px",
                            fontWeight: "700",
                          }}
                        >
                          <span
                            style={{
                              width: "18px",
                              height: "18px",
                              borderRadius: "50%",
                              border: "2px solid #FF6A1A",
                              boxSizing: "border-box",
                              flex: "none",
                            }}
                          ></span>
                          Transitions · 8 Qs
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            fontSize: "13px",
                            fontWeight: "700",
                          }}
                        >
                          <span
                            style={{
                              width: "18px",
                              height: "18px",
                              borderRadius: "50%",
                              border: "2px solid #DCD7CD",
                              boxSizing: "border-box",
                              flex: "none",
                            }}
                          ></span>
                          15 vocab cards
                        </div>
                      </div>
                    </div>
                    {/* skills */}
                    <div
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid #ECE9E3",
                        borderRadius: "16px",
                        padding: "20px 22px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "15px",
                          fontWeight: "900",
                          letterSpacing: "-0.03em",
                        }}
                      >
                        Skill areas
                      </div>
                      <div
                        style={{
                          marginTop: "14px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "11px",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: "12px",
                              fontWeight: "700",
                            }}
                          >
                            <span>Algebra</span>
                            <span style={{ color: "#6E6E6A" }}>88%</span>
                          </div>
                          <div
                            style={{
                              marginTop: "5px",
                              height: "6px",
                              borderRadius: "9px",
                              background: "#F3F1EC",
                            }}
                          >
                            <div
                              style={{
                                width: "88%",
                                height: "100%",
                                borderRadius: "9px",
                                background: "#0F6B78",
                              }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: "12px",
                              fontWeight: "700",
                            }}
                          >
                            <span>Craft & Structure</span>
                            <span style={{ color: "#6E6E6A" }}>71%</span>
                          </div>
                          <div
                            style={{
                              marginTop: "5px",
                              height: "6px",
                              borderRadius: "9px",
                              background: "#F3F1EC",
                            }}
                          >
                            <div
                              style={{
                                width: "71%",
                                height: "100%",
                                borderRadius: "9px",
                                background: "#0F6B78",
                              }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: "12px",
                              fontWeight: "700",
                            }}
                          >
                            <span>Geometry</span>
                            <span style={{ color: "#6E6E6A" }}>64%</span>
                          </div>
                          <div
                            style={{
                              marginTop: "5px",
                              height: "6px",
                              borderRadius: "9px",
                              background: "#F3F1EC",
                            }}
                          >
                            <div
                              style={{
                                width: "64%",
                                height: "100%",
                                borderRadius: "9px",
                                background: "#E2AA2E",
                              }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: "12px",
                              fontWeight: "700",
                            }}
                          >
                            <span>Standard English</span>
                            <span style={{ color: "#6E6E6A" }}>52%</span>
                          </div>
                          <div
                            style={{
                              marginTop: "5px",
                              height: "6px",
                              borderRadius: "9px",
                              background: "#F3F1EC",
                            }}
                          >
                            <div
                              style={{
                                width: "52%",
                                height: "100%",
                                borderRadius: "9px",
                                background: "#FF6A1A",
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* willo */}
                    <div
                      style={{
                        background: "#FFF1E8",
                        borderRadius: "16px",
                        padding: "20px 22px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span
                          style={{
                            flex: "none",
                            width: "36px",
                            height: "36px",
                            position: "relative",
                            display: "inline-block",
                          }}
                        >
                          <img
                            alt=""
                            src="/mascot/formats/avatar-wink.png"
                            style={{
                              position: "absolute",
                              left: "0",
                              bottom: "0",
                              width: "36px",
                            }}
                          />
                        </span>
                        <span
                          style={{
                            fontSize: "15px",
                            fontWeight: "900",
                            letterSpacing: "-0.03em",
                          }}
                        >
                          Willo
                        </span>
                      </div>
                      <div
                        style={{
                          background: "#FFFFFF",
                          borderRadius: "12px 12px 12px 4px",
                          padding: "11px 13px",
                          fontSize: "13px",
                          lineHeight: "1.45",
                          fontWeight: "500",
                          color: "#2A2A2A",
                        }}
                      >
                        You keep picking “however” where the sentences agree.
                        Want a 5-minute drill on contrast words?
                      </div>
                      <div
                        style={{
                          alignSelf: "flex-start",
                          fontSize: "12px",
                          fontWeight: "800",
                          color: "#C2410C",
                        }}
                      >
                        Start drill →
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Link
            href="/login"
            className="btn-o"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              height: "56px",
              marginTop: "48px",
              padding: "0 32px",
              borderRadius: "999px",
              background: "#FF6A1A",
              color: "#FFFFFF",
              fontSize: "15px",
              fontWeight: "800",
              letterSpacing: "0.04em",
              boxShadow: "0 12px 32px -6px rgba(255,106,26,0.5)",
            }}
          >
            START PREPARING <span aria-hidden="true">→</span>
          </Link>
        </section>
        {/* ============ TRY A QUESTION (warm band) ============ */}
        <section
          id="try"
          style={{
            marginTop: "128px",
            background: "#FAF8F4",
            borderTop: "1px solid #F0ECE4",
            borderBottom: "1px solid #F0ECE4",
          }}
        >
          <div
            style={{
              maxWidth: "1176px",
              margin: "0 auto",
              padding: "112px 32px",
              boxSizing: "content-box",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
              gap: "56px",
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "800",
                  letterSpacing: "0.14em",
                  color: "#A9730E",
                }}
              >
                TRY IT NOW · NO SIGN-UP
              </div>
              <h2
                style={{
                  margin: "12px 0 0",
                  fontSize: "44px",
                  lineHeight: "1.05",
                  fontWeight: "900",
                  letterSpacing: "-0.05em",
                }}
              >
                Get one wrong.{" "}
                <span style={{ color: "#0F6B78" }}>That&apos;s the point.</span>
              </h2>
              <p
                style={{
                  margin: "18px 0 0",
                  maxWidth: "440px",
                  fontSize: "17px",
                  lineHeight: "1.55",
                  fontWeight: "500",
                  color: "#5E5E5B",
                }}
              >
                Every mistake goes into your notebook, and Willo tells you
                exactly why your answer felt right. Pick any option and see.
              </p>
              <div
                style={{
                  marginTop: "28px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  fontSize: "15px",
                  fontWeight: "700",
                }}
              >
                <div
                  style={{ display: "flex", gap: "12px", alignItems: "center" }}
                >
                  <span
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: "#FFFFFF",
                      border: "1px solid #ECE9E3",
                      color: "#C2410C",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "13px",
                      fontWeight: "900",
                    }}
                  >
                    1
                  </span>
                  You answer, like on test day
                </div>
                <div
                  style={{ display: "flex", gap: "12px", alignItems: "center" }}
                >
                  <span
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: "#FFFFFF",
                      border: "1px solid #ECE9E3",
                      color: "#C2410C",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "13px",
                      fontWeight: "900",
                    }}
                  >
                    2
                  </span>
                  Willo explains your exact choice
                </div>
                <div
                  style={{ display: "flex", gap: "12px", alignItems: "center" }}
                >
                  <span
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: "#FFFFFF",
                      border: "1px solid #ECE9E3",
                      color: "#C2410C",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "13px",
                      fontWeight: "900",
                    }}
                  >
                    3
                  </span>
                  Tomorrow&apos;s plan brings it back
                </div>
              </div>
              <img
                alt="Willo"
                src="/mascot/formats/sticker-stand.png"
                style={{
                  marginTop: "28px",
                  width: "210px",
                  display: "block",
                  transform: "rotate(-5deg)",
                }}
              />
            </div>
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #ECE9E3",
                borderRadius: "24px",
                boxShadow:
                  "0 1px 2px rgba(58,36,20,0.04), 0 40px 80px -40px rgba(58,36,20,0.30)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "48px",
                  padding: "0 20px",
                  borderBottom: "1px solid #ECE9E3",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "12px",
                  fontWeight: "700",
                  color: "#6E6E6A",
                  background: "#FCFBF8",
                }}
              >
                <span>Reading and Writing · Module 1</span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "#0B0B0C",
                  }}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#0B0B0C"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="13" r="8"></circle>
                    <path d="M12 9v4l2 2M9 2h6"></path>
                  </svg>
                  31:42
                </span>
              </div>
              <div style={{ padding: "24px 24px 26px" }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "12px",
                    fontWeight: "800",
                    color: "#0B0B0C",
                  }}
                >
                  <span
                    style={{
                      background: "#0B0B0C",
                      color: "#FFFFFF",
                      borderRadius: "6px",
                      padding: "3px 8px",
                    }}
                  >
                    7
                  </span>
                  Transitions
                </div>
                <p
                  style={{
                    margin: "16px 0 0",
                    fontSize: "16px",
                    lineHeight: "1.6",
                    fontWeight: "500",
                    color: "#1F1F1F",
                  }}
                >
                  Octopuses can change the color of their skin in a fraction of
                  a second to match their surroundings. ______, most researchers
                  believe they are colorblind, since their eyes contain only one
                  type of light receptor.
                </p>
                <p
                  style={{
                    margin: "14px 0 0",
                    fontSize: "14px",
                    fontWeight: "700",
                    color: "#3A3A3C",
                  }}
                >
                  Which choice completes the text with the most logical
                  transition?
                </p>
                <div
                  style={{
                    marginTop: "14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {choices.map((c, cIndex) => (
                    <Fragment key={cIndex}>
                      <button
                        type="button"
                        className="choice"
                        onClick={c.pick}
                        aria-pressed={c.pressed}
                        style={css(c.boxStyle)}
                      >
                        <span style={css(c.letterStyle)}>{c.letter}</span>
                        <span style={{ flex: "1" }}>{c.text}</span>
                        <span
                          style={css(
                            `font-size: 12px; font-weight: 800; color: ${c.tagColor}`,
                          )}
                        >
                          {c.tag}
                        </span>
                      </button>
                    </Fragment>
                  ))}
                </div>
                {hasPick && (
                  <>
                    <div
                      style={{
                        marginTop: "16px",
                        display: "flex",
                        gap: "12px",
                        alignItems: "flex-start",
                        background: "#FFF1E8",
                        borderRadius: "16px",
                        padding: "14px 16px",
                      }}
                    >
                      <span
                        style={{
                          flex: "none",
                          width: "44px",
                          height: "44px",
                          position: "relative",
                          display: "inline-block",
                        }}
                      >
                        <img
                          alt=""
                          src="/mascot/formats/avatar-wink.png"
                          style={{
                            position: "absolute",
                            left: "0",
                            bottom: "0",
                            width: "44px",
                          }}
                        />
                      </span>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: "900" }}>
                          Willo
                        </div>
                        <div
                          style={{
                            marginTop: "3px",
                            fontSize: "14px",
                            lineHeight: "1.5",
                            fontWeight: "500",
                            color: "#2A2A2A",
                          }}
                        >
                          {explain}
                        </div>
                        <button
                          type="button"
                          onClick={reset}
                          style={{
                            marginTop: "8px",
                            padding: "0",
                            border: "0",
                            background: "none",
                            fontFamily: "inherit",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: "800",
                            color: "#C2410C",
                          }}
                        >
                          Try again ↺
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
        {/* ============ HOW IT WORKS ============ */}
        <section
          style={{
            maxWidth: "1176px",
            margin: "0 auto",
            padding: "128px 32px 0",
            boxSizing: "content-box",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              gap: "24px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "800",
                  letterSpacing: "0.14em",
                  color: "#A9730E",
                }}
              >
                THREE STEPS
              </div>
              <h2
                style={{
                  margin: "12px 0 0",
                  fontSize: "44px",
                  lineHeight: "1.05",
                  fontWeight: "900",
                  letterSpacing: "-0.05em",
                }}
              >
                How it works
              </h2>
            </div>
            <p
              style={{
                margin: "0",
                maxWidth: "380px",
                fontSize: "16px",
                lineHeight: "1.55",
                fontWeight: "500",
                color: "#5E5E5B",
              }}
            >
              No 400-page book. You do a little every day, and the plan rewrites
              itself around what you get wrong.
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "20px",
              marginTop: "44px",
            }}
          >
            {/* step 1 */}
            <div
              style={{
                background: "#F7F7F4",
                border: "1px solid #ECE9E3",
                borderRadius: "24px",
                padding: "10px 10px 30px",
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  position: "relative",
                  height: "190px",
                  borderRadius: "18px",
                  overflow: "hidden",
                }}
              >
                <svg
                  width="100%"
                  height="190"
                  viewBox="0 0 280 150"
                  preserveAspectRatio="xMidYMid meet"
                  style={{ display: "block" }}
                >
                  <use href="#il-diag"></use>
                </svg>
                <div
                  style={{
                    position: "absolute",
                    left: "0",
                    right: "0",
                    bottom: "0",
                    height: "56px",
                    background: "linear-gradient(rgba(247,247,244,0), #F7F7F4)",
                  }}
                ></div>
              </div>
              <div style={{ padding: "0 20px" }}>
                <div
                  style={{
                    marginTop: "24px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "#FF6A1A",
                    color: "#FFFFFF",
                    fontSize: "14px",
                    fontWeight: "900",
                  }}
                >
                  1
                </div>
                <h3
                  style={{
                    margin: "14px 0 0",
                    fontSize: "21px",
                    fontWeight: "900",
                    letterSpacing: "-0.035em",
                  }}
                >
                  Take a short diagnostic
                </h3>
                <p
                  style={{
                    margin: "8px 0 0",
                    fontSize: "15px",
                    lineHeight: "1.55",
                    fontWeight: "500",
                    color: "#5E5E5B",
                  }}
                >
                  A quick adaptive check across Reading and Writing and Math
                  shows where your points are hiding.
                </p>
              </div>
            </div>
            {/* step 2 */}
            <div
              style={{
                background: "#F7F7F4",
                border: "1px solid #ECE9E3",
                borderRadius: "24px",
                padding: "10px 10px 30px",
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  position: "relative",
                  height: "190px",
                  borderRadius: "18px",
                  overflow: "hidden",
                }}
              >
                <svg
                  width="100%"
                  height="190"
                  viewBox="0 0 280 150"
                  preserveAspectRatio="xMidYMid meet"
                  style={{ display: "block" }}
                >
                  <use href="#il-plan"></use>
                </svg>
                <div
                  style={{
                    position: "absolute",
                    left: "0",
                    right: "0",
                    bottom: "0",
                    height: "56px",
                    background: "linear-gradient(rgba(247,247,244,0), #F7F7F4)",
                  }}
                ></div>
              </div>
              <div style={{ padding: "0 20px" }}>
                <div
                  style={{
                    marginTop: "24px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "#FF6A1A",
                    color: "#FFFFFF",
                    fontSize: "14px",
                    fontWeight: "900",
                  }}
                >
                  2
                </div>
                <h3
                  style={{
                    margin: "14px 0 0",
                    fontSize: "21px",
                    fontWeight: "900",
                    letterSpacing: "-0.035em",
                  }}
                >
                  Follow your daily plan
                </h3>
                <p
                  style={{
                    margin: "8px 0 0",
                    fontSize: "15px",
                    lineHeight: "1.55",
                    fontWeight: "500",
                    color: "#5E5E5B",
                  }}
                >
                  Every morning you get a short list built from yesterday&apos;s
                  mistakes. Stuck? Ask Willo why.
                </p>
              </div>
            </div>
            {/* step 3 */}
            <div
              style={{
                background: "#F7F7F4",
                border: "1px solid #ECE9E3",
                borderRadius: "24px",
                padding: "10px 10px 30px",
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  position: "relative",
                  height: "190px",
                  borderRadius: "18px",
                  overflow: "hidden",
                }}
              >
                <svg
                  width="100%"
                  height="190"
                  viewBox="0 0 280 150"
                  preserveAspectRatio="xMidYMid meet"
                  style={{ display: "block" }}
                >
                  <use href="#il-trophy"></use>
                </svg>
                <div
                  style={{
                    position: "absolute",
                    left: "0",
                    right: "0",
                    bottom: "0",
                    height: "56px",
                    background: "linear-gradient(rgba(247,247,244,0), #F7F7F4)",
                  }}
                ></div>
              </div>
              <div style={{ padding: "0 20px" }}>
                <div
                  style={{
                    marginTop: "24px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "#FF6A1A",
                    color: "#FFFFFF",
                    fontSize: "14px",
                    fontWeight: "900",
                  }}
                >
                  3
                </div>
                <h3
                  style={{
                    margin: "14px 0 0",
                    fontSize: "21px",
                    fontWeight: "900",
                    letterSpacing: "-0.035em",
                  }}
                >
                  Check yourself with mocks
                </h3>
                <p
                  style={{
                    margin: "8px 0 0",
                    fontSize: "15px",
                    lineHeight: "1.55",
                    fontWeight: "500",
                    color: "#5E5E5B",
                  }}
                >
                  Full two-module adaptive tests with the real timer and Desmos,
                  then a score report by skill.
                </p>
              </div>
            </div>
          </div>
        </section>
        {/* ============ FEATURES (dark teal band) ============ */}
        <section
          style={{
            marginTop: "128px",
            background: "#0C3A43",
            color: "#FFFFFF",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <svg
            aria-hidden="true"
            width="420"
            height="880"
            viewBox="0 0 110 230"
            style={{
              position: "absolute",
              right: "-90px",
              top: "-60px",
              opacity: "0.07",
            }}
          >
            <use href="#laurel"></use>
          </svg>
          <div
            style={{
              position: "relative",
              maxWidth: "1176px",
              margin: "0 auto",
              padding: "112px 32px",
              boxSizing: "content-box",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                gap: "24px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: "800",
                    letterSpacing: "0.14em",
                    color: "#F2C14E",
                  }}
                >
                  WHAT&apos;S INSIDE
                </div>
                <h2
                  style={{
                    margin: "12px 0 0",
                    maxWidth: "640px",
                    fontSize: "44px",
                    lineHeight: "1.05",
                    fontWeight: "900",
                    letterSpacing: "-0.05em",
                    color: "#FFFFFF",
                  }}
                >
                  Six tools in one place. No tabs open to five other sites.
                </h2>
              </div>
              <Link
                href="/resources"
                style={{
                  fontSize: "14px",
                  fontWeight: "800",
                  color: "#FFB07A",
                }}
              >
                See every feature →
              </Link>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "1px",
                marginTop: "48px",
                background: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: "24px",
                overflow: "hidden",
              }}
            >
              <div
                className="feat"
                style={{ background: "#0C3A43", padding: "32px 30px" }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    position: "relative",
                    height: "158px",
                    margin: "-32px -30px 6px",
                    overflow: "hidden",
                  }}
                >
                  <svg
                    width="100%"
                    height="158"
                    viewBox="0 0 280 150"
                    preserveAspectRatio="xMidYMid meet"
                    style={{ display: "block", marginTop: "12px" }}
                  >
                    <use href="#il-score"></use>
                  </svg>
                  <div
                    style={{
                      position: "absolute",
                      left: "0",
                      right: "0",
                      bottom: "0",
                      height: "64px",
                      background: "linear-gradient(rgba(12,58,67,0), #0C3A43)",
                    }}
                  ></div>
                </div>
                <h3
                  style={{
                    margin: "0",
                    fontSize: "19px",
                    fontWeight: "900",
                    letterSpacing: "-0.03em",
                  }}
                >
                  Score prediction
                </h3>
                <p
                  style={{
                    margin: "8px 0 0",
                    fontSize: "15px",
                    lineHeight: "1.55",
                    fontWeight: "500",
                    color: "#A7C9CE",
                  }}
                >
                  See where you&apos;d land today, section by section, and how
                  far your target is.
                </p>
              </div>
              <div
                className="feat"
                style={{ background: "#0C3A43", padding: "32px 30px" }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    position: "relative",
                    height: "158px",
                    margin: "-32px -30px 6px",
                    overflow: "hidden",
                  }}
                >
                  <svg
                    width="100%"
                    height="158"
                    viewBox="0 0 280 150"
                    preserveAspectRatio="xMidYMid meet"
                    style={{ display: "block", marginTop: "12px" }}
                  >
                    <use href="#il-note"></use>
                  </svg>
                  <div
                    style={{
                      position: "absolute",
                      left: "0",
                      right: "0",
                      bottom: "0",
                      height: "64px",
                      background: "linear-gradient(rgba(12,58,67,0), #0C3A43)",
                    }}
                  ></div>
                </div>
                <h3
                  style={{
                    margin: "0",
                    fontSize: "19px",
                    fontWeight: "900",
                    letterSpacing: "-0.03em",
                  }}
                >
                  Mistake notebook
                </h3>
                <p
                  style={{
                    margin: "8px 0 0",
                    fontSize: "15px",
                    lineHeight: "1.55",
                    fontWeight: "500",
                    color: "#A7C9CE",
                  }}
                >
                  Every wrong answer is saved and comes back until you get it
                  right twice.
                </p>
              </div>
              <div
                className="feat"
                style={{ background: "#0C3A43", padding: "32px 30px" }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    position: "relative",
                    height: "158px",
                    margin: "-32px -30px 6px",
                    overflow: "hidden",
                  }}
                >
                  <svg
                    width="100%"
                    height="158"
                    viewBox="0 0 280 150"
                    preserveAspectRatio="xMidYMid meet"
                    style={{ display: "block", marginTop: "12px" }}
                  >
                    <use href="#il-willo"></use>
                  </svg>
                  <div
                    style={{
                      position: "absolute",
                      left: "0",
                      right: "0",
                      bottom: "0",
                      height: "64px",
                      background: "linear-gradient(rgba(12,58,67,0), #0C3A43)",
                    }}
                  ></div>
                </div>
                <h3
                  style={{
                    margin: "0",
                    fontSize: "19px",
                    fontWeight: "900",
                    letterSpacing: "-0.03em",
                  }}
                >
                  Willo, your AI tutor
                </h3>
                <p
                  style={{
                    margin: "8px 0 0",
                    fontSize: "15px",
                    lineHeight: "1.55",
                    fontWeight: "500",
                    color: "#A7C9CE",
                  }}
                >
                  Ask why, ask again, ask at 2 a.m. Willo gives hints before
                  answers.
                </p>
              </div>
              <div
                className="feat"
                style={{ background: "#0C3A43", padding: "32px 30px" }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    position: "relative",
                    height: "158px",
                    margin: "-32px -30px 6px",
                    overflow: "hidden",
                  }}
                >
                  <svg
                    width="100%"
                    height="158"
                    viewBox="0 0 280 150"
                    preserveAspectRatio="xMidYMid meet"
                    style={{ display: "block", marginTop: "12px" }}
                  >
                    <use href="#il-desmos"></use>
                  </svg>
                  <div
                    style={{
                      position: "absolute",
                      left: "0",
                      right: "0",
                      bottom: "0",
                      height: "64px",
                      background: "linear-gradient(rgba(12,58,67,0), #0C3A43)",
                    }}
                  ></div>
                </div>
                <h3
                  style={{
                    margin: "0",
                    fontSize: "19px",
                    fontWeight: "900",
                    letterSpacing: "-0.03em",
                  }}
                >
                  Desmos, built in
                </h3>
                <p
                  style={{
                    margin: "8px 0 0",
                    fontSize: "15px",
                    lineHeight: "1.55",
                    fontWeight: "500",
                    color: "#A7C9CE",
                  }}
                >
                  The same calculator as test day, with Willo showing the Desmos
                  shortcut for each question.
                </p>
              </div>
              <div
                className="feat"
                style={{ background: "#0C3A43", padding: "32px 30px" }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    position: "relative",
                    height: "158px",
                    margin: "-32px -30px 6px",
                    overflow: "hidden",
                  }}
                >
                  <svg
                    width="100%"
                    height="158"
                    viewBox="0 0 280 150"
                    preserveAspectRatio="xMidYMid meet"
                    style={{ display: "block", marginTop: "12px" }}
                  >
                    <use href="#il-vocab"></use>
                  </svg>
                  <div
                    style={{
                      position: "absolute",
                      left: "0",
                      right: "0",
                      bottom: "0",
                      height: "64px",
                      background: "linear-gradient(rgba(12,58,67,0), #0C3A43)",
                    }}
                  ></div>
                </div>
                <h3
                  style={{
                    margin: "0",
                    fontSize: "19px",
                    fontWeight: "900",
                    letterSpacing: "-0.03em",
                  }}
                >
                  Vocabulary decks
                </h3>
                <p
                  style={{
                    margin: "8px 0 0",
                    fontSize: "15px",
                    lineHeight: "1.55",
                    fontWeight: "500",
                    color: "#A7C9CE",
                  }}
                >
                  Short daily cards with words in real SAT-style sentences,
                  spaced so they stick.
                </p>
              </div>
              <div
                className="feat"
                style={{ background: "#0C3A43", padding: "32px 30px" }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    position: "relative",
                    height: "158px",
                    margin: "-32px -30px 6px",
                    overflow: "hidden",
                  }}
                >
                  <svg
                    width="100%"
                    height="158"
                    viewBox="0 0 280 150"
                    preserveAspectRatio="xMidYMid meet"
                    style={{ display: "block", marginTop: "12px" }}
                  >
                    <use href="#il-count"></use>
                  </svg>
                  <div
                    style={{
                      position: "absolute",
                      left: "0",
                      right: "0",
                      bottom: "0",
                      height: "64px",
                      background: "linear-gradient(rgba(12,58,67,0), #0C3A43)",
                    }}
                  ></div>
                </div>
                <h3
                  style={{
                    margin: "0",
                    fontSize: "19px",
                    fontWeight: "900",
                    letterSpacing: "-0.03em",
                  }}
                >
                  Test-day countdown
                </h3>
                <p
                  style={{
                    margin: "8px 0 0",
                    fontSize: "15px",
                    lineHeight: "1.55",
                    fontWeight: "500",
                    color: "#A7C9CE",
                  }}
                >
                  Pick your SAT date. The plan paces itself so your last mock
                  lands a week before.
                </p>
              </div>
            </div>
          </div>
        </section>
        {/* ============ SAMPLE REPORT ============ */}
        <section
          style={{
            maxWidth: "1176px",
            margin: "0 auto",
            padding: "128px 32px 0",
            boxSizing: "content-box",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "12px",
                fontWeight: "800",
                letterSpacing: ".14em",
                color: "#A9730E",
              }}
            >
              YOUR SCORE REPORT
            </div>
            <h2
              style={{
                margin: "12px 0 0",
                fontSize: "44px",
                lineHeight: "1.05",
                fontWeight: "900",
                letterSpacing: "-.05em",
              }}
            >
              Know exactly where the points are
            </h2>
            <p
              style={{
                margin: "14px auto 0",
                maxWidth: "560px",
                fontSize: "17px",
                fontWeight: "500",
                color: "#5E5E5B",
              }}
            >
              After your first mock test you get this, section by section.
              Sample data shown.
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
              gap: "20px",
              marginTop: "44px",
            }}
          >
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #ECE9E3",
                borderRadius: "24px",
                padding: "30px",
                boxShadow:
                  "0 1px 2px rgba(58,36,20,.04),0 30px 60px -36px rgba(58,36,20,.3)",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "800",
                  letterSpacing: ".08em",
                  color: "#6E6E6A",
                }}
              >
                PREDICTED SCORE
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "10px",
                  marginTop: "8px",
                }}
              >
                <span
                  style={{
                    fontSize: "56px",
                    fontWeight: "900",
                    letterSpacing: "-.06em",
                  }}
                >
                  1430
                </span>
                <span
                  style={{
                    fontSize: "15px",
                    fontWeight: "800",
                    color: "#0F6B78",
                  }}
                >
                  +60 since last mock
                </span>
              </div>
              <div
                style={{
                  marginTop: "18px",
                  height: "8px",
                  borderRadius: "9px",
                  background: "#F0EDE6",
                }}
              >
                <div
                  style={{
                    width: "74%",
                    height: "100%",
                    borderRadius: "9px",
                    background: "#FF6A1A",
                  }}
                ></div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "10px",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#6E6E6A",
                }}
              >
                <span>
                  Reading and Writing <b style={{ color: "#0B0B0C" }}>700</b>
                </span>
                <span>
                  Math <b style={{ color: "#0B0B0C" }}>730</b>
                </span>
              </div>
            </div>
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #ECE9E3",
                borderRadius: "24px",
                padding: "30px",
                boxShadow:
                  "0 1px 2px rgba(58,36,20,.04),0 30px 60px -36px rgba(58,36,20,.3)",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "800",
                  letterSpacing: ".08em",
                  color: "#6E6E6A",
                }}
              >
                SKILL AREAS
              </div>
              <div style={{ marginTop: "10px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    height: "34px",
                  }}
                >
                  <span
                    style={{ flex: "1", fontSize: "14px", fontWeight: "700" }}
                  >
                    Algebra
                  </span>
                  <span
                    style={{
                      width: "110px",
                      height: "7px",
                      borderRadius: "9px",
                      background: "#F0EDE6",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        width: "88%",
                        height: "100%",
                        borderRadius: "9px",
                        background: "#0F6B78",
                      }}
                    ></span>
                  </span>
                  <span
                    style={{
                      width: "34px",
                      textAlign: "right",
                      fontSize: "13px",
                      fontWeight: "800",
                    }}
                  >
                    88%
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    height: "34px",
                  }}
                >
                  <span
                    style={{ flex: "1", fontSize: "14px", fontWeight: "700" }}
                  >
                    Craft and Structure
                  </span>
                  <span
                    style={{
                      width: "110px",
                      height: "7px",
                      borderRadius: "9px",
                      background: "#F0EDE6",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        width: "71%",
                        height: "100%",
                        borderRadius: "9px",
                        background: "#0F6B78",
                      }}
                    ></span>
                  </span>
                  <span
                    style={{
                      width: "34px",
                      textAlign: "right",
                      fontSize: "13px",
                      fontWeight: "800",
                    }}
                  >
                    71%
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    height: "34px",
                  }}
                >
                  <span
                    style={{ flex: "1", fontSize: "14px", fontWeight: "700" }}
                  >
                    Geometry
                  </span>
                  <span
                    style={{
                      width: "110px",
                      height: "7px",
                      borderRadius: "9px",
                      background: "#F0EDE6",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        width: "64%",
                        height: "100%",
                        borderRadius: "9px",
                        background: "#E2AA2E",
                      }}
                    ></span>
                  </span>
                  <span
                    style={{
                      width: "34px",
                      textAlign: "right",
                      fontSize: "13px",
                      fontWeight: "800",
                    }}
                  >
                    64%
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    height: "34px",
                  }}
                >
                  <span
                    style={{ flex: "1", fontSize: "14px", fontWeight: "700" }}
                  >
                    Standard English
                  </span>
                  <span
                    style={{
                      width: "110px",
                      height: "7px",
                      borderRadius: "9px",
                      background: "#F0EDE6",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        width: "52%",
                        height: "100%",
                        borderRadius: "9px",
                        background: "#FF6A1A",
                      }}
                    ></span>
                  </span>
                  <span
                    style={{
                      width: "34px",
                      textAlign: "right",
                      fontSize: "13px",
                      fontWeight: "800",
                    }}
                  >
                    52%
                  </span>
                </div>
              </div>
              <div
                style={{
                  marginTop: "8px",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#6E6E6A",
                }}
              >
                Lowest first on your plan.
              </div>
            </div>
            <div
              style={{
                background: "#FFF1E8",
                border: "1px solid #ECE9E3",
                borderRadius: "24px",
                padding: "30px",
                boxShadow:
                  "0 1px 2px rgba(58,36,20,.04),0 30px 60px -36px rgba(58,36,20,.3)",
                borderColor: "#F6DCC9",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <span
                  style={{
                    flex: "none",
                    width: "40px",
                    height: "40px",
                    position: "relative",
                    display: "inline-block",
                  }}
                >
                  <img
                    alt=""
                    src="/mascot/formats/avatar-wink.png"
                    style={{
                      position: "absolute",
                      left: "0",
                      bottom: "0",
                      width: "40px",
                    }}
                  />
                </span>
                <span
                  style={{
                    fontSize: "15px",
                    fontWeight: "900",
                    letterSpacing: "-.03em",
                  }}
                >
                  Willo&apos;s next step
                </span>
              </div>
              <p
                style={{
                  margin: "16px 0 0",
                  fontSize: "16px",
                  lineHeight: "1.55",
                  fontWeight: "600",
                  color: "#2A2A2A",
                }}
              >
                You keep picking “however” where the sentences agree. A 5-minute
                drill on contrast words closes most of this gap.
              </p>
              <Link
                href="/login"
                style={{
                  display: "inline-block",
                  marginTop: "18px",
                  fontSize: "14px",
                  fontWeight: "800",
                  color: "#C2410C",
                }}
              >
                Start drill →
              </Link>
            </div>
          </div>
        </section>
        {/* ============ PRICING ============ */}
        <section
          id="pricing"
          style={{ padding: "128px 32px 0", textAlign: "center" }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: "800",
              letterSpacing: "0.14em",
              color: "#A9730E",
            }}
          >
            PRICING
          </div>
          <h2
            style={{
              margin: "12px 0 0",
              fontSize: "44px",
              lineHeight: "1.05",
              fontWeight: "900",
              letterSpacing: "-0.05em",
            }}
          >
            Simple pricing
          </h2>
          <p
            style={{
              margin: "14px 0 0",
              fontSize: "17px",
              fontWeight: "500",
              color: "#5E5E5B",
            }}
          >
            Start free. Upgrade when you want full mock tests and Willo.
          </p>
          <div
            style={{
              maxWidth: "920px",
              margin: "32px auto 0",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "20px",
              textAlign: "left",
            }}
          >
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E8E4DC",
                borderRadius: "26px",
                padding: "36px 34px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "900",
                  letterSpacing: "-0.03em",
                }}
              >
                Free
              </div>
              <div
                style={{
                  marginTop: "18px",
                  display: "flex",
                  alignItems: "baseline",
                  gap: "8px",
                }}
              >
                <span
                  style={{
                    fontSize: "52px",
                    fontWeight: "900",
                    letterSpacing: "-0.06em",
                    lineHeight: "1",
                  }}
                >
                  $0
                </span>
                <span
                  style={{
                    fontSize: "15px",
                    fontWeight: "600",
                    color: "#6E6E6A",
                  }}
                >
                  forever
                </span>
              </div>
              <div
                style={{
                  marginTop: "8px",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#6E6E6A",
                }}
              >
                No card needed
              </div>
              <div
                style={{
                  marginTop: "24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                  flex: "1",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
                    fontSize: "15px",
                    fontWeight: "600",
                  }}
                >
                  <span
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      background: "#E7F1F2",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flex: "none",
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#0F6B78"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M5 12l5 5 9-10"></path>
                    </svg>
                  </span>
                  Daily practice questions
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
                    fontSize: "15px",
                    fontWeight: "600",
                  }}
                >
                  <span
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      background: "#E7F1F2",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flex: "none",
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#0F6B78"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M5 12l5 5 9-10"></path>
                    </svg>
                  </span>
                  Desmos calculator built in
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
                    fontSize: "15px",
                    fontWeight: "600",
                  }}
                >
                  <span
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      background: "#E7F1F2",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flex: "none",
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#0F6B78"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M5 12l5 5 9-10"></path>
                    </svg>
                  </span>
                  Score calculator
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
                    fontSize: "15px",
                    fontWeight: "600",
                  }}
                >
                  <span
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      background: "#E7F1F2",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flex: "none",
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#0F6B78"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M5 12l5 5 9-10"></path>
                    </svg>
                  </span>
                  Vocabulary decks
                </div>
              </div>
              <Link
                href="/login"
                className="btn-w"
                style={{
                  marginTop: "34px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "54px",
                  borderRadius: "999px",
                  border: "1px solid #DCD7CD",
                  fontSize: "14px",
                  fontWeight: "800",
                  letterSpacing: "0.05em",
                  color: "#0B0B0C",
                }}
              >
                START FREE
              </Link>
            </div>
            <div
              style={{
                background: "#0C3A43",
                color: "#FFFFFF",
                borderRadius: "26px",
                padding: "36px 34px",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                boxShadow: "0 30px 60px -24px rgba(12,58,67,0.55)",
              }}
            >
              <svg
                width="48"
                height="48"
                viewBox="0 0 48 48"
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: "30px",
                  right: "30px",
                  filter: "drop-shadow(0 8px 14px rgba(0,0,0,0.25))",
                }}
              >
                <use href="#tile"></use>
              </svg>
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <span
                  style={{
                    fontSize: "20px",
                    fontWeight: "900",
                    letterSpacing: "-0.03em",
                  }}
                >
                  Premium
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "800",
                    letterSpacing: "0.08em",
                    color: "#0C3A43",
                    background: "#F2C14E",
                    padding: "4px 9px",
                    borderRadius: "999px",
                  }}
                >
                  MOST CHOSEN
                </span>
              </div>
              <div
                style={{
                  marginTop: "18px",
                  display: "flex",
                  alignItems: "baseline",
                  gap: "8px",
                }}
              >
                <span
                  style={{
                    fontSize: "52px",
                    fontWeight: "900",
                    letterSpacing: "-0.06em",
                    lineHeight: "1",
                  }}
                >
                  {price}
                </span>
                <span
                  style={{
                    fontSize: "15px",
                    fontWeight: "600",
                    color: "#A7C9CE",
                  }}
                >
                  {per}
                </span>
              </div>
              <div
                style={{
                  marginTop: "8px",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#A7C9CE",
                }}
              >
                {priceNote}
              </div>
              <div
                style={{
                  marginTop: "24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                  flex: "1",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
                    fontSize: "15px",
                    fontWeight: "600",
                  }}
                >
                  <span
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      background: "#FF6A1A",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flex: "none",
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M5 12l5 5 9-10"></path>
                    </svg>
                  </span>
                  Everything in Free
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
                    fontSize: "15px",
                    fontWeight: "600",
                  }}
                >
                  <span
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      background: "#FF6A1A",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flex: "none",
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M5 12l5 5 9-10"></path>
                    </svg>
                  </span>
                  Full adaptive mock tests
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
                    fontSize: "15px",
                    fontWeight: "600",
                  }}
                >
                  <span
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      background: "#FF6A1A",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flex: "none",
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M5 12l5 5 9-10"></path>
                    </svg>
                  </span>
                  Willo AI tutor on every question
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
                    fontSize: "15px",
                    fontWeight: "600",
                  }}
                >
                  <span
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      background: "#FF6A1A",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flex: "none",
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M5 12l5 5 9-10"></path>
                    </svg>
                  </span>
                  Daily plan and full score report
                </div>
              </div>
              <Link
                href="/pricing"
                className="btn-o"
                style={{
                  marginTop: "34px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  height: "54px",
                  borderRadius: "999px",
                  background: "#FF6A1A",
                  fontSize: "14px",
                  fontWeight: "800",
                  letterSpacing: "0.05em",
                  color: "#FFFFFF",
                }}
              >
                GET PREMIUM <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
          {/* comparison */}
          <div
            style={{
              maxWidth: "920px",
              margin: "56px auto 0",
              textAlign: "left",
            }}
          >
            <h3
              style={{
                margin: "0",
                fontSize: "24px",
                fontWeight: "900",
                letterSpacing: "-0.04em",
              }}
            >
              Why not just a prep book, or a tutor?
            </h3>
            <div
              style={{
                marginTop: "18px",
                border: "1px solid #E8E4DC",
                borderRadius: "22px",
                overflowX: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  minWidth: "620px",
                  borderCollapse: "collapse",
                  fontSize: "14px",
                }}
              >
                <thead>
                  <tr style={{ background: "#FCFBF8" }}>
                    <th
                      scope="col"
                      style={{
                        textAlign: "left",
                        padding: "16px 22px",
                        fontWeight: "700",
                        color: "#6E6E6A",
                        borderBottom: "1px solid #ECE9E3",
                      }}
                    ></th>
                    <th
                      scope="col"
                      style={{
                        textAlign: "left",
                        padding: "16px 22px",
                        fontWeight: "800",
                        color: "#6E6E6A",
                        borderBottom: "1px solid #ECE9E3",
                      }}
                    >
                      Prep book
                    </th>
                    <th
                      scope="col"
                      style={{
                        textAlign: "left",
                        padding: "16px 22px",
                        fontWeight: "800",
                        color: "#6E6E6A",
                        borderBottom: "1px solid #ECE9E3",
                      }}
                    >
                      Private tutor
                    </th>
                    <th
                      scope="col"
                      style={{
                        textAlign: "left",
                        padding: "16px 22px",
                        fontWeight: "900",
                        color: "#0F6B78",
                        borderBottom: "1px solid #ECE9E3",
                        background: "#F1F7F8",
                      }}
                    >
                      WilloPrep
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th
                      scope="row"
                      style={{
                        textAlign: "left",
                        padding: "16px 22px",
                        fontWeight: "700",
                        borderBottom: "1px solid #ECE9E3",
                      }}
                    >
                      Adaptive, digital mock tests
                    </th>
                    <td
                      style={{
                        padding: "16px 22px",
                        color: "#6E6E6A",
                        borderBottom: "1px solid #ECE9E3",
                      }}
                    >
                      No, paper only
                    </td>
                    <td
                      style={{
                        padding: "16px 22px",
                        color: "#6E6E6A",
                        borderBottom: "1px solid #ECE9E3",
                      }}
                    >
                      Depends on the tutor
                    </td>
                    <td
                      style={{
                        padding: "16px 22px",
                        fontWeight: "800",
                        borderBottom: "1px solid #ECE9E3",
                        background: "#F1F7F8",
                      }}
                    >
                      Yes, 2 modules
                    </td>
                  </tr>
                  <tr>
                    <th
                      scope="row"
                      style={{
                        textAlign: "left",
                        padding: "16px 22px",
                        fontWeight: "700",
                        borderBottom: "1px solid #ECE9E3",
                      }}
                    >
                      Plan built from your mistakes
                    </th>
                    <td
                      style={{
                        padding: "16px 22px",
                        color: "#6E6E6A",
                        borderBottom: "1px solid #ECE9E3",
                      }}
                    >
                      No
                    </td>
                    <td
                      style={{
                        padding: "16px 22px",
                        color: "#6E6E6A",
                        borderBottom: "1px solid #ECE9E3",
                      }}
                    >
                      Weekly, if they track it
                    </td>
                    <td
                      style={{
                        padding: "16px 22px",
                        fontWeight: "800",
                        borderBottom: "1px solid #ECE9E3",
                        background: "#F1F7F8",
                      }}
                    >
                      Every day, automatically
                    </td>
                  </tr>
                  <tr>
                    <th
                      scope="row"
                      style={{
                        textAlign: "left",
                        padding: "16px 22px",
                        fontWeight: "700",
                        borderBottom: "1px solid #ECE9E3",
                      }}
                    >
                      Help at 11 p.m. before a quiz
                    </th>
                    <td
                      style={{
                        padding: "16px 22px",
                        color: "#6E6E6A",
                        borderBottom: "1px solid #ECE9E3",
                      }}
                    >
                      Answer key only
                    </td>
                    <td
                      style={{
                        padding: "16px 22px",
                        color: "#6E6E6A",
                        borderBottom: "1px solid #ECE9E3",
                      }}
                    >
                      Next session
                    </td>
                    <td
                      style={{
                        padding: "16px 22px",
                        fontWeight: "800",
                        borderBottom: "1px solid #ECE9E3",
                        background: "#F1F7F8",
                      }}
                    >
                      Willo, right away
                    </td>
                  </tr>
                  <tr>
                    <th
                      scope="row"
                      style={{
                        textAlign: "left",
                        padding: "16px 22px",
                        fontWeight: "700",
                      }}
                    >
                      Cost per month
                    </th>
                    <td style={{ padding: "16px 22px", color: "#6E6E6A" }}>
                      One-time book price
                    </td>
                    <td style={{ padding: "16px 22px", color: "#6E6E6A" }}>
                      Paid by the hour
                    </td>
                    <td
                      style={{
                        padding: "16px 22px",
                        fontWeight: "900",
                        background: "#F1F7F8",
                      }}
                    >
                      $0 or $9.99
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
        {/* ============ FAQ ============ */}
        <section
          style={{
            maxWidth: "920px",
            margin: "0 auto",
            padding: "128px 32px 0",
            boxSizing: "content-box",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              gap: "24px",
              flexWrap: "wrap",
            }}
          >
            <h2
              style={{
                margin: "0",
                fontSize: "44px",
                lineHeight: "1.05",
                fontWeight: "900",
                letterSpacing: "-0.05em",
              }}
            >
              Questions, answered
            </h2>
            <Link
              href="/contact"
              style={{ fontSize: "14px", fontWeight: "700", color: "#0F6B78" }}
            >
              Still unsure? Write to us →
            </Link>
          </div>
          <div
            style={{
              marginTop: "32px",
              border: "1px solid #E8E4DC",
              borderRadius: "22px",
              overflow: "hidden",
            }}
          >
            {faqs.map((f, fIndex) => (
              <Fragment key={fIndex}>
                <div style={css(f.rowStyle)}>
                  <button
                    type="button"
                    className="faq-q"
                    onClick={f.toggle}
                    aria-expanded={f.open}
                    style={{
                      width: "100%",
                      fontFamily: "inherit",
                      textAlign: "left",
                      cursor: "pointer",
                      background: "#FFFFFF",
                      border: "0",
                      padding: "24px 28px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "16px",
                      fontSize: "17px",
                      fontWeight: "800",
                      letterSpacing: "-0.02em",
                      color: "#0B0B0C",
                    }}
                  >
                    {f.q}
                    <span
                      aria-hidden="true"
                      style={{
                        fontSize: "26px",
                        fontWeight: "400",
                        color: "#8A8A86",
                        lineHeight: "1",
                      }}
                    >
                      {f.sign}
                    </span>
                  </button>
                  {f.open && (
                    <>
                      <p
                        style={{
                          margin: "0",
                          padding: "0 28px 24px",
                          maxWidth: "720px",
                          fontSize: "15px",
                          lineHeight: "1.6",
                          fontWeight: "500",
                          color: "#5E5E5B",
                        }}
                      >
                        {f.a}
                      </p>
                    </>
                  )}
                </div>
              </Fragment>
            ))}
          </div>
        </section>
        {/* ============ FINAL CTA ============ */}
        <section
          style={{
            maxWidth: "1176px",
            margin: "0 auto",
            padding: "128px 32px 0",
            boxSizing: "content-box",
          }}
        >
          <div
            style={{
              position: "relative",
              background: "#FFF1E8",
              borderRadius: "32px",
              padding: "72px 64px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "40px",
              flexWrap: "wrap",
              overflow: "hidden",
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                right: "-120px",
                bottom: "-160px",
                width: "520px",
                height: "520px",
                borderRadius: "50%",
                background: "#FFE2CF",
              }}
            ></div>
            <div
              style={{ position: "relative", flex: "1 1 480px", minWidth: "0" }}
            >
              <h2
                style={{
                  margin: "0",
                  maxWidth: "600px",
                  fontSize: "54px",
                  lineHeight: "1.02",
                  fontWeight: "900",
                  letterSpacing: "-0.055em",
                  color: "#0B0B0C",
                }}
              >
                Your plan for today is two minutes away.
              </h2>
              <p
                style={{
                  margin: "18px 0 0",
                  fontSize: "17px",
                  fontWeight: "500",
                  color: "#5E4A3E",
                }}
              >
                Take the diagnostic tonight. Wake up to a plan that knows what
                you missed.
              </p>
              <Link
                href="/login"
                className="btn-o"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  height: "56px",
                  marginTop: "30px",
                  padding: "0 32px",
                  borderRadius: "999px",
                  background: "#FF6A1A",
                  color: "#FFFFFF",
                  fontSize: "15px",
                  fontWeight: "800",
                  letterSpacing: "0.04em",
                  boxShadow: "0 12px 28px -8px rgba(255,106,26,0.55)",
                }}
              >
                START PREPARING <span aria-hidden="true">→</span>
              </Link>
              <div
                style={{
                  marginTop: "14px",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#7A5A48",
                }}
              >
                Free plan forever · No card needed
              </div>
            </div>
            <div
              style={{
                position: "relative",
                flex: "0 0 auto",
                transform: "rotate(7deg)",
                filter:
                  "drop-shadow(0 18px 24px rgba(122,74,35,0.22)) drop-shadow(0 2px 3px rgba(0,0,0,0.12))",
              }}
            >
              <img
                alt="Willo, the WilloPrep deer mascot"
                src="/mascot/formats/sticker-cheer.png"
                style={{ width: "300px", display: "block" }}
              />
            </div>
          </div>
        </section>
        {/* ============ FOOTER ============ */}
        <footer
          style={{
            maxWidth: "1176px",
            margin: "0 auto",
            padding: "88px 32px 56px",
            boxSizing: "content-box",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
              gap: "32px",
            }}
          >
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              <Link
                href="/"
                aria-label="WilloPrep home"
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <span
                  style={{
                    fontSize: "24px",
                    fontWeight: "800",
                    letterSpacing: "-0.045em",
                    color: "#0B0B0C",
                    whiteSpace: "nowrap",
                  }}
                >
                  <svg
                    width="27"
                    height="24"
                    viewBox="3 5 42 37"
                    aria-hidden="true"
                    style={{ verticalAlign: "baseline", marginRight: "0.5px" }}
                  >
                    <use href="#antler3dTeal"></use>
                  </svg>
                  illo<span style={{ color: "#0F6B78" }}>Prep</span>
                </span>
              </Link>
              <span
                style={{
                  fontSize: "13px",
                  lineHeight: "1.5",
                  fontWeight: "500",
                  color: "#6E6E6A",
                }}
              >
                SAT prep that plans itself around your mistakes.
              </span>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: "800",
                  letterSpacing: "0.1em",
                  color: "#0B0B0C",
                }}
              >
                PRODUCT
              </span>
              <Link href="/practice">Practice</Link>
              <Link href="/mocks">Mock tests</Link>
              <Link href="/willo">Willo AI</Link>
              <a href="#pricing">Pricing</a>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: "800",
                  letterSpacing: "0.1em",
                  color: "#0B0B0C",
                }}
              >
                FREE TOOLS
              </span>
              <Link href="/sat/score-calculator">Score calculator</Link>
              <Link href="/sat">SAT test dates</Link>
              <Link href="/vocab">Vocabulary list</Link>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: "800",
                  letterSpacing: "0.1em",
                  color: "#0B0B0C",
                }}
              >
                FOR
              </span>
              <Link href="/contact">Parents</Link>
              <Link href="/contact">Teachers and tutors</Link>
              <Link href="/contact">Schools</Link>
            </div>
          </div>
          <div
            style={{
              marginTop: "48px",
              borderTop: "1px solid #ECE9E3",
              paddingTop: "24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "24px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{ fontSize: "12px", fontWeight: "500", color: "#6E6E6A" }}
            >
              © 2026 WilloPrep ·{" "}
              <Link href="/privacy" style={{ color: "#6E6E6A" }}>
                Privacy
              </Link>{" "}
              ·{" "}
              <Link href="/terms" style={{ color: "#6E6E6A" }}>
                Terms
              </Link>
            </span>
            <p
              style={{
                margin: "0",
                maxWidth: "470px",
                fontSize: "12px",
                lineHeight: "1.6",
                fontWeight: "500",
                color: "#6E6E6A",
                textAlign: "right",
              }}
            >
              SAT® is a trademark registered by the College Board, which is not
              affiliated with, and does not endorse, this product.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
