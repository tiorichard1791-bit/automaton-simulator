# Testes do Automaton Simulator

Esta pasta contém os testes automatizados para o simulador de autômatos finitos (AFD/AFND).

## Estrutura de Testes

```
__tests__/
├── automaton.test.js      # Testes para as funções principais do autômato
├── i18n.test.js          # Testes para o sistema de internacionalização
└── README.md             # Este arquivo
```

## Como Executar os Testes

### Comandos Disponíveis

```bash
# Executar todos os testes
npm test

# Executar testes em modo watch (atualiza automaticamente)
npm run test:watch

# Executar testes com cobertura de código
npm run test:coverage

# Executar testes específicos
npm test -- --testNamePattern="Funções de autômato"
npm test -- --testNamePattern="Sistema de internacionalização"
```

### Testes Implementados

#### 1. Funções de Autômato (`automaton.test.js`)
- **addState**: Testa a criação de novos estados
- **addTransition**: Testa a adição de transições (incluindo transições epsilon)
- **removeTransition**: Testa a remoção de transições
- **epsilonClosure**: Testa o cálculo do ε-fechamento
- **move**: Testa a função de transição para um símbolo
- **isDeterministic**: Testa a detecção de autômatos determinísticos vs não-determinísticos

#### 2. Sistema de Internacionalização (`i18n.test.js`)
- **loadLanguage**: Testa o carregamento de idiomas
- **getTranslation**: Testa a obtenção de traduções com fallback
- **setLanguage**: Testa a alteração de idioma
- **initLanguage**: Testa a inicialização do sistema de idiomas
- **localizePage**: Testa a localização da página

## Configuração do Jest

O projeto usa [Jest](https://jestjs.io/) como framework de testes com as seguintes configurações:

- **Ambiente**: `jest-environment-jsdom` (para testes com DOM)
- **Cobertura**: Configurada para arquivos em `js/` (exceto localizações)
- **Timeout**: 10 segundos por teste

## Adicionando Novos Testes

Para adicionar novos testes:

1. Crie um novo arquivo `.test.js` na pasta `__tests__/`
2. Importe as funções a serem testadas
3. Use `describe()` para agrupar testes relacionados
4. Use `test()` ou `it()` para testes individuais
5. Use `beforeEach()` para configurar o estado antes de cada teste

### Exemplo de Teste

```javascript
describe('Minha Função', () => {
  beforeEach(() => {
    // Configurar estado inicial
  });

  test('deve fazer algo', () => {
    // Preparação
    // Execução
    // Verificação
    expect(resultado).toBe(valorEsperado);
  });
});
```

## Boas Práticas

1. **Testes Isolados**: Cada teste deve ser independente
2. **Nomes Descritivos**: Use nomes que descrevam o comportamento esperado
3. **Setup/Teardown**: Use `beforeEach` e `afterEach` para limpar estado
4. **Mocks**: Use mocks para dependências externas (DOM, localStorage, etc.)

## Próximos Passos

1. Adicionar testes para simulação de autômatos
2. Testar funções de renderização SVG
3. Testar interações de UI
4. Aumentar cobertura de código