import logic from './logic.js';
import compiler from './compiler.js';
import displayAnError from './error.js';
import { tokenize, reset, toStop, unStop } from './interpreter.js';

const elRun = document.getElementById('run');
const elStop = document.getElementById('stop');
const elDebug = document.getElementById('debug');
const elReset = document.getElementById('reset');
const elClear = document.getElementById('clear');
const elCompile = document.getElementById('compile');

const elRange = document.getElementById('timeRange');
const elLabel = document.getElementById('timeLabel');

function getTime() {
  return elRange.value * 10;
}

function timeSet() {
  elLabel.innerHTML = getTime() + 'ms';
}

function run() {
  const code = myCodeMirror.getValue();

  displayAnError('');
  tokenize(code, 0);
}

function stop() {
  toStop();
  setTimeout(unStop, 1000);
}

function debug() {
  const code = myCodeMirror.getValue();

  displayAnError('');
  tokenize(code, getTime());
}

function compile() {
  const code = myCodeMirror.getValue();

  displayAnError('');
  compiler(code);
}

elRange.value = 50;
timeSet();

elRun.addEventListener('click', run);
elStop.addEventListener('click', stop);
elDebug.addEventListener('click', debug);
elReset.addEventListener('click', reset);
elClear.addEventListener('click', () => myCodeMirror.setValue(''));
elRange.addEventListener('click', timeSet)
elCompile.addEventListener('click', compile);

window.logic = logic;
