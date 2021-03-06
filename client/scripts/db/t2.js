'use strict';

module.exports = {
  name: 'WPC-DMD: Terminator 2',
  version: 'L-8',
  rom: {
    u06: 't2_l8.rom',
    u14: 't2_u14.l3',
    u15: 't2_u15.l3',
    u18: 't2_u18.l3',
  },
  playfield: {
    //size must be 200x400, lamp positions according to image
    image: 'playfield-t2.jpg',
    lamps: [
      [{ x: 61, y: 309, color: 'GREEN' }],
      [{ x: 74, y: 303, color: 'GREEN' }],
      [{ x: 89, y: 301, color: 'ORANGE' }],
      [{ x: 102, y: 303, color: 'GREEN' }],
      [{ x: 115, y: 309, color: 'GREEN' }],
      [{ x: 88, y: 353, color: 'YELLOW' }],
      [{ x: 89, y: 283, color: 'WHITE' }],
      [{ x: 0, y: 0, color: 'BLACK' }], //#17 NOT USED

      [{ x: 18, y: 310, color: 'ORANGE' }], //#21
      [{ x: 18, y: 291, color: 'RED' }, { x: 160, y: 291, color: 'RED' }],
      [{ x: 30, y: 279, color: 'WHITE' }],
      [{ x: 147, y: 279, color: 'ORANGE' }],
      [{ x: 77, y: 160, color: 'YELLOW' }],
      [{ x: 74, y: 141, color: 'GREEN' }], //#26
      [{ x: 71, y: 121, color: 'ORANGE' }],
      [{ x: 68, y: 100, color: 'LPURPLE' }],

      [{ x: 53, y: 146, color: 'YELLOW' }], //#31
      [{ x: 55, y: 156, color: 'YELLOW' }],
      [{ x: 58, y: 165, color: 'YELLOW' }],
      [{ x: 60, y: 174, color: 'YELLOW' }],
      [{ x: 62, y: 183, color: 'YELLOW' }],
      [{ x: 89, y: 154, color: 'RED' }],
      [{ x: 98, y: 160, color: 'RED' }],
      [{ x: 105, y: 167, color: 'RED' }],

      [{ x: 34, y: 184, color: 'GREEN' }], //#41
      [{ x: 40, y: 204, color: 'ORANGE' }],
      [{ x: 47, y: 219, color: 'RED' }],
      [{ x: 50, y: 233, color: 'RED' }],
      [{ x: 55, y: 246, color: 'RED' }],
      [{ x: 59, y: 260, color: 'RED' }],
      [{ x: 62, y: 272, color: 'RED' }],
      [{ x: 67, y: 286, color: 'RED' }],

      [{ x: 84, y: 268, color: 'RED' }, { x: 94, y: 268, color: 'RED' }], //#51
      [{ x: 53, y: 64, color: 'RED' }, { x: 69, y: 64, color: 'RED' }],
      [{ x: 136, y: 220, color: 'RED' }],
      [{ x: 133, y: 234, color: 'RED' }],
      [{ x: 126, y: 247, color: 'RED' }],
      [{ x: 120, y: 260, color: 'RED' }],
      [{ x: 115, y: 272, color: 'RED' }],
      [{ x: 111, y: 286, color: 'RED' }],

      [{ x: 66, y: 196, color: 'ORANGE' }], //#61
      [{ x: 68, y: 209, color: 'ORANGE' }],
      [{ x: 71, y: 221, color: 'ORANGE' }],
      [{ x: 74, y: 233, color: 'ORANGE' }],
      [{ x: 77, y: 244, color: 'ORANGE' }],
      [{ x: 30, y: 237, color: 'GREEN' }],
      [{ x: 39, y: 255, color: 'ORANGE' }],
      [{ x: 50, y: 130, color: 'RED' }],

      [{ x: 125, y: 198, color: 'ORANGE' }], //#71
      [{ x: 120, y: 210, color: 'ORANGE' }],
      [{ x: 115, y: 221, color: 'ORANGE' }],
      [{ x: 111, y: 233, color: 'ORANGE' }],
      [{ x: 107, y: 244, color: 'ORANGE' }],
      [{ x: 146, y: 241, color: 'YELLOW' }],
      [{ x: 146, y: 250, color: 'YELLOW' }],
      [{ x: 146, y: 259, color: 'YELLOW' }],

      [{ x: 151, y: 189, color: 'RED' }], //#81
      [{ x: 129, y: 187, color: 'RED' }],
      [{ x: 144, y: 205, color: 'WHITE' }],
      [{ x: 41, y: 379, color: 'YELLOW' }],
      [{ x: 64, y: 80, color: 'WHITE' }],
      [{ x: 98, y: 29, color: 'GREEN' }],
      [{ x: 118, y: 33, color: 'GREEN' }],
      [{ x: 139, y: 38, color: 'GREEN' }],
    ],
    flashlamps: [
      { id: 17, x: 87, y: 326, },
      { id: 18, x: 143, y: 327, },
      { id: 19, x: 35, y: 327, },
      { id: 20, x: 28, y: 161, },
      { id: 21, x: 179, y: 228, },
      { id: 22, x: 155, y: 131, },
      { id: 23, x: 28, y: 60, },
      { id: 25, x: 13, y: 144, }, { id: 25, x: 13, y: 160, },
      { id: 26, x: 37, y: 44, }, { id: 26, x: 46, y: 69, },
      { id: 27, x: 77, y: 65, }, { id: 27, x: 80, y: 55, },
      { id: 28, x: 63, y: 71, },
    ],
  },
  switchMapping: [
    { id: 11, name: 'RIGHT FLIPPER' },
    { id: 12, name: 'LEFT FLIPPER' },
    { id: 13, name: 'START BUTTON' },
    { id: 14, name: 'PLUMB BOB TILT' },
    { id: 15, name: 'TROUGH LEFT' },
    { id: 16, name: 'TROUGH CENTER' },
    { id: 17, name: 'TROUGH RIGHT' },
    { id: 18, name: 'OUTHOLE' },

    { id: 21, name: 'SLAM TILT' },
    { id: 22, name: 'COIN DOOR CLOSED' },
    { id: 23, name: 'TICKED OPTQ' },
    { id: 25, name: 'LEFT OUT LANE' },
    { id: 26, name: 'LEFT RET. LANE' },
    { id: 27, name: 'RIGHT RET. LANE' },
    { id: 28, name: 'RIGHT OUT LANE' },

    { id: 31, name: 'GUN LOADED' },
    { id: 32, name: 'GUN MARK' },
    { id: 33, name: 'GUN HOME' },
    { id: 34, name: 'GRIP TRIGGER' },
    { id: 36, name: 'STAND MID LEFT' },
    { id: 37, name: 'STAND MID CENTER' },
    { id: 38, name: 'STAND MID RIGHT' },

    { id: 41, name: 'LEFT JET' },
    { id: 42, name: 'RIGHT JET' },
    { id: 43, name: 'BOTTOM JET' },
    { id: 44, name: 'LEFT SLING' },
    { id: 45, name: 'RIGHT SLING' },
    { id: 46, name: 'STAND RIGHT TOP' },
    { id: 47, name: 'STAND RIGHT MID' },
    { id: 48, name: 'STAND RIGHT BOT' },

    { id: 51, name: 'LEFT LOCK' },
    { id: 53, name: 'LO ESCAPE ROUTE' },
    { id: 54, name: 'HI ESCAPE ROUTE' },
    { id: 55, name: 'TOP LOCK' },
    { id: 56, name: 'TOP LANE LEFT' },
    { id: 57, name: 'TOP LANE CENTER' },
    { id: 58, name: 'TOP LANE RIGHT' },

    { id: 61, name: 'LEFT RAMP ENTRY' },
    { id: 62, name: 'LEFT RAMP MADE' },
    { id: 63, name: 'RIGHT RAMP ENTRY' },
    { id: 64, name: 'RIGHT RAMP MADE' },
    { id: 65, name: 'LO CHASE LOOP' },
    { id: 66, name: 'HI CHASE LOOP' },

    { id: 71, name: 'TARGET 1 HI' },
    { id: 72, name: 'TARGET 2' },
    { id: 73, name: 'TARGET 3' },
    { id: 74, name: 'TARGET 4' },
    { id: 75, name: 'TARGET 5 LOW' },
    { id: 76, name: 'BALL POPPER' },
    { id: 77, name: 'DROP TARGET' },
    { id: 78, name: 'SHOOTER' },
  ],
  skipWmcRomCheck: true,
  initialise: {
    //OPTO Switches: 23
    closedSwitches: [ 15, 16, 17, 23 ],
    initialAction: [
      {
        delayMs: 1000,
        source: 'cabinetInput',
        value: 16
      }
    ],
  }
};
