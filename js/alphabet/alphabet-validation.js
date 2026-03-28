/**
 * Módulo de Validação de Alfabeto
 * Funções utilitárias para validação de símbolos e consistência
 */

class AlphabetValidator {
  /**
   * Valida um símbolo individual
   * @param {string} symbol - Símbolo a validar
   * @returns {Object} Resultado da validação
   */
  static validateSymbol(symbol) {
    const errors = [];
    const warnings = [];
    
    if (!symbol || typeof symbol !== 'string') {
      errors.push('Símbolo deve ser uma string');
      return { valid: false, errors, warnings, symbol };
    }
    
    const trimmed = symbol.trim();
    
    // Verificar se está vazio
    if (trimmed.length === 0) {
      errors.push('Símbolo não pode ser vazio');
    }
    
    // Verificar comprimento
    if (trimmed.length > 3) {
      errors.push('Símbolo muito longo (máximo 3 caracteres)');
    } else if (trimmed.length > 1) {
      warnings.push('Símbolos com mais de 1 caractere podem ser confusos');
    }
    
    // Verificar espaços
    if (/\s/.test(trimmed)) {
      errors.push('Símbolo não pode conter espaços');
    }
    
    // Verificar caracteres de controle
    if (/[\x00-\x1F\x7F]/.test(trimmed)) {
      errors.push('Símbolo contém caracteres de controle não permitidos');
    }
    
    // Verificar caracteres especiais perigosos para HTML/XML
    if (/[<>"&]/.test(trimmed)) {
      errors.push('Símbolo contém caracteres especiais não permitidos (<, >, ", &)');
    }
    
    // Verificar se é símbolo reservado
    if (trimmed === 'ε') {
      errors.push('ε é reservado para transições epsilon');
    }
    
    // Verificar caracteres não imprimíveis
    if (!/^[\x20-\x7E\u00A0-\uFFFF]*$/.test(trimmed)) {
      warnings.push('Símbolo contém caracteres não padrão');
    }
    
    // Verificar se parece com número (pode ser confuso)
    if (/^\d+$/.test(trimmed) && trimmed.length > 1) {
      warnings.push('Símbolos numéricos com múltiplos dígitos podem ser confundidos com números');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      symbol: trimmed
    };
  }
  
  /**
   * Valida múltiplos símbolos
   * @param {string[]} symbols - Array de símbolos a validar
   * @returns {Object} Resultado da validação agregada
   */
  static validateSymbols(symbols) {
    if (!Array.isArray(symbols)) {
      return {
        valid: false,
        errors: ['Entrada deve ser um array de símbolos'],
        warnings: [],
        results: []
      };
    }
    
    const results = symbols.map(symbol => this.validateSymbol(symbol));
    const allValid = results.every(result => result.valid);
    const allErrors = results.flatMap(result => result.errors);
    const allWarnings = results.flatMap(result => result.warnings);
    
    // Verificar duplicatas
    const symbolCounts = {};
    symbols.forEach(symbol => {
      const trimmed = symbol.trim();
      symbolCounts[trimmed] = (symbolCounts[trimmed] || 0) + 1;
    });
    
    const duplicates = Object.entries(symbolCounts)
      .filter(([_, count]) => count > 1)
      .map(([symbol]) => symbol);
    
    if (duplicates.length > 0) {
      allErrors.push(`Símbolos duplicados: ${duplicates.join(', ')}`);
    }
    
    return {
      valid: allValid && duplicates.length === 0,
      errors: allErrors,
      warnings: allWarnings,
      results,
      duplicates
    };
  }
  
  /**
   * Valida consistência entre alfabeto e autômato
   * @param {Alphabet} alphabet - Instância do alfabeto
   * @param {Object} automaton - Objeto representando o autômato
   * @returns {Object} Resultado da validação
   */
  static validateAgainstAutomaton(alphabet, automaton) {
    if (!alphabet || typeof alphabet.getSymbols !== 'function') {
      return {
        valid: false,
        errors: ['Alfabeto inválido fornecido'],
        warnings: [],
        missingSymbols: [],
        unusedSymbols: [],
        usedSymbols: []
      };
    }
    
    // Extrair símbolos usados do autômato
    const usedSymbols = this.extractUsedSymbols(automaton);
    const alphabetSymbols = new Set(alphabet.getSymbols());
    
    // Símbolos usados que não estão no alfabeto
    const missingSymbols = Array.from(usedSymbols).filter(symbol => 
      !alphabetSymbols.has(symbol) && symbol !== 'ε'
    );
    
    // Símbolos no alfabeto que não são usados
    const unusedSymbols = Array.from(alphabetSymbols).filter(symbol => 
      !usedSymbols.has(symbol)
    );
    
    // Verificar símbolos problemáticos
    const problematicSymbols = [];
    for (const symbol of usedSymbols) {
      if (symbol !== 'ε') {
        const validation = this.validateSymbol(symbol);
        if (!validation.valid) {
          problematicSymbols.push({
            symbol,
            errors: validation.errors
          });
        }
      }
    }
    
    const isValid = missingSymbols.length === 0 && problematicSymbols.length === 0;
    
    const warnings = [];
    if (unusedSymbols.length > 0) {
      warnings.push(`${unusedSymbols.length} símbolo(s) no alfabeto não são utilizados: ${unusedSymbols.join(', ')}`);
    }
    
    if (problematicSymbols.length > 0) {
      warnings.push(`${problematicSymbols.length} símbolo(s) utilizados têm problemas de validação`);
    }
    
    return {
      valid: isValid,
      missingSymbols,
      unusedSymbols,
      usedSymbols: Array.from(usedSymbols),
      problematicSymbols,
      warnings,
      errors: missingSymbols.length > 0 ? 
        [`${missingSymbols.length} símbolo(s) utilizados não estão no alfabeto: ${missingSymbols.join(', ')}`] : 
        []
    };
  }
  
  /**
   * Extrai símbolos usados de um autômato
   * @param {Object} automaton - Objeto representando o autômato
   * @returns {Set<string>} Conjunto de símbolos usados
   */
  static extractUsedSymbols(automaton) {
    const usedSymbols = new Set();
    
    if (!automaton) {
      return usedSymbols;
    }
    
    // Tentar diferentes estruturas de dados do autômato
    if (automaton.transitionMap && typeof automaton.transitionMap.forEach === 'function') {
      // Estrutura Map do simulador atual
      for (let [key] of automaton.transitionMap) {
        const [, symbol] = key.split('|');
        if (symbol) {
          usedSymbols.add(symbol);
        }
      }
    } else if (Array.isArray(automaton.transitions)) {
      // Array de transições
      automaton.transitions.forEach(transition => {
        if (transition.symbol) {
          usedSymbols.add(transition.symbol);
        }
      });
    } else if (window.transitionMap) {
      // Usar transição global se disponível
      for (let [key] of window.transitionMap) {
        const [, symbol] = key.split('|');
        if (symbol) {
          usedSymbols.add(symbol);
        }
      }
    }
    
    return usedSymbols;
  }
  
  /**
   * Sugere símbolos para adicionar ao alfabeto com base no autômato
   * @param {Alphabet} alphabet - Instância do alfabeto
   * @param {Object} automaton - Objeto representando o autômato
   * @returns {string[]} Array de símbolos sugeridos
   */
  static suggestMissingSymbols(alphabet, automaton) {
    const usedSymbols = this.extractUsedSymbols(automaton);
    const alphabetSymbols = new Set(alphabet.getSymbols());
    
    return Array.from(usedSymbols).filter(symbol => 
      !alphabetSymbols.has(symbol) && 
      symbol !== 'ε' &&
      this.validateSymbol(symbol).valid
    );
  }
  
  /**
   * Gera relatório de validação completo
   * @param {Alphabet} alphabet - Instância do alfabeto
   * @param {Object} automaton - Objeto representando o autômato
   * @returns {Object} Relatório detalhado
   */
  static generateValidationReport(alphabet, automaton) {
    const symbolValidation = this.validateSymbols(alphabet.getSymbols());
    const automatonValidation = this.validateAgainstAutomaton(alphabet, automaton);
    const suggestions = this.suggestMissingSymbols(alphabet, automaton);
    
    const report = {
      timestamp: new Date().toISOString(),
      alphabet: {
        size: alphabet.size(),
        symbols: alphabet.getSymbols(),
        validation: symbolValidation
      },
      automaton: {
        usedSymbols: automatonValidation.usedSymbols,
        validation: automatonValidation
      },
      suggestions: {
        missingSymbols: suggestions,
        count: suggestions.length
      },
      summary: {
        isValid: symbolValidation.valid && automatonValidation.valid,
        hasWarnings: symbolValidation.warnings.length > 0 || automatonValidation.warnings.length > 0,
        totalErrors: symbolValidation.errors.length + automatonValidation.errors.length,
        totalWarnings: symbolValidation.warnings.length + automatonValidation.warnings.length
      }
    };
    
    return report;
  }
  
  /**
   * Formata relatório de validação para exibição
   * @param {Object} report - Relatório de validação
   * @returns {string} Texto formatado
   */
  static formatValidationReport(report) {
    if (!report) return 'Relatório inválido';
    
    const lines = [];
    lines.push(`=== RELATÓRIO DE VALIDAÇÃO DO ALFABETO ===`);
    lines.push(`Data: ${new Date(report.timestamp).toLocaleString()}`);
    lines.push('');
    
    // Resumo
    lines.push(`📊 RESUMO`);
    lines.push(`Status: ${report.summary.isValid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`);
    lines.push(`Alfabeto: ${report.alphabet.size} símbolo(s)`);
    lines.push(`Símbolos usados no autômato: ${report.automaton.usedSymbols.length}`);
    lines.push('');
    
    // Erros
    if (report.summary.totalErrors > 0) {
      lines.push(`❌ ERROS (${report.summary.totalErrors})`);
      
      if (report.alphabet.validation.errors.length > 0) {
        lines.push(`  Problemas no alfabeto:`);
        report.alphabet.validation.errors.forEach(error => {
          lines.push(`    • ${error}`);
        });
      }
      
      if (report.automaton.validation.errors.length > 0) {
        lines.push(`  Problemas de consistência:`);
        report.automaton.validation.errors.forEach(error => {
          lines.push(`    • ${error}`);
        });
      }
      lines.push('');
    }
    
    // Avisos
    if (report.summary.totalWarnings > 0) {
      lines.push(`⚠️  AVISOS (${report.summary.totalWarnings})`);
      
      if (report.alphabet.validation.warnings.length > 0) {
        lines.push(`  Avisos no alfabeto:`);
        report.alphabet.validation.warnings.forEach(warning => {
          lines.push(`    • ${warning}`);
        });
      }
      
      if (report.automaton.validation.warnings.length > 0) {
        lines.push(`  Avisos de consistência:`);
        report.automaton.validation.warnings.forEach(warning => {
          lines.push(`    • ${warning}`);
        });
      }
      lines.push('');
    }
    
    // Sugestões
    if (report.suggestions.count > 0) {
      lines.push(`💡 SUGESTÕES`);
      lines.push(`  Símbolos faltantes no alfabeto:`);
      report.suggestions.missingSymbols.forEach(symbol => {
        lines.push(`    • Adicionar "${symbol}" ao alfabeto`);
      });
      lines.push('');
    }
    
    // Detalhes do alfabeto
    lines.push(`🔤 ALFABETO ATUAL`);
    lines.push(`  Σ = {${report.alphabet.symbols.join(', ') || '(vazio)'}}`);
    
    return lines.join('\n');
  }
}

// Exportar para uso global
window.AlphabetValidator = AlphabetValidator;

// Exportar para uso em módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AlphabetValidator;
}