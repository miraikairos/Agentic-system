<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Pivot — the AI that adapts when the plan fails</title>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@500;700;800&family=Instrument+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>
:root{--bg:#0d1119;--panel:#141a26;--line:#243049;--tx:#e8ecf5;--mut:#8b97b0;--acc:#8b9bff;--ok:#3ddbb0;--warn:#ffb84d;--bad:#ff6b6b;color-scheme:dark;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
html{scroll-behavior:smooth;scroll-padding-top:70px}
*{box-sizing:border-box;margin:0}
body{background:var(--bg);color:var(--tx);font:15px/1.55 'Instrument Sans',system-ui,sans-serif;overflow-x:hidden}
h1,h2,h3,.num{font-family:'Bricolage Grotesque','Instrument Sans',sans-serif;letter-spacing:-.02em}
nav{position:sticky;top:env(safe-area-inset-top,0px);z-index:9;display:flex;justify-content:space-between;align-items:center;padding:14px 5vw;background:rgba(13,17,25,.75);backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}
nav b{font:800 20px 'Bricolage Grotesque',sans-serif}nav a{color:var(--mut);text-decoration:none;margin-left:22px}
.btn{background:var(--acc);color:#0d1119;border:0;border-radius:10px;padding:12px 22px;font:600 15px inherit;font-family:inherit;cursor:pointer;transition:transform .15s,box-shadow .15s}
.btn:hover{transform:translateY(-2px);box-shadow:0 8px 30px rgba(139,155,255,.35)}
.btn.ghost{background:transparent;color:var(--tx);border:1px solid var(--line)}
:focus-visible{outline:2px solid var(--acc);outline-offset:3px}
.hero{display:grid;grid-template-columns:1fr 1.15fr;gap:40px;align-items:center;min-height:86vh;padding:6vh 5vw;position:relative}
.hero:before{content:"";position:absolute;inset:0;background:radial-gradient(600px 400px at 75% 40%,rgba(139,155,255,.14),transparent),linear-gradient(var(--line) 1px,transparent 1px) 0 0/100% 56px;opacity:.35;mask-image:radial-gradient(ellipse at 60% 50%,#000,transparent 75%);-webkit-mask-image:radial-gradient(ellipse at 60% 50%,#000,transparent 75%);pointer-events:none}
.hero>*{position:relative}
h1{font-size:clamp(40px,6vw,76px);line-height:1;font-weight:800}
.hero p{color:var(--mut);font-size:18px;max-width:46ch;margin:22px 0 30px}
.row{display:flex;gap:12px;flex-wrap:wrap}
.viz{position:relative;background:linear-gradient(160deg,rgba(20,26,38,.9),rgba(13,17,25,.9));border:1px solid var(--line);border-radius:18px;padding:18px}
.viz svg{width:100%;height:auto;display:block}
.viz .cap{display:flex;justify-content:space-between;color:var(--mut);font-size:13px;margin-top:6px}
#planL{stroke-dasharray:6 6}
#actL{stroke-dasharray:420;stroke-dashoffset:420;animation:act 9s infinite}
#newL{stroke-dasharray:420;stroke-dashoffset:420;animation:nw 9s infinite}
#flag{opacity:0;animation:fl 9s infinite}
#goal{opacity:.25;animation:gl 9s infinite}
#cap1{animation:c1 9s infinite}#cap2{animation:c2 9s infinite}
@keyframes act{0%{stroke-dashoffset:420}35%,100%{stroke-dashoffset:0}}
@keyframes fl{0%,34%{opacity:0;transform:scale(.6)}40%,62%{opacity:1;transform:scale(1)}70%,100%{opacity:0}}
@keyframes nw{0%,48%{stroke-dashoffset:420}80%,100%{stroke-dashoffset:0}}
@keyframes gl{0%,78%{opacity:.25}85%,100%{opacity:1}}
@keyframes c1{0%,45%{opacity:1}50%,100%{opacity:0}}@keyframes c2{0%,48%{opacity:0}55%,100%{opacity:1}}
section{padding:80px 5vw}
.sec h2{font-size:clamp(28px,4vw,44px);margin-bottom:10px}
.sec>p{color:var(--mut);max-width:60ch;margin-bottom:34px}
.loop{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1px;background:var(--line);border:1px solid var(--line);border-radius:14px;overflow:hidden}
.loop div{background:var(--panel);padding:18px}.loop b{display:block;margin-bottom:4px}.loop span{color:var(--mut);font-size:13px}
.loop .hl{background:#1d1a26}.loop .hl b{color:var(--warn)}
/* dashboard */
.cc{border:1px solid var(--line);border-radius:20px;background:var(--panel);overflow:hidden}
.top{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;padding:16px 20px;border-bottom:1px solid var(--line)}
.dot{display:inline-block;width:9px;height:9px;border-radius:50%;background:var(--ok);margin-right:8px;box-shadow:0 0 0 0 var(--ok);animation:pu 1.8s infinite}
@keyframes pu{70%{box-shadow:0 0 0 8px transparent}}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));border-bottom:1px solid var(--line)}
.kpis div{padding:16px 20px;border-right:1px solid var(--line)}.kpis small{color:var(--mut)}.kpis .num{font-size:26px;font-weight:700;display:block;transition:color .4s}
.grid{display:grid;grid-template-columns:1.3fr 1fr}
.pane{padding:20px;border-right:1px solid var(--line);min-width:0}.pane:last-child{border:0}
.pane h3{font-size:17px;margin-bottom:12px}
.fun{display:flex;gap:6px;margin-bottom:18px}.fun div{flex:1;background:#1a2132;border-radius:8px;padding:10px;text-align:center;opacity:.35;transition:.5s}
.fun div.on{opacity:1;background:#232c47}.fun .num{font-size:24px;font-weight:700;display:block}.fun small{color:var(--mut);font-size:12px}
.tw{overflow-x:auto}table{width:100%;border-collapse:collapse;font-size:14px}
th,td{padding:8px 10px;text-align:right;border-bottom:1px solid var(--line);white-space:nowrap}th:first-child,td:first-child{text-align:left}th{color:var(--mut);font-weight:500}
tr.sel td{background:rgba(139,155,255,.14)}tr.sel td:first-child{box-shadow:inset 3px 0 var(--acc)}tr.out{opacity:.45}
.w{color:var(--mut);font-size:13px;margin:10px 0}
.t{margin-bottom:12px}.t .h{display:flex;justify-content:space-between;font-size:14px}.t .h span:last-child{color:var(--mut)}
.bar{position:relative;height:8px;background:#1a2132;border-radius:4px;margin-top:5px}.bar i{position:absolute;left:0;top:0;bottom:0;border-radius:4px;transition:width 1s}
.bar .p{background:#3a4770;opacity:.8}.bar .a{height:4px;top:2px;background:var(--ok)}.bar .a.late{background:var(--bad)}
.alert{border:1px solid var(--bad);background:rgba(255,107,107,.1);border-radius:12px;padding:14px;margin-bottom:14px;display:none}
.alert.show{display:block;animation:sh .5s}@keyframes sh{20%{transform:translateX(-5px)}40%{transform:translateX(5px)}60%{transform:translateX(-3px)}}
.alert.good{border-color:var(--ok);background:rgba(61,219,176,.1);animation:none}
.log{list-style:none;padding:0;font-size:14px;max-height:230px;overflow:auto}
.log li{padding:6px 0 6px 14px;border-left:2px solid var(--line);color:var(--mut)}.log li b{color:var(--tx);font-weight:500}.log li.k{border-color:var(--warn)}.log li.g{border-color:var(--ok)}
.fin{display:none;gap:24px;align-items:center;padding:24px;border-top:1px solid var(--line);flex-wrap:wrap}.fin.show{display:flex}
.ring{--v:0;width:120px;height:120px;border-radius:50%;background:conic-gradient(var(--ok) calc(var(--v)*1%),#1a2132 0);display:grid;place-items:center;flex:none}
.ring b{width:92px;height:92px;border-radius:50%;background:var(--panel);display:grid;place-items:center;font:700 28px 'Bricolage Grotesque'}
.fin ul{list-style:none;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:6px 24px;flex:1}.fin li{color:var(--mut)}.fin li b{color:var(--tx)}
.form{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:20px}
.form label{display:block;color:var(--mut);font-size:13px}.form input,.form select{width:100%;margin-top:4px;background:var(--panel);border:1px solid var(--line);color:var(--tx);border-radius:10px;padding:10px;font:inherit}
.form .g{grid-column:1/-1}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}.lb{color:var(--mut);font-size:13px}
.chips button{background:var(--panel);color:var(--mut);border:1px solid var(--line);border-radius:999px;padding:7px 14px;font:inherit;cursor:pointer;transition:.2s}
.chips button[aria-pressed=true]{background:rgba(139,155,255,.16);border-color:var(--acc);color:var(--tx)}
.ins{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));border-top:1px solid var(--line)}
.card{padding:20px;border-right:1px solid var(--line);min-width:0}.card:last-child{border:0}.card h3{font-size:17px;margin-bottom:10px}
.dn{display:flex;gap:14px;align-items:center}.lg{list-style:none;padding:0;font-size:13px;color:var(--mut)}.lg i{display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:6px}
.sb{display:grid;grid-template-columns:104px 1fr 30px;gap:8px;align-items:center;font-size:13px;margin-bottom:9px}.sb .bar{margin:0}.sb i{background:var(--acc)}.sb.top i{background:var(--ok)}
#bg{position:fixed;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none}
.prog{position:fixed;top:0;left:0;height:3px;width:0;background:linear-gradient(90deg,var(--acc),var(--ok));z-index:20}
nav{transition:padding .3s,background .3s}nav.sm{padding-top:8px;padding-bottom:8px;background:rgba(13,17,25,.94)}
.viz{transform-style:preserve-3d;transition:transform .15s ease-out;will-change:transform}
.glare{position:absolute;inset:0;border-radius:18px;pointer-events:none;background:radial-gradient(320px circle at var(--gx,50%) var(--gy,0%),rgba(255,255,255,.09),transparent 60%)}
.fl{position:absolute;transform:translateZ(70px);background:rgba(20,26,38,.95);border:1px solid var(--line);border-radius:10px;padding:6px 12px;font-size:12px;z-index:2;animation:fy 5s ease-in-out infinite}
@keyframes fy{50%{margin-top:-8px}}
.spot{position:relative;overflow:hidden}.spot:before{content:"";position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .3s;background:radial-gradient(240px circle at var(--mx,50%) var(--my,50%),rgba(139,155,255,.13),transparent 70%)}.spot:hover:before{opacity:1}
.loop div{border-top:3px solid transparent;transition:background .5s,border-color .5s,transform .25s}.loop div:hover{transform:translateY(-3px)}
.loop div.on{border-top-color:var(--acc);background:#1a2132}.loop .hl.on{border-top-color:var(--warn)}
.btn{position:relative;overflow:hidden}.btn.ghost:hover{border-color:var(--acc)}.btn:active{filter:brightness(.92)}
.rp{position:absolute;border-radius:50%;background:rgba(255,255,255,.4);transform:scale(0);animation:rp .6s ease-out forwards;pointer-events:none}@keyframes rp{to{transform:scale(2.6);opacity:0}}
.chips button:hover{border-color:var(--acc);transform:translateY(-2px)}.chips button:active{transform:scale(.93)}
tbody tr{transition:background .2s}tbody tr:hover td{background:rgba(255,255,255,.05)}
.bar{transition:transform .2s}.t:hover .bar{transform:scaleY(1.7)}.sb:hover b{color:var(--acc)}
.log li{animation:li .4s ease-out}@keyframes li{from{opacity:0;transform:translateX(-12px)}}
.pop{animation:po .5s}@keyframes po{40%{transform:scale(1.12);color:var(--acc)}}
.stp{display:flex;gap:6px;padding:10px 20px;border-bottom:1px solid var(--line);overflow-x:auto}
.stp span{padding:4px 12px;border-radius:99px;font-size:12px;color:var(--mut);border:1px solid var(--line);white-space:nowrap;transition:.4s}
.stp .d{color:var(--ok);border-color:rgba(61,219,176,.4)}.stp .c{background:var(--acc);color:#0d1119;border-color:var(--acc);box-shadow:0 0 18px rgba(139,155,255,.4)}
footer{padding:40px 5vw;color:var(--mut);border-top:1px solid var(--line);text-align:center}
@media(max-width:860px){.hero,.grid{grid-template-columns:1fr}.pane{border-right:0;border-bottom:1px solid var(--line)}nav a{display:none}}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}#actL,#newL{stroke-dashoffset:0}#goal,#flag{opacity:1}}

/* ===== layout v2: separated cards, real spacing ===== */
:root{--gap:16px;--rad:18px;--edge:max(5vw,calc((100vw - 1200px)/2));--panel2:#10151f;--lift:inset 0 1px 0 rgba(255,255,255,.045),0 14px 34px -18px rgba(0,0,0,.65)}
nav,nav.sm{position:sticky;top:calc(12px + env(safe-area-inset-top,0px));width:min(1200px,calc(100% - 24px));margin:12px auto 0;padding:10px 10px 10px 20px;border:1px solid var(--line);border-radius:16px;background:rgba(20,26,38,.78);box-shadow:var(--lift)}
.hero{padding-left:var(--edge);padding-right:var(--edge);gap:56px}
section{padding:96px var(--edge) 24px}
.sec h2{margin-bottom:12px}.sec>p{margin-bottom:40px}
#demo{padding-bottom:96px}
footer{margin-top:40px}
/* loop: six separate, numbered steps (it is a real sequence) */
.loop{gap:14px;background:none;border:0;border-radius:0;overflow:visible;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));counter-reset:s}
.loop>div{position:relative;border:1px solid var(--line);border-top:3px solid var(--line);border-radius:var(--rad);padding:22px 20px 24px;box-shadow:var(--lift);min-height:128px}
.loop>div::after{counter-increment:s;content:counter(s);position:absolute;top:16px;right:18px;font:600 12px 'Instrument Sans',sans-serif;color:var(--mut)}
.loop b{font:700 17px 'Bricolage Grotesque',sans-serif;margin-bottom:8px}
.loop span{display:block;line-height:1.45}
/* setup form lives in its own card */
.panel{background:var(--panel);border:1px solid var(--line);border-radius:var(--rad);padding:24px;box-shadow:var(--lift);margin-bottom:var(--gap)}
.panel .form{margin-bottom:18px;gap:16px}
.form input,.form select{background:var(--panel2);margin-top:6px}
.panel .chips{margin-top:8px}
/* command center: stack of separate cards */
.cc{display:grid;gap:var(--gap);border:0;background:none;border-radius:0;overflow:visible}
.top,.stp,.pane,.card,.fin,.kpis>div{background:var(--panel);border:1px solid var(--line);border-radius:var(--rad);box-shadow:var(--lift)}
.top{padding:16px 22px}
.stp{padding:12px 16px;gap:8px}
.kpis{border:0;gap:var(--gap);grid-template-columns:repeat(auto-fit,minmax(150px,1fr))}
.kpis>div{padding:18px 20px;display:grid;gap:6px;align-content:start}
.grid{gap:var(--gap);grid-template-columns:1.3fr 1fr}
.grid>.pane{padding:24px;border:1px solid var(--line)}
.pane h3,.card h3{margin-bottom:14px}
.fun{margin-bottom:20px}
.fun div{border:1px solid transparent}.fun div.on{border-color:var(--line)}
.alert{margin-bottom:18px}
.t{padding:12px 14px;background:var(--panel2);border:1px solid var(--line);border-radius:12px;margin-bottom:10px}
.pane>h3:not(:first-child){margin-top:26px!important}
.log li{margin-bottom:2px}
.ins{border:0;gap:var(--gap);grid-template-columns:repeat(auto-fit,minmax(280px,1fr))}
.ins>.card{padding:24px;border:1px solid var(--line)}
.fin{padding:26px 28px;gap:32px}
@media(max-width:860px){.grid{grid-template-columns:1fr}.grid>.pane{border:1px solid var(--line)}section{padding-top:64px}.hero{gap:36px}nav a{display:none}}

/* ===== v3 additions ===== */
.bd{display:inline-block;font:600 11px 'Instrument Sans',sans-serif;padding:1px 8px;border-radius:99px;vertical-align:middle;margin-left:6px;border:1px solid var(--line);color:var(--mut)}
.bd.m{color:var(--ok);border-color:rgba(61,219,176,.45);background:rgba(61,219,176,.08)}.bd.e{color:var(--warn);border-color:rgba(255,184,77,.45);background:rgba(255,184,77,.08)}
.ctl{align-items:center}.ctl select{background:var(--panel2);color:var(--tx);border:1px solid var(--line);border-radius:10px;padding:11px 12px;font:inherit}
.legend{display:flex;flex-wrap:wrap;gap:6px 18px;align-items:center;margin:16px 0 0;color:var(--mut);font-size:13px}.legend .bd{margin:0 6px 0 0}
.chain{display:grid;gap:8px;margin-top:12px}.chain>div{padding:8px 12px;border-left:3px solid var(--bad);background:rgba(0,0,0,.2);border-radius:0 10px 10px 0;font-size:14px}
.chain>div:nth-child(2){margin-left:12px;border-color:var(--warn)}.chain>div:nth-child(3){margin-left:24px;border-color:var(--acc)}.chain small{display:block;color:var(--mut)}
.sw{display:none;grid-template-columns:1fr auto 1fr;gap:24px;align-items:center;padding:28px;border:1px solid rgba(61,219,176,.5);border-radius:var(--rad);background:linear-gradient(110deg,rgba(255,107,107,.08),rgba(61,219,176,.12));box-shadow:var(--lift)}
.sw.show{display:grid;animation:swin .7s}@keyframes swin{from{opacity:0;transform:scale(.97)}}
.swc small{display:block;color:var(--mut)}.swc b{display:block;font:800 clamp(22px,3vw,34px) 'Bricolage Grotesque',sans-serif;margin:4px 0}.swc .hrs{font:700 20px 'Bricolage Grotesque',sans-serif}
.swc.old b{text-decoration:line-through;color:var(--mut)}.swc.old .hrs{color:var(--bad)}.swc.new .hrs{color:var(--ok)}
.ar{width:84px;color:var(--ok)}.sw.show .ar path{stroke-dasharray:120;stroke-dashoffset:120;animation:dr .8s .3s forwards}@keyframes dr{to{stroke-dashoffset:0}}
.sw>p{grid-column:1/-1;color:var(--mut)}
.two{display:grid;grid-template-columns:1.3fr 1fr;gap:var(--gap)}.two>.card{padding:24px;border:1px solid var(--line)}
.wh{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;margin-bottom:12px}.wh b{font:800 22px 'Bricolage Grotesque',sans-serif}.wh .sc{margin-left:auto;color:var(--ok);font-weight:600}
#whyb ul{list-style:none;padding:0;margin:0 0 6px;display:grid;gap:6px;font-size:14px}#whyb li:before{content:"✓";color:var(--ok);margin-right:8px}#whyb li.rk:before{content:"!";color:var(--warn)}
#whyb h4{font:600 13px 'Instrument Sans',sans-serif;color:var(--mut);margin:16px 0 6px}#whyb summary{cursor:pointer;padding:5px 0;font-size:14px}#whyb details p{color:var(--mut);font-size:13px;margin:0 0 6px 16px}
.sl{display:grid;grid-template-columns:64px 1fr 40px;gap:10px;align-items:center;font-size:13px;margin-bottom:8px}.sl input{width:100%;accent-color:var(--acc)}.sl b{text-align:right;font-weight:500;color:var(--mut)}
#wir{margin-top:16px}
.rep{display:none}.rep.show{display:block;padding:26px 28px;background:var(--panel);border:1px solid var(--line);border-radius:var(--rad);box-shadow:var(--lift)}
.rep dl{display:grid;grid-template-columns:150px 1fr;gap:12px 24px;margin:16px 0 20px}.rep dt{color:var(--mut)}.rep dd{margin:0}
#ts{position:fixed;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));display:grid;gap:8px;z-index:40;pointer-events:none}
.toast{background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--ok);border-radius:12px;padding:10px 14px;max-width:320px;font-size:14px;box-shadow:var(--lift);animation:li .4s}.toast.k{border-left-color:var(--warn)}
@media(max-width:860px){.two,.sw{grid-template-columns:1fr}.ar{transform:rotate(90deg);margin:0 auto}.rep dl{grid-template-columns:1fr;gap:2px}.rep dd{margin-bottom:10px}}
@media(prefers-reduced-motion:reduce){.sw.show .ar path{stroke-dashoffset:0}}
@media print{body *{visibility:hidden}#rep,#rep *{visibility:visible!important}#rep{position:absolute;left:0;top:0;width:100%;background:#fff!important;color:#111;border:0}#rep .row{display:none}#rep dt{color:#555}}

/* ===== six numbered insight cards ===== */
@property --v{syntax:'<number>';inherits:false;initial-value:0}
.six{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:var(--gap)}
.ic{background:var(--panel);border:1px solid var(--line);border-radius:var(--rad);padding:22px;box-shadow:var(--lift);min-width:0;display:flex;flex-direction:column;gap:12px}
.ic>header{display:flex;align-items:center;gap:10px}.ic h3{font-size:17px;margin:0;flex:1}
.ic .n{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font:700 14px 'Bricolage Grotesque',sans-serif;color:#0d1119;background:var(--c);flex:none}
#c1{--c:#8b9bff}#c2{--c:#c58bff}#c3{--c:#ffb84d}#c4{--c:#ff7aa8}#c5{--c:#6bc7ff}#c6{--c:#3ddbb0}
.st{font:600 11px 'Instrument Sans',sans-serif;padding:3px 10px;border-radius:99px;border:1px solid var(--line);color:var(--mut);white-space:nowrap}
.st.ok{color:var(--ok);border-color:rgba(61,219,176,.45);background:rgba(61,219,176,.08)}.st.wr{color:var(--warn);border-color:rgba(255,184,77,.45);background:rgba(255,184,77,.08)}
.ic h4{font:600 13px 'Instrument Sans',sans-serif;color:var(--mut);margin:4px 0 0}.ic p{font-size:14px;margin:0}
.ic ul.pl{list-style:none;padding:0;margin:0;font-size:14px;color:var(--mut)}
.q{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.qc,.obj,.tiles>div,.mini{background:var(--panel2);border:1px solid var(--line);border-radius:12px;padding:12px;min-width:0}
.qc{border-top:3px solid var(--k)}.qc.rd{--k:var(--bad)}.qc.bl{--k:var(--acc)}.qc.or{--k:var(--warn)}.qc.gn{--k:var(--ok)}.qc h4{margin:0 0 6px;color:var(--tx)}
.obj small,.tiles small,.ea small{display:block;color:var(--mut);font-size:12px}
.tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.tiles b{font:700 17px 'Bricolage Grotesque',sans-serif;display:block}
.ph{list-style:none;padding:0;margin:0;display:grid;gap:6px;font-size:14px}.ph li{display:flex;gap:10px;align-items:center;padding:7px 10px;background:var(--panel2);border-radius:10px}
.ph i{font:600 12px 'Instrument Sans';font-style:normal;width:22px;height:22px;border-radius:50%;background:#2a2440;color:#c58bff;display:grid;place-items:center;flex:none}.ph span{flex:1}.ph em{color:var(--mut);font-style:normal}
.exr{display:flex;gap:16px;align-items:center}
.pr,.dr{width:104px;height:104px;transition:--v .9s}.pr b,.dr b{width:80px;height:80px;font-size:22px}.dr{background:conic-gradient(var(--bad) calc(var(--v)*1%),#1a2132 0)}
.kv{display:grid;gap:8px;flex:1;font-size:14px}.kv div{display:flex;justify-content:space-between;gap:8px}.kv dt{color:var(--mut)}.kv dd{margin:0;font-weight:600}
.mini b{display:block;font-size:14px}.mini span{color:var(--mut);font-size:13px}
.ea{display:grid;grid-template-columns:1fr 1fr;gap:8px}.ea>div{border-radius:12px;padding:12px;background:rgba(139,155,255,.1)}.ea>div+div{background:rgba(255,107,107,.12)}.ea b{font:700 22px 'Bricolage Grotesque',sans-serif}
.ob{list-style:none;padding:0;margin:4px 0 0;font-size:13px;color:var(--mut);display:grid;gap:4px}.ob b{color:var(--tx);font-weight:500}
.tg{display:inline-block;font-size:12px;font-weight:600;padding:2px 10px;border-radius:99px;background:rgba(255,255,255,.06)}.tg.bad{color:var(--bad);background:rgba(255,107,107,.12)}.tg.wr{color:var(--warn);background:rgba(255,184,77,.12)}.tg.ok{color:var(--ok);background:rgba(61,219,176,.1)}
#b5 .chain{margin-top:0}.dec{border-radius:12px;padding:12px 14px;background:rgba(61,219,176,.1);border:1px solid rgba(61,219,176,.35)}.dec small{display:block;color:var(--mut)}.dec b{font:800 20px 'Bricolage Grotesque',sans-serif}.dec span{display:block;color:var(--ok)}
.pc{margin:2px 0 0;padding-left:20px;font-size:14px;color:var(--mut)}
@media(max-width:560px){.q,.tiles,.ea{grid-template-columns:1fr}}

/* ===== spacing + overflow fixes ===== */
.ic>div[id^=b]{display:grid;gap:12px;align-content:start;min-width:0}
.ic h4{margin:8px 0 -6px}.ic .qc h4{margin:0 0 6px}
.ic p,.ic li,.ic b{overflow-wrap:anywhere}
.ic .mini{display:grid;gap:3px}
.tiles>div{display:grid;gap:4px;align-content:start}
.tiles.rows{grid-template-columns:1fr}.tiles.rows>div{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 12px}
.tiles.rows small{margin:0}.tiles.rows b{font:600 14px 'Instrument Sans',sans-serif}
.exr>div:last-child{min-width:0;flex:1}
.ea>div{min-width:0}
.ob li{overflow-wrap:anywhere}
.chain>div{min-width:0;overflow-wrap:anywhere}
.six{align-items:stretch}
.ic{transition:border-color .25s}.ic:hover{border-color:#34436a}
.st{transition:color .3s,background .3s,border-color .3s}

/* ===== hero + funnel overlap fixes ===== */
.viz{padding-bottom:38px}
.viz .cap{display:grid;grid-template-columns:1fr;gap:4px;justify-content:stretch}
#cap1,#cap2{grid-row:2;grid-column:1}
.fl{white-space:nowrap}
.fun{flex-wrap:wrap}.fun div{flex:1 1 72px;min-width:0}
.top>div{min-width:0}.top .w{display:inline}
@media(max-width:560px){.six{grid-template-columns:1fr}.ic{padding:18px}.fl{font-size:11px;padding:5px 10px}.viz{padding:14px 14px 38px}}

/* ===== orbit theme: graphite glass, blue-to-pink glow, tile grid ===== */
:root{--bg:#15161a;--panel:#1b1c21;--panel2:#16171b;--line:rgba(255,255,255,.085);--tx:#ececf1;--mut:#9b9da8;--acc:#7aa2ff;--blue:#3b82f6;--pink:#ec2a8f;--rad:20px}
#bg{display:none}
body{background:var(--bg)}
body:before{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;background:radial-gradient(900px 520px at 70% -8%,rgba(59,130,246,.16),transparent 70%),radial-gradient(900px 520px at 20% 108%,rgba(236,42,143,.12),transparent 70%),url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='176' height='176'%3E%3Crect x='8' y='8' width='160' height='160' rx='30' fill='none' stroke='white' stroke-opacity='.055'/%3E%3C/svg%3E") 0 0/176px 176px}
.hero:before{display:none}
nav{background:rgba(21,22,26,.72)}
.prog{background:linear-gradient(90deg,var(--blue),var(--pink))}
.btn{background:#eef0f6;color:#15161a;border-radius:12px}
.btn:hover{box-shadow:0 0 0 1px rgba(255,255,255,.4),0 10px 34px -6px rgba(59,130,246,.55),0 14px 40px -10px rgba(236,42,143,.5)}
.btn.ghost{background:rgba(255,255,255,.03);color:var(--tx);border:1px solid rgba(255,255,255,.14)}
:focus-visible{outline-color:var(--blue)}
/* hero: glowing browser frame */
.viz{padding:58px 20px 40px;border:2px solid transparent;border-radius:28px;background:linear-gradient(#1b1c21,#1b1c21) padding-box,linear-gradient(180deg,var(--blue),#a65cf0 55%,var(--pink)) border-box;box-shadow:0 -30px 90px -40px rgba(59,130,246,.65),0 40px 100px -30px rgba(236,42,143,.6)}
.viz:before{content:"";position:absolute;left:20px;top:20px;width:60px;height:12px;background:radial-gradient(circle at 6px 6px,#3a3b43 5.5px,transparent 6px),radial-gradient(circle at 30px 6px,#3a3b43 5.5px,transparent 6px),radial-gradient(circle at 54px 6px,#3a3b43 5.5px,transparent 6px)}
.viz:after{content:"pivot.app / launch-plan";position:absolute;left:96px;right:20px;top:12px;height:28px;line-height:28px;text-align:center;font-size:13px;color:var(--mut);background:rgba(255,255,255,.045);border:1px solid var(--line);border-radius:10px}
.viz svg{background:rgba(255,255,255,.025);border:1px solid var(--line);border-radius:16px}
.viz svg g[stroke]{stroke:rgba(255,255,255,.1)}
.nd{position:absolute;width:56px;height:56px;border-radius:50%;display:grid;place-items:center;z-index:3;color:#dcdde5;background:linear-gradient(180deg,rgba(236,42,143,.3),rgba(59,130,246,.3));border:1px solid rgba(255,255,255,.22);backdrop-filter:blur(8px);box-shadow:inset 0 1px 0 rgba(255,255,255,.28),0 14px 30px -10px rgba(0,0,0,.7);animation:fy 6s ease-in-out infinite}
.nd svg{width:24px;height:24px;background:none;border:0;border-radius:0}
.nd:after{content:"";position:absolute;top:50%;width:46px;border-top:1px dashed rgba(255,255,255,.25)}
.nd.l{left:-30px;top:30%}.nd.l:after{right:100%}
.nd.r{right:-30px;top:60%;animation-delay:-3s}.nd.r:after{left:100%}
/* surfaces */
.ic,.cc,.rep.show,.two>.card,.toast,.t,.loop div{background:linear-gradient(180deg,rgba(255,255,255,.035),transparent 45%),var(--panel)}
.loop{background:var(--line);border-radius:var(--rad)}
.loop .hl{background:linear-gradient(180deg,rgba(236,42,143,.10),transparent),var(--panel)}
.cc{border-radius:24px;box-shadow:0 -24px 80px -50px rgba(59,130,246,.7),0 30px 90px -50px rgba(236,42,143,.6)}
.ic:hover{border-color:rgba(122,162,255,.4);box-shadow:var(--lift),0 0 44px -20px rgba(236,42,143,.55)}
.bar,.fun div,.dr{background-color:rgba(255,255,255,.07)}
.fun div.on{background:rgba(122,162,255,.16)}
tr.sel td{background:rgba(122,162,255,.12)}
@media(max-width:860px){.nd{display:none}}
@media(prefers-reduced-motion:reduce){.nd{animation:none}}

/* ===== LIGHT variant of the orbit theme ===== */
:root{--bg:#f3f4f8;--panel:#ffffff;--panel2:#f6f7fb;--line:rgba(24,28,52,.10);--tx:#14161f;--mut:#5d6174;--acc:#3b6cf0;--ok:#0d9b74;--warn:#b76800;--bad:#d4344a;--lift:inset 0 1px 0 #fff,0 14px 34px -22px rgba(40,50,110,.30);color-scheme:light}
body:before{background:radial-gradient(900px 520px at 70% -8%,rgba(59,130,246,.15),transparent 70%),radial-gradient(900px 520px at 18% 108%,rgba(236,42,143,.11),transparent 70%),url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='176' height='176'%3E%3Crect x='8' y='8' width='160' height='160' rx='30' fill='none' stroke='%2314182f' stroke-opacity='.075'/%3E%3C/svg%3E") 0 0/176px 176px}
nav{background:rgba(243,244,248,.78)}
.btn{background:#14161f;color:#fff}
.btn:hover{box-shadow:0 10px 34px -8px rgba(59,130,246,.6),0 14px 40px -10px rgba(236,42,143,.5)}
.btn.ghost{background:#fff;color:var(--tx);border:1px solid rgba(24,28,52,.16)}
/* hero frame */
.viz{background:linear-gradient(#fff,#fff) padding-box,linear-gradient(180deg,var(--blue),#a65cf0 55%,var(--pink)) border-box;box-shadow:0 -30px 90px -45px rgba(59,130,246,.55),0 40px 100px -35px rgba(236,42,143,.5)}
.viz:before{background:radial-gradient(circle at 6px 6px,#d3d6e2 5.5px,transparent 6px),radial-gradient(circle at 30px 6px,#d3d6e2 5.5px,transparent 6px),radial-gradient(circle at 54px 6px,#d3d6e2 5.5px,transparent 6px)}
.viz:after{background:rgba(24,28,52,.04)}
.glare{background:radial-gradient(320px circle at var(--gx,50%) var(--gy,0%),rgba(59,130,246,.08),transparent 60%)}
.viz svg{background:linear-gradient(180deg,#f8f9fc,#f1f3f9)}
.viz svg g[stroke]{stroke:rgba(24,28,52,.14)}
.viz svg text[fill="#e8ecf5"]{fill:#14161f}.viz svg text[fill="#8b97b0"]{fill:#5d6174}
.viz svg #planL{stroke:#9aa1b8}
.viz svg [stroke="#ff6b6b"]{stroke:#d4344a}.viz svg [fill="#ff6b6b"]{fill:#d4344a}.viz svg [fill="#3ddbb0"]{fill:#0d9b74}
#g stop:first-child{stop-color:#3b6cf0}#g stop:last-child{stop-color:#0d9b74}
#cap2{color:var(--ok)!important}
.fl{background:rgba(255,255,255,.96);box-shadow:0 8px 24px -10px rgba(40,50,110,.35)}
.nd{color:#3a3e57;background:linear-gradient(180deg,rgba(59,130,246,.18),rgba(236,42,143,.20));border:1px solid rgba(255,255,255,.95);box-shadow:inset 0 1px 0 #fff,0 14px 28px -12px rgba(40,50,110,.4)}
.nd:after{border-top-color:rgba(24,28,52,.32)}
/* surfaces */
.ic,.cc,.rep.show,.two>.card,.toast,.t,.loop div{background:linear-gradient(180deg,#fff,#fbfbfe)}
.loop{background:var(--line)}
.loop div.on{background:#eef2ff}
.loop .hl,.loop .hl.on{background:linear-gradient(180deg,rgba(236,42,143,.08),#fff)}
.cc{box-shadow:0 -24px 80px -55px rgba(59,130,246,.6),0 30px 90px -55px rgba(236,42,143,.5)}
.ic:hover{border-color:rgba(59,108,240,.4);box-shadow:var(--lift),0 0 44px -22px rgba(236,42,143,.5)}
.qc,.obj,.tiles>div,.mini{background:var(--panel2)}
.bar,.fun div{background-color:#e7e9f1}.bar .p{background:#b8c2e6}
.fun div.on{background:#e3e9ff}
tr.sel td{background:rgba(59,108,240,.09)}
.chain>div{background:rgba(24,28,52,.04)}
.ph i{background:#efe6fc;color:#8438d6}
.tg{background:rgba(24,28,52,.06)}
.ring{background:conic-gradient(var(--ok) calc(var(--v)*1%),#e4e7f0 0)}
.dr{background:conic-gradient(var(--bad) calc(var(--v)*1%),#e4e7f0 0)}
.toast{box-shadow:0 14px 34px -14px rgba(40,50,110,.35)}
</style></head><body>
<canvas id="bg"></canvas><canvas id="cf" style="position:fixed;inset:0;width:100%;height:100%;z-index:30;pointer-events:none"></canvas><div class="prog" id="pg"></div><nav><b>Pivot</b><div><a href="#how">How it works</a><a href="#demo">Project board</a><button class="btn" onclick="go()" style="margin-left:22px;padding:8px 16px">Run demo</button></div></nav>

<header class="hero">
<div>
<h1>Plans are easy. Finishing is hard.</h1>
<p>Pivot researches your options, picks one under your real constraints, tracks the plan against reality, and switches strategy the moment the original stops being the best one.</p>
<div class="row"><button class="btn" onclick="go()">Start building</button><a href="#how"><button class="btn ghost">See the loop</button></a></div>
</div>
<div class="viz" aria-label="Animated chart: planned path, drifting actual path, strategy switch, goal reached">
<div class="glare"></div><div class="nd l" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="6"/><path d="m20 20-4.2-4.2"/></svg></div><div class="nd r" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.8"/></svg></div><div class="fl" style="top:-14px;right:18px">23 options, 1 pick</div><div class="fl" style="top:-14px;left:24px;animation-delay:-2s;border-color:#ff6b6b">Drift +115%</div><div class="fl" style="bottom:-14px;right:30px;animation-delay:-3.5s;border-color:#3ddbb0">Strategy switched</div>
<svg viewBox="0 0 520 300" role="img">
<defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#8b9bff"/><stop offset="1" stop-color="#3ddbb0"/></linearGradient></defs>
<g stroke="#243049"><path d="M40 260H500M40 20V260"/></g>
<path id="planL" d="M40 250 C160 220 280 120 470 50" fill="none" stroke="#8b97b0" stroke-width="2"/>
<path id="actL" d="M40 250 C120 235 200 215 290 190" fill="none" stroke="#ff6b6b" stroke-width="3.5" stroke-linecap="round"/>
<path id="newL" d="M290 190 C340 150 400 90 470 50" fill="none" stroke="url(#g)" stroke-width="3.5" stroke-linecap="round"/>
<g id="flag" style="transform-origin:290px 190px"><circle cx="290" cy="190" r="14" fill="none" stroke="#ff6b6b" stroke-width="2"/><circle cx="290" cy="190" r="5" fill="#ff6b6b"/><text x="308" y="214" fill="#ff6b6b" font-size="13">Drift +115%</text></g>
<circle id="goal" cx="470" cy="50" r="9" fill="#3ddbb0"/><text x="436" y="34" fill="#e8ecf5" font-size="13">Goal</text>
<text x="46" y="282" fill="#8b97b0" font-size="12">Day 1</text><text x="455" y="282" fill="#8b97b0" font-size="12">Day 4</text>
</svg>
<div class="cap"><span>Dashed: original plan</span><span id="cap1">Reality is slipping behind the plan</span><span id="cap2" style="color:#3ddbb0">New strategy, same deadline</span></div>
</div>
</header>

<section class="sec" id="how"><h2>One loop, fully visible</h2>
<p>Every step the agent takes is shown with its evidence and confidence. Verified facts, estimates and unknowns are labelled apart.</p>
<div class="loop"><div><b>Research</b><span>Finds and filters candidate solutions</span></div><div><b>Decide</b><span>Scores them on weights from your priorities</span></div><div><b>Plan</b><span>Tasks, estimates and dependencies</span></div><div><b>Monitor</b><span>Planned hours against actual hours</span></div><div class="hl"><b>Diagnose</b><span>Finds the bottleneck and the root cause</span></div><div class="hl"><b>Adapt</b><span>Re-researches, reweights, switches strategy</span></div></div></section>

<section class="sec" id="demo"><h2>Your live project board</h2>
<p>Type your own deadline, budget and resources, choose your experience, then watch the agent plan, slip, and recover. Research, the plan, the diagnosis and the strategy decision come from the live backend; execution progress is simulated.</p>
<div class="panel"><div class="form">
<label class="g">Goal<input id="goalIn" value="" placeholder="Type your goal, e.g. Build a working AI chatbot" autocomplete="off"></label>
<label>Deadline (days)<input id="dl" type="number" min="1" max="90" step="1" value="4" placeholder="e.g. 4" inputmode="numeric"></label>
<label>Budget (₹)<input id="bd" type="number" min="0" step="100" value="0" placeholder="e.g. 0 or 2000" inputmode="numeric"></label>
<label>Experience<select id="ex"><option>Beginner</option><option selected>Intermediate</option><option>Advanced</option></select></label>
<label class="g">Resources you have (separate with commas)<input id="rs" value="Laptop" placeholder="e.g. Laptop, Google Colab, GitHub, a teammate" autocomplete="off"></label>
</div>
<div class="row ctl"><button class="btn" id="run" onclick="go()">Run demo</button><button class="btn ghost" id="ps" onclick="PAUSED=!PAUSED;this.textContent=PAUSED?'Resume':'Pause'">Pause</button><button class="btn ghost" onclick="reset()">Reset</button><select id="sp" aria-label="Demo speed" onchange="SPD=+this.value"><option value="1">Speed 1x</option><option value="2">Speed 2x</option><option value="4">Speed 4x</option></select></div>
<div class="legend"><span><span class="bd m">Measured</span>taken from the run</span><span><span class="bd e">Estimated</span>the agent's projection</span><span><span class="bd">Unknown</span>no evidence yet</span></div></div>

<div class="cc">
<div class="top"><div><b id="pt">Your goal</b> <span class="w" id="tags"></span></div><div id="ai"><span class="dot"></span><span id="stat">Waiting for a goal</span></div></div>
<div class="stp" id="stp"></div>
<div class="kpis">
<div><small>Goal progress</small><span class="num" id="k1">0%</span></div>
<div><small>Time remaining</small><span class="num" id="k2">96h</span></div>
<div><small>Plan health</small><span class="num" id="k3">Not started</span></div>
<div><small>Strategy</small><span class="num" id="k4" style="font-size:20px">None yet</span></div>
<div><small>Confidence<span class="bd e">Estimated</span></small><span class="num" id="k5">-</span></div>
</div>
<div class="six">
<article class="ic" id="c1"><header><span class="n">1</span><h3>Goal analysis</h3><span class="st pe" id="s1">Pending</span></header><div id="b1"></div></article>
<article class="ic" id="c2"><header><span class="n">2</span><h3>Initial plan</h3><span class="st pe" id="s2">Pending</span></header><div id="b2"></div></article>
<article class="ic" id="c3"><header><span class="n">3</span><h3>Execution progress</h3><span class="st pe" id="s3">Pending</span></header>
<div class="exr"><div class="ring pr" id="rg"><b id="rgv">0%</b></div><dl class="kv"><div><dt>Phases done</dt><dd id="x1">0/5</dd></div><div><dt>Hours used</dt><dd id="x2">0h</dd></div><div><dt>Days left</dt><dd id="x3">4 days</dd></div></dl></div>
<h4>Latest finished</h4><div class="mini" id="x4"></div><h4>Up next</h4><div class="mini" id="x5"></div></article>
<article class="ic" id="c4"><header><span class="n">4</span><h3>Reality analysis</h3><span class="st pe" id="s4">Pending</span></header>
<div class="ea"><div><small>Planned</small><b id="r1">-</b></div><div><small>Actual</small><b id="r2">-</b></div></div>
<div class="exr"><div class="ring dr" id="rr"><b id="rrv">0%</b></div><div><span class="tg" id="rsv">No data yet</span><h4>Biggest overruns</h4><ul class="ob" id="r3"></ul></div></div></article>
<article class="ic" id="c5"><header><span class="n">5</span><h3>Diagnosis</h3><span class="st pe" id="s5">Pending</span></header><div id="b5"></div></article>
<article class="ic" id="c6"><header><span class="n">6</span><h3>Adaptation decision</h3><span class="st pe" id="s6">Pending</span></header><div id="b6"></div></article>
</div>
<div class="grid">
<div class="pane">
<h3>Research and decision</h3>
<div class="fun" id="fun"><div><span class="num">0</span><small>Discovered</small></div><div><span class="num">0</span><small>Eliminated</small></div><div><span class="num">0</span><small>Viable</small></div><div><span class="num">0</span><small>Shortlisted</small></div><div><span class="num">0</span><small>Selected</small></div></div>
<div class="tw"><table><thead><tr><th>Candidate</th><th>Quality</th><th>Time</th><th>Compute</th><th>Cost</th><th>Fit</th><th>Suitability</th></tr></thead><tbody id="tb"><tr><td colspan="7" style="text-align:center;color:var(--mut)">Run the demo to see candidates</td></tr></tbody></table></div>
<p class="w" id="wt"></p>
</div>
<div class="pane">
<h3>Plan vs reality</h3>
<div id="tasks"><p class="w">Tasks appear after a strategy is chosen.</p></div>
<h3 style="margin-top:20px">Strategy history</h3>
<ul class="log" id="log"></ul>
</div>
</div>
<div class="sw" id="sw"><div class="swc old"><small>Previous strategy</small><b>-</b><span class="hrs">-</span><small>projected remaining, risk high<span class="bd e">Estimated</span></small></div><svg class="ar" viewBox="0 0 80 24" aria-hidden="true"><path d="M2 12H70M60 3l12 9-12 9" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg><div class="swc new"><small>New strategy</small><b>-</b><span class="hrs">-</span><small>projected remaining, risk low<span class="bd e">Estimated</span></small></div><p id="swr"></p></div>
<div class="two"><div class="card"><h3>Why this pick?</h3><div id="whyb"></div></div><div class="card"><h3>What if your priorities differ?</h3><p class="w" style="margin-top:0">Drag the weights. The ranking re-sorts live.</p><div id="sls"></div><div id="wir"></div></div></div>
<div class="ins">
<div class="card"><h3>Deadline buffer</h3><svg id="bf" viewBox="0 0 300 150" style="width:100%"></svg><p class="w" id="bft">Spare hours before the deadline appear here (estimate).</p></div>
<div class="card"><h3>Where the hours go</h3><div class="dn"><div class="ring" id="dn" style="width:110px;height:110px"><b id="dnv" style="width:74px;height:74px;font-size:16px">0h</b></div><ul class="lg" id="lg"></ul></div><p class="w" id="dev"></p></div>
<div class="card"><h3>How candidates score</h3><div id="cb"><p class="w">Scores appear after research.</p></div></div>
</div>
<div class="fin" id="fin"><div class="ring" id="ring"><b id="rv">0%</b></div>
<div><h3>Goal achieved (simulated)</h3><p class="w" style="margin:4px 0 10px">Score = mean of the five parts below.</p></div>
<ul><li>Quality <b>91%</b></li><li>Time <b>96%</b></li><li>Cost <b>100%</b></li><li>Reliability <b>89%</b></li><li>Requirements <b>95%</b></li></ul></div>
<div class="rep" id="rep"></div>
</div></section>
<div id="ts" aria-live="polite"></div><footer>Pivot: plan, act, observe, adapt. Demo data is simulated; estimates are labelled as estimates.</footer>

<script>
let SPD=1,PAUSED=false,LR;const $=id=>document.getElementById(id),sl=async ms=>{let t=ms/SPD;while(t>0){await new Promise(r=>setTimeout(r,50));if(!PAUSED)t-=50}};
const C=[['AASIST',96,45,35,90,95],['RawNet2',85,58,44,90,86],['Wav2Vec2',80,72,70,95,82],['Pretrained model',74,90,85,95,78],['Hosted API',60,95,100,60,60]];
const W1={q:.45,t:.15,c:.10,k:.05,f:.25},W2={q:.25,t:.35,c:.15,k:.10,f:.15};
const sc=(r,w)=>r[1]*w.q+r[2]*w.t+r[3]*w.c+r[4]*w.k+r[5]*w.f;
let run=0;
function table(w,pick,rows){LR=rows;whyF(w,pick,rows);wi();bars(w,pick,rows);
 $('tb').innerHTML=rows.map(r=>`<tr class="${r[0]==pick?'sel':''}"><td>${r[0]}</td><td>${cellv(r,1)}</td><td>${cellv(r,2)}</td><td>${cellv(r,3)}</td><td>${cellv(r,4)}</td><td>${cellv(r,5)}</td><td><b>${(r[6]!=null?r[6]:sc(r,w)).toFixed(1)}</b></td></tr>`).join('');
 $('wt').textContent='Weights (set from your priorities): quality '+w.q*100+'%, time '+w.t*100+'%, compute '+w.c*100+'%, cost '+w.k*100+'%, fit '+w.f*100+'%.';
}
function log(t,cls){if(cls)toast(t,cls);const l=document.createElement('li');l.className=cls||'';l.innerHTML='<b>'+new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})+'</b> '+t;$('log').prepend(l)}
function stat(t){$('stat').textContent=t}
function health(t,c){$('k3').textContent=t;$('k3').style.color=c}
function funnel(v){[...$('fun').children].forEach((d,i)=>{d.classList.toggle('on',v[i]!=null);if(v[i]!=null)d.querySelector('.num').textContent=v[i]})}
function tasks(T){donut(T);ex(T);rl(T);$('tasks').innerHTML=T.map(t=>{const pw=Math.min(100,t.p/8*100),aw=t.a?Math.min(100,t.a/8*100):0;
 return `<div class="t"><div class="h"><span>${t.n}</span><span>${t.p}h planned${t.a?' · '+t.a+'h actual (est.)':''}</span></div><div class="bar"><i class="p" style="width:${pw}%"></i><i class="a ${t.a>t.p*1.3?'late':''}" style="width:${aw}%"></i></div></div>`}).join('')}
function count(el,to,suf,ms=900){const s=performance.now();(function f(n){const p=Math.min(1,(n-s)/ms);el.textContent=Math.round(to*p)+suf;if(p<1)requestAnimationFrame(f)})(s)}
let bufs=[];const PAL=['#8b9bff','#3ddbb0','#ffb84d','#ff6b6b','#c58bff','#6bc7ff'];
function drawBuf(){const s=$('bf');if(!bufs.length){s.innerHTML='';return}
 const v=bufs.map(b=>b[1]),lo=Math.min(-3,...v)-1,hi=Math.max(...v)+2,X=i=>20+i*(260/4),Y=y=>130-(y-lo)/(hi-lo)*110;
 s.innerHTML=`<rect x="20" y="${Y(0)}" width="260" height="${130-Y(0)}" fill="rgba(255,107,107,.12)"/><line x1="20" x2="280" y1="${Y(0)}" y2="${Y(0)}" stroke="#ff6b6b" stroke-dasharray="4 4"/><text x="24" y="${Y(0)-4}" fill="#ff6b6b" font-size="10">deadline</text><polyline points="${bufs.map((b,i)=>X(i)+','+Y(b[1])).join(' ')}" fill="none" stroke="#8b9bff" stroke-width="2.5"/>`+bufs.map((b,i)=>`<circle cx="${X(i)}" cy="${Y(b[1])}" r="4.5" fill="${b[1]<2?'#ff6b6b':'#3ddbb0'}"><title>${b[0]}: ${b[1].toFixed(1)}h spare</title></circle>`).join('');
 const l=bufs[bufs.length-1];$('bft').textContent=l[0]+': '+l[1].toFixed(1)+'h spare (estimate)'}
function bp(n,v){bufs.push([n,v]);drawBuf()}
function bars(w,pick,rows){$('cb').innerHTML=rows.map(r=>{const x=r[6]!=null?r[6]:sc(r,w);return `<div class="sb ${r[0]==pick?'top':''}"><span>${r[0]}</span><div class="bar"><i style="width:${x}%"></i></div><b>${x.toFixed(0)}</b></div>`}).join('')}
function donut(T){const h=T.map(t=>t.a||t.p),tot=h.reduce((a,b)=>a+b,0);let c=0;const st=h.map((x,i)=>{const a=c/tot*100;c+=x;return PAL[i%6]+' '+a+'% '+c/tot*100+'%'});
 $('dn').style.background='conic-gradient('+st.join(',')+')';$('dnv').textContent=tot.toFixed(1)+'h';
 $('lg').innerHTML=T.map((t,i)=>`<li><i style="background:${PAL[i%6]}"></i>${t.n} ${h[i]}h</li>`).join('');
 const d=T.filter(t=>t.a),pp=d.reduce((a,t)=>a+t.p,0),aa=d.reduce((a,t)=>a+t.a,0);
 $('dev').textContent=d.length?`Finished tasks: ${aa.toFixed(1)}h actual vs ${pp}h planned (${aa>=pp?'+':''}${Math.round((aa/pp-1)*100)}%). Unfinished tasks use plan estimates.`:''}
function res(){return [...new Set(String($('rs').value||'').split(/[,;\n]/).map(x=>x.replace(/[<>]/g,'').trim()).filter(Boolean))].slice(0,12)}
function mk(){const D=C.map(r=>[...r]),r=res(),cl=r.includes('Google Colab')||r.includes('Kaggle notebooks'),cr=r.includes('Cloud credits'),e=$('ex').value;
 D.forEach(x=>{if(x[0]!='Hosted API')x[3]=Math.max(5,Math.min(100,x[3]+(cl?0:-15)+(cr?15:0)))});
 const d=e=='Beginner'?-10:e=='Advanced'?10:0;D[0][2]+=d;D[1][2]+=d;if($('bd').value>0)D[4][4]=85;return D}
function reset(){run++;PAUSED=false;$('ps').textContent='Pause';hideAll();bufs=[];drawBuf();$('cb').innerHTML='<p class="w">Scores appear after research.</p>';$('lg').innerHTML='';$('dev').textContent='';$('dn').style.background='';$('dnv').textContent='0h';$('tb').innerHTML='<tr><td colspan="7" style="text-align:center;color:var(--mut)">Run the demo to see candidates</td></tr>';$('wt').textContent='';funnel([null,null,null,null,null]);[...$('fun').children].forEach(d=>d.querySelector('.num').textContent=0);$('tasks').innerHTML='<p class="w">Tasks appear after a strategy is chosen.</p>';$('log').innerHTML='';rs6();$('fin').classList.remove('show');$('k1').textContent='0%';$('k2').textContent=$('dl').value*24+'h';$('k4').textContent='None yet';$('k5').textContent='-';health('Not started','');stat('Waiting for a goal');$('run').disabled=false}
async function goDemo(){
 $('demo').scrollIntoView();hideAll();const D=mk(),days=+$('dl').value,wh=days*5.5,H=f=>Math.round(days*24*f)+'h',me=++run,ok=()=>me==run;$('run').disabled=true;
 $('log').innerHTML='';$('fin').classList.remove('show');
 bufs=[];drawBuf();$('pt').textContent=$('goalIn').value;$('tags').textContent=days+' days, '+($('bd').value==0?'₹0':'₹'+$('bd').value)+', '+res().join(', ');stat('Researching approaches');health('Researching','var(--acc)');log('Goal parsed: 4-day deadline, ₹0 budget, hard constraints separated from preferences');g1();cs(1,'c');cs(2,'i');
 for(const v of [[23],[23,14],[23,14,6],[23,14,6,3],[23,14,6,3,1]]){funnel(v);await sl(650);if(!ok())return}
 stat('Scoring candidates');table(W1,'AASIST',D);await sl(1400);if(!ok())return;
 $('k4').textContent='AASIST';count($('k5'),82,'%');log('AASIST selected: best quality and fit under the first weights','g');
 stat('Executing plan');health('On track','var(--ok)');
 let T=[{n:'Environment setup',p:2},{n:'Dataset preparation',p:2},{n:'AASIST model setup',p:3},{n:'Integration + web demo',p:4},{n:'Deployment',p:2}];
 p2(T);cs(2,'c');cs(3,'i');tasks(T);bp('Plan',wh-13);count($('k1'),20,'%');$('k2').textContent=H(.92);await sl(1200);if(!ok())return;
 T[0].a=2.4;T[1].a=3.1;cs(4,'i');tasks(T);bp('Dataset done',wh-14.5);count($('k1'),38,'%');$('k2').textContent=H(.83);log('Dataset preparation ran +55% over estimate');await sl(1300);if(!ok())return;
 T[2].a=5.8;tasks(T);bp('Setup slipped',wh-20.3);$('k2').textContent=H(.74);health('At risk','var(--warn)');await sl(1000);if(!ok())return;
 health('Drift detected','var(--bad)');stat('Diagnosing drift');
 cs(4,'c');cs(5,'i');$('b5').innerHTML='<div class="chain"><div><small>Symptom</small>Projected delay +5.4h<span class="bd e">Estimated</span></div><div><small>Cause</small>AASIST setup took 5.8h vs 3h planned (+93%)<span class="bd m">Measured</span></div><div><small>Root cause</small>Dependencies unsupported in the Colab environment<span class="bd e">Estimated</span></div></div>';
 $('b5').insertAdjacentHTML('beforeend',DGX);log('Drift detected: deadline buffer shrank from 9h to 3.6h (estimate)','k');await sl(2200);if(!ok())return;
 cs(5,'c');cs(6,'i');$('b6').innerHTML='<p class="w">Re-researching alternatives and re-scoring them with the current constraints.</p>';stat('Researching lower-complexity options');log('Re-researching alternatives with current constraints');
 table(W2,null,D);$('wt').textContent='Reweighted after delay: time 35%, quality 25%, compute 15%, cost 10%, fit 15%.';await sl(1800);if(!ok())return;
 D[0][2]=20;table(W2,'Pretrained model',D);$('wt').textContent='AASIST time score lowered to 20 from observed setup time. Weights now: time 35%, quality 25%.';
 $('k4').textContent='Pretrained model';count($('k5'),79,'%');
 cs(6,'c');ad();
 log('Strategy switched to pretrained model; plan updated','g');showSwitch();bp('Strategy switch',wh-17.3);await sl(2200);if(!ok())return;
 T=[T[0],T[1],{n:'AASIST setup (abandoned)',p:3,a:5.8},{n:'Load pretrained model',p:1,a:1.2},{n:'Integration + web demo',p:3,a:2.8},{n:'Deployment',p:2,a:1.8}];
 tasks(T);bp('Finished',wh-17.1);health('Recovering','var(--ok)');stat('Executing updated plan');count($('k1'),100,'%',1600);$('k2').textContent=H(.32);await sl(1900);if(!ok())return;
 health('On track','var(--ok)');stat('Goal reached (simulated)');cs(3,'c');log('Validation pipeline and web demo ready','g');
 $('fin').classList.add('show');const s=performance.now();(function f(n){const p=Math.min(1,(n-s)/1400),v=Math.round(94*p);$('ring').style.setProperty('--v',v);$('rv').textContent=v+'%';if(p<1)requestAnimationFrame(f)})(s);
 $('run').disabled=false;report();
}
$('dl').onchange=reset;
const RM=matchMedia('(prefers-reduced-motion:reduce)').matches,fine=matchMedia('(pointer:fine)').matches;
const cv=$('bg'),cx=cv.getContext('2d');let W,Hh,N=[],mx=-9e3,my=-9e3;
function rz(){const d=devicePixelRatio||1;W=innerWidth;Hh=innerHeight;cv.width=W*d;cv.height=Hh*d;cx.setTransform(d,0,0,d,0,0);N=Array.from({length:Math.round(Math.min(70,W/22))},()=>({x:Math.random()*W,y:Math.random()*Hh,vx:(Math.random()-.5)*.25,vy:(Math.random()-.5)*.25}))}
addEventListener('resize',rz);rz();addEventListener('pointermove',e=>{mx=e.clientX;my=e.clientY});
function fr(){cx.clearRect(0,0,W,Hh);
 for(const a of N){if(!RM){a.x+=a.vx;a.y+=a.vy;const dx=a.x-mx,dy=a.y-my,d=Math.hypot(dx,dy);if(d<140&&d>0){a.x+=dx/d*.6;a.y+=dy/d*.6}if(a.x<0||a.x>W)a.vx*=-1;if(a.y<0||a.y>Hh)a.vy*=-1}
  cx.fillStyle='rgba(139,155,255,.55)';cx.beginPath();cx.arc(a.x,a.y,1.6,0,7);cx.fill()}
 for(let i=0;i<N.length;i++)for(let j=i+1;j<N.length;j++){const d=Math.hypot(N[i].x-N[j].x,N[i].y-N[j].y);if(d<125){cx.strokeStyle='rgba(139,155,255,'+.16*(1-d/125)+')';cx.beginPath();cx.moveTo(N[i].x,N[i].y);cx.lineTo(N[j].x,N[j].y);cx.stroke()}}
 if(!RM)requestAnimationFrame(fr)}
fr();
const cf=$('cf'),c2=cf.getContext('2d');let Q=[],run2=false;
function ft(){c2.clearRect(0,0,cf.width,cf.height);Q=Q.filter(p=>p.l>0);for(const p of Q){p.x+=p.vx;p.y+=p.vy;p.vy+=.18;p.vx*=.99;p.l--;c2.globalAlpha=Math.min(1,p.l/30);c2.fillStyle=p.c;c2.fillRect(p.x,p.y,6,3)}c2.globalAlpha=1;if(Q.length)requestAnimationFrame(ft);else run2=false}
function burst(){if(RM)return;cf.width=innerWidth;cf.height=innerHeight;const r=$('ring').getBoundingClientRect();for(let i=0;i<110;i++){const a=Math.random()*6.28,v=3+Math.random()*8;Q.push({x:r.left+60,y:r.top+60,vx:Math.cos(a)*v,vy:Math.sin(a)*v-6,l:100+Math.random()*60,c:['#8b9bff','#3ddbb0','#ffb84d','#e8ecf5'][i%4]})}if(!run2){run2=true;ft()}}
new MutationObserver(()=>{if($('fin').classList.contains('show'))burst()}).observe($('fin'),{attributes:true,attributeFilter:['class']});
const ST=[['Goal reached',6],['Executing updated',5],['Researching lower',4],['Diagnosing',3],['Executing plan',2],['Scoring',1],['Researching',0]];
$('stp').innerHTML=['Research','Decide','Execute','Diagnose','Re-research','Re-plan','Done'].map(x=>'<span>'+x+'</span>').join('');
function stp(i){[...$('stp').children].forEach((e,k)=>e.className=i==6||k<i?'d':k==i?'c':'')}
new MutationObserver(()=>{const t=$('stat').textContent,m=ST.find(x=>t.startsWith(x[0]));stp(m?m[1]:-1)}).observe($('stat'),{childList:true,characterData:true,subtree:true});
['k3','k4'].forEach(id=>new MutationObserver(()=>{const e=$(id);e.classList.remove('pop');void e.offsetWidth;e.classList.add('pop')}).observe($(id),{childList:true,characterData:true,subtree:true}));
const nv=document.querySelector('nav'),hx=document.querySelector('.hero>div'),lp=document.querySelector('.loop');let tk=0;
function sc2(){tk=0;const y=scrollY,m=document.documentElement.scrollHeight-innerHeight;$('pg').style.width=(m>0?y/m*100:0)+'%';nv.classList.toggle('sm',y>30);
 if(!RM){hx.style.opacity=Math.max(.2,1-y/650)}
 const r=lp.getBoundingClientRect(),p=Math.min(1,Math.max(0,(innerHeight*.9-r.top)/(r.height+innerHeight*.35)));[...lp.children].forEach((e,i)=>e.classList.toggle('on',p>(i+.4)/7))}
addEventListener('scroll',()=>{if(!tk)tk=requestAnimationFrame(sc2)},{passive:true});sc2();
if(fine&&!RM){const vz=document.querySelector('.viz');vz.onpointermove=e=>{const r=vz.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;vz.style.transform=`perspective(1100px) rotateY(${(x-.5)*12}deg) rotateX(${(.5-y)*9}deg)`;vz.style.setProperty('--gx',x*100+'%');vz.style.setProperty('--gy',y*100+'%')};vz.onpointerleave=()=>vz.style.transform='';
 document.querySelectorAll('.btn').forEach(b=>{b.onpointermove=e=>{const r=b.getBoundingClientRect();b.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.18}px,${(e.clientY-r.top-r.height/2)*.28}px)`};b.onpointerleave=()=>b.style.transform=''})}
document.querySelectorAll('.card,.pane,.loop div,.kpis div').forEach(e=>e.classList.add('spot'));
document.addEventListener('pointermove',e=>{const s=e.target.closest&&e.target.closest('.spot');if(s){const r=s.getBoundingClientRect();s.style.setProperty('--mx',e.clientX-r.left+'px');s.style.setProperty('--my',e.clientY-r.top+'px')}});
document.addEventListener('pointerdown',e=>{const b=e.target.closest&&e.target.closest('.btn');if(!b)return;const r=b.getBoundingClientRect(),d=Math.max(r.width,r.height),x=document.createElement('span');x.className='rp';x.style.cssText=`width:${d}px;height:${d}px;left:${e.clientX-r.left-d/2}px;top:${e.clientY-r.top-d/2}px`;b.append(x);setTimeout(()=>x.remove(),600)});

const NM={q:'Quality',t:'Time',c:'Compute',k:'Cost',f:'Fit'},KS=['q','t','c','k','f'];
function whyF(w,pick,rows){const e=$('whyb');if(!pick){e.innerHTML='<p class="w">Re-scoring candidates with the new weights.</p>';return}
 const r=[...rows].sort((a,b)=>sc(b,w)-sc(a,w)),p=rows.find(x=>x[0]==pick)||r[0],V=(x,k)=>x[KS.indexOf(k)+1];
 const win=[...KS].sort((a,b)=>V(p,b)*w[b]-V(p,a)*w[a]).slice(0,3).map(k=>`<li>${NM[k]} ${V(p,k)}/100 at ${Math.round(w[k]*100)}% weight</li>`).join('');
 const risk=[...KS].sort((a,b)=>V(p,a)-V(p,b)).slice(0,1).map(k=>`<li class="rk">${NM[k]} is the weakest area (${V(p,k)}/100)</li>`).join('');
 const rej=r.filter(x=>x!==p).map(x=>{const k=[...KS].sort((a,b)=>(100-V(x,b))*w[b]-(100-V(x,a))*w[a])[0];return `<details><summary>${x[0]} <span class="bd e">${(x[6]!=null?x[6]:sc(x,w)).toFixed(1)}</span></summary><p>Loses the most on ${NM[k]} (${V(x,k)}/100, weight ${Math.round(w[k]*100)}%).</p></details>`}).join('');
 e.innerHTML=`<div class="wh"><b>${p[0]}</b><span class="bd e">Estimated</span><span class="sc">${(p[6]!=null?p[6]:sc(p,w)).toFixed(1)}/100</span></div><ul>${win}${risk}</ul><h4>Rejected alternatives</h4>${rej}<h4>Evidence</h4>${p[7]?evHtml(p):'<p class="w" style="margin:0"><span class="bd" style="margin:0 6px 0 0">Unknown</span>Demo mode attaches no live sources. Live mode would list papers, repos and benchmarks here.</p>'}`}
const WK=[['q',.25],['t',.35],['c',.15],['k',.10],['f',.15]];
function wi(){const v={};let t=0;WK.forEach(([k])=>{v[k]=+$('w_'+k).value;t+=v[k]});t=t||1;const n={};KS.forEach(k=>{n[k]=v[k]/t;$('wv_'+k).textContent=Math.round(n[k]*100)+'%'});
 $('wir').innerHTML=!LR?'<p class="w">Run your goal to see the backend\'s candidates here.</p>':LR.map(r=>[r,sc(r,n)]).sort((a,b)=>b[1]-a[1]).map(([r,x],i)=>`<div class="sb ${i?'':'top'}"><span>${r[0]}</span><div class="bar"><i style="width:${x}%"></i></div><b>${x.toFixed(0)}</b></div>`).join('')}
function hideAll(){LR=undefined;$('sw').classList.remove('show');$('rep').classList.remove('show');$('whyb').innerHTML='<p class="w">Run the demo to see why the agent picks a strategy.</p>';wi()}
function showSwitch(){const r=(LR||[]).slice().sort((a,b)=>sc(b,W2)-sc(a,W2))[1];$('swr').innerHTML='Reason: the original approach no longer fits the remaining time, so time is now weighted 35%. Runner-up: '+(r?r[0]+' ('+sc(r,W2).toFixed(0)+')':'none')+'. Remaining work drops about 35%<span class="bd e">Estimated</span>';$('sw').classList.add('show')}
function toast(t,c){const e=document.createElement('div');e.className='toast '+c;e.textContent=t.replace(/<[^>]+>/g,'');$('ts').append(e);setTimeout(()=>e.remove(),4200)}
let RS=[];
function report(){const d=$('dl').value,b=$('bd').value==0?'₹0':'₹'+$('bd').value;
 RS=[['Goal',$('goalIn').value],['Constraints',d+' days, '+b+'. Resources: '+(res().join(', ')||'none')+'.'],['Initial strategy','AASIST, chosen for best quality and fit under the first weights.'],['What happened','Dataset preparation took 3.1h vs 2h planned (+55%). AASIST setup took 5.8h vs 3h planned (+93%).'],['Root cause','Dependencies unsupported in the available Colab environment.'],['Adaptation','Drift detected, alternatives re-scored with time weighted 35%, strategy switched to a pretrained model.'],['Final strategy','Pretrained model. Remaining work fell from 9.2h to 6h (about 35% less, estimate).'],['Outcome','Validation pipeline and web demo ready. Goal achievement 94% (simulated).'],['Lessons','Check environment compatibility in the first hour. Keep a lightweight fallback shortlisted before committing to the heaviest option.']];
 $('rep').innerHTML='<h3>Project report<span class="bd e">Simulated</span></h3><dl>'+RS.map(([a,c])=>`<dt>${a}</dt><dd>${c}</dd>`).join('')+'</dl><div class="row"><button class="btn" onclick="print()">Save as PDF</button><button class="btn ghost" onclick="dlRep()">Download .md</button></div>';$('rep').classList.add('show')}
function dlRep(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['# Project report\n\n'+RS.map(([x,y])=>'## '+x+'\n'+y+'\n').join('\n')],{type:'text/markdown'}));a.download='pivot-report.md';a.click()}
$('sls').innerHTML=WK.map(([k,v])=>`<div class="sl"><span>${NM[k]}</span><input type="range" id="w_${k}" min="0" max="100" value="${v*100}" aria-label="${NM[k]} weight"><b id="wv_${k}"></b></div>`).join('');
$('sls').oninput=wi;['ex','bd'].forEach(i=>$(i).addEventListener('change',()=>{if(!$('run').disabled){LR=undefined;wi()}}));hideAll();
stp(-1);

const BDG={c:['Completed','ok'],i:['In progress','wr'],p:['Pending','pe']};
function cs(n,s){const e=$('s'+n);e.textContent=BDG[s][0];e.className='st '+BDG[s][1]}
const esc=x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;');
function g1(){const d=$('dl').value,b=$('bd').value==0?'\u20b90':'\u20b9'+$('bd').value,r=res(),gpu=r.some(x=>/Colab|Kaggle|Cloud/.test(x));
 $('b1').innerHTML=`<div class="obj"><small>Objective</small><p>${esc($('goalIn').value)}</p></div><div class="q"><div class="qc rd"><h4>Constraints (hard)</h4><ul class="pl"><li>${d} day deadline</li><li>${b} budget</li><li>${esc(r.join(', ')||'No listed resources')}</li></ul></div><div class="qc bl"><h4>Priorities (soft)</h4><ul class="pl"><li>Working demo</li><li>Measurable accuracy</li><li>Simple implementation</li></ul></div><div class="qc or"><h4>Risks<span class="bd e">Estimated</span></h4><ul class="pl"><li>Limited time</li><li>${gpu?'Limited compute':'No free GPU listed'}</li><li>Dataset challenges</li></ul></div><div class="qc gn"><h4>Success criteria</h4><ul class="pl"><li>Working model</li><li>Validation results</li><li>Web demo</li></ul></div></div>`}
function p2(T){const h=T.reduce((a,t)=>a+t.p,0);
 $('b2').innerHTML=`<div class="mini"><b>Strategy overview</b><span>Start with AASIST, chosen for best quality and fit under the first weights, then build the demo around it.</span></div><div class="tiles"><div><b>${T.length}</b><small>Phases</small></div><div><b>${h}h</b><small>Planned</small></div><div><b>High</b><small>Complexity<span class="bd e">Est.</span></small></div></div><h4>Execution phases</h4><ol class="ph">${T.map((t,i)=>`<li><i>${i+1}</i><span>${t.n}</span><em>${t.p}h</em></li>`).join('')}</ol>`}
function ex(T){const d=T.filter(t=>t.a),u=d.reduce((a,t)=>a+t.a,0),n=T.find(t=>!t.a),l=d[d.length-1];
 $('x1').textContent=d.length+'/'+(T.length||5);$('x2').textContent=u.toFixed(1)+'h';
 $('x4').innerHTML=l?`<b>${l.n}</b><span>${l.a}h actual vs ${l.p}h planned</span>`:'<span>Nothing finished yet</span>';
 $('x5').innerHTML=n?`<b>${n.n}</b><span>${n.p}h planned (estimate)</span>`:'<span>All tasks finished</span>'}
function rl(T){const d=T.filter(t=>t.a);
 if(!d.length){['r1','r2'].forEach(i=>$(i).textContent='-');$('rr').style.setProperty('--v',0);$('rrv').textContent='0%';$('rsv').className='tg';$('rsv').textContent='No data yet';$('r3').innerHTML='';return}
 const p=d.reduce((a,t)=>a+t.p,0),a=d.reduce((x,t)=>x+t.a,0),dv=Math.round((a/p-1)*100),o=[...d].sort((x,y)=>(y.a-y.p)-(x.a-x.p)).slice(0,3),sv=dv>50?['High severity','bad']:dv>20?['Medium severity','wr']:['Low severity','ok'];
 $('r1').textContent=p+'h';$('r2').textContent=a.toFixed(1)+'h';$('rr').style.setProperty('--v',Math.min(100,Math.abs(dv)));$('rrv').textContent=(dv>0?'+':'')+dv+'%';$('rsv').className='tg '+sv[1];$('rsv').textContent=sv[0];
 $('r3').innerHTML=o.map(t=>`<li><b>${t.n}</b> ${t.a}h vs ${t.p}h (${t.a>=t.p?'+':''}${Math.round((t.a/t.p-1)*100)}%)</li>`).join('')}
const DGX='<div class="tiles rows"><div><small>Cause type</small><b class="tg bad">Environment</b></div><div><small>Strategy affected</small><b class="tg wr">Yes</b></div><div><small>Confidence</small><b>80%<span class="bd e">Est.</span></b></div></div><h4>Recommendation</h4><p>Re-evaluate model selection with time weighted higher.</p>';
function ad(){$('b6').innerHTML='<div class="dec"><small>Decision</small><b>Switch strategy</b><span>AASIST to Pretrained model</span></div><h4>Reason</h4><p>The original approach no longer fits the remaining time, so time is now weighted 35%.</p><h4>Plan changes</h4><ol class="pc"><li>Strategy changes to a pretrained model</li><li>Remaining tasks rebuilt around loading it</li></ol><h4>Expected impact<span class="bd e">Estimated</span></h4><p>Remaining work falls from about 9.2h to 6h, and the deadline buffer recovers.</p>'}
function rs6(){for(let n=1;n<=6;n++)cs(n,'p');
 $('b1').innerHTML='<p class="w">Run the demo to turn your goal into objective, constraints, priorities, risks and success criteria.</p>';$('b2').innerHTML='<p class="w">The plan appears once a strategy is chosen.</p>';$('b5').innerHTML='<p class="w">Diagnosis starts when drift is detected.</p>';$('b6').innerHTML='<p class="w">The adaptation decision follows the diagnosis.</p>';ex([]);rl([])}
new MutationObserver(()=>{const v=parseInt($('k1').textContent)||0;$('rg').style.setProperty('--v',v);$('rgv').textContent=v+'%'}).observe($('k1'),{childList:true,characterData:true,subtree:true});
new MutationObserver(()=>{$('x3').textContent=Math.ceil((parseInt($('k2').textContent)||0)/24)+' days'}).observe($('k2'),{childList:true,characterData:true,subtree:true});
rs6();
</script>
<script>
/* ===================================================================
   LIVE BACKEND INTEGRATION  (Decision Engine = the only API this page calls)
   /analyze -> /plan (Decision Engine calls Research Engine itself) -> /adapt
   Every strategy decision shown below comes from the backend response.
   Override the API for local testing:  index.html?api=http://localhost:5000
   =================================================================== */
const API_BASE=(new URLSearchParams(location.search).get('api')||window.PIVOT_API||'https://agentic-system-1-3vhk.onrender.com').replace(/\/+$/,'');

/* Simulated execution telemetry. This is only the "what actually happened" input that is
   sent to /adapt as `actual`; it never decides anything. Swap for real observations later. */
const SIM={overrun:[1.2,1.55,1.4],blockedOverrun:1.9,finish:[.9,1.05,.95,1.1],
 blockers:['GPU memory is insufficient','NVIDIA MX330 cannot run the current model successfully']};

let LIVE=false;
const _rl=rl;rl=function(T){if(!LIVE)_rl(T)};   // reality card is driven by /adapt in live mode
fetch(API_BASE+'/').catch(()=>{});                // wake a sleeping Render instance early

async function api(path,body){
 const c=new AbortController(),t=setTimeout(()=>c.abort(),170000);
 try{
  const r=await fetch(API_BASE+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:c.signal});
  const j=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(path+': '+(j.error||j.message||'HTTP '+r.status));
  return j;
 }catch(e){throw e.name==='AbortError'?new Error(path+': timed out'):e}
 finally{clearTimeout(t)}
}

/* ---------- helpers ---------- */
const txt=x=>x==null?'':typeof x==='string'?x:(x.description||x.name||x.title||x.text||x.objective||JSON.stringify(x));
const li=a=>(Array.isArray(a)?a:[]).slice(0,5).map(x=>'<li>'+esc(txt(x))+'</li>').join('')||'<li>-</li>';
const pretty=s=>String(s||'-').replace(/_/g,' ').replace(/^./,c=>c.toUpperCase());
const short=s=>{s=String(s||'');return s.length>40?s.slice(0,38)+'...':s};
const nrm=s=>String(s||'').toLowerCase().replace(/\(.*?\)/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const same=(a,b)=>{a=nrm(a);b=nrm(b);return a.length>3&&b.length>3&&(a.includes(b)||b.includes(a))};
const sumH=a=>a.reduce((s,t)=>s+(Number(t.p)||0),0);
const nz=(v,d)=>typeof v==='number'?v:d;

/* Research Engine candidate -> table row [name, quality, time, compute, cost, fit, suitability, raw] */
function rowsOf(c){return (c||[]).map(x=>{const s=x.scores||{};return [String(x.name).replace(/[<>]/g,''),nz(s.performance,50),nz(s.time,50),nz(s.hardware,50),nz(s.cost,50),nz(s.compatibility,50),x.suitability,x]})}
function cellv(r,i){const k=['','performance','time','hardware','cost','compatibility'][i];return r[7]&&(r[7].unverifiedScores||[]).includes(k)?'-':r[i]}
function uiW(bw){const p=bw?{q:bw.performance,t:bw.time,c:bw.hardware,k:bw.cost,f:bw.compatibility}:null;
 const t=p?Object.values(p).reduce((a,b)=>a+(+b||0),0):0;if(!t)return {...W1};const o={};KS.forEach(k=>o[k]=(p[k]||0)/t);return o}
function setSliders(w){KS.forEach(k=>{$('w_'+k).value=Math.round(w[k]*100)})}
function setWT(w,pre){$('wt').textContent=(pre||'Weights from the Research Engine: ')+KS.map(k=>NM[k].toLowerCase()+' '+Math.round(w[k]*100)+'%').join(', ')+'.'}
function fun(rows,sel){const n=rows.length,d=rows.filter(r=>r[7].solvesGoalDirectly===false?false:r[7].solvesGoalDirectly===true?true:['Model','API','Framework','Platform','Service','Tool','Approach'].includes(r[7].type)).length;return [n,n-d,d,Math.min(3,d),sel]}
function evHtml(p){const ev=p&&p[7]&&p[7].evidence;
 if(!ev||!ev.length)return '<p class="w" style="margin:0"><span class="bd" style="margin:0 6px 0 0">Unknown</span>No evidence attached to this option.</p>';
 return '<ul style="list-style:none;padding:0;margin:0;display:grid;gap:6px;font-size:13px">'+ev.slice(0,4).map(e=>'<li style="margin:0"><span class="bd '+(e.type==='published_benchmark'?'m':'e')+'" style="margin:0 6px 0 0">'+esc(pretty(e.type))+'</span>'+esc(e.text||'')+(e.url&&/^https?:/.test(e.url)?' <a href="'+esc(e.url)+'" target="_blank" rel="noopener">source</a>':'')+'</li>').join('')+'</ul>'}

/* ---------- renderers (backend data -> existing UI slots) ---------- */
function g1Live(a,goal){
 $('b1').innerHTML=`<div class="obj"><small>Objective</small><p>${esc(a.objective||goal)}</p></div><div class="q"><div class="qc rd"><h4>Constraints (hard)</h4><ul class="pl">${li(a.constraints)}</ul></div><div class="qc bl"><h4>Priorities (soft)</h4><ul class="pl">${li(a.priorities)}</ul></div><div class="qc or"><h4>Risks<span class="bd e">Estimated</span></h4><ul class="pl">${li(a.risks)}</ul></div><div class="qc gn"><h4>Success criteria</h4><ul class="pl">${li(a.successCriteria)}</ul></div></div>`}
function p2Live(plan,T,hit){
 const cx=hit&&hit[7]&&typeof hit[7].scores?.complexity==='number'?hit[7].scores.complexity:null,cl=cx==null?'-':cx>=70?'Low':cx>=40?'Medium':'High';
 $('b2').innerHTML=`<div class="mini"><b>Strategy overview</b><span>${esc(plan.strategy||'')}</span></div><div class="tiles"><div><b>${T.length}</b><small>Phases</small></div><div><b>${sumH(T)}h</b><small>Planned</small></div><div><b>${cl}</b><small>Complexity<span class="bd e">Est.</span></small></div></div>`+(plan.selectedSolution&&plan.selectedSolution.reason?`<h4>Why this approach</h4><p>${esc(plan.selectedSolution.reason)}</p>`:'')+`<h4>Execution phases</h4><ol class="ph">${T.map((t,i)=>`<li><i>${i+1}</i><span>${esc(t.n)}</span><em>${t.p}h</em></li>`).join('')}</ol>`}
function realLive(r){
 const h=v=>v==null?'-':v+'h',dv=r.driftPercentage||0;
 $('r1').textContent=h(r.expectedHours);$('r2').textContent=h(r.actualHours);
 $('rr').style.setProperty('--v',Math.min(100,dv));$('rrv').textContent=(dv>0?'+':'')+dv+'%';
 const sv=r.status==='blocked'?['Blocked, '+r.severity+' severity','bad']:r.severity==='high'?['High severity','bad']:r.severity==='medium'?['Medium severity','wr']:['Low severity','ok'];
 $('rsv').className='tg '+sv[1];$('rsv').textContent=sv[0];
 const bl=r.blockers&&r.blockers.length?r.blockers:(r.observations||[]);
 $('r3').previousElementSibling.textContent=r.blockers&&r.blockers.length?'Blockers observed':'Observations';
 $('r3').innerHTML=bl.slice(0,3).map(x=>'<li><b>'+esc(x)+'</b></li>').join('')}
function dxLive(d,r){
 const conf=d.confidence>1?Math.round(d.confidence):Math.round((d.confidence||0)*100),blk=r.blockers&&r.blockers.length?r.blockers.join('; '):'',dr=r.driftPercentage?` (${r.driftPercentage}% vs plan)`:'';
 $('b5').innerHTML=`<div class="chain"><div><small>Symptom</small>Execution ${esc(pretty(r.status).toLowerCase())}${dr}<span class="bd m">Measured</span></div><div><small>Cause</small>${esc(blk||d.rootCause||'')}<span class="bd m">Measured</span></div><div><small>Root cause</small>${esc(d.rootCause||d.explanation||'Unknown')}<span class="bd e">Estimated</span></div></div><div class="tiles rows"><div><small>Cause type</small><b class="tg bad">${esc(pretty(d.causeType))}</b></div><div><small>Strategy affected</small><b class="tg ${d.strategyAffected?'wr':'ok'}">${d.strategyAffected?'Yes':'No'}</b></div><div><small>Confidence</small><b>${conf}%<span class="bd e">Est.</span></b></div></div><h4>Recommendation</h4><p>${esc(d.recommendation||d.explanation||'')}</p>`}
function adLive(a,from,to){
 const nm={switch_strategy:'Switch strategy',modify_plan:'Modify plan',continue:'Continue'}[a.decision]||pretty(a.decision);
 $('b6').innerHTML=`<div class="dec"><small>Decision</small><b>${esc(nm)}</b>${a.decision==='switch_strategy'?`<span>${esc(short(from))} to ${esc(short(to))}</span>`:''}</div><h4>Reason</h4><p>${esc(a.reason||'')}</p><h4>Plan changes</h4><ol class="pc">${(Array.isArray(a.changes)?a.changes:[]).slice(0,6).map(c=>'<li>'+esc(txt(c))+'</li>').join('')||'<li>No changes listed</li>'}</ol><h4>Expected impact<span class="bd e">Estimated</span></h4><p>${esc(a.expectedImpact||'')}</p>`}
function swLive(from,to,oldL,newL,reason,alt){
 const e=$('sw'),o=e.querySelector('.swc.old'),n=e.querySelector('.swc.new'),note='projected remaining<span class="bd e">Estimated</span>';
 o.querySelector('b').textContent=short(from);o.querySelector('.hrs').textContent=oldL.toFixed(1)+'h';o.querySelectorAll('small')[1].innerHTML=note;
 n.querySelector('b').textContent=short(to)||'No alternative found';n.querySelector('.hrs').textContent=newL?newL.toFixed(1)+'h':'-';n.querySelectorAll('small')[1].innerHTML=note;
 $('swr').innerHTML='Reason: '+esc(reason||'')+(alt?' Runner-up: '+esc(alt.name)+' ('+Math.round(alt.suitability)+').':'');e.classList.add('show')}
function reportLive(S){
 const d=$('dl').value,b=+$('bd').value==0?'\u20b90':'\u20b9'+$('bd').value;
 RS=[['Goal',S.goal],['Constraints',d+' days, '+b+'. Resources: '+(res().join(', ')||'none')+'.'],
 ['Initial strategy',(S.plan.strategy||S.from||'')+(S.plan.selectedSolution&&S.plan.selectedSolution.reason?' ('+S.plan.selectedSolution.reason+')':'')],
 ['What happened',(S.rea.observations||[]).join('. ')+' (execution observation simulated).'],
 ['Root cause',S.dg?(S.dg.rootCause||S.dg.explanation||''):'None'],
 ['Adaptation',pretty(S.ad.decision)+': '+(S.ad.reason||'')],
 ['Final strategy',(S.to||S.from||'')+(S.newL?'. Projected remaining work: '+S.oldL.toFixed(1)+'h to '+S.newL.toFixed(1)+'h (estimate).':'')],
 ['Outcome','Updated plan executed in simulation; all phases completed.'],
 ['Lessons',S.dg?(S.dg.recommendation||''):'']];
 $('rep').innerHTML='<h3>Project report<span class="bd e">Simulated</span></h3><dl>'+RS.map(([a,c])=>`<dt>${esc(a)}</dt><dd>${esc(c)}</dd>`).join('')+'</dl><div class="row"><button class="btn" onclick="print()">Save as PDF</button><button class="btn ghost" onclick="dlRep()">Download .md</button></div>';$('rep').classList.add('show')}

/* The Research Engine / Decision Engine return built-in sample candidates (meta.usedFallback) when Gemini or research fails.
   That data is not about the user's goal, so it is never rendered: it is reported as an error instead. */
function chkFallback(meta,where){
 if(meta&&meta.usedFallback===true&&meta.genericFallback!==true){
  const w=(meta.warnings||[]).map(txt).filter(Boolean).join('; ');
  throw new Error(where+': the backend returned built-in sample research instead of research for your goal'+(w?' ('+w+')':'')+'. Check the Research Engine (Gemini key/model, MOCK flag).')}
}
/* ---------- main flow ---------- */
function liveError(msg){
 let b=document.getElementById('liveErr');
 if(!b){b=document.createElement('div');b.id='liveErr';b.setAttribute('role','alert');
  b.style.cssText='margin:10px 0;padding:12px 14px;border:1px solid var(--bad);border-left:4px solid var(--bad);border-radius:12px;background:var(--panel);font-size:14px';
  $('stp').parentNode.insertBefore(b,$('stp'))}
 b.innerHTML='<b style="color:var(--bad)">Live AI temporarily unavailable</b><br><span>'+esc(msg)+'</span><br><small>Your goal and settings are unchanged. Press Run again to retry. No offline or example content is shown.</small>';
 b.style.display='block'}
function clearLiveError(){const b=document.getElementById('liveErr');if(b)b.style.display='none'}
async function go(){
 $('demo').scrollIntoView();
 if(!$('goalIn').value.trim()){stat('Type a goal first');$('goalIn').focus();return}
 if(!(+$('dl').value>=1)){stat('Enter a deadline of 1 day or more');$('dl').focus();return}
 if(+$('bd').value<0){stat('Budget cannot be negative');$('bd').focus();return}
 reset();clearLiveError();
 const me=++run,ok=()=>me==run;$('run').disabled=true;LIVE=true;
 try{await live(ok)}
 catch(e){
  if(!ok())return;
  console.error(e);LIVE=false;
  const m=String((e&&e.message)||e);
  log('Live AI unavailable: '+esc(m),'k');
  stat('Live AI temporarily unavailable');
  health('Backend unavailable','var(--bad)');
  liveError(m);
  /* intentionally NO fallback: goDemo() is never called from the live path */
 }finally{LIVE=false;if(ok())$('run').disabled=false}
}
async function live(ok){
 const days=+$('dl').value,budget=+$('bd').value,goal=$('goalIn').value.trim(),resources=res(),wh=days*5.5;
 const left=u=>Math.max(0,Math.round(days*24*(1-u/wh)));
 const base={goal,deadline:days+' days',budget,resources};
 $('pt').textContent=goal;$('tags').textContent=days+' days, '+(budget==0?'\u20b90':'\u20b9'+budget)+', '+resources.join(', ');
 $('k2').textContent=days*24+'h';
 stat('Researching approaches');health('Researching','var(--acc)');cs(1,'i');
 log('Sending goal to the Decision Engine: "'+esc(goal)+'" [build live-2]');console.log('[pivot live-2] request',base,'API',API_BASE);

 /* 1. /analyze */
 const an=await api('/analyze', base);console.log('[pivot live-2] /analyze response',an);
if(!ok())return;
 g1Live(an,goal);cs(1,'c');cs(2,'i');log('Goal analysed: constraints, priorities, risks and success criteria extracted');

 /* 2. /plan  (Decision Engine calls the Research Engine itself) */
 const crit=(an.successCriteria||[]).map(txt);
 const plan=await api('/plan',{...base,successCriteria:crit,constraints:{deadline:base.deadline,budget,experience:$('ex').value}});if(!ok())return;
 console.log('[pivot live-2] /plan response',plan);
 chkFallback(plan.researchUsed&&plan.researchUsed.meta,'/plan');
 const ru=plan.researchUsed||{},rows=rowsOf(ru.candidates);
 const selName=(plan.selectedSolution&&plan.selectedSolution.name)||(ru.selectedSolution&&ru.selectedSolution.name)||'';
 const hit=rows.find(r=>same(r[0],selName))||rows.find(r=>same(r[0],ru.selectedSolution&&ru.selectedSolution.name))||null;
 const from=selName||plan.strategy||'';
 stat('Scoring candidates');
 if(rows.length){const f=fun(rows,1);for(const v of [[f[0]],f.slice(0,2),f.slice(0,3),f.slice(0,4)]){funnel(v);await sl(450);if(!ok())return}funnel(f)}
 const w=uiW(ru.weights);setSliders(w);
 if(rows.length){table(w,hit?hit[0]:null,rows);setWT(w)}
 else $('tb').innerHTML='<tr><td colspan="7" style="text-align:center;color:var(--mut)">The Research Engine returned no candidates</td></tr>';
 $('k4').textContent=short(from)||'None yet';
 if(hit&&hit[6]!=null)count($('k5'),Math.round(hit[6]),'%');
 log(esc(short(from))+' selected by the backend','g');await sl(900);if(!ok())return;

 let T=(Array.isArray(plan.phases)?plan.phases:[]).map((p,i)=>({id:p.id,n:String(p.name||'Phase '+(i+1)),p:Number(p.expectedHours)||1}));
 if(!T.length)throw new Error('/plan returned no phases');
 const total=sumH(T);
 p2Live(plan,T,hit);cs(2,'c');cs(3,'i');stat('Executing plan');health('On track','var(--ok)');
 tasks(T);bp('Plan',wh-total);$('k2').textContent=left(0)+'h';log('Plan ready: '+T.length+' phases, '+total+'h planned','g');await sl(1100);if(!ok())return;

 /* 3. simulated execution -> observation */
 const bi=Math.min(2,T.length-1);let used=0,donePlanned=0;
 for(let i=0;i<bi;i++){T[i].a=+(T[i].p*SIM.overrun[i%SIM.overrun.length]).toFixed(1);used+=T[i].a;donePlanned+=T[i].p;
  tasks(T);count($('k1'),Math.round(donePlanned/total*100),'%');$('k2').textContent=left(used)+'h';
  log(esc(T[i].n)+': '+T[i].a+'h actual vs '+T[i].p+'h planned (simulated)');await sl(1000);if(!ok())return}
 bp('Phases done',wh-T.reduce((s,t)=>s+(t.a||t.p),0));
 const spent=+(T[bi].p*SIM.blockedOverrun).toFixed(1);T[bi].a=spent;used+=spent;
 const blockers=['Phase "'+T[bi].n+'" is blocked: setup or integration of '+(short(from)||'the chosen approach')+' is not working as planned','Time already spent on this phase is well over the estimate'];
 tasks(T);$('k2').textContent=left(used)+'h';health('At risk','var(--warn)');
 bp('Blocked',wh-T.reduce((s,t)=>s+(t.a||t.p),0));
 log('Observation (simulated): '+esc(blockers.join('; ')),'k');await sl(900);if(!ok())return;

 /* 4. /adapt  (reality -> diagnosis -> re-research -> replan, all server-side) */
 stat('Diagnosing drift');health('Blocked','var(--bad)');cs(4,'i');
 const actual={phaseId:T[bi].id||T[bi].n,status:'blocked',actualHours:spent,observations:blockers};
 const out=await api('/adapt',{...base,successCriteria:crit,plan,actual,deadlineRemaining:left(used)+' hours'});if(!ok())return;
 console.log('[pivot live-2] /adapt response',out);
 chkFallback(out.research&&out.research.meta,'/adapt');
 const rea=out.reality||{},dg=out.diagnosis,ad_=out.adaptation||{},rs_=out.research,ns=out.selectedSolution;

 realLive(rea);cs(4,'c');
 if(rea.status==='on_track'||!dg){
  health('On track','var(--ok)');adLive(ad_,from,from);cs(5,'c');cs(6,'c');$('b5').innerHTML='<p class="w">No drift detected, so no diagnosis was needed.</p>';
 }else{
  health(rea.status==='blocked'?'Blocked':'Drift detected','var(--bad)');
  await sl(1200);if(!ok())return;
  cs(5,'i');dxLive(dg,rea);cs(5,'c');log('Diagnosis: '+esc(pretty(dg.causeType))+(dg.strategyAffected?', strategy affected':''),'k');
  await sl(1800);if(!ok())return;
  cs(6,'i');
  if(rs_){
   stat('Researching lower-complexity options');log('Re-researching alternatives (failed strategy sent to the Research Engine)');
   const rr=rowsOf(rs_.candidates);
   if(rr.length){const w2=uiW(rs_.weights||ru.weights);setSliders(w2);funnel(fun(rr,0));table(w2,ns?String(ns.name).replace(/[<>]/g,''):null,rr);setWT(w2,'Re-scored after the failure: ')}
   if(rs_.error)log('Research Engine problem: '+esc(rs_.error),'k');
   await sl(1800);if(!ok())return;
   if(ns){funnel(fun(rr,1))}
  }
 }

 /* 5. adaptation decision */
 const sw=ad_.decision==='switch_strategy',to=(ns&&ns.name)||ad_.newStrategy||'';
 const np=(Array.isArray(ad_.newPhases)?ad_.newPhases:[]).map((x,i)=>typeof x==='string'?{n:x,p:1}:{n:String(x.name||x.title||'Phase '+(i+1)),p:Number(x.expectedHours??x.hours)||1});
 const oldL=sumH(T.slice(bi)),newL=np.length?sumH(np):0;
 adLive(ad_,from,to);cs(6,'c');
 if(sw){
  $('k4').textContent=short(to)||'No alternative';if(ns&&ns.suitability!=null)count($('k5'),Math.round(ns.suitability),'%');
  log('Strategy switched to '+esc(short(to)),'g');
  swLive(from,to,oldL,newL,ad_.reason,rs_&&rs_.otherAlternatives&&rs_.otherAlternatives[0]);
 }else log('Decision: '+esc(pretty(ad_.decision)),'g');
 let T2;
 const doneP=T.slice(0,bi).map(t=>({...t}));
 if(sw){const ab={...T[bi]};ab.n+=' (abandoned)';T2=[...doneP,ab,...np]}
 else T2=[...doneP,...(np.length?np:T.slice(bi).map(t=>({n:t.n,p:t.p})))];
 const usedNow=T2.reduce((s,t)=>s+(t.a||0),0);
 tasks(T2);bp('After adaptation',wh-(usedNow+sumH(T2.filter(t=>!t.a))));
 await sl(1800);if(!ok())return;

 /* 6. simulated completion of the updated plan */
 stat('Executing updated plan');health('Recovering','var(--ok)');
 let k=0;const todo=T2.filter(t=>!t.a);
 for(const t of todo){t.a=+(t.p*SIM.finish[k++%SIM.finish.length]).toFixed(1);tasks(T2);
  const dn=T2.filter(x=>x.a).length;count($('k1'),Math.round(dn/T2.length*100),'%');
  $('k2').textContent=left(T2.reduce((s,x)=>s+(x.a||0),0))+'h';await sl(1000);if(!ok())return}
 bp('Finished',wh-T2.reduce((s,t)=>s+(t.a||0),0));count($('k1'),100,'%',900);
 await sl(1000);if(!ok())return;
 health('On track','var(--ok)');stat('Goal reached (simulated)');cs(3,'c');log('Updated plan completed (simulated)','g');
 $('fin').classList.add('show');const s=performance.now();(function f(n){const p=Math.min(1,(n-s)/1400),v=Math.round(94*p);$('ring').style.setProperty('--v',v);$('rv').textContent=v+'%';if(p<1)requestAnimationFrame(f)})(s);
 reportLive({goal,plan,from,to,rea,dg,ad:ad_,oldL,newL});
}
</script></body></html>
