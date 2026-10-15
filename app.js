
$("rollBtn").addEventListener("click", () => {
  if (rolled) return;

  const button = $("rollBtn");
  const dice = $("diceFace");
  const roll = 1 + Math.floor(Math.random() * 6);
  const faces = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

  button.disabled = true;
  dice.classList.remove("landed");
  dice.classList.add("rolling");
  $("status").textContent = "Der Würfel rollt …";

  let ticks = 0;

  const spin = setInterval(() => {
    dice.textContent = faces[1 + Math.floor(Math.random() * 6)];
    ticks++;
    if (ticks >= 7) clearInterval(spin);
  }, 95);

  setTimeout(() => {
    clearInterval(spin);
    dice.classList.remove("rolling");
    dice.textContent = faces[roll];
    dice.classList.add("landed");

    setTimeout(() => dice.classList.remove("landed"), 300);

    const p = players[current];
    p.pos = (p.pos + roll) % route.length;
    rolled = true;

    eventFor(p);
    $("status").textContent =
      `${p.name} würfelt eine ${roll} und zieht ${roll} Felder weiter.`;

    render();
  }, 850);
});
