# 🏰 PSAT 던전 (PSAT Dungeon)

**지식의 던전에서 몬스터를 처치하라!**

PSAT 문제를 게이미피케이션한 학습 도구입니다. 던전 탐험 컨셉으로 문제를 풀며, 취약한 부분을 집중 공략할 수 있습니다.

![PSAT Dungeon](assets/dungeon-entrance.png)

## 🎮 주요 기능

### 던전 시스템
- **시련의 회랑** (정규 던전): 30문제 세트로 구성된 정규 던전런
- **망각의 심연** (약점 던전): 틀린 문제들을 모아 재도전

### 전투 시스템
- 문제를 풀면 몬스터를 공격하는 이펙트
- 실시간 타이머로 긴박감 조성
- 일시정지 시 문제 숨김 처리

### 기록 & 분석
- 문제별 오답률/풀이시간 자동 집계
- 취약 문제 자동 선별
- 던전런 히스토리 저장

### 아카이브
- 전체 기록 통계
- 세트별 문제 열람
- 취약 문제 목록
- 개선사항 메모 (GPT 연동용)

### 피드백 시스템
- 문제별 피드백 기록
- GPT를 통한 문제 개선에 활용 가능

## 📱 사용 방법

### GitHub Pages 배포

1. 이 저장소를 Fork 하거나 Clone 합니다
2. GitHub 저장소 Settings → Pages로 이동
3. Source를 `main` 브랜치로 설정
4. 자동 배포 완료 후 URL 접속

### 로컬 실행

```bash
# 저장소 클론
git clone https://github.com/your-username/psat-dungeon.git

# 디렉토리 이동
cd psat-dungeon

# 로컬 서버 실행 (Python 3)
python -m http.server 8000

# 브라우저에서 접속
open http://localhost:8000
```

## 📁 파일 구조

```
psat-dungeon/
├── index.html          # 메인 게임 파일
├── questions.json      # 문제 데이터
├── README.md           # 이 파일
└── assets/
    ├── dungeon-entrance.png  # 메인 이미지
    └── dungeon-icon.jpeg     # 아이콘
```

## 🔧 문제 추가/수정

### questions.json 형식

```json
[
  {
    "id": 1,
    "code": "A1-01",
    "area": "A",
    "level": 1,
    "stem": "문제 내용...",
    "options": ["①선택지1", "②선택지2", "③선택지3", "④선택지4", "⑤선택지5"],
    "answer": "D",
    "answerIndex": 3
  }
]
```

### 새 버전 문제 추가

1. `questions.json` 파일에 새 문제 추가
2. 자동으로 새 세트가 생성됨
3. 기존 세트는 "구버전"으로 표시됨

## ⚙️ 설정 옵션

- **문제 수**: 던전런당 10/20/30/50문제
- **타이머 경고**: 60/90/120초 또는 끄기
- **데이터 초기화**: 모든 기록 삭제

## 📊 데이터 저장

모든 데이터는 브라우저 LocalStorage에 저장됩니다:
- 문제별 통계
- 던전런 히스토리
- 문제 피드백
- 메모

## 🎨 디자인

- 다크 던전 테마
- 모바일 최적화 UI
- 명조체 기반 가독성
- 공격 이펙트 애니메이션

## 📝 라이선스

MIT License

---

**PSAT 던전으로 시험 준비의 여정을 시작하세요! ⚔️**
