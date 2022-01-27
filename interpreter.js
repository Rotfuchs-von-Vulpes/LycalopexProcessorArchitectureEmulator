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

let head = 0;
let loopList = [];
let conditional = false;
let target;

let key = {
  A: Symbol('A'),
  B: Symbol('B'),
  C: Symbol('C'),
  D: Symbol('D'),
  E: Symbol('E'),
}

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

function parse(tokens) {
  let input;
  let outputs = [];

  let task;

  for (let token of tokens) {
    if (conditional) {
      if (token == target) {
        loopList[target] = head;
        conditional = false;
        target = null;
      }
    } else {
      if (token == ';') {
        if (input) busInUpdate(input);
        if (outputs.length) busOutUpdate(outputs);

        input = null;
        outputs = [];
      } else if (/(INPUT|JMP)\b/.test(token)) {
        task = token;
      } else if (/CMP\b/.test(token)) {
        task = token;
      } else if (token.indexOf('0x') === 0) {
        if (task) {
          if (task == 'INPUT') {
            INPUT(token);
          } else if (task == 'JMP') {
            if (registers.EC[0]) {
              if (loopList[token]) {
                registers.DC =
                  logic.toNumber(registers.DC) < 15
                    ? logic.iterate(registers.DC)
                    : new Array(4).fill(false);
                head = loopList[token];
              } else {
                conditional = true;
                target = token;
              }
            } else {
              registers.DC = new Array(4).fill(false);
            }
          } else if (task == 'CMP') {
            let bin = logic.extender(logic.hexToBinary(token), 4);

            registers.EC = [
              !bin.reduce((pv, cv, i) => pv && cv == registers.DC[i], true),
            ];
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

function error(err) {
  displayAnError(err);
  head = 0;
  loopList = [];
  conditional = false;
  target = null;
}

function tokenize(code) {
  let instruction = [];
  let input = false;
  let literal = false;
  let comment = false;

  let position = 0;
  let line = 1;

  let word = '';
  let words = 0;

  function wordTokenize() {
    if (words > 2) {
      error(`${word} não era esperado na linha ${line} e posição ${position}`);

      return true;
    } else if (
      words === 0 &&
      !/\b(INPUT|CMP|JMP)\b/.test(word) &&
      !/\b(0x)+([a-fA-F0-9])\b/.test(word)
    ) {
      error(
        `${word} não é reconhecido como uma instrução interna (linha ${line} posição ${
          position - word.length
        }).`
      );

      return true;
    } else if (words === 1 && !/\b(0x)+([a-fA-F0-9])\b/.test(word)) {
      error(
        `${word} não é um numero hexadecimal válido (linha ${line} posição ${
          position - word.length
        }).`
      );

      return true;
    }

    instruction.push(word);
    word = '';
    words++;

    return false;
  }

  while (head < code.length) {
    let key = code[head];

    if (!comment) {
      if (key == ';') {
        if (word) if (wordTokenize()) return;

        instruction.push(key);
        parse(instruction);

        instruction = [];
        input = false;
        literal = false;
        word = '';
        words = 0;
      } else if (key == '-') {
        comment = true;
      } else if (!literal) {
        if (key == '.') {
          literal = true;
        } else if ((key >= '5' && key <= '9') || (key >= 'A' && key <= 'F')) {
          if (instruction.indexOf(key) > -1)
            return error(`Só pode usar uma microinstrução por vez.`);
          instruction.push(key);
        } else if (key >= '0' && key <= '4' && !input) {
          if (instruction.indexOf(key) > -1)
            return error(`Só pode usar uma microinstrução por vez.`);
          instruction.push(key);
          input = true;
        } else if (key >= '0' && key <= '4' && input) {
          return error(
            `Ambiguidade, BUS contém segundo sinal de entrada na linha ${line} na posição ${position}.`
          );
        } else if (key != '\n' && key != ' ' && key != '\t') {
          return error(
            `Caractere ${key} inválido na posição ${position} na linha ${line}.`
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
      line++;
      position = 0;
      comment = false;
    } else {
      position++;
    }

    head++;
  }

  if (conditional) error(`Endereço ${target} não foi encontrado.`);
  head = 0;
  show();
}

reset();
show();

export { tokenize, reset };
