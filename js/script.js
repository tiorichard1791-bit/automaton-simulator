// js/script.js

// ---------- ESTRUTURA DE DADOS AFND (universal) ----------
let states = [];            // { id, name, x, y, final }
let initialStateId = null;
// Transições: Map com chave "from|symbol" -> Set de ids de destino
let transitionMap = new Map();

let selectedStateId = null;
let nextId = 2;

// Controle para simulação passo a passo
let stepModeActive = false;
let stepString = "";
let stepCurrentSet = new Set();   // conjunto de estados atuais (AFND)
let stepCurrentStateId = null;    // estado atual (AFD)
let stepIndex = 0;
let stepTotalSteps = 0;

// Controle para animação automática
let animationTimeout = null;

const RADIUS = 32;
const SVG_NS = "http://www.w3.org/2000/svg";
const svg = document.getElementById("automaton-svg");

// Elementos DOM
const transitionsListDiv = document.getElementById("transitions-list");
const selectedInfoSpan = document.getElementById("selected-state-info");
const transitionFromSelect = document.getElementById("transition-from");
const transitionToSelect = document.getElementById("transition-to");
const addStateBtn = document.getElementById("add-state-btn");
const setInitialBtn = document.getElementById("set-initial-btn");
const toggleFinalBtn = document.getElementById("toggle-final-btn");
const deleteStateBtn = document.getElementById("delete-state-btn");
const renameStateInput = document.getElementById("rename-state-input");
const renameStateBtn = document.getElementById("rename-state-btn");
const clearTransitionsBtn = document.getElementById("clear-transitions-btn");
const autoArrangeBtn = document.getElementById("auto-arrange-btn");
const addEpsilonBtn = document.getElementById("add-epsilon-btn");
const automatonTypeBadge = document.getElementById("automaton-type-badge");

const simulationStringInput = document.getElementById("simulation-string");
const visualRunBtn = document.getElementById("visual-run-btn");
const stepInitBtn = document.getElementById("step-init-btn");
const stepNextBtn = document.getElementById("step-next-btn");
const stepResetBtn = document.getElementById("step-reset-btn");
const stepStatusDiv = document.getElementById("step-status");
const visualResultDiv = document.getElementById("visual-result");

// ---------- FUNÇÕES AUXILIARES ----------
function updateTypeBadge() {
    let isNondeterministic = false;
    for (let [key, destSet] of transitionMap.entries()) {
        if (key.endsWith("|ε")) {
            isNondeterministic = true;
            break;
        }
        if (destSet.size > 1) {
            isNondeterministic = true;
            break;
        }
    }
    automatonTypeBadge.textContent = isNondeterministic ? "🔀 Não Determinístico (AFND)" : "⚙️ Determinístico (AFD)";
    automatonTypeBadge.style.background = isNondeterministic ? "#fef9c3" : "#eef2ff";
    automatonTypeBadge.style.color = isNondeterministic ? "#854d0e" : "#2563eb";
}

function updateSelectors() {
    const options = states.map(s => `<option value="${s.id}">${s.name}</option>`).join("");
    transitionFromSelect.innerHTML = `<option value="">(origem)</option>${options}`;
    transitionToSelect.innerHTML = `<option value="">(destino)</option>${options}`;
}

function getAllTransitionsAsArray() {
    let arr = [];
    for (let [key, destSet] of transitionMap.entries()) {
        const [from, symbol] = key.split('|');
        for (let to of destSet) {
            arr.push({ from, symbol, to });
        }
    }
    return arr;
}

function updateTransitionsUI() {
    const allTrans = getAllTransitionsAsArray();
    if (allTrans.length === 0) {
        transitionsListDiv.innerHTML = "<div style='text-align:center; padding:10px; color:gray'>Nenhuma transição</div>";
        return;
    }
    transitionsListDiv.innerHTML = allTrans.map((t, idx) => {
        const fromState = states.find(s => s.id === t.from);
        const toState = states.find(s => s.id === t.to);
        const fromName = fromState ? fromState.name : "?";
        const toName = toState ? toState.name : "?";
        const symbolDisplay = t.symbol === "ε" ? "ε" : t.symbol;
        return `<div class="transition-row">
                    <span><strong>${fromName}</strong> —${symbolDisplay}→ <strong>${toName}</strong></span>
                    <button class="del-trans-btn" data-from="${t.from}" data-symbol="${t.symbol}" data-to="${t.to}" style="background:#fee2e2; padding:4px 10px;">❌</button>
                </div>`;
    }).join("");
    document.querySelectorAll('.del-trans-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const from = btn.getAttribute('data-from');
            const symbol = btn.getAttribute('data-symbol');
            const to = btn.getAttribute('data-to');
            removeTransition(from, symbol, to);
        });
    });
}

function removeTransition(from, symbol, to) {
    const key = `${from}|${symbol}`;
    if (transitionMap.has(key)) {
        const set = transitionMap.get(key);
        set.delete(to);
        if (set.size === 0) transitionMap.delete(key);
    }
    updateTransitionsUI();
    updateSVG();
    updateSelectors();
    updateTypeBadge();
    stopAnySimulation();
}

function addTransition(from, symbol, to) {
    if (!from || !to) {
        alert("Selecione origem e destino.");
        return false;
    }
    if (symbol === "") symbol = "ε";
    const key = `${from}|${symbol}`;
    if (!transitionMap.has(key)) {
        transitionMap.set(key, new Set());
    }
    transitionMap.get(key).add(to);
    updateTransitionsUI();
    updateSVG();
    updateSelectors();
    updateTypeBadge();
    stopAnySimulation();
    return true;
}

function removeState(stateId) {
    const idx = states.findIndex(s => s.id === stateId);
    if (idx === -1) return;
    // Remove transições que envolvem este estado
    for (let [key, destSet] of transitionMap.entries()) {
        const [from, symbol] = key.split('|');
        if (from === stateId) {
            transitionMap.delete(key);
            continue;
        }
        if (destSet.has(stateId)) {
            destSet.delete(stateId);
            if (destSet.size === 0) transitionMap.delete(key);
        }
    }
    if (initialStateId === stateId) initialStateId = states.length > 1 ? states[0]?.id : null;
    states.splice(idx, 1);
    if (selectedStateId === stateId) selectedStateId = null;
    if (states.length === 0) initialStateId = null;
    updateSelectors();
    updateTransitionsUI();
    updateSVG();
    updateSelectedInfo();
    updateTypeBadge();
    stopAnySimulation();
}

function toggleFinal(stateId) {
    const st = states.find(s => s.id === stateId);
    if (st) st.final = !st.final;
    updateSVG();
    updateSelectedInfo();
    stopAnySimulation();
}

function setInitial(stateId) {
    initialStateId = stateId;
    updateSVG();
    updateSelectedInfo();
    stopAnySimulation();
}

function renameState(stateId, newName) {
    if (!newName.trim()) return;
    const st = states.find(s => s.id === stateId);
    if (st) st.name = newName.trim();
    updateSelectors();
    updateSVG();
    updateSelectedInfo();
    updateTransitionsUI();
    stopAnySimulation();
}

function addState() {
    const newId = `q${nextId++}`;
    let newX = 250 + (states.length % 5) * 45;
    let newY = 220 + (Math.floor(states.length / 3) * 55);
    newX = Math.min(800, Math.max(70, newX));
    newY = Math.min(470, Math.max(70, newY));
    states.push({ id: newId, name: newId, x: newX, y: newY, final: false });
    if (states.length === 1 && !initialStateId) initialStateId = newId;
    updateSelectors();
    updateTransitionsUI();
    updateSVG();
    updateTypeBadge();
    stopAnySimulation();
}

function autoArrange() {
    const centerX = 450, centerY = 270;
    const rad = Math.min(180, states.length * 20);
    states.forEach((state, idx) => {
        const angle = (idx / states.length) * 2 * Math.PI;
        state.x = centerX + rad * Math.cos(angle);
        state.y = centerY + rad * Math.sin(angle);
    });
    updateSVG();
    stopAnySimulation();
}

// ---------- SIMULAÇÃO AFND (conjunto de estados + ε-fechamento) ----------
function epsilonClosure(stateSet) {
    let closure = new Set(stateSet);
    let stack = [...stateSet];
    while (stack.length) {
        const current = stack.pop();
        const keyEps = `${current}|ε`;
        if (transitionMap.has(keyEps)) {
            for (let next of transitionMap.get(keyEps)) {
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
        if (transitionMap.has(key)) {
            for (let dest of transitionMap.get(key)) {
                result.add(dest);
            }
        }
    }
    return result;
}

function simulateAFND(inputString) {
    if (!initialStateId) return { accepted: false, reason: "Sem estado inicial." };
    let currentSet = epsilonClosure(new Set([initialStateId]));
    for (let i = 0; i < inputString.length; i++) {
        const ch = inputString[i];
        const nextSet = move(currentSet, ch);
        currentSet = epsilonClosure(nextSet);
        if (currentSet.size === 0) {
            return { accepted: false, reason: `Sem transição para '${ch}' a partir dos estados ativos.` };
        }
    }
    const accepted = Array.from(currentSet).some(id => states.find(s => s.id === id)?.final === true);
    return { accepted, reason: accepted ? "Cadeia aceita (algum estado final alcançado)." : "Nenhum estado final no conjunto atual." };
}

function simulateAFD(inputString) {
    if (!initialStateId) return { accepted: false, reason: "Sem estado inicial." };
    let current = initialStateId;
    for (let i = 0; i < inputString.length; i++) {
        const ch = inputString[i];
        const key = `${current}|${ch}`;
        if (!transitionMap.has(key) || transitionMap.get(key).size === 0) {
            return { accepted: false, reason: `Transição indefinida de ${states.find(s=>s.id===current)?.name} com '${ch}'.` };
        }
        if (transitionMap.get(key).size > 1) {
            return { accepted: false, reason: `Não determinismo encontrado (múltiplos destinos).` };
        }
        current = Array.from(transitionMap.get(key))[0];
    }
    const isFinal = states.find(s => s.id === current)?.final === true;
    return { accepted: isFinal, reason: isFinal ? "Cadeia aceita (estado final)." : "Estado final não alcançado." };
}

function isDeterministic() {
    for (let [key, destSet] of transitionMap.entries()) {
        if (key.endsWith("|ε")) return false;
        if (destSet.size > 1) return false;
    }
    const perStateSymbol = new Map();
    for (let [key, destSet] of transitionMap.entries()) {
        const [from, symbol] = key.split('|');
        const stateSymbolKey = `${from}|${symbol}`;
        if (perStateSymbol.has(stateSymbolKey)) return false;
        perStateSymbol.set(stateSymbolKey, true);
    }
    return true;
}

function simulate(inputString) {
    if (isDeterministic()) {
        return simulateAFD(inputString);
    } else {
        return simulateAFND(inputString);
    }
}

// ---------- SIMULAÇÃO VISUAL (automática) ----------
let highlightStateId = null;
let highlightStateSet = null;
let highlightTransition = null;
let highlightTransitionSet = null;

async function runVisualSimulation() {
    stopAnySimulation();
    const word = simulationStringInput.value.trim();
    if (!word) {
        visualResultDiv.innerHTML = "<div class='result rejected'>⚠️ Digite uma cadeia.</div>";
        return;
    }
    if (!initialStateId || states.length === 0) {
        visualResultDiv.innerHTML = "<div class='result rejected'>❌ Autômato sem estado inicial.</div>";
        return;
    }

    const deterministic = isDeterministic();
    if (deterministic) {
        let current = initialStateId;
        const steps = [];
        for (let i = 0; i < word.length; i++) {
            const ch = word[i];
            const key = `${current}|${ch}`;
            if (!transitionMap.has(key) || transitionMap.get(key).size === 0) {
                visualResultDiv.innerHTML = `<div class='result rejected'>❌ Erro: sem transição de ${states.find(s=>s.id===current)?.name} com '${ch}'</div>`;
                return;
            }
            const next = Array.from(transitionMap.get(key))[0];
            steps.push({ from: current, to: next, symbol: ch });
            current = next;
        }
        const finalState = current;
        const isAccepted = states.find(s => s.id === finalState)?.final === true;

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            await new Promise(resolve => {
                setTimeout(() => {
                    highlightStateId = step.from;
                    highlightTransition = { from: step.from, to: step.to, symbol: step.symbol };
                    updateSVG();
                    resolve();
                }, i * 800);
            });
        }
        await new Promise(resolve => {
            setTimeout(() => {
                highlightStateId = finalState;
                highlightTransition = null;
                updateSVG();
                visualResultDiv.innerHTML = `<div class="result ${isAccepted ? 'accepted' : 'rejected'}">
                    ${isAccepted ? '✅ ACEITA' : '❌ REJEITADA'} "${word}"<br>
                    Último estado: ${states.find(s=>s.id===finalState)?.name} ${isAccepted ? '(final)' : '(não final)'}
                </div>`;
                resolve();
            }, steps.length * 800);
        });
        setTimeout(() => {
            if (!stepModeActive) {
                highlightStateId = null;
                highlightTransition = null;
                updateSVG();
            }
        }, 2000);
    } else {
        let currentSet = epsilonClosure(new Set([initialStateId]));
        const steps = [{ set: new Set(currentSet), symbol: null }];
        for (let i = 0; i < word.length; i++) {
            const ch = word[i];
            const nextSet = move(currentSet, ch);
            currentSet = epsilonClosure(nextSet);
            steps.push({ set: new Set(currentSet), symbol: ch });
            if (currentSet.size === 0) break;
        }
        const finalSet = currentSet;
        const isAccepted = Array.from(finalSet).some(id => states.find(s => s.id === id)?.final === true);

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            await new Promise(resolve => {
                setTimeout(() => {
                    highlightStateSet = step.set;
                    if (step.symbol && i > 0) {
                        highlightTransitionSet = new Set();
                        const prevSet = steps[i-1].set;
                        for (let s of prevSet) {
                            const key = `${s}|${step.symbol}`;
                            if (transitionMap.has(key)) {
                                for (let t of transitionMap.get(key)) {
                                    highlightTransitionSet.add(`${s}|${t}|${step.symbol}`);
                                }
                            }
                        }
                    } else {
                        highlightTransitionSet = null;
                    }
                    updateSVG();
                    resolve();
                }, i * 1000);
            });
        }
        await new Promise(resolve => {
            setTimeout(() => {
                visualResultDiv.innerHTML = `<div class="result ${isAccepted ? 'accepted' : 'rejected'}">
                    ${isAccepted ? '✅ ACEITA' : '❌ REJEITADA'} "${word}"<br>
                    Conjunto final: {${Array.from(finalSet).map(id=>states.find(s=>s.id===id)?.name).join(', ')}}
                </div>`;
                resolve();
            }, steps.length * 1000);
        });
        setTimeout(() => {
            if (!stepModeActive) {
                highlightStateSet = null;
                highlightTransitionSet = null;
                updateSVG();
            }
        }, 2000);
    }
}

// ---------- MODO PASSO A PASSO (unificado) ----------
function initStepByStep() {
    stopAnySimulation();
    const word = simulationStringInput.value.trim();
    if (!word) {
        visualResultDiv.innerHTML = "<div class='result rejected'>⚠️ Digite uma cadeia para o passo a passo.</div>";
        return;
    }
    if (!initialStateId) {
        visualResultDiv.innerHTML = "<div class='result rejected'>❌ Defina um estado inicial.</div>";
        return;
    }

    stepString = word;
    stepIndex = 0;
    stepTotalSteps = word.length;
    stepModeActive = true;

    const deterministic = isDeterministic();
    if (deterministic) {
        stepCurrentStateId = initialStateId;
        highlightStateId = stepCurrentStateId;
        highlightStateSet = null;
        stepStatusDiv.innerHTML = `🔹 AFD - Passo 0 / ${stepTotalSteps} | Estado: ${states.find(s=>s.id===stepCurrentStateId)?.name}`;
    } else {
        stepCurrentSet = epsilonClosure(new Set([initialStateId]));
        highlightStateSet = stepCurrentSet;
        highlightStateId = null;
        stepStatusDiv.innerHTML = `🔹 AFND - Passo 0 / ${stepTotalSteps} | Estados: {${Array.from(stepCurrentSet).map(id=>states.find(s=>s.id===id)?.name).join(', ')}}`;
    }

    stepNextBtn.disabled = false;
    stepResetBtn.disabled = false;
    visualResultDiv.innerHTML = "";
    updateSVG();
}

function stepNext() {
    if (!stepModeActive) return;
    const deterministic = isDeterministic();
    if (deterministic) {
        if (stepIndex >= stepTotalSteps) {
            const isFinal = states.find(s => s.id === stepCurrentStateId)?.final === true;
            visualResultDiv.innerHTML = `<div class="result ${isFinal ? 'accepted' : 'rejected'}">
                ${isFinal ? '✅ ACEITA' : '❌ REJEITADA'} "${stepString}"<br>
                Estado final: ${states.find(s=>s.id===stepCurrentStateId)?.name} ${isFinal ? '(final)' : '(não final)'}
            </div>`;
            stepNextBtn.disabled = true;
            stepModeActive = false;
            highlightStateId = null;
            updateSVG();
            stepStatusDiv.innerHTML = "Simulação concluída.";
            return;
        }

        const ch = stepString[stepIndex];
        const key = `${stepCurrentStateId}|${ch}`;
        if (!transitionMap.has(key) || transitionMap.get(key).size === 0) {
            visualResultDiv.innerHTML = `<div class="result rejected">❌ Transição indefinida: ${states.find(s=>s.id===stepCurrentStateId)?.name} com '${ch}'</div>`;
            stepModeActive = false;
            stepNextBtn.disabled = true;
            stepResetBtn.disabled = true;
            highlightStateId = null;
            updateSVG();
            stepStatusDiv.innerHTML = "Erro - transição não encontrada.";
            return;
        }
        if (transitionMap.get(key).size > 1) {
            visualResultDiv.innerHTML = `<div class="result rejected">❌ AFND detectado. Use modo passo a passo para AFND? (reinicie)</div>`;
            stepModeActive = false;
            stepNextBtn.disabled = true;
            stepResetBtn.disabled = true;
            return;
        }
        const nextState = Array.from(transitionMap.get(key))[0];
        highlightTransition = { from: stepCurrentStateId, to: nextState, symbol: ch };
        updateSVG();
        setTimeout(() => {
            if (!stepModeActive) return;
            stepCurrentStateId = nextState;
            stepIndex++;
            highlightStateId = stepCurrentStateId;
            highlightTransition = null;
            updateSVG();
            stepStatusDiv.innerHTML = `🔹 AFD - Passo ${stepIndex} / ${stepTotalSteps} | Símbolo '${ch}' → estado: ${states.find(s=>s.id===stepCurrentStateId)?.name}`;
            if (stepIndex === stepTotalSteps) {
                const isFinal = states.find(s => s.id === stepCurrentStateId)?.final === true;
                visualResultDiv.innerHTML = `<div class="result ${isFinal ? 'accepted' : 'rejected'}">
                    ${isFinal ? '✅ ACEITA' : '❌ REJEITADA'} "${stepString}"<br>
                    Estado final: ${states.find(s=>s.id===stepCurrentStateId)?.name} ${isFinal ? '(final)' : '(não final)'}
                </div>`;
                stepNextBtn.disabled = true;
                stepModeActive = false;
                stepStatusDiv.innerHTML = "Fim da cadeia.";
            }
        }, 500);
    } else {
        if (stepIndex >= stepTotalSteps) {
            const isAccepted = Array.from(stepCurrentSet).some(id => states.find(s => s.id === id)?.final === true);
            visualResultDiv.innerHTML = `<div class="result ${isAccepted ? 'accepted' : 'rejected'}">
                ${isAccepted ? '✅ ACEITA' : '❌ REJEITADA'} "${stepString}"<br>
                Conjunto final: {${Array.from(stepCurrentSet).map(id=>states.find(s=>s.id===id)?.name).join(', ')}}
            </div>`;
            stepNextBtn.disabled = true;
            stepModeActive = false;
            highlightStateSet = null;
            updateSVG();
            stepStatusDiv.innerHTML = "Simulação concluída.";
            return;
        }

        const ch = stepString[stepIndex];
        const nextSet = move(stepCurrentSet, ch);
        const newSet = epsilonClosure(nextSet);
        if (newSet.size === 0) {
            visualResultDiv.innerHTML = `<div class="result rejected">❌ Sem transição para '${ch}' a partir dos estados ativos.</div>`;
            stepModeActive = false;
            stepNextBtn.disabled = true;
            stepResetBtn.disabled = true;
            highlightStateSet = null;
            updateSVG();
            return;
        }
        highlightTransitionSet = new Set();
        for (let s of stepCurrentSet) {
            const key = `${s}|${ch}`;
            if (transitionMap.has(key)) {
                for (let t of transitionMap.get(key)) {
                    highlightTransitionSet.add(`${s}|${t}|${ch}`);
                }
            }
        }
        updateSVG();
        setTimeout(() => {
            if (!stepModeActive) return;
            stepCurrentSet = newSet;
            stepIndex++;
            highlightStateSet = stepCurrentSet;
            highlightTransitionSet = null;
            updateSVG();
            stepStatusDiv.innerHTML = `🔹 AFND - Passo ${stepIndex} / ${stepTotalSteps} | Símbolo '${ch}' → estados: {${Array.from(stepCurrentSet).map(id=>states.find(s=>s.id===id)?.name).join(', ')}}`;
            if (stepIndex === stepTotalSteps) {
                const isAccepted = Array.from(stepCurrentSet).some(id => states.find(s => s.id === id)?.final === true);
                visualResultDiv.innerHTML = `<div class="result ${isAccepted ? 'accepted' : 'rejected'}">
                    ${isAccepted ? '✅ ACEITA' : '❌ REJEITADA'} "${stepString}"<br>
                    Conjunto final: {${Array.from(stepCurrentSet).map(id=>states.find(s=>s.id===id)?.name).join(', ')}}
                </div>`;
                stepNextBtn.disabled = true;
                stepModeActive = false;
                stepStatusDiv.innerHTML = "Fim da cadeia.";
            }
        }, 500);
    }
}

function resetStepByStep() {
    if (!stepModeActive && stepString === "") return;
    stepModeActive = false;
    initStepByStep();
}

function stopAnySimulation() {
    if (animationTimeout) {
        clearTimeout(animationTimeout);
        animationTimeout = null;
    }
    if (stepModeActive) {
        stepModeActive = false;
        stepNextBtn.disabled = true;
        stepResetBtn.disabled = true;
        stepStatusDiv.innerHTML = "Modo inativo";
    }
    highlightStateId = null;
    highlightStateSet = null;
    highlightTransition = null;
    highlightTransitionSet = null;
    updateSVG();
}

// ---------- DESENHO SVG ----------
function updateSVG() {
    svg.innerHTML = "";

    const defs = document.createElementNS(SVG_NS, "defs");
    const marker = document.createElementNS(SVG_NS, "marker");
    marker.setAttribute("id", "arrowhead");
    marker.setAttribute("markerWidth", "8");
    marker.setAttribute("markerHeight", "8");
    marker.setAttribute("refX", "7");
    marker.setAttribute("refY", "4");
    marker.setAttribute("orient", "auto");
    const polygon = document.createElementNS(SVG_NS, "polygon");
    polygon.setAttribute("points", "0 0, 8 4, 0 8");
    polygon.setAttribute("fill", "#2c3e66");
    marker.appendChild(polygon);
    defs.appendChild(marker);
    svg.appendChild(defs);

    const edgeMap = new Map();
    for (let [key, destSet] of transitionMap.entries()) {
        const [from, symbol] = key.split('|');
        for (let to of destSet) {
            const edgeKey = `${from}|${to}`;
            if (!edgeMap.has(edgeKey)) edgeMap.set(edgeKey, { from, to, symbols: [] });
            edgeMap.get(edgeKey).symbols.push(symbol);
        }
    }

    edgeMap.forEach(edge => {
        const fromState = states.find(s => s.id === edge.from);
        const toState = states.find(s => s.id === edge.to);
        if (!fromState || !toState) return;
        const start = { x: fromState.x, y: fromState.y };
        const end = { x: toState.x, y: toState.y };
        const dx = end.x - start.x, dy = end.y - start.y;
        const angle = Math.atan2(dy, dx);
        const startX = start.x + RADIUS * Math.cos(angle);
        const startY = start.y + RADIUS * Math.sin(angle);
        const endX = end.x - RADIUS * Math.cos(angle);
        const endY = end.y - RADIUS * Math.sin(angle);

        const hasReverse = edgeMap.has(`${edge.to}|${edge.from}`);
        let pathD = "";
        let midX, midY;
        if (hasReverse) {
            const cpX = (start.x + end.x) / 2 + (dy * 0.45);
            const cpY = (start.y + end.y) / 2 - (dx * 0.45);
            pathD = `M ${startX} ${startY} Q ${cpX} ${cpY} ${endX} ${endY}`;
            midX = cpX; midY = cpY;
        } else {
            pathD = `M ${startX} ${startY} L ${endX} ${endY}`;
            midX = (startX + endX) / 2;
            midY = (startY + endY) / 2;
        }

        let isHighlight = false;
        if (highlightTransition) {
            if (edge.from === highlightTransition.from && edge.to === highlightTransition.to &&
                edge.symbols.includes(highlightTransition.symbol)) {
                isHighlight = true;
            }
        }
        if (highlightTransitionSet) {
            for (let sym of edge.symbols) {
                if (highlightTransitionSet.has(`${edge.from}|${edge.to}|${sym}`)) {
                    isHighlight = true;
                    break;
                }
            }
        }

        const path = document.createElementNS(SVG_NS, "path");
        path.setAttribute("d", pathD);
        path.setAttribute("stroke", isHighlight ? "#f97316" : "#4b5563");
        path.setAttribute("stroke-width", isHighlight ? "4" : "2.2");
        path.setAttribute("fill", "none");
        path.setAttribute("marker-end", "url(#arrowhead)");
        svg.appendChild(path);

        const labelText = edge.symbols.map(s => s === "ε" ? "ε" : s).join(",");
        const textElem = document.createElementNS(SVG_NS, "text");
        textElem.setAttribute("x", midX);
        textElem.setAttribute("y", midY - 5);
        textElem.setAttribute("fill", isHighlight ? "#f97316" : "#0f172a");
        textElem.setAttribute("font-size", "14");
        textElem.setAttribute("font-weight", "bold");
        textElem.setAttribute("stroke", "white");
        textElem.setAttribute("stroke-width", "1.2");
        textElem.setAttribute("paint-order", "stroke");
        textElem.textContent = labelText;
        svg.appendChild(textElem);
    });

    states.forEach(state => {
        const group = document.createElementNS(SVG_NS, "g");
        const isHighlight = (highlightStateId === state.id) || (highlightStateSet && highlightStateSet.has(state.id));
        const circle = document.createElementNS(SVG_NS, "circle");
        circle.setAttribute("cx", state.x);
        circle.setAttribute("cy", state.y);
        circle.setAttribute("r", RADIUS);
        circle.setAttribute("fill", isHighlight ? "#ffe6c7" : (selectedStateId === state.id ? "#fffaec" : "#f8fafc"));
        circle.setAttribute("stroke", isHighlight ? "#ff8c00" : (selectedStateId === state.id ? "#f97316" : "#1e40af"));
        circle.setAttribute("stroke-width", isHighlight ? "4" : (selectedStateId === state.id ? "3.5" : "2"));
        circle.setAttribute("cursor", "pointer");
        circle.addEventListener("click", (e) => {
            e.stopPropagation();
            selectedStateId = state.id;
            updateSVG();
            updateSelectedInfo();
            stopAnySimulation();
        });
        makeDraggable(circle, state);
        group.appendChild(circle);

        if (state.final) {
            const innerCircle = document.createElementNS(SVG_NS, "circle");
            innerCircle.setAttribute("cx", state.x);
            innerCircle.setAttribute("cy", state.y);
            innerCircle.setAttribute("r", RADIUS-7);
            innerCircle.setAttribute("fill", "none");
            innerCircle.setAttribute("stroke", "#0f3b5c");
            innerCircle.setAttribute("stroke-width", "2.5");
            group.appendChild(innerCircle);
        }

        const text = document.createElementNS(SVG_NS, "text");
        text.setAttribute("x", state.x);
        text.setAttribute("y", state.y + 6);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("font-weight", "bold");
        text.setAttribute("fill", "#1e293b");
        text.setAttribute("font-size", "15");
        text.textContent = state.name;
        group.appendChild(text);

        if (initialStateId === state.id) {
            const arrowStartX = state.x - RADIUS - 12;
            const arrowStartY = state.y - 5;
            const arrowEndX = state.x - RADIUS + 4;
            const arrowEndY = state.y;
            const arrowPath = document.createElementNS(SVG_NS, "path");
            arrowPath.setAttribute("d", `M ${arrowStartX} ${arrowStartY} L ${arrowEndX} ${arrowEndY} L ${arrowStartX} ${arrowEndY+10} Z`);
            arrowPath.setAttribute("fill", "#2b6e4e");
            group.appendChild(arrowPath);
            const line = document.createElementNS(SVG_NS, "line");
            line.setAttribute("x1", arrowStartX+2);
            line.setAttribute("y1", arrowStartY+2);
            line.setAttribute("x2", arrowEndX);
            line.setAttribute("y2", arrowEndY);
            line.setAttribute("stroke", "#2b6e4e");
            line.setAttribute("stroke-width", "2");
            group.appendChild(line);
        }
        svg.appendChild(group);
    });
}

function makeDraggable(element, state) {
    let isDragging = false;
    let startMouse = { x: 0, y: 0 };
    let startPos = { x: state.x, y: state.y };
    element.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        isDragging = true;
        startMouse.x = e.clientX;
        startMouse.y = e.clientY;
        startPos.x = state.x;
        startPos.y = state.y;
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    });
    function onMouseMove(e) {
        if (!isDragging) return;
        const dx = e.clientX - startMouse.x;
        const dy = e.clientY - startMouse.y;
        let newX = startPos.x + dx;
        let newY = startPos.y + dy;
        newX = Math.min(860, Math.max(40, newX));
        newY = Math.min(510, Math.max(40, newY));
        state.x = newX;
        state.y = newY;
        updateSVG();
    }
    function onMouseUp() {
        isDragging = false;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        stopAnySimulation();
    }
}

function updateSelectedInfo() {
    if (selectedStateId) {
        const st = states.find(s => s.id === selectedStateId);
        if (st) {
            const inicialMark = (initialStateId === st.id) ? "⭐ Inicial | " : "";
            const finalMark = st.final ? "🔵 Final" : "⚪ Não final";
            selectedInfoSpan.innerHTML = `Selecionado: <strong>${st.name}</strong> (${inicialMark}${finalMark})`;
            renameStateInput.value = st.name;
            return;
        }
    }
    selectedInfoSpan.innerHTML = "Nenhum estado selecionado";
    renameStateInput.value = "";
}

// ---------- EVENTOS ----------
addStateBtn.onclick = () => addState();
setInitialBtn.onclick = () => { if(selectedStateId) setInitial(selectedStateId); else alert("Selecione um estado."); };
toggleFinalBtn.onclick = () => { if(selectedStateId) toggleFinal(selectedStateId); else alert("Selecione um estado."); };
deleteStateBtn.onclick = () => { if(selectedStateId) removeState(selectedStateId); selectedStateId = null; updateSelectedInfo(); };
renameStateBtn.onclick = () => { if(selectedStateId) renameState(selectedStateId, renameStateInput.value); };
clearTransitionsBtn.onclick = () => { if(confirm("Remover todas as transições?")) { transitionMap.clear(); updateTransitionsUI(); updateSVG(); updateSelectors(); updateTypeBadge(); stopAnySimulation(); } };
autoArrangeBtn.onclick = () => autoArrange();
addEpsilonBtn.onclick = () => {
    const from = transitionFromSelect.value;
    const to = transitionToSelect.value;
    if (!from || !to) alert("Selecione origem e destino.");
    else addTransition(from, "ε", to);
};
document.getElementById("add-transition-btn").onclick = () => {
    const from = transitionFromSelect.value;
    const to = transitionToSelect.value;
    let sym = document.getElementById("transition-symbol").value.trim();
    if (!from || !to) alert("Preencha origem e destino.");
    else addTransition(from, sym, to);
};
visualRunBtn.onclick = () => runVisualSimulation();
stepInitBtn.onclick = () => initStepByStep();
stepNextBtn.onclick = () => stepNext();
stepResetBtn.onclick = () => resetStepByStep();

// Inicialização com exemplo AFD (termina com 'a')
function initExample() {
    states = [];
    nextId = 2;
    states.push({ id: "q0", name: "q0", x: 300, y: 200, final: false });
    states.push({ id: "q1", name: "q1", x: 550, y: 200, final: true });
    initialStateId = "q0";
    transitionMap.clear();
    addTransition("q0", "a", "q1");
    addTransition("q0", "b", "q0");
    addTransition("q1", "a", "q1");
    addTransition("q1", "b", "q0");
    selectedStateId = null;
    updateSelectors();
    updateTransitionsUI();
    updateSVG();
    updateSelectedInfo();
    updateTypeBadge();
}
initExample();