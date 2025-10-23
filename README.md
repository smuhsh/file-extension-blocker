# 파일 확장자 차단 (File Extension Blocker)

## 개요
- 고정 확장자: bat, cmd, com, cpl, exe, scr, js (DB에 저장된 상태를 체크/언체크 가능)
- 커스텀 확장자: 사용자가 추가/삭제 가능 (최대 200개, 확장자 최대 20자)
- 프론트엔드: Bootstrap 5 + jQuery (반응형)
- 백엔드: Node.js + Express
- DB: Oracle

## 프로젝트 구조
```file-extension-blocker/
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
```

## 스크린샷

### DDL
<img width="1920" height="1080" alt="스크린샷 2025-10-22 174216" src="https://github.com/user-attachments/assets/715239a3-726d-4102-ac4d-3a8373745021" />

### 데이터 생성
<img width="1920" height="1080" alt="스크린샷 2025-10-22 193138" src="https://github.com/user-attachments/assets/bcceb02c-ca1c-46e3-abfd-e1bd76952455" />

### 데이터 적재확인
<img width="1920" height="1080" alt="스크린샷 2025-10-22 193151" src="https://github.com/user-attachments/assets/1d55746a-c59b-4a6f-a022-a9043f222338" />

### 데이터 삭제
<img width="1920" height="1080" alt="스크린샷 2025-10-22 193204" src="https://github.com/user-attachments/assets/ba0769b0-2313-44d9-b47c-160b00346497" />

<img width="1920" height="1080" alt="스크린샷 2025-10-22 193212" src="https://github.com/user-attachments/assets/1a081eb3-afac-4491-9ae2-07fc8b14be2c" />

<img width="1920" height="1080" alt="스크린샷 2025-10-22 193222" src="https://github.com/user-attachments/assets/9557ea32-23f5-4a95-8c99-dbcf5b33850f" />

<img width="1920" height="1080" alt="스크린샷 2025-10-22 193234" src="https://github.com/user-attachments/assets/219c9479-ca3f-44a2-a0f8-7544bfdb82bc" />
