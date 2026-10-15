(() => {
  'use strict';
  const TOTAL_ROUNDS = 20;
  const STAR_COST = 20;
  const $ = id => document.getElementById(id);
  const coords = [
    [9,82],[16,76],[22,84],[29,76],[36,83],[43,77],[50,83],[57,73],
    [64,77],[70,67],[78,72],[84,63],[89,54],[83,47],[75,51],[69,43],
    [61,48],[54,42],[47,50],[40,43],[33,48],[25,44],[18,48],[13,38]
  ];
  const types = ['green','blue','blue','yellow','blue','red','blue','purple','blue','green','blue','yellow','red','blue','purple','blue','yellow','green','blue','red','blue','yellow','blue','purple'];
  const icons = {blue:'＋',yellow:'?',red:'!',green:'✦',purple:'✧'};
  const avatars = [
    {emoji:'🚀',color:'red',css:'red-avatar'},
    {emoji:'🦊',color:'blue',css:'blue-avatar'},
    {emoji:'🐸',color:'green',css:'green-avatar'},
    {emoji:'🐲',color:'gold',css:'gold-avatar'}
  ];
  const challengeCards = [
    {title:'Tiergeräusche',task:'Mache 3 Sekunden lang ein Tiergeräusch. Die anderen müssen das Tier erraten.',kind:'crew'},
    {title:'Kategorien-Blitz',task:'Nennt reihum je eine Obstsorte. Wer länger als 3 Sekunden braucht oder etwas wiederholt, verliert die Challenge.',kind:'crew'},
    {title:'Nicht lachen!',task:'Schau einer Person in die Augen und versuche 10 Sekunden lang, sie zum Lachen zu bringen. Nicht anfassen!',kind:'duel'},
    {title:'Wortkette',task:'Sagt reihum Wörter, bei denen das nächste Wort mit dem letzten Buchstaben des vorherigen beginnt. Schafft ihr 6 Wörter?',kind:'crew'},
    {title:'Wer bin ich?',task:'Denke dir eine bekannte Figur aus. Die anderen dürfen zusammen 5 Ja/Nein-Fragen stellen. Wird sie erraten?',kind:'crew'},
    {title:'Schnell zählen',task:'Nenne innerhalb von 5 Sekunden 5 Dinge, die man am Strand findet.',kind:'crew'},
    {title:'Rückwärts sprechen',task:'Sag „PartyQuest Inselchaos“ rückwärts. Die Crew entscheidet, ob es erkennbar war.',kind:'solo'},
    {title:'Reimduell',task:'Finde innerhalb von 10 Sekunden drei Wörter, die sich auf „Haus“ reimen.',kind:'solo'},
    {title:'Pantomime',task:'Stelle ohne Worte eine Sportart dar. Die Crew hat 15 Sekunden zum Raten.',kind:'crew'},
    {title:'Gedächtnis',task:'Nenne 4 Dinge, die mit dem gleichen Buchstaben anfangen – du hast 8 Sekunden.',kind:'solo'}
  ];
  let players = [];
  let current = 0;
  let round = 1;
  let rolled = false;
  let gameOver = false;
  let rollValue = 0;
  let starPos = 12;
  let dialogMode = 'event';
  let lastEvent = null;
  const $board = $('board');

  function makePlayers(names) {
    return avatars.map((a,i) => ({name:(names[i] || `Spieler ${i+1}`).trim() || `Spieler ${i+1}`, ...a, pos:0, coins:10, stars:0, turns:0}));
  }
  function setupNameFields() {
    $('nameFields').innerHTML = avatars.map((a,i) => `<div class="name-field"><label>${a.emoji}</label><input maxlength="18" id="name${i}" aria-label="Name Spieler ${i+1}" placeholder="Spieler ${i+1}" value="Spieler ${i+1}"></div>`).join('');
  }
  function drawBoard() {
    const pts = coords.map(([x,y]) => `${x*10},${y*6}`).join(' ');
    $('pathLine').setAttribute('points', pts);
    $('pathInner').setAttribute('points', pts);
    $('spaces').innerHTML = coords.map(([x,y],i) => `<div class="space ${types[i]}" data-pos="${i}" style="left:${x}%;top:${y}%" title="Feld ${i+1}: ${typeName(types[i])}">${icons[types[i]]}<span class="space-number">${i+1}</span></div>`).join('');
    renderStar();
  }
  function typeName(type) { return ({blue:'Münzfeld',yellow:'Glücksfeld',red:'Challenge',green:'Bonusfeld',purple:'Überraschung'})[type] || 'Feld'; }
  function renderStar() {
    const [x,y] = coords[starPos];
    $('starMarker').style.left = `${x}%`;
    $('starMarker').style.top = `${y}%`;
    document.querySelectorAll('.space').forEach((el,i) => {
      el.classList.toggle('has-star', i === starPos);
      el.classList.toggle('occupied', players.some(p => p.pos === i));
    });
  }
  function render() {
    if (!players.length) return;
    $('roundLabel').textContent = `${Math.min(round,TOTAL_ROUNDS)} / ${TOTAL_ROUNDS}`;
    $('turnCount').textContent = `Spieler ${current+1} von 4`;
    $('currentName').textContent = players[current].name;
    $('currentAvatar').textContent = players[current].emoji;
    $('currentAvatar').className = `avatar ${players[current].css}`;
    $('currentHint').textContent = gameOver ? 'Das Abenteuer ist vorbei.' : rolled ? 'Zug abgeschlossen – weitergeben!' : 'Dein Abenteuer wartet.';
    $('rollBtn').disabled = rolled || gameOver;
    $('nextBtn').disabled = !rolled || gameOver;
    $('playerList').innerHTML = players.map((p,i) => `<div class="player-row ${i===current?'active':''}"><div class="mini-avatar ${p.css}">${p.emoji}</div><div class="player-info"><strong>${escapeHTML(p.name)}</strong><small>${i===current?'JETZT AM ZUG':`FELD ${p.pos+1}`}</small></div><div class="stats"><span>⭐ ${p.stars}</span><span>🪙 ${p.coins}</span></div></div>`).join('');
    $('tokens').innerHTML = players.map((p,i) => {
      const [x,y] = coords[p.pos];
      const offset = (i - 1.5) * 2.2;
      return `<div class="token ${i===current?'current-token':''}" title="${escapeHTML(p.name)}" style="left:${x+offset}%;top:${y-2+offset*.25}%">${p.emoji}</div>`;
    }).join('');
    renderStar();
  }
  function escapeHTML(s) { return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function log(icon,title,detail) {
    const row = document.createElement('div'); row.className='log-entry';
    row.innerHTML = `<span>${icon}</span><p><b>${escapeHTML(title)}</b><small>${escapeHTML(detail)}</small></p>`;
    $('gameLog').prepend(row);
    while ($('gameLog').children.length > 8) $('gameLog').lastElementChild.remove();
  }
  function showDialog({icon='🎉',eyebrow='INSEL-EVENT',title='Was für ein Glück!',text='',button='Weiter geht’s',extra='',onButton=null,closeable=true}) {
    dialogMode = onButton ? 'custom' : 'event';
    $('dialogIcon').textContent = icon;
    $('dialogEyebrow').textContent = eyebrow;
    $('dialogTitle').textContent = title;
    $('dialogText').textContent = text;
    $('dialogExtra').innerHTML = extra;
    $('dialogButton').textContent = button;
    $('dialogButton').onclick = () => {
      const fn = onButton; onButton = null;
      if ($('eventDialog').open) $('eventDialog').close();
      if (fn) fn();
    };
    $('closeDialog').style.display = closeable ? 'block' : 'none';
    if (!$('eventDialog').open) $('eventDialog').showModal();
  }
  function newStar(oldPos) {
    const occupied = new Set(players.map(p=>p.pos));
    let candidates = coords.map((_,i)=>i).filter(i=>i!==oldPos && !occupied.has(i) && ['blue','green','yellow'].includes(types[i]));
    if (!candidates.length) candidates = coords.map((_,i)=>i).filter(i=>i!==oldPos && !occupied.has(i));
    if (!candidates.length) candidates = coords.map((_,i)=>i).filter(i=>i!==oldPos);
    starPos = candidates[Math.floor(Math.random()*candidates.length)];
    renderStar();
  }
  function resolveStar(p, oldPos, steps) {
    // Walk each step in order. Crossing the star buys it immediately; no landing required.
    for (let step=1; step<=steps; step++) {
      const passedPos = (oldPos + step) % coords.length;
      if (passedPos === starPos) {
        if (p.coins >= STAR_COST) {
          const boughtAt = starPos;
          p.coins -= STAR_COST; p.stars += 1;
          newStar(boughtAt);
          log('⭐', `${p.name} kauft einen Stern!`, `−${STAR_COST} Münzen · jetzt ${p.stars} Stern(e)`);
          showDialog({icon:'⭐',eyebrow:'STERN GESCHNAPPT',title:'Ein Stern gehört dir!',text:`${p.name} ist am Stern vorbeigelaufen und hat ihn automatisch für ${STAR_COST} Münzen gekauft. Der Stern ist schon weitergezogen!`,button:'Weiter',extra:`<div class="result-pill">⭐ ${p.name}: ${p.stars} Stern(e) · 🪙 ${p.coins} Münzen übrig</div>`});
          return true;
        }
        log('⭐', `${p.name} passiert den Stern`, `Noch ${STAR_COST-p.coins} Münzen bis zum Kauf.`);
        showDialog({icon:'⭐',eyebrow:'STERNENPLATZ',title:'Fast ein Stern!',text:`Du bist am Stern vorbeigelaufen, hast aber nur ${p.coins} Münzen. Du brauchst ${STAR_COST}. Der Stern bleibt vorerst dort.`,button:'Weiter'});
        return true;
      }
    }
    return false;
  }
  function finishMove(p, oldPos, steps) {
    p.pos = (oldPos + steps) % coords.length;
    p.turns++;
    render();
    const passedStar = resolveStar(p, oldPos, steps);
    if (passedStar) { render(); return; }
    doFieldEvent(p);
  }
  function doFieldEvent(p) {
    const type = types[p.pos];
    if (type==='blue') {
      const amount = 3 + (Math.random()<.18 ? 2 : 0); p.coins += amount;
      log('🪙',`${p.name} findet Münzen`,`+${amount} Münzen`);
      showDialog({icon:'🪙',eyebrow:'MÜNZENFUND',title:`+${amount} Münzen!`,text:amount===5?'Ein besonders dicker Münzbeutel lag am Weg.':'Ein paar Münzen glitzern im Sand. Ein guter Fund!',extra:scorePill(p),button:'Weiter'});
    } else if (type==='yellow') {
      const r=Math.random();
      if (r<.45) {p.coins+=5;log('🍀',`${p.name} hat Glück`,'+5 Münzen');showDialog({icon:'🍀',eyebrow:'GLÜCKSFELD',title:'Goldregen!',text:'Du hast Glück: Ein kleiner Schatz fällt dir praktisch vor die Füße.',extra:scorePill(p)});}
      else if(r<.72) {const loss=Math.min(3,p.coins);p.coins-=loss;log('🌪️',`${p.name} im Pech`,`−${loss} Münzen`);showDialog({icon:'🌪️',eyebrow:'GLÜCKSFELD',title:'Windstoß!',text:`Der Wind wirbelt deine Münzen durcheinander. Du verlierst ${loss} Münzen.`,extra:scorePill(p)});}
      else {p.coins+=2;log('🌈',`${p.name} findet einen Glücksbringer`,'+2 Münzen');showDialog({icon:'🌈',eyebrow:'GLÜCKSFELD',title:'Kleines Glück!',text:'Ein Glücksbringer bringt dir immerhin zwei Münzen.',extra:scorePill(p)});}
    } else if (type==='green') {
      p.coins+=2;log('✨',`${p.name} erhält einen Inselbonus`,'+2 Münzen');showDialog({icon:'✨',eyebrow:'INSELBONUS',title:'+2 Münzen!',text:'Der Inselgeist findet, dass du gute Laune verbreitest, und belohnt dich.',extra:scorePill(p)});
    } else if (type==='red') {
      const card=challengeCards[Math.floor(Math.random()*challengeCards.length)];
      log('🎯',`${p.name} startet eine Challenge`,card.title);
      showDialog({icon:'🎯',eyebrow:'PARTY-CHALLENGE',title:card.title,text:card.task,button:'Challenge geschafft!',extra:'<div class="choice-list"><button class="choice-button" id="challengeFail">Nicht geschafft – kein Bonus</button></div>',onButton:()=>{p.coins+=4;log('🏅',`${p.name} schafft die Challenge`,'+4 Münzen');showDialog({icon:'🏅',eyebrow:'CHALLENGE GESCHAFFT',title:'+4 Münzen!',text:'Stark! Die Crew hat die Challenge als geschafft gewertet.',extra:scorePill(p)});render();}});
      setTimeout(()=>{const fail=$('challengeFail');if(fail)fail.onclick=()=>{log('🎯',`${p.name} lässt die Challenge aus`,'Kein Bonus diesmal.');$('eventDialog').close();};},0);
    } else {
      if (p.coins>=4 && Math.random()<.45) {
        p.coins-=4; const gain=9; p.coins+=gain;log('🌀',`${p.name} nutzt das Wirbelportal`,'+5 Münzen netto');showDialog({icon:'🌀',eyebrow:'ÜBERRASCHUNG',title:'Portal-Gewinn!',text:'Das Portal nimmt vier Münzen Eintritt, spuckt aber neun wieder aus. Fünf Münzen Gewinn!',extra:scorePill(p)});
      } else if(Math.random()<.5) {
        p.coins+=1;log('🔮',`${p.name} öffnet ein Geheimnis`,'+1 Münze');showDialog({icon:'🔮',eyebrow:'ÜBERRASCHUNG',title:'Kleiner Fund',text:'Hinter dem geheimnisvollen Vorhang liegt eine Münze.',extra:scorePill(p)});
      } else {
        const target=(current+1)%players.length; const victim=players[target];
        if(victim.coins>0){victim.coins--;p.coins++;log('🦝',`${p.name} erwischt einen Münz-Dieb`,`+1 Münze von ${victim.name}`);showDialog({icon:'🦝',eyebrow:'ÜBERRASCHUNG',title:'Frecher Waschbär!',text:`Ein Waschbär klaut ${victim.name} eine Münze und steckt sie dir zu. Gemein, aber nützlich.`,extra:scorePill(p)});}
        else {p.coins+=2;log('🔮',`${p.name} findet eine Truhe`,'+2 Münzen');showDialog({icon:'🧰',eyebrow:'ÜBERRASCHUNG',title:'Versteckte Truhe',text:'Niemand hatte Münzen zum Klauen – also findest du eine kleine Truhe mit zwei Münzen.',extra:scorePill(p)});}
      }
    }
    render();
  }
  function scorePill(p) { return `<div class="result-pill">⭐ ${p.stars} Stern(e) &nbsp; · &nbsp; 🪙 ${p.coins} Münzen</div>`; }
  function roll() {
    if(rolled||gameOver)return;
    const p=players[current]; const oldPos=p.pos;
    $('rollBtn').disabled=true; $('diceFace').classList.remove('rolling'); void $('diceFace').offsetWidth; $('diceFace').classList.add('rolling');
    let ticks=0; const faces=['⚀','⚁','⚂','⚃','⚄','⚅'];
    const interval=setInterval(()=>{$('diceFace').textContent=faces[Math.floor(Math.random()*6)];ticks++;if(ticks>=9){clearInterval(interval);rollValue=1+Math.floor(Math.random()*6);$('diceFace').textContent=faces[rollValue-1];$('diceFace').classList.remove('rolling');rolled=true;$('status').textContent=`${p.name} würfelt eine ${rollValue} und zieht ${rollValue} Felder weiter.`;log('🎲',`${p.name} würfelt eine ${rollValue}`,`Von Feld ${oldPos+1} auf Feld ${(oldPos+rollValue)%coords.length+1}`);finishMove(p,oldPos,rollValue);render();}} ,75);
  }
  function nextTurn() {
    if(!rolled||gameOver)return;
    current=(current+1)%players.length;
    if(current===0){round++;if(round>TOTAL_ROUNDS){endGame();return;}}
    rolled=false;$('diceFace').textContent='🎲';$('status').textContent=`Jetzt ist ${players[current].name} dran.`;render();
  }
  function endGame() {
    gameOver=true; rolled=false;
    const sorted=[...players].sort((a,b)=>b.stars-a.stars||b.coins-a.coins);
    const winners=sorted.filter(p=>p.stars===sorted[0].stars&&p.coins===sorted[0].coins);
    const winnerText=winners.length>1?`Unentschieden zwischen ${winners.map(p=>p.name).join(' und ')}!`:`${sorted[0].name} gewinnt das Inselchaos!`;
    log('🏆','Das Spiel ist vorbei',winnerText);
    const ranking=sorted.map((p,i)=>`<div class="ranking-row"><span>${['🥇','🥈','🥉','🏅'][i]}</span><b>${escapeHTML(p.name)}</b><span>⭐ ${p.stars}</span><span>🪙 ${p.coins}</span></div>`).join('');
    showDialog({icon:'🏆',eyebrow:'20 RUNDEN GESCHAFFT',title:winnerText,text:'Hier ist der finale Spielstand. Sterne entscheiden zuerst, Münzen bei Gleichstand.',button:'Neue Partie starten',extra:`<div class="ranking-list">${ranking}</div>`,onButton:()=>resetGame(true),closeable:false});
    $('status').textContent='Spiel beendet – starte eine neue Partie für eine Revanche.';render();
  }
  function resetGame(showSetup=false) {
    gameOver=false;current=0;round=1;rolled=false;rollValue=0;starPos=12;players=makePlayers(avatars.map((_,i)=>$(`name${i}`)?.value||`Spieler ${i+1}`));
    $('diceFace').textContent='🎲';$('status').textContent='Würfle und zieh über die Insel!';$('gameLog').innerHTML='';log('🌴','Neue Partie gestartet','Alle vier Abenteurer starten mit 10 Münzen.');drawBoard();render();
    if(showSetup){$('setupDialog').showModal();}
  }
  function openSetup() {
    setupNameFields();
    if(players.length) players.forEach((p,i)=>{const el=$(`name${i}`);if(el)el.value=p.name;});
    if(!$('setupDialog').open)$('setupDialog').showModal();
  }
  function startFromSetup() {
    const names=avatars.map((_,i)=>$(`name${i}`).value);
    players=makePlayers(names);current=0;round=1;rolled=false;gameOver=false;starPos=12;
    $('setupDialog').close();$('diceFace').textContent='🎲';$('gameLog').innerHTML='';log('🌴','Die Crew ist angekommen','Alle starten mit 10 Münzen. Viel Glück!');drawBoard();render();
  }
  $('rollBtn').addEventListener('click',roll);
  $('nextBtn').addEventListener('click',nextTurn);
  $('restartBtn').addEventListener('click',()=>{if(confirm('Wirklich eine neue Partie starten? Der aktuelle Spielstand geht verloren.'))openSetup();});
  $('rulesBtn').addEventListener('click',()=>$('rulesDialog').showModal());
  $('closeRules').addEventListener('click',()=>$('rulesDialog').close());
  $('rulesOkay').addEventListener('click',()=>$('rulesDialog').close());
  $('startGameBtn').addEventListener('click',startFromSetup);
  $('closeDialog').addEventListener('click',()=>$('eventDialog').close());
  $('dialogButton').addEventListener('click',()=>{if($('eventDialog').open)$('eventDialog').close();});
  setupNameFields();
  players=makePlayers(['Spieler 1','Spieler 2','Spieler 3','Spieler 4']);
  drawBoard();render();
  // Start immediately with defaults; name setup is available from restart.
})();
