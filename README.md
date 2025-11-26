# 🎨 만화책 이어쓰기 게임

초등학생을 위한 협동 학습형 실시간 이야기 만들기 게임

## 📁 파일 구조

```
/
├── index.html      # HTML 구조 (메인 파일)
├── style.css       # 모든 스타일 (디자인)
├── app.js          # JavaScript 로직 (기능)
└── README.md       # 사용 설명서
```

## 🚀 시작하기

### 1. Firebase 설정

`app.js` 파일을 열고 Firebase 설정을 입력하세요 (약 1-15줄):

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",              // 여기에 실제 값 입력
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### 2. 파일 배포

세 파일을 모두 같은 폴더에 넣고 `index.html`을 브라우저로 엽니다.

## 🎮 기능 설명

### 선생님 기능
- ✅ 조 개수 동적 조절 (1~10개)
- ✅ 학생 추가 및 조 배정
- ✅ 이야기 주제 설정
- ✅ 바퀴수 제한 (무제한 가능)
- ✅ 게임 시작/종료/초기화
- ✅ 실시간 팀 모니터링
- ✅ 조별 상세 결과 보기

### 학생 기능
- ✅ 조별 이야기 작성
- ✅ 차례 시스템 (순서 자동 관리)
- ✅ 실시간 동기화
- ✅ 문장 수정 (자기 차례에만)
- ✅ 전체 이야기 보기

## 🎯 수정 가이드

### 글자 크기 변경
`style.css`에서 원하는 요소의 `font-size` 값을 수정:

```css
/* 예시: 학생 문장 크기 변경 */
.sentence-text {
    font-size: 24px;  /* 이 값을 변경 */
}
```

### 색상 변경
`style.css`에서 색상 코드를 변경:

```css
/* 예시: 메인 색상 변경 */
body {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    /* 색상 코드 변경 */
}
```

### 기능 추가/수정
`app.js`에서 함수를 수정하거나 추가:

```javascript
// 예시: 알림 시간 변경
function showNotification(message, type = 'success') {
    // ...
    setTimeout(() => {
        // ...
    }, 3000);  // 3초 -> 원하는 시간으로 변경
}
```

## 🔑 로그인 정보

### 선생님
- 비밀번호: `teacher1234`
- `app.js`의 `teacherLogin()` 함수에서 변경 가능

### 학생
- 선생님이 등록한 학생만 로그인 가능

## 📊 데이터베이스 구조

```
firebase-database/
├── students/           # 학생 정보
│   └── {studentId}
│       ├── id
│       ├── name
│       ├── team
│       └── createdAt
├── stories/            # 문장 데이터
│   └── {storyId}
│       ├── id
│       ├── team
│       ├── author
│       ├── text
│       └── timestamp
├── game/              # 게임 상태
│   ├── status
│   ├── topic
│   ├── maxRounds
│   └── teamCount
├── activeWriters/     # 현재 입력 중
└── turnOrder/         # 차례 관리
    └── team{N}
        ├── currentTurn
        ├── members
        └── maxRounds
```

## 🎨 디자인 특징

- 만화책 스타일 UI
- 귀여운 말풍선 디자인
- 애니메이션 효과
- 반응형 레이아웃 (모바일 지원)

## 🆕 최근 업데이트

### v2.0 (파일 분리)
- HTML, CSS, JavaScript 분리
- 관리 용이성 대폭 향상
- 글자 크기 전반적으로 증가 (가독성 개선)
- 상세보기 레이아웃 개선:
  * 전체 이야기 확대 (font-size: 26px, min-height: 200px)
  * 작성자별 통계를 맨 밑으로 이동
  * 문장별 상세를 중간에 배치

### v1.0
- 기본 기능 구현
- 실시간 동기화
- 차례 시스템

## 🐛 문제 해결

### 화면이 안 바뀔 때
브라우저 강력 새로고침:
- Windows/Linux: `Ctrl + F5` 또는 `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

### Firebase 연결 오류
1. `app.js`의 Firebase 설정 확인
2. Firebase Console에서 Realtime Database 활성화
3. 보안 규칙 설정:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

### 학생이 로그인 안 될 때
- 선생님이 먼저 학생을 등록했는지 확인
- 이름을 정확히 입력했는지 확인

## 📝 파일별 설명

### index.html
- 페이지 구조만 담당
- 로그인 화면, 게임 화면, 모달 등의 HTML 요소
- 수정이 가장 적음

### style.css
- 모든 디자인 담당
- 색상, 크기, 레이아웃, 애니메이션
- 디자인 변경 시 이 파일만 수정

### app.js
- 모든 기능 로직 담당
- Firebase 연동, 게임 제어, 실시간 동기화
- 기능 추가/변경 시 이 파일만 수정

## 💡 관리 팁

### 디자인만 변경할 때
→ `style.css`만 수정

### 기능만 변경할 때
→ `app.js`만 수정

### 구조를 변경할 때
→ `index.html` + `style.css` + `app.js` 모두 수정 필요

### 백업 권장
중요한 수정 전에는 세 파일 모두 복사해두기!

## 📞 지원

문제가 있거나 기능 추가를 원하시면 문의하세요!

---

**제작**: 초등학생 교육용 게임
**버전**: 2.0 (파일 분리 버전)
**최종 업데이트**: 2025
