// server/db.js
const oracledb = require('oracledb');

const dbConfig = {
  user: process.env.ORACLE_USER || 'DEMO',
  password: process.env.ORACLE_PASSWORD || 'demo1234',
  connectString: process.env.ORACLE_CONNECT || 'localhost/XEPDB1' // 예: host:port/SERVICE
};

async function getConnection() {
  return oracledb.getConnection(dbConfig);
}

module.exports = {
  getConnection,
  oracledb
};
