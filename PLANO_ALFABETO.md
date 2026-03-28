# Plano de Implementação: Gerenciamento Alfabético Explícito

**Objetivo:** Implementar sistema de gerenciamento de alfabeto formal para o simulador AFD/AFND  
**Tecnologias:** HTML5, CSS3, JavaScript puro (sem frameworks)  
**Metodologia:** Test-Driven Development (TDD) - testes primeiro  
**Organização:** Módulos separados por responsabilidade

## 📁 Estrutura de Arquivos Proposta

```
js/
├── alphabet/                    # Módulo de gerenciamento de alfabeto
│   ├── alphabet.js             # Lógica principal do alfabeto
│   ├── alphabet-ui.js          # Interface do usuário do alfabeto
│   ├── alphabet-validation.js  # Validação de símbolos
│   └── alphabet.test.js        # Testes do módulo alfabeto
├── automaton/                  # Módulo existente (será estendido)
│   └── automaton.js           # Será integrado com alfabeto
└── script.js                  # Arquivo principal (será refatorado)
```

## 🧪 Plano de Testes (TDD)

### Fase 1: Testes da Lógica do Alfabeto

#### 1.1 Testes Básicos do Módulo Alphabet
```javascript
// __tests__/alphabet.test.js
describe('Módulo de Alfabeto', () => {
  describe('Classe Alphabet', () => {
    test('deve criar alfabeto vazio', () => {});
    test('deve adicionar símbolo válido', () => {});
    test('deve rejeitar símbolo vazio', () => {});
    test('deve rejeitar símbolo com espaços', () => {});
    test('deve rejeitar símbolo ε (reservado)', () => {});
    test('deve remover símbolo existente', () => {});
    test('deve verificar se símbolo pertence ao alfabeto', () => {});
    test('deve retornar lista ordenada de símbolos', () => {});
    test('deve limpar todos os símbolos', () => {});
  });
});
```

#### 1.2 Testes de Validação
```javascript
describe('Validação de Símbolos', () => {
  test('deve aceitar letras minúsculas', () => {});
  test('deve aceitar letras maiúsculas', () => {});
  test('deve aceitar dígitos', () => {});
  test('deve aceitar símbolos especiais permitidos', () => {});
  test('deve rejeitar símbolos muito longos', () => {});
  test('deve rejeitar caracteres de controle', () => {});
});
```

#### 1.3 Testes de Integração com Autômato
```javascript
describe('Integração Alfabeto-Autômato', () => {
  test('deve validar transições contra alfabeto', () => {});
  test('deve sugerir símbolos faltantes no alfabeto', () => {});
  test('deve atualizar alfabeto ao adicionar transição', () => {});
  test('deve manter consistência ao remover símbolo usado', () => {});
});
```

## 🎨 Design da Interface (UI/UX)

### 2.1 Componentes de Interface

#### Painel de Gerenciamento de Alfabeto
```html
<!-- Novo painel na sidebar direita -->
<div id="alphabet-panel" class="panel">
  <h3>📚 Alfabeto</h3>
  
  <!-- Status do alfabeto -->
  <div id="alphabet-status" class="status">
    <span>Σ = { }</span>
    <span class="badge">0 símbolos</span>
  </div>
  
  <!-- Adição de símbolo -->
  <div class="input-group">
    <input type="text" id="alphabet-input" 
           placeholder="Digite um símbolo (ex: a, b, 0, 1)" 
           maxlength="3">
    <button id="add-symbol-btn" class="btn-primary">+ Adicionar</button>
  </div>
  
  <!-- Lista de símbolos -->
  <div id="alphabet-list" class="symbol-list">
    <!-- Símbolos serão renderizados aqui -->
  </div>
  
  <!-- Ações -->
  <div class="action-buttons">
    <button id="auto-detect-btn" class="btn-secondary">
      🔍 Detectar do autômato
    </button>
    <button id="clear-alphabet-btn" class="btn-danger">
      🗑️ Limpar tudo
    </button>
  </div>
  
  <!-- Validação -->
  <div id="alphabet-validation" class="validation">
    <h4>Validação</h4>
    <div id="validation-status"></div>
  </div>
</div>
```

#### Indicadores Visuais
- **Badge** no header mostrando tamanho do alfabeto
- **Highlight** de símbolos não pertencentes ao alfabeto
- **Tooltips** explicando validações
- **Modal** para confirmação de remoção de símbolos usados

### 2.2 Estilos CSS
```css
/* alphabet.css */
#alphabet-panel {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.symbol-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0;
}

.symbol-item {
  background: #e0f2fe;
  border: 2px solid #0ea5e9;
  border-radius: 20px;
  padding: 6px 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.symbol-item .remove-btn {
  background: #fecaca;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  cursor: pointer;
  font-size: 12px;
}

.validation {
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 6px;
  padding: 12px;
  margin-top: 16px;
}

.validation.valid {
  background: #d1fae5;
  border-color: #10b981;
}

.validation.invalid {
  background: #fee2e2;
  border-color: #ef4444;
}
```

## 🔧 Implementação por Módulos

### 3.1 Módulo: `alphabet.js` (Lógica Principal)
```javascript
// js/alphabet/alphabet.js
class Alphabet {
  constructor() {
    this.symbols = new Set();
    this.reservedSymbols = new Set(['ε']);
  }
  
  add(symbol) {
    // Validação básica
    if (!this.isValidSymbol(symbol)) {
      throw new Error(`Símbolo inválido: ${symbol}`);
    }
    
    if (this.reservedSymbols.has(symbol)) {
      throw new Error(`Símbolo reservado: ${symbol}`);
    }
    
    this.symbols.add(symbol);
    this.dispatchChangeEvent();
    return true;
  }
  
  remove(symbol) {
    // Verificar se símbolo está em uso
    if (this.isSymbolInUse(symbol)) {
      return false; // Ou lançar exceção
    }
    
    this.symbols.delete(symbol);
    this.dispatchChangeEvent();
    return true;
  }
  
  isValidSymbol(symbol) {
    // Implementar regras de validação
    return symbol.length > 0 && 
           symbol.length <= 3 && 
           !/\s/.test(symbol);
  }
  
  isSymbolInUse(symbol) {
    // Verificar transições do autômato
    // Integração com módulo automaton
  }
  
  getSymbols() {
    return Array.from(this.symbols).sort();
  }
  
  clear() {
    this.symbols.clear();
    this.dispatchChangeEvent();
  }
  
  dispatchChangeEvent() {
    window.dispatchEvent(new CustomEvent('alphabetChanged', {
      detail: { symbols: this.getSymbols() }
    }));
  }
}

// Instância global
window.alphabet = new Alphabet();
```

### 3.2 Módulo: `alphabet-ui.js` (Interface)
```javascript
// js/alphabet/alphabet-ui.js
class AlphabetUI {
  constructor() {
    this.panel = document.getElementById('alphabet-panel');
    this.input = document.getElementById('alphabet-input');
    this.addBtn = document.getElementById('add-symbol-btn');
    this.list = document.getElementById('alphabet-list');
    this.status = document.getElementById('alphabet-status');
    
    this.init();
  }
  
  init() {
    this.addBtn.addEventListener('click', () => this.addSymbol());
    this.input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.addSymbol();
    });
    
    // Escutar mudanças no alfabeto
    window.addEventListener('alphabetChanged', (e) => {
      this.renderSymbols(e.detail.symbols);
      this.updateStatus();
    });
    
    // Renderizar inicial
    this.renderSymbols(window.alphabet.getSymbols());
    this.updateStatus();
  }
  
  addSymbol() {
    const symbol = this.input.value.trim();
    if (!symbol) return;
    
    try {
      window.alphabet.add(symbol);
      this.input.value = '';
      this.input.focus();
    } catch (error) {
      this.showError(error.message);
    }
  }
  
  renderSymbols(symbols) {
    this.list.innerHTML = symbols.map(symbol => `
      <div class="symbol-item" data-symbol="${symbol}">
        <span>${symbol}</span>
        <button class="remove-btn" onclick="alphabetUI.removeSymbol('${symbol}')">
          ×
        </button>
      </div>
    `).join('');
  }
  
  removeSymbol(symbol) {
    if (window.alphabet.remove(symbol)) {
      // Sucesso
    } else {
      this.showWarning(`Símbolo "${symbol}" está em uso. Remova as transições primeiro.`);
    }
  }
  
  updateStatus() {
    const symbols = window.alphabet.getSymbols();
    const count = symbols.length;
    const symbolsText = symbols.length > 0 ? `{${symbols.join(', ')}}` : '{ }';
    
    this.status.innerHTML = `
      <span>Σ = ${symbolsText}</span>
      <span class="badge">${count} símbolo${count !== 1 ? 's' : ''}</span>
    `;
  }
  
  showError(message) {
    // Implementar feedback visual
  }
  
  showWarning(message) {
    // Implementar feedback visual
  }
}

// Instância global
window.alphabetUI = new AlphabetUI();
```

### 3.3 Módulo: `alphabet-validation.js`
```javascript
// js/alphabet/alphabet-validation.js
class AlphabetValidator {
  static validateSymbol(symbol) {
    const errors = [];
    
    if (!symbol || symbol.trim() === '') {
      errors.push('Símbolo não pode ser vazio');
    }
    
    if (symbol.length > 3) {
      errors.push('Símbolo muito longo (máx. 3 caracteres)');
    }
    
    if (/\s/.test(symbol)) {
      errors.push('Símbolo não pode conter espaços');
    }
    
    if (/[<>"&]/.test(symbol)) {
      errors.push('Símbolo contém caracteres especiais não permitidos');
    }
    
    if (symbol === 'ε') {
      errors.push('ε é reservado para transições epsilon');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      symbol
    };
  }
  
  static validateAgainstAutomaton(alphabet, automaton) {
    const warnings = [];
    const usedSymbols = this.getUsedSymbols(automaton);
    
    // Símbolos usados que não estão no alfabeto
    const missingSymbols = usedSymbols.filter(s => 
      !alphabet.has(s) && s !== 'ε'
    );
    
    if (missingSymbols.length > 0) {
      warnings.push(`Símbolos usados mas não no alfabeto: ${missingSymbols.join(', ')}`);
    }
    
    // Símbolos no alfabeto que não são usados
    const unusedSymbols = Array.from(alphabet.symbols).filter(s =>
      !usedSymbols.has(s)
    );
    
    if (unusedSymbols.length > 0) {
      warnings.push(`Símbolos no alfabeto mas não usados: ${unusedSymbols.join(', ')}`);
    }
    
    return {
      valid: missingSymbols.length === 0,
      warnings,
      missingSymbols,
      unusedSymbols
    };
  }
  
  static getUsedSymbols(automaton) {
    // Extrair símbolos das transições do autômato
    const symbols = new Set();
    // Implementar extração das transições
    return symbols;
  }
}
```

## 🔄 Integração com Sistema Existente

### 4.1 Modificações em `script.js`
```javascript
// Adicionar no início do arquivo
import './alphabet/alphabet.js';
import './alphabet/alphabet-ui.js';
import './alphabet/alphabet-validation.js';

// Modificar função addTransition para validação
function addTransition(from, symbol, to) {
  if (!from || !to) {
    alert(i18n.get('alert_from_to'));
    return false;
  }
  
  if (symbol === "") symbol = "ε";
  
  // VALIDAÇÃO COM ALFABETO (exceto ε)
  if (symbol !== "ε" && window.alphabet && !window.alphabet.has(symbol)) {
    const addToAlphabet = confirm(
      `Símbolo "${symbol}" não está no alfabeto. Adicionar ao alfabeto?`
    );
    
    if (addToAlphabet) {
      try {
        window.alphabet.add(symbol);
      } catch (error) {
        alert(`Erro ao adicionar símbolo: ${error.message}`);
        return false;
      }
    } else {
      alert(`Transição não adicionada. Símbolo "${symbol}" precisa estar no alfabeto.`);
      return false;
    }
  }
  
  // Resto da função existente...
}
```

### 4.2 Modificações em `index.html`
```html
<!-- Adicionar na sidebar direita, após o painel de estado selecionado -->
<div id="alphabet-panel" class="panel">
  <!-- Conteúdo do painel (ver seção 2.1) -->
</div>

<!-- Incluir novos arquivos JS -->
<script src="js/alphabet/alphabet.js"></script>
<script src="js/alphabet/alphabet-ui.js"></script>
<script src="js/alphabet/alphabet-validation.js"></script>

<!-- Incluir CSS -->
<link rel="stylesheet" href="css/alphabet.css">
```

## 📋 Cronograma de Implementação

### Semana 1: Fundamentos e Testes
- **Dia 1-2:** Configurar estrutura de módulos e escrever testes básicos
- **Dia 3-4:** Implementar classe `Alphabet` com validação básica
- **Dia 5:** Implementar `AlphabetValidator` e testes de integração

### Semana 2: Interface do Usuário
- **Dia 1-2:** Criar HTML/CSS do painel de alfabeto
- **Dia 3-4:** Implementar `AlphabetUI` com renderização dinâmica
- **Dia 5:** Adicionar feedback visual (erros, confirmações)

### Semana 3: Integração e Polimento
- **Dia 1-2:** Integrar validação nas transições existentes
- **Dia 3-4:** Implementar detecção automática de símbolos
- **Dia 5:** Testes finais, correção de bugs, documentação

## 🧪 Critérios de Aceitação

### Funcionais
- [ ] Usuário pode adicionar símbolos ao alfabeto
- [ ] Usuário pode remover símbolos não utilizados
- [ ] Sistema valida símbolos contra regras definidas
- [ ] Transições são validadas contra o alfabeto
- [ ] Interface mostra status atual do alfabeto
- [ ] Botão "Detectar do autômato" funciona

### Técnicos
- [ ] 100% de cobertura de testes no módulo alphabet
- [ ] Integração sem quebrar funcionalidades existentes
- [ ] Código modular e bem documentado
- [ ] Internacionalização de todas as mensagens
- [ ] Performance adequada (resposta < 100ms)

### UX/UI
- [ ] Interface intuitiva e consistente com design existente
- [ ] Feedback visual claro para todas as ações
- [ ] Responsivo em diferentes tamanhos de tela
- [ ] Acessível (ARIA labels, contraste adequado)

## 🔍 Considerações de Design

### 1. Experiência do Usuário
- **Onboarding:** Tooltip explicando o alfabeto na primeira visita
- **Feedback imediato:** Validação em tempo real na entrada
- **Recuperação de erros:** Sugestões quando símbolo é inválido
- **Consistência:** Mesmo padrão visual dos