// ===== PSAT DUNGEON - 업데이트된 코어 기능 =====
// 1. 등급별 몬스터 시스템 (Level 1/2/3에 따른 고정 몬스터)
// 2. 시대별 문제 분류 (현세/고대 - epoch 필드 기반)
// 3. 아카이브 재구성

// ===== 4단계 몬스터 시스템 (Stage 1~4) =====
// Stage 1~3: 일반 몬스터(난이도/레벨 기반), Stage 4: 보스/최상위 몬스터
// ===== 3폴더 + 보스 이미지 기반 몬스터 풀 =====
// - folder1: 일반(1~2단계) 몬스터 풀
// - folder2: 일반(3단계) 몬스터 풀
// - folder3: 특별던전 전용 몬스터 풀
// - boss: 보스 전용(단일 이미지)
const MONSTER_STAGE_POOLS = {
  "1": [
    "assets/psat_monsters/folder1/stage1_bg_01.png",
    "assets/psat_monsters/folder1/stage1_bg_02.png",
    "assets/psat_monsters/folder1/stage1_bg_03.png",
    "assets/psat_monsters/folder1/stage1_bg_04.png"
],
  "2": [
    "assets/psat_monsters/folder1/stage1_bg_05.png",
    "assets/psat_monsters/folder1/stage1_bg_06.png",
    "assets/psat_monsters/folder1/stage1_bg_07.png",
    "assets/psat_monsters/folder1/stage1_bg_08.png"
],
  "3": [
    "assets/psat_monsters/folder2/stage2_bg_01.png",
    "assets/psat_monsters/folder2/stage2_bg_02.png",
    "assets/psat_monsters/folder2/stage2_bg_03.png",
    "assets/psat_monsters/folder2/stage2_bg_04.png",
    "assets/psat_monsters/folder2/stage2_bg_05.png",
    "assets/psat_monsters/folder2/stage2_bg_06.png",
    "assets/psat_monsters/folder2/stage2_bg_07.png",
    "assets/psat_monsters/folder2/stage2_bg_08.png"
],
  "4": [
    "assets/psat_monsters/boss/boss_1.png",
    "assets/psat_monsters/boss/boss_2.png",
    "assets/psat_monsters/boss/boss_3.png",
    "assets/psat_monsters/boss/boss_4.png"
  ]
};

const SPECIAL_STAGE_POOLS = {
  "1": [
    "assets/psat_monsters/folder3/stage3_bg_01.png",
    "assets/psat_monsters/folder3/stage3_bg_02.png"
],
  "2": [
    "assets/psat_monsters/folder3/stage3_bg_03.png",
    "assets/psat_monsters/folder3/stage3_bg_04.png",
    "assets/psat_monsters/folder3/stage3_bg_05.png"
],
  "3": [
    "assets/psat_monsters/folder3/stage3_bg_06.png",
    "assets/psat_monsters/folder3/stage3_bg_07.png",
    "assets/psat_monsters/folder3/stage3_bg_08.png"
],
  "4": [
    "assets/psat_monsters/boss/boss_1.png",
    "assets/psat_monsters/boss/boss_2.png",
    "assets/psat_monsters/boss/boss_3.png",
    "assets/psat_monsters/boss/boss_4.png"
  ]
};


// ===== 몬스터 이름 정의 (이미지 외형 기반) =====
// Stage 1 (Lv.1): 기초 난이도 - 귀여운/친근한 몬스터
// Stage 2 (Lv.2): 중급 난이도 - 약간 강화된 몬스터  
// Stage 3 (Lv.3): 상급 난이도 - 강력한 몬스터
// Stage 4 (보스): 최종 보스급

const MONSTER_STAGE_NAMES = {
    // Stage 1 (folder1 01-04): 고블린, 학자쥐, 불꽃령, 책 미믹
    1: ['비율 고블린', '문헌 쥐덫', '불꽃 산술령', '지식의 미믹'],
    // Stage 2 (folder1 05-08): 슬라임, 해골기사, 박쥐, 버섯
    2: ['물음표 슬라임', '백분율 해골병', '암산 박쥐', '포자 버섯령'],
    // Stage 3 (folder2 01-08): 웨어울프, 올빼미 마법사, 트롤, 해골거미, 슬라임괴물, 골렘, 해골기사, 주술사
    3: ['계산광 리칸', '지혜의 현자', '논리 트롤', '함정의 거미', '용해 슬라임', '공식 골렘', '비문 기사', '저주술사'],
    // Boss (boss 1-4): 사이버 리치, 화염 마왕, 자연 거신, 마녀
    4: ['심연의 계산왕', '업화의 논리군주', '태고의 공식수호자', '확률의 마녀']
};

// 특별 던전(결정의 탑) 전용 몬스터 이름 (folder3 이미지 기반)
const SPECIAL_MONSTER_NAMES = {
    // Stage 1 (folder3 01-02): 화염 악마 전사
    1: ['시험의 불꽃검사', '결정의 화염전사'],
    // Stage 2 (folder3 03-05): 
    2: ['심판의 암흑기사', '선택의 얼음마법사', '판단의 독수리'],
    // Stage 3 (folder3 06-08):
    3: ['최종 관문지기', '운명의 대마법사', '결정의 수호룡'],
    // Boss (같은 보스 사용)
    4: ['심연의 계산왕', '업화의 논리군주', '태고의 공식수호자', '확률의 마녀']
};

function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function pickRanked(pool, norm01) {
    if (!pool || pool.length === 0) return null;
    if (!Number.isFinite(norm01)) return pickRandom(pool);
    const n = Math.max(0, Math.min(1, norm01));
    const idx = Math.round(n * (pool.length - 1));
    return pool[Math.max(0, Math.min(pool.length - 1, idx))];
}

// 현재 진행 중인 던전(regular/special)을 안전하게 계산
// - _inline.js의 getActiveBank()가 있으면 그 값을 사용
// - 없으면 currentDungeonType 전역값을 기반으로 추론
function getCurrentBankSafe() {
    try {
        if (typeof getActiveBank === 'function') {
            const b = getActiveBank();
            return (b === 'special') ? 'special' : 'regular';
        }
        if (typeof currentDungeonType === 'string') {
            if (currentDungeonType === 'special' || currentDungeonType === 'weakness_special') return 'special';
        }
    } catch (e) {
        // ignore
    }
    return 'regular';
}

function stageNormFromPower(power, stage) {
    const x = Number(power) || 0;
    if (!Number.isFinite(x) || x <= 0) return NaN;

    // Stage별 숫자 범위(대략)에서 위치를 계산해 "숫자가 클수록 강한 몬스터(높은 번호 이미지)"가 나오게 함.
    const ranges = {
        1: [0, 99],
        2: [100, 999],
        3: [1000, 9999],
        4: [10000, 100000] // 상한은 넉넉히
    };
    const r = ranges[stage] || ranges[1];
    const minV = r[0];
    const maxV = r[1];
    if (x <= minV) return 0;
    if (x >= maxV) return 1;
    return (x - minV) / (maxV - minV);
}

function getMonsterByStage(stage, bank, powerValue) {
    // NOTE: 이름/이미지 결합은 getAssignedMonsterForQuestion에서 관리.
    // 여기서는 "등급별 풀" 반환만 담당(하위 호환).
    const s = Number(stage) || 1;
    const safeStage = (s >= 4) ? 4 : (s <= 1 ? 1 : s);

    const isSpecial = (String(bank || '') === 'special');
    const pools = isSpecial ? SPECIAL_STAGE_POOLS : MONSTER_STAGE_POOLS;

    const pool = pools[String(safeStage)] || pools["1"] || [];
    const image = (safeStage === 4)
        ? (pickRandom(pool) || '')
        : (pickRandom(pool) || '');

    const name = monsterNameFromSrc(image, stage, isSpecial);
    return { image, name, stage: safeStage };
}

// ===== 몬스터 이름/이미지 "고정 결합" + 세션 단위 랜덤 배정 =====
let __battleSeed = null;
let __monsterAssignments = new Map();

function resetMonsterAssignments() {
    __battleSeed = null;
    __monsterAssignments = new Map();
}

// 간단 해시(문자열 -> 32bit 정수)
function hash32(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

// Mulberry32 PRNG
function mulberry32(a) {
    return function() {
        let t = a += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
}

function ensureBattleSeed() {
    if (__battleSeed != null) return;
    try {
        const arr = new Uint32Array(1);
        (crypto && crypto.getRandomValues) ? crypto.getRandomValues(arr) : (arr[0] = Date.now() >>> 0);
        __battleSeed = arr[0] >>> 0;
    } catch (e) {
        __battleSeed = (Date.now() >>> 0);
    }
}

function monsterNameFromSrc(src, stageHint, isSpecialDungeon) {
    try {
        const s = String(src || '');
        const base = s.split('/').pop() || '';
        const noExt = base.replace(/\.[^.]+$/, '');

        // 1) 보스 파일명: boss_1 ~ boss_4
        const bossMatch = noExt.match(/^boss_(\d+)$/i);
        if (bossMatch) {
            const idx = Math.max(0, (parseInt(bossMatch[1], 10) || 1) - 1);
            const names = MONSTER_STAGE_NAMES[4] || ['BOSS'];
            return names[idx % names.length] || names[0] || 'BOSS';
        }

        // 2) 스테이지 파일명: stage{n}_..._{k}
        // 예: stage1_bg_01, stage2_bg_08, stage3_bg_05
        const stageMatch = noExt.match(/^stage(\d+)[^0-9]*(\d+)?/i);
        let stage = stageHint != null ? Number(stageHint) : null;
        let idx = 0;
        let useSpecialNames = isSpecialDungeon || false;

        if (stageMatch) {
            const st = parseInt(stageMatch[1], 10);
            if (Number.isFinite(st)) {
                // folder3 (stage3_*)는 특별 던전 전용
                if (st === 3 && s.includes('folder3')) {
                    useSpecialNames = true;
                }
                stage = st;
            }
            // 파일명 끝의 숫자(01~08 등)를 우선 인덱스로 사용
            const tailNum = noExt.match(/(\d+)\s*$/);
            if (tailNum) idx = Math.max(0, (parseInt(tailNum[1], 10) || 1) - 1);
        } else {
            stage = stage ?? null;
        }

        stage = Number.isFinite(stage) ? stage : 1;
        
        // 특별 던전용 몬스터 이름 선택
        let namePool;
        if (useSpecialNames && typeof SPECIAL_MONSTER_NAMES !== 'undefined') {
            // folder3 이미지의 경우 stage 번호를 재매핑
            // stage3_bg_01~02 -> Stage 1, stage3_bg_03~05 -> Stage 2, stage3_bg_06~08 -> Stage 3
            let mappedStage = 1;
            if (idx <= 1) mappedStage = 1;
            else if (idx <= 4) mappedStage = 2;
            else mappedStage = 3;
            namePool = SPECIAL_MONSTER_NAMES[mappedStage] || SPECIAL_MONSTER_NAMES[1];
            // 인덱스도 재조정
            if (mappedStage === 1) idx = idx % 2;
            else if (mappedStage === 2) idx = (idx - 2) % 3;
            else idx = (idx - 5) % 3;
        } else {
            // 일반 던전 - stage1은 1~4, stage2(folder1 05~08)는 0~3으로 매핑
            if (stage === 1 && idx >= 4) {
                stage = 2;
                idx = idx - 4;
            }
            namePool = MONSTER_STAGE_NAMES[stage] || MONSTER_STAGE_NAMES[1] || ['MONSTER'];
        }
        
        return namePool[idx % namePool.length] || namePool[0] || 'MONSTER';
    } catch (e) {
        return 'MONSTER';
    }
}

function pickDeterministic(pool, seedKey) {
    if (!pool || pool.length === 0) return '';
    ensureBattleSeed();
    const seed = (hash32(seedKey) ^ __battleSeed) >>> 0;
    const rnd = mulberry32(seed);
    const idx = Math.floor(rnd() * pool.length);
    return pool[idx] || pool[0] || '';
}

// NOTE: "랜덤 요소"는 같은 레벨(=stage) 풀 내부에서만 발생하며,
// 선택된 몬스터(이름+이미지)는 해당 전투 세션 동안 바뀌지 않음.
function getAssignedMonsterForQuestion(q, stage, bank, isBoss, bossKey) {
    const isSpecial = (String(bank || '') === 'special');
    const pools = isSpecial ? SPECIAL_STAGE_POOLS : MONSTER_STAGE_POOLS;

    const safeStage = isBoss ? 4 : Math.max(1, Math.min(3, Number(stage) || 1));
    const pool = pools[String(safeStage)] || pools["1"] || [];

    // key 구성: 같은 레벨 풀에서만 랜덤, "세션 동안 고정"
    const qid = (q && (q.id ?? q.questionId ?? q.code)) ? String(q.id ?? q.questionId ?? q.code) : '';
    const key = isBoss
        ? `boss:${bossKey || '1'}`
        : `q:${qid || ''}:${String(safeStage)}`;

    if (__monsterAssignments.has(key)) return __monsterAssignments.get(key);

    const image = pickDeterministic(pool, key);
    const monster = { image, name: monsterNameFromSrc(image, safeStage, isSpecial), stage: safeStage };
    __monsterAssignments.set(key, monster);
    return monster;
}

// startBattle 호출 시 세션 리셋(가능한 경우)
(function() {
    try {
        const _orig = window.startBattle;
        if (typeof _orig === 'function') {
            window.startBattle = function() {
                resetMonsterAssignments();
                return _orig.apply(this, arguments);
            };
        }
    } catch (e) {}
})();


// ===== 숫자 크기 기반 몬스터 강도 산정 =====
// 문제(또는 선택지)에 등장하는 숫자 중 "가장 큰 수"를 기준으로 Stage를 결정.
// 숫자가 커질수록 강한 몬스터가 등장한다.
function getMaxNumericValueFromQuestion(q) {
    try {
        const stem = (q && q.stem) ? String(q.stem) : '';
        const opts = (q && Array.isArray(q.options)) ? q.options.join(' ') : '';
        const text = (stem + ' ' + opts).trim();
        if (!text) return 0;

        // 1,234.56 / 1234.56 / -12.3 등의 숫자 패턴
        const matches = text.match(/-?\d{1,3}(?:,\d{3})*(?:\.\d+)?|-?\d+(?:\.\d+)?/g);
        if (!matches) return 0;

        let maxAbs = 0;
        for (const raw of matches) {
            const v = parseFloat(String(raw).replace(/,/g, ''));
            if (!Number.isFinite(v)) continue;
            const a = Math.abs(v);
            if (a > maxAbs) maxAbs = a;
        }
        return maxAbs;
    } catch (e) {
        return 0;
    }
}

function getStageFromNumberMagnitude(n) {
    const x = Number(n) || 0;
    // NOTE: 보스(Stage 4)는 "설정(bossInterval)"에 의해 등장해야 하므로,
    // 숫자 크기만으로 Stage 4를 반환하지 않는다.
    if (x >= 1000) return 3;
    if (x >= 100) return 2;
    return 1;
}



// ===== 문제 유형 분류 (작업기억 / 논리추론) =====
// - 논리추론: area === 'T' 또는 type/category 태그가 logic 계열
// - 작업기억: 그 외(기본)
function isLogicalReasoningQuestion(q) {
    const area = String(q?.area || '').trim().toUpperCase();
    const tag = String(q?.type || q?.category || q?.tags || '').trim().toLowerCase();

    if (area === 'T') return true;
    if (tag.includes('logic') || tag.includes('논리') || tag.includes('logical')) return true;
    return false;
}

function isWorkingMemoryQuestion(q) {
    return !isLogicalReasoningQuestion(q);
}

// ===== 시대별 문제 분류 시스템 =====
// 기준: '문제 추가 시간(addedDate/addedAt/createdAt 등)'로 현세/과거를 자동 분리
// - 현세: 최근 N일(기본 30일) 내 추가된 문제
// - 과거: 그 이전에 추가된 문제
const EPOCH_MODERN_DAYS_DEFAULT = 30;

function getQuestionAddedMs(q) {
    // 우선순위: addedAt(number ms) > addedDate(ISO) > createdAt(number/ISO) > timestamp(number/ISO)
    const n = (v) => (typeof v === 'number' && isFinite(v)) ? v : null;

    const addedAt = n(q?.addedAt) ?? n(q?.added_ms) ?? n(q?.createdAt) ?? n(q?.timestamp);
    if (addedAt !== null) return addedAt;

    const s = (q?.addedDate || q?.addedISO || q?.createdDate || q?.createdISO || q?.timestampISO);
    if (typeof s === 'string' && s.trim()) {
        const t = Date.parse(s);
        if (!Number.isNaN(t)) return t;
    }

    // 마지막 폴백: id 범위(구시대/현세) 추정 (레거시 데이터)
    // - 1~100: 과거, 101+: 현세로 추정
    const id = Number(q?.id || 0);
    if (id >= 101) return Date.parse('2026-01-20T00:00:00.000Z'); // 대략 최근
    return Date.parse('2024-01-01T00:00:00.000Z'); // 대략 과거
}

function getEpochLabelByAddedTime(q) {
    const days = (typeof settings?.epochDays === 'number' && settings.epochDays > 0) ? settings.epochDays : EPOCH_MODERN_DAYS_DEFAULT;
    const threshold = Date.now() - days * 24 * 60 * 60 * 1000;
    return '현세';
}

function organizeQuestionsByEpoch() {
    const QUESTIONS_PER_SET = 25;
    questionsByDate = {};

    const isModern = (q) => q.epoch === '현세' || getEpochLabelByAddedTime(q) === '현세';
    const isAncient = (q) => q.epoch === '고대';
    
    const groups = [
        {
            key: 'modern_working',
            name: '현세의 시련 · 작업기억',
            subtitle: '최근 추가된 작업기억 문제',
            isLatest: true,
            epochBadge: '현세',
            epochIcon: '⚔️',
            typeBadge: '작업기억',
            typeIcon: '📊',
            filter: (q) => isModern(q) && isWorkingMemoryQuestion(q)
        },
        {
            key: 'modern_reasoning',
            name: '현세의 시련 · 논리추론',
            subtitle: '최근 추가된 논리추론 문제',
            isLatest: true,
            epochBadge: '현세',
            epochIcon: '⚔️',
            typeBadge: '논리추론',
            typeIcon: '🗡️',
            filter: (q) => isModern(q) && isLogicalReasoningQuestion(q)
        },
        {
            key: 'ancient_working',
            name: '고대의 유산 · 작업기억',
            subtitle: '과거 시험에서 발굴된 작업기억 문제',
            isLatest: false,
            epochBadge: '고대',
            epochIcon: '🏛️',
            typeBadge: '작업기억',
            typeIcon: '📊',
            filter: (q) => isAncient(q) && isWorkingMemoryQuestion(q)
        },
        {
            key: 'ancient_reasoning',
            name: '고대의 유산 · 논리추론',
            subtitle: '과거 시험에서 발굴된 논리추론 문제',
            isLatest: false,
            epochBadge: '고대',
            epochIcon: '🏛️',
            typeBadge: '논리추론',
            typeIcon: '🗡️',
            filter: (q) => isAncient(q) && isLogicalReasoningQuestion(q)
        }
    ];

    groups.forEach(g => {
        const qs = allQuestions.filter(g.filter);
        if (!qs.length) return;

        // 최신순(추가시간) 정렬 후 안정성을 위해 id 보조정렬
        qs.sort((a, b) => (getQuestionAddedMs(b) - getQuestionAddedMs(a)) || ((a.id || 0) - (b.id || 0)));

        questionsByDate[g.key] = {
            name: g.name,
            subtitle: g.subtitle,
            isLatest: g.isLatest,
            epochBadge: g.epochBadge,
            epochIcon: g.epochIcon,
            typeBadge: g.typeBadge,
            typeIcon: g.typeIcon,
            sets: []
        };

        for (let i = 0, setNum = 0; i < qs.length; i += QUESTIONS_PER_SET, setNum++) {
            const setQuestions = qs.slice(i, i + QUESTIONS_PER_SET);
            if (!setQuestions.length) break;
            questionsByDate[g.key].sets.push({
                id: g.key + '_set' + (setNum + 1),
                name: '제' + (setNum + 1) + '구역',
                questions: setQuestions
            });
        }
    });
}


// organizeQuestionsByDate를 대체
function organizeQuestionsByDate() {
    organizeQuestionsByEpoch();
}

// ===== 렌더링 함수 수정 - 등급별 몬스터 =====
function renderQuestionWithLevelMonster() {
    if (currentIndex >= currentQuestions.length) { 
        endBattle(); 
        return; 
    }
    
    const q = currentQuestions[currentIndex];
    const level = q.level || 1;
    
    // 보스 여부 확인
    isBossQuestion = settings.bossInterval > 0 && (currentIndex + 1) % settings.bossInterval === 0;
    const battleScreenEl = document.getElementById('battle-screen');
    battleScreenEl.classList.toggle('boss-mode', isBossQuestion);
    battleScreenEl.classList.toggle('boss-raid', isBossQuestion);
    
    // 진행률 업데이트
    document.getElementById('battle-progress').textContent = (currentIndex + 1) + ' / ' + currentQuestions.length;
    document.getElementById('progress-fill').style.width = (currentIndex / currentQuestions.length) * 100 + '%';
    
    // 몬스터 이미지 및 정보 설정
    const monsterImg = document.getElementById('monster-image');
    const monsterNameEl = document.getElementById('monster-name');
    const hpFill = document.getElementById('monster-hp-fill');
    
    // 4단계 몬스터: 숫자 크기(문제/선택지 내 최대 수치) 기반으로 강도 산정
    const maxNum = getMaxNumericValueFromQuestion(q);
    const stageFromNumber = getStageFromNumberMagnitude(maxNum);

    // 보스 간격(bossInterval)로 지정된 경우는 무조건 보스(Stage 4)
    const stage = isBossQuestion ? 4 : Math.min(3, stageFromNumber);
    const bank = getCurrentBankSafe();
    const bossKey = (isBossQuestion && settings.bossInterval > 0) ? String(Math.floor((currentIndex + 1) / settings.bossInterval)) : '0';
    const monster = getAssignedMonsterForQuestion(q, stage, bank, isBossQuestion, bossKey);

    monsterImg.src = monster.image;

    const stageHp = {
        1: '#27ae60',
        2: '#f39c12',
        3: '#e74c3c',
        4: 'linear-gradient(90deg, #8e44ad, #c0392b)'
    };

    if (stage === 4) {
        monsterImg.classList.add('boss');
        monsterNameEl.textContent = monster.name;
        hpFill.style.background = stageHp[4];
        if (isBossQuestion) playSound('boss');
    } else {
        monsterImg.classList.remove('boss');
        monsterNameEl.textContent = monster.name + ' Lv.' + level;
        hpFill.style.background = stageHp[stage] || stageHp[1];
    }
    
    monsterImg.classList.remove('hit', 'miss');
    hpFill.style.width = '100%';
    
    // 문제 정보 표시
    document.getElementById('question-code').textContent = q.code;
    document.getElementById('question-text').textContent = q.stem;
    
    // 강도 레이블(숫자 크기 기반 Stage)
    const levelEl = document.getElementById('question-level');
    if (isBossQuestion) {
        levelEl.textContent = '👑 BOSS';
        levelEl.className = 'question-level level-boss';
    } else {
        // Stage 4는 '최상위'로 강조(보스 표식은 bossInterval에서만 부여)
        if (stage >= 4) {
            levelEl.textContent = 'St.4';
            levelEl.className = 'question-level level-boss';
        } else {
            levelEl.textContent = 'St.' + stage;
            levelEl.className = 'question-level level-' + stage;
        }
    }

    // 선택지 렌더링
    const optionsArea = document.getElementById('options-area');
    optionsArea.innerHTML = q.options.map((opt, i) =>
        '<button class="option-btn" data-index="' + i + '" onclick="selectAnswer(' + i + ')">' +
        '<span class="option-number">' + (i + 1) + '</span>' +
        '<span class="option-text">' + opt + '</span></button>'
    ).join('');
    
    questionTimer = 0;
}

// ===== 세트 목록 렌더링 수정 =====
function renderSetListWithEpoch() {
    const container = document.getElementById('set-list-container');
    const bank = getActiveBank();
    const stats = getQuestionStats(bank);
    const byDate = (bank === 'special') ? specialQuestionsByDate : questionsByDate;
    
    let html = '';
    
    // 현세(최신) 먼저, 그 다음 고대(기존)
    const sortedKeys = Object.keys(byDate).sort((a, b) => {
        if (byDate[a].isLatest && !byDate[b].isLatest) return -1;
        if (!byDate[a].isLatest && byDate[b].isLatest) return 1;
        return 0;
    });
    
    sortedKeys.forEach(key => {
        const dateData = byDate[key];
        const epochIcon = dateData.epochIcon || (dateData.isLatest ? '⚔️' : '🏛️');
        const epochBadge = dateData.epochBadge || (dateData.isLatest ? '현세' : '고대');
        const badgeClass = (epochBadge === '구시대' || epochBadge === '고대') ? 'old' : '';
        const typeIcon = dateData.typeIcon || '';
        const typeBadge = dateData.typeBadge || '';
        
        html += `
        <div class="date-group">
            <div class="date-header">
                <span class="date-icon">${epochIcon}</span>
                <div>
                    <div class="date-title">${dateData.name}</div>
                    <div class="date-subtitle">${dateData.subtitle}</div>
                </div>
                <div style="display:flex;gap:8px;align-items:center;">
                    <span class="date-badge ${badgeClass}">${epochBadge}</span>
                    ${typeBadge ? `<span class="date-badge" style="background:rgba(52,152,219,0.18);border-color:rgba(52,152,219,0.35);">${typeIcon} ${typeBadge}</span>` : ''}
                </div>
            </div>
            <div class="set-list">`;
        
        dateData.sets.forEach((set, idx) => {
            const attempted = set.questions.filter(q => stats[q.id]).length;
            const progress = Math.round((attempted / set.questions.length) * 100);
            
            // 난이도 분포 표시
            const lvl1 = set.questions.filter(q => q.level === 1).length;
            const lvl2 = set.questions.filter(q => q.level === 2).length;
            const lvl3 = set.questions.filter(q => q.level === 3).length;
            
            html += `
            <div class="set-card" onclick="selectSet('${key}', ${idx})">
                <div class="set-number">${idx + 1}</div>
                <div class="set-info">
                    ${set.name}<br>
                    <span style="font-size:0.7rem;color:var(--text-dim);">
                        ${set.questions.length}문제 · 
                        <span style="color:#27ae60;">Lv1:${lvl1}</span>
                        <span style="color:#f39c12;">Lv2:${lvl2}</span>
                        <span style="color:#e74c3c;">Lv3:${lvl3}</span>
                    </span>
                </div>
                <div class="set-progress">
                    <div class="set-progress-fill" style="width: ${progress}%"></div>
                </div>
            </div>`;
        });
        
        html += '</div></div>';
    });
    
    container.innerHTML = html;
}

// renderSetList를 대체
function renderSetList() {
    renderSetListWithEpoch();
}

// ===== 아카이브 요약 - 등급별 통계 추가 =====
function renderArchiveSummaryWithLevels(container) {
    const history = getBattleHistory(archiveBank);
    const stats = getQuestionStats(archiveBank);
    const bankQuestions = (archiveBank === 'special') ? specialQuestions : allQuestions;
    const bankName = archiveBank === 'special' ? '결정의 탑' : '기초의 미궁';
    
    // 기본 통계
    const totalAttempts = Object.values(stats).reduce((sum, s) => sum + s.attempts, 0);
    const totalCorrect = Object.values(stats).reduce((sum, s) => sum + s.correct, 0);
    const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
    const uniqueQ = Object.keys(stats).length;
    const weakQ = Object.keys(stats).filter(id => stats[id].wrong > 0).length;
    const masteredQ = Object.keys(stats).filter(id => stats[id].correct > 0 && stats[id].wrong === 0).length;
    const notAttemptedQ = bankQuestions.length - uniqueQ;
    
    // 등급별 통계 계산
    const levelStats = { 1: { attempts: 0, correct: 0 }, 2: { attempts: 0, correct: 0 }, 3: { attempts: 0, correct: 0 } };
    Object.keys(stats).forEach(id => {
        const q = bankQuestions.find(q => q.id === parseInt(id));
        if (q) {
            const level = q.level || 1;
            levelStats[level].attempts += stats[id].attempts;
            levelStats[level].correct += stats[id].correct;
        }
    });
    
    let html = `
    <div style="margin-bottom:15px;padding:15px;background:rgba(255,255,255,0.03);border-radius:12px;border:1px solid var(--border-ornate);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <span style="font-family:'Cinzel',serif;color:var(--accent-gold);font-size:1.1rem;">🏰 ${bankName}</span>
            <span style="color:var(--text-dim);font-size:0.8rem;">총 ${bankQuestions.length}문제</span>
        </div>
        
        <!-- 전체 정확도 -->
        <div style="text-align:center;margin-bottom:15px;">
            <div style="font-size:2.5rem;font-weight:700;color:${accuracy >= 70 ? '#27ae60' : accuracy >= 50 ? '#f39c12' : '#e74c3c'};">${accuracy}%</div>
            <div style="font-size:0.8rem;color:var(--text-dim);">전체 정답률 (${totalCorrect}/${totalAttempts})</div>
        </div>
        
        <!-- 등급별 정답률 -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:15px;">
            <div style="background:#27ae60;padding:10px;border-radius:8px;text-align:center;opacity:0.9;">
                <div style="font-size:0.7rem;color:rgba(255,255,255,0.8);">Lv.1 기초</div>
                <div style="font-size:1.2rem;font-weight:700;color:white;">${levelStats[1].attempts > 0 ? Math.round((levelStats[1].correct / levelStats[1].attempts) * 100) : '-'}%</div>
            </div>
            <div style="background:#f39c12;padding:10px;border-radius:8px;text-align:center;opacity:0.9;">
                <div style="font-size:0.7rem;color:rgba(255,255,255,0.8);">Lv.2 심화</div>
                <div style="font-size:1.2rem;font-weight:700;color:white;">${levelStats[2].attempts > 0 ? Math.round((levelStats[2].correct / levelStats[2].attempts) * 100) : '-'}%</div>
            </div>
            <div style="background:#e74c3c;padding:10px;border-radius:8px;text-align:center;opacity:0.9;">
                <div style="font-size:0.7rem;color:rgba(255,255,255,0.8);">Lv.3 고급</div>
                <div style="font-size:1.2rem;font-weight:700;color:white;">${levelStats[3].attempts > 0 ? Math.round((levelStats[3].correct / levelStats[3].attempts) * 100) : '-'}%</div>
            </div>
        </div>
        
        <!-- 문제 상태 분포 -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;">
            <div style="background:rgba(39,174,96,0.15);padding:10px 5px;border-radius:8px;text-align:center;">
                <div style="font-size:1.1rem;color:#27ae60;font-weight:700;">${masteredQ}</div>
                <div style="font-size:0.65rem;color:var(--text-dim);">완벽</div>
            </div>
            <div style="background:rgba(231,76,60,0.15);padding:10px 5px;border-radius:8px;text-align:center;">
                <div style="font-size:1.1rem;color:#e74c3c;font-weight:700;">${weakQ}</div>
                <div style="font-size:0.65rem;color:var(--text-dim);">균열</div>
            </div>
            <div style="background:rgba(255,255,255,0.05);padding:10px 5px;border-radius:8px;text-align:center;">
                <div style="font-size:1.1rem;color:var(--text-dim);font-weight:700;">${notAttemptedQ}</div>
                <div style="font-size:0.65rem;color:var(--text-dim);">미도전</div>
            </div>
            <div style="background:rgba(255,215,0,0.1);padding:10px 5px;border-radius:8px;text-align:center;">
                <div style="font-size:1.1rem;color:var(--accent-gold);font-weight:700;">${history.length}</div>
                <div style="font-size:0.65rem;color:var(--text-dim);">출정</div>
            </div>
        </div>
    </div>
    
    <!-- 최근 전투 -->
    <div style="margin-bottom:15px;">
        <div style="font-family:'Cinzel',serif;color:var(--accent-gold);margin-bottom:8px;">⚔️ 최근 전투</div>
        <div class="history-list">
            ${history.slice(0, 5).map(h => `
                <div class="history-item">
                    <span>${h.isCorrect !== undefined ? (h.isCorrect ? '⚔️' : '💀') : '⚔️'} ${h.accuracy}%</span>
                    <span>${new Date(h.date).toLocaleDateString()}</span>
                </div>
            `).join('') || '<p style="color:var(--text-dim);padding:20px;text-align:center;">기록 없음</p>'}
        </div>
    </div>`;
    
    container.innerHTML = html;
}

// renderArchiveSummary를 대체
function renderArchiveSummary(container) {
    renderArchiveSummaryWithLevels(container);
}

// ===== 내보내기 기능 수정 - 등급별 통계 포함 =====
function exportAllReportsJSONWithLevels() {
    const keys = _storeKeysForBank(archiveBank);
    const feedbacks = JSON.parse(localStorage.getItem(keys.feedbacks) || '{}');
    const notes = JSON.parse(localStorage.getItem(keys.notes) || '{}');
    const appReview = localStorage.getItem('psat_app_review_' + archiveBank) || '';
    const stats = getQuestionStats(archiveBank);
    const history = getBattleHistory(archiveBank);
    const bankQuestions = (archiveBank === 'special') ? specialQuestions : allQuestions;

    // 전체 통계 계산
    const totalAttempts = Object.values(stats).reduce((sum, s) => sum + s.attempts, 0);
    const totalCorrect = Object.values(stats).reduce((sum, s) => sum + s.correct, 0);
    const overallAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

    // 난이도별 통계
    const levelStats = { 1: { attempts: 0, correct: 0 }, 2: { attempts: 0, correct: 0 }, 3: { attempts: 0, correct: 0 } };
    Object.keys(stats).forEach(id => {
        const q = bankQuestions.find(q => q.id === parseInt(id));
        if (q) {
            const level = q.level || 1;
            levelStats[level].attempts += stats[id].attempts;
            levelStats[level].correct += stats[id].correct;
        }
    });
    
    // 시대별 통계
    const modernQuestions = bankQuestions.filter(q => q.epoch === '현세');
    const ancientQuestions = bankQuestions.filter(q => q.epoch === '고대' || !q.epoch);
    
    const modernStats = { attempts: 0, correct: 0 };
    const ancientStats = { attempts: 0, correct: 0 };
    
    Object.keys(stats).forEach(id => {
        const q = bankQuestions.find(q => q.id === parseInt(id));
        if (q) {
            if (q.epoch === '현세') {
                modernStats.attempts += stats[id].attempts;
                modernStats.correct += stats[id].correct;
            } else {
                ancientStats.attempts += stats[id].attempts;
                ancientStats.correct += stats[id].correct;
            }
        }
    });

    const exportData = {
        exportDate: new Date().toISOString(),
        bank: archiveBank === 'special' ? '결정의 탑' : '기초의 미궁',
        
        systemReview: {
            note: appReview,
            lastUpdated: appReview ? new Date().toISOString() : null
        },

        overallStats: {
            totalQuestionsInBank: bankQuestions.length,
            totalBattles: history.length,
            totalQuestionsAttempted: Object.keys(stats).length,
            progressRate: Math.round((Object.keys(stats).length / bankQuestions.length) * 100),
            totalAttempts: totalAttempts,
            totalCorrect: totalCorrect,
            totalWrong: totalAttempts - totalCorrect,
            overallAccuracy: overallAccuracy,
            weakQuestions: Object.keys(stats).filter(id => stats[id].wrong > 0).length,
            masteredQuestions: Object.keys(stats).filter(id => stats[id].correct > 0 && stats[id].wrong === 0).length
        },

        levelStats: {
            level1: { 
                attempts: levelStats[1].attempts, 
                correct: levelStats[1].correct, 
                accuracy: levelStats[1].attempts > 0 ? Math.round((levelStats[1].correct / levelStats[1].attempts) * 100) : 0 
            },
            level2: { 
                attempts: levelStats[2].attempts, 
                correct: levelStats[2].correct, 
                accuracy: levelStats[2].attempts > 0 ? Math.round((levelStats[2].correct / levelStats[2].attempts) * 100) : 0 
            },
            level3: { 
                attempts: levelStats[3].attempts, 
                correct: levelStats[3].correct, 
                accuracy: levelStats[3].attempts > 0 ? Math.round((levelStats[3].correct / levelStats[3].attempts) * 100) : 0 
            }
        },
        
        epochStats: {
            modern: {
                totalQuestions: modernQuestions.length,
                attempts: modernStats.attempts,
                correct: modernStats.correct,
                accuracy: modernStats.attempts > 0 ? Math.round((modernStats.correct / modernStats.attempts) * 100) : 0
            },
            ancient: {
                totalQuestions: ancientQuestions.length,
                attempts: ancientStats.attempts,
                correct: ancientStats.correct,
                accuracy: ancientStats.attempts > 0 ? Math.round((ancientStats.correct / ancientStats.attempts) * 100) : 0
            }
        },

        recentBattles: history.slice(0, 10).map(h => ({
            date: h.date,
            type: h.type,
            accuracy: h.accuracy,
            correct: h.correct,
            wrong: h.wrong,
            totalTime: h.totalTime
        })),

        battleReports: Object.entries(feedbacks).map(([id, fb]) => {
            const question = bankQuestions.find(q => q.id === parseInt(id));
            const qStats = stats[id] || {};
            return {
                questionId: parseInt(id),
                code: fb.code,
                feedback: fb.text,
                feedbackDate: fb.date,
                questionData: question ? {
                    stem: question.stem,
                    options: question.options,
                    correctAnswer: question.answerIndex,
                    level: question.level,
                    epoch: question ? getEpochLabelByAddedTime(question) : '과거'
                } : null,
                statistics: {
                    attempts: qStats.attempts || 0,
                    correct: qStats.correct || 0,
                    wrong: qStats.wrong || 0,
                    accuracy: qStats.attempts ? Math.round((qStats.correct / qStats.attempts) * 100) : 0,
                    avgTime: qStats.avgTime || 0
                }
            };
        }),

        questionNotes: Object.entries(notes).map(([id, n]) => ({
            questionId: parseInt(id),
            code: n.code,
            note: n.text,
            noteDate: n.date
        })),

        weaknessQuestions: Object.keys(stats)
            .filter(id => stats[id].wrong > 0)
            .map(id => {
                const question = bankQuestions.find(q => q.id === parseInt(id));
                const qStats = stats[id];
                return {
                    questionId: parseInt(id),
                    code: question?.code || 'Q' + id,
                    stem: question?.stem || '',
                    level: question?.level || 0,
                    epoch: question ? getEpochLabelByAddedTime(question) : '과거',
                    wrongRate: Math.round((qStats.wrong / qStats.attempts) * 100),
                    attempts: qStats.attempts,
                    wrong: qStats.wrong
                };
            })
            .sort((a, b) => b.wrongRate - a.wrongRate)
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'psat_report_' + archiveBank + '_' + new Date().toISOString().split('T')[0] + '.json';
    a.click();
    URL.revokeObjectURL(url);
}

// exportAllReportsJSON을 대체
function exportAllReportsJSON() {
    exportAllReportsJSONWithLevels();
}

// ===== renderQuestion을 대체 =====
const originalRenderQuestion = typeof renderQuestion === 'function' ? renderQuestion : null;
function renderQuestion() {
    renderQuestionWithLevelMonster();
}

console.log('PSAT Dungeon 업데이트 모듈 로드됨: 등급별 몬스터 + 시대별 분류');
