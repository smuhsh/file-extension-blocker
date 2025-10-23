# 파일 확장자 차단 (File Extension Blocker)

## 개요
- 고정 확장자: bat, cmd, com, cpl, exe, scr, js (DB에 저장된 상태를 체크/언체크 가능)
- 커스텀 확장자: 사용자가 추가/삭제 가능 (최대 200개, 확장자 최대 20자)
- 프론트엔드: Bootstrap 5 + jQuery (반응형)
- 백엔드: Node.js + Express
- DB: Oracle

## 프로젝트 구조
```
file-extension-blocker/
├─ server/
│  ├─ package.json
│  ├─ server.js
│  ├─ db.js
│  ├─ routes/
│  │  └─ extensions.js
│  └─ seed.js
└─ public/
   ├─ index.html
   ├─ css/
   │  └─ styles.css
   └─ js/
      └─ app.js
README.md
```
## 설치 및 실행
1. Oracle DB에 `FILE_EXTENSIONS` 테이블 생성 (DDL 파일 참조)
2. 서버 환경 변수 설정 (or 직접 db.js 수정)
   - ORACLE_USER
   - ORACLE_PASSWORD
   - ORACLE_CONNECT  (ex: `localhost/XEPDB1`)
3. 서버 설치
4. 테이블 생성
   - `server/schema.sql` 파일을 Oracle SQL Developer 또는 SQL*Plus에서 실행하세요.
   - 테이블 생성 후, 아래 명령어로 기본 확장자를 시드합니다.
```bash
cd server
npm install
# DB에 고정 확장자 시드
npm run seed
# 서버 시작
npm start
