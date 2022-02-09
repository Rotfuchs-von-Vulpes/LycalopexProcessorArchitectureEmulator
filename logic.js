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

function HALF_COMPARATOR(A, B) {
  let le = !A && B;
  let gr = A && !B;

  return [le, gr, !(le ^ gr)];
}

function FULL_COMPARATOR(A, B, c, d, e) {
  return [!d && (c || !A && B), !c && (d || A && !B), !(c || d) && (e && !(A ^ B))];
}

function COMPARATOR(A, B) {
  let r1 = HALF_COMPARATOR(A[0], B[0]);
  let r2 = FULL_COMPARATOR(A[1], B[1], ...r1);
  let r3 = FULL_COMPARATOR(A[2], B[2], ...r2);

  return FULL_COMPARATOR(A[3], B[3], ...r3);
}

export default { toNumber, toBinary, hexToBinary, show, iterate, unterate, extender, truthTable, ALU, COMPARATOR };
