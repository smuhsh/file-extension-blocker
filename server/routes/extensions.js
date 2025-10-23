// server/routes/extensions.js
const express = require('express');
const router = express.Router();
const oracledb = require('oracledb');
const { getConnection } = require('../db');

/**
 * 확장자 이름을 정규화하는 함수
 * - 앞뒤 공백 제거
 * - 모두 소문자로 변환
 * - 맨 앞의 '.' 제거
 * 
 * 예: ".EXE" → "exe", "  bat " → "bat"
 */
function normalizeExt(name) {
  if (!name) return '';
  name = name.trim().toLowerCase();
  if (name.startsWith('.')) name = name.slice(1);
  return name;
}

/**
 * [GET] /api/extensions/fixed
 * - 고정 확장자 목록을 DB에서 조회
 * - 각 확장자의 차단 여부(IS_BLOCKED)를 함께 반환
 * - 프론트엔드에서 체크박스 목록으로 표시됨
 */
router.get('/fixed', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT EXT_ID, EXT_NAME, IS_BLOCKED
         FROM FILE_EXTENSIONS
        WHERE EXT_TYPE='FIXED'
        ORDER BY EXT_ID`
    );

    // 조회 결과를 JSON 형태로 변환하여 응답
    res.json(result.rows.map(r => ({
      extId: r[0],
      extName: r[1],
      isBlocked: r[2]
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' }); // DB 오류 응답
  } finally {
    if (conn) try { await conn.close(); } catch(e){/* 연결 종료 */ }
  }
});

/**
 * [PUT] /api/extensions/fixed
 * - 고정 확장자의 차단 여부(IS_BLOCKED)를 업데이트
 * - 사용자가 체크박스를 클릭할 때 호출됨
 */
router.put('/fixed', async (req, res) => {
  const { extName, isBlocked } = req.body;
  const name = normalizeExt(extName);

  // 유효성 검사
  if (!name || !['Y','N'].includes(isBlocked))
    return res.status(400).json({ error: 'Invalid' });

  let conn;
  try {
    conn = await getConnection();

    // 해당 확장자 상태를 DB에 반영
    const result = await conn.execute(
      `UPDATE FILE_EXTENSIONS
          SET IS_BLOCKED = :isBlocked
        WHERE EXT_TYPE='FIXED'
          AND LOWER(EXT_NAME)=:name`,
      { isBlocked, name },
      { autoCommit: true }
    );

    // 변경된 행이 없으면 존재하지 않는 확장자
    if (result.rowsAffected === 0)
      return res.status(404).json({ error: 'Not found' });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  } finally {
    if (conn) try { await conn.close(); } catch(e){}
  }
});

/**
 * [GET] /api/extensions/custom
 * - 사용자가 추가한 커스텀 확장자 목록 조회
 * - 최대 200개까지만 반환
 */
router.get('/custom', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();

    const result = await conn.execute(
      `SELECT EXT_ID, EXT_NAME, CREATED_AT
         FROM FILE_EXTENSIONS
        WHERE EXT_TYPE='CUSTOM'
        ORDER BY CREATED_AT`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT } // 결과를 객체 형태로 받음
    );

    // 최대 200개까지만 반환
    const rows = result.rows.slice(0, 200);

    res.json(rows.map(r => ({
      extId: r.EXT_ID,
      extName: r.EXT_NAME
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  } finally {
    if (conn) try { await conn.close(); } catch(e){}
  }
});

/**
 * [POST] /api/extensions/custom
 * - 새로운 커스텀 확장자를 추가
 * - 중복 검사 및 개수 제한(최대 200개)
 */
router.post('/custom', async (req, res) => {
  const raw = req.body.extName;
  if (!raw)
    return res.status(400).json({ error: 'extName required' });

  const name = normalizeExt(raw);
  if (!name)
    return res.status(400).json({ error: 'Invalid extName' });
  if (name.length > 20)
    return res.status(400).json({ error: 'Max length 20' });

  let conn;
  try {
    conn = await getConnection();

    // 1.현재 등록된 커스텀 확장자 개수 확인
    const countRes = await conn.execute(
      `SELECT COUNT(*) AS CNT
         FROM FILE_EXTENSIONS
        WHERE EXT_TYPE='CUSTOM'`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (countRes.rows[0].CNT >= 200)
      return res.status(400).json({ error: 'Max 200 custom extensions reached' });

    // 2.중복 검사 (FIXED/CUSTOM 전체에서 중복 확인)
    const dupRes = await conn.execute(
      `SELECT EXT_TYPE
         FROM FILE_EXTENSIONS
        WHERE LOWER(EXT_NAME)=:name`,
      { name },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (dupRes.rows.length > 0)
      return res.status(409).json({ error: 'Extension already exists' });

    // 3.신규 확장자 DB에 추가
    await conn.execute(
      `INSERT INTO FILE_EXTENSIONS (EXT_TYPE, EXT_NAME, IS_BLOCKED)
       VALUES ('CUSTOM', :name, 'Y')`,
      { name },
      { autoCommit: true }
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    // ORA-00001 (unique constraint) 예외 처리
    if (err && err.errorNum === 1)
      return res.status(409).json({ error: 'Duplicate' });

    res.status(500).json({ error: 'DB error' });
  } finally {
    if (conn) try { await conn.close(); } catch(e){}
  }
});

/**
 * [DELETE] /api/extensions/custom/:id
 * - 특정 커스텀 확장자를 ID 기준으로 삭제
 */
router.delete('/custom/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id)
    return res.status(400).json({ error: 'Invalid id' });

  let conn;
  try {
    conn = await getConnection();

    // 해당 ID의 커스텀 확장자 삭제
    const result = await conn.execute(
      `DELETE FROM FILE_EXTENSIONS
        WHERE EXT_TYPE='CUSTOM'
          AND EXT_ID = :id`,
      { id },
      { autoCommit: true }
    );

    // 삭제된 행이 없으면 존재하지 않는 데이터
    if (result.rowsAffected === 0)
      return res.status(404).json({ error: 'Not found' });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  } finally {
    if (conn) try { await conn.close(); } catch(e){}
  }
});

// router 객체를 외부(server.js)에서 사용할 수 있도록 내보냄
module.exports = router;
