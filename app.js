/**
 * PSAT 던전 - 메인 애플리케이션
 * @version 1.0.0
 */

// ===== GLOBAL STATE =====
let allQuestions = [];
let questionSets = [];
let currentSet = null;
let currentDungeonType = 'regular';
let currentQuestions = [];
let currentIndex = 0;
let questionTimer = 0;
let totalTimer = 0;
let timerInterval = null;
let isPaused = false;
let battleResults = [];
let settings = {
    questionCount: 30,
    timerWarning: 90
};

// ===== PWA INSTALL PROMPT =====
let deferredInstallPrompt = null;

// ===== ENTRANCE BGM (HOME SCREEN) =====
let entranceBGM = null;
let bgmUnlocked = false;

// ===== LOCAL STORAGE KEYS =====
const STORAGE_KEYS = {
    QUESTION_STATS: 'psat_question_stats',
    BATTLE_HISTORY: 'psat_battle_history',
    FEEDBACKS: 'psat_feedbacks',
    NOTES: 'psat_notes',
    SETTINGS: 'psat_settings',
    UI_STATE: 'psat_ui_state'
};

// ===== INIT =====
async function init() {
    loadSettings();
    await loadQuestions();
    initQuestionSets();
    migrateStoredDataToCurrentQuestionBank();
    updateWeaknessDungeon();
    initEventListeners();
    setupInstallPrompt();
    initEntranceBGM();
    registerServiceWorker();

    // Restore last selected dungeon background (optional, but makes the UI feel consistent).
    const uiState = JSON.parse(localStorage.getItem(STORAGE_KEYS.UI_STATE) || '{}');
    if (uiState?.lastDungeonType) {
        applyDungeonRoomBackground(uiState.lastDungeonType);
    }
}

// ===== DUNGEON ROOM BACKGROUND (PERSISTENT) =====
function applyDungeonRoomBackground(type) {
    const safeType = (type === 'weakness') ? 'weakness' : 'regular';
    const battle = document.getElementById('battle-screen');
    const setSelect = document.getElementById('set-select-screen');
    if (battle) battle.dataset.dungeon = safeType;
    if (setSelect) setSelect.dataset.dungeon = safeType;

    localStorage.setItem(STORAGE_KEYS.UI_STATE, JSON.stringify({ lastDungeonType: safeType }));
}

async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        allQuestions = await response.json();
        
        // Clean question text
        allQuestions = allQuestions.map(q => ({
            ...q,
            stem: cleanQuestionText(q.stem),
            options: q.options.map(opt => cleanOptionText(opt))
        }));
        
        console.log(`Loaded ${allQuestions.length} questions`);
    } catch (e) {
        console.error('Failed to load questions:', e);
        allQuestions = [];
    }
}

function cleanQuestionText(text) {
    return text
        .replace(/전제\/기준:.*?(\||$)/g, '')
        .replace(/참조 각주:.*?(\||$)/g, '')
        .replace(/\|\s*$/g, '')
        .trim();
}

function cleanOptionText(text) {
    return text.trim();
}

function initQuestionSets() {
    const chunkSize = 30;
    questionSets = [];
    
    for (let i = 0; i < allQuestions.length; i += chunkSize) {
        const chunk = allQuestions.slice(i, i + chunkSize);
        if (chunk.length >= 10) {
            questionSets.push({
                id: `set_${Math.floor(i / chunkSize) + 1}`,
                name: `세트 ${Math.floor(i / chunkSize) + 1}`,
                version: '1.0',
                date: new Date().toISOString().split('T')[0],
                questions: chunk,
                isLatest: i + chunkSize >= allQuestions.length
            });
        }
    }
}

function loadSettings() {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (saved) {
        settings = { ...settings, ...JSON.parse(saved) };
    }
    
    setTimeout(() => {
        const countSelect = document.getElementById('setting-question-count');
        const warningSelect = document.getElementById('setting-timer-warning');
        if (countSelect) countSelect.value = settings.questionCount;
        if (warningSelect) warningSelect.value = settings.timerWarning;
    }, 100);
}

function saveSettings() {
    settings.questionCount = parseInt(document.getElementById('setting-question-count').value);
    settings.timerWarning = parseInt(document.getElementById('setting-timer-warning').value);
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

function initEventListeners() {
    document.querySelectorAll('.archive-tab').forEach(tab => {
        tab.addEventListener('click', () => renderArchive(tab.dataset.tab));
    });
    
    document.getElementById('setting-question-count')?.addEventListener('change', saveSettings);
    document.getElementById('setting-timer-warning')?.addEventListener('change', saveSettings);
    
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            // Use relative paths so GitHub Pages sub-path deployments work correctly.
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('Service Worker 등록 완료:', reg.scope))
                .catch(err => console.log('Service Worker 등록 실패:', err));
        });
    }
}

function setupInstallPrompt() {
    const installBtn = document.getElementById('install-btn');
    if (!installBtn) return;

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredInstallPrompt = e;
        installBtn.style.display = 'inline-block';
    });

    window.addEventListener('appinstalled', () => {
        deferredInstallPrompt = null;
        installBtn.style.display = 'none';
    });

    installBtn.addEventListener('click', async () => {
        if (!deferredInstallPrompt) return;
        installBtn.disabled = true;
        try {
            deferredInstallPrompt.prompt();
            await deferredInstallPrompt.userChoice;
        } catch (_) {
            // ignore
        } finally {
            deferredInstallPrompt = null;
            installBtn.style.display = 'none';
            installBtn.disabled = false;
        }
    });
}

function initEntranceBGM() {
    entranceBGM = new Audio('assets/entrance-bgm.mp3');
    entranceBGM.loop = true;
    entranceBGM.volume = 0.55;

    const unlock = () => {
        if (bgmUnlocked) return;
        bgmUnlocked = true;
        playEntranceBGM();
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('touchstart', unlock);
        window.removeEventListener('keydown', unlock);
    };

    // Modern mobile browsers require a user gesture before audio playback.
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
}

function playEntranceBGM() {
    if (!entranceBGM || !bgmUnlocked) return;
    entranceBGM.play().catch(() => {});
}

function stopEntranceBGM() {
    if (!entranceBGM) return;
    entranceBGM.pause();
    entranceBGM.currentTime = 0;
}

// ===== SCREEN NAVIGATION =====
function showScreen(screenId) {
    
    // Defensive: prevent page-level scroll from moving between screens
    window.scrollTo(0, 0);
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
// 모든 화면 비활성화
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    
    const targetScreen = document.getElementById(screenId);
    targetScreen.classList.add('active');
    
    // 새 화면으로 전환 시 스크롤 위치 초기화
    targetScreen.scrollTop = 0;

    // Entrance BGM only on the home screen. Stop it immediately when entering a dungeon.
    if (screenId === 'home-screen') {
        playEntranceBGM();
    } else {
        stopEntranceBGM();
    }
    
    if (screenId === 'archive-screen') {
        renderArchive('summary');
    }
}

// ===== DUNGEON SELECTION =====
function selectDungeon(type) {
    currentDungeonType = type;
    applyDungeonRoomBackground(type);
    
    if (type === 'weakness') {
        const weakQuestions = getWeakQuestions();
        if (weakQuestions.length === 0) {
            alert('아직 취약 문제가 없습니다. 먼저 시련의 회랑을 도전해보세요!');
            return;
        }
        startBattle(weakQuestions);
    } else {
        renderSetList();
        showScreen('set-select-screen');
    }
}

function renderSetList() {
    const container = document.getElementById('set-list');
    const stats = getQuestionStats();
    
    container.innerHTML = questionSets.map((set, idx) => {
        const attempted = set.questions.filter(q => stats[q.id]).length;
        const correct = set.questions.filter(q => stats[q.id]?.correct > 0).length;
        
        return `
            <div class="set-card ${!set.isLatest ? 'old-version' : ''}" onclick="selectSet('${set.id}')">
                <div class="set-info">
                    <h3>${set.name}</h3>
                    <p>${set.questions.length}문제 | v${set.version}</p>
                </div>
                <div class="set-stats">
                    <div>시도: ${attempted}문제</div>
                    <div>정답: ${correct}문제</div>
                </div>
            </div>
        `;
    }).join('');
}

function selectSet(setId) {
    currentSet = questionSets.find(s => s.id === setId);
    if (!currentSet) return;
    
    let questions = [...currentSet.questions];
    shuffleArray(questions);
    questions = questions.slice(0, Math.min(settings.questionCount, questions.length));
    
    startBattle(questions);
}

// ===== BATTLE LOGIC =====
function startBattle(questions) {
    stopEntranceBGM();
    applyDungeonRoomBackground(currentDungeonType);
    currentQuestions = questions;
    currentIndex = 0;
    questionTimer = 0;
    totalTimer = 0;
    battleResults = [];
    isPaused = false;
    
    showScreen('battle-screen');
    renderQuestion();
    startTimer();
}

// ===== DATA MIGRATION: OLD RECORDS -> CURRENT QUESTION BANK =====
// Purpose:
// - Past battle history may reference question IDs from older question.json builds.
// - This migrates history/feedbacks/stats by matching on question code (stable identifier).
function migrateStoredDataToCurrentQuestionBank() {
    try {
        const history = getBattleHistory();
        if (!Array.isArray(history) || history.length === 0) return;

        const codeToQuestion = new Map(allQuestions.map(q => [q.code, q]));
        const questionIdSet = new Set(allQuestions.map(q => Number(q.id)));

        // Determine whether migration is necessary.
        let needsMigration = false;
        for (const h of history) {
            const results = Array.isArray(h.results) ? h.results : [];
            for (const r of results) {
                const qid = Number(r.questionId);
                if (!questionIdSet.has(qid)) {
                    needsMigration = true;
                    break;
                }
            }
            if (needsMigration) break;
        }

        const feedbacksRaw = JSON.parse(localStorage.getItem(STORAGE_KEYS.FEEDBACKS) || '{}');
        if (!needsMigration && feedbacksRaw && typeof feedbacksRaw === 'object') {
            for (const [qidStr, fb] of Object.entries(feedbacksRaw)) {
                const qid = Number(qidStr);
                if (!questionIdSet.has(qid) && fb?.code && codeToQuestion.has(fb.code)) {
                    needsMigration = true;
                    break;
                }
            }
        }

        if (!needsMigration) return;

        // 1) Migrate battle history results questionId by code.
        const migratedHistory = history.map(h => {
            const results = Array.isArray(h.results) ? h.results : [];
            const migratedResults = results.map(r => {
                const match = r?.code ? codeToQuestion.get(r.code) : null;
                if (match) {
                    return { ...r, questionId: match.id };
                }
                return r;
            });

            // 2) Update setId to current chunk set (best-effort).
            let setId = h.setId;
            if (h.type === 'regular' && migratedResults.length > 0) {
                const firstQid = Number(migratedResults[0].questionId);
                const foundSet = questionSets.find(s => s.questions.some(q => Number(q.id) === firstQid));
                if (foundSet) setId = foundSet.id;
            }

            return { ...h, setId, results: migratedResults };
        });
        localStorage.setItem(STORAGE_KEYS.BATTLE_HISTORY, JSON.stringify(migratedHistory));

        // 3) Rebuild question stats from migrated history (ensures stats align to current IDs).
        const rebuiltStats = {};
        for (const h of migratedHistory) {
            const results = Array.isArray(h.results) ? h.results : [];
            for (const r of results) {
                const qid = Number(r.questionId);
                if (!qid || !questionIdSet.has(qid)) continue;
                if (!rebuiltStats[qid]) {
                    rebuiltStats[qid] = { attempts: 0, correct: 0, wrong: 0, totalTime: 0, avgTime: 0 };
                }
                rebuiltStats[qid].attempts += 1;
                rebuiltStats[qid].totalTime += Number(r.time || 0);
                if (r.isCorrect) rebuiltStats[qid].correct += 1;
                else rebuiltStats[qid].wrong += 1;
            }
        }
        for (const qid of Object.keys(rebuiltStats)) {
            const s = rebuiltStats[qid];
            s.avgTime = s.attempts > 0 ? Math.round(s.totalTime / s.attempts) : 0;
        }
        localStorage.setItem(STORAGE_KEYS.QUESTION_STATS, JSON.stringify(rebuiltStats));

        // 4) Migrate feedback keys by code (best-effort).
        if (feedbacksRaw && typeof feedbacksRaw === 'object') {
            const migratedFeedbacks = {};
            for (const [oldId, fb] of Object.entries(feedbacksRaw)) {
                const match = fb?.code ? codeToQuestion.get(fb.code) : null;
                const newId = match ? String(match.id) : String(oldId);
                migratedFeedbacks[newId] = fb;
            }
            localStorage.setItem(STORAGE_KEYS.FEEDBACKS, JSON.stringify(migratedFeedbacks));
        }

        console.log('Migrated legacy data to current question bank.');
    } catch (e) {
        console.warn('Data migration skipped due to error:', e);
    }
}

function renderQuestion() {
    if (currentIndex >= currentQuestions.length) {
        endBattle();
        return;
    }
    
    const q = currentQuestions[currentIndex];
    
    document.getElementById('battle-progress').textContent = 
        `${currentIndex + 1} / ${currentQuestions.length}`;
    document.getElementById('progress-fill').style.width = 
        `${((currentIndex) / currentQuestions.length) * 100}%`;
    
    document.getElementById('question-code').textContent = q.code;
    document.getElementById('question-level').textContent = `Lv.${q.level}`;
    document.getElementById('question-level').className = `question-level level-${q.level}`;
    document.getElementById('question-text').textContent = q.stem;
    
    const optionsArea = document.getElementById('options-area');
    const optionLabels = ['①', '②', '③', '④', '⑤'];
    
    optionsArea.innerHTML = q.options.map((opt, idx) => `
        <button class="option-btn" onclick="selectAnswer(${idx})">
            <span class="option-number">${optionLabels[idx]}</span>
            <span class="option-text">${opt}</span>
        </button>
    `).join('');
    
    questionTimer = 0;
}

function selectAnswer(answerIdx) {
    if (isPaused) return;
    
    const q = currentQuestions[currentIndex];
    const isCorrect = answerIdx === q.answerIndex;
    
    showAttackEffect(isCorrect);
    
    battleResults.push({
        questionId: q.id,
        code: q.code,
        userAnswer: answerIdx,
        correctAnswer: q.answerIndex,
        isCorrect: isCorrect,
        time: questionTimer
    });
    
    updateQuestionStats(q.id, isCorrect, questionTimer);
    
    setTimeout(() => {
        currentIndex++;
        renderQuestion();
    }, 600);
}

function showAttackEffect(isCorrect) {
    const overlay = document.getElementById('attack-overlay');
    const text = document.getElementById('attack-text');
    
    overlay.style.background = isCorrect
        ? 'radial-gradient(circle, rgba(46, 204, 113, 0.3) 0%, transparent 70%)'
        : 'radial-gradient(circle, rgba(231, 76, 60, 0.3) 0%, transparent 70%)';
    
    text.textContent = isCorrect ? 'HIT!' : 'MISS!';
    text.style.color = isCorrect ? 'var(--success)' : 'var(--danger)';
    
    overlay.classList.add('active');
    text.classList.add('active');
    
    setTimeout(() => {
        overlay.classList.remove('active');
        text.classList.remove('active');
    }, 800);
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        if (!isPaused) {
            questionTimer++;
            totalTimer++;
            updateTimerDisplay();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const timerEl = document.getElementById('battle-timer');
    timerEl.textContent = formatTime(questionTimer);
    
    if (settings.timerWarning > 0 && questionTimer >= settings.timerWarning) {
        timerEl.classList.add('warning');
    } else {
        timerEl.classList.remove('warning');
    }
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function togglePause() {
    isPaused = !isPaused;
    document.getElementById('pause-overlay').classList.toggle('active', isPaused);
    document.getElementById('question-area').style.filter = isPaused ? 'blur(20px)' : 'none';
}

function exitBattle() {
    if (timerInterval) clearInterval(timerInterval);
    isPaused = false;
    document.getElementById('pause-overlay').classList.remove('active');
    showScreen('home-screen');
}

function endBattle() {
    if (timerInterval) clearInterval(timerInterval);
    
    const correct = battleResults.filter(r => r.isCorrect).length;
    const wrong = battleResults.length - correct;
    const accuracy = Math.round((correct / battleResults.length) * 100);
    
    saveBattleHistory({
        type: currentDungeonType,
        setId: currentSet?.id,
        date: new Date().toISOString(),
        results: battleResults,
        totalTime: totalTimer,
        correct,
        wrong,
        accuracy
    });
    
    document.getElementById('result-subtitle').textContent = 
        currentDungeonType === 'regular' ? '시련의 회랑 완료' : '망각의 심연 완료';
    document.getElementById('result-correct').textContent = correct;
    document.getElementById('result-wrong').textContent = wrong;
    document.getElementById('result-accuracy').textContent = `${accuracy}%`;
    document.getElementById('result-time').textContent = formatTime(totalTimer);
    
    const detailList = document.getElementById('result-detail-list');
    detailList.innerHTML = battleResults.map((r, idx) => `
        <div class="detail-item ${r.isCorrect ? 'correct' : 'wrong'}">
            <span>${r.code}</span>
            <span>${formatTime(r.time)} | ${r.isCorrect ? '✓ 정답' : '✗ 오답'}</span>
        </div>
    `).join('');
    
    updateWeaknessDungeon();
    showScreen('result-screen');
}

// ===== QUESTION STATS =====
function getQuestionStats() {
    const saved = localStorage.getItem(STORAGE_KEYS.QUESTION_STATS);
    return saved ? JSON.parse(saved) : {};
}

function updateQuestionStats(questionId, isCorrect, time) {
    const stats = getQuestionStats();
    
    if (!stats[questionId]) {
        stats[questionId] = {
            attempts: 0,
            correct: 0,
            wrong: 0,
            totalTime: 0,
            avgTime: 0
        };
    }
    
    stats[questionId].attempts++;
    stats[questionId].totalTime += time;
    stats[questionId].avgTime = Math.round(stats[questionId].totalTime / stats[questionId].attempts);
    
    if (isCorrect) {
        stats[questionId].correct++;
    } else {
        stats[questionId].wrong++;
    }
    
    localStorage.setItem(STORAGE_KEYS.QUESTION_STATS, JSON.stringify(stats));
}

function getWeakQuestions() {
    const stats = getQuestionStats();
    
    const weakIds = Object.keys(stats)
        .filter(id => stats[id].wrong > 0)
        .sort((a, b) => {
            const aRate = stats[a].wrong / stats[a].attempts;
            const bRate = stats[b].wrong / stats[b].attempts;
            return bRate - aRate;
        });
    
    return weakIds
        .map(id => allQuestions.find(q => q.id === parseInt(id)))
        .filter(Boolean)
        .slice(0, settings.questionCount);
}

function updateWeaknessDungeon() {
    const weakCount = getWeakQuestions().length;
    const dungeonEl = document.getElementById('weakness-dungeon');
    
    if (weakCount === 0) {
        dungeonEl.classList.add('locked');
        dungeonEl.querySelector('.dungeon-desc').textContent = 
            '아직 취약 문제가 없습니다';
    } else {
        dungeonEl.classList.remove('locked');
        dungeonEl.querySelector('.dungeon-desc').textContent = 
            `${weakCount}개의 약점 문제가 기다립니다`;
    }
}

// ===== BATTLE HISTORY =====
function getBattleHistory() {
    const saved = localStorage.getItem(STORAGE_KEYS.BATTLE_HISTORY);
    return saved ? JSON.parse(saved) : [];
}

function saveBattleHistory(battle) {
    const history = getBattleHistory();
    history.unshift(battle);
    
    if (history.length > 50) {
        history.pop();
    }
    
    localStorage.setItem(STORAGE_KEYS.BATTLE_HISTORY, JSON.stringify(history));
}

// ===== FEEDBACK =====
function openFeedback() {
    const q = currentQuestions[currentIndex];
    document.getElementById('feedback-code').textContent = q.code;
    document.getElementById('feedback-text').value = getFeedback(q.id) || '';
    document.getElementById('feedback-modal').classList.add('active');
}

function closeFeedback() {
    document.getElementById('feedback-modal').classList.remove('active');
}

function submitFeedback() {
    const q = currentQuestions[currentIndex];
    const text = document.getElementById('feedback-text').value.trim();
    
    if (text) {
        saveFeedback(q.id, q.code, text);
        alert('피드백이 저장되었습니다.');
    }
    
    closeFeedback();
}

function getFeedback(questionId) {
    const feedbacks = JSON.parse(localStorage.getItem(STORAGE_KEYS.FEEDBACKS) || '{}');
    return feedbacks[questionId]?.text || '';
}

function saveFeedback(questionId, code, text) {
    const feedbacks = JSON.parse(localStorage.getItem(STORAGE_KEYS.FEEDBACKS) || '{}');
    feedbacks[questionId] = {
        code,
        text,
        date: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEYS.FEEDBACKS, JSON.stringify(feedbacks));
}

// ===== ARCHIVE =====
function renderArchive(tab) {
    const content = document.getElementById('archive-content');
    
    document.querySelectorAll('.archive-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tab);
    });
    
    switch (tab) {
        case 'summary':
            renderArchiveSummary(content);
            break;
        case 'questions':
            renderArchiveQuestions(content);
            break;
        case 'weakness':
            renderArchiveWeakness(content);
            break;
        case 'notes':
            renderArchiveNotes(content);
            break;
    }
}

function renderArchiveSummary(container) {
    const history = getBattleHistory();
    const stats = getQuestionStats();
    
    const totalBattles = history.length;
    const totalCorrect = history.reduce((sum, h) => sum + h.correct, 0);
    const totalWrong = history.reduce((sum, h) => sum + h.wrong, 0);
    const avgAccuracy = totalBattles > 0 
        ? Math.round(history.reduce((sum, h) => sum + h.accuracy, 0) / totalBattles)
        : 0;
    
    container.innerHTML = `
        <div class="archive-summary">
            <div class="stat-card">
                <div class="stat-value">${totalBattles}</div>
                <div class="stat-label">총 던전런</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${totalCorrect + totalWrong}</div>
                <div class="stat-label">푼 문제</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${totalCorrect}</div>
                <div class="stat-label">총 정답</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${avgAccuracy}%</div>
                <div class="stat-label">평균 정답률</div>
            </div>
        </div>
        
        <h3 class="detail-title">최근 던전런 기록</h3>
        <div>
            ${history.slice(0, 10).map(h => `
                <div class="detail-item">
                    <span>${h.type === 'regular' ? '시련의 회랑' : '망각의 심연'}</span>
                    <span>${h.accuracy}% | ${formatTime(h.totalTime)}</span>
                </div>
            `).join('') || '<p style="color: var(--text-dim)">아직 기록이 없습니다</p>'}
        </div>
    `;
}

function renderArchiveQuestions(container) {
    const stats = getQuestionStats();
    
    container.innerHTML = `
        <div style="margin-bottom: 15px;">
            <select id="archive-set-select" onchange="renderSetQuestions(this.value)" 
                style="width: 100%; background: var(--primary-dark); color: var(--text-light); border: 1px solid var(--accent-gold); padding: 10px; border-radius: 8px;">
                <option value="">세트를 선택하세요</option>
                ${questionSets.map(s => `<option value="${s.id}">${s.name} (${s.questions.length}문제)</option>`).join('')}
            </select>
        </div>
        <div id="archive-question-container" class="archive-question-list"></div>
    `;
}

function renderSetQuestions(setId) {
    const set = questionSets.find(s => s.id === setId);
    if (!set) return;
    
    const stats = getQuestionStats();
    const container = document.getElementById('archive-question-container');
    
    container.innerHTML = set.questions.map(q => {
        const qStats = stats[q.id];
        const wrongRate = qStats 
            ? Math.round((qStats.wrong / qStats.attempts) * 100) 
            : 0;
        
        return `
            <div class="archive-question" onclick="showQuestionDetail(${q.id})">
                <div class="archive-question-header">
                    <span class="archive-question-code">${q.code}</span>
                    <span class="archive-question-stats">
                        ${qStats ? `오답률 ${wrongRate}% | 평균 ${formatTime(qStats.avgTime)}` : '미풀이'}
                    </span>
                </div>
                <div class="archive-question-text">${q.stem}</div>
            </div>
        `;
    }).join('');
}

function renderArchiveWeakness(container) {
    const weakQuestions = getWeakQuestions();
    const stats = getQuestionStats();
    
    if (weakQuestions.length === 0) {
        container.innerHTML = '<p style="color: var(--text-dim); text-align: center; padding: 40px;">취약 문제가 없습니다. 문제를 더 풀어보세요!</p>';
        return;
    }
    
    container.innerHTML = `
        <p style="color: var(--text-dim); margin-bottom: 15px;">오답률이 높은 문제들입니다.</p>
        <div class="archive-question-list">
            ${weakQuestions.map(q => {
                const qStats = stats[q.id];
                const wrongRate = Math.round((qStats.wrong / qStats.attempts) * 100);
                
                return `
                    <div class="archive-question" onclick="showQuestionDetail(${q.id})">
                        <div class="archive-question-header">
                            <span class="archive-question-code">${q.code}</span>
                            <span class="archive-question-stats" style="color: var(--danger)">
                                오답률 ${wrongRate}% (${qStats.wrong}/${qStats.attempts})
                            </span>
                        </div>
                        <div class="archive-question-text">${q.stem}</div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function renderArchiveNotes(container) {
    const notes = localStorage.getItem(STORAGE_KEYS.NOTES) || '';
    const feedbacks = JSON.parse(localStorage.getItem(STORAGE_KEYS.FEEDBACKS) || '{}');
    
    container.innerHTML = `
        <div class="notes-section">
            <h3 class="notes-title">📝 개선 사항 메모</h3>
            <textarea class="notes-textarea" id="archive-notes" placeholder="다음 버전에 수정/보완해야 할 사항을 기록하세요...">${notes}</textarea>
            <button class="save-notes-btn" onclick="saveNotes()">메모 저장</button>
        </div>
        
        <div class="notes-section" style="margin-top: 30px;">
            <h3 class="notes-title">📋 문제별 피드백 (GPT용)</h3>
            <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 15px; max-height: 300px; overflow-y: auto;">
                ${Object.keys(feedbacks).length > 0 
                    ? Object.entries(feedbacks).map(([id, fb]) => `
                        <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                            <div style="color: var(--accent-gold); font-weight: 700;">${fb.code}</div>
                            <div style="font-size: 0.85rem; margin-top: 5px;">${fb.text}</div>
                        </div>
                    `).join('')
                    : '<p style="color: var(--text-dim);">아직 피드백이 없습니다</p>'
                }
            </div>
            ${Object.keys(feedbacks).length > 0 ? `
                <button class="save-notes-btn" style="margin-top: 10px;" onclick="exportFeedbacks()">피드백 내보내기</button>
            ` : ''}
        </div>
    `;
}

function saveNotes() {
    const notes = document.getElementById('archive-notes').value;
    localStorage.setItem(STORAGE_KEYS.NOTES, notes);
    alert('메모가 저장되었습니다.');
}

function exportFeedbacks() {
    const feedbacks = JSON.parse(localStorage.getItem(STORAGE_KEYS.FEEDBACKS) || '{}');
    const text = Object.entries(feedbacks).map(([id, fb]) => 
        `[${fb.code}]\n${fb.text}\n`
    ).join('\n---\n\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'psat_feedbacks.txt';
    a.click();
}

function showQuestionDetail(questionId) {
    const q = allQuestions.find(q => q.id === questionId);
    if (!q) return;
    
    const stats = getQuestionStats()[questionId];
    const optionLabels = ['①', '②', '③', '④', '⑤'];
    
    document.getElementById('question-detail-content').innerHTML = `
        <div class="question-detail-box">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: var(--accent-gold); font-weight: 700;">${q.code}</span>
                <span style="font-size: 0.85rem;">Lv.${q.level}</span>
            </div>
            <p style="line-height: 1.8; white-space: pre-wrap;">${q.stem}</p>
            
            <div class="question-detail-options">
                ${q.options.map((opt, idx) => `
                    <div class="detail-option ${idx === q.answerIndex ? 'correct' : ''}">
                        <span>${optionLabels[idx]}</span>
                        <span>${opt}</span>
                        ${idx === q.answerIndex ? '<span style="margin-left: auto; color: var(--success);">정답</span>' : ''}
                    </div>
                `).join('')}
            </div>
        </div>
        
        ${stats ? `
            <div style="font-size: 0.85rem; color: var(--text-dim);">
                시도: ${stats.attempts}회 | 정답: ${stats.correct}회 | 오답: ${stats.wrong}회 | 평균시간: ${formatTime(stats.avgTime)}
            </div>
        ` : ''}
    `;
    
    document.getElementById('question-detail-modal').classList.add('active');
}

function closeQuestionDetail() {
    document.getElementById('question-detail-modal').classList.remove('active');
}

// ===== UTILITIES =====
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function resetAllData() {
    if (confirm('모든 데이터가 삭제됩니다. 계속하시겠습니까?')) {
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        alert('데이터가 초기화되었습니다.');
        location.reload();
    }
}

// ===== START APP =====
document.addEventListener('DOMContentLoaded', init);
