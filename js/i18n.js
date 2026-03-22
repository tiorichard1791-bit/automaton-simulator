// js/i18n.js
let currentLang = 'pt-BR';
let translations = {};

function loadLanguage(lang) {
    return new Promise((resolve, reject) => {
        if (translations[lang]) {
            resolve(translations[lang]);
            return;
        }
        // Carrega o script do idioma dinamicamente
        const script = document.createElement('script');
        script.src = `js/locales/${lang}.js`;
        script.onload = () => {
            const i18nObj = window[`i18n_${lang.replace('-', '_')}`];
            if (i18nObj) {
                translations[lang] = i18nObj;
                resolve(i18nObj);
            } else {
                reject(new Error(`Idioma ${lang} não encontrado`));
            }
        };
        script.onerror = () => reject(new Error(`Falha ao carregar ${lang}`));
        document.head.appendChild(script);
    });
}

function getTranslation(key) {
    const langObj = translations[currentLang];
    if (langObj && langObj[key] !== undefined) {
        return langObj[key];
    }
    // Fallback para inglês ou a própria chave
    if (currentLang !== 'en-US' && translations['en-US'] && translations['en-US'][key] !== undefined) {
        return translations['en-US'][key];
    }
    return key;
}

async function setLanguage(lang) {
    if (!translations[lang]) {
        try {
            await loadLanguage(lang);
        } catch (e) {
            console.error(e);
            return;
        }
    }
    currentLang = lang;
    localStorage.setItem('automaton-lang', lang);
    await localizePage();
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
}

async function localizePage() {
    const elements = document.querySelectorAll('[data-i18n]');
    for (const el of elements) {
        const key = el.getAttribute('data-i18n');
        const translation = getTranslation(key);
        if (el.tagName === 'INPUT' && el.hasAttribute('placeholder')) {
            el.placeholder = translation;
        } else if (el.tagName === 'OPTION') {
            el.textContent = translation;
        } else {
            el.textContent = translation;
        }
    }
    // Atualiza os placeholders dos selects
    const fromSelect = document.getElementById('transition-from');
    const toSelect = document.getElementById('transition-to');
    if (fromSelect && fromSelect.options[0]) fromSelect.options[0].text = getTranslation('transition_from');
    if (toSelect && toSelect.options[0]) toSelect.options[0].text = getTranslation('transition_to');
    const symbolInput = document.getElementById('transition-symbol');
    if (symbolInput) symbolInput.placeholder = getTranslation('symbol_placeholder');
    const testInput = document.getElementById('simulation-string');
    if (testInput) testInput.placeholder = getTranslation('input_placeholder');
}

async function initLanguage() {
    const savedLang = localStorage.getItem('automaton-lang');
    let detectedLang = savedLang;
    if (!detectedLang) {
        const browserLang = navigator.language || 'pt-BR';
        // Mapeia variantes: es-AR -> es-ES, etc.
        const baseLang = browserLang.split('-')[0];
        if (baseLang === 'es') detectedLang = 'es-ES';
        else if (baseLang === 'en') detectedLang = 'en-US';
        else if (baseLang === 'pt') detectedLang = 'pt-BR';
        else detectedLang = 'pt-BR';
    }
    await setLanguage(detectedLang);
    // Sincroniza o seletor
    const selector = document.getElementById('lang-selector');
    if (selector) selector.value = detectedLang;
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