/**
 * Configuração do Jest para o projeto automaton-simulator
 */

module.exports = {
  // Ambiente de teste
  testEnvironment: 'jest-environment-jsdom',
  
  // Diretórios onde os testes estão localizados
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // Diretórios a serem ignorados
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/'
  ],
  
  // Configurações de cobertura de código
  collectCoverage: false,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'js/**/*.js',
    '!js/locales/**/*.js' // Excluir arquivos de localização
  ],
  
  // Configurações de transformação
  transform: {},
  
  // Configurações de módulos
  moduleNameMapper: {
    // Mapear imports se necessário no futuro
  },
  
  // Configurações de setup
  setupFilesAfterEnv: [],
  
  // Verbosidade
  verbose: true,
  
  // Timeout para testes
  testTimeout: 10000,
};