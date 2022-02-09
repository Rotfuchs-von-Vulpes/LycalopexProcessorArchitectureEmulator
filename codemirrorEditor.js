CodeMirror.defineSimpleMode('VRM', {
  start: [
    { regex: /(\.|MX|BS)/, token: 'string' },
    { regex: /(INPUT|JMP|CMP)\b/, token: 'keyword' },
    { regex: /(EQ|NEQ|LE|LEQ|GR|GRQ)\b/, token: 'operator' },
    { regex: /\b(0x)+([a-fA-F0-9])\b/, token: 'number' },
    { regex: /[A-F\d][\w$]*/, token: 'def' },
    { regex: /[-].*/, token: 'comment' },
    { regex: /[a-zA-Z$][\w$]*/, token: null },
  ],
});

let mainEl = document.getElementById('app');

let myCodeMirror = CodeMirror(mainEl, {
  value: `.INPUT 0x1;      - Carrega 1 á entrada.
079C;				     - Poe 1 ao registrador AH e a memoria RAM A no endereço 0.
.0x1;				     - Cria um endereço 0x1.
25;					     - Copia o conteudo do registrador AH para AC.
36;					     - Copia o conteudo da memória RAM A para BC.
17D;				     - Adiciona 1 ao endereço da RAM A e copia a soma de Ac e BC no novo endereço.
.CMP NEQ MX 0x6; - Compara se o numero de saltos é diferente de 6.
.JMP 0x1;		     - Se a ultima comparação for verdadeira, pular para 0x1.`,
  mode: 'VRM',
  tabSize: 2,
  lineNumbers: true,
});
