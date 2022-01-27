function toNumber(array) {
  let num = 0;
  
  for (let i in array) {
    num += +array[i] * 2 ** (array.length - i - 1)
  }
  
  return num;
}

function toBinary(num) {
  let array = [];
  
  while (num) {
    array.unshift(!!(num % 2));
    num -= Math.ceil(num / 2);
  }
  
  return array;
}

function show(line) {
  return line.map(toNumber);
}

function iterate(cell) {
  let test = toBinary(toNumber(cell) + 1);
  
  while (test.length < cell.length) {
    test.unshift(false);
  }
  
  return test;
}

function unterate(cell) {
  let test = toBinary(toNumber(cell) - 1);
  
  while (test.length < cell.length) {
    test.unshift(false);
  }
  
  return test;
}

function extender(line, n) {
  while (line.length < n) {
    line.unshift(false);
  }
  
  return line;
}

function hexToBinary(hex) {
  let num = hex.toLocaleLowerCase().split('').splice(2, Infinity);
  let bin = [];

  for (let char of num) {
    if (char >= 'a' && char <= 'f') {
      char = char.charCodeAt() - 87;
    } else if (!(char >= '0' && char <= '9')) {
      return console.error(`${char} é um caractere inválido.`)
    }

    extender(toBinary(+char), 4).forEach(algarism => {
      bin.push(algarism);
    });
  }

  return bin;
}

function truthTable(f, n) {
  let test = new Array(n).fill(false);
  
  for (let i = 0; i < 2 ** n; i++) {
    console.log(`${test.map(c => +c)} ${+f(test)}`);
    test = iterate(test);
  }
}

function FULL_ADDER(a, b, c) {
  return [a && b || c && (a || b), a ^ b ^ c];
}

function BITS4_FULL_ADDER(A, B, c) {
  let c0 = FULL_ADDER(A[3], B[3], c);
  let c1 = FULL_ADDER(A[2], B[2], c0[0]);
  let c2 = FULL_ADDER(A[1], B[1], c1[0]);
  let c3 = FULL_ADDER(A[0], B[0], c2[0]);

  return [c3[0], c3[1], c2[1], c1[1], c0[1]];
}

function SUBBER(A, c) {
  if (c) {
    return [!(A[0] ^ !(A[1] || A[2])), !(A[1] ^ A[2]), !A[2], A[3]]
  } else {
    return A;
  }
}

function COMPARATOR9(a, b, c, d) {
  let c0 = !(a || b);
  let c1 = !c0 && (a || c);
  let c2 = (!a && c0)

  return !c2 && (c1 || d) && (c1 || !c2);
}

function ALU(A, B, c) {
  let sum = BITS4_FULL_ADDER(A, B, c);
  let cmp = COMPARATOR9(...sum.slice(0, 4));

  return [SUBBER(sum.slice(1, 5), cmp), cmp];
}

let error = false;

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

function displayAnError(error) {
  console.error(error);
}

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
        toNumber(
          extender(char.split(''), 4)
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

  instructions.forEach(([instruction], i) => {
    if (/\.0x[0-9a-fA-F]/.test(instruction)) {
      jumps[instruction] = i;
      instructions.splice(i, 1);
    }
  });

  for (let i in instructions) {
    let instruction = instructions[i];

    if (instruction.length == 1) {
      let input = '';
      let output = new Array(10).fill('0');

      for (let key of instruction[0]) {
        switch (symbols[key.toUpperCase()]) {
          case symbols[0]:
            input = '000';
            break;
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

      code += binaryToHex(input + output.join('')) + '\n';
    } else {
      let func = '';
      let param = '';

      instruction[0] = instruction[0].split('');
      instruction[0].shift();
      instruction[0] = instruction[0].join('');

      switch (symbols[instruction[0]]) {
        case symbols.INPUT:
          func = '101';
          param =
            extender(hexToBinary(instruction[1]), 4)
              .map((bin) => (bin ? '1' : '0'))
              .join('') + '000000';
          break;
        case symbols.CMP:
          func = '110';
          param =
            '100' +
            extender(toBinary([instruction[1]]), 4)
              .map((bin) => (bin ? '1' : '0'))
              .join('') +
            '000';
          break;
        case symbols.JMP:
          func = '111';
          param = extender(toBinary(jumps['.' + instruction[1]]), 10)
            .map((bin) => (bin ? '1' : '0'))
            .join('');
      }

      code += binaryToHex(func + param) + '\n';
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
        if (/[0-4]/.test(key))
          input ? throwAnError('Ambiguidade de sinal') : (input = true);
        if (/[D-Ed-e]/.test(key))
          bump
            ? throwAnError('Ambiguidade de endereçamento de memória')
            : (bump = true);
      }

      instructions.push([token]);
      instruction = [];
    } else if (/(\.INPUT|\.CMP|\.JMP)/.test(token) && !instruction.length) {
      instruction.push(token);
    } else if (token.indexOf('0x') >= 0 && /\.?0x[0-9a-fA-F]\b/.test(token)) {
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

function assembler(code) {
  let tokens = tokenize(code);
  let instructions = parse(tokens);
  let output = codeGenerator(instructions);

  return output;
}

let code = `.INPUT 0x1; - Carrega 1 á entrada
079;				- Poe 1 ao registrador AH e a memoria RAM A no endereço 0
.0x1;				- Cria um endereço 0x1
25;					- Copia o conteudo do registrador AH para AC
36;					- Copia o conteudo da memória RAM A para BC
17D;				- Adiciona 1 ao endereço da RAM A e copia a soma de Ac e BC no novo endereço
.CMP 0x6;		- Compara se o numero de saltos é igual a 6
.JMP 0x1;		- Se a ultima comparação for falsa, pular para 0x1.`

console.log(assembler(code));
