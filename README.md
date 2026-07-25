# Wavelength — 실시간 멀티유저 웹 메신저

Discord 스타일 3단 레이아웃(채팅방 목록 / 메시지 / 접속자 목록)을 가진 실시간 채팅 웹앱입니다.
브라우저에서 접속해서 쓰는 **웹앱**이며(네이티브 앱 아님), 모바일에서는 반응형으로 자동 전환됩니다.

---

## 1. 기능 목록

### 사용자 시스템
- 이메일/비밀번호 회원가입, 로그인, 로그아웃
- 닉네임 설정 (가입 시 지정, 2~20자)
- 온라인/오프라인 상태 실시간 표시
- 마지막 접속 시간 기록

### 실시간 채팅
- Firestore 실시간 구독(`onSnapshot`) 기반 — 메시지가 전체 참여자에게 즉시 전달
- 메시지별 작성 시각 표시
- 새 메시지 도착 시 자동 스크롤 (사용자가 위로 스크롤해 과거 메시지를 보는 중이면 자동 스크롤 안 함)
- 입장/퇴장 시스템 메시지 알림

### 채팅방 시스템
- **채팅방 종류 3가지**
  - **오픈채팅**: 메인 화면(왼쪽 목록)에 항상 공개 표시, 누구나 자유롭게 입장
  - **팀채팅**: 목록에 공개되지 않고, 초대받은 사람만 입장 가능
  - **단체채팅**: 팀채팅과 동일하게 초대 전용 (친목/모임용으로 라벨만 구분)
- **1:1 다이렉트 메시지(DM)**: 친구 목록에서 바로 시작, 사이드바에 별도 섹션으로 표시 (접속자 목록 없이 순수 1:1 대화)
- 공개 채팅방 / 비밀번호 채팅방 (모든 종류에 적용 가능)
- **비밀번호 계정별 1회 입력**: 한 번 맞춘 비밀번호는 그 계정에서는 다시 묻지 않고 바로 입장
- 채팅방 입장 시 참여자 목록에 자동 등록, 퇴장 시 자동 해제 (오픈/팀/단체채팅만 해당, DM은 입장 알림 없음)
- **방장(👑)**: 방을 만든 사람이 자동으로 방장이 되며, 접속자 목록에 왕관 배지로 표시
- **방 삭제**: 방장만 채팅방을 삭제할 수 있음 (확인 모달 후 삭제)
- **강퇴(추방)**: 방장이 다른 참여자를 방에서 내보낼 수 있음. 강퇴된 사용자는 같은 방에 다시 입장할 수 없도록 서버 규칙으로 차단됨

### 친구 & 초대
- 닉네임으로 사용자 검색 → 친구 요청 보내기 (**상대방이 오프라인이어도 요청 가능**)
- 친구 요청 수락/거절 (알림 벨에서 실시간 확인)
- 내 친구 목록 (친구 삭제 가능)
- 친구를 현재 보고 있는 팀/단체채팅방으로 초대 (초대 알림을 받은 친구는 알림 벨에서 바로 "입장" 가능)
- 친구와 1:1 채팅(DM) 바로 시작 — 상대는 대화 신청 알림을 받고 "입장"하면 대화창이 열림

### 메시지 기능
- 이모지 선택기
- 메시지 삭제 (soft delete — 삭제 표시만 남고 내용은 지워짐)
- 답장(reply) — 원본 메시지 미리보기와 함께 전송
- `@닉네임` 멘션 — 입력 중 자동완성 목록 표시, 멘션된 텍스트 하이라이트
- 메시지 검색 (방 안에서 키워드로 검색)

### UI/디자인
- Discord식 3단 레이아웃: 왼쪽 채팅방 목록 / 가운데 메시지 / 오른쪽 접속자 목록
- 다크 모드 전용 디자인 (Tailwind 커스텀 팔레트)
- 부드러운 트랜지션·애니메이션 (fade/slide/pop)
- 모바일 반응형: 화면이 좁아지면 3단 → 1단으로 전환되고, 각 패널을 뒤로가기 버튼으로 오갑니다

### 보안
- XSS 방어: 모든 사용자 입력(메시지, 닉네임, 방 이름)을 DOMPurify로 새니타이즈 후 렌더링
- 입력값 검증: 닉네임/이메일/비밀번호/방 이름/메시지 길이 및 형식 검증
- 클라이언트 사이드 스팸 방지: 짧은 시간 내 과도한 메시지 전송 차단 (rate limiter)
- 비밀번호 채팅방: 평문 대신 Web Crypto API(SHA-256 + salt) 해시로 저장·검증
- Firestore / Realtime Database 보안 규칙으로 서버 단 접근 제어

---

## 2. 서버 구조 (아키텍처)

이 프로젝트에는 별도의 백엔드 서버가 없습니다. **Firebase가 곧 백엔드**이고, 브라우저가 Firebase SDK로 직접 통신합니다.

```
┌─────────────────────────┐
│   사용자 브라우저(클라이언트)   │
│  React SPA (Vite 빌드)   │
└───────────┬─────────────┘
            │ Firebase SDK (HTTPS/WebSocket)
            ▼
┌─────────────────────────────────────────────┐
│                Firebase                       │
│                                                │
│  Authentication  — 회원가입/로그인 (이메일·비밀번호)   │
│  Firestore       — 채팅방, 메시지, 사용자 프로필       │
│  Realtime DB     — 접속자 온라인/오프라인 상태(presence)│
│                                                │
│  Firestore/RTDB 보안 규칙(Security Rules)이       │
│  실질적인 "서버 로직/권한 검증" 역할을 담당            │
└─────────────────────────────────────────────┘
            ▲
            │ 정적 파일(HTML/CSS/JS)만 서빙
┌───────────┴─────────────┐
│     Cloudflare Pages      │
│  (프론트엔드 정적 호스팅)     │
└─────────────────────────┘
```

- **Cloudflare Pages**는 빌드된 정적 파일(`dist/`)만 서빙하는 역할이며, 로그인·DB·실시간 통신과는 무관합니다.
- **Firebase Storage는 사용하지 않습니다.** 이미지 전송 기능이 없고, Authentication + Firestore + Realtime Database만으로 동작하기 때문에 **Spark(무료) 플랜 안에서 100% 무료로 운영**할 수 있습니다.
- **Cloud Functions(서버 코드)도 사용하지 않습니다.** 비밀번호 검증, 스팸 방지 같은 로직은 브라우저(클라이언트)와 Firestore 보안 규칙 조합으로 처리합니다. (아래 "보안 한계" 참고)

### 데이터 모델

```
/users/{uid}
  - nickname, status(online/offline), lastSeen, createdAt

  /users/{uid}/friendRequests/{fromUid}   ← 받은 친구 요청함 (문서 id = 보낸 사람 uid)
    - fromUid, fromNickname, toUid, toNickname, createdAt

  /users/{uid}/roomInvites/{inviteId}     ← 받은 방 초대함 (팀/단체채팅 초대 + 1:1 대화 신청)
    - roomId, roomName, roomType, fromUid, fromNickname, createdAt

  /users/{uid}/myRooms/{roomId}           ← 내가 참여 중인 방 미러 (사이드바 "내 채팅방"/"DM" 목록용, 본인만 읽고 씀)
    - roomId, type, name, isPrivate, ownerUid, otherUid, otherNickname(DM 전용), updatedAt

  /users/{uid}/unlockedRooms/{roomId}     ← 비밀번호를 한 번 맞춘 방 기록 (계정별, 다음부터 재입력 생략)
    - unlockedAt

/friendships/{pairId}      ← pairId = 정렬된 "uidA_uidB"
  - members: [uidA, uidB], createdAt

/rooms/{roomId}
  - name, type('open'|'team'|'group'|'dm'), isPrivate, passwordHash, salt,
    ownerUid, ownerNickname, memberCount, createdAt, dmParticipants(DM 전용 uid 2개)

  /rooms/{roomId}/members/{uid}
    - nickname, joinedAt

  /rooms/{roomId}/banned/{uid}            ← 강퇴된 사용자 명단 (방장만 기록, 재입장 차단용)
    - bannedAt

  /rooms/{roomId}/messages/{messageId}
    - senderUid, senderNickname, text, replyTo, mentions[], deleted, createdAt

Realtime Database:
/status/{uid}
  - state(online/offline), nickname, lastChanged   ← onDisconnect로 접속 끊김 자동 감지
```

### 폴더 구조

```
/
├ index.html
├ package.json
├ vite.config.js / tailwind.config.js / postcss.config.js
├ src/
│  ├ components/    RoomList, MessageList, MessageItem, MessageInput,
│  │                 MemberList, CreateRoomModal, JoinPasswordModal, SearchBar,
│  │                 ConfirmModal, NotificationBell, FriendsModal
│  ├ pages/          Login, Signup, ChatApp
│  ├ firebase/       config(초기화), auth, firestore(방/메시지/비번기억/내방목록), presence, social(친구/DM/초대)
│  ├ utils/          sanitize(XSS 방어), validate(입력검증), hash(비밀번호 해시), rateLimit(스팸방지)
│  └ styles/         index.css (Tailwind + 다크테마)
├ firestore.rules          Firestore 보안 규칙
├ firestore.indexes.json    Firestore 인덱스 정의
├ database.rules.json      Realtime Database 보안 규칙
└ firebase.json             Firebase CLI 배포 설정
```

---

## 3. 로컬에서 실행하기 (선택사항 — 코드를 직접 수정/테스트하고 싶을 때)

```bash
npm install
cp .env.example .env
```

**⚠️ 사용자가 직접 해야 하는 부분:** `.env` 파일을 열어 아래 값을 채워주세요.

| 변수 | 어디서 가져오나요 |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase 콘솔 → 프로젝트 설정(⚙️) → 일반 탭 → 내 앱 → SDK 설정 및 구성 |
| `VITE_FIREBASE_AUTH_DOMAIN` | 위와 동일 |
| `VITE_FIREBASE_PROJECT_ID` | 위와 동일 |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | 위와 동일 |
| `VITE_FIREBASE_APP_ID` | 위와 동일 |
| `VITE_FIREBASE_DATABASE_URL` | Firebase 콘솔 → Realtime Database → 데이터베이스 만들기 후 상단에 표시되는 URL |

```bash
npm run dev
```

---

## 4. Firebase 콘솔 설정

**⚠️ 아래는 전부 사용자가 Firebase 콘솔(https://console.firebase.google.com)에서 직접 해야 합니다.**

1. 새 프로젝트 생성
2. **Authentication** → 로그인 방법 → "이메일/비밀번호" 사용 설정
3. **Firestore Database** → 데이터베이스 만들기 (프로덕션 모드 권장, 리전은 서울 `asia-northeast3` 등 가까운 곳)
4. **Realtime Database** → 데이터베이스 만들기
5. 프로젝트 설정 → 일반 탭 → 웹 앱 추가(`</>` 아이콘) → `.env`에 넣을 값 발급
6. **보안 규칙 등록** (권한 오류를 막기 위해 반드시 필요)
   - Firestore → "Rules" 탭 → 이 프로젝트의 `firestore.rules` 내용을 붙여넣고 게시
   - Realtime Database → "Rules" 탭 → 이 프로젝트의 `database.rules.json` 내용을 붙여넣고 게시
   - (CLI를 쓸 수 있다면 `firebase deploy --only firestore:rules,database` 로 한 번에 배포 가능)

> Storage는 사용하지 않으므로 활성화하지 않아도 됩니다.

---

## 5. 배포 방법 — Cloudflare Pages (GitHub 웹 업로드 기준, 터미널 불필요)

Git이나 npm 명령어를 몰라도 배포할 수 있는 방법입니다. GitHub 웹사이트에서 파일을 드래그해서 올리고, 실제 빌드(`npm install` + `npm run build`)는 Cloudflare 서버가 대신 처리합니다.

### 1) GitHub에 파일 업로드
1. https://github.com 접속 → 회원가입/로그인
2. 오른쪽 위 `+` → "New repository" → 이름 입력 → **License/README/`.gitignore`는 전부 선택 안 함(None)** → "Create repository"
   (이 프로젝트에는 이미 `README.md`, `.gitignore`가 포함되어 있어 GitHub이 새로 만들 필요 없음)
3. 빈 저장소 화면에서 "uploading an existing file" 클릭
4. 프로젝트 폴더 안의 파일/폴더를 전부 브라우저로 드래그 (단, `node_modules`, `dist`는 없어도 됨/올리지 않아도 됨)
5. "Commit changes" 클릭

### 2) Cloudflare Pages 연결
1. https://dash.cloudflare.com → **Workers & Pages** → **Create application** → **Pages** 탭 → **Connect to Git**
2. 방금 만든 GitHub 저장소 선택
3. 빌드 설정
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. **Environment variables**에서 `.env.example`에 있던 6개 값을 이름 그대로 등록:
   `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`,
   `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_DATABASE_URL`
5. **Save and Deploy** → 완료되면 `https://프로젝트이름.pages.dev` 주소 발급

### 3) Firebase와 연결 마무리
Firebase 콘솔 → Authentication → Settings → "승인된 도메인"에 Cloudflare가 발급한 도메인(`*.pages.dev`)을 추가해야 로그인이 작동합니다.

### 코드를 수정했을 때 재배포하는 법
GitHub 저장소에 바뀐 파일을 다시 업로드(덮어쓰기)만 하면, Cloudflare Pages가 자동으로 다시 빌드·배포합니다 (Git 연결 상태이므로 별도 명령 불필요).

> ⚠️ **주의**: 방장/강퇴/친구/채팅방 종류/DM 기능이 추가되면서 `firestore.rules`가 여러 번 바뀌었습니다. **Firebase 콘솔 → Firestore Database → Rules 탭에서 최신 `firestore.rules` 내용을 다시 게시(Publish)해야** 모든 기능이 "권한 없음" 에러 없이 작동합니다.

---

## 6. 보안 한계 — 반드시 읽어주세요

이 프로젝트는 **Firebase Spark(무료) 플랜** 기준으로 설계되어 Cloud Functions(서버 코드)를 사용하지 않습니다. 그로 인한 한계:

- **비밀번호 채팅방**: 서버 검증 대신 브라우저에서 SHA-256으로 해시해 비교합니다. Firestore 규칙상 로그인한 사용자는 해시값 자체를 읽을 수 있어 완전한 서버사이드 인증만큼 안전하지 않습니다. 민감한 용도라면 Blaze 플랜으로 업그레이드해 Cloud Functions로 검증 로직을 옮기는 것을 권장합니다.
- **스팸 방지**: 클라이언트 사이드 rate limit(짧은 시간 내 과다 전송 차단)만 적용되어 있습니다. 악의적인 사용자가 우회하면 무력화될 수 있습니다. 강력한 방지가 필요하면 App Check 활성화 또는 Blaze + Cloud Functions 도입을 권장합니다.
- **시스템 메시지(입장/퇴장 알림)**: 인증된 사용자라면 누구나 `senderUid: 'system'` 메시지를 생성할 수 있는 구조입니다 (소규모/친구 단위 사용을 전제).
- **이미지 전송 없음**: Firebase Storage를 쓰지 않기로 하면서 이미지 첨부 기능을 제거했습니다. 필요해지면 Storage를 다시 붙이거나, 외부 이미지 링크(URL)를 텍스트로 붙여넣는 방식으로 확장할 수 있습니다.
- **방 삭제 시 하위 데이터 잔존**: Firestore는 상위 문서를 지워도 하위 컬렉션(`messages`, `members`, `banned`)을 자동으로 함께 지우지 않습니다. 또한 그 방에 있던 다른 사람들의 `myRooms` 사이드바 미러도 자동으로 지워지지 않아, 삭제된 방이 잠깐 목록에 남아 보일 수 있습니다(클릭하면 방을 찾을 수 없어 자동으로 정리됨). 완전 삭제가 중요하다면 Blaze + Cloud Functions로 재귀 삭제를 붙이는 것을 권장합니다.
- **친구/초대 시스템**: 서버 검증 없이 클라이언트가 직접 Firestore 규칙 안에서 요청을 처리하는 구조라, "받은 요청을 수락하면 친구가 된다"는 흐름이 Cloud Functions 없이 규칙만으로 단순화되어 있습니다. 소규모 사용에는 문제없는 수준입니다.
- **팀/단체채팅은 목록에 없을 뿐 URL/ID를 알면 이론상 읽기는 가능**: Firestore 규칙상 로그인한 사용자는 어떤 방 문서든 읽을 수 있어(멤버가 아니어도), "목록에 안 보인다 = 완전히 비공개"는 아닙니다. 실질적인 진입은 초대(멤버 추가)를 통해서만 가능하지만, 정말 민감한 대화라면 비밀번호까지 함께 설정하는 것을 권장합니다.

이런 한계들은 "친구/팀 단위 소규모 사용"에는 실질적으로 큰 문제가 되지 않지만, 불특정 다수에게 공개하는 서비스로 키우실 경우 Blaze 플랜 업그레이드 + Cloud Functions 도입을 권장드립니다.
