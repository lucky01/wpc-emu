'use strict';

import '../node_modules/milligram/dist/milligram.css';
import '../styles/client.css';

import { downloadFileFromUrlAsUInt8Array } from './lib/fetcher';
import { initialiseEmulator } from './lib/emulator';
import { initialiseActions } from './lib/initialise';
import { AudioOutput } from './lib/sound';
import * as gamelist from './db/gamelist';
import { populateControlUiView } from './ui/control-ui';
import * as emuDebugUi from './ui/emu-debug-ui';
//import * as emuDebugUi from './ui/ram-state-ui';

const TICKS = 2000000;
const DESIRED_FPS = 58;
const TICKS_PER_STEP = parseInt(TICKS / DESIRED_FPS, 10);
const INITIAL_GAME = 'Hurricane';

const AudioContext = window.AudioContext || window.webkitAudioContext;
const soundInstance = AudioOutput(AudioContext);

var wpcSystem;
var intervalId;

function dacCallback(value) {
  soundInstance.writeAudioData(value);
}

function initialiseEmu(gameEntry) {
  const u06Promise = downloadFileFromUrlAsUInt8Array(gameEntry.rom.u06);
  const u14Promise = downloadFileFromUrlAsUInt8Array(gameEntry.rom.u14).catch(() => {});
  const u15Promise = downloadFileFromUrlAsUInt8Array(gameEntry.rom.u15).catch(() => {});
  const u18Promise = downloadFileFromUrlAsUInt8Array(gameEntry.rom.u18).catch(() => {});

  return Promise.all([
      u06Promise,
      u14Promise,
      u15Promise,
      u18Promise,
    ])
    .then((romFiles) => {
      console.log('Successully loaded ROM');
      const romData = {
        u06: romFiles[0],
        u14: romFiles[1],
        u15: romFiles[2],
        u18: romFiles[3],
      };
      return initialiseEmulator(romData, gameEntry);
    })
    .then((_wpcSystem) => {
      console.log('Successfully initialised emulator');
      const selectElementRoot = document.getElementById('wpc-release-info');
      selectElementRoot.innerHTML = 'WPC-Emu v' + _wpcSystem.version();

      wpcSystem = _wpcSystem;
      // TODO IIKS we pollute globals here
      window.wpcInterface = {
        wpcSystem,
        pauseEmu,
        resumeEmu,
        romSelection
      };
      wpcSystem.registerAudioConsumer(dacCallback);
      wpcSystem.start();
      soundInstance.setMixStereoFunction(wpcSystem.mixStereo);
      console.log('Successully started EMU v' + wpcSystem.version());
      return emuDebugUi.initialise(gameEntry);
    })
    .catch((error) => {
      console.error('FAILED to load ROM:', error.message);
      console.log(error.stack);
    });
}

function romSelection(romName) {
  initEmuWithGameName(romName);
}

function initEmuWithGameName(name) {
  const gameEntry = gamelist.getByName(name);
  populateControlUiView(gameEntry, gamelist, name);
  return initialiseEmu(gameEntry)
    .then(() => {
      resumeEmu();
      return initialiseActions(gameEntry.initialise, wpcSystem);
    });
}

initEmuWithGameName(INITIAL_GAME);

//called at 60hz -> 16.6ms
function step() {
  wpcSystem.executeCycle(TICKS_PER_STEP, 16);
  const emuState = wpcSystem.getUiState();
  const cpuState = intervalId ? 'running' : 'paused';
  emuDebugUi.updateCanvas(emuState, cpuState);
  intervalId = requestAnimationFrame(step);
}

function resumeEmu() {
  if (intervalId) {
    pauseEmu();
  }
  console.log('client start emu');
  intervalId = requestAnimationFrame(step);
}

function pauseEmu() {
  console.log('stop emu');
  cancelAnimationFrame(intervalId);
  intervalId = false;
  emuDebugUi.updateCanvas(wpcSystem.getUiState(), 'paused');
}
