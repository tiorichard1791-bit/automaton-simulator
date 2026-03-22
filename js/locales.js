// js/locales.js

const locales = {
    'pt-BR': {
        // Cabeçalho
        app_title: '🧠 Autômato Finito Universal',
        app_subtitle: 'AFD / AFND',
        type_badge: '⚙️ Determinístico',
        // Estados
        states_title: '📍 Estados',
        selected_none: 'Nenhum selecionado',
        add_state: '➕ Adicionar',
        set_initial: '⭐ Inicial',
        toggle_final: '🔘 Alternar Final',
        delete_state: '🗑️ Remover',
        rename_placeholder: 'Novo nome',
        rename_btn: '✏️ Renomear',
        selected_prefix: 'Selecionado:',
        initial_indicator: '⭐ Inicial | ',
        final_yes: '🔵 Final',
        final_no: '⚪ Não final',
        // Transições
        transitions_title: '🔗 Transições (δ)',
        add_transition: 'Adicionar',
        epsilon_btn: 'ε (ε)',
        clear_all: 'Limpar todas',
        transition_from: '(origem)',
        transition_to: '(destino)',
        symbol_placeholder: 'símbolo',
        epsilon_symbol: 'ε',
        no_transitions: 'Nenhuma transição',
        transitions_hint: '🔹 Múltiplas transições com mesmo símbolo são permitidas (AFND). 🔹 ε = transição espontânea.',
        // Simulação
        simulation_title: '🎬 Simulação Visual',
        input_placeholder: 'Cadeia de entrada (ex: aabba)',
        auto_run: '▶️ Executar Automático',
        step_init: '🔧 Iniciar Passo a Passo',
        step_next: '⏩ Próximo Símbolo',
        step_reset: '🔄 Reiniciar Passo',
        step_inactive: 'Modo inativo',
        step_afd_prefix: '🔹 AFD - Passo',
        step_afnd_prefix: '🔹 AFND - Passo',
        step_of: '/',
        step_state: 'Estado:',
        step_states: 'Estados:',
        step_symbol_read: 'Símbolo lido:',
        step_arrow: '→',
        step_final: 'estado final',
        step_nonfinal: 'estado não final',
        result_accepted: '✅ ACEITA',
        result_rejected: '❌ REJEITADA',
        error_no_word: '⚠️ Digite uma cadeia.',
        error_no_initial: '❌ Autômato sem estado inicial.',
        error_no_transition: '❌ Erro: sem transição de',
        error_undefined: 'Transição indefinida',
        error_multiple: 'AFND detectado. Use modo passo a passo?',
        final_set: 'Conjunto final:',
        accept_reason_afd: 'Cadeia aceita (estado final).',
        reject_reason_afd: 'Estado final não alcançado.',
        accept_reason_afnd: 'Cadeia aceita (algum estado final alcançado).',
        reject_reason_afnd: 'Nenhum estado final no conjunto atual.',
        // Ações gerais
        arrange_btn: '🔄 Organizar',
        drag_hint: '💡 Arraste os estados para reposicionar',
        confirm_clear: 'Remover todas as transições?',
        alert_select_state: 'Selecione um estado primeiro.',
        alert_from_to: 'Preencha origem e destino.',
        alert_symbol: 'Preencha um símbolo.'
    },
    'en-US': {
        app_title: '🧠 Universal Finite Automaton',
        app_subtitle: 'DFA / NFA',
        type_badge: '⚙️ Deterministic',
        states_title: '📍 States',
        selected_none: 'None selected',
        add_state: '➕ Add State',
        set_initial: '⭐ Set as Initial',
        toggle_final: '🔘 Toggle Final',
        delete_state: '🗑️ Delete',
        rename_placeholder: 'New name',
        rename_btn: '✏️ Rename',
        selected_prefix: 'Selected:',
        initial_indicator: '⭐ Initial | ',
        final_yes: '🔵 Final',
        final_no: '⚪ Not final',
        transitions_title: '🔗 Transitions (δ)',
        add_transition: 'Add',
        epsilon_btn: 'ε (ε)',
        clear_all: 'Clear all',
        transition_from: '(source)',
        transition_to: '(target)',
        symbol_placeholder: 'symbol',
        epsilon_symbol: 'ε',
        no_transitions: 'No transitions',
        transitions_hint: '🔹 Multiple transitions with same symbol allowed (NFA). 🔹 ε = spontaneous transition.',
        simulation_title: '🎬 Visual Simulation',
        input_placeholder: 'Input string (e.g., aabba)',
        auto_run: '▶️ Run Automatically',
        step_init: '🔧 Start Step-by-Step',
        step_next: '⏩ Next Symbol',
        step_reset: '🔄 Reset Step',
        step_inactive: 'Inactive',
        step_afd_prefix: '🔹 DFA - Step',
        step_afnd_prefix: '🔹 NFA - Step',
        step_of: '/',
        step_state: 'State:',
        step_states: 'States:',
        step_symbol_read: 'Symbol read:',
        step_arrow: '→',
        step_final: 'final state',
        step_nonfinal: 'non-final state',
        result_accepted: '✅ ACCEPTED',
        result_rejected: '❌ REJECTED',
        error_no_word: '⚠️ Enter a string.',
        error_no_initial: '❌ Automaton has no initial state.',
        error_no_transition: '❌ Error: no transition from',
        error_undefined: 'Undefined transition',
        error_multiple: 'NFA detected. Use step-by-step mode?',
        final_set: 'Final set:',
        accept_reason_afd: 'String accepted (final state).',
        reject_reason_afd: 'Final state not reached.',
        accept_reason_afnd: 'String accepted (some final state reached).',
        reject_reason_afnd: 'No final state in current set.',
        arrange_btn: '🔄 Arrange',
        drag_hint: '💡 Drag states to reposition',
        confirm_clear: 'Remove all transitions?',
        alert_select_state: 'Please select a state first.',
        alert_from_to: 'Please fill source and target.',
        alert_symbol: 'Please fill a symbol.'
    }
};

let currentLang = 'pt-BR';

function getTranslation(key) {
    return locales[currentLang][key] || key;
}

function setLanguage(lang) {
    if (locales[lang]) {
        currentLang = lang;
        localStorage.setItem('automaton-lang', lang);
        localizePage();
        // Dispara evento para quem escuta (script.js pode reagir se necessário)
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    }
}

function localizePage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translation = getTranslation(key);
        if (el.tagName === 'INPUT' && el.hasAttribute('placeholder')) {
            el.placeholder = translation;
        } else if (el.tagName === 'OPTION') {
            el.textContent = translation;
        } else {
            el.textContent = translation;
        }
    });
    // Atualiza os placeholders dos selects que têm opções fixas
    const fromSelect = document.getElementById('transition-from');
    const toSelect = document.getElementById('transition-to');
    if (fromSelect && fromSelect.options[0]) fromSelect.options[0].text = getTranslation('transition_from');
    if (toSelect && toSelect.options[0]) toSelect.options[0].text = getTranslation('transition_to');
    // Atualizar placeholder do campo de símbolo
    const symbolInput = document.getElementById('transition-symbol');
    if (symbolInput) symbolInput.placeholder = getTranslation('symbol_placeholder');
    // Atualizar placeholder do campo de teste
    const testInput = document.getElementById('simulation-string');
    if (testInput) testInput.placeholder = getTranslation('input_placeholder');
}

function initLanguage() {
    const savedLang = localStorage.getItem('automaton-lang');
    if (savedLang && locales[savedLang]) {
        currentLang = savedLang;
    } else {
        const browserLang = navigator.language || 'pt-BR';
        if (locales[browserLang]) currentLang = browserLang;
        else if (locales[browserLang.split('-')[0]]) currentLang = browserLang.split('-')[0];
        else currentLang = 'pt-BR';
    }
    localizePage();
    // Sincroniza o seletor
    const selector = document.getElementById('lang-selector');
    if (selector) selector.value = currentLang;
}

// Expor funções globalmente
window.i18n = {
    get: getTranslation,
    setLanguage: setLanguage,
    init: initLanguage
};

// Inicialização automática
document.addEventListener('DOMContentLoaded', () => {
    window.i18n.init();
    const selector = document.getElementById('lang-selector');
    if (selector) {
        selector.addEventListener('change', (e) => {
            window.i18n.setLanguage(e.target.value);
        });
    }
});