# Auxtion8r — Pixel-Art Auction Collection Game

A single-player browser game where you earn gold coins, bid on pixel-art items against NPC opponents, and generate passive income.

**Play:** Open `index.html` in any browser. No server needed.

## Features
- 50 unique items across 5 rarity tiers
- Auction house with 3 NPC AI opponents
- Daily, weekly, and permanent task rewards
- Passive income that accumulates offline
- Browser-local save data with checksum validation

## NPCs
| NPC | Style | Behavior |
|-----|-------|----------|
| Grufford | Aggressive | Bids fast, overpays, backs off after 3-4 rounds |
| Mildred | Patient | Waits, bids minimum, drops above 80% value |
| Quentin | Erratic | Random timing, sometimes all-in, sometimes skips |

## Rarity Tiers
| Rarity | Count | Color | Income |
|--------|-------|-------|--------|
| Common | 20 | Gray | 1/min |
| Uncommon | 15 | Green | 3/min |
| Rare | 8 | Blue | 8/min |
| Epic | 4 | Purple | 20/min |
| Legendary | 3 | Gold | 50/min |

## Save Data
Stored in `localStorage` as `auxtion8r_save`. Delete to reset.

## License
MIT
