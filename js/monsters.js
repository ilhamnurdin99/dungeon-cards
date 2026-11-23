// Dungeon Cards — monster definitions, one per dungeon level.
// moves is the attack pattern: the monster cycles through it, one move
// per turn. A move may also poison the player or heal the monster.
// armor reduces every single hit of damage by that amount.
window.DC = window.DC || {};

DC.MONSTERS = [
  {
    level: 1, name: "Cave Rat", icon: "\u{1F400}",
    hp: 26, gold: 10, armor: 0,
    desc: "A mangy rat grown fat on dungeon scraps. It bites hard for its size.",
    moves: [ { dmg: 5 }, { dmg: 5 }, { dmg: 8 } ]
  },
  {
    level: 2, name: "Goblin Cutpurse", icon: "\u{1F47A}",
    hp: 34, gold: 15, armor: 0,
    desc: "A sneaky goblin with a rusty shiv and sticky fingers.",
    moves: [ { dmg: 7 }, { dmg: 7 }, { dmg: 11 } ]
  },
  {
    level: 3, name: "Stone Golem", icon: "\u{1F5FF}",
    hp: 48, gold: 20, armor: 1,
    desc: "Ancient rock given grumpy life. Its thick hide blunts every blow.",
    moves: [ { dmg: 9 }, { dmg: 9 }, { dmg: 14 } ]
  },
  {
    level: 4, name: "Dark Cultist", icon: "\u{1F9D9}",
    hp: 58, gold: 25, armor: 0,
    desc: "A hooded fanatic who spits venom and curses between strikes.",
    moves: [ { dmg: 8 }, { dmg: 8, poison: 3 }, { dmg: 12 } ]
  },
  {
    level: 5, name: "Lich King", icon: "\u{1F451}",
    hp: 85, gold: 50, armor: 0, boss: true,
    desc: "The undead king of the deep dungeon. End him and the dungeon is yours.",
    moves: [ { dmg: 12 }, { dmg: 12 }, { dmg: 18 }, { dmg: 10, heal: 8 } ]
  }
];

DC.monsterForLevel = function (level) {
  return DC.MONSTERS[level - 1] || null;
};
