# UNO

Browser-based online UNO with two rule modes.

## Start
Open `uno/index.html` through GitHub Pages or any static web host. No build step is required.

## Multiplayer
The room creator is the host and shares the six-character room code. Other players join from their own devices. PeerJS provides peer-to-peer connections; the host owns the authoritative game state. Opponent hands and the draw pile are hidden from clients.

## Modes
- **Klassisch:** draw one card when unable to play; if it matches, play it or end your turn.
- **Zieh bis es passt:** draw until you have a playable card. You may keep drawing voluntarily even after finding one; end your turn only when you have a playable card.

The game supports 2–4 players, standard number/action/wild cards, color selection, UNO calls, catching a missed UNO, and a playful message if a player wins with a wild card.

## Hosting
Enable GitHub Pages for this repository (Settings → Pages → Deploy from a branch → `main` → `/(root)`). The game will be available at `/uno/` under the published site.

PeerJS uses its public cloud signaling service. Network restrictions or browser privacy settings may prevent peer connections on some networks.
