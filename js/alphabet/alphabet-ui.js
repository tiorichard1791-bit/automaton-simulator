/**
 * Módulo de Interface do Usuário para Gerenciamento de Alfabeto
 * Controla a interface visual do painel de alfabeto
 */

class AlphabetUI {
  constructor() {
    // Elementos DOM
    this.panel = document.getElementById('alphabet-panel');
    this.input = document.getElementById('alphabet-input');
    this.addBtn = document.getElementById('add-symbol-btn');
    this.list = document.getElementById('alphabet-list');
    this.status = document.getElementById('alphabet-status');
    this.autoDetectBtn = document.getElementById('auto-detect-btn');
    this.clearBtn = document.getElementById('clear-alphabet-btn');
    this.validationPanel = document.getElementById('alphabet-validation');
    this.validationStatus = document.getElementById('validation-status');
    
    // Estado
    this.isInitialized = false;
    this.lastValidation = null;
    
    // Inicializar
    this.init();
  }
  
  /**
   * Inicializa a interface
   */
  init() {
    if (this.isInitialized) return;
    
    // Configurar event listeners
    this.addBtn.addEventListener('click', () => this.addSymbol());
    this.input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.addSymbol();
    });
    
    this.autoDetectBtn.addEventListener('click', () => this.detectFromAutomaton());
    this.clearBtn.addEventListener('click', () => this.clearAlphabet());
    
    // Escutar mudanças no alfabeto
    window.addEventListener('alphabetChanged', (e) => {
      this.renderSymbols(e.detail.symbols);
      this.updateStatus();
      this.updateValidation();
    });
    
    // Escutar mudanças no autômato
    window.addEventListener('automatonChanged', () => {
      this.updateValidation();
    });
    
    // Validação em tempo real
    this.input.addEventListener('input', () => this.validateInput());
    
    // Renderizar estado inicial
    this.renderSymbols(window.alphabet.getSymbols());
    this.updateStatus();
    this.updateValidation();
    
    this.isInitialized = true;
    
    console.log('AlphabetUI inicializado com sucesso');
  }
  
  /**
   * Adiciona símbolo do input
   */
  addSymbol() {
    const symbol = this.input.value.trim();
    if (!symbol) {
      this.showMessage('Digite um símbolo para adicionar', 'warning');
      return;
    }
    
    try {
      window.alphabet.add(symbol);
      this.input.value = '';
      this.input.focus();
      this.showMessage(`Símbolo "${symbol}" adicionado ao alfabeto`, 'success');
      
      // Adicionar classe "new" para animação
      const newItem = this.list.querySelector(`[data-symbol="${symbol}"]`);
      if (newItem) {
        newItem.classList.add('new');
        setTimeout(() => newItem.classList.remove('new'), 1000);
      }
    } catch (error) {
      this.showMessage(error.message, 'error');
      this.input.focus();
      this.input.select();
    }
  }
  
  /**
   * Remove símbolo
   * @param {string} symbol - Símbolo a remover
   */
  removeSymbol(symbol) {
    if (window.alphabet.remove(symbol)) {
      this.showMessage(`Símbolo "${symbol}" removido do alfabeto`, 'success');
    } else {
      if (window.alphabet.isSymbolInUse(symbol)) {
        this.showMessage(
          `Símbolo "${symbol}" está em uso. Remova as transições primeiro.`,
          'warning'
        );
      } else {
        this.showMessage(`Não foi possível remover o símbolo "${symbol}"`, 'error');
      }
    }
  }
  
  /**
   * Detecta símbolos do autômato
   */
  detectFromAutomaton() {
    const addedCount = window.alphabet.addDetectedSymbols();
    
    if (addedCount > 0) {
      this.showMessage(
        `${addedCount} símbolo(s) detectado(s) e adicionado(s) ao alfabeto`,
        'success'
      );
    } else {
      this.showMessage(
        'Nenhum símbolo novo detectado no autômato',
        'info'
      );
    }
  }
  
  /**
   * Limpa todo o alfabeto
   */
  clearAlphabet() {
    if (window.alphabet.size() === 0) {
      this.showMessage('O alfabeto já está vazio', 'info');
      return;
    }
    
    // Verificar se há símbolos em uso
    const usedSymbols = [];
    for (const symbol of window.alphabet.getSymbols()) {
      if (window.alphabet.isSymbolInUse(symbol)) {
        usedSymbols.push(symbol);
      }
    }
    
    if (usedSymbols.length > 0) {
      const message = `Não é possível limpar o alfabeto. ${usedSymbols.length} símbolo(s) estão em uso: ${usedSymbols.join(', ')}`;
      this.showMessage(message, 'warning');
      return;
    }
    
    if (confirm('Tem certeza que deseja limpar todo o alfabeto?')) {
      window.alphabet.clear();
      this.showMessage('Alfabeto limpo com sucesso', 'success');
    }
  }
  
  /**
   * Renderiza lista de símbolos
   * @param {string[]} symbols - Array de símbolos
   */
  renderSymbols(symbols) {
    if (!this.list) return;
    
    if (symbols.length === 0) {
      this.list.innerHTML = '';
      this.list.classList.add('empty');
      return;
    }
    
    this.list.classList.remove('empty');
    
    const html = symbols.map(symbol => {
      const isInUse = window.alphabet.isSymbolInUse(symbol);
      const inUseClass = isInUse ? 'in-use' : '';
      const tooltip = isInUse ? 'title="Este símbolo está em uso no autômato"' : '';
      
      return `
        <div class="symbol-item ${inUseClass}" data-symbol="${symbol}" ${tooltip}>
          <span class="symbol-text">${this.escapeHtml(symbol)}</span>
          <button class="remove-btn" onclick="alphabetUI.removeSymbol('${this.escapeHtml(symbol)}')" 
                  ${isInUse ? 'disabled title="Remova as transições primeiro"' : ''}>
            ×
          </button>
        </div>
      `;
    }).join('');
    
    this.list.innerHTML = html;
  }
  
  /**
   * Atualiza status do alfabeto
   */
  updateStatus() {
    if (!this.status) return;
    
    const symbols = window.alphabet.getSymbols();
    const count = symbols.length;
    const symbolsText = count > 0 ? `{${symbols.join(', ')}}` : '{ }';
    
    this.status.innerHTML = `
      <span>Σ = ${symbolsText}</span>
      <span class="badge">${count} símbolo${count !== 1 ? 's' : ''}</span>
    `;
  }
  
  /**
   * Atualiza painel de validação
   */
  updateValidation() {
    if (!this.validationPanel || !this.validationStatus) return;
    
    // Gerar relatório de validação
    const report = window.AlphabetValidator.generateValidationReport(
      window.alphabet,
      { transitionMap: window.transitionMap }
    );
    
    this.lastValidation = report;
    
    // Atualizar classes do painel
    this.validationPanel.classList.remove('valid', 'invalid');
    if (report.summary.isValid) {
      this.validationPanel.classList.add('valid');
    } else {
      this.validationPanel.classList.add('invalid');
    }
    
    // Renderizar status
    let html = '';
    
    if (report.summary.totalErrors > 0) {
      html += '<div class="error">';
      if (report.alphabet.validation.errors.length > 0) {
        report.alphabet.validation.errors.forEach(error => {
          html += `<div>${this.escapeHtml(error)}</div>`;
        });
      }
      if (report.automaton.validation.errors.length > 0) {
        report.automaton.validation.errors.forEach(error => {
          html += `<div>${this.escapeHtml(error)}</div>`;
        });
      }
      html += '</div>';
    }
    
    if (report.summary.totalWarnings > 0) {
      html += '<div class="warning">';
      if (report.alphabet.validation.warnings.length > 0) {
        report.alphabet.validation.warnings.forEach(warning => {
          html += `<div>${this.escapeHtml(warning)}</div>`;
        });
      }
      if (report.automaton.validation.warnings.length > 0) {
        report.automaton.validation.warnings.forEach(warning => {
          html += `<div>${this.escapeHtml(warning)}</div>`;
        });
      }
      html += '</div>';
    }
    
    if (report.summary.isValid && report.summary.totalWarnings === 0) {
      html += '<div class="success">Alfabeto válido e consistente com o autômato</div>';
    }
    
    if (report.suggestions.count > 0) {
      html += '<div class="warning">';
      html += `<div>Sugestões: Adicione ${report.suggestions.count} símbolo(s) ao alfabeto</div>`;
      html += '</div>';
    }
    
    this.validationStatus.innerHTML = html || '<div class="success">Nenhum problema detectado</div>';
  }
  
  /**
   * Valida entrada em tempo real
   */
  validateInput() {
    const symbol = this.input.value.trim();
    if (!symbol) {
      this.clearInputValidation();
      return;
    }
    
    const validation = window.AlphabetValidator.validateSymbol(symbol);
    
    // Atualizar estilo do input
    this.input.classList.remove('valid-input', 'invalid-input');
    
    if (validation.valid) {
      if (window.alphabet.has(symbol)) {
        this.input.classList.add('invalid-input');
        this.showTooltip(this.input, 'Este símbolo já está no alfabeto');
      } else {
        this.input.classList.add('valid-input');
      }
    } else {
      this.input.classList.add('invalid-input');
      if (validation.errors.length > 0) {
        this.showTooltip(this.input, validation.errors[0]);
      }
    }
  }
  
  /**
   * Limpa validação do input
   */
  clearInputValidation() {
    this.input.classList.remove('valid-input', 'invalid-input');
    this.hideTooltip(this.input);
  }
  
  /**
   * Exibe mensagem de feedback
   * @param {string} text - Texto da mensagem
   * @param {string} type - Tipo (success, error, warning, info)
   */
  showMessage(text, type = 'info') {
    // Remover mensagens anteriores
    const existingMessages = document.querySelectorAll('.alphabet-message');
    existingMessages.forEach(msg => msg.remove());
    
    // Criar nova mensagem
    const message = document.createElement('div');
    message.className = `alphabet-message ${type}`;
    message.textContent = text;
    message.style.position = 'fixed';
    message.style.top = '20px';
    message.style.right = '20px';
    message.style.zIndex = '10000';
    
    document.body.appendChild(message);
    
    // Remover após 3 segundos
    setTimeout(() => {
      if (message.parentNode) {
        message.parentNode.removeChild(message);
      }
    }, 3000);
  }
  
  /**
   * Exibe tooltip
   * @param {HTMLElement} element - Elemento alvo
   * @param {string} text - Texto do tooltip
   */
  showTooltip(element, text) {
    // Remover tooltip anterior
    this.hideTooltip(element);
    
    // Criar tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'alphabet-tooltip';
    tooltip.innerHTML = `
      <div class="tooltip-text">${this.escapeHtml(text)}</div>
    `;
    
    // Posicionar tooltip
    const rect = element.getBoundingClientRect();
    tooltip.style.position = 'absolute';
    tooltip.style.top = `${rect.top - 40}px`;
    tooltip.style.left = `${rect.left}px`;
    
    element.parentNode.appendChild(tooltip);
    element.dataset.tooltipId = 'current';
  }
  
  /**
   * Esconde tooltip
   * @param {HTMLElement} element - Elemento alvo
   */
  hideTooltip(element) {
    const tooltip = element.parentNode.querySelector('.alphabet-tooltip');
    if (tooltip) {
      tooltip.remove();
    }
  }
  
  /**
   * Escapa HTML para prevenir XSS
   * @param {string} text - Texto a escapar
   * @returns {string} Texto escapado
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  /**
   * Exporta relatório de validação
   * @returns {string} Relatório formatado
   */
  exportValidationReport() {
    if (!this.lastValidation) {
      return 'Nenhum relatório de validação disponível';
    }
    
    return window.AlphabetValidator.formatValidationReport(this.lastValidation);
  }
  
  /**
   * Copia alfabeto para área de transferência
   */
  copyToClipboard() {
    const symbols = window.alphabet.getSymbols();
    const text = `Σ = {${symbols.join(', ')}}`;
    
    navigator.clipboard.writeText(text).then(() => {
      this.showMessage('Alfabeto copiado para a área de transferência', 'success');
    }).catch(err => {
      this.showMessage('Erro ao copiar para a área de transferência', 'error');
      console.error('Erro ao copiar:', err);
    });
  }
  
  /**
   * Destrói a instância (limpeza)
   */
  destroy() {
    // Remover event listeners
    this.addBtn.removeEventListener('click', () => this.addSymbol());
    this.input.removeEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.addSymbol();
    });
    this.autoDetectBtn.removeEventListener('click', () => this.detectFromAutomaton());
    this.clearBtn.removeEventListener('click', () => this.clearAlphabet());
    this.input.removeEventListener('input', () => this.validateInput());
    
    // Remover listeners globais
    // Nota: Não podemos remover listeners anônimos facilmente
    // Em produção, usaríamos uma abordagem diferente
    
    this.isInitialized = false;
  }
}

// Criar instância global quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
  window.alphabetUI = new AlphabetUI();
});

// Exportar para uso em módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AlphabetUI;
}