'use strict';

import test from 'ava';
import CpuBoard from '../../../lib/boards/cpu-board';

const PAGESIZE = 0x4000;
const WPC_ROM_BANK = 0x3FFC;

test.beforeEach((t) => {
  const gameRom = new Uint8Array(0x18000);
  const initObject = {
    romObject: '',
    romSizeMBit: 1,
    systemRom: new Uint8Array(2 * PAGESIZE).fill(0xFF),
    fileName: 'foo',
    gameRom,
  };
  t.context = CpuBoard.getInstance(initObject);
});

test('should get ui data', (t) => {
  const cpuBoard = t.context;
  cpuBoard.reset();
  const result = cpuBoard.getUiState();
  t.is(result.ticks, 0);
  t.is(result.missedIrqCall, 0);
  t.is(result.missedFirqCall, 0);
  t.is(result.irqCount, 0);
  t.is(result.firqCount, 0);
  t.is(result.nmiCount, 0);
  t.is(result.protectedMemoryWriteAttempts, 0);
});

test('should start cpu board', (t) => {
  const cpuBoard = t.context;
  cpuBoard.start();
  const result = cpuBoard.getUiState();
  t.is(result.ticks, 0);
});

test('should change cabinet input', (t) => {
  const cpuBoard = t.context;
  cpuBoard.start();
  cpuBoard.setCabinetInput(1);
  const state = cpuBoard.getUiState();
  const result = state.asic.wpc.inputState;
  t.is(result[0], 1);
});

test('should change switch input', (t) => {
  const cpuBoard = t.context;
  cpuBoard.start();
  cpuBoard.setInput(11);
  cpuBoard.setInput(13);
  const state = cpuBoard.getUiState();
  const result = state.asic.wpc.inputState;
  t.is(result[1], 5);
});

test('should change fliptronice input', (t) => {
  const cpuBoard = t.context;
  cpuBoard.start();
  cpuBoard.setFliptronicsInput('F1');
  const state = cpuBoard.getUiState();
  const result = state.asic.wpc.inputState;
  t.is(result[9], 1);
});

test('should _bankswitchedRead, bank 0', (t) => {
  const BANK = 0;
  const cpuBoard = t.context;
  cpuBoard.gameRom[0] = 12;
  cpuBoard.asic.write(WPC_ROM_BANK, BANK);
  const result = cpuBoard._bankswitchedRead(0);
  t.is(result, 12);
});

test('should _bankswitchedRead, bank 1', (t) => {
  const BANK = 1;
  const cpuBoard = t.context;
  cpuBoard.gameRom[PAGESIZE] = 12;
  cpuBoard.asic.write(WPC_ROM_BANK, BANK);
  const result = cpuBoard._bankswitchedRead(0);
  t.is(result, 12);
});

test('should _bankswitchedRead, bank 5', (t) => {
  const BANK = 5;
  const cpuBoard = t.context;
  cpuBoard.gameRom[5 * PAGESIZE] = 12;
  cpuBoard.asic.write(WPC_ROM_BANK, BANK);
  const result = cpuBoard._bankswitchedRead(0);
  t.is(result, 12);
});

test('should _bankswitchedRead, bank 6 (systemrom)', (t) => {
  const BANK = 6;
  const cpuBoard = t.context;
  // this read wraps already
  cpuBoard.systemRom[0] = 12;
  cpuBoard.asic.write(WPC_ROM_BANK, BANK);
  const result = cpuBoard._bankswitchedRead(0);
  t.is(result, 12);
});

test('should _bankswitchedRead, bank 7 (systemrom)', (t) => {
  const BANK = 7;
  const cpuBoard = t.context;
  cpuBoard.systemRom[PAGESIZE] = 12;
  cpuBoard.asic.write(WPC_ROM_BANK, BANK);
  const result = cpuBoard._bankswitchedRead(0);
  t.is(result, 12);
});

test('should _bankswitchedRead, bank 8', (t) => {
  const BANK = 8;
  const cpuBoard = t.context;
  cpuBoard.gameRom[0] = 12;
  cpuBoard.asic.write(WPC_ROM_BANK, BANK);
  const result = cpuBoard._bankswitchedRead(0);
  t.is(result, 12);
});

test('should _bankswitchedRead, bank 0xFF (systemrom)', (t) => {
  const BANK = 0xFF;
  const cpuBoard = t.context;
  cpuBoard.systemRom[PAGESIZE] = 12;
  cpuBoard.asic.write(WPC_ROM_BANK, BANK);
  const result = cpuBoard._bankswitchedRead(0);
  t.is(result, 12);
});
