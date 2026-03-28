/**
 * Módulo de Gerenciamento de Alfabeto
 * Implementação da classe Alphabet para gerenciamento explícito de símbolos
 */

class Alphabet {
  constructor() {
    this.symbols = new Set();
    this.reservedSymbols = new Set(['ε']);
    this.listeners = new Set();
    
    // Carregar alfabeto salvo no localStorage, se existir
    this.loadFromStorage();
  }
  
  /**
   * Adiciona um símbolo ao alfabeto
   * @param {string} symbol - Símbolo a ser adicionado
   * @returns {boolean} true se adicionado com sucesso
   * @throws {Error} Se símbolo for inválido ou reservado
   */
  add(symbol) {
    // Validação básica
    if (!this.isValidSymbol(symbol)) {
      throw new Error(`Símbolo inválido: ${symbol}`);
    }
    
    // Verificar se é símbolo reservado
    if (this.reservedSymbols.has(symbol)) {
      throw new Error(`Símbolo reservado: ${symbol}`);
    }
    
    // Adicionar ao conjunto
    this.symbols.add(symbol);
    
    // Notificar mudanças
    this.dispatchChangeEvent();
    
    // Salvar no localStorage
    this.saveToStorage();
    
    return true;
  }
  
  /**
   * Remove um símbolo do alfabeto
   * @param {string} symbol - Símbolo a ser removido
   * @returns {boolean} true se removido com sucesso, false se símbolo está em uso ou não existe
   */
  remove(symbol) {
    // Verificar se símbolo existe
    if (!this.symbols.has(symbol)) {
      return false;
    }
    
    // Verificar se símbolo está em uso
    if (this.isSymbolInUse(symbol)) {
      return false;
    }
    
    // Remover do conjunto
    this.symbols.delete(symbol);
    
    // Notificar mudanças
    this.dispatchChangeEvent();
    
    // Salvar no localStorage
    this.saveToStorage();
    
    return true;
  }
  
  /**
   * Verifica se símbolo pertence ao alfabeto
   * @param {string} symbol - Símbolo a verificar
   * @returns {boolean} true se símbolo está no alfabeto
   */
  has(symbol) {
    return this.symbols.has(symbol);
  }
  
  /**
   * Verifica se símbolo é válido
   * @param {string} symbol - Símbolo a validar
   * @returns {boolean} true se símbolo é válido
   */
  isValidSymbol(symbol) {
    if (!symbol || typeof symbol !== 'string') {
      return false;
    }
    
    const trimmed = symbol.trim();
    
    // Verificar comprimento
    if (trimmed.length === 0 || trimmed.length > 3) {
      return false;
    }
    
    // Verificar espaços no símbolo original (não apenas no trimado)
    if (/\s/.test(symbol)) {
      return false;
    }
    
    // Verificar caracteres de controle
    if (/[\x00-\x1F\x7F]/.test(symbol)) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Verifica se símbolo está em uso no autômato
   * @param {string} symbol - Símbolo a verificar
   * @returns {boolean} true se símbolo está em uso
   */
  isSymbolInUse(symbol) {
    // Esta função será integrada com o módulo de autômato
    // Por enquanto, verifica transições globais se disponíveis
    if (window.transitionMap) {
      for (let [key] of window.transitionMap) {
        const [, sym] = key.split('|');
        if (sym === symbol && sym !== 'ε') {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Retorna lista ordenada de símbolos
   * @returns {string[]} Array de símbolos ordenados
   */
  getSymbols() {
    return Array.from(this.symbols).sort((a, b) => {
      // Ordenação natural: números primeiro, depois letras
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });
  }
  
  /**
   * Retorna o tamanho do alfabeto
   * @returns {number} Número de símbolos no alfabeto
   */
  size() {
    return this.symbols.size;
  }
  
  /**
   * Limpa todos os símbolos do alfabeto
   */
  clear() {
    this.symbols.clear();
    this.dispatchChangeEvent();
    this.saveToStorage();
  }
  
  /**
   * Detecta símbolos usados no autômato atual
   * @returns {Set<string>} Conjunto de símbolos em uso
   */
  detectFromAutomaton() {
    const usedSymbols = new Set();
    
    if (window.transitionMap) {
      for (let [key] of window.transitionMap) {
        const [, symbol] = key.split('|');
        if (symbol && symbol !== 'ε') {
          usedSymbols.add(symbol);
        }
      }
    }
    
    return usedSymbols;
  }
  
  /**
   * Adiciona todos os símbolos detectados do autômato
   * @returns {number} Número de símbolos adicionados
   */
  addDetectedSymbols() {
    const usedSymbols = this.detectFromAutomaton();
    let addedCount = 0;
    
    for (const symbol of usedSymbols) {
      try {
        if (this.add(symbol)) {
          addedCount++;
        }
      } catch (error) {
        // Ignorar símbolos inválidos
        console.warn(`Não foi possível adicionar símbolo ${symbol}:`, error.message);
      }
    }
    
    return addedCount;
  }
  
  /**
   * Verifica consistência entre alfabeto e autômato
   * @returns {Object} Resultado da validação
   */
  validateAgainstAutomaton() {
    const usedSymbols = this.detectFromAutomaton();
    const missingSymbols = [];
    const unusedSymbols = [];
    
    // Símbolos usados que não estão no alfabeto
    for (const symbol of usedSymbols) {
      if (!this.has(symbol)) {
        missingSymbols.push(symbol);
      }
    }
    
    // Símbolos no alfabeto que não são usados
    for (const symbol of this.symbols) {
      if (!usedSymbols.has(symbol)) {
        unusedSymbols.push(symbol);
      }
    }
    
    return {
      valid: missingSymbols.length === 0,
      missingSymbols,
      unusedSymbols,
      usedSymbols: Array.from(usedSymbols)
    };
  }
  
  /**
   * Adiciona listener para mudanças no alfabeto
   * @param {Function} callback - Função a ser chamada quando o alfabeto mudar
   */
  addChangeListener(callback) {
    this.listeners.add(callback);
  }
  
  /**
   * Remove listener de mudanças
   * @param {Function} callback - Função a ser removida
   */
  removeChangeListener(callback) {
    this.listeners.delete(callback);
  }
  
  /**
   * Dispara evento de mudança
   * @private
   */
  dispatchChangeEvent() {
    const event = new CustomEvent('alphabetChanged', {
      detail: { symbols: this.getSymbols() }
    });
    
    // Notificar listeners locais
    for (const listener of this.listeners) {
      try {
        listener(this.getSymbols());
      } catch (error) {
        console.error('Erro em listener do alfabeto:', error);
      }
    }
    
    // Disparar evento global
    window.dispatchEvent(event);
  }
  
  /**
   * Salva alfabeto no localStorage
   * @private
   */
  saveToStorage() {
    try {
      localStorage.setItem('automaton-alphabet', JSON.stringify(this.getSymbols()));
    } catch (error) {
      console.warn('Não foi possível salvar alfabeto no localStorage:', error);
    }
  }
  
  /**
   * Carrega alfabeto do localStorage
   * @private
   */
  loadFromStorage() {
    try {
      const saved = localStorage.getItem('automaton-alphabet');
      if (saved) {
        const symbols = JSON.parse(saved);
        if (Array.isArray(symbols)) {
          this.symbols = new Set(symbols);
        }
      }
    } catch (error) {
      console.warn('Não foi possível carregar alfabeto do localStorage:', error);
    }
  }
  
  /**
   * Exporta alfabeto como objeto serializável
   * @returns {Object} Representação do alfabeto
   */
  toJSON() {
    return {
      symbols: this.getSymbols(),
      size: this.size(),
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Importa alfabeto de objeto
   * @param {Object} data - Dados do alfabeto
   */
  fromJSON(data) {
    if (data && Array.isArray(data.symbols)) {
      this.symbols = new Set();
      data.symbols.forEach(symbol => {
        try {
          this.add(symbol);
        } catch (error) {
          console.warn(`Não foi possível importar símbolo ${symbol}:`, error.message);
        }
      });
    }
  }
}

// Criar instância global
window.alphabet = new Alphabet();

// Exportar para uso em módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Alphabet;
}