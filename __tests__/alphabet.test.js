/**
 * Testes para o módulo de gerenciamento de alfabeto
 * Implementação seguindo TDD (Test-Driven Development)
 * 
 * NOTA: Estes testes usam a implementação real dos módulos
 * Os módulos devem ser carregados antes da execução dos testes
 */

// Mock do localStorage para testes
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock do transitionMap global
window.transitionMap = new Map();

describe('Módulo de Alfabeto', () => {
  // Variáveis para os testes
  let alphabet;
  
  beforeEach(() => {
    // Limpar localStorage mock
    localStorageMock.clear();
    
    // Resetar transitionMap
    window.transitionMap.clear();
    
    // Carregar módulos reais se não estiverem carregados
    if (!window.Alphabet) {
      // Simular carregamento dos módulos
      // Em ambiente real, os módulos seriam carregados via import
      require('../js/alphabet/alphabet.js');
      require('../js/alphabet/alphabet-validation.js');
    }
    
    // Resetar instância global
    if (window.alphabet) {
      window.alphabet.clear();
    } else {
      // A classe Alphabet já deve estar disponível globalmente
      window.alphabet = new window.Alphabet();
    }
    
    alphabet = window.alphabet;
  });
  
  afterEach(() => {
    // Limpar após cada teste
    if (alphabet && typeof alphabet.clear === 'function') {
      alphabet.clear();
    }
    localStorageMock.clear();
    window.transitionMap.clear();
  });
  
  describe('Classe Alphabet - Operações Básicas', () => {
    test('deve criar alfabeto vazio', () => {
      expect(alphabet.getSymbols()).toEqual([]);
      expect(alphabet.size()).toBe(0);
    });
    
    test('deve adicionar símbolo válido', () => {
      const result = alphabet.add('a');
      expect(result).toBe(true);
      expect(alphabet.has('a')).toBe(true);
      expect(alphabet.getSymbols()).toEqual(['a']);
      expect(alphabet.size()).toBe(1);
    });
    
    test('deve adicionar múltiplos símbolos válidos', () => {
      alphabet.add('a');
      alphabet.add('b');
      alphabet.add('0');
      
      expect(alphabet.has('a')).toBe(true);
      expect(alphabet.has('b')).toBe(true);
      expect(alphabet.has('0')).toBe(true);
      expect(alphabet.size()).toBe(3);
      expect(alphabet.getSymbols()).toEqual(['0', 'a', 'b']); // Ordenado
    });
    
    test('deve rejeitar símbolo vazio', () => {
      expect(() => alphabet.add('')).toThrow('Símbolo inválido: ');
      expect(() => alphabet.add('   ')).toThrow('Símbolo inválido:    ');
    });
    
    test('deve rejeitar símbolo com espaços', () => {
      expect(() => alphabet.add('a b')).toThrow();
      expect(() => alphabet.add(' a')).toThrow();
      expect(() => alphabet.add('a ')).toThrow();
    });
    
    test('deve rejeitar símbolo ε (reservado)', () => {
      expect(() => alphabet.add('ε')).toThrow('Símbolo reservado: ε');
    });
    
    test('deve rejeitar símbolo muito longo (> 3 caracteres)', () => {
      expect(() => alphabet.add('abcd')).toThrow('Símbolo inválido: abcd');
      expect(() => alphabet.add('abc')).not.toThrow(); // 3 caracteres é OK
    });
    
    test('deve remover símbolo existente', () => {
      alphabet.add('x');
      alphabet.add('y');
      
      const result = alphabet.remove('x');
      expect(result).toBe(true);
      expect(alphabet.has('x')).toBe(false);
      expect(alphabet.has('y')).toBe(true);
      expect(alphabet.size()).toBe(1);
    });
    
    test('deve retornar false ao tentar remover símbolo inexistente', () => {
      alphabet.add('a');
      
      const result = alphabet.remove('b');
      expect(result).toBe(false);
      expect(alphabet.has('a')).toBe(true);
      expect(alphabet.size()).toBe(1);
    });
    
    test('deve retornar false ao tentar remover símbolo em uso', () => {
      alphabet.add('a');
      
      // Adicionar transição para simular que 'a' está em uso
      window.transitionMap.set('q0|a', new Set(['q1']));
      
      const result = alphabet.remove('a');
      expect(result).toBe(false);
      expect(alphabet.has('a')).toBe(true); // Ainda deve existir
      
      // Limpar transição
      window.transitionMap.clear();
    });
    
    test('deve verificar se símbolo pertence ao alfabeto', () => {
      expect(alphabet.has('a')).toBe(false);
      
      alphabet.add('a');
      expect(alphabet.has('a')).toBe(true);
      expect(alphabet.has('b')).toBe(false);
    });
    
    test('deve retornar lista ordenada de símbolos', () => {
      alphabet.add('z');
      alphabet.add('a');
      alphabet.add('m');
      alphabet.add('1');
      alphabet.add('0');
      
      expect(alphabet.getSymbols()).toEqual(['0', '1', 'a', 'm', 'z']);
    });
    
    test('deve limpar todos os símbolos', () => {
      alphabet.add('a');
      alphabet.add('b');
      alphabet.add('c');
      
      expect(alphabet.size()).toBe(3);
      
      alphabet.clear();
      
      expect(alphabet.size()).toBe(0);
      expect(alphabet.getSymbols()).toEqual([]);
      expect(alphabet.has('a')).toBe(false);
      expect(alphabet.has('b')).toBe(false);
      expect(alphabet.has('c')).toBe(false);
    });
    
    test('deve manter símbolos únicos (não duplicados)', () => {
      alphabet.add('a');
      alphabet.add('a'); // Duplicado
      alphabet.add('a'); // Triplicado
      
      expect(alphabet.size()).toBe(1);
      expect(alphabet.getSymbols()).toEqual(['a']);
    });
  });
  
  describe('Validação de Símbolos', () => {
    test('deve aceitar letras minúsculas', () => {
      expect(() => alphabet.add('a')).not.toThrow();
      expect(() => alphabet.add('z')).not.toThrow();
    });
    
    test('deve aceitar letras maiúsculas', () => {
      expect(() => alphabet.add('A')).not.toThrow();
      expect(() => alphabet.add('Z')).not.toThrow();
    });
    
    test('deve aceitar dígitos', () => {
      expect(() => alphabet.add('0')).not.toThrow();
      expect(() => alphabet.add('9')).not.toThrow();
      expect(() => alphabet.add('42')).not.toThrow(); // Dois dígitos
    });
    
    test('deve aceitar símbolos especiais permitidos', () => {
      // Símbolos comuns em alfabetos formais
      expect(() => alphabet.add('+')).not.toThrow();
      expect(() => alphabet.add('*')).not.toThrow();
      expect(() => alphabet.add('#')).not.toThrow();
      expect(() => alphabet.add('@')).not.toThrow();
    });
    
    test('deve rejeitar caracteres de controle', () => {
      expect(() => alphabet.add('\n')).toThrow();
      expect(() => alphabet.add('\t')).toThrow();
      expect(() => alphabet.add('\r')).toThrow();
    });
    
    test('deve aceitar símbolos com até 3 caracteres', () => {
      expect(() => alphabet.add('ab')).not.toThrow();
      expect(() => alphabet.add('abc')).not.toThrow();
      expect(() => alphabet.add('01')).not.toThrow();
      expect(() => alphabet.add('a1')).not.toThrow();
    });
  });
  
  describe('Integração Alfabeto-Autômato (Simulação)', () => {
    // Mock do autômato para testes de integração
    let mockAutomaton;
    
    beforeEach(() => {
      mockAutomaton = {
        transitions: [
          { from: 'q0', symbol: 'a', to: 'q1' },
          { from: 'q0', symbol: 'b', to: 'q2' },
          { from: 'q1', symbol: 'ε', to: 'q2' },
          { from: 'q2', symbol: 'a', to: 'q2' },
        ],
        getUsedSymbols: function() {
          const symbols = new Set();
          this.transitions.forEach(t => {
            if (t.symbol !== 'ε') {
              symbols.add(t.symbol);
            }
          });
          return symbols;
        }
      };
    });
    
    test('deve validar transições contra alfabeto', () => {
      // Configurar alfabeto
      alphabet.add('a');
      alphabet.add('b');
      
      // Obter símbolos usados no autômato
      const usedSymbols = mockAutomaton.getUsedSymbols();
      
      // Verificar que todos os símbolos usados estão no alfabeto
      usedSymbols.forEach(symbol => {
        expect(alphabet.has(symbol)).toBe(true);
      });
      
      // Verificar contagem
      expect(usedSymbols.size).toBe(2); // a, b
    });
    
    test('deve identificar símbolos faltantes no alfabeto', () => {
      // Alfabeto incompleto
      alphabet.add('a');
      // 'b' está faltando
      
      const usedSymbols = mockAutomaton.getUsedSymbols();
      const missingSymbols = Array.from(usedSymbols).filter(s => !alphabet.has(s));
      
      expect(missingSymbols).toEqual(['b']);
      expect(missingSymbols.length).toBe(1);
    });
    
    test('deve sugerir adição de símbolos faltantes', () => {
      // Teste de lógica de sugestão
      const usedSymbols = mockAutomaton.getUsedSymbols();
      const currentSymbols = new Set(alphabet.getSymbols());
      const suggestions = Array.from(usedSymbols).filter(s => !currentSymbols.has(s));
      
      expect(suggestions).toContain('a');
      expect(suggestions).toContain('b');
    });
    
    test('deve manter consistência entre alfabeto e transições', () => {
      // Adicionar símbolos usados
      alphabet.add('a');
      alphabet.add('b');
      
      // Adicionar transição para simular que 'a' está em uso
      window.transitionMap.set('q0|a', new Set(['q1']));
      
      // Simular remoção de símbolo 'a' (deve falhar se em uso)
      const canRemoveA = alphabet.remove('a');
      
      // 'a' está em uso, então não deve poder remover
      expect(canRemoveA).toBe(false);
      expect(alphabet.has('a')).toBe(true); // Ainda deve existir
      
      // Limpar transição
      window.transitionMap.clear();
    });
    
    test('deve permitir remoção de símbolo não utilizado', () => {
      alphabet.add('a');
      alphabet.add('b');
      alphabet.add('c'); // 'c' não é usado no autômato
      
      // 'c' não está em uso, deve poder remover
      const canRemoveC = alphabet.remove('c');
      expect(canRemoveC).toBe(true);
      expect(alphabet.has('c')).toBe(false);
    });
    
    test('deve identificar símbolos no alfabeto mas não utilizados', () => {
      alphabet.add('a');
      alphabet.add('b');
      alphabet.add('x'); // Não utilizado
      alphabet.add('y'); // Não utilizado
      
      const usedSymbols = mockAutomaton.getUsedSymbols();
      const unusedSymbols = alphabet.getSymbols().filter(s => !usedSymbols.has(s));
      
      expect(unusedSymbols).toContain('x');
      expect(unusedSymbols).toContain('y');
      expect(unusedSymbols).not.toContain('a');
      expect(unusedSymbols).not.toContain('b');
    });
  });
  
  describe('Casos Especiais e Edge Cases', () => {
    test('deve lidar com símbolos Unicode básicos', () => {
      // Caracteres Unicode comuns
      expect(() => alphabet.add('α')).not.toThrow();
      expect(() => alphabet.add('β')).not.toThrow();
      expect(() => alphabet.add('ñ')).not.toThrow();
      expect(() => alphabet.add('ç')).not.toThrow();
    });
    
    test('deve preservar ordem após múltiplas operações', () => {
      alphabet.add('z');
      alphabet.add('a');
      expect(alphabet.getSymbols()).toEqual(['a', 'z']);
      
      alphabet.add('m');
      expect(alphabet.getSymbols()).toEqual(['a', 'm', 'z']);
      
      alphabet.remove('m');
      expect(alphabet.getSymbols()).toEqual(['a', 'z']);
      
      alphabet.add('b');
      expect(alphabet.getSymbols()).toEqual(['a', 'b', 'z']);
    });
    
    test('deve diferenciar maiúsculas de minúsculas', () => {
      alphabet.add('a');
      alphabet.add('A');
      
      expect(alphabet.has('a')).toBe(true);
      expect(alphabet.has('A')).toBe(true);
      expect(alphabet.size()).toBe(2);
      
      // Verificar que ambos estão na lista (ordem pode variar dependendo da localização)
      const symbols = alphabet.getSymbols();
      expect(symbols).toContain('a');
      expect(symbols).toContain('A');
      expect(symbols.length).toBe(2);
    });
    
    test('deve lidar com símbolos numéricos como strings', () => {
      alphabet.add('0');
      alphabet.add('1');
      alphabet.add('10'); // String "10", não número 10
      alphabet.add('99');
      
      expect(alphabet.getSymbols()).toEqual(['0', '1', '10', '99']);
      expect(alphabet.has('10')).toBe(true);
      expect(alphabet.has(10)).toBe(false); // Número 10, não string
    });
    
    test('não deve aceitar null ou undefined', () => {
      expect(() => alphabet.add(null)).toThrow();
      expect(() => alphabet.add(undefined)).toThrow();
    });
  });
});

// Mock das funções de validação para testes
describe('Validador de Alfabeto', () => {
  // Implementação simplificada do validador para testes
  class AlphabetValidator {
    static validateSymbol(symbol) {
      const errors = [];
      
      if (!symbol || symbol.trim() === '') {
        errors.push('Símbolo não pode ser vazio');
      }
      
      if (symbol && symbol.length > 3) {
        errors.push('Símbolo muito longo (máx. 3 caracteres)');
      }
      
      if (symbol && /\s/.test(symbol)) {
        errors.push('Símbolo não pode conter espaços');
      }
      
      if (symbol && /[<>"&]/.test(symbol)) {
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
  }
  
  test('validação deve aceitar símbolo válido', () => {
    const result = AlphabetValidator.validateSymbol('a');
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });
  
  test('validação deve rejeitar símbolo vazio', () => {
    const result = AlphabetValidator.validateSymbol('');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Símbolo não pode ser vazio');
  });
  
  test('validação deve rejeitar símbolo com espaços', () => {
    const result = AlphabetValidator.validateSymbol('a b');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Símbolo não pode conter espaços');
  });
  
  test('validação deve rejeitar símbolo muito longo', () => {
    const result = AlphabetValidator.validateSymbol('abcd');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Símbolo muito longo (máx. 3 caracteres)');
  });
  
  test('validação deve rejeitar ε', () => {
    const result = AlphabetValidator.validateSymbol('ε');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('ε é reservado para transições epsilon');
  });
  
  test('validação deve rejeitar caracteres especiais perigosos', () => {
    const result1 = AlphabetValidator.validateSymbol('<');
    expect(result1.valid).toBe(false);
    expect(result1.errors).toContain('Símbolo contém caracteres especiais não permitidos');
    
    const result2 = AlphabetValidator.validateSymbol('>');
    expect(result2.valid).toBe(false);
    
    const result3 = AlphabetValidator.validateSymbol('"');
    expect(result3.valid).toBe(false);
    
    const result4 = AlphabetValidator.validateSymbol('&');
    expect(result4.valid).toBe(false);
  });
});