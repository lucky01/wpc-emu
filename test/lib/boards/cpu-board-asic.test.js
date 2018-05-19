'use strict';

import test from 'ava';
import CpuBoardAsic from '../../../lib/boards/cpu-board-asic';

test.beforeEach((t) => {
  const ram = new Uint8Array(0x4000);
  const initObject = {
    interruptCallback: {},
    ram,
  };
  t.context = CpuBoardAsic.getInstance(initObject);
});

test('wpc, should set zerocross flag', (t) => {
  const wpc = t.context;
  wpc.setZeroCrossFlag();
  t.is(wpc.zeroCrossFlag, 1);
});

test('wpc, should clear zerocross flag when read', (t) => {
  const wpc = t.context;
  wpc.setZeroCrossFlag();
  const result = wpc.read(CpuBoardAsic.OP.WPC_ZEROCROSS_IRQ_CLEAR);
  t.is(result, 128);
  t.is(wpc.zeroCrossFlag, 0);
});

test('wpc, should respect old zerocross flag state when read', (t) => {
  const wpc = t.context;
  wpc.write(CpuBoardAsic.OP.WPC_ZEROCROSS_IRQ_CLEAR, 0x7F);
  wpc.setZeroCrossFlag();
  const result = wpc.read(CpuBoardAsic.OP.WPC_ZEROCROSS_IRQ_CLEAR);
  t.is(result, 0xFF);
  t.is(wpc.zeroCrossFlag, 0);
});

test('wpc, should WPC_SHIFTADDRL by 0xFF - not sure', (t) => {
  const wpc = t.context;
  wpc.write(CpuBoardAsic.OP.WPC_SHIFTADDRL, 0x08);
  wpc.write(CpuBoardAsic.OP.WPC_SHIFTBIT, 0xFF);
  const result = wpc.read(CpuBoardAsic.OP.WPC_SHIFTADDRL);
  t.is(result, 0x27);
});

test('wpc, should WPC_SHIFTADDRL by 0x1 - not sure', (t) => {
  const wpc = t.context;
  wpc.write(CpuBoardAsic.OP.WPC_SHIFTADDRL, 0x08);
  wpc.write(CpuBoardAsic.OP.WPC_SHIFTBIT, 0x1);
  const result = wpc.read(CpuBoardAsic.OP.WPC_SHIFTADDRL);
  t.is(result, 0x08);
});

test('wpc, should WPC_SHIFTADDRH - not sure', (t) => {
  const wpc = t.context;
  wpc.write(CpuBoardAsic.OP.WPC_SHIFTADDRH, 0xA8);
  wpc.write(CpuBoardAsic.OP.WPC_SHIFTADDRL, 0x08);
  wpc.write(CpuBoardAsic.OP.WPC_SHIFTBIT, 0xFF);
  const result = wpc.read(CpuBoardAsic.OP.WPC_SHIFTADDRH);
  t.is(result, 0xA8);
});

test('wpc, should WPC_SHIFTBIT 0x00', (t) => {
  const wpc = t.context;
  wpc.write(CpuBoardAsic.OP.WPC_SHIFTBIT, 0x00);
  const result = wpc.read(CpuBoardAsic.OP.WPC_SHIFTBIT);
  t.is(result, 0x01);
});

test('wpc, should WPC_SHIFTBIT 0x01', (t) => {
  const wpc = t.context;
  wpc.write(CpuBoardAsic.OP.WPC_SHIFTBIT, 0x01);
  const result = wpc.read(CpuBoardAsic.OP.WPC_SHIFTBIT);
  t.is(result, 0x02);
});

test('wpc, should WPC_SHIFTBIT 0x04', (t) => {
  const wpc = t.context;
  wpc.write(CpuBoardAsic.OP.WPC_SHIFTBIT, 0x04);
  const result = wpc.read(CpuBoardAsic.OP.WPC_SHIFTBIT);
  t.is(result, 0x10);
});

test('wpc, should WPC_SHIFTBIT 0xFF', (t) => {
  const wpc = t.context;
  wpc.write(CpuBoardAsic.OP.WPC_SHIFTBIT, 0xFF);
  const result = wpc.read(CpuBoardAsic.OP.WPC_SHIFTBIT);
  t.is(result, 0x80);
});

test('wpc, update active lamp', (t) => {
  const wpc = t.context;
  wpc.write(CpuBoardAsic.OP.WPC_LAMP_ROW_OUTPUT, 0x4);
  wpc.write(CpuBoardAsic.OP.WPC_LAMP_COL_STROBE, 0x4);
  const result = wpc.getUiState().lampState;
  t.is(result[18], 0x80);
});