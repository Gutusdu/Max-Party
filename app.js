// Patch 2: 24 Felder werden direkt auf einer einzigen SVG-Route positioniert.
// Die SVG-Route und die Feldpositionen nutzen dieselbe 1000x600-Koordinatenfläche.
const players=[
{name:"Spieler 1",color:"red",avatar:"🚀",pos:0,coins:10,stars:0},
{name:"Spieler 2",color:"blue",avatar:"🦊",pos:0,coins:10,stars:0},
{name:"Spieler 3",color:"green",avatar:"🐸",pos:0,coins:10,stars:0},
{name:"Spieler 4",color:"gold",avatar:"🐲",pos:0,coins:10,stars:0}
];
const route=[
[90,490],[158,458],[250,450],[320,410],[390,430],[470,465],
[550,420],[620,380],[690,405],[770,430],[850,380],[880,315],
[840,245],[770,195],[700,220],[620,235],[540,180],[465,135],
[390,170],[310,195],[230,160],[145,170],[120,220],[185,290]
];
const types=["green","blue","blue","yellow","blue","red","blue","purple","blue","green","blue","yellow","red","blue","purple","blue","yellow","green","blue","red","blue","yellow","blue","purple"];
const icons={blue:"●",yellow:"?",red:"!",green:"✦",purple:"?"};
let current=0,round=1,rolled=false;
const $=id=>document.getElementById(id);
const spacesEl=$("spaces");
route.forEach((point,i)=>{
 const el=document.createElement("div");el.className=`space ${types[i]}`;el.style.left=(point[0]/10)+"%";el.style.top=(point[1]/6)+"%";el.dataset.index=i;el.textContent=icons[types[i]];spacesEl.appendChild(el);
});
function render(){
 $("round").textContent=`${round} / 20`;$("turnCount").textContent=`Spieler ${current+1} von 4`;$("currentName").textContent=players[current].name;
 $("currentAvatar").textContent=players[current].avatar;$("currentAvatar").className=`avatar ${players[current].color}-avatar`;
 $("currentHint").textContent=rolled?"Zug abgeschlossen – bereit?":"Dein Zug. Würfel und los!";$("rollBtn").disabled=rolled;$("endBtn").disabled=!rolled;
 $("playerList").innerHTML=players.map((p,i)=>`<div class="player-row ${i===current?"active":""}"><div class="mini-avatar ${p.color}-avatar">${p.avatar}</div><div class="player-info">${p.name}<small>${i===current?"JETZT AM ZUG":"INSEL-ABENTEURER"}</small></div><div class="stats"><span>⭐ ${p.stars}</span><span>🪙 ${p.coins}</span></div></div>`).join("");
 document.querySelectorAll(".token").forEach(n=>n.remove());
 players.forEach((p,i)=>{const c=route[p.pos];const t=document.createElement("div");t.className="token";t.textContent=p.avatar;t.style.left=(c[0]/10)+"%";t.style.top=(c[1]/6-2-i*2)+"%";t.title=p.name;$("board").appendChild(t);});
 document.querySelectorAll(".space").forEach((el,i)=>el.classList.toggle("current",players.some(p=>p.pos===i)));
}
function showEvent(icon,eyebrow,title,desc){$("dialogIcon").textContent=icon;$("dialogEyebrow").textContent=eyebrow;$("dialogTitle").textContent=title;$("dialogText").textContent=desc;$("eventDialog").showModal();}
function eventFor(p){const type=types[p.pos];if(type==="blue"){p.coins+=3;showEvent("🪙","MÜNZENFUND","+3 Münzen!","Du findest ein paar glänzende Münzen am Wegesrand.");}
else if(type==="yellow"){const gain=Math.random()<.5?5:0;p.coins+=gain;showEvent("🎲","GLÜCKSFELD",gain?"+5 Münzen!":"Knapp daneben!",gain?"Das Glück ist auf deiner Seite.":"Diesmal gab es leider keinen Bonus.");}
else if(type==="red"){p.coins+=2;showEvent("🎯","MINISPIEL","Zeit für Action!","Hier kommen später unsere eigenen Minispiele. Im Prototyp gibt es 2 Münzen als Teilnahmebonus.");}
else if(type==="green"){p.coins+=2;showEvent("✨","SPEZIALFELD","+2 Münzen!","Ein freundlicher Inselgeist belohnt dich.");}
else if(p.coins>=3&&Math.random()<.5){p.coins+=4;showEvent("🌀","WIRBELPORTAL","+4 Münzen netto!","Das Portal hat deine Münzen durcheinandergewirbelt – und vermehrt.");}
else{p.coins+=1;showEvent("❓","GEHEIMNISFELD","+1 Münze","Ein kleines Geheimnis, ein kleiner Gewinn.");}}
$("rollBtn").addEventListener("click",()=>{const roll=1+Math.floor(Math.random()*6);$("diceFace").textContent=["","⚀","⚁","⚂","⚃","⚄","⚅"][roll];const p=players[current];p.pos=(p.pos+roll)%route.length;rolled=true;eventFor(p);$("status").textContent=`${p.name} würfelt eine ${roll} und zieht ${roll} Felder weiter.`;render();});
$("dialogButton").addEventListener("click",()=>$("eventDialog").close());
$("endBtn").addEventListener("click",()=>{if(!rolled)return;current=(current+1)%players.length;if(current===0){round++;if(round>20){const sorted=[...players].sort((a,b)=>b.stars-a.stars||b.coins-a.coins);$("dialogIcon").textContent="🏆";$("dialogEyebrow").textContent="DAS ABENTEUER IST VORBEI";$("dialogTitle").textContent=`${sorted[0].name} gewinnt!`;$("dialogText").textContent=`Endstand: ${sorted.map((p,i)=>`${i+1}. ${p.name}: ${p.stars} Sterne, ${p.coins} Münzen`).join(" · ")}. Als Nächstes ergänzen wir Sternenkauf und echte Minispiele.`;$("dialogButton").textContent="Neue Runde";$("eventDialog").showModal();round=20;return;}}rolled=false;$("diceFace").textContent="🎲";$("status").textContent=`Jetzt ist ${players[current].name} dran.`;render();});
$("eventDialog").addEventListener("close",()=>{if($("dialogButton").textContent==="Neue Runde"){players.forEach(p=>{p.pos=0;p.coins=10;p.stars=0});current=0;round=1;rolled=false;$("dialogButton").textContent="Weiter geht's";$("diceFace").textContent="🎲";render();}});
render();