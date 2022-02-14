// 0: IN_INPUT
// 1: IN_ADD
// 2: IN_AH
// 3: IN_ARM
// 4: IN_BRM
// 5: OUT_AC
// 6: OUT_BC
// 7: OUT_ARM
// 8: OUT_BRM
// 9: OUT_AH
// A: CARRY_IN
// B: CLS_CARRY
// C: CLS_M
// D: BMA_M
// E: BMS_M

import logic from './logic.js';
import displayAnError from './error.js';
import {detach, getNodes, lineError, clear} from './detachLine.js';

let registers = {};
let RAM = {};
let BUS = null;
let BUS_IN = {};
let BUS_OUT = {};
let carry = [false];

const registersList = [
  'M',
  'INPUT',
  'ADD',
  'CARRY',
  'AH',
  'AC',
  'BC',
  'ARM',
  'BRM',
  'DC',
  'EC',
];
const busInList = ['IN_INPUT', 'IN_ADD', 'IN_AH', 'IN_ARM', 'IN_BRM'];
const busOutList = ['OUT_AC', 'OUT_BC', 'OUT_ARM', 'OUT_BRM', 'OUT_AH'];

const key = {
  A: Symbol('A'),
  B: Symbol('B'),
  C: Symbol('C'),
  D: Symbol('D'),
  E: Symbol('E'),
};

const compareOperators = {
  EQ: Symbol('EQ'),
  NEQ: Symbol('NEQ'),
  LE: Symbol('LE'),
  LEQ: Symbol('LEQ'),
  GR: Symbol('GR'),
  GRQ: Symbol('GRQ'),
  invert(operator) {
    switch (this[operator]) {
      case this.EQ:
      case this.NEQ:
        return operator;
      case this.LE:
        return 'GR';
      case this.LEQ:
        return 'GRQ';
      case this.GR:
        return 'LE';
      case this.GRQ:
        return 'LEQ';
    }
  }
};

let stop = false;

const newKey = (value, register) => ({ value, register });

function show() {
  let el = document.getElementById('show');
  let text = '';

  text += 'registradores:<br>';
  for (let register of registersList) {
    let MI = register;

    if (register != 'ARM' && register != 'BRM') {
      text += `${MI}: ${logic.toNumber(registers[MI])}<br>`;
    } else {
      text += `${MI}: ${RAM[MI].map(logic.toNumber).join(', ')}<br>`;
    }
  }
  text += 'valor no BUS: ' + logic.toNumber(BUS);

  el.innerHTML = text;
}

function reset() {
  RAM = {
    ARM: new Array(8).fill(new Array(4).fill(false)),
    BRM: new Array(8).fill(new Array(4).fill(false)),
  };

  registers = {
    M: new Array(3).fill(false),
    INPUT: new Array(4).fill(false),
    ADD: new Array(4).fill(false),
    CARRY: [false],
    AH: new Array(4).fill(false),
    AC: new Array(4).fill(false),
    BC: new Array(4).fill(false),
    ARM: new Array(4).fill(false),
    BRM: new Array(4).fill(false),
    DC: new Array(4).fill(false),
    EC: [false],
  };

  BUS = null;

  BUS_IN = {
    IN_INPUT: newKey(false, 'INPUT'),
    IN_ADD: newKey(false, 'ADD'),
    IN_AH: newKey(false, 'AH'),
    IN_ARM: newKey(false, 'ARM'),
    IN_BRM: newKey(false, 'BRM'),
  };

  BUS_OUT = {
    OUT_AC: newKey(false, 'AC'),
    OUT_BC: newKey(false, 'BC'),
    OUT_ARM: newKey(false, 'ARM'),
    OUT_BRM: newKey(false, 'BRM'),
    OUT_AH: newKey(false, 'AH'),
  };

  show();
}

function busInUpdate(port) {
  busInList.forEach((input) => {
    if (input == port) {
      BUS = registers[BUS_IN[input].register];
    }
  });
}

function busOutUpdate(buses) {
  buses.forEach((output) => {
    const register = busOutList[output - 5];

    registers[BUS_OUT[register].register] = BUS;
    BUS_OUT[register].value = BUS;

    if (register == 'OUT_ARM') {
      RAM.ARM[logic.toNumber(registers.M)] = BUS;
    } else if (register == 'OUT_BRM') {
      RAM.BRM[logic.toNumber(registers.M)] = BUS;
    } else if (register == 'OUT_AC' || register == 'OUT_BC') {
      let ALU_Result = logic.ALU(
        registers.AC,
        registers.BC,
        registers.CARRY[0]
      );

      registers.ADD = ALU_Result[0];
      carry = ALU_Result.slice(1, 2);
    }
  });
}

function INPUT(number) {
  let bin = logic.hexToBinary(number);

  registers.INPUT = bin;
}

function updateCarry(microInstruction) {
  switch (key[microInstruction]) {
    case key.A:
      registers.CARRY = carry;
      break;
    case key.B:
      registers.CARRY = [false];
  }
}

function BUMP(bool) {
  const value = registers.M;
  let newValue;

  if (bool) {
    if (logic.toNumber(value) < 7) {
      newValue = logic.iterate(value);
    } else {
      newValue = new Array(3).fill(false);
    }
  } else {
    if (logic.toNumber(value) > 0) {
      newValue = logic.unterate(value);
    } else {
      newValue = new Array(3).fill(true);
    }
  }

  registers.M = newValue;

  registers.ARM = RAM.ARM[logic.toNumber(newValue)];
  registers.BRM = RAM.BRM[logic.toNumber(newValue)];
}

function updateAddres(microInstruction) {
  switch (key[microInstruction]) {
    case key.C:
      registers.M = new Array(3).fill(false);
      break;
    case key.D:
    case key.E:
      BUMP(key[microInstruction] == key.D);
  }
}

function error(err) {
  displayAnError(err);
  head = 0;
  loopList = [];
  conditional = false;
  target = null;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function toStop() {
  clear();
  stop = true;
}

function unStop() {
  stop = false;
}

async function tokenize(code, delay) {
  let instruction = [];
  let literal = false;
  let comment = false;
  let input = false;

  let position = 0;
  let line = 0;
  let lineIndex = [];

  let compareMode = false;
  let word = '';
  let words = 0;

  let conditional = false;
  let head = 0;
  let loopList = [];
  let target;

  function wordTokenize() {
    if (!compareMode && words > 2) {
      lineError(line);
      error(`${word} não era esperado na linha ${line + 1} e posição ${position}`);

      return true;
    } else if (
      words === 0 &&
      !/\b(INPUT|CMP|JMP)\b/.test(word) &&
      !/\b(0x)+([a-fA-F0-9])\b/.test(word)
    ) {
      lineError(line);
      error(
        `${word} não é reconhecido como uma instrução interna (linha ${line + 1} posição ${
          position - word.length
        }).`
      );

      return true;
    } else if (
      !compareMode &&
      words === 1 &&
      !/\b(0x)+([a-fA-F0-9])\b/.test(word)
    ) {
      lineError(line);
      error(
        `${word} não é um numero hexadecimal válido (linha ${line + 1} posição ${
          position - word.length
        }).`
      );

      return true;
    } else if (
      compareMode &&
      words == 1 &&
      !/\b(EQ|NEQ|LE|LEQ|GR|GRQ)\b/.test(word)
    ) {
      lineError(line);
      error(
        `${word} não é um operador de comparação válido (linha ${line + 1} posição ${
          position - word.length
        }).`
      );

      return true;
    } else if (
      compareMode &&
      words >= 2 &&
      !/\b(0x)+([a-fA-F0-9])\b/.test(word) &&
      !/\b(MX|BS)\b/.test(word)
    ) {
      lineError(line);
      error(
        `${word} não é um numero hexadecimal ou uma unidade de memória válida (linha ${line + 1} posição ${
          position - word.length
        }).`
      );

      return true;
    } else if (compareMode && words >= 2 && instruction[2] != 'BS' && instruction[2] === word) {
      lineError(line);
      error(
        `${word} não é uma comparação válida (linha ${line + 1} posição ${
          position - word.length
        }).`
      );

      return true;
    }

    if (word === 'CMP') compareMode = true;

    instruction.push(word);

    word = '';
    words++;

    return false;
  }

  function parse(tokens) {
    let input;
    let outputs = [];
  
    let task;
    let compareMode;
    let operands = [];
  
    for (let token of tokens) {
      if (conditional) {
        if (token == target) {
          loopList[target] = head;
          conditional = false;
          target = null;
        }
      } else {
        if (token == ';') {
          if (task == 'CMP') {
            if (operands[1] == 'MX' || token.indexOf('0x') === 0) {
              operands.reverse();
  
              compareMode = compareOperators.invert(compareMode);
            }
  
            for (let i in operands) {
              let operand = operands[i];
  
              if (operand == 'MX') {
                operands[i] = registers.DC;
              } else if (operand == 'BS') {
                operands[i] = BUS;
              } else {
                operands[i] = logic.extender(logic.hexToBinary(operand));
              }
            }
  
            let comp = logic.COMPARATOR(...operands);
  
            switch (compareOperators[compareMode]) {
              case compareOperators.EQ:
                registers.EC = [comp[2]];
                break;
              case compareOperators.NEQ:
                registers.EC = [!comp[2]];
                break;
              case compareOperators.LE:
                registers.EC = [comp[0]];
                break;
              case compareOperators.LEQ:
                registers.EC = [!comp[1]];
                break;
              case compareOperators.GR:
                registers.EC = [comp[1]];
                break;
              case compareOperators.GRQ:
                registers.EC = [!comp[0]];
            }
          }
  
          if (input) busInUpdate(input);
          if (outputs.length) busOutUpdate(outputs);
  
          input = null;
          outputs = [];
        } else if (/(INPUT|JMP|CMP)\b/.test(token)) {
          task = token;
        } else if (/(EQ|NEQ|LE|LEQ|GR|GRQ)\b/.test(token)) {
          compareMode = token;
        } else if (compareMode && operands.length <= 2 && /|(0x)+([a-fA-F0-9])\b/.test(token)) {
          operands.push(token);
        } else if (token.indexOf('0x') === 0) {
          if (task) {
            if (task == 'INPUT') {
              INPUT(token);
            } else if (task == 'JMP') {
              if (registers.EC[0]) {
                if (loopList[token]) {
                  if (logic.toNumber(registers.DC) >= 15) {
                    // displayAnError('Loop em excesso')
                    // return true;
                    registers.DC = new Array(4).fill(false);
                  } else {
                    registers.DC = logic.iterate(registers.DC);
                  }
                  head = loopList[token];
                  line = lineIndex.reduce((pv, cv) => cv < head ? ++pv : pv, 0);
                } else {
                  conditional = true;
                  target = token;
                }
              } else {
                registers.DC = new Array(4).fill(false);
              }
            }
          } else {
            loopList[token] = head;
          }
        } else if (token >= '0' && token <= '4') {
          input = busInList[+token];
        } else if (token >= '5' && token <= '9') {
          outputs.push(token);
        } else if (token == 'A' || token == 'B') {
          updateCarry(token);
        } else if (token >= 'C' && token <= 'E') {
          updateAddres(token);
        }
      }
    }
  }

  if (delay == undefined) delay = 500;

  myCodeMirror.options.readOnly = true;

  while (head < code.length) {
    let key = code[head];

    if (!comment) {
      if (key == ';') {
        if (word) if (wordTokenize()) return;

        instruction.push(key);
        
        if (parse(instruction)) return;

        instruction = [];
        input = false;
        literal = false;
        compareMode = false;
        word = '';
        words = 0;
      } else if (key == '-') {
        comment = true;
      } else if (!literal) {
        if (key == '.') {
          literal = true;
        } else if ((key >= '5' && key <= '9') || (key >= 'A' && key <= 'F')) {
          if (instruction.indexOf(key) > -1) {
            lineError(line);
            return error(`Só pode usar uma microinstrução por vez.`);
          }
          instruction.push(key);
        } else if (key >= '0' && key <= '4' && !input) {
          if (instruction.indexOf(key) > -1) {
            lineError(line);
            return error(`Só pode usar uma microinstrução por vez.`);
          }
          instruction.push(key);
          input = true;
        } else if (key >= '0' && key <= '4' && input) {
          lineError(line);
          return error(
            `Ambiguidade, BUS contém segundo sinal de entrada na linha ${line + 1} na posição ${position}.`
          );
        } else if (key != '\n' && key != ' ' && key != '\t') {
          lineError(line);
          return error(
            `Caractere ${key} inválido na posição ${position} na linha ${line + 1}.`
          );
        }
      } else {
        if (key == ' ') {
          if (wordTokenize()) return;
        } else {
          word += key;
        }
      }
    }

    if (key == '\n') {
      if (!conditional) {
        detach(line);
        show();
        await sleep(delay);
      }

      line++;
      lineIndex.push(head);
      position = 0;
      comment = false;
    } else {
      position++;
    }

    head++;

    if (stop) break;
  }

  if (conditional) error(`Endereço ${target} não foi encontrado.`);
  head = 0;
  
  myCodeMirror.options.readOnly = false;

  clear();
  show();
}

getNodes();

myCodeMirror.on('change', getNodes);

reset();
show();

export { tokenize, reset, toStop, unStop };
