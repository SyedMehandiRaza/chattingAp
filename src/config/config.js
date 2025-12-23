require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: "mysql"
  },
  test: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: "mysql"
  },
  
  
 production: {
  username: process.env.P_DB_USER,
  password: process.env.P_DB_PASS,
  database: process.env.P_DB_NAME,
  host: process.env.P_DB_HOST,
  port: process.env.P_DB_PORT,
  dialect: "mysql",
}

};
