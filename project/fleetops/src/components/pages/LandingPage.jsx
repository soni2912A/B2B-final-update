import { useState, useEffect, useRef } from "react";
import { API_BASE } from "../../utils/api.js";

const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');

:root {
  --lp-font-sans: 'DM Sans', system-ui, sans-serif;
  --lp-font-display: 'Playfair Display', Georgia, serif;
  --lp-radius-sm: 10px; --lp-radius: 16px; --lp-radius-lg: 24px; --lp-radius-xl: 32px;
  --lp-shadow-sm: 0 2px 6px rgba(0,0,0,.18);
  --lp-shadow: 0 20px 40px -20px rgba(0,0,0,.55);
  --lp-shadow-lg: 0 40px 80px -30px rgba(0,0,0,.65);
  --lp-transition: .3s cubic-bezier(.2,.8,.2,1);
  --lp-container: 1240px;
}

/* ── DARK THEME (login page palette) ── */
.lp-dark {
  --lp-bg: #0d1117;
  --lp-bg-soft: #0f1623;
  --lp-bg-elev: #161d2e;
  --lp-surface: rgba(255,255,255,.04);
  --lp-surface-2: rgba(255,255,255,.07);
  --lp-border: rgba(255,255,255,.08);
  --lp-border-strong: rgba(255,255,255,.16);
  --lp-text: #e8eaf0;
  --lp-text-dim: #8892a4;
  --lp-text-mute: #576070;
  /* golden yellow primary — matches login CTA */
  --lp-brand: #e8b84b;
  --lp-brand-2: #f0c040;
  --lp-brand-3: #d4a030;
  /* green secondary — matches login "smarter." word */
  --lp-accent: #4ade80;
  /* semantic */
  --lp-success: #4ade80;
  --lp-warn: #f0c040;
  --lp-danger: #f87171;
  --lp-info: #60a5fa;
  /* gradients — yellow-to-gold instead of pink-purple */
  --lp-grad-brand: linear-gradient(135deg, #f0c040 0%, #e8b84b 50%, #d4a030 100%);
  --lp-grad-hero: radial-gradient(1200px 600px at 80% -10%, rgba(240,192,64,.18), transparent 60%),
                  radial-gradient(900px 500px at 10% 10%, rgba(96,165,250,.12), transparent 60%),
                  radial-gradient(800px 500px at 50% 110%, rgba(74,222,128,.10), transparent 60%);
}

/* ── LIGHT THEME (complementary warm-light) ── */
.lp-light {
  --lp-bg: #faf8f2;
  --lp-bg-soft: #f3efe4;
  --lp-bg-elev: #ffffff;
  --lp-surface: rgba(0,0,0,.03);
  --lp-surface-2: rgba(0,0,0,.055);
  --lp-border: rgba(20,15,5,.10);
  --lp-border-strong: rgba(20,15,5,.20);
  --lp-text: #1a1608;
  --lp-text-dim: #5a5235;
  --lp-text-mute: #8a8060;
  --lp-brand: #b8880a;
  --lp-brand-2: #c99410;
  --lp-brand-3: #a07208;
  --lp-accent: #16a34a;
  --lp-success: #16a34a;
  --lp-warn: #b8880a;
  --lp-danger: #dc2626;
  --lp-info: #2563eb;
  --lp-grad-brand: linear-gradient(135deg, #c99410 0%, #b8880a 50%, #a07208 100%);
  --lp-grad-hero: radial-gradient(1200px 600px at 80% -10%, rgba(200,148,16,.18), transparent 60%),
                  radial-gradient(900px 500px at 10% 10%, rgba(37,99,235,.10), transparent 60%),
                  radial-gradient(800px 500px at 50% 110%, rgba(22,163,74,.10), transparent 60%);
}

.lp-root {
  font-family: var(--lp-font-sans);
  background: var(--lp-bg);
  color: var(--lp-text);
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
  transition: background var(--lp-transition), color var(--lp-transition);
  min-height: 100vh;
}
.lp-root h1,.lp-root h2,.lp-root h3,.lp-root h4,.lp-root h5{margin:0 0 .5em;font-family:var(--lp-font-display);font-weight:700;letter-spacing:-.01em;line-height:1.12;}
.lp-root p{margin:0 0 1em;}
.lp-root a{color:inherit;text-decoration:none;transition:color .2s ease;}
.lp-root button,.lp-root input,.lp-root textarea,.lp-root select{font:inherit;color:inherit;}
.lp-root img,.lp-root svg{max-width:100%;display:block;}

.lp-container{width:min(var(--lp-container),calc(100% - 32px));margin-inline:auto;}
.lp-h1{font-size:clamp(1.9rem,5.2vw,4.6rem);}
.lp-h2{font-size:clamp(1.5rem,3.8vw,3rem);}
.lp-eyebrow{display:inline-block;font-family:var(--lp-font-sans);font-size:.78rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--lp-brand);padding:6px 14px;border:1px solid rgba(240,192,64,.25);border-radius:99px;background:rgba(240,192,64,.08);margin-bottom:1rem;}
.lp-grad{background:var(--lp-grad-brand);-webkit-background-clip:text;background-clip:text;color:transparent;}
.lp-grad-green{background:linear-gradient(135deg,#4ade80,#22c55e);-webkit-background-clip:text;background-clip:text;color:transparent;}
.lp-lede{color:var(--lp-text-dim);font-size:1.04rem;max-width:58ch;}
.lp-sub{color:var(--lp-text-dim);max-width:62ch;margin-inline:auto;font-size:.98rem;}
.lp-link-brand{color:var(--lp-brand-2);font-weight:600;font-size:.9rem;}
.lp-link-brand:hover{color:var(--lp-accent);}

/* Buttons — golden yellow primary matching login CTA */
.lp-btn{display:inline-flex;align-items:center;gap:.5rem;padding:.78rem 1.35rem;border-radius:99px;font-weight:600;font-size:.92rem;border:1px solid transparent;cursor:pointer;transition:transform var(--lp-transition),box-shadow var(--lp-transition),background var(--lp-transition),opacity var(--lp-transition);white-space:nowrap;text-decoration:none;font-family:var(--lp-font-sans);}
.lp-btn-primary{background:var(--lp-grad-brand);color:#1a1000;box-shadow:0 12px 30px -10px rgba(240,192,64,.4);}
.lp-btn-primary:hover{transform:translateY(-2px);box-shadow:0 18px 40px -12px rgba(240,192,64,.55);opacity:.92;}
.lp-btn-outline{border-color:var(--lp-border-strong);background:transparent;color:var(--lp-text);}
.lp-btn-outline:hover{background:var(--lp-surface);border-color:var(--lp-brand);}
.lp-btn-ghost{background:var(--lp-surface);border-color:var(--lp-border);color:var(--lp-text);}
.lp-btn-ghost:hover{background:var(--lp-surface-2);}
.lp-btn-xs{padding:.35rem .75rem;font-size:.78rem;background:var(--lp-surface-2);border:1px solid var(--lp-border);border-radius:99px;cursor:pointer;color:var(--lp-text);}
.lp-btn-xs:hover{background:var(--lp-grad-brand);color:#1a1000;border-color:transparent;}
.lp-icon-btn{width:40px;height:40px;border-radius:99px;border:1px solid var(--lp-border);background:var(--lp-surface);color:var(--lp-text);display:grid;place-items:center;cursor:pointer;transition:background var(--lp-transition);flex-shrink:0;}
.lp-icon-btn:hover{background:var(--lp-surface-2);}
.lp-icon-btn svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.6;}

/* NAV */
.lp-nav{position:fixed;top:0;left:0;right:0;z-index:80;padding:11px 0;transition:background var(--lp-transition),border-color var(--lp-transition);}
.lp-nav.lp-scrolled{background:color-mix(in srgb,var(--lp-bg) 88%,transparent);backdrop-filter:saturate(120%) blur(16px);-webkit-backdrop-filter:saturate(120%) blur(16px);border-bottom:1px solid var(--lp-border);}
.lp-nav__inner{width:min(var(--lp-container),calc(100% - 24px));margin-inline:auto;display:flex;align-items:center;gap:1rem;}
.lp-brand{display:inline-flex;align-items:center;gap:.55rem;font-weight:800;flex-shrink:0;min-width:0;cursor:pointer;}
.lp-brand__mark{width:34px;height:34px;border-radius:10px;overflow:hidden;flex-shrink:0;}
.lp-brand__name{font-family:var(--lp-font-display);font-size:1.05rem;letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.lp-nav__links{display:flex;gap:1.2rem;margin-inline:auto;list-style:none;padding:0;align-items:center;}
.lp-nav__links a{color:var(--lp-text-dim);font-weight:500;font-size:.9rem;position:relative;white-space:nowrap;cursor:pointer;transition:color .2s;}
.lp-nav__links a:hover{color:var(--lp-brand-2);}
.lp-nav__tools{display:flex;align-items:center;gap:.5rem;flex-shrink:0;}
.lp-menu-btn{display:none;width:40px;height:40px;border-radius:11px;background:var(--lp-surface);border:1px solid var(--lp-border);cursor:pointer;padding:10px;flex-shrink:0;}
.lp-menu-btn span{display:block;height:2px;background:var(--lp-text);margin:3px 0;border-radius:2px;transition:transform .3s,opacity .3s;}

/* HERO */
.lp-hero{position:relative;padding:128px 0 56px;overflow:hidden;isolation:isolate;}
.lp-hero__bg{position:absolute;inset:0;z-index:-1;background:var(--lp-grad-hero);}
.lp-blob{position:absolute;border-radius:50%;filter:blur(90px);opacity:.6;animation:lp-drift 18s ease-in-out infinite;}
.lp-blob-a{width:520px;height:520px;top:-120px;right:-80px;background:radial-gradient(closest-side,rgba(240,192,64,.6),transparent);}
.lp-blob-b{width:460px;height:460px;bottom:-140px;left:-100px;background:radial-gradient(closest-side,rgba(96,165,250,.45),transparent);animation-delay:-6s;}
.lp-blob-c{width:380px;height:380px;top:40%;left:40%;background:radial-gradient(closest-side,rgba(74,222,128,.4),transparent);animation-delay:-12s;opacity:.45;}
@keyframes lp-drift{0%,100%{transform:translate(0,0) scale(1);}33%{transform:translate(30px,-20px) scale(1.05);}66%{transform:translate(-20px,25px) scale(.97);}}
.lp-grid-overlay{position:absolute;inset:0;background-image:linear-gradient(rgba(240,192,64,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(240,192,64,.08) 1px,transparent 1px);background-size:60px 60px;mask-image:radial-gradient(ellipse at center,#000 40%,transparent 75%);-webkit-mask-image:radial-gradient(ellipse at center,#000 40%,transparent 75%);opacity:.5;}
.lp-hero__inner{width:min(var(--lp-container),calc(100% - 32px));margin-inline:auto;display:grid;grid-template-columns:1.05fr .95fr;gap:3rem;align-items:center;min-height:62vh;}
.lp-hero__copy{max-width:640px;}
.lp-hero__cta{display:flex;gap:.75rem;flex-wrap:wrap;margin:1.4rem 0 1.65rem;}
.lp-hero__chips{list-style:none;padding:0;margin:0;display:flex;flex-wrap:wrap;gap:.5rem;}
.lp-hero__chips li{font-size:.8rem;color:var(--lp-text-dim);padding:.38rem .78rem;background:var(--lp-surface);border:1px solid var(--lp-border);border-radius:99px;}
.lp-hero__stats{width:min(var(--lp-container),calc(100% - 32px));margin:44px auto 0;display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;padding:1.2rem;background:var(--lp-surface);border:1px solid var(--lp-border);border-radius:var(--lp-radius-lg);backdrop-filter:blur(10px);}
.lp-hero__stats>div{text-align:center;padding:.4rem;}
.lp-hero__stats b{display:block;font-family:var(--lp-font-display);font-size:clamp(1.3rem,3vw,2rem);color:var(--lp-brand-2);}
.lp-hero__stats span{color:var(--lp-text-mute);font-size:.8rem;}

/* CAKE SCENE */
.lp-hero__visual{position:relative;height:500px;perspective:1400px;overflow:visible;}
.lp-scene{position:relative;width:100%;height:100%;transform-style:preserve-3d;transform:rotateX(8deg) rotateY(-8deg);animation:lp-sceneFloat 8s ease-in-out infinite;transition:transform .3s ease;}
@keyframes lp-sceneFloat{0%,100%{transform:rotateX(8deg) rotateY(-8deg);}50%{transform:rotateX(6deg) rotateY(-10deg) translateZ(14px);}}
.lp-ring{position:absolute;left:50%;top:50%;border-radius:50%;transform:translate(-50%,-50%);pointer-events:none;}
.lp-ring-1{width:300px;height:300px;border:2px dashed rgba(240,192,64,.3);animation:lp-spin 40s linear infinite;}
.lp-ring-2{width:400px;height:400px;border:2px solid rgba(96,165,250,.2);animation:lp-spin 60s linear infinite reverse;}
.lp-ring-3{width:500px;height:500px;border:1px dotted rgba(74,222,128,.15);animation:lp-spin 90s linear infinite;}
@keyframes lp-spin{to{transform:translate(-50%,-50%) rotate(360deg);}}
.lp-cake{position:absolute;left:50%;top:54%;width:230px;height:230px;transform:translate(-50%,-50%);transform-style:preserve-3d;animation:lp-cakeBob 5s ease-in-out infinite;filter:drop-shadow(0 28px 38px rgba(0,0,0,.6));}
@keyframes lp-cakeBob{0%,100%{transform:translate(-50%,-50%) translateY(0);}50%{transform:translate(-50%,-50%) translateY(-13px);}}
.lp-cake__layer{position:absolute;left:50%;transform:translateX(-50%);border-radius:50%/30%;box-shadow:inset 0 -12px 20px rgba(0,0,0,.3),inset 0 12px 20px rgba(255,255,255,.15),0 10px 20px rgba(0,0,0,.3);}
.lp-cake__layer-bottom{bottom:10px;width:192px;height:72px;background:linear-gradient(180deg,#f5d060 0%,#e8b84b 55%,#b07820 100%);}
.lp-cake__layer-middle{bottom:70px;width:148px;height:58px;background:linear-gradient(180deg,#fae090 0%,#f0c040 60%,#c08820 100%);}
.lp-cake__layer-top{bottom:120px;width:105px;height:46px;background:linear-gradient(180deg,#fffad0 0%,#f5d060 60%,#d4a030 100%);}
.lp-cake__candle{position:absolute;left:50%;bottom:160px;transform:translateX(-50%);width:10px;height:32px;background:linear-gradient(180deg,#60a5fa,#4ade80);border-radius:3px;}
.lp-flame{position:absolute;left:50%;top:-13px;transform:translateX(-50%);width:12px;height:18px;background:radial-gradient(ellipse at 50% 60%,#fff6c0 0%,#f0c040 40%,#ff8c1a 75%,transparent 100%);border-radius:50% 50% 40% 40%;animation:lp-flicker 1.2s ease-in-out infinite alternate;filter:drop-shadow(0 0 10px rgba(240,192,64,.8));}
@keyframes lp-flicker{0%{transform:translateX(-50%) scale(1) rotate(-2deg);}100%{transform:translateX(-50%) scale(1.15) rotate(3deg);}}
.lp-cake__plate{position:absolute;left:50%;bottom:0;transform:translateX(-50%);width:240px;height:22px;background:radial-gradient(ellipse at 50% 40%,rgba(255,255,255,.9) 0%,rgba(240,192,64,.3) 60%,rgba(30,40,60,.6) 100%);border-radius:50%;opacity:.75;}
.lp-floatcard{position:absolute;display:flex;align-items:center;gap:.7rem;padding:.68rem .92rem;min-width:185px;background:rgba(22,29,46,.92);border:1px solid rgba(240,192,64,.2);border-radius:var(--lp-radius);backdrop-filter:blur(12px);box-shadow:var(--lp-shadow);font-size:.82rem;animation:lp-floaty 6s ease-in-out infinite;}
.lp-floatcard b{display:block;font-size:.87rem;color:var(--lp-text);font-weight:600;}
.lp-floatcard span{color:var(--lp-text-mute);font-size:.75rem;}
.lp-floatcard__ico{width:33px;height:33px;border-radius:10px;background:var(--lp-grad-brand);color:#1a1000;display:grid;place-items:center;font-size:.98rem;flex-shrink:0;}
.lp-floatcard-1{top:8%;left:-4%;animation-delay:-1s;}
.lp-floatcard-2{top:44%;right:-4%;animation-delay:-3s;}
.lp-floatcard-3{bottom:8%;left:2%;animation-delay:-5s;}
@keyframes lp-floaty{0%,100%{transform:translateY(0);}50%{transform:translateY(-10px);}}
.lp-sparkle{position:absolute;width:10px;height:10px;background:radial-gradient(circle,rgba(240,192,64,1) 0%,transparent 70%);border-radius:50%;animation:lp-twinkle 3s ease-in-out infinite;}
.lp-sparkle-a{top:12%;right:18%;}
.lp-sparkle-b{top:60%;left:10%;animation-delay:-1s;background:radial-gradient(circle,rgba(74,222,128,1) 0%,transparent 70%);}
.lp-sparkle-c{bottom:20%;right:30%;animation-delay:-2s;background:radial-gradient(circle,rgba(96,165,250,1) 0%,transparent 70%);}
@keyframes lp-twinkle{0%,100%{opacity:0;transform:scale(.5);}50%{opacity:1;transform:scale(1.3);}}

/* SECTIONS */
.lp-section{padding:96px 0;position:relative;}
.lp-section-alt{background:var(--lp-bg-soft);}
.lp-sec-head{text-align:center;max-width:760px;margin:0 auto 52px;}
.lp-sec-head-split{display:flex;align-items:flex-end;justify-content:space-between;gap:2rem;text-align:left;max-width:none;flex-wrap:wrap;}

/* Platform grid */
.lp-platform-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.4rem;}
.lp-pill{padding:1.85rem 1.6rem;background:var(--lp-bg-elev);border:1px solid var(--lp-border);border-radius:var(--lp-radius-lg);transition:transform var(--lp-transition),box-shadow var(--lp-transition),border-color var(--lp-transition);}
.lp-pill:hover{transform:translateY(-6px);box-shadow:var(--lp-shadow-lg);border-color:rgba(240,192,64,.3);}
.lp-pill__ico{width:50px;height:50px;border-radius:var(--lp-radius);background:var(--lp-grad-brand);display:grid;place-items:center;font-size:1.45rem;color:#1a1000;margin-bottom:1rem;}
.lp-pill h3{font-size:1.25rem;} .lp-pill p{color:var(--lp-text-dim);}

/* Modules */
.lp-mod-filter{display:flex;flex-wrap:wrap;justify-content:center;gap:.5rem;margin-bottom:2.25rem;}
.lp-chip{padding:.48rem 1.05rem;border-radius:99px;background:var(--lp-surface);border:1px solid var(--lp-border);color:var(--lp-text-dim);font-weight:500;font-size:.87rem;cursor:pointer;transition:all var(--lp-transition);}
.lp-chip:hover{color:var(--lp-brand-2);border-color:rgba(240,192,64,.3);}
.lp-chip.lp-active{background:var(--lp-grad-brand);color:#1a1000;border-color:transparent;}
.lp-modules-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:1.15rem;}
.lp-mod{position:relative;padding:1.65rem 1.4rem 1.35rem;background:var(--lp-bg-elev);border:1px solid var(--lp-border);border-radius:var(--lp-radius);transition:all var(--lp-transition);overflow:hidden;}
.lp-mod::before{content:"";position:absolute;inset:0;background:rgba(240,192,64,.06);opacity:0;transition:opacity var(--lp-transition);z-index:0;}
.lp-mod:hover{transform:translateY(-5px);box-shadow:var(--lp-shadow-lg);border-color:rgba(240,192,64,.25);}
.lp-mod:hover::before{opacity:1;}
.lp-mod>*{position:relative;z-index:1;}
.lp-mod__tag{position:absolute;top:13px;right:13px;font-size:.7rem;font-weight:700;color:var(--lp-brand);letter-spacing:.08em;background:rgba(240,192,64,.1);padding:3px 7px;border-radius:6px;}
.lp-mod__ico{width:44px;height:44px;border-radius:12px;background:var(--lp-surface-2);display:grid;place-items:center;font-size:1.35rem;margin-bottom:.9rem;transition:background var(--lp-transition);}
.lp-mod:hover .lp-mod__ico{background:var(--lp-grad-brand);}
.lp-mod h3{font-family:var(--lp-font-sans);font-size:.98rem;font-weight:600;margin-bottom:.35rem;}
.lp-mod p{color:var(--lp-text-dim);font-size:.85rem;margin:0;}

/* Admin mock */
.lp-mock{background:var(--lp-bg-elev);border:1px solid var(--lp-border);border-radius:var(--lp-radius-lg);overflow:hidden;box-shadow:var(--lp-shadow-lg);margin-bottom:1.85rem;}
.lp-mock__chrome{display:flex;align-items:center;gap:.45rem;padding:.65rem .95rem;background:var(--lp-surface);border-bottom:1px solid var(--lp-border);}
.lp-dot{width:11px;height:11px;border-radius:50%;flex-shrink:0;}
.lp-dot-r{background:#f87171;}.lp-dot-y{background:#f0c040;}.lp-dot-g{background:#4ade80;}
.lp-mock__url{margin-left:.7rem;font-size:.76rem;color:var(--lp-text-mute);background:var(--lp-bg);padding:.26rem .7rem;border-radius:8px;flex:1;max-width:260px;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.lp-mock__layout{display:grid;grid-template-columns:190px 1fr;min-height:420px;}
.lp-mock__side{background:var(--lp-bg-soft);border-right:1px solid var(--lp-border);padding:.95rem .8rem;overflow:hidden;}
.lp-mock__brand{font-family:var(--lp-font-display);font-weight:700;font-size:1rem;padding:.38rem .6rem;margin-bottom:.6rem;color:var(--lp-brand-2);}
.lp-mock__nav{display:block;padding:.46rem .6rem;border-radius:9px;color:var(--lp-text-dim);font-size:.82rem;margin-bottom:.1rem;cursor:pointer;transition:all var(--lp-transition);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.lp-mock__nav:hover{background:var(--lp-surface);color:var(--lp-text);}
.lp-mock__nav.lp-active{background:var(--lp-grad-brand);color:#1a1000;}
.lp-mock__body{padding:1.15rem;overflow:hidden;}
.lp-mock__kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:.65rem;margin-bottom:1rem;}
.lp-kpi{padding:.8rem;background:var(--lp-bg-soft);border:1px solid var(--lp-border);border-radius:var(--lp-radius);}
.lp-kpi span{font-size:.7rem;color:var(--lp-text-mute);text-transform:uppercase;letter-spacing:.05em;display:block;}
.lp-kpi b{display:block;font-size:1.3rem;font-family:var(--lp-font-display);margin:.18rem 0;color:var(--lp-brand-2);}
.lp-kpi em{font-size:.72rem;font-style:normal;font-weight:600;}
.lp-kpi .lp-up{color:var(--lp-success);}.lp-kpi .lp-down{color:var(--lp-danger);}
.lp-mock__split{display:grid;grid-template-columns:1.1fr .9fr;gap:.8rem;}
.lp-panel{background:var(--lp-bg-soft);border:1px solid var(--lp-border);border-radius:var(--lp-radius);padding:.85rem;overflow:hidden;}
.lp-panel__head{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:.6rem;gap:.4rem;}
.lp-panel__head small{color:var(--lp-text-mute);font-size:.7rem;}
.lp-tl{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:.3rem;}
.lp-tl li{display:grid;grid-template-columns:48px 1fr auto;gap:.45rem;align-items:center;padding:.42rem .12rem;border-bottom:1px dashed var(--lp-border);font-size:.8rem;}
.lp-tl li:last-child{border-bottom:0;}
.lp-tl__t{font-family:var(--lp-font-display);font-weight:700;color:var(--lp-brand-2);font-size:.78rem;}
.lp-tl__b{font-size:.64rem;font-weight:700;padding:2px 6px;border-radius:99px;text-transform:uppercase;white-space:nowrap;}
.lp-tl__b-blue{background:rgba(96,165,250,.18);color:#60a5fa;}
.lp-tl__b-amber{background:rgba(240,192,64,.18);color:var(--lp-brand-2);}
.lp-tl__b-green{background:rgba(74,222,128,.18);color:#4ade80;}
.lp-alert{display:grid;grid-template-columns:34px 1fr auto;gap:.6rem;align-items:center;padding:.55rem;margin-bottom:.4rem;background:var(--lp-surface);border:1px solid var(--lp-border);border-radius:11px;}
.lp-alert__ico{width:34px;height:34px;display:grid;place-items:center;background:var(--lp-grad-brand);border-radius:9px;font-size:.95rem;flex-shrink:0;}
.lp-alert__t b{display:block;font-size:.84rem;font-weight:600;}
.lp-alert__t span{font-size:.72rem;color:var(--lp-text-mute);}
.lp-card-row{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:.72rem;}
.lp-sub-card{padding:.9rem 1rem;background:var(--lp-surface);border:1px solid var(--lp-border);border-radius:var(--lp-radius);font-size:.83rem;transition:transform var(--lp-transition),border-color var(--lp-transition);}
.lp-sub-card:hover{transform:translateY(-3px);border-color:rgba(240,192,64,.3);}
.lp-sub-card b{display:block;font-size:.9rem;font-weight:600;margin-bottom:.18rem;}
.lp-sub-card span{color:var(--lp-text-mute);}
.lp-pane-switch{display:flex;gap:.2rem;padding:.2rem;background:var(--lp-surface);border:1px solid var(--lp-border);border-radius:99px;}
.lp-pane-switch__btn{padding:.38rem .85rem;border-radius:99px;border:0;background:transparent;color:var(--lp-text-dim);cursor:pointer;font-weight:500;font-size:.82rem;transition:all var(--lp-transition);}
.lp-pane-switch__btn.lp-active{background:var(--lp-grad-brand);color:#1a1000;}
.lp-wizard-mini{display:flex;gap:.3rem;flex-wrap:wrap;}
.lp-wz{font-size:.74rem;padding:.36rem .72rem;border-radius:99px;background:var(--lp-surface);border:1px solid var(--lp-border);color:var(--lp-text-mute);}
.lp-wz.lp-active{background:var(--lp-grad-brand);color:#1a1000;border-color:transparent;}

/* Corporate */
.lp-split-2{display:grid;grid-template-columns:1.15fr .85fr;gap:1.65rem;}
.lp-wizard__steps{display:grid;grid-template-columns:repeat(4,1fr);gap:.38rem;margin-bottom:1.15rem;}
.lp-step-ind{display:flex;align-items:center;gap:.45rem;padding:.42rem .6rem;border-radius:11px;background:var(--lp-surface);border:1px solid var(--lp-border);font-size:.76rem;}
.lp-step-ind.lp-done{background:rgba(74,222,128,.12);color:#4ade80;border-color:transparent;}
.lp-step-ind.lp-active{background:var(--lp-grad-brand);color:#1a1000;border-color:transparent;}
.lp-item{display:grid;grid-template-columns:50px 1fr auto auto;gap:.8rem;align-items:center;padding:.65rem;background:var(--lp-bg-soft);border:1px solid var(--lp-border);border-radius:var(--lp-radius);margin-bottom:.42rem;}
.lp-item__img{width:50px;height:50px;border-radius:13px;display:grid;place-items:center;font-size:1.35rem;flex-shrink:0;}
.lp-item__info b{display:block;font-weight:600;font-size:.88rem;}
.lp-item__info span{font-size:.74rem;color:var(--lp-text-mute);}
.lp-item__q{display:flex;align-items:center;gap:.22rem;padding:2px;background:var(--lp-surface);border:1px solid var(--lp-border);border-radius:99px;}
.lp-item__q button{width:24px;height:24px;border-radius:50%;border:0;background:var(--lp-surface-2);color:var(--lp-text);cursor:pointer;font-weight:700;}
.lp-item__q button:hover{background:var(--lp-grad-brand);color:#1a1000;}
.lp-item__q i{min-width:18px;text-align:center;font-style:normal;font-weight:600;font-size:.84rem;}
.lp-item__p{font-family:var(--lp-font-display);font-weight:700;color:var(--lp-brand-2);white-space:nowrap;}
.lp-wizard__foot{display:flex;justify-content:space-between;align-items:center;padding:.8rem;margin-top:.6rem;background:var(--lp-surface);border:1px dashed rgba(240,192,64,.2);border-radius:var(--lp-radius);flex-wrap:wrap;gap:.45rem;}
.lp-cp-side{display:flex;flex-direction:column;gap:.95rem;}
.lp-cp-card{padding:1.15rem;background:var(--lp-bg-elev);border:1px solid var(--lp-border);border-radius:var(--lp-radius-lg);}
.lp-cp-card h4{font-family:var(--lp-font-sans);font-weight:600;margin-bottom:.85rem;}
.lp-cp-kpis{display:grid;grid-template-columns:repeat(2,1fr);gap:.6rem;margin-bottom:1rem;}
.lp-cp-kpis>div{padding:.65rem;background:var(--lp-surface);border:1px solid var(--lp-border);border-radius:var(--lp-radius-sm);}
.lp-cp-kpis b{font-family:var(--lp-font-display);font-size:1.35rem;display:block;color:var(--lp-brand-2);}
.lp-cp-kpis span{color:var(--lp-text-mute);font-size:.74rem;}
.lp-cal__head{font-size:.82rem;font-weight:600;margin-bottom:.42rem;color:var(--lp-text-dim);}
.lp-cal__grid{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;font-size:.74rem;}
.lp-cal__grid>span{text-align:center;color:var(--lp-text-mute);font-size:.66rem;font-weight:600;padding:3px 0;}
.lp-cal__grid>i{aspect-ratio:1;display:grid;place-items:center;border-radius:7px;font-style:normal;color:var(--lp-text-dim);position:relative;background:var(--lp-surface);}
.lp-cal__grid>i.lp-today{background:var(--lp-grad-brand);color:#1a1000;font-weight:700;}
.lp-cal__grid>i.lp-has-b::after{content:"";position:absolute;bottom:3px;left:50%;transform:translateX(-50%);width:4px;height:4px;border-radius:50%;background:var(--lp-brand-2);}
.lp-cal__grid>i.lp-has-a::before{content:"";position:absolute;bottom:3px;left:calc(50% - 6px);width:4px;height:4px;border-radius:50%;background:#4ade80;}
.lp-cal__legend{font-size:.72rem;color:var(--lp-text-mute);margin-top:.42rem;display:flex;gap:.6rem;align-items:center;}
.lp-dotx{width:8px;height:8px;border-radius:50%;display:inline-block;}
.lp-dotx-b{background:var(--lp-brand-2);}.lp-dotx-a{background:#4ade80;}
.lp-cp-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:.58rem;}

/* Steps workflow */
.lp-steps-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.15rem;}
.lp-step-card{padding:1.65rem 1.35rem;background:var(--lp-bg-elev);border:1px solid var(--lp-border);border-radius:var(--lp-radius-lg);position:relative;transition:transform var(--lp-transition),border-color var(--lp-transition);}
.lp-step-card:hover{transform:translateY(-5px);border-color:rgba(240,192,64,.3);}
.lp-step-card .lp-step-num{font-family:var(--lp-font-display);font-size:2.5rem;line-height:1;background:var(--lp-grad-brand);-webkit-background-clip:text;background-clip:text;color:transparent;font-weight:800;}
.lp-step-card h4{font-family:var(--lp-font-sans);font-weight:600;margin:.4rem 0;font-size:1.02rem;}
.lp-step-card p{color:var(--lp-text-dim);margin:0;font-size:.87rem;}

/* CTA */
.lp-cta-simple{display:flex;flex-direction:column;align-items:center;text-align:center;padding:3.5rem 2rem;background:var(--lp-bg-elev);border:1px solid rgba(240,192,64,.2);border-radius:var(--lp-radius-xl);box-shadow:var(--lp-shadow-lg);position:relative;overflow:hidden;}
.lp-cta-simple::before{content:"";position:absolute;top:-120px;right:-120px;width:380px;height:380px;background:rgba(240,192,64,.15);filter:blur(80px);border-radius:50%;}
.lp-cta-simple::after{content:"";position:absolute;bottom:-80px;left:-80px;width:280px;height:280px;background:rgba(74,222,128,.12);filter:blur(60px);border-radius:50%;}
.lp-cta-simple>*{position:relative;z-index:1;}
.lp-cta__buttons{display:flex;gap:.85rem;flex-wrap:wrap;justify-content:center;margin:1.85rem 0 1.4rem;}
.lp-cta__ticks{list-style:none;padding:0;margin:0;display:flex;flex-wrap:wrap;gap:.4rem 1.35rem;justify-content:center;color:var(--lp-text-dim);font-size:.88rem;}
.lp-cta__ticks li::before{content:"✓ ";color:var(--lp-success);font-weight:700;}

/* Footer */
.lp-foot{background:var(--lp-bg-soft);border-top:1px solid var(--lp-border);padding:52px 0 20px;margin-top:36px;}
.lp-foot__grid{display:grid;grid-template-columns:1.4fr 1fr 1fr 1.3fr;gap:2.25rem;}
.lp-foot__grid h5{font-family:var(--lp-font-sans);font-weight:600;margin:.4rem 0 .7rem;font-size:.88rem;}
.lp-foot__grid a{display:block;color:var(--lp-text-dim);font-size:.85rem;margin-bottom:.38rem;cursor:pointer;}
.lp-foot__grid a:hover{color:var(--lp-brand-2);}
.lp-foot__p{color:var(--lp-text-dim);font-size:.85rem;max-width:34ch;margin-top:.55rem;}
.lp-foot__nl{display:flex;flex-wrap:wrap;gap:.45rem;}
.lp-foot__nl input{flex:1;min-width:0;padding:.58rem .78rem;background:var(--lp-bg);border:1px solid var(--lp-border);border-radius:99px;color:var(--lp-text);}
.lp-foot__nl small{color:var(--lp-success);font-size:.78rem;flex-basis:100%;}
.lp-foot__bar{width:min(var(--lp-container),calc(100% - 32px));margin:34px auto 0;padding-top:18px;border-top:1px solid var(--lp-border);display:flex;justify-content:space-between;flex-wrap:wrap;gap:.45rem;color:var(--lp-text-mute);font-size:.78rem;}

/* Reveal animation */
.lp-reveal{opacity:0;transform:translateY(22px);transition:opacity .8s ease,transform .8s ease;}
.lp-reveal.lp-in{opacity:1;transform:none;}

/* Responsive */
@media(max-width:1100px){
  .lp-hero__inner{grid-template-columns:1fr;text-align:center;}
  .lp-hero__copy{max-width:100%;}
  .lp-hero__visual{height:360px;order:-1;}
  .lp-hero__cta{justify-content:center;}
  .lp-hero__chips{justify-content:center;}
  .lp-split-2{grid-template-columns:1fr;}
  .lp-platform-grid{grid-template-columns:repeat(2,1fr);}
  .lp-steps-grid{grid-template-columns:repeat(2,1fr);}
  .lp-foot__grid{grid-template-columns:repeat(2,1fr);}
  .lp-mock__kpis{grid-template-columns:repeat(2,1fr);}
  .lp-mock__split{grid-template-columns:1fr;}
}
@media(max-width:860px){
  .lp-menu-btn{display:block;}
  .lp-nav__links{display:none;}
  .lp-nav__tools .lp-desktop-btn{display:none;}
  .lp-hero{padding:98px 0 38px;}
  .lp-hero__visual{height:300px;}
  .lp-hero__stats{grid-template-columns:repeat(2,1fr);}
  .lp-section{padding:68px 0;}
  .lp-mock__layout{grid-template-columns:1fr;}
  .lp-mock__side{display:flex;flex-wrap:wrap;gap:.18rem;border-right:0;border-bottom:1px solid var(--lp-border);padding:.6rem;}
  .lp-wizard__steps{grid-template-columns:repeat(2,1fr);}
}
@media(max-width:600px){
  .lp-platform-grid{grid-template-columns:1fr;}
  .lp-steps-grid{grid-template-columns:1fr;}
  .lp-cp-grid{grid-template-columns:1fr;}
  .lp-modules-grid{grid-template-columns:1fr;}
  .lp-foot__grid{grid-template-columns:1fr;gap:1.35rem;}
  .lp-hero__stats{grid-template-columns:repeat(2,1fr);}
  .lp-hero__cta{flex-direction:column;align-items:stretch;}
  .lp-hero__cta .lp-btn{justify-content:center;width:100%;}
  .lp-cta__buttons{flex-direction:column;align-items:stretch;}
  .lp-cta__buttons .lp-btn{justify-content:center;}
}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none !important;transition:none !important;}}
`;

// ── Inject styles at module load time to eliminate flash of unstyled content ──
if (typeof document !== 'undefined') {
  let _lpStyle = document.getElementById('lp-global-css');
  if (!_lpStyle) {
    _lpStyle = document.createElement('style');
    _lpStyle.id = 'lp-global-css';
    document.head.appendChild(_lpStyle);
  }
  _lpStyle.textContent = GLOBAL_CSS;
}


const MODULES = [
  { id: "M01", cat: "platform", ico: "🔐", title: "Authentication & Access Control", desc: "Multi-user for Admin & Corporate, role-based permissions, module-level visibility." },
  { id: "M02", cat: "people", ico: "📝", title: "Corporate Registration & Onboarding", desc: "Self-service registration, KYC, approval workflow, account status management." },
  { id: "M03", cat: "ops", ico: "📊", title: "Corporate Dashboard", desc: "At-a-glance metrics, celebration calendar, upcoming orders." },
  { id: "M04", cat: "people", ico: "👥", title: "Staff Management", desc: "CRUD, bulk Excel/CSV upload, export, archive/disable/hold, tile + list views, filters, pagination." },
  { id: "M05", cat: "ops", ico: "🧁", title: "Product Catalog", desc: "Categories, products, combos, add-ons, variants, pricing tiers." },
  { id: "M06", cat: "ops", ico: "📦", title: "Order Management", desc: "Placement, processing, tracking, remarks, recurring orders, bulk orders." },
  { id: "M07", cat: "ops", ico: "🚚", title: "Delivery Management", desc: "Zones, time slots, rider assignment, mark-as-delivered with proof." },
  { id: "M08", cat: "platform", ico: "📣", title: "Notification & Communication", desc: "Editable templates, 2-day pre-delivery alerts, email log, automated triggers." },
  { id: "M09", cat: "finance", ico: "💳", title: "Payment & Invoicing", desc: "Credit accounts, payment gateway, invoice generation, refunds, tax." },
  { id: "M10", cat: "finance", ico: "📈", title: "Reporting & Analytics", desc: "Admin + corporate reports, date filters, export, charts." },
  { id: "M11", cat: "ops", ico: "🧭", title: "Admin Dashboard", desc: "Real-time ops view, pending actions, delivery map." },
  { id: "M12", cat: "platform", ico: "🛡️", title: "Login & Activity Logs", desc: "IP/device login log, activity audit trail, suspicious-activity detection." },
  { id: "M13", cat: "platform", ico: "🔄", title: "Data Import & Export", desc: "Excel/CSV import with validation, bulk export, import history." },
  { id: "M14", cat: "platform", ico: "⚙️", title: "System Configuration", desc: "Global settings, order/delivery/payment/notification configs." },
  { id: "M15", cat: "people", ico: "🎂", title: "Occasion & Calendar", desc: "Birthday/anniversary auto-detection, celebration calendar, auto-order suggestions." },
  { id: "M16", cat: "ops", ico: "⭐", title: "Feedback & Ratings", desc: "Post-delivery ratings, reviews, analytics." },
  { id: "M17", cat: "finance", ico: "🎟️", title: "Discounts & Promotions", desc: "Coupons, corporate-specific pricing, volume discounts, loyalty." },
  { id: "M18", cat: "ops", ico: "🎧", title: "Support & Tickets", desc: "Helpdesk tickets, SLA, escalation, knowledge base." },
  { id: "M19", cat: "ops", ico: "🌾", title: "Inventory & Stock", desc: "Raw materials, stock alerts, supplier management, production planning." },
  { id: "M20", cat: "platform", ico: "🔔", title: "Notification Preferences", desc: "Channel preferences, opt-in/opt-out, quiet hours." },
  { id: "M21", cat: "platform", ico: "🎨", title: "UI/UX Framework Standards", desc: "Tile/list toggle, pagination, date filters, bulk actions, responsive design." },
];

function useLandingStyles() {
  useEffect(() => {
    let el = document.getElementById("lp-global-css");
    if (!el) {
      el = document.createElement("style");
      el.id = "lp-global-css";
      document.head.appendChild(el);
    }
    el.textContent = GLOBAL_CSS;

    document.documentElement.setAttribute("data-lp", "1");
    const root = document.getElementById("root");
    if (root) root.setAttribute("data-lp", "1");

    let ov = document.getElementById("lp-overflow-fix");
    if (!ov) {
      ov = document.createElement("style");
      ov.id = "lp-overflow-fix";
      ov.textContent = `
        html[data-lp="1"],
        body[data-lp="1"],
        #root[data-lp="1"] { overflow: auto !important; height: auto !important; }
        html[data-lp="1"], body { height: auto !important; }
      `;
      document.head.appendChild(ov);
    }
    document.body.setAttribute("data-lp", "1");

    return () => {
      document.documentElement.removeAttribute("data-lp");
      document.body.removeAttribute("data-lp");
      const root2 = document.getElementById("root");
      if (root2) root2.removeAttribute("data-lp");
      document.getElementById("lp-global-css")?.remove();
      document.getElementById("lp-overflow-fix")?.remove();
    };
  }, []);
}

function useLandingReveal(rootRef) {
  useEffect(() => {
    if (!rootRef.current) return;
    const els = rootRef.current.querySelectorAll(".lp-reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach(el => el.classList.add("lp-in"));
      return;
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("lp-in"); io.unobserve(e.target); } });
    }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  });
}

function lpScrollTo(id, containerRef) {
  const el = containerRef?.current?.querySelector(id) || document.querySelector(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - 70;
  window.scrollTo({ top, behavior: "smooth" });
}

// ── Sub-components ──

function LPNavbar({ theme, toggleTheme, onLogin, onRegister, containerRef }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [["#lp-platform", "Platform"], ["#lp-modules", "Modules"], ["#lp-admin", "Admin Portal"], ["#lp-corporate", "Corporate Portal"], ["#lp-workflow", "Workflow"], ["#lp-contact", "Contact"]];

  return (
    <header className={`lp-nav${scrolled ? " lp-scrolled" : ""}`}>
      <div className="lp-nav__inner">
        <a className="lp-brand" onClick={() => lpScrollTo("#lp-home", containerRef)}>
          <span className="lp-brand__mark">
            <svg viewBox="0 0 40 40" width="34" height="34">
              <defs><linearGradient id="lpg1" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#f0c040" /><stop offset="1" stopColor="#d4a030" /></linearGradient></defs>
              <rect width="40" height="40" rx="10" fill="url(#lpg1)" />
              <text x="20" y="27" textAnchor="middle" fontSize="18" fill="#1a1000" fontWeight="700">🎂</text>
            </svg>
          </span>
          <span className="lp-brand__name">B2B Corporate Bakery</span>
        </a>
        <div className="lp-nav__links">
          {links.map(([href, label]) => (
            <a key={href} onClick={() => lpScrollTo(href, containerRef)}>{label}</a>
          ))}
        </div>
        <div className="lp-nav__tools">
          <button className="lp-icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "dark"
              ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round" /></svg>
              : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
            }
          </button>
          <button className="lp-btn lp-btn-ghost lp-desktop-btn" onClick={onLogin} style={{ fontSize: ".85rem", padding: ".6rem 1.1rem" }}>Login →</button>
          <button className="lp-btn lp-btn-primary lp-desktop-btn" onClick={onRegister} style={{ fontSize: ".85rem", padding: ".6rem 1.1rem", marginLeft: "6px" }}>Free Trial 🚀</button>
        </div>
      </div>
    </header>
  );
}

function LPHero({ onLogin, onRegister }) {
  const sceneRef = useRef(null);
  const heroRef = useRef(null);
  useEffect(() => {
    const hero = heroRef.current;
    const scene = sceneRef.current;
    if (!hero || !scene || !window.matchMedia("(hover: hover)").matches) return;
    let rect = hero.getBoundingClientRect();
    const resize = () => (rect = hero.getBoundingClientRect());
    window.addEventListener("resize", resize);
    const move = (e) => {
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      scene.style.transform = `rotateX(${8 - y * 10}deg) rotateY(${-8 + x * 14}deg)`;
    };
    const leave = () => (scene.style.transform = "");
    hero.addEventListener("mousemove", move);
    hero.addEventListener("mouseleave", leave);
    return () => { window.removeEventListener("resize", resize); hero.removeEventListener("mousemove", move); hero.removeEventListener("mouseleave", leave); };
  }, []);

  return (
    <section className="lp-hero" id="lp-home" ref={heroRef}>
      <div className="lp-hero__bg">
        <div className="lp-blob lp-blob-a" /><div className="lp-blob lp-blob-b" /><div className="lp-blob lp-blob-c" />
        <div className="lp-grid-overlay" />
      </div>
      <div className="lp-hero__inner">
        <div className="lp-hero__copy lp-reveal">
          <span className="lp-eyebrow">🥐 B2B Corporate Bakery Platform</span>
          <h1 className="lp-h1">Turn every <span className="lp-grad">birthday, anniversary</span> and team milestone into a <span className="lp-grad-green">delivered</span>, invoiced gift.</h1>
          <p className="lp-lede">B2B Corporate Bakery Platform orchestrates staff celebrations, recurring bulk orders, delivery routing, invoicing and analytics across 21 integrated modules — with an <strong>Admin Portal</strong> for your ops and a <strong>Corporate Portal</strong> for your clients.</p>
          <div className="lp-hero__cta">
            <button className="lp-btn lp-btn-primary" onClick={onRegister}>Start Free Trial 🚀</button>
            <button className="lp-btn lp-btn-outline" onClick={onLogin}>Login to Portal →</button>
          </div>
          <ul className="lp-hero__chips">
            <li>✦ 2-day pre-delivery alerts</li>
            <li>✦ Role-based multi-user access</li>
            <li>✦ Excel / CSV bulk import</li>
            <li>✦ Tile + list views everywhere</li>
          </ul>
        </div>
        <div className="lp-hero__visual">
          <div className="lp-scene" ref={sceneRef}>
            <div className="lp-ring lp-ring-1" /><div className="lp-ring lp-ring-2" /><div className="lp-ring lp-ring-3" />
            <div className="lp-cake">
              <div className="lp-cake__layer lp-cake__layer-bottom" />
              <div className="lp-cake__layer lp-cake__layer-middle" />
              <div className="lp-cake__layer lp-cake__layer-top" />
              <div className="lp-cake__candle"><span className="lp-flame" /></div>
              <div className="lp-cake__plate" />
            </div>
            <div className="lp-floatcard lp-floatcard-1">
              <div className="lp-floatcard__ico">🎂</div>
              <div><b>42 birthdays this week</b><span>Auto-suggested orders ready</span></div>
            </div>
            <div className="lp-floatcard lp-floatcard-2">
              <div className="lp-floatcard__ico">🚚</div>
              <div><b>Delivery · 11:30 AM</b><span>Rider Arjun · Zone 4</span></div>
            </div>
            <div className="lp-floatcard lp-floatcard-3">
              <div className="lp-floatcard__ico">📄</div>
              <div><b>Invoice #INV-2841</b><span>Paid · ₹ 18,450</span></div>
            </div>
            <div className="lp-sparkle lp-sparkle-a" /><div className="lp-sparkle lp-sparkle-b" /><div className="lp-sparkle lp-sparkle-c" />
          </div>
        </div>
      </div>
      <div className="lp-hero__stats">
        {[["21", "Integrated modules"], ["2", "Portals · Admin + Corporate"], ["4-step", "Bulk order wizard"], ["100%", "Responsive · Desktop · Tablet · Mobile"]].map(([b, s]) => (
          <div key={s}><b>{b}</b><span>{s}</span></div>
        ))}
      </div>
    </section>
  );
}

function LPPlatform({ containerRef }) {
  return (
    <section className="lp-section" id="lp-platform">
      <div className="lp-container">
        <header className="lp-sec-head lp-reveal">
          <span className="lp-eyebrow">Platform overview</span>
          <h2 className="lp-h2">One platform. Two portals. Every celebration delivered on time.</h2>
          <p className="lp-sub">From KYC onboarding to rider proof-of-delivery, B2B Corporate Bakery connects your bakery operations to every corporate client you serve.</p>
        </header>
        <div className="lp-platform-grid">
          {[
            { ico: "🏢", title: "For Corporates", desc: "Self-onboard, maintain staff celebrations, place bulk orders, view invoices and manage internal users — all with role-level visibility.", link: "#lp-corporate", cta: "Corporate Portal →" },
            { ico: "🛠️", title: "For Admin / Bakery", desc: "Real-time operations view, pending actions, delivery map, invoice reconciliation, template editor and full audit trail.", link: "#lp-admin", cta: "Admin Portal →" },
            { ico: "📐", title: "UX Standards", desc: "Tile/list toggle on every list, from-to date filters, bulk actions, pagination, responsive layouts. Consistency across all 21 modules.", link: "#lp-workflow", cta: "UX Framework →" },
          ].map(p => (
            <article key={p.title} className="lp-pill lp-reveal">
              <div className="lp-pill__ico">{p.ico}</div>
              <h3>{p.title}</h3>
              <p>{p.desc}</p>
              <a className="lp-link-brand" onClick={() => lpScrollTo(p.link, containerRef)}>{p.cta}</a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function LPModules() {
  const [filter, setFilter] = useState("all");
  const filters = [["all", "All 21"], ["ops", "Operations"], ["people", "People"], ["finance", "Finance"], ["platform", "Platform"]];
  return (
    <section className="lp-section lp-section-alt" id="lp-modules">
      <div className="lp-container">
        <header className="lp-sec-head lp-reveal">
          <span className="lp-eyebrow">Business Requirements · 21 modules</span>
          <h2 className="lp-h2">The complete module map</h2>
          <p className="lp-sub">Every capability defined in the BRD — from authentication to inventory — is shipped out-of-the-box and integrated end-to-end.</p>
        </header>
        <div className="lp-mod-filter">
          {filters.map(([val, label]) => (
            <button key={val} className={`lp-chip${filter === val ? " lp-active" : ""}`} onClick={() => setFilter(val)}>{label}</button>
          ))}
        </div>
        <div className="lp-modules-grid">
          {MODULES.filter(m => filter === "all" || m.cat === filter).map(m => (
            <article key={m.id} className="lp-mod lp-reveal">
              <span className="lp-mod__tag">{m.id}</span>
              <div className="lp-mod__ico">{m.ico}</div>
              <h3>{m.title}</h3>
              <p>{m.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function LPAdmin() {
  const [view, setView] = useState("tile");
  return (
    <section className="lp-section" id="lp-admin">
      <div className="lp-container">
        <header className="lp-sec-head-split lp-reveal" style={{ marginBottom: "52px" }}>
          <div>
            <span className="lp-eyebrow">Admin Portal · 10 modules</span>
            <h2 className="lp-h2">Run your bakery operations from one cockpit.</h2>
            <p className="lp-sub" style={{ marginInline: 0 }}>Dashboard, corporates, products, orders, delivery, invoices, templates, logs and user management — all connected.</p>
          </div>
          <div className="lp-pane-switch">
            {["tile", "list"].map(v => (
              <button key={v} className={`lp-pane-switch__btn${view === v ? " lp-active" : ""}`} onClick={() => setView(v)}>
                {v === "tile" ? "⊞ Tile" : "☰ List"}
              </button>
            ))}
          </div>
        </header>
        <div className="lp-mock lp-reveal">
          <div className="lp-mock__chrome">
            <span className="lp-dot lp-dot-r" /><span className="lp-dot lp-dot-y" /><span className="lp-dot lp-dot-g" />
            <span className="lp-mock__url">b2bcorporatebakery.app / admin</span>
          </div>
          <div className="lp-mock__layout">
            <aside className="lp-mock__side">
              <div className="lp-mock__brand">🎁 Admin</div>
              {["📊 Dashboard", "🏢 Corporates", "🧁 Products", "📦 Orders", "🚚 Delivery", "💳 Invoices", "✉️ Templates", "📧 Email Log", "🛡️ Login Log", "👤 Admin Users"].map((n, i) => (
                <a key={n} className={`lp-mock__nav${i === 0 ? " lp-active" : ""}`}>{n}</a>
              ))}
            </aside>
            <div className="lp-mock__body">
              <div className="lp-mock__kpis">
                {[["Today's orders", "184", "▲ 12%", "lp-up"], ["Pending delivery", "37", "▼ 3%", "lp-down"], ["Unpaid invoices", "₹ 2.4L", "▲ 8%", "lp-up"], ["Active corporates", "126", "▲ 4", "lp-up"]].map(([s, b, em, cls]) => (
                  <div key={s} className="lp-kpi"><span>{s}</span><b>{b}</b><em className={cls}>{em}</em></div>
                ))}
              </div>
              <div className="lp-mock__split">
                <div className="lp-panel">
                  <div className="lp-panel__head"><b>Upcoming deliveries</b><small>Next 48h</small></div>
                  <ul className="lp-tl">
                    {[["09:30", "Acme Corp · 25 cupcakes", "Dispatched", "lp-tl__b-blue"], ["10:15", "Nimbus Ltd · Anniversary combo", "Ready", "lp-tl__b-amber"], ["11:30", "Northwind · Birthday cake x4", "Out for delivery", "lp-tl__b-green"], ["14:00", "Globex · Festival hampers", "Ready", "lp-tl__b-amber"]].map(([t, n, s, cls]) => (
                      <li key={t}><span className="lp-tl__t">{t}</span><span>{n}</span><span className={`lp-tl__b ${cls}`}>{s}</span></li>
                    ))}
                  </ul>
                </div>
                <div className="lp-panel">
                  <div className="lp-panel__head"><b>Pre-delivery alerts</b><small>T-2 days</small></div>
                  {[["🎂", "Priya Sharma · Acme", "Birthday on 22 Apr · auto-order drafted"], ["💍", "Rahul & team · Nimbus", "Work anniversary · 22 Apr"], ["🎉", "Northwind quarterly", "Festival hamper run · 22 Apr"]].map(([ico, b, s]) => (
                    <div key={b} className="lp-alert">
                      <div className="lp-alert__ico">{ico}</div>
                      <div className="lp-alert__t"><b>{b}</b><span>{s}</span></div>
                      <button className="lp-btn-xs">Notify</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="lp-card-row">
          {[["📊 Dashboard", "Real-time stats, recent orders, upcoming delivery notifications."], ["🏢 Corporates", "CRUD with tile/list, pagination, filters, status management."], ["🧁 Products", "SKU, pricing tiers, stock status, CSV import/export."], ["📦 Orders", "Status & date filters, detail modal, 2-day alert sender."], ["🚚 Delivery", "Delivery schedule with mark-as-delivered."], ["💳 Invoices", "Payment tracking, PDF download, email send."], ["✉️ Templates", "Editable email templates with dynamic placeholders."], ["📧 Email Log", "Full log with resend for failed emails."], ["🛡️ Login Log", "IP, device, location & status tracking."], ["👤 Admin Users", "Module-level visibility control."]].map(([b, s]) => (
            <div key={b} className="lp-sub-card lp-reveal"><b>{b}</b><span>{s}</span></div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LPCorporate() {
  const [qty, setQty] = useState([3, 2, 1]);
  const items = [
    { ico: "🎂", bg: "linear-gradient(135deg,#f5d060,#e8b84b)", title: "Classic Birthday Cake · 1 kg", sub: "Vanilla · sugar-free option", price: 750 },
    { ico: "🧁", bg: "linear-gradient(135deg,#60a5fa,#3b82f6)", title: "Assorted Cupcakes · Box of 12", sub: "Team-share combo", price: 590 },
    { ico: "🍫", bg: "linear-gradient(135deg,#4ade80,#22c55e)", title: "Anniversary Truffle · 500 g", sub: "Gluten-free add-on available", price: 980 },
  ];
  const total = items.reduce((acc, it, i) => acc + it.price * qty[i], 0);
  const change = (i, delta) => setQty(q => q.map((v, j) => j === i ? Math.max(0, v + delta) : v));
  const calRows = [
    ["30","31","1","2","3","4","5"],
    ["6","7",{n:"8",b:true},"9","10",{n:"11",a:true},"12"],
    ["13","14","15",{n:"16",b:true},"17","18","19"],
    [{n:"20",today:true},"21",{n:"22",b:true,a:true},"23","24","25","26"],
    ["27","28","29","30","1","2","3"],
  ];
  return (
    <section className="lp-section lp-section-alt" id="lp-corporate">
      <div className="lp-container">
        <header className="lp-sec-head-split lp-reveal" style={{ marginBottom: "52px" }}>
          <div>
            <span className="lp-eyebrow">Corporate Portal · 6 modules</span>
            <h2 className="lp-h2">Everything your clients need to celebrate their people.</h2>
            <p className="lp-sub" style={{ marginInline: 0 }}>A polished self-service experience where HR and admin teams place bulk orders, track deliveries and manage invoices.</p>
          </div>
          <div className="lp-wizard-mini">
            {["1 · Staff", "2 · Items", "3 · Delivery", "4 · Review"].map((w, i) => (
              <span key={w} className={`lp-wz${i === 1 ? " lp-active" : ""}`}>{w}</span>
            ))}
          </div>
        </header>
        <div className="lp-split-2">
          <div className="lp-mock lp-reveal">
            <div className="lp-mock__chrome">
              <span className="lp-dot lp-dot-r" /><span className="lp-dot lp-dot-y" /><span className="lp-dot lp-dot-g" />
              <span className="lp-mock__url">acme.b2cbakery.app / place-order</span>
            </div>
            <div style={{ padding: "1.2rem" }}>
              <div className="lp-wizard__steps">
                {[["1","Select Staff","lp-done"],["2","Choose Items","lp-active"],["3","Delivery Details",""],["4","Review & Confirm",""]].map(([n,s,cls]) => (
                  <div key={n} className={`lp-step-ind${cls ? " "+cls : ""}`}>{n}<span style={{ fontSize: ".68rem", marginLeft: "4px" }}>{s}</span></div>
                ))}
              </div>
              {items.map((it, i) => (
                <div key={it.title} className="lp-item">
                  <div className="lp-item__img" style={{ background: it.bg }}>{it.ico}</div>
                  <div className="lp-item__info"><b>{it.title}</b><span>{it.sub}</span></div>
                  <div className="lp-item__q">
                    <button onClick={() => change(i, -1)}>−</button>
                    <i>{qty[i]}</i>
                    <button onClick={() => change(i, +1)}>+</button>
                  </div>
                  <div className="lp-item__p">₹ {(it.price * qty[i]).toLocaleString()}</div>
                </div>
              ))}
              <div className="lp-wizard__foot">
                <span style={{ fontSize: ".8rem", color: "var(--lp-text-dim)" }}>📝 Remarks: "Candle + card for Priya — no nuts"</span>
                <b style={{ fontSize: "1.08rem", color: "var(--lp-brand-2)" }}>Subtotal · ₹ {total.toLocaleString()}</b>
              </div>
            </div>
          </div>
          <div className="lp-cp-side lp-reveal">
            <div className="lp-cp-card">
              <h4>📊 Corporate Dashboard</h4>
              <div className="lp-cp-kpis">
                {[["248","Staff"],["14","Active orders"],["42","Upcoming birthdays"],["7","Anniversaries"]].map(([b,s]) => (
                  <div key={s}><b>{b}</b><span>{s}</span></div>
                ))}
              </div>
              <div className="lp-cal__head">April · celebration calendar</div>
              <div className="lp-cal__grid">
                {["S","M","T","W","T","F","S"].map((d,i) => <span key={i}>{d}</span>)}
                {calRows.flat().map((cell, i) => {
                  if (typeof cell === "string") return <i key={i}>{cell}</i>;
                  const cls = [cell.today?"lp-today":"",cell.b?"lp-has-b":"",cell.a?"lp-has-a":""].filter(Boolean).join(" ");
                  return <i key={i} className={cls}>{cell.n}</i>;
                })}
              </div>
              <div className="lp-cal__legend">
                <span className="lp-dotx lp-dotx-b" /> Birthday&nbsp;&nbsp;
                <span className="lp-dotx lp-dotx-a" /> Anniversary
              </div>
            </div>
            <div className="lp-cp-grid">
              {[["👥 Staff Management","Bulk upload, tile/list, dept filters, hold/archive."],["🛒 Place Order","4-step wizard with remarks."],["📦 My Orders","History with live tracking."],["🧾 Invoices","View, download, pay online."],["👤 Manage Users","Role-based module visibility."],["🎂 Occasions","Auto-detect + auto-suggest orders."]].map(([b,s]) => (
                <div key={b} className="lp-sub-card"><b>{b}</b><span>{s}</span></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LPWorkflow() {
  return (
    <section className="lp-section" id="lp-workflow">
      <div className="lp-container">
        <header className="lp-sec-head lp-reveal">
          <span className="lp-eyebrow">UX framework · M21 applied everywhere</span>
          <h2 className="lp-h2">Consistent interactions across every module</h2>
          <p className="lp-sub">Because every list, filter, and bulk action behaves the same, your teams learn B2B Corporate Bakery once — and use it everywhere.</p>
        </header>
        <div className="lp-steps-grid">
          {[["01","Tile / list toggle","Every list view switches between dense list and visual tile without losing state."],["02","From-to date filters","Unified date range control on dashboards, reports, orders, invoices & logs."],["03","Bulk actions","Select many rows; archive, export, tag, notify or send — without page reloads."],["04","Pagination + search","Server-side paginated, sortable, deep-searchable lists across all 21 modules."],["05","Responsive everywhere","Desktop cockpit collapses to a clean tablet layout and touch-friendly mobile cards."],["06","Light & dark theme","One toggle, persisted per user. All charts, tables and states are theme-aware."]].map(([n,h,p]) => (
            <div key={n} className="lp-step-card lp-reveal">
              <span className="lp-step-num">{n}</span>
              <h4>{h}</h4>
              <p>{p}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LPPricing({ onRegister }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_BASE + '/public/plans')
      .then(r => r.json())
      .then(d => { setPlans(d.data?.subscriptions || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function formatCur(n) { return '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 }); }
  function formatQ(v) { return (v === null || v === undefined) ? 'Unlimited' : v; }

  if (!loading && plans.length === 0) return null;

  return (
    <section className="lp-section" id="lp-pricing" style={{ background: 'var(--lp-bg-soft)' }}>
      <div className="lp-container">
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span className="lp-eyebrow">Transparent Pricing</span>
          <h2 className="lp-h2">Choose the right plan for your bakery</h2>
          <p className="lp-sub">Scale from a small bakery to a multi-city operation. All plans include both Admin &amp; Corporate portals.</p>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--lp-text-mute)' }}>Loading plans…</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
            {plans.map(p => {
              const popular = (p.name || '').toLowerCase() === 'professional';
              return (
                <div key={p._id} style={{
                  background: 'var(--lp-bg-elev)',
                  border: popular ? '2px solid rgba(240,192,64,.5)' : '1px solid var(--lp-border)',
                  borderRadius: 'var(--lp-radius)',
                  overflow: 'hidden',
                  boxShadow: popular ? '0 0 40px rgba(240,192,64,.12)' : 'var(--lp-shadow-sm)',
                  display: 'flex', flexDirection: 'column',
                }}>
                  {popular && (
                    <div style={{ background: 'var(--lp-grad-brand)', color: '#1a1000', textAlign: 'center', padding: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                      ✦ Most Popular
                    </div>
                  )}
                  <div style={{ padding: '1.75rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>{p.name}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '0.75rem 0 1.25rem' }}>
                      <span style={{ fontSize: '2.25rem', fontWeight: 800, fontFamily: 'var(--lp-font-display)', color: 'var(--lp-brand-2)' }}>{formatCur(p.price)}</span>
                      <span style={{ color: 'var(--lp-text-dim)', fontSize: '0.9rem' }}>/{p.billingCycle === 'yearly' ? 'yr' : 'mo'}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem', fontSize: '0.82rem', color: 'var(--lp-text-dim)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Max Corporates</span><strong style={{ color: 'var(--lp-text)' }}>{formatQ(p.maxCorporates)}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Max Staff per Corp</span><strong style={{ color: 'var(--lp-text)' }}>{formatQ(p.maxStaffPerCorporate)}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Max Orders</span><strong style={{ color: 'var(--lp-text)' }}>{formatQ(p.maxOrders)}</strong></div>
                    </div>
                    {(p.features || []).length > 0 && (
                      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
                        {p.features.map(f => (
                          <li key={f} style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ color: '#4ade80', fontWeight: 700 }}>✓</span>
                            {f}
                          </li>
                        ))}
                      </ul>
                    )}
                    <button
                      className={popular ? 'lp-btn lp-btn-primary' : 'lp-btn lp-btn-outline'}
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={onRegister}
                    >
                      Get Started
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function LPCTA({ onLogin, onRegister }) {
  return (
    <section className="lp-section" id="lp-contact">
      <div className="lp-container">
        <div className="lp-cta-simple lp-reveal">
          <span className="lp-eyebrow">Ready when you are</span>
          <h2 className="lp-h2">Launch your B2B Corporate Bakery Platform<br />in weeks, not quarters.</h2>
          <p className="lp-sub">21 integrated modules. Admin + Corporate portals. From KYC onboarding to rider proof-of-delivery — everything your bakery needs to scale corporate gifting.</p>
          <div className="lp-cta__buttons">
            <button className="lp-btn lp-btn-primary" onClick={onRegister}>Start Free Trial 🚀</button>
            <button className="lp-btn lp-btn-outline" onClick={onLogin}>Login to Portal →</button>
          </div>
          <ul className="lp-cta__ticks">
            <li>Guided implementation &amp; data migration</li>
            <li>Custom corporate pricing tiers</li>
            <li>White-glove training for admin + corporate teams</li>
            <li>No credit card required to start</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function LPFooter({ containerRef }) {
  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState("");
  return (
    <footer className="lp-foot">
      <div className="lp-container lp-foot__grid">
        <div>
          <a className="lp-brand" onClick={() => lpScrollTo("#lp-home", containerRef)}>
            <span className="lp-brand__mark">
              <svg viewBox="0 0 40 40" width="34" height="34">
                <defs><linearGradient id="lpg2" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#f0c040" /><stop offset="1" stopColor="#d4a030" /></linearGradient></defs>
                <rect width="40" height="40" rx="10" fill="url(#lpg2)" />
                <text x="20" y="27" textAnchor="middle" fontSize="18" fill="#1a1000" fontWeight="700">🎂</text>
              </svg>
            </span>
            <span className="lp-brand__name">B2B Corporate Bakery</span>
          </a>
          <p className="lp-foot__p">21 modules, 2 portals, zero missed celebrations.</p>
        </div>
        <div>
          <h5>Platform</h5>
          {[["#lp-modules","Modules"],["#lp-admin","Admin Portal"],["#lp-corporate","Corporate Portal"],["#lp-workflow","UX framework"]].map(([h,l]) => (
            <a key={h} onClick={() => lpScrollTo(h, containerRef)}>{l}</a>
          ))}
        </div>
        <div>
          <h5>Company</h5>
          {["Contact","Careers","Press","Partners"].map(l => <a key={l} href="#">{l}</a>)}
        </div>
        <div>
          <h5>Stay in the loop</h5>
          <div className="lp-foot__nl">
            <input type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} />
            <button className="lp-btn lp-btn-primary" onClick={() => { if (email) { setSubscribed(true); setEmail(""); } }}>Subscribe</button>
            {subscribed && <small>✓ Subscribed.</small>}
          </div>
        </div>
      </div>
      <div className="lp-foot__bar">
        <span>© 2026 B2B Corporate Bakery Platform Technologies. All rights reserved.</span>
        <span>Made with 🎁 for corporates that care.</span>
      </div>
    </footer>
  );
}

// ── Main LandingPage export ──

export default function LandingPage({ onLogin, onRegister }) {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('theme') || 'dark'; } catch { return 'dark'; }
  });
  const rootRef = useRef(null);

  useLandingStyles();
  useLandingReveal(rootRef);

  const toggleTheme = () => {
    setTheme(t => {
      const next = t === "dark" ? "light" : "dark";
      try { localStorage.setItem('theme', next); } catch {}
      return next;
    });
  };

  return (
    <div ref={rootRef} className={`lp-root lp-${theme}`}>
      <LPNavbar theme={theme} toggleTheme={toggleTheme} onLogin={onLogin} onRegister={onRegister} containerRef={rootRef} />
      <LPHero onLogin={onLogin} onRegister={onRegister} />
      <LPPlatform containerRef={rootRef} />
      <LPModules />
      <LPAdmin />
      <LPCorporate />
      <LPWorkflow />
      <LPPricing onRegister={onRegister} />
      <LPCTA onLogin={onLogin} onRegister={onRegister} />
      <LPFooter containerRef={rootRef} />
    </div>
  );
}