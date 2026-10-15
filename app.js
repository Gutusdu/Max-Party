(() => {
"use strict";
const $ = id => document.getElementById(id);
const EMOJIS = ["🦊","🐸","🐼","🐯"];
const COLORS = ["#ff967c","#82d7ff","#b8ef91","#c8a4ff"];
const DICE = ["⚀","⚁","⚂","⚃","⚄","⚅"];
const TYPES = [
 ["start","🚩","Start"],["coin","🪙","Münzfund"],["normal","🌿","Wiese"],["game","🎮","Minispiel"],
 ["normal","🌴","Palmenpfad"],["luck","🎁","Überraschung"],["normal","🍍","Ananasfeld"],["coin","🪙","Münzfund"],
 ["game","🎮","Minispiel"],["normal","🐚","Muschelstrand"],["shop","🛒","Shop"],["normal","🌿","Wiese"],
 ["luck","🎁","Überraschung"],["game","🎮","Minispiel"],["normal","🌺","Blumenfeld"],["coin","🪙","Münzfund"],
 ["normal","🦜","Papageienpfad"],["shop","🛒","Shop"],["game","🎮","Minispiel"],["luck","🎁","Überraschung"],
 ["normal","🌴","Palmenpfad"],["coin","🪙","Münzfund"],["game","🎮","Minispiel"],["normal","🏝️","Inselpfad"]
];
// 24 spaces arranged as a continuous rectangular spiral-like path around the center.
const CELLS = [[0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[1,6],[2,6],[3,6],[4,6],[5,6],[6,6],[6,5],[6,4],[6,3],[6,2],[6,1],[6,0],[5,0],[4,0],[3,0],[2,0],[1,0]];
const playerDefaults = () => EMOJIS.map((avatar,i)=>({name:`Spieler ${i+1}`,avatar,color:COLORS[i],pos:0,coins:10,stars:0}));
let players = playerDefaults(), current=0, round=1, busy=false, gameOver=false, soundOn=true, starPos=12, lastRoll=0, pending=null, reactionTimer=null, reactionStart=0, memoryState=null, activeMinigame=null;
const logItems=[];
const rnd = n => Math.floor(Math.random()*n);
const randomInt=(min,max)=>Math.floor(Math.random()*(max-min+1))+min;
const mod=(n,m)=>((n%m)+m)%m;
function beep(freq=440,duration=.08){if(!soundOn)return;try{const ctx=new (window.AudioContext||window.webkitAudioContext)();const o=ctx.createOscillator(),g=ctx.createGain();o.type="sine";o.frequency.value=freq;g.gain.value=.035;o.connect(g);g.connect(ctx.destination);o.start();g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+duration);o.stop(ctx.currentTime+duration);o.onended=()=>ctx.close()}catch(e){}}
function addLog(icon,html){logItems.unshift({icon,html});logItems.splice(7);renderLog()}
function renderLog(){$("eventLog").innerHTML=logItems.map(x=>`<div class="log-item"><div class="log-icon">${x.icon}</div><div>${x.html}</div></div>`).join("")}
function renderBoard(){
 const board=$("board");board.innerHTML="";
 TYPES.forEach((t,i)=>{const el=document.createElement("div");el.className=`space ${t[0]}${starPos===i?" star-here":""}`;el.style.gridRow=CELLS[i][0]+1;el.style.gridColumn=CELLS[i][1]+1;el.innerHTML=`<span class="space-number">${i+1}</span><span class="space-icon">${t[1]}</span>`;
 if(starPos===i)el.insertAdjacentHTML("beforeend",'<span class="star-marker">⭐</span>');
 const here=players.map((p,idx)=>({p,idx})).filter(x=>x.p.pos===i);if(here.length){const tokens=document.createElement("div");tokens.className="tokens";tokens.innerHTML=here.map(x=>`<span class="token" title="${escapeHtml(x.p.name)}" style="background:${x.p.color}">${x.p.avatar}</span>`).join("");el.appendChild(tokens)}
 board.appendChild(el)});
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function renderPlayers(){
 const p=players[current];$("activeAvatar").textContent=p.avatar;$("activeAvatar").style.background=`${p.color}28`;$("activeAvatar").style.borderColor=p.color;
 $("activeName").textContent=p.name;$("activeCoins").textContent=p.coins;$("activeStars").textContent=p.stars;$("activePosition").textContent=p.pos===0?"START":p.pos+1;
 $("activeStatus").textContent=busy?"Zug läuft …":gameOver?"Spiel beendet":"Du bist dran!";
 $("roundLabel").textContent=`Runde ${Math.min(round,20)} / 20`;
 $("playerList").innerHTML=players.map((x,i)=>`<div class="player-row ${i===current&&!gameOver?"active":""}"><div class="avatar" style="background:${x.color}25;border-color:${x.color}">${x.avatar}</div><div class="row-name">${escapeHtml(x.name)}</div><div class="row-score"><b>⭐ ${x.stars}</b>${x.coins} 🪙</div></div>`).join("");
 $("rollBtn").disabled=busy||gameOver;$("rollBtn").innerHTML=busy?'<span>⏳</span> Zug läuft … <span class="button-arrow">…</span>':'<span>🎲</span> Würfeln <span class="button-arrow">→</span>';
 renderBoard();
}
function chooseNewStarPos(){
 const occupied=new Set(players.map(p=>p.pos));const choices=TYPES.map((t,i)=>i).filter(i=>i!==starPos&&!occupied.has(i)&&["normal","coin","game","luck","shop"].includes(TYPES[i][0]));
 starPos=choices.length?choices[rnd(choices.length)]:mod(starPos+randomInt(3,9),TYPES.length);
 addLog("⭐",`Der Stern ist weitergezogen – jetzt auf Feld <b>${starPos+1}</b>.`);
}
function movePlayer(p,steps){
 let bought=false;
 for(let k=0;k<steps;k++){
  const old=p.pos;p.pos=mod(p.pos+1,TYPES.length);
  if(p.pos===0){p.coins+=5;addLog("🏁",`<b>${escapeHtml(p.name)}</b> ist über START und erhält 5 Münzen.`)}
  if(p.pos===starPos&&!bought&&p.coins>=20){
   p.coins-=20;p.stars++;bought=true;beep(880,.14);addLog("⭐",`<b>${escapeHtml(p.name)}</b> sammelt den Stern beim Vorbeilaufen! −20 Münzen, +1 Stern.`);chooseNewStarPos();
  } else if(p.pos===starPos&&!bought&&p.coins<20){
   addLog("⭐",`<b>${escapeHtml(p.name)}</b> läuft am Stern vorbei, hat aber nicht genug Münzen (braucht 20).`);bought=true;
  }
 }
}
function roll(){
 if(busy||gameOver)return;busy=true;const p=players[current];renderPlayers();$("diceTitle").textContent="Der Würfel rollt …";$("diceText").textContent="Mal sehen, was passiert.";const dice=$("dice");dice.classList.add("rolling");let n=0;const interval=setInterval(()=>{dice.textContent=DICE[rnd(6)];n++;if(n>=9){clearInterval(interval);lastRoll=randomInt(1,6);dice.textContent=DICE[lastRoll-1];dice.classList.remove("rolling");beep(540,.09);$("diceTitle").textContent=`Eine ${lastRoll}!`;$("diceText").textContent=`${p.name} zieht ${lastRoll} Felder weiter.`;movePlayer(p,lastRoll);renderPlayers();addLog("🎲",`<b>${escapeHtml(p.name)}</b> würfelt eine <b>${lastRoll}</b>.`);setTimeout(()=>resolveSpace(p),550)}},65);
}
function resolveSpace(p){
 if(gameOver)return;const type=TYPES[p.pos][0];busy=false;
 switch(type){
  case "start":p.coins+=3;addLog("🚩",`Startbonus: <b>${p.name}</b> erhält 3 Münzen.`);finishTurn();break;
  case "coin":{const amount=randomInt(4,10);p.coins+=amount;addLog("🪙",`Münzfund! <b>${p.name}</b> findet ${amount} Münzen.`);showOutcome("🪙","Münzfund!",`Du findest ${amount} Münzen auf dem Weg.`,()=>finishTurn());break}
  case "game":launchMinigame();break;
  case "luck":luckEvent(p);break;
  case "shop":shopEvent(p);break;
  default:if(Math.random()<.32){const amt=3;p.coins+=amt;addLog("🌿",`Kleiner Bonus: <b>${p.name}</b> findet ${amt} Münzen.`);showOutcome("🌿","Glück gehabt!",`Du findest ${amt} Münzen auf dem Weg.`,()=>finishTurn())}else{showOutcome(TYPES[p.pos][1],TYPES[p.pos][2],`Nichts explodiert. Noch nicht. Der nächste Spieler ist gleich dran.`,()=>finishTurn())}
 }
 renderPlayers();
}
function luckEvent(p){
 const events=[
  {icon:"🎁",title:"Schatzkiste!",text:"Du findest 8 Münzen.",run:()=>p.coins+=8},
  {icon:"🦀",title:"Krabbensteuer!",text:"Eine freche Krabbe klaut dir 4 Münzen.",run:()=>p.coins=Math.max(0,p.coins-4)},
  {icon:"🌈",title:"Regenbogenbonus!",text:"Alle jubeln – du bekommst 5 Münzen.",run:()=>p.coins+=5},
  {icon:"🌀",title:"Rutschiger Pfad!",text:"Du verlierst 2 Münzen, aber bleibst im Rennen.",run:()=>p.coins=Math.max(0,p.coins-2)},
  {icon:"🎲",title:"Doppeltes Glück!",text:"Du würfelst nochmal und erhältst so viele Münzen.",run:()=>p.coins+=randomInt(1,6)},
  {icon:"🧭",title:"Geheime Abkürzung!",text:"Du bekommst 3 Münzen für deine Entdeckung.",run:()=>p.coins+=3}
 ];
 const e=events[rnd(events.length)];e.run();addLog(e.icon,`<b>${escapeHtml(p.name)}</b>: ${e.title} ${e.text}`);showOutcome(e.icon,e.title,e.text,()=>finishTurn());
}
function shopEvent(p){
 const can=p.coins>=10;
 openModal(`<div class="modal-hero">🛒</div><div class="modal-kicker">INSEL-SHOP</div><h2>Shop-Stopp!</h2><p>Du hast <b>${p.coins} Münzen</b>. Kauf dir einen Vorteil oder spar für den Stern.</p><div class="choice-grid"><button class="choice-card" id="buyCoins"><div>🍌</div><strong>Glücksbanane · 10 🪙</strong><span>Erhalte sofort 8 Münzen zurück. (Spaßkauf!)</span></button><button class="choice-card" id="buyBoost"><div>🚀</div><strong>Turbo · 8 🪙</strong><span>Erhalte 5 Bonusmünzen.</span></button><button class="choice-card" id="skipShop"><div>💰</div><strong>Weiter sparen</strong><span>Deine Münzen bleiben bei dir.</span></button><button class="choice-card" id="shopStar"><div>⭐</div><strong>Stern sparen</strong><span>Ein Stern kostet 20 Münzen.</span></button></div>`);
 $("buyCoins").disabled=p.coins<10;$("buyBoost").disabled=p.coins<8;
 $("buyCoins").onclick=()=>{p.coins-=10;p.coins+=18;addLog("🍌",`<b>${p.name}</b> kauft eine Glücksbanane und bekommt 8 Münzen zurück.`);renderPlayers();showOutcome("🍌","Guter Deal?","Du hast 10 ausgegeben und 18 zurückbekommen. Die Inselökonomie ist seltsam.",finishTurn)};
 $("buyBoost").onclick=()=>{p.coins-=8;p.coins+=5;addLog("🚀",`<b>${p.name}</b> kauft einen Turbo für 8 Münzen und erhält 5 zurück.`);renderPlayers();showOutcome("🚀","Turbo aktiviert!","Der Turbo gibt dir 5 Bonusmünzen zurück.",finishTurn)};
 $("skipShop").onclick=()=>{closeModal();finishTurn()};$("shopStar").onclick=()=>{closeModal();showOutcome("⭐","Stern im Blick","Sammle 20 Münzen und überquere das Sternenfeld, um einen Stern zu bekommen.",finishTurn)};
}
function showOutcome(icon,title,text,callback){openModal(`<div class="modal-hero">${icon}</div><div class="modal-kicker">INSEL-EVENT</div><h2>${title}</h2><p>${text}</p><div class="modal-actions"><button class="primary-button small" id="outcomeContinue">Weiter →</button></div>`);$("outcomeContinue").onclick=()=>{closeModal();callback&&callback()}}
function finishTurn(){
 closeModal();busy=false;renderPlayers();
 if(round>=20&&current===players.length-1){endGame();return}
 current++;if(current>=players.length){current=0;round++;if(round>20){endGame();return}}
 $("diceTitle").textContent="Würfel bereit?";$("diceText").textContent="Würfle und entdecke dein Feld.";$("turnHint").textContent=`Als Nächstes: ${players[current].name}`;renderPlayers();
}
function endGame(){
 gameOver=true;busy=false;const sorted=[...players].sort((a,b)=>b.stars-a.stars||b.coins-a.coins);const winner=sorted[0];renderPlayers();addLog("🏆",`Spielende! <b>${escapeHtml(winner.name)}</b> gewinnt mit ${winner.stars} Sternen.`);
 openModal(`<div class="confetti">🎉 ⭐ 🏆</div><div class="modal-kicker">SPIEL BEENDET · 20 RUNDEN</div><h2>${escapeHtml(winner.name)} gewinnt!</h2><p>Die Insel hat entschieden. Die meisten Sterne gewinnen; bei Gleichstand zählen die Münzen.</p><div class="result-score"><div><strong>⭐ ${winner.stars}</strong><span>Sterne</span></div><div><strong>🪙 ${winner.coins}</strong><span>Münzen</span></div></div><div class="player-list">${sorted.map((p,i)=>`<div class="player-row"><div class="row-name">${i+1}. ${p.avatar} ${escapeHtml(p.name)}</div><div class="row-score"><b>⭐ ${p.stars}</b>${p.coins} 🪙</div></div>`).join("")}</div><div class="modal-actions"><button class="primary-button small" id="playAgain">↻ Nochmal spielen</button></div>`);
 $("playAgain").onclick=()=>newGame(true);
}
function openModal(html){$("modalContent").innerHTML=html;$("overlay").classList.remove("hidden")}
function closeModal(){ $("overlay").classList.add("hidden"); }
function launchMinigame(){
 const games=[
  {name:"Blitz-Rechnen",icon:"🧠",desc:"Löse die Rechenaufgabe schneller als die Inselkrabbe.",fn:mathGame},
  {name:"Höher oder tiefer?",icon:"🃏",desc:"Schätze, ob die nächste Zahl höher oder tiefer ist.",fn:higherLowerGame},
  {name:"Reaktions-Check",icon:"⚡",desc:"Warte auf Grün und tippe so schnell du kannst.",fn:reactionGame},
  {name:"Insel-Memory",icon:"🧩",desc:"Finde zwei gleiche Symbole im Memory.",fn:memoryGame},
  {name:"Zielzahl",icon:"🎯",desc:"Tippe die richtige Antwort auf eine kurze Schätzfrage.",fn:targetGame},
  {name:"Tasten-Tornado",icon:"💥",desc:"Drücke den Button so oft wie möglich in 5 Sekunden.",fn:buttonMashGame}
 ];
 const g=games[rnd(games.length)];activeMinigame=g;addLog("🎮",`<b>${players[current].name}</b> startet das Minispiel <b>${g.name}</b>.`);
 openModal(`<div class="modal-hero">${g.icon}</div><div class="modal-kicker">MINISPIEL</div><h2>${g.name}</h2><p>${g.desc}</p><div class="modal-actions"><button class="primary-button small" id="startMini">Los geht's! →</button><button class="secondary-button" id="skipMini">Überspringen</button></div>`);
 $("startMini").onclick=()=>g.fn();$("skipMini").onclick=()=>{closeModal();finishTurn()};
}
function miniResult(title,success,detail,reward){const p=players[current];const amount=success?reward:2;p.coins+=amount;addLog(success?"🏆":"🎮",`<b>${escapeHtml(p.name)}</b> ${success?"gewinnt":"spielt"} das Minispiel: ${success?`+${amount} Münzen`:`+${amount} Trostmünzen`}.`);openModal(`<div class="modal-hero">${success?"🏆":"🙌"}</div><div class="modal-kicker">MINISPIEL BEENDET</div><h2>${title}</h2><p>${detail}</p><div class="result-score"><div><strong>+${amount} 🪙</strong><span>${success?"Belohnung":"Trostpreis"}</span></div></div><div class="modal-actions"><button class="primary-button small" id="miniContinue">Weiter →</button></div>`);$("miniContinue").onclick=()=>{closeModal();finishTurn()};renderPlayers()}
function mathGame(){
 const a=randomInt(4,18),b=randomInt(2,12),op=Math.random()<.5?"+":"×",answer=op==="+"?a+b:a*b;const opts=new Set([answer]);while(opts.size<4)opts.add(answer+randomInt(-8,8));const list=[...opts].sort(()=>Math.random()-.5);
 openModal(`<div class="modal-kicker">MINISPIEL 1/6 · BLITZ-RECHNEN</div><h2>Was ist ${a} ${op} ${b}?</h2><p>Richtige Antwort bringt 8 Münzen. Falsch? Du bekommst 2 Trostmünzen.</p><div class="answer-row">${list.map(n=>`<button class="answer-btn" data-answer="${n}">${n}</button>`).join("")}</div>`);document.querySelectorAll("[data-answer]").forEach(btn=>btn.onclick=()=>miniResult("Blitz-Rechnen",Number(btn.dataset.answer)===answer,Number(btn.dataset.answer)===answer?"Sauber gerechnet!":"Knapp daneben. Nächstes Mal klappt's.",8));
}
function higherLowerGame(){
 const a=randomInt(2,9),b=randomInt(1,10),actual=randomInt(1,10),correct=actual>a?"höher":actual<a?"tiefer":"gleich";
 openModal(`<div class="modal-kicker">MINISPIEL 2/6 · HÖHER ODER TIEFER</div><h2>Welche Zahl kommt als Nächstes?</h2><p>Die aktuelle Zahl ist:</p><div class="big-number">${a}</div><p>Ist die geheime nächste Zahl höher, tiefer oder gleich?</p><div class="answer-row"><button class="answer-btn" data-hl="höher">⬆ Höher</button><button class="answer-btn" data-hl="tiefer">⬇ Tiefer</button><button class="answer-btn" data-hl="gleich">＝ Gleich</button></div>`);
 document.querySelectorAll("[data-hl]").forEach(btn=>btn.onclick=()=>miniResult("Höher oder tiefer?",btn.dataset.hl===correct,`Die Zahl war ${actual}. ${btn.dataset.hl===correct?"Gute Intuition!":"Das war ein Bluff der Insel."}`,8));
}
function reactionGame(){
 openModal(`<div class="modal-kicker">MINISPIEL 3/6 · REAKTIONS-CHECK</div><h2>Finger am Start!</h2><p>Tippe erst, wenn der Button grün wird. Zu früh gedrückt? Dann gibt's den Trostpreis.</p><button id="reactionPad" class="reaction-pad">Warte auf GRÜN …</button><p id="reactionText">Bereit machen …</p>`);
 const pad=$("reactionPad"),txt=$("reactionText");let started=false,done=false;const delay=randomInt(1400,3500);
 reactionTimer=setTimeout(()=>{if(!pad.isConnected)return;started=true;reactionStart=performance.now();pad.classList.add("go");pad.textContent="JETZT!";txt.textContent="Los!";beep(700,.12)},delay);
 pad.onclick=()=>{if(done)return;done=true;clearTimeout(reactionTimer);if(!started){miniResult("Zu früh!",false,"Geduld ist auch eine Fähigkeit. Du hast vor dem Signal getippt.",8);return}const ms=Math.round(performance.now()-reactionStart);miniResult("Reaktionszeit",ms<650,`Du hast ${ms} ms gebraucht. ${ms<650?"Blitzschnell!":"Übung macht den Meister."}`,8)};
}
function memoryGame(){
 const faces=["🐚","🍍","🦀","🌴","🐠","⭐","🍉","🦜"];const deck=[...faces,...faces].sort(()=>Math.random()-.5);memoryState={deck,flipped:[],matched:[],moves:0,done:false};
 openModal(`<div class="modal-kicker">MINISPIEL 4/6 · INSEL-MEMORY</div><h2>Finde die Paare!</h2><p>Finde alle 8 Paare. Du bekommst 8 Münzen, wenn du es in höchstens 12 Zügen schaffst.</p><div class="memory-grid" id="memoryGrid">${deck.map((_,i)=>`<button class="memory-card" data-card="${i}">?</button>`).join("")}</div><p id="memoryStatus">Züge: 0</p>`);
 document.querySelectorAll("[data-card]").forEach(btn=>btn.onclick=()=>flipMemory(Number(btn.dataset.card)));
}
function flipMemory(i){
 const s=memoryState;if(!s||s.done||s.flipped.includes(i)||s.matched.includes(i))return;
 s.flipped.push(i);const b=document.querySelector(`[data-card="${i}"]`);b.textContent=s.deck[i];b.classList.add("revealed");
 if(s.flipped.length===2){s.moves++;$("memoryStatus").textContent=`Züge: ${s.moves}`;const [a,c]=s.flipped;if(s.deck[a]===s.deck[c]){s.matched.push(a,c);s.flipped=[];if(s.matched.length===16){s.done=true;setTimeout(()=>miniResult("Memory-Meister!",s.moves<=12,`Du hast alle Paare in ${s.moves} Zügen gefunden.`,8),350)}}else{setTimeout(()=>{s.flipped.forEach(n=>{const el=document.querySelector(`[data-card="${n}"]`);if(el){el.textContent="?";el.classList.remove("revealed")}});s.flipped=[]},700)}}
}
function targetGame(){
 const questions=[
  {q:"Wie viele Seiten hat ein Würfel?",a:6,opts:[4,6,8,12]},
  {q:"Wie viele Minuten hat eine Stunde?",a:60,opts:[30,45,60,90]},
  {q:"Wie viele Beine haben 3 Krabben zusammen?",a:18,opts:[12,15,18,21]},
  {q:"Wie viele Felder hat dieses Spielbrett?",a:24,opts:[20,22,24,30]},
  {q:"Wie viele Tage hat eine Woche?",a:7,opts:[5,6,7,8]}
 ];const q=questions[rnd(questions.length)];
 openModal(`<div class="modal-kicker">MINISPIEL 5/6 · ZIELZAHL</div><h2>${q.q}</h2><p>Wähle die richtige Antwort.</p><div class="answer-row">${q.opts.map(n=>`<button class="answer-btn" data-target="${n}">${n}</button>`).join("")}</div>`);
 document.querySelectorAll("[data-target]").forEach(btn=>btn.onclick=()=>miniResult("Zielzahl",Number(btn.dataset.target)===q.a,Number(btn.dataset.target)===q.a?"Volltreffer!":"Leider falsch – die Insel hat aufgepasst.",8));
}
function buttonMashGame(){
 openModal(`<div class="modal-kicker">MINISPIEL 6/6 · TASTEN-TORNADO</div><h2>Drück wie verrückt!</h2><p>Du hast 5 Sekunden. Schaffst du mindestens 15 Klicks?</p><div class="big-number" id="mashCount">0</div><div class="progress-track"><div class="progress-fill" id="mashProgress"></div></div><button class="primary-button" id="mashButton">💥 DRÜCK MICH!</button><p id="mashTime">Zeit: 5.0 s</p>`);
 let count=0,left=5;const btn=$("mashButton"),counter=$("mashCount"),progress=$("mashProgress"),time=$("mashTime");btn.onclick=()=>{if(left<=0)return;count++;counter.textContent=count;progress.style.width=Math.min(100,count/15*100)+"%";beep(300+count*10,.025)};
 const start=performance.now();const timer=setInterval(()=>{left=Math.max(0,5-(performance.now()-start)/1000);time.textContent=`Zeit: ${left.toFixed(1)} s`;if(left<=0){clearInterval(timer);btn.disabled=true;miniResult("Tasten-Tornado",count>=15,`Du hast ${count} Mal gedrückt. ${count>=15?"Die Finger sind aus Stahl!":"Du brauchst mehr Chaos-Energie."}`,8)}},80);
}
function newGame(showSetup=false){
 clearTimeout(reactionTimer);players=playerDefaults();current=0;round=1;busy=false;gameOver=false;starPos=12;lastRoll=0;logItems.length=0;renderLog();addLog("🏝️","Willkommen auf der Insel! Jeder startet mit 10 Münzen.");renderPlayers();$("dice").textContent="⚀";$("diceTitle").textContent="Würfel bereit?";$("diceText").textContent="Würfle und entdecke dein Feld.";$("turnHint").textContent="Jeder Zug kann alles ändern.";closeModal();if(showSetup)setupGame();
}
function setupGame(){
 openModal(`<div class="modal-hero">🏝️</div><div class="modal-kicker">NEUES ABENTEUER</div><h2>Wer ist dabei?</h2><p>Gebt eure Namen ein und wählt eure Figuren. Jeder startet mit 10 Münzen. Der Stern kostet 20 Münzen.</p><div class="setup-grid">${players.map((p,i)=>`<div class="setup-player"><span>${p.avatar}</span><input id="name${i}" maxlength="16" value="${escapeHtml(p.name)}" aria-label="Name Spieler ${i+1}"><select id="avatar${i}" aria-label="Figur Spieler ${i+1}">${EMOJIS.map(e=>`<option ${e===p.avatar?"selected":""}>${e}</option>`).join("")}</select></div>`).join("")}</div><div class="modal-actions"><button class="primary-button small" id="saveSetup">Los geht's! →</button></div>`);
 $("saveSetup").onclick=()=>{const used=[];players.forEach((p,i)=>{p.name=$(`name${i}`).value.trim()||`Spieler ${i+1}`;p.avatar=$(`avatar${i}`).value;if(used.includes(p.avatar)){p.avatar=EMOJIS.find(e=>!used.includes(e))||p.avatar}$("activeAvatar").textContent=p.avatar;used.push(p.avatar)});closeModal();renderPlayers();addLog("🎉","Die Crew steht. Das Inselchaos beginnt!");};
}
$("rollBtn").addEventListener("click",roll);
$("rulesBtn").addEventListener("click",()=>openModal(`<div class="modal-hero">📜</div><div class="modal-kicker">SPIELREGELN</div><h2>So läuft Inselchaos</h2><ul class="rules-list"><li>Vier Personen spielen gemeinsam an einem Gerät und sind reihum dran.</li><li>Würfle und ziehe die gewürfelte Zahl an Feldern weiter.</li><li>Beim Überqueren von START gibt es 5 Münzen.</li><li>Wenn du das Sternenfeld auf deinem Weg überquerst, kaufst du bei mindestens 20 Münzen automatisch einen Stern. Du musst nicht genau darauf landen.</li><li>Nach dem Kauf zieht der Stern auf ein zufälliges anderes Feld, möglichst nicht auf einem Spieler.</li><li>Minispiele bringen 8 Münzen für einen Sieg und 2 Münzen Trostpreis.</li><li>Nach 20 Runden gewinnt, wer die meisten Sterne hat. Bei Gleichstand zählen die Münzen.</li></ul><div class="modal-actions"><button class="primary-button small" id="rulesOk">Alles klar!</button></div>`)); 
$("soundBtn").addEventListener("click",()=>{soundOn=!soundOn;$("soundBtn").textContent=soundOn?"♫":"🔇";addLog("🔊",`Sound ${soundOn?"aktiviert":"deaktiviert"}.`);beep(500,.08)});
$("restartBtn").addEventListener("click",()=>openModal(`<div class="modal-hero">🔄</div><h2>Neues Spiel starten?</h2><p>Der aktuelle Spielstand geht verloren.</p><div class="modal-actions"><button class="primary-button small" id="confirmRestart">Ja, neu starten</button><button class="secondary-button" id="cancelRestart">Doch nicht</button></div>`));
$("overlay").addEventListener("click",e=>{if(e.target===$("overlay")&&!busy)closeModal()});
$("closeModal").addEventListener("click",closeModal);
document.addEventListener("click",e=>{if(e.target&&e.target.id==="rulesOk")closeModal();if(e.target&&e.target.id==="confirmRestart")newGame(true);if(e.target&&e.target.id==="cancelRestart")closeModal()});
newGame(false);setTimeout(()=>setupGame(),250);
})();