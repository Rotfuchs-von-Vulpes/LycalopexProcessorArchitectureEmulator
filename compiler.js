import logic from './logic.js';
import displayAnError from './error.js';

const el = document.getElementById('machineCode');
let error = false;
let hex = true;

const letters = [
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
];

const symbols = {
  0: Symbol('0'),
  1: Symbol('1'),
  2: Symbol('2'),
  3: Symbol('3'),
  4: Symbol('4'),
  5: Symbol('5'),
  6: Symbol('6'),
  7: Symbol('7'),
  8: Symbol('8'),
  9: Symbol('9'),
  A: Symbol('A'),
  B: Symbol('B'),
  C: Symbol('C'),
  D: Symbol('D'),
  E: Symbol('E'),
  INPUT: Symbol('.INPUT'),
  CMP: Symbol('.CMP'),
  JMP: Symbol('.JMP'),
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
  },
};

function binaryToHex(instruction) {
  let binaryArray = instruction.split('').reverse();
  let nibbleArray = [];
  let hexArray = [];
  let nibble = '';

  for (let i in binaryArray) {
    let char = binaryArray[i];

    nibble = char + nibble;

    if (nibble.length >= 4) {
      nibbleArray.unshift(nibble);
      nibble = '';
    }
  }

  if (nibble.length) nibbleArray.unshift(nibble);

  for (let char of nibbleArray) {
    hexArray.push(
      letters[
        logic.toNumber(
          logic
            .extender(char.split(''), 4)
            .map((bit) => (bit && bit != '0' ? '1' : '0'))
        )
      ]
    );
  }

  return hexArray.join('');
}

function codeGenerator(instructions) {
  let code = '';
  let jumps = {};

  function writeCode(binary) {
    let code = binary;

    if (hex) {
      code = binaryToHex(code);
    }

    return code;
  }

  instructions.forEach(([instruction], i) => {
    if (/\.0x[0-9a-fA-F]/.test(instruction)) {
      jumps[instruction] = i;
      instructions.splice(i, 1);
    }
  });

  for (let i in instructions) {
    let instruction = instructions[i];

    if (instruction.length == 1) {
      let input = '000';
      let output = new Array(10).fill('0');

      for (let key of instruction[0]) {
        switch (symbols[key.toUpperCase()]) {
          case symbols[1]:
            input = '001';
            break;
          case symbols[2]:
            input = '010';
            break;
          case symbols[3]:
            input = '011';
            break;
          case symbols[4]:
            input = '100';
            break;
          case symbols[5]:
            output[0] = '1';
            break;
          case symbols[6]:
            output[1] = '1';
            break;
          case symbols[7]:
            output[2] = '1';
            break;
          case symbols[8]:
            output[3] = '1';
            break;
          case symbols[9]:
            output[4] = '1';
            break;
          case symbols.A:
            output[5] = '1';
            break;
          case symbols.B:
            output[6] = '1';
            break;
          case symbols.C:
            output[7] = '1';
            break;
          case symbols.D:
            output[8] = '1';
            output[9] = '0';
            break;
          case symbols.E:
            output[8] = '1';
            output[9] = '1';
        }
      }

      code += writeCode(input + output.join('')) + '<br>';
    } else {
      let func = '';
      let param = '';

      instruction[0] = instruction[0].split('');
      instruction[0].shift();
      instruction[0] = instruction[0].join('');

      // console.log(instruction[0]);

      switch (symbols[instruction[0]]) {
        case symbols.INPUT:
          func = '101';
          param =
            logic
              .extender(logic.hexToBinary(instruction[1]), 4)
              .map((bin) => (bin ? '1' : '0'))
              .join('') + '000000';
          break;
        case symbols.CMP:
          let comp;
          let mode;

          func = '110';

          switch (compareOperators[instruction[1]]) {
            case compareOperators.EQ:
              comp = '101';
              break;
            case compareOperators.LE:
              comp = '000';
              break;
            case compareOperators.LEQ:
              comp = '010';
              break;
            case compareOperators.GR:
              comp = '011';
              break;
            case compareOperators.GRQ:
              comp = '001';
              break;
            case compareOperators.NEQ:
            default:
              comp = '100';
          }

          if (instruction[2] === 'MX' && instruction[3] === 'BS') {
            mode = '100';
          } else if (instruction[2] === 'BS' && instruction[3] != 'BS') {
            mode = '010';
          } else if (instruction[2] === 'MX') {
            mode = '000';
          } else {
            mode = '110';
          }

          param =
            comp +
            logic
              .extender(logic.toBinary([instruction[3]]), 4)
              .map((bin) => (bin ? '1' : '0'))
              .join('') +
            mode;
          break;
        case symbols.JMP:
          func = '111';
          param = logic
            .extender(logic.toBinary(jumps['.' + instruction[1]]), 10)
            .map((bin) => (bin ? '1' : '0'))
            .join('');
      }

      code += writeCode(func + param) + '<br>';
    }
  }

  return code;
}

function throwAnError(msg) {
  if (!error) error = true;
  displayAnError(msg);
}

function parse(tokens) {
  let instruction = [];
  let instructions = [];

  for (let token of tokens) {
    if (token[0] != '.' && /^[0-9a-eA-E]+$/.test(token)) {
      let input = false;
      let bump = false;

      for (let key of token) {
        if (/[0-4]/.test(key)) {
          if (input) {
            throwAnError('Ambiguidade de sinal');
          } else {
            input = true;
          }
        }
        if (/[D-Ed-e]/.test(key)) {
          if (bump) {
            throwAnError('Ambiguidade de endereçamento de memória');
          } else {
            bump = true;
          }
        }
      }

      instructions.push([token]);
      instruction = [];
    } else if (
      (/(\.INPUT|\.CMP|\.JMP)/.test(token) &&
        ((/(\.INPUT|\.CMP|\.JMP)/.test(token) && !instruction.length) ||
          (instruction[0] === '.CMP' &&
            /(EQ|NEQ|LE|LEQ|GR|GRQ|MX|BS)|(0x[0-9a-fA-F])\b/.test(token)))) ||
      (instruction[0] === '.CMP' &&
        /(EQ|NEQ|LE|LEQ|GR|GRQ|MX|BS)|(0x[0-9a-fA-F])\b/.test(token))
    ) {
      instruction.push(token);

      if (instruction[0] === '.CMP' && instruction.length === 4) {
        if (instruction[2] != 'MX' && instruction[2].indexOf('0x') != 0) {
          let temp = instruction[2];

          instruction[2] = instruction[3];
          instruction[3] = temp;

          instruction[1] = compareOperators.invert(instruction[1]);
        }

        if (
          instruction[2].indexOf('0x') === 0 && instruction[3].indexOf('0x') === 0 ||
          instruction[2] === 'MX' && instruction[3] === 'MX'
        ) {
          throwAnError('Comparação não permitida');
        }

        instructions.push(instruction);
        instruction = [];
      }
    } else if (token.indexOf('0x') >= 0 && /\.?0x[0-9a-fA-F]\b/.test(token)) {
      instruction.push(token);
      instructions.push(instruction);
      instruction = [];
    } else if (instruction[0] === '.JMP' && instruction.length === 1) {
      instruction.push(token);
      instructions.push(instruction);
      instruction = [];
    } else {
      throwAnError(`"${token}" não era esperado`);
    }
  }

  return instructions;
}

function tokenize(code) {
  let literal = false;
  let word = '';
  let comment = false;

  let tokens = [];

  for (let key of code) {
    if (comment) {
      if (key == '\n') comment = false;
    } else {
      if (!/[a-zA-Z0-9\.;\-\t\s\n]/.test(key)) {
        throwAnError(`"${key}" não é reconhecido como um caractere interno`);
      } else if (key == ';') {
        tokens.push(word);
        literal = false;
        word = '';
      } else if (key == '.') {
        literal = true;
        word += key;
      } else if (literal && key == ' ') {
        tokens.push(word);
        word = '';
      } else if (key == '-') {
        comment = true;
      } else if (!/(\t|\n|\s)/.test(key)) {
        word += key;
      }
    }
  }

  return tokens;
}

export default function assembler(code) {
  let tokens = tokenize(code);
  let instructions = parse(tokens);
  let output = codeGenerator(instructions);

  el.innerHTML = output;

  return output;
}
