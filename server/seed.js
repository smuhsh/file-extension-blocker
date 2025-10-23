// server/seed.js
const oracledb = require('oracledb');
const { getConnection } = require('./db');

const fixedExtensions = ['bat', 'cmd', 'com', 'cpl', 'exe', 'scr', 'js'];

async function seed() {
  let conn;
  try {
    conn = await getConnection();

    // 1.테이블이 없으면 새로 생성
    const createTableSql = `
      BEGIN
        EXECUTE IMMEDIATE '
          CREATE TABLE FILE_EXTENSIONS (
            ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            EXT_TYPE VARCHAR2(10) NOT NULL,
            EXT_NAME VARCHAR2(20) UNIQUE NOT NULL,
            IS_BLOCKED CHAR(1) DEFAULT ''N'' CHECK (IS_BLOCKED IN (''Y'', ''N''))
          )';
      EXCEPTION
        WHEN OTHERS THEN
          IF SQLCODE != -955 THEN RAISE; END IF; -- 이미 존재하면 무시
      END;
    `;
    await conn.execute(createTableSql);
    console.log('✅ Table checked/created');

    // 2.고정 확장자 삽입 (중복 체크)
    for (const name of fixedExtensions) {
      const checkSql = `
        SELECT COUNT(*) AS CNT FROM FILE_EXTENSIONS 
        WHERE LOWER(EXT_NAME) = :name AND EXT_TYPE = 'FIXED'
      `;
      const res = await conn.execute(checkSql, { name }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
      if (res.rows[0].CNT === 0) {
        await conn.execute(
          `INSERT INTO FILE_EXTENSIONS (EXT_TYPE, EXT_NAME, IS_BLOCKED) 
           VALUES ('FIXED', :name, 'N')`,
          { name },
          { autoCommit: true }
        );
        console.log(`✅ Inserted fixed extension: ${name}`);
      } else {
        console.log(`ℹ️ Already exists: ${name}`);
      }
    }

    console.log('\n🎉 Seeding completed successfully!');
  } catch (err) {
    console.error('⚠️ Seed error:', err);
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch (e) {
        console.error('Error closing connection:', e);
      }
    }
  }
}

seed();
