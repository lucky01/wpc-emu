'use strict';
/*jshint bitwise: false*/

/**
 * All read/write requests from the CPU are first seen by the ASIC, which can
 * then either respond to it directly if it is an internal function, or forward
 * the request to another device
 * this file emulates the ASIC CHIP
 */

const debug = require('debug')('wpcemu:boards:cpu-board-asic');
const timing = require('./timing');
const inputSwitchMatrix = require('./elements/input-switch-matrix');
const outputLampMatrix = require('./elements/output-lamp-matrix');
const outputSolenoidMatrix = require('./elements/output-solenoid-matrix');
const outputGeneralIllumination = require('./elements/output-general-illumination');
const memoryProtection = require('./elements/memory-protection');

const OP = {
  WPC_SOLENOID_GEN_OUTPUT: 0x3FE0,
  WPC_SOLENOID_HIGHPOWER_OUTPUT: 0x3FE1,
  WPC_SOLENOID_FLASH1_OUTPUT: 0x3FE2,
  WPC_SOLENOID_LOWPOWER_OUTPUT: 0x3FE3,
  WPC_LAMP_ROW_OUTPUT: 0x3FE4,
  WPC_LAMP_COL_STROBE: 0x3FE5,
  WPC_GI_TRIAC: 0x3FE6,
  WPC_SW_JUMPER_INPUT: 0x3FE7,
  WPC_SWITCH_CABINET_INPUT: 0x3FE8,
  WPC_SWITCH_ROW_SELECT: 0x3FE9,
  //WPC_PICREAD: 0x3FE9,
  WPC_SWITCH_COL_SELECT: 0x3FEA,
  //WPC_PICWRITE: 0x3FEA,
  WPC_EXTBOARD1: 0x3FEB,
  WPC_EXTBOARD2: 0x3FEC,
  WPC_EXTBOARD3: 0x3FED,
  WPC_EXTBOARD4: 0x3FEE,
  WPC_EXTBOARD5: 0x3FEF,

  WPC_LEDS: 0x3FF2,
  WPC_RAM_BANK: 0x3FF3,
  WPC_SHIFTADDRH: 0x3FF4,
  WPC_SHIFTADDRL: 0x3FF5,
  WPC_SHIFTBIT: 0x3FF6,
  WPC_SHIFTBIT2: 0x3FF7,
  WPC_PERIPHERAL_TIMER_FIRQ_CLEAR: 0x3FF8,
  WPC_ROM_LOCK: 0x3FF9,

  WPC_CLK_HOURS_DAYS: 0x3FFA,
  WPC_CLK_MINS: 0x3FFB,
  WPC_ROM_BANK: 0x3FFC,

  //WPC_PROTMEM
  WPC_RAM_LOCK: 0x3FFD,

  //WPC_PROTMEMCTRL
  WPC_RAM_LOCKSIZE: 0x3FFE,
  WPC_ZEROCROSS_IRQ_CLEAR: 0x3FFF,
};

const REVERSEOP = [];
Object.keys(OP).forEach((key) => {
  REVERSEOP[OP[key]] = key;
});

const PAGESIZE_MAP = [0x00, 0x07, 0x0F, 0x00, 0x1F, 0x00, 0x00, 0x00, 0x3F];
const SYSTEM_ROM_BANK_NUMBER1 = 62;
const SYSTEM_ROM_BANK_NUMBER2 = 63;

// Country CODE USA 1
const JUMPER_SETTINGS = 0x00;

const WPC_PROTECTED_MEMORY_UNLOCK_VALUE = 0xB4;

module.exports = {
  getInstance,
  SYSTEM_ROM_BANK_NUMBER1,
  SYSTEM_ROM_BANK_NUMBER2,
  OP,
};

function getInstance(initObject) {
  return new CpuBoardAsic(initObject);
}

class CpuBoardAsic {
  constructor(initObject) {
    this.interruptCallback = initObject.interruptCallback;
    this.pageMask = PAGESIZE_MAP[initObject.romSizeMBit];
    debug('pageMask calculated %o', { pageMask: this.pageMask, romSizeMBit: initObject.romSizeMBit });
    this.ram = initObject.ram;

    this.inputSwitchMatrix = inputSwitchMatrix.getInstance();
    this.outputLampMatrix = outputLampMatrix.getInstance(timing.CALL_UPDATELAMP_AFTER_TICKS);
    this.outputSolenoidMatrix = outputSolenoidMatrix.getInstance(timing.CALL_UPDATESOLENOID_AFTER_TICKS);
    this.outputGeneralIllumination = outputGeneralIllumination.getInstance();
  }

  reset() {
    console.log('RESET_ASIC');
    this.periodicIRQTimerEnabled = true;
    this.romBank = 0;
    this.diagnosticLedToggleCount = 0;
    this.oldDiagnostigLedState = 0;
    this._firqSourceDmd = false;

    this.ticksZeroCross = 0;
  }

  getUiState() {
    const diagnosticLed = this.ram[OP.WPC_LEDS];

    return {
      diagnosticLed,
      lampState: this.outputLampMatrix.lampState,
      solenoidState: this.outputSolenoidMatrix.solenoidState,
      generalIlluminationState: this.outputGeneralIllumination.generalIlluminationState,
      inputState: this.inputSwitchMatrix.switchState,
      diagnosticLedToggleCount: this.diagnosticLedToggleCount,
      irqEnabled: this.periodicIRQTimerEnabled,
      activeRomBank: this.romBank,
    };
  }

  setZeroCrossFlag() {
    //debug('set zerocross flag');
    this.zeroCrossFlag = 0x01;
  }

  setCabinetInput(value) {
    debug('setCabinetInput', value);
    this.inputSwitchMatrix.setCabinetKey(value & 0xFF);
  }

  setInput(value) {
    debug('setInput', value);
    this.inputSwitchMatrix.setInputKey(value & 0xFF);
  }

  firqSourceDmd(fromDmd) {
    debug('firqSourceDmd', fromDmd);
    this._firqSourceDmd = fromDmd === true;
  }

  executeCycle(ticksExecuted) {
    this.ticksZeroCross += ticksExecuted;
    if (this.ticksZeroCross >= timing.CALL_ZEROCLEAR_AFTER_TICKS) {
      this.ticksZeroCross -= timing.CALL_ZEROCLEAR_AFTER_TICKS;
      this.setZeroCrossFlag();
    }

    this.outputLampMatrix.executeCycle(ticksExecuted);
    this.outputSolenoidMatrix.executeCycle(ticksExecuted);
  }

  isMemoryProtectionEnabled() {
    return this.ram[OP.WPC_RAM_LOCK] === WPC_PROTECTED_MEMORY_UNLOCK_VALUE;
  }

  write(offset, value) {
    this.ram[offset] = value;

    switch (offset) {
      // save value and bail out
      case OP.WPC_RAM_LOCKSIZE:
        if (this.isMemoryProtectionEnabled()) {
          this.memoryProtectionMask = memoryProtection.getMemoryProtectionMask(value);
          debug('UPDATED_MEMORY_PROTECTION_MASK', this.memoryProtectionMask);
        }
        break;

      case OP.WPC_RAM_LOCK:
      case OP.WPC_RAM_BANK:
      case OP.WPC_CLK_HOURS_DAYS:
      case OP.WPC_CLK_MINS:
      case OP.WPC_SHIFTADDRH:
      case OP.WPC_SHIFTADDRL:
      case OP.WPC_SHIFTBIT:
      case OP.WPC_SHIFTBIT2:
      case OP.WPC_ROM_LOCK:
      case OP.WPC_EXTBOARD1:
      case OP.WPC_EXTBOARD2:
      case OP.WPC_EXTBOARD3:
      case OP.WPC_EXTBOARD4:
      case OP.WPC_EXTBOARD5:
        debug('WRITE', REVERSEOP[offset], value);
        break;

      case OP.WPC_SWITCH_COL_SELECT:
        this.inputSwitchMatrix.setActiveColumn(value);
        break;

      case OP.WPC_GI_TRIAC:
        this.outputGeneralIllumination.update(value);
        break;

      case OP.WPC_LAMP_ROW_OUTPUT:
        debug('WRITE', REVERSEOP[offset], value);
        this.outputLampMatrix.setActiveRow(value);
        break;

      case OP.WPC_LAMP_COL_STROBE:
        debug('WRITE', REVERSEOP[offset], value);
        this.outputLampMatrix.setActiveColumn(value);
        break;

      case OP.WPC_PERIPHERAL_TIMER_FIRQ_CLEAR:
        debug('WRITE', REVERSEOP[offset], value);
        //TODO if firq source is called here, some blitings are missing
        //      for example in the display test "RAM TEST OK" is not visible at the end!
        this.interruptCallback.clearFirqFlag();
        break;

      case OP.WPC_SOLENOID_GEN_OUTPUT:
      case OP.WPC_SOLENOID_HIGHPOWER_OUTPUT:
      case OP.WPC_SOLENOID_FLASH1_OUTPUT:
      case OP.WPC_SOLENOID_LOWPOWER_OUTPUT:
        this.outputSolenoidMatrix.setActive(offset, value);
        break;

      case OP.WPC_LEDS:
        if (value !== this.oldDiagnostigLedState) {
          debug('DIAGNOSTIC_LED_TOGGLE', this.oldDiagnostigLedState, value);
          this.diagnosticLedToggleCount++;
          this.oldDiagnostigLedState = value;
        }
        break;

      case OP.WPC_ROM_BANK:
        //Bank #$3F does not exist as bank #$3E contains the 32 KiB big "System ROM" which is always available at $8000.
        if (value === SYSTEM_ROM_BANK_NUMBER1 || value === SYSTEM_ROM_BANK_NUMBER2) {
          debug('SELECT SYSTEM WPC_ROM_BANK', value);
          this.romBank = value;
          return;
        }
        debug('WRITE WPC_ROM_BANK', value, value & this.pageMask);
        // only 6 bits
        this.romBank = value & this.pageMask;
        break;

      case OP.WPC_ZEROCROSS_IRQ_CLEAR: {
        if (value & 0x80) {
          debug('WRITE WPC_ZEROCROSS_IRQ_CLEAR: WPC_ZEROCROSS_IRQ_CLEAR', value);
          //TODO clears the source of the periodic timer interrupt.
          this.interruptCallback.clearIrqFlag();
          //TODO increment gi
        }

        const timerEnabled = (value & 0x10) > 0;
        if (timerEnabled !== this.periodicIRQTimerEnabled) {
          debug('WRITE WPC_ZEROCROSS_IRQ_CLEAR periodic timer changed', timerEnabled);
          //The periodic interrupt can be disabled/enabled by writing to the ASIC's WPC_ZEROCROSS_IRQ_CLEAR register.
          this.periodicIRQTimerEnabled = timerEnabled;
        }

/*        if (value & 0x04) {
          debug('WRITE WPC_ZEROCROSS_IRQ_CLEAR: RESET WATCHDOG');
        }
        /**/
        break;
      }

      default:
        debug('W_NOT_IMPLEMENTED', '0x' + offset.toString(16), value);
        console.log('W_NOT_IMPLEMENTED', '0x' + offset.toString(16), value);
        break;
    }
  }

  read(offset) {
    let temp;
    switch (offset) {
      //ignored
      case OP.WPC_RAM_LOCK:
      case OP.WPC_RAM_LOCKSIZE:
      console.log('READ', REVERSEOP[offset], this.ram[offset]);
      return this.ram[offset];

      case OP.WPC_LEDS:
      case OP.WPC_ROM_LOCK:
      case OP.WPC_EXTBOARD1:
      case OP.WPC_EXTBOARD2:
      case OP.WPC_EXTBOARD3:
      case OP.WPC_EXTBOARD4:
      case OP.WPC_EXTBOARD5:
        debug('READ', REVERSEOP[offset], this.ram[offset]);
        return this.ram[offset];

      case OP.WPC_SWITCH_CABINET_INPUT:
        return this.inputSwitchMatrix.getCabinetKey();

      case OP.WPC_ROM_BANK:
        debug('READ', REVERSEOP[offset], this.ram[offset]);
        return this.ram[offset] & this.pageMask;

      case OP.WPC_SWITCH_ROW_SELECT:
        return this.inputSwitchMatrix.getActiveRow();

      case OP.WPC_SHIFTADDRH:
        //TODO not sure how to handle the possible overflow
        temp = (this.ram[OP.WPC_SHIFTADDRH] +
                ((this.ram[OP.WPC_SHIFTADDRL] + (this.ram[OP.WPC_SHIFTBIT] >>> 3)) >>> 8)
              ) & 0xFF;
        debug('READ WPC_SHIFTADDRH', temp);
        return temp;
      case OP.WPC_SHIFTADDRL:
        temp = (this.ram[OP.WPC_SHIFTADDRL] + (this.ram[OP.WPC_SHIFTBIT] >>> 3)) & 0xFF;
        debug('READ WPC_SHIFTADDRL', temp);
        return temp;
      case OP.WPC_SHIFTBIT:
      case OP.WPC_SHIFTBIT2:
        debug('READ', REVERSEOP[offset]);
        return 1 << (this.ram[offset] & 0x07);

      case OP.WPC_CLK_HOURS_DAYS:
        //TODO pinmame adds date infos and checksum to the ram?
        temp = new Date();
        debug('READ WPC_CLK_HOURS_DAYS', temp.getHours());
        return temp.getHours();

      case OP.WPC_CLK_MINS:
        temp = new Date();
        debug('READ WPC_CLK_MINS', temp.getMinutes());
        return temp.getMinutes();

      case OP.WPC_SW_JUMPER_INPUT:
        //SW1 SW2 W20 W19 Country(SW4-SW8)
        debug('READ WPC_SW_JUMPER_INPUT');
        return JUMPER_SETTINGS;

      case OP.WPC_ZEROCROSS_IRQ_CLEAR:
        temp = this.zeroCrossFlag << 7 | (this.ram[offset] & 0x7F);
        debug('READ WPC_ZEROCROSS_IRQ_CLEAR', temp, this.zeroCrossFlag ? 'ZCF_SET' : 'ZCF_NOTSET');
        this.zeroCrossFlag = 0;
        //TODO reset GI counting of zeroCrossFlag is set
        return temp;

      case OP.WPC_PERIPHERAL_TIMER_FIRQ_CLEAR:
        debug('READ WPC_PERIPHERAL_TIMER_FIRQ_CLEAR', this._firqSourceDmd);
        return this._firqSourceDmd === true ? 0x0 : 0x80;

      default:
        debug('R_NOT_IMPLEMENTED', '0x' + offset.toString(16), this.ram[offset]);
        console.log('R_NOT_IMPLEMENTED', '0x' + offset.toString(16), this.ram[offset]);
        return this.ram[offset];
    }
  }
}

/*

  wpcemu:boards:wpc W_NOT_IMPLEMENTED 0x3ff3 0 +57ms

Address	  Format	 Description
$3FE0     Byte     WPC_SOLENOID_GEN_OUTPUT (7-0: W: Enables for solenoids 25-29) or 25-28???
$3FE1     Byte     WPC_SOLENOID_HIGHPOWER_OUTPUT (7-0: W: Enables for solenoids 1-8)
$3FE2     Byte     WPC_SOLENOID_FLASH1_OUTPUT (7-0: W: Enables for solenoids 17-24)
$3FE3     Byte     WPC_SOLENOID_LOWPOWER_OUTPUT (7-0: W: Enables for solenoids 9-16)
$3FE4     Byte     WPC_LAMP_ROW_OUTPUT (7-0: W: Lamp matrix row output)
$3FE5     Byte     WPC_LAMP_COL_STROBE (7-0: W: Enables for solenoids 9-16)
                    7-0: W: Lamp matrix column strobe, At most one bit in this register should be set.
                    If all are clear, then no controlled lamps are enabled.
$3FE6     Byte     WPC_GI_TRIAC
                    7: W: Flipper enable relay
                    5: W: Coin door enable relay
                    4-0: W: General illumination enables
$3FE7     Byte     WPC_SW_JUMPER_INPUT (7-0: R: Jumper/DIP switch inputs)
$3FE8     Byte     WPC_SW_CABINET_INPUT
                    7: R: Fourth coin switch
                    6: R: Right coin switch
                    5: R: Center coin switch
                    4: R: Left coin switch
                    3: R: Enter (Begin Test) button
                    2: R: Up button
                    1: R: Down button
                    0: R: Escape (Service Credit) button
$3fe9     Byte     WPC_SW_ROW_INPUT
                    7-0: R: Readings for the currently selected switch column.
                    Bit 0 corresponds to row 1, bit 1 to row 2, and so on.
                    A '1' indicates active voltage level.  For a mechanical switch,
                    this means the switch is closed.  For an optical switch, this
                    means the switch is open.
$3fea     Byte     WPC_SW_COL_STROBE, W: Switch column enable
$3FEB     Byte     WPC_EXTBOARD1 (On DMD games, this is a general I/O that is used for machine-specific purposes)
$3FEC     Byte     WPC_EXTBOARD2 (On DMD games, this is a general I/O that is used for machine-specific purposes)
$3FED     Byte     WPC_EXTBOARD3 (On DMD games, this is a general I/O that is used for machine-specific purposes)
0x3FF0             WPC_ASIC_BASE

$3FF2     Byte     WPC_LEDS (7: R/W: The state of the diagnostic LED. >0=Off >1=On)
                    - blink once, it indicates a problem with the CPU ROM
                    - blink twice, the game RAM is faulty, or, again, traces, etc
                    - blink thrice, there's a problem with the ASIC, or again, traces, etc.
$3FF3     Byte     WPC_RAM_BANK    :
$3FF4     Byte     WPC_SHIFTADDRH
$3FF5     Byte     WPC_SHIFTADDRL
                    15-0: R/W: The base address for the bit shifter.
                    Writing to this address initializes the shifter.
                    Reading from this address after a shift command returns the
                    shifted address.
$3FF6     Byte     WPC_SHIFTBIT
                    7-0: W: Sets the bit position for a shift command.
                    7-0: R: Returns the output of the last shift command as a bitmask.
$3FF7     Byte     WPC_SHIFTBIT2
$3FF8     Byte     WPC_PERIPHERAL_TIMER_FIRQ_CLEAR R: bit 7 0=DMD, 1=SOUND? W: Clear FIRQ line
$3FF9     Byte     WPC_ROM_LOCK
$3FFA	    Byte	   WPC_CLK_HOURS_DAYS (7-0: R/W: The time-of-day hour counter)
$3FFB	    Byte	   WPC_CLK_MINS (7-0: R/W: The time-of-day minute counter)
$3FFC	    Byte	   WPC_ROM_BANK (5-0: R/W)
                    5-0: R/W: The page of ROM currently mapped into the banked region (0x4000-0x7FFF).
                    Pages 62 and 63 correspond to the uppermost 32KB, and are not normally mapped
                    because those pages are accessible in the fixed region (0x8000-0xFFFF).
                    Page numbers are consecutive.  Page 0 corresponds to the lowest address in a
                    1MB device.  If a smaller ROM is installed, the uppermost bits of this register
                    are effectively ignored.
$3FFD     Byte     WPC_RAM_LOCK
$3FFE     Byte     WPC_RAM_LOCKSIZE
$3FFF     Byte     WPC_ZEROCROSS_IRQ_CLEAR aka WPC_WATCHDOG
                    7: R: Set to 1 when AC is currently at a zero crossing, or 0 otherwise.
                    7: W: Writing a 1 here clears the source of the periodic timer interrupt.
                    4: R/W: Periodic timer interrupt enable
                    >0=Periodic IRQ disabled
                    >1=Periodic IRQ enabled
                    2: W: Writing a 1 here resets the watchdog.
*/