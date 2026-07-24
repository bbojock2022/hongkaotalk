# Wavelength — 실시간 멀티유저 웹 메신저

Discord 스타일 3단 레이아웃(채팅방 목록 / 메시지 / 접속자 목록)의 실시간 채팅 앱입니다.
React + Vite + Tailwind CSS 프론트엔드, Firebase(Auth / Firestore / Storage / Realtime Database) 백엔드로 구성되어 있고,
Cloudflare Pages에 정적 배포합니다.

## 폴더 구조

```
src/
├ components/   재사용 UI 컴포넌트 (방 목록, 메시지, 입력창, 멤버 목록, 모달 등)
├ pages/        Login / Signup / ChatApp
├ firebase/     Firebase 초기화 및 Auth·Firestore·Storage·Presence 래퍼 함수
├ utils/        XSS 방어, 입력값 검증, 비밀번호 해시, 스팸 방지
└ styles/       Tailwind 다크 테마

firestore.rules      Firestore 보안 규칙
storage.rules         Storage 보안 규칙
database.rules.json  Realtime Database 보안 규칙 (온라인 상태 전용)
firebase.json         Firebase CLI 배포 설정
```

## 1. 로컬 설치

```bash
npm install
cp .env.example .env
```

**⚠️ 여기는 사용자가 직접 해야 합니다:** `.env` 파일을 열어 아래 값을 채워주세요.

| 변수 | 어디서 가져오나요 |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase 콘솔 → 프로젝트 설정(⚙️) → 일반 탭 → 내 앱 → SDK 설정 및 구성 |
| `VITE_FIREBASE_AUTH_DOMAIN` | 위와 동일 |
| `VITE_FIREBASE_PROJECT_ID` | 위와 동일 |
| `VITE_FIREBASE_STORAGE_BUCKET` | 위와 동일 |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | 위와 동일 |
| `VITE_FIREBASE_APP_ID` | 위와 동일 |
| `VITE_FIREBASE_DATABASE_URL` | Firebase 콘솔 → Realtime Database → 데이터베이스 만들기 후 상단에 표시되는 URL |

앱이 아직 없다면: 프로젝트 설정 → 일반 탭 맨 아래 "내 앱" → `</>` (웹) 아이콘 클릭 → 앱 등록 → 값 자동 생성.

```bash
npm run dev
```

## 2. Firebase 콘솔에서 미리 해둘 것

**⚠️ 아래는 전부 사용자가 Firebase 콘솔에서 직접 해야 합니다.**

1. **Authentication** → 로그인 방법 → "이메일/비밀번호" 사용 설정
2. **Firestore Database** → 데이터베이스 만들기 (프로덕션 모드) — 위치는 가까운 리전(예: asia-northeast3, 서울) 권장
3. **Storage** → 시작하기로 활성화
4. **Realtime Database** → 만들기 (테스트/잠금 모드 아무거나 선택, 규칙은 아래에서 배포로 덮어씀)
5. Firebase CLI로 보안 규칙 배포:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add   # 본인 프로젝트 선택
   firebase deploy --only firestore:rules,storage:rules,database
   ```

## 3. Cloudflare Pages 배포 (GitHub 없이, 직접 업로드)

GitHub을 쓰지 않아도 배포할 수 있습니다. Cloudflare Pages의 **Direct Upload(직접 업로드)** 기능을 사용합니다 —
로컬에서 미리 빌드한 결과물을 그대로 Cloudflare에 올리는 방식이라 Git 저장소가 아예 필요 없습니다.

**⚠️ 아래는 전부 사용자가 직접 진행해야 합니다.**

### 1) 로컬에서 빌드하기
Git에 올리지 않으므로, 환경 변수는 Cloudflare 대시보드가 아니라 **로컬 `.env` 파일에 미리 채워둔 상태로 빌드**해야
Firebase 값이 결과물(JS 번들)에 그대로 포함됩니다.
```bash
# .env 파일에 Firebase 값이 다 채워져 있는지 먼저 확인
npm run build
```
`dist/` 폴더가 생성됩니다. 이 폴더가 곧 업로드할 결과물입니다.

### 2-A) 방법 1 — Cloudflare 대시보드에서 드래그 앤 드롭 (가장 쉬움)
1. https://dash.cloudflare.com → Workers & Pages → "Create application" → "Pages" 탭 → **"Upload assets"** 선택 (Git 연결 아님)
2. 프로젝트 이름 입력 (예: `wavelength-messenger`)
3. `dist` 폴더를 통째로 드래그해서 업로드
4. 완료되면 `https://wavelength-messenger.pages.dev` 같은 주소가 발급됩니다

이후 코드를 수정할 때마다 `npm run build` → 같은 화면에서 "Create new deployment" → `dist` 폴더 다시 업로드하면 됩니다.

### 2-B) 방법 2 — Wrangler CLI로 명령어 배포 (반복 배포가 잦다면 편함)
```bash
npm install -g wrangler
wrangler login              # 브라우저가 열리고 Cloudflare 계정 로그인
wrangler pages deploy dist --project-name=wavelength-messenger
```
이후에는 코드 수정 → `npm run build` → 위 `wrangler pages deploy dist ...` 명령만 다시 실행하면 재배포됩니다.

### 3) Firebase와 연결 확인
배포 후 Firebase 콘솔 → Authentication → Settings → "승인된 도메인"에
Cloudflare가 발급한 도메인(예: `wavelength-messenger.pages.dev`)을 추가해야 로그인이 정상 작동합니다.

> 참고: 이 방식은 환경 변수가 이미 빌드 시점에 JS 파일 안에 박혀 들어가므로, Cloudflare Pages의 "Environment variables" 설정은 필요 없습니다. 다만 Firebase API Key 등은 클라이언트에 노출되는 게 원래 정상입니다(Firebase 보안은 Security Rules가 담당) — 위 2장에서 배포한 규칙이 실제 방어선입니다.

## 4. 보안 한계 — 반드시 읽어주세요

이 프로젝트는 **Firebase Spark(무료) 플랜** 기준으로 설계되어 Cloud Functions를 사용하지 않습니다. 그로 인한 한계:

- **비밀번호 채팅방**: 서버 검증 대신 브라우저에서 SHA-256으로 해시해 비교합니다. Firestore 규칙상 로그인한 사용자는 해시값 자체는 읽을 수 있어 완전한 서버사이드 인증만큼 안전하지 않습니다. 정말 민감한 용도라면 Blaze 플랜으로 업그레이드해 Cloud Functions로 검증 로직을 옮기는 것을 권장합니다.
- **스팸 방지**: 클라이언트 사이드 rate limit(짧은 시간 내 과다 전송 차단)만 적용되어 있습니다. 악의적인 사용자가 클라이언트를 우회하면 무력화될 수 있습니다. 강력한 방지가 필요하면 App Check 활성화 또는 Blaze + Cloud Functions로 서버단 검증을 추가하세요.
- **시스템 메시지(입장/퇴장 알림)**: 인증된 사용자라면 누구나 `senderUid: 'system'` 메시지를 생성할 수 있는 구조입니다 (소규모/친구 단위 사용을 전제).

이런 한계들은 "친구/팀 단위 소규모 사용"에는 실질적으로 큰 문제가 되지 않지만, 불특정 다수에게 공개하는 서비스로 키우실 경우 Blaze 플랜 업그레이드 + Cloud Functions 도입을 권장드립니다.

## 5. 기능 목록

- 회원가입 / 로그인 / 로그아웃, 닉네임, 온라인 상태·마지막 접속 시간
- 실시간 채팅 (Firestore `onSnapshot` 기반), 타임스탬프, 자동 스크롤, 입/퇴장 알림
- 채팅방 생성·목록·공개방·비밀번호방
- Discord식 3단 레이아웃, 모바일에서는 자동으로 1단 레이아웃(뒤로가기 버튼)으로 전환
- 이모지 선택기, 이미지 전송(Storage), 메시지 삭제(soft delete), 답장, `@닉네임` 멘션(자동완성 포함), 메시지 검색
- XSS 방어(DOMPurify), 입력값 검증, 클라이언트 사이드 스팸 방지, Firestore/Storage/RTDB 보안 규칙
