// Dungeon Cards — card definitions.
// Every card is plain data. game.js interprets the effect fields:
// dmg (damage to the monster), hits (how many times dmg is dealt),
// block (shield gained), heal (HP restored), draw (cards drawn),
// poison (poison applied to the monster), weak (monster attack cut),
// energy (energy gained), loseHp (HP the player sacrifices).
window.DC = window.DC || {};

DC.CARDS = [
  { id: "strike",   name: "Strike",      cost: 1, type: "attack", icon: "\u{1F5E1}\uFE0F", text: "Deal 6 damage.",                              dmg: 6 },
  { id: "heavy",    name: "Heavy Blow",  cost: 2, type: "attack", icon: "\u{1F528}",      text: "Deal 11 damage.",                             dmg: 11 },
  { id: "twin",     name: "Twin Slash",  cost: 1, type: "attack", icon: "\u2694\uFE0F",    text: "Deal 3 damage twice.",                        dmg: 3, hits: 2 },
  { id: "jab",      name: "Quick Jab",   cost: 0, type: "attack", icon: "\u{1F44A}",      text: "Deal 3 damage.",                              dmg: 3 },
  { id: "fireball", name: "Fireball",    cost: 2, type: "attack", icon: "\u{1F525}",      text: "Deal 9 damage.",                              dmg: 9 },
  { id: "venom",    name: "Venom Dart",  cost: 1, type: "attack", icon: "\u{1F40D}",      text: "Deal 2 damage. Apply 4 poison.",              dmg: 2, poison: 4 },
  { id: "leech",    name: "Leech Bite",  cost: 1, type: "attack", icon: "\u{1FA78}",      text: "Deal 4 damage. Heal 4.",                      dmg: 4, heal: 4 },
  { id: "execute",  name: "Execute",     cost: 2, type: "attack", icon: "\u{1F480}",      text: "Deal 13 damage.",                             dmg: 13 },
  { id: "thorn",    name: "Thornmail",   cost: 1, type: "skill",  icon: "\u{1F335}",      text: "Gain 5 block. Deal 3 damage.",                block: 5, dmg: 3 },
  { id: "rampage",  name: "Rampage",     cost: 2, type: "attack", icon: "\u{1F624}",      text: "Deal 5 damage. Draw 1 card.",                 dmg: 5, draw: 1 },
  { id: "guard",    name: "Guard",       cost: 1, type: "skill",  icon: "\u{1F6E1}\uFE0F", text: "Gain 6 block.",                               block: 6 },
  { id: "wall",     name: "Iron Wall",   cost: 2, type: "skill",  icon: "\u{1F9F1}",      text: "Gain 12 block.",                              block: 12 },
  { id: "mend",     name: "Mend",        cost: 2, type: "skill",  icon: "\u{1F49A}",      text: "Restore 8 HP.",                               heal: 8 },
  { id: "bandage",  name: "Bandage",     cost: 1, type: "skill",  icon: "\u{1FA79}",      text: "Restore 5 HP.",                               heal: 5 },
  { id: "hex",      name: "Hex",         cost: 1, type: "skill",  icon: "\u{1F319}",      text: "Monster deals 3 less damage next turn.",      weak: 3 },
  { id: "frost",    name: "Frost Shard", cost: 1, type: "attack", icon: "\u2744\uFE0F",    text: "Deal 4 damage. Monster deals 2 less damage next turn.", dmg: 4, weak: 2 },
  { id: "focus",    name: "Focus",       cost: 1, type: "skill",  icon: "\u{1F9E0}",      text: "Draw 2 cards.",                               draw: 2 },
  { id: "pact",     name: "Blood Pact",  cost: 0, type: "skill",  icon: "\u{1FA78}",      text: "Lose 3 HP. Gain 2 energy.",                   loseHp: 3, energy: 2 }
];

DC.cardById = function (id) {
  for (var i = 0; i < DC.CARDS.length; i++) {
    if (DC.CARDS[i].id === id) return DC.CARDS[i];
  }
  return null;
};

// The deck a new run starts with: 12 cards.
DC.STARTING_DECK = [
  "strike", "strike", "strike", "strike", "strike",
  "guard", "guard", "guard", "guard",
  "mend", "mend",
  "jab"
];
