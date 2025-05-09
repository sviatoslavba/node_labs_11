const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('petition_service', 'root', '1234', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false, // Вимкнути логування SQL-запитів у консоль
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Тестування підключення
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Connection to DB has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

testConnection();

module.exports = sequelize;
