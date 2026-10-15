const players = [
  {name:"Spieler 1", color:"red", avatar:"🚀", pos:0, coins:10, stars:0},
  {name:"Spieler 2", color:"blue", avatar:"🦊", pos:0, coins:10, stars:0},
  {name:"Spieler 3", color:"green", avatar:"🐸", pos:0, coins:10, stars:0},
  {name:"Spieler 4", color:"gold", avatar:"🐲", pos:0, coins:10, stars:0}
];
const coords = [
 [9,82],[16,76],[22,84],[29,76],[36,83],[43,77],[50,83],[57,73],[64,77],[70,67],
 [78,72],[84,63],[89,54],[83,47],[75,51],[69,43],[61,48],[54,42],[47,50],[40,43],
 [33,48],[25,44],[18,48],[13,38],[17,29],[25,32],[33,28],[39,22],[47,29],[54,25],
 [59,17],[66,25],[73,30],[80,26],[86,36],[79,40],[71,36],[63,35],[58,28],[50,19]
];
const types = ["green","blue","blue","yellow","blue","red","blue","purple","blue","green","blue","yellow","red","blue","purple","blue","yellow","green","blue","red","blue","yellow","blue","purple","blue","green","blue","yellow","red","blue","purple","blue","yellow","green","blue","red","blue","purple","blue","yellow"];
const icons = {blue:"●",yellow:"?",red:"!",green:"✦",purple:"?"};
let current = 0, round = 1, rolled = false, rollValue = 0;
const $ = id => document.getElementById(id);
const spacesEl = $("spaces");
coords.forEach((p,i)=>{
  const el=document.createElement("div"); el.className=`space ${types[i]}`; el.style.left=p[0]+"%";el.style.top=p[1]+"%";el.dataset.index=i;el.textContent=icons[types[i]];
  spacesEl.appendChild(el);
});
function render(){
  $("round").textContent=`${round} / 20`;
  $("turnCount").textContent=`Spieler ${current+1} von 4`;
  $("currentName").textContent=players[current].name;
  $("currentAvatar").textContent=players[current].avatar;
  $("currentAvatar").className=`avatar ${players[current].color}-avatar`;
  $("currentHint").textContent=rolled?"Zug abgeschlossen – bereit?":"Dein Zug. Würfel und los!";
  $("rollBtn").disabled=rolled;
  $("endBtn").disabled=!rolled;
  $("playerList").innerHTML=players.map((p,i)=>`<div class="player-row ${i===current?"active":""}">
    <div class="mini-avatar ${p.color}-avatar">${p.avatar}</div>
    <div class="player-info">${p.name}<small>${i===current?"JETZT AM ZUG":"INSEL-ABENTEURER"}</small></div>
    <div class="stats"><span>⭐ ${p.stars}</span><span>🪙 ${p.coins}</span></div>
  </div>`).join("");
  document.querySelectorAll(".token").forEach(n=>n.remove());
  players.forEach((p,i)=>{
    const c=coords[p.pos];const t=document.createElement("div");t.className="token";t.textContent=p.avatar;t.style.left=c[0]+"%";t.style.top=(c[1]-2-i*1.8)+"%";t.title=p.name; $("board").appendChild(t);
  });
  document.querySelectorAll(".space").forEach((el,i)=>el.classList.toggle("current",players.some(p=>p.pos===i)));
}
function eventFor(p){
  const type=types[p.pos];
  if(type==="blue"){p.coins+=3;showEvent("🪙","MÜNZENFUND","+3 Münzen!","Du findest ein paar glänzende Münzen am Wegesrand.");}
  else if(type==="yellow"){const gain=Math.random()<.5?5:0;p.coins+=gain;showEvent("🎲","GLÜCKSFELD",gain?"+5 Münzen!":"Knapp daneben! ",gain?"Das Glück ist auf deiner Seite.":"Diesmal gab es leider keinen Bonus.");}
  else if(type==="red"){showEvent("🎯","MINISPIEL","Zeit für Action!","Hier starten später unsere eigenen Minispiele – Zeichnen, kreative Antworten und schnelle Duelle. Für diesen Prototyp erhältst du 2 Münzen als Teilnahmebonus.");p.coins+=2;}
  else if(type==="green"){p.coins+=2;showEvent("✨","SPEZIALFELD","+2 Münzen!","Ein freundlicher Inselgeist belohnt dich.");}
  else{if(p.coins>=3&&Math.random()<.5){p.coins-=3;p.coins+=7;showEvent("🌀","WIRBELPORTAL","+4 Münzen netto!","Das Portal hat deine Münzen durcheinandergewirbelt – und vermehrt.");}else{p.coins+=1;showEvent("❓","GEHEIMNISFELD","+1 Münze","Ein kleines Geheimnis, ein kleiner Gewinn.");}}
}
function showEvent(icon,eyebrow,title,desc){$("dialogIcon").textContent=icon;$("dialogEyebrow").textContent=eyebrow;$("dialogTitle").textContent=title;$("dialogText").textContent=desc;$("eventDialog").showModal();}
$("rollBtn").addEventListener("click",()=>{
  rollValue=1+Math.floor(Math.random()*6);$("diceFace").textContent=["","⚀","⚁","⚂","⚃","⚄","⚅"][rollValue];
  const p=players[current];p.pos=(p.pos+rollValue)%coords.length;rolled=true;
  eventFor(p);
  $("status").textContent=`${p.name} würfelt eine ${rollValue} und zieht ${rollValue} Felder weiter.`;
  render();
});
$("dialogButton").addEventListener("click",()=> $("eventDialog").close());
$("endBtn").addEventListener("click",()=>{
  if(!rolled)return;
  current=(current+1)%players.length;
  if(current===0){round++;if(round>20){const sorted=[...players].sort((a,b)=>b.stars-a.stars||b.coins-a.coins);$("dialogIcon").textContent="🏆";$("dialogEyebrow").textContent="DAS ABENTEUER IST VORBEI";$("dialogTitle").textContent=`${sorted[0].name} gewinnt!`;$("dialogText").textContent=`Endstand: ${sorted.map((p,i)=>`${i+1}. ${p.name}: ${p.stars} Sterne, ${p.coins} Münzen`).join(" · ")}. Im nächsten Ausbau ergänzen wir Sternenkauf und echte Minispiele.`;$("dialogButton").textContent="Neue Runde";$("eventDialog").showModal();round=20;return;}}
  rolled=false;$("diceFace").textContent="🎲";$("status").textContent=`Jetzt ist ${players[current].name} dran.`;render();
});
$("eventDialog").addEventListener("close",()=>{if($("dialogButton").textContent==="Neue Runde"){players.forEach(p=>{p.pos=0;p.coins=10;p.stars=0});current=0;round=1;rolled=false;$("dialogButton").textContent="Weiter geht's";$("diceFace").textContent="🎲";render();}});
render();