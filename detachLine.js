let linesEls = mainEl.lastChild.childNodes[5].childNodes[0].lastChild.lastChild.lastChild
  .lastChild.childNodes;
let lastLine = linesEls[0];

function getNodes() {
  linesEls = mainEl.lastChild.childNodes[5].childNodes[0].lastChild.lastChild.lastChild
    .lastChild.childNodes;
  if (lastLine) normalizeLine(lastLine);
}

function normalizeLine(el) {
  el.style.backgroundColor = '';
}

function detach(line) {
  let el = linesEls[line];

  lastLine.style.backgroundColor = '';
  if (!el) return;

  el.style.backgroundColor = '#4d4d2c';
  lastLine = el;
}

function lineError(line) {
  let el = linesEls[line];

  lastLine.style.backgroundColor = '';
  if (!el) return;
  el.style.backgroundColor = '#4d2c2c';
  lastLine = el;
}

function clear() {
  lastLine.style.backgroundColor = '';
}

export {detach, getNodes, lineError, clear};
