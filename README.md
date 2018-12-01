# WPC (Dot Matrix) Emulator

[![Build Status](https://travis-ci.org/neophob/wpc-emu.svg?branch=master)](https://travis-ci.org/neophob/wpc-emu)

# Goal

- Emulate the Williams Pinball machine WPC-89 (6/91 - 10/91)
- 2nd generation Williams WPC hardware called "WPC Dot Matrix" aka WPC DMD
- Emulate game "Hurricane" - also "Gilligan's Island", "Terminator2" and "Party Zone"
- It should be pretty easy to run "WPC Fliptronic" too

# Implementation Status

Reference: http://bcd.github.io/freewpc/The-WPC-Hardware.html#The-WPC-Hardware

## Basic
- read Game ROM file ✓
- emulate 6809 CPU ✓

## CPU/ASIC Board
- Blanking (not sure if needed)
- Diagnostics LED ✓
- Watchdog (needed for proper bootup sequence)
- Bit Shifter ✓
- Memory Protection ✓
- Time of Day Clock ✓
- High Resolution Timer (not used, was used by alphanumeric games to do display dimming)
- ROM Bank Switching ✓
- RAM Bank Switching (WPC 95 only, not sure if needed, MAME does not implement it)
- The Switch Matrix ✓
- External I/O ✓ (except sound)
- Fliptronic Flipper ✓
- Interrupt Reset ✓
- Interrupt IRQ ✓
- Interrupt FIRQ ✓ (incl. source - not sure if needed)
- Security Chip ✓

## Power Driver Board
- Lamp Circuits ✓
- Solenoid Circuits ✓ (fade out timing missing)
- General Illumination Circuits (Triac) ✓ (fade out timing missing)
- Zero Cross Circuit ✓
- support Fliptronics flipper

## Sound Board
- load pre DCS sound ROM files ✓
- load DCS sound ROM files
- Bank Switching ✓
- Resample audio to 44.1khz
- emulate 6809 CPU ✓
- emulate YM2151 FM Generator
- emulate HC-55536 CVSD (speech synth)
- emulate MC6821 PIA
- emulate DAC ✓

## Dot Matrix Controller Board
- Page Selection ✓
- Scanline Handling ✓
- Dimming / multi color display ✓
- WPC 95 support ✓

## Debug UI
- DMD output ✓
- VideoRAM output ✓
- Debug KPI ✓
- Cabinet input keys work ✓
- Switch input keys work ✓
- Fliptronics input keys work ✓
- Adaptive FPS ✓

# Development

## Serve ROM's from localhost
- create the `./rom` directory and copy your ROM files inside this directory
- Run `npm run start:fileserv` to start local file serve
- check out the "Run Watch" chapter

## Run Watch
- Run `npm run watch` in the root directory and the `client` directory

## Build Release
- Run `build:production` in the root directory and the `client` directory
- output is available in the `./dist` directory

# Future ideas
- Hook it up to a Virtual Pinball / Pinball frontend
- Hook it up to a broken Pinball machine, replace whole electronics with a RPI

# Hardware - WPS Dot Matrix Machine

## Overview:

```

    +-----------------------+   +-------------------------+
    |                       |   |                         |
    |  CPU BOARD / A-12742  |   |  SOUND BOARD / A-12738  |
    |  -------------------  |   |  ---------------------  |
    |                       |   |                         |
    |  - MC 6809 CPU@2MHz   |   |  - MC 6809 CPU@2MHz     |
    |  - WPC ASIC           |   |  - YM2151 FM            |
    |  - 1 Game ROM         |   |  - HC-55536 CVSD        |
    |  - 8kb RAM            |   |  - MC 6809 PIA          |
    |                       |   |  - 3 Sound ROMs         |
    |                       |   |  - DAC                  |
    |                       |   |  - 8kb RAM              |
    |                       |   |                         |
    +-----------------------+   +-------------------------+

    +-----------------------+
    |                       |
    |  DMD BOARD / A-14039  |
    |  -------------------  |
    |                       |
    |  - 8kb RAM            |
    |                       |
    +-----------------------+

```

Operating system:
- APPLE OS (created by Williams, not related to the company Apple, but "Advanced Pinball Programming Logic Executive")
- Part of the game ROM, last 32kb of the game ROM

## CPU BOARD
- Williams part number A-12742
- Main CPU: Motorola 6809 (68B09E) at 2 MHz, 8-bit/16-bit CPU and between 128KB and 1MB of EPROM for the game program
- Custom ASIC chip by Williams, mainly a huge mapper
- Its memory address space is 64 KiB (linear $0000 to $FFFF, 16Bit address)
- Can address 8KB RAM, 8KB Hardware, 16KB Bank switched Game ROM, 32KB System ROM
- Game ROM name: U6

### MEMORY
- Total 8KB RAM, battery-backed
- The memory storage format is Big Endian

## POWER-DRIVER-BOARD
- Williams part number: A-12697-1

## SOUND-BOARD
- Williams part number: A-12738 (aka. pre-DCS sound)
- Mono output, Sample rate 11KHz, 25 watts power, 8 ohm
- intelligent and have processors running their own operating system dedicated to sound tasks
- CPU: Motorola 6809 (MC68A09EP), frequency 2MHz
- OPM: Yamaha YM2151 OPM (FM Operator Type-M), frequency 3.579545MHz (8-voice FM sound synthesiser)
- DAC: AD-7524 (Digital Analog converter) and YM3012
- Harris HC-55536 CVSD (Continuously variable slope delta modulation). Note HC-55536 is pin compatible with 55516 and 55564.
- MC6821 Peripheral Interface Adaptor (PIA)
- ROMS: U14, U15 and U18

## DMD-BOARD
- Williams part number A-14039
- The dot matrix display is 128 columns x 32 rows and refreshes at 122Mhz
- The controller board has the display RAM and the serialisation logic
- The display RAM holds 8KB. A full DMD bit plane requires 128x32 pixels, that is, 4096 bits, or 512 bytes. Thus, there is enough RAM to hold a total of 16 planes. At any time, at most two planes can be addressed by the CPU

# Implementation Hints

- if memory map (Systemrom) contains `0x00` at `0xffec` and `0xff` at `0xffed` then the startup check will be disabled. This reduce the boot time and works on all WPC games (not on FreeWPC games)
- There is ONE switch in all WPC games called "always closed" (always switch 24 on all WPC games). This switch is used to detect if the switch matrix is faulty. This means if switch 24 is open, the system knows the switch matrix is faulty.

## Timing
- CPU run at 2 MHZ, this means 2'000'000 clock ticks/s -> The CPU execute 2 cycles per us.
- CPU IRQ is called 976 times/s, that a IRQ call each 1025us
- ZeroCross should occur 120 times per second (NTSC running at 60Hz), so each 8.3ms. (8.3 * 2000cycles/ms = 16667 ticks)

Timings are very tight, we cannot use `setTimeout`/`setInterval` to call for example the IRQ. So the main idea is to run one
main loop that executes some CPU ops then check if one of the following callbacks need to be triggered:
- each 2049 ticks call IRQ (1025us)
- each 16667 ticks update ZeroCross flag (8.3ms)
- each 512 ticks update display scanline (256us)

### DMD display scanline
The controller fetches 1 byte (8 pixels) every 32 CPU cycles (16 microseconds). At this rate, it takes 256 microseconds per row and a little more than 8 milliseconds per complete frame.

## DMD controller

WPC-89 exposes two memory regions (length 0x200 bytes) to write to the video ram:
- `0x3800 - 0x39FE` for bank 1
- `0x3A00 - 0x3BFF` for bank 2

WPC-95 added four CPU accessible video ram pages:
- `0x3000 - 0x31FF` for bank 3
- `0x3200 - 0x33FF` for bank 4
- `0x3400 - 0x35FF` for bank 5
- `0x3600 - 0x37FF` for bank 6

Each bank can point to an individual address to one of the 16 video ram pages.

TODO: I could not find a game that uses those additional video ram pages yet!

## Security PIC (U22)
FreeWPC documentation about this security feature:

```
A security PIC chip is added between the ASIC and the switch matrix
inputs.  The CPU no longer reads the switch data directly; it sends
commands to the PIC which then reads the data.  The PIC requires some
special cryptic codes to be sent otherwise it will not return valid
switch data, making the game unplayable.
```
- If the security chip implementation is invalid, the DMD display will show "U22 ERROR" or "G10 ERROR" (WPC95)
- If the security chip works but does not match the expected Pinball model, the DMD will show "Incorrect U22 for this game"

WPC-EMU uses the technique by Ed Cheung (http://www.edcheung.com/album/album07/Pinball/wpc_sound2.htm)
to bypass the Security PIC:

```
The ROM is searched sequentially for "EC 9F xx yy 83 12 34".  This is a
pattern that marks the address of a pointer to the location of the game ID.
at this location there is a 2 byte number which is the game id
```
**NOTE**: this works only for WPC games but NOT for FreeWPC games!

The file `rom/game-id.js` searches the ROM for the (unique) game ID. This id is later patched
(using the memory patch function) with the game ID of Medieval Madness (Game ID: 559).

- Dirty Harry (530) game ID is stored at location 0xE873 and contains 0xE8/0x73
- Medieval Madness (559) game ID is stored at location 0xE885 and contains 0xE8/0x85
- No Fear (525) game ID is stored at location 0xE80D and contains 0xE8/0x0D

Here is a debug log of "Dirty Harry" ROM booting and the read the game ID. The pointer to the game ID location
is stored at 0x81C9/0x81CA (16 bit) for this game.

```
2018-10-04T21:33:43.053Z wpcemu:boards:cpu-board mem-read 81c9
2018-10-04T21:33:43.053Z wpcemu:boards:cpu-board mem-read 81ca
2018-10-04T21:33:43.053Z wpcemu:boards:cpu-board read securityPic machine id
2018-10-04T21:33:43.053Z wpcemu:boards:cpu-board mem-read e873
2018-10-04T21:33:43.053Z wpcemu:boards:cpu-board mem-read e874
```

## RAM positions

Known RAM positions for WPC games

| Offset        | Comment        |
| ------------- | -------------- |
| 0x0011        | Current Bank Marker, ??  |
| 0x0012        | Bank Jump Address hi, ??  |
| 0x0013        | Bank Jump Address lo, ??  |
| 0x1800        | Date, year hi  |
| 0x1801        | Date, year lo  |
| 0x1802        | Date, month    |
| 0x1803        | Date, day of month |
| 0x1804        | Date, days since sunday |
| 0x1805        | Date, 0x00 ? |
| 0x1806        | Date, 0x01 ? |
| 0x1807        | Date, checksum hi |
| 0x1808        | Date, checksum lo |

Note: The initial memory check writes from offset 0x0000 - 0x1730.

## Gameplay
- (during active game) if you press and keep pressed left or right FLIPPER - a status report will be shown
- the TROUGH switches need to be closed to be able to start the game, else you see the "Pinball missing messages" -> these switches are used to detect that there are still balls in the TROUGH - depending on the model there are more or less ball and switches available
- the OUTHOLE is off when the game starts

TODO:
OUTHOLE ON, TROUGH 1 ON, OUTHOLE OFF, TROUGH 1 OFF

This very primitive schema shows where the switches are:
- 1: OUTHOLE SWITCH
- 2,3,4: TROUGH SWITCHES
```
   +--------------+
   |              |
   |              |
   |              |
   |   \      /   |
   |              |
   |      1  234  |

```

## To Test:
- memory position of current score, player number, credits
- serial port?

## Error Messages

### Invalid Switch state

Error message:
- `check fuses f101 and f109, j127 and opto 12v supply`
- `check fuses f115 and f116, j112 and opto 12v supply`

Solution:
- check the initial switch state, possible that a switch is in the wrong state
- NOTE: opto switches are closed in the initial state!

### Do not disable checksum check

If the `skipWmcRomCheck` is set to false, you see this error on some machines (dh, mm):

- `G11 CKSUM ERROR`

Issue: ROM checksum invalid

Solution:

# References

## Terms
- Attraction Mode: the time when no game is running and the lamps are blinking to attract people
- Drain: The common term used to refer to the area beneath the flippers. If the ball rolls into the drain area via an outlane or between the flippers, it will be lost. Also refers to the act of losing a ball in this manner.
- Plunger: The object used to launch a ball onto the playfield

## WPC

- http://bcd.github.io/freewpc/The-WPC-Hardware.html
- https://en.wikipedia.org/wiki/Williams_Pinball_Controller
- http://www.maddes.net/pinball/wpc_debugging.htm
- https://bitbucket.org/grumdrig/williams/src/master/
- http://www.edcheung.com/album/album07/Pinball/wpc_sound.htm
- http://techniek.flipperwinkel.nl/wpc/index2.htm#switch
- http://arcarc.xmission.com/Pinball/PDF%20Pinball%20Manuals%20and%20Schematics/
- https://github.com/tanseydavid/WPCResources
- https://github.com/tomlogic/pinmame-nvram-maps

## DMD
- http://webpages.charter.net/coinopcauldron/dotarticle.html

## CPU
- http://atjs.mbnet.fi/mc6809/
- https://github.com/maly/6809js (use this CPU core, fixed typos + implemented IRQ handling)
- http://www.roust-it.dk/coco/6809irq.pdf

## Sound Chip
- http://www.ionpool.net/arcade/gottlieb/technical/datasheets/YM2151_datasheet.pdf
- https://sourceforge.net/p/pinmame/code/HEAD/tree/trunk/src/sound/
- https://github.com/kode54/Game_Music_Emu/blob/master/gme/
- http://www.cx5m.net/fmunit.htm
- https://github.com/apollolux/ym2413-js/blob/master/ym2413.js
- https://github.com/vgm/node-vgmplay/blob/master/res/js/vgm/ym2151.js (WPC-EMU use this)

## ROM
- http://www.ipdb.org/
- http://www.planetarypinball.com/mm5/Williams/tech/wpcroms.html

## Custom Power Driver
- https://www.multimorphic.com/store/circuit-boards/pd-16/

## Misc
- Bally - Electronic Pinball Games, Theory of operation, F.O. 601-2 (Note: this is for the pre DMD model)
- John R. Bork - REVERSE ENGINEERING A MICROCOMPUTER-­BASED CONTROL UNIT

# Game List

Ripped from Wikipedia.

## WPC (Alphanumeric)
- FunHouse - September 1990
- Harley-Davidson - February 1991
- The Machine: Bride of Pin·Bot - February 1991

Some Dr. Dude machines were also made using this WPC generation, although most were made using the later System 11 board.

## WPC (Dot Matrix)
- Gilligan's Island - May 1991
- Terminator 2: Judgment Day - July 1991
- Hurricane - August 1991
- The Party Zone - August 1991

Terminator 2: Judgment Day was the first to be designed with a dot matrix display, but was released after Gilligan's Island, due to Terminator 2 having a longer development time than Gilligan's Island. This generation WPC hardware was also used in some of Williams / Midway's redemption games (SlugFest!, Hot Shot Basketball) as well as in the first Shuffle Alley Game Strike Master Shuffle Alley - 1991.

## WPC (Fliptronics)
- The Getaway: High Speed II - February 1992
- The Addams Family - March 1992
- Black Rose - July 1992
- Fish Tales - October 1992
- Doctor Who - October 1992
- Creature from the Black Lagoon - December 1992
- White Water - January 1993
- Bram Stoker's Dracula - March 1993
- Twilight Zone - March 1993
- The Addams Family Special Collectors Edition - October 1994

The Addams Family was the only game produced with the Fliptronics I board, which is compatible with Fliptronics II boards, which added a bridge rectifier for the flipper voltage.

## WPC (DCS)
- Indiana Jones: The Pinball Adventure - August 1993
- Judge Dredd - September 1993
- Star Trek: The Next Generation - November 1993
- Popeye Saves the Earth - February 1994
- Demolition Man - February 1994

Twilight Zone was designed to be the first pinball machine to use the new DCS system, but due to delays of the new hardware design it was decided to release it on the old hardware (using downsampled sound effects) instead. The redemption game Addams Family Values also used the DCS Sound System.

## WPC-S (Security)
Starting with World Cup Soccer, a security programmable integrated circuit (PIC) chip was added to the CPU board in all WPC-S games at location U22. This PIC chip was game specific making it so CPU boards could not be swapped between different models without changing the security PIC chip.

- World Cup Soccer - February 1994
- The Flintstones - July 1994
- Corvette - August 1994
- Red & Ted's Road Show - October 1994
- The Shadow - November 1994
- Dirty Harry - March 1995
- Theatre of Magic - March 1995
- No Fear: Dangerous Sports - May 1995
- Indianapolis 500 - June 1995
- Johnny Mnemonic - August 1995
- Jack·Bot - October 1995
- WHO Dunnit - September 1995

## WPC-95
In this final revision of the WPC hardware, the dot matrix controller and the DCS sound boards are combined into a single A/V board, while the Power/Driver and the Fliptronics boards are combined into a single Power/Driver board, bringing the board count down to three boards. It also includes the same game-specific security PIC introduced in the WPC-Security system.

- Congo - November 1995
- Attack from Mars - December 1995
- Safecracker - March 1996
- Tales of the Arabian Nights - May 1996
- Scared Stiff - September 1996
- Junk Yard - December 1996
- NBA Fastbreak - March 1997
- Medieval Madness - June 1997
- Cirqus Voltaire - October 1997
- No Good Gofers - December 1997
- The Champion Pub - April 1998
- Monster Bash - July 1998
- Cactus Canyon - October 1998

This generation WPC hardware was also used in the Midway redemption game Ticket Tac Toe, March 1996 and the Shuffle Alley game League Champ Shuffle Alley, 1996.
