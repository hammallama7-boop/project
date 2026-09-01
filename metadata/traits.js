// Trait definitions for Pixelated Catworks.
// Each trait lists possible values with an integer weight (higher = more common).
// Rarity sampling picks combinations weighted by the product of trait weights,
// then selects exactly MAX_SUPPLY distinct combinations.

const MAX_SUPPLY = 777;

const TRAITS = [
  {
    name: "Toes",
    values: [
      { value: "All 5", weight: 70 },
      { value: "Missing 1", weight: 25 },
      { value: "Missing 2", weight: 5 },
    ],
  },
  {
    name: "Injuries",
    values: [
      { value: "None", weight: 60 },
      { value: "Scar", weight: 25 },
      { value: "Ear Tipped", weight: 10 },
      { value: "Stitches", weight: 5 },
    ],
  },
  {
    name: "Eye Color",
    values: [
      { value: "Green", weight: 40 },
      { value: "Yellow", weight: 30 },
      { value: "Blue", weight: 15 },
      { value: "Heterochromia", weight: 10 },
      { value: "Red", weight: 5 },
    ],
  },
  {
    name: "Fur Color",
    values: [
      { value: "Orange", weight: 30 },
      { value: "Gray", weight: 25 },
      { value: "White", weight: 20 },
      { value: "Black", weight: 10 },
      { value: "Calico", weight: 8 },
      { value: "Tuxedo", weight: 7 },
    ],
  },
  {
    name: "Accessories",
    values: [
      { value: "None", weight: 55 },
      { value: "Collar", weight: 20 },
      { value: "Bow", weight: 15 },
      { value: "Glasses", weight: 10 },
    ],
  },
];

module.exports = { TRAITS, MAX_SUPPLY };
