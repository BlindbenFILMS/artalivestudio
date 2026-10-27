/* ─────────────────────────────────────────────────────────────
   ART ALIVE: the ready game templates. One list, used by the
   "Make your own game" page and by the template maker.
   Each game is played by ../games/engine.js.
   ───────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  const T = [
    { id: 'puzzle', name: 'Slide Puzzle', short: 'Puzzle', line: 'Your picture in tiles. Slide them back into place.',
      more: 'A mosaic of your picture, all mixed up. Every tile sings a note when it lands home.', sample: 'almost-blindness-globe.jpg', sampleName: 'Almost Blindness by Ben Fox',
      levels: ['3 × 3 tiles', '4 × 4 tiles', '5 × 5 tiles'], example: '../play/tunnel-puzzle.html' },
    { id: 'memory', name: 'Memory Match', short: 'Memory', line: 'Flip cards made from your picture and find the pairs.',
      more: 'Cards made from details of your picture. Each pair plays its own note, so it can be matched by ear.', sample: 'curating-hope-globe.jpg', sampleName: 'Curating Hope by Ben Fox',
      levels: ['4 pairs', '6 pairs', '8 pairs'], example: '../play/glowing-tree-memory.html' },
    { id: 'flashlight', name: 'Flashlight', short: 'Flashlight', line: 'Your picture in the dark. Shine a light to find what’s hidden.', isNew: true,
      more: 'The lights are out. Move a beam of light over your picture to find the hidden things. Beeps speed up as you get close.', sample: 'the-only-light-well-see-globe.jpg', sampleName: 'The Only Light We’ll See by Dave Steele',
      levels: ['3 to find', '4 to find', '6 to find'] },
    { id: 'simon', name: 'Simon Says', short: 'Simon Says', line: 'Four parts of your picture light up. Repeat the pattern.', isNew: true,
      more: 'Your picture splits into four glowing parts, each with its own note. Watch, listen, then tap the pattern back. It grows each round.', sample: 'all-lifes-beauty-globe.jpg', sampleName: 'All Life’s Beauty by Dave Steele',
      levels: ['5 rounds', '8 rounds', '12 rounds'] },
    { id: 'weather', name: 'Change the Weather', short: 'Weather', line: 'Make it rain, snow, storm or shine on your picture.', isNew: true,
      more: 'Sun, rain, snow, a thunderstorm, a starry night or a rainbow, with sounds to match. The game asks for a weather, you make it happen.', sample: 'walk-through-fear-globe.jpg', sampleName: 'Walk Through Fear by Ben Fox',
      levels: ['4 to make', '6 to make', '8 to make'] },
    { id: 'treasure', name: 'Hidden Treasures', short: 'Treasures', line: 'Treasures hide under the mist. Follow the beeps.',
      more: 'Your picture is covered in mist. Wipe it away and follow the beeps to the hidden treasures.', sample: 'the-visions-that-we-share-globe.jpg', sampleName: 'The Visions That We Share by Dave Steele',
      levels: ['3 treasures', '4 treasures', '6 treasures'], example: '../play/into-the-light-treasure.html' },
    { id: 'collect', name: 'Marble Collect', short: 'Collect', line: 'Roll a marble around your picture to collect stars.',
      more: 'Tilt your phone or drag to roll the marble over your picture and collect everything. Beeps lead the way.', sample: 'walk-through-fear-globe.jpg', sampleName: 'Walk Through Fear by Ben Fox',
      levels: ['5 to collect', '8 to collect', '12 to collect'], example: '../play/tunnel-marble.html' },
    { id: 'maze', name: 'Marble Maze', short: 'Maze', line: 'A maze over your picture. Roll the marble to the gold star.',
      more: 'A glowing maze is drawn over your picture. Roll the marble through it to the gold star.', sample: 'the-only-light-well-see-globe.jpg', sampleName: 'The Only Light We’ll See by Dave Steele',
      levels: ['Small maze', 'Medium maze', 'Big maze'] },
    { id: 'bowl', name: 'Marble Bowling', short: 'Bowling', line: 'Aim, roll and knock down the pins on your picture.',
      more: 'Bowling pins stand on your picture. Aim, roll, and see how many you knock down in three rolls.', sample: 'curating-hope-globe.jpg', sampleName: 'Curating Hope by Ben Fox',
      levels: ['6 pins', '10 pins', '10 pins, farther away'] }
  ];
  window.AATemplates = { list: T, get: id => T.find(t => t.id === id) || null };
})();
