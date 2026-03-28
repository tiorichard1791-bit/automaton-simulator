/**
 * Testes para as funções principais do simulador de autômatos
 */

// Mock do DOM para Jest
global.document = {
  getElementById: jest.fn(() => ({
    innerHTML: '',
    textContent: '',
    style: {},
    addEventListener: jest.fn(),
    setAttribute: jest.fn(),
    appendChild: jest.fn(),
    createElementNS: jest.fn(() => ({
      setAttribute: jest.fn(),
      addEventListener: jest.fn(),
      appendChild: jest.fn(),
    })),
  })),
  createElementNS: jest.fn(() => ({
    setAttribute: jest.fn(),
    addEventListener: jest.fn(),
    appendChild: jest.fn(),
  })),
};

// Mock do window.i18n
global.window = {
  i18n: {
    get: jest.fn((key) => {
      const translations = {
        'type_badge_nondet': '🔀 Não Determinístico (AFND)',
        'type_badge_det': '⚙️ Determinístico (AFD)',
        'transition_from': 'De',
        'transition_to': 'Para',
        'no_transitions': 'Nenhuma transição definida',
        'epsilon_symbol': 'ε',
        'alert_from_to': 'Selecione os estados de origem e destino',
        'error_no_initial': 'Nenhum estado inicial definido',
        'error_undefined': 'Transição indefinida',
        'error_multiple': 'Múltiplas transições para o mesmo símbolo',
        'accept_reason_afnd': 'Aceito (AFND)',
        'reject_reason_afnd': 'Rejeitado (AFND)',
        'accept_reason_afd': 'Aceito (AFD)',
        'reject_reason_afd': 'Rejeitado (AFD)',
      };
      return translations[key] || key;
    }),
  },
  addEventListener: jest.fn(),
};

// Importar as funções do script principal
// Como o código está em um arquivo global, vamos testar as funções diretamente
// Em um ambiente real, precisaríamos modularizar o código para testes adequados

describe('Funções de autômato', () => {
  beforeEach(() => {
    // Resetar estado global
    global.states = [];
    global.initialStateId = null;
    global.transitionMap = new Map();
    global.selectedStateId = null;
    global.nextId = 2;
  });

  describe('addState', () => {
    test('deve adicionar um novo estado', () => {
      // Configurar mocks
      global.updateSelectors = jest.fn();
      global.updateTransitionsUI = jest.fn();
      global.updateSVG = jest.fn();
      global.updateTypeBadge = jest.fn();
      global.stopAnySimulation = jest.fn();

      // Executar
      addState();

      // Verificar
      expect(global.states).toHaveLength(1);
      expect(global.states[0].id).toBe('q2');
      expect(global.states[0].name).toBe('q2');
      expect(global.states[0].final).toBe(false);
      expect(global.initialStateId).toBe('q2');
      expect(global.nextId).toBe(3);
    });

    test('deve definir estado inicial apenas no primeiro estado', () => {
      global.updateSelectors = jest.fn();
      global.updateTransitionsUI = jest.fn();
      global.updateSVG = jest.fn();
      global.updateTypeBadge = jest.fn();
      global.stopAnySimulation = jest.fn();

      // Primeiro estado
      addState();
      const firstStateId = global.initialStateId;

      // Segundo estado
      addState();

      expect(global.states).toHaveLength(2);
      expect(global.initialStateId).toBe(firstStateId); // Deve manter o primeiro como inicial
    });
  });

  describe('addTransition', () => {
    beforeEach(() => {
      global.updateTransitionsUI = jest.fn();
      global.updateSVG = jest.fn();
      global.updateSelectors = jest.fn();
      global.updateTypeBadge = jest.fn();
      global.stopAnySimulation = jest.fn();
      global.alert = jest.fn();

      // Criar estados para teste
      global.states = [
        { id: 'q1', name: 'q1', x: 100, y: 100, final: false },
        { id: 'q2', name: 'q2', x: 200, y: 200, final: true },
      ];
    });

    test('deve adicionar uma transição válida', () => {
      const result = addTransition('q1', 'a', 'q2');

      expect(result).toBe(true);
      expect(global.transitionMap.has('q1|a')).toBe(true);
      expect(global.transitionMap.get('q1|a')).toEqual(new Set(['q2']));
    });

    test('deve adicionar transição epsilon quando símbolo é vazio', () => {
      const result = addTransition('q1', '', 'q2');

      expect(result).toBe(true);
      expect(global.transitionMap.has('q1|ε')).toBe(true);
      expect(global.transitionMap.get('q1|ε')).toEqual(new Set(['q2']));
    });

    test('deve retornar false e alertar quando estados não são fornecidos', () => {
      const result = addTransition('', 'a', 'q2');

      expect(result).toBe(false);
      expect(global.alert).toHaveBeenCalledWith('Selecione os estados de origem e destino');
    });
  });

  describe('removeTransition', () => {
    beforeEach(() => {
      global.updateTransitionsUI = jest.fn();
      global.updateSVG = jest.fn();
      global.updateSelectors = jest.fn();
      global.updateTypeBadge = jest.fn();
      global.stopAnySimulation = jest.fn();

      // Configurar transição para teste
      global.transitionMap.set('q1|a', new Set(['q2']));
    });

    test('deve remover uma transição existente', () => {
      removeTransition('q1', 'a', 'q2');

      expect(global.transitionMap.has('q1|a')).toBe(false);
    });

    test('deve manter outras transições no mesmo símbolo', () => {
      global.transitionMap.set('q1|a', new Set(['q2', 'q3']));
      
      removeTransition('q1', 'a', 'q2');

      expect(global.transitionMap.has('q1|a')).toBe(true);
      expect(global.transitionMap.get('q1|a')).toEqual(new Set(['q3']));
    });
  });

  describe('epsilonClosure', () => {
    beforeEach(() => {
      // Configurar transições epsilon para teste
      global.transitionMap.set('q1|ε', new Set(['q2']));
      global.transitionMap.set('q2|ε', new Set(['q3']));
      global.transitionMap.set('q3|ε', new Set(['q4']));
    });

    test('deve calcular o ε-fechamento corretamente', () => {
      const closure = epsilonClosure(new Set(['q1']));

      expect(closure).toEqual(new Set(['q1', 'q2', 'q3', 'q4']));
    });

    test('deve lidar com conjunto vazio', () => {
      const closure = epsilonClosure(new Set());

      expect(closure).toEqual(new Set());
    });

    test('deve lidar com estados sem transições epsilon', () => {
      const closure = epsilonClosure(new Set(['q4']));

      expect(closure).toEqual(new Set(['q4']));
    });
  });

  describe('move', () => {
    beforeEach(() => {
      // Configurar transições para teste
      global.transitionMap.set('q1|a', new Set(['q2', 'q3']));
      global.transitionMap.set('q2|a', new Set(['q4']));
    });

    test('deve mover corretamente para um símbolo', () => {
      const result = move(new Set(['q1', 'q2']), 'a');

      expect(result).toEqual(new Set(['q2', 'q3', 'q4']));
    });

    test('deve retornar conjunto vazio quando não há transições', () => {
      const result = move(new Set(['q1']), 'b');

      expect(result).toEqual(new Set());
    });
  });

  describe('isDeterministic', () => {
    test('deve retornar true para AFD', () => {
      global.transitionMap.set('q1|a', new Set(['q2']));
      global.transitionMap.set('q1|b', new Set(['q3']));
      global.transitionMap.set('q2|a', new Set(['q2']));

      expect(isDeterministic()).toBe(true);
    });

    test('deve retornar false para transições epsilon', () => {
      global.transitionMap.set('q1|ε', new Set(['q2']));

      expect(isDeterministic()).toBe(false);
    });

    test('deve retornar false para múltiplas transições com mesmo símbolo', () => {
      global.transitionMap.set('q1|a', new Set(['q2', 'q3']));

      expect(isDeterministic()).toBe(false);
    });
  });
});

// Funções auxiliares para os testes
// Como o código original não é modular, precisamos definir as funções aqui
// Em um projeto real, seria melhor modularizar o código

function addState() {
  const newId = `q${global.nextId++}`;
  let newX = 250 + (global.states.length % 5) * 45;
  let newY = 220 + (Math.floor(global.states.length / 3) * 55);
  newX = Math.min(800, Math.max(70, newX));
  newY = Math.min(470, Math.max(70, newY));
  global.states.push({ id: newId, name: newId, x: newX, y: newY, final: false });
  if (global.states.length === 1 && !global.initialStateId) global.initialStateId = newId;
  if (global.updateSelectors) global.updateSelectors();
  if (global.updateTransitionsUI) global.updateTransitionsUI();
  if (global.updateSVG) global.updateSVG();
  if (global.updateTypeBadge) global.updateTypeBadge();
  if (global.stopAnySimulation) global.stopAnySimulation();
}

function addTransition(from, symbol, to) {
  if (!from || !to) {
    if (global.alert) global.alert('Selecione os estados de origem e destino');
    return false;
  }
  if (symbol === "") symbol = "ε";
  const key = `${from}|${symbol}`;
  if (!global.transitionMap.has(key)) {
    global.transitionMap.set(key, new Set());
  }
  global.transitionMap.get(key).add(to);
  if (global.updateTransitionsUI) global.updateTransitionsUI();
  if (global.updateSVG) global.updateSVG();
  if (global.updateSelectors) global.updateSelectors();
  if (global.updateTypeBadge) global.updateTypeBadge();
  if (global.stopAnySimulation) global.stopAnySimulation();
  return true;
}

function removeTransition(from, symbol, to) {
  const key = `${from}|${symbol}`;
  if (global.transitionMap.has(key)) {
    const set = global.transitionMap.get(key);
    set.delete(to);
    if (set.size === 0) global.transitionMap.delete(key);
  }
  if (global.updateTransitionsUI) global.updateTransitionsUI();
  if (global.updateSVG) global.updateSVG();
  if (global.updateSelectors) global.updateSelectors();
  if (global.updateTypeBadge) global.updateTypeBadge();
  if (global.stopAnySimulation) global.stopAnySimulation();
}

function epsilonClosure(stateSet) {
  let closure = new Set(stateSet);
  let stack = [...stateSet];
  while (stack.length) {
    const current = stack.pop();
    const keyEps = `${current}|ε`;
    if (global.transitionMap.has(keyEps)) {
      for (let next of global.transitionMap.get(keyEps)) {
        if (!closure.has(next)) {
          closure.add(next);
          stack.push(next);
        }
      }
    }
  }
  return closure;
}

function move(stateSet, symbol) {
  const result = new Set();
  for (let s of stateSet) {
    const key = `${s}|${symbol}`;
    if (global.transitionMap.has(key)) {
      for (let dest of global.transitionMap.get(key)) {
        result.add(dest);
      }
    }
  }
  return result;
}

function isDeterministic() {
  for (let [key, destSet] of global.transitionMap.entries()) {
    if (key.endsWith("|ε")) return false;
    if (destSet.size > 1) return false;
  }
  const perStateSymbol = new Map();
  for (let [key, destSet] of global.transitionMap.entries()) {
    const [from, symbol] = key.split('|');
    const stateSymbolKey = `${from}|${symbol}`;
    if (perStateSymbol.has(stateSymbolKey)) return false;
    perStateSymbol.set(stateSymbolKey, true);
  }
  return true;
}