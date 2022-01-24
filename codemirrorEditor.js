CodeMirror.defineSimpleMode("VRM", {
  start: [
    {regex: /\./, token: "string"},
    {regex: /(INPUT|JMP)\b/, token: "keyword"},
    {regex: /CMP\b/, token: "operator"},
    {regex: /\b(0x)+([a-fA-F0-9])\b/, token: "number"},
    {regex: /[A-F\d][\w$]*/, token: "def"},
    {regex: /[-].*/, token: "comment"},
    {regex: /[a-zA-Z$][\w$]*/, token: null},
  ],
});

var myCodeMirror = CodeMirror(document.getElementById('app'), {
  value: `.INPUT 0x1; - Carrega 1 á entrada
079;				- Poe 1 ao registrador AH e a memoria RAM A no endereço 0
.0x1;				- Cria um endereço 0x1
25;					- Copia o conteudo do registrador AH para AC
36;					- Copia o conteudo da memória RAM A para BC
17D;				- Adiciona 1 ao endereço da RAM A e copia a soma de Ac e BC no novo endereço
.CMP 0x6;		- Compara se o numero de saltos é igual a 6
.JMP 0x1;		- Se a ultima comparação for falsa, pular para 0x1.`,
  mode: 'VRM',
  tabSize: 2,
  lineNumbers: true,
});
