import logic from './logic.js';
import compiler from './compiler.js';
import { displayAnError } from './error.js';
import { tokenize, reset } from './interpreter.js';

const elRun = document.getElementById('run');
const elReset = document.getElementById('reset');
const elClear = document.getElementById('clear');
const elCompile = document.getElementById('compile');

function debug() {
  const code = myCodeMirror.getValue();
  
  displayAnError('');
  tokenize(code);
}

function clear() {
  let el = document.getElementById('app');

  el.innerHTML = '';
  displayAnError('');

  myCodeMirror = CodeMirror(el, {
    value: '',
    mode: 'VRM',
    tabSize: 2,
    lineNumbers: true,
    firstLineNumber: 0,
  });
}

function compile() {
  const code = myCodeMirror.getValue();

  displayAnError('');
  compiler(code);
}

elRun.addEventListener('click', debug);
elReset.addEventListener('click', reset);
elClear.addEventListener('click', clear);
elCompile.addEventListener('click', compile);

window.logic = logic;
