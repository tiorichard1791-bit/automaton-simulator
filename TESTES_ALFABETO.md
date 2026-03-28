# Documentação do Módulo de Alfabeto

## Visão Geral

O módulo de alfabeto implementa um sistema completo de gerenciamento de símbolos para autômatos finitos, com validação, persistência e integração com o simulador existente.

## Estrutura de Arquivos

```
js/alphabet/
├── alphabet.js              # Classe principal Alphabet
├── alphabet-validation.js   # Validador de símbolos e consistência
└── alphabet-ui.js           # Interface do usuário

css/
└── alphabet.css            # Estilos para o painel de alfabeto

__tests__/
└── alphabet.test.js        # Testes unitários do módulo
```

## Funcionalidades Implementadas

### 1. Classe Alphabet (`alphabet.js`)

**Operações Básicas:**
- ✅ Adicionar símbolos com validação
- ✅ Remover símbolos (com verificação de uso)
- ✅ Verificar existência de símbolos
- ✅ Listar símbolos ordenados
- ✅ Limpar alfabeto completo

**Validação de Símbolos:**
- ✅ Comprimento máximo: 3 caracteres
- ✅ Proibição de espaços
- ✅ Proibição de caracteres de controle
- ✅ Símbolo reservado: ε (epsilon)
- ✅ Caracteres especiais perigosos (<, >, ", &)

**Persistência:**
- ✅ Salvar no localStorage
- ✅ Carregar do localStorage
- ✅ Exportar/importar JSON

**Integração com Autômato:**
- ✅ Detectar símbolos usados
- ✅ Sugerir símbolos faltantes
- ✅ Validar consistência
- ✅ Verificar símbolos em uso

### 2. Validador de Alfabeto (`alphabet-validation.js`)

**Validação Individual:**
- ✅ Validação detalhada com erros e avisos
- ✅ Validação de múltiplos símbolos
- ✅ Detecção de duplicatas

**Validação de Consistência:**
- ✅ Comparação alfabeto-autômato
- ✅ Identificação de símbolos faltantes
- ✅ Identificação de símbolos não utilizados

**Relatórios:**
- ✅ Geração de relatórios detalhados
- ✅ Formatação para exibição
- ✅ Sugestões de correção

### 3. Interface do Usuário (`alphabet-ui.js`)

**Componentes:**
- ✅ Painel de gerenciamento
- ✅ Lista de símbolos com remoção
- ✅ Validação em tempo real
- ✅ Mensagens de feedback
- ✅ Tooltips informativos

**Funcionalidades:**
- ✅ Adição via tecla Enter
- ✅ Detecção automática do autômato
- ✅ Limpeza com confirmação
- ✅ Copiar para área de transferência

### 4. Estilos (`alphabet.css`)

**Design:**
- ✅ Gradientes modernos
- ✅ Animações suaves
- ✅ Estados visuais (válido/inválido/em uso)
- ✅ Responsividade
- ✅ Feedback visual

## Testes Unitários

### Cobertura de Testes

**31 testes implementados** cobrindo:

1. **Operações Básicas** (15 testes)
   - Criação de alfabeto vazio
   - Adição/remoção de símbolos
   - Validação de símbolos
   - Ordenação e unicidade

2. **Validação de Símbolos** (7 testes)
   - Letras, dígitos, símbolos especiais
   - Caracteres de controle
   - Comprimento máximo

3. **Integração Alfabeto-Autômato** (6 testes)
   - Validação de transições
   - Detecção de símbolos faltantes
   - Consistência e sugestões

4. **Casos Especiais** (5 testes)
   - Unicode básico
   - Maiúsculas/minúsculas
   - Símbolos numéricos
   - Valores nulos/undefined

### Execução dos Testes

```bash
# Executar todos os testes do módulo de alfabeto
npm test -- --testNamePattern="Módulo de Alfabeto"

# Executar com detalhes
npm test -- --testNamePattern="Módulo de Alfabeto" --verbose

# Executar testes específicos
npm test -- --testNamePattern="deve adicionar símbolo válido"
```

## Integração com o Simulador

### Eventos Globais

O módulo emite e escuta os seguintes eventos:

```javascript
// Emitido quando o alfabeto muda
window.dispatchEvent(new CustomEvent('alphabetChanged', {
  detail: { symbols: ['a', 'b', 'c'] }
}));

// Escutado para atualizar validação
window.addEventListener('automatonChanged', () => {
  // Atualizar validação contra autômato
});
```

### Variáveis Globais

```javascript
// Instância principal
window.alphabet = new Alphabet();

// Validador
window.AlphabetValidator = AlphabetValidator;

// Interface do usuário (após DOM carregado)
window.alphabetUI = new AlphabetUI();
```

## Uso da API

### Exemplo Básico

```javascript
// Adicionar símbolos
alphabet.add('a');
alphabet.add('b');
alphabet.add('0');

// Verificar existência
alphabet.has('a'); // true
alphabet.has('c'); // false

// Listar símbolos
alphabet.getSymbols(); // ['0', 'a', 'b']

// Remover símbolo
alphabet.remove('a'); // true se removido, false se em uso

// Validar contra autômato
const validation = alphabet.validateAgainstAutomaton();
```

### Validação Detalhada

```javascript
// Validar símbolo individual
const result = AlphabetValidator.validateSymbol('a b');
// {
//   valid: false,
//   errors: ['Símbolo não pode conter espaços'],
//   warnings: [],
//   symbol: 'a b'
// }

// Gerar relatório completo
const report = AlphabetValidator.generateValidationReport(
  alphabet,
  { transitionMap: window.transitionMap }
);
```

## Configuração

### Requisitos

- Node.js 14+
- Jest para testes
- localStorage disponível (navegador ou mock)

### Instalação

Os módulos são carregados automaticamente quando incluídos no HTML:

```html
<!-- Incluir módulos -->
<script src="js/alphabet/alphabet.js"></script>
<script src="js/alphabet/alphabet-validation.js"></script>
<script src="js/alphabet/alphabet-ui.js"></script>

<!-- Incluir estilos -->
<link rel="stylesheet" href="css/alphabet.css">
```

### HTML Necessário

```html
<div id="alphabet-panel">
  <h3>📚 Alfabeto (Σ)</h3>
  
  <div id="alphabet-status">
    <span>Σ = { }</span>
    <span class="badge">0 símbolos</span>
  </div>
  
  <div class="alphabet-input-group">
    <input type="text" id="alphabet-input" placeholder="Digite um símbolo (ex: a, 0, +)" maxlength="3">
    <button id="add-symbol-btn">Adicionar</button>
  </div>
  
  <div id="alphabet-list" class="empty"></div>
  
  <div class="alphabet-action-buttons">
    <button id="auto-detect-btn">🔍 Detectar do Autômato</button>
    <button id="clear-alphabet-btn">🗑️ Limpar Alfabeto</button>
  </div>
  
  <div id="alphabet-validation">
    <h4>Validação do Alfabeto</h4>
    <div id="validation-status">
      <div class="success">Nenhum problema detectado</div>
    </div>
  </div>
</div>
```

## Considerações de Segurança

1. **Prevenção XSS**: Todos os símbolos são escapados antes da exibição
2. **Validação de Entrada**: Caracteres perigosos são rejeitados
3. **Persistência Segura**: Apenas símbolos válidos são salvos no localStorage
4. **Verificação de Uso**: Símbolos em uso não podem ser removidos

## Próximos Passos

### Melhorias Planejadas

1. **Exportação/Importação**
   - Formato JSON estruturado
   - Compatibilidade com outros simuladores

2. **Análise Estatística**
   - Frequência de uso dos símbolos
   - Sugestões de otimização

3. **Integração Avançada**
   - Validação em tempo real durante edição
   - Highlight de símbolos no diagrama
   - Autocompletar baseado no alfabeto

4. **Internacionalização**
   - Mensagens em múltiplos idiomas
   - Suporte a Unicode estendido

### Manutenção

1. **Monitoramento de Performance**
   - Otimização para grandes alfabetos
   - Cache de validações frequentes

2. **Compatibilidade**
   - Testes em múltiplos navegadores
   - Suporte a dispositivos móveis

## Contribuição

### Padrões de Código

1. **Documentação**: Todos os métodos devem ter JSDoc
2. **Testes**: Novas funcionalidades exigem testes
3. **Validação**: Sempre validar entrada do usuário
4. **Feedback**: Fornecer mensagens claras de erro/sucesso

### Processo de Desenvolvimento

1. Escrever testes primeiro (TDD)
2. Implementar funcionalidade
3. Executar testes existentes
4. Documentar alterações
5. Revisar integração

## Licença

Este módulo faz parte do projeto Automaton Simulator e está sob a mesma licença.

---

*Última atualização: 28/03/2026*  
*Versão: 1.0.0*  
*Testes: 31/31 passando*