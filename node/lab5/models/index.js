const db = require('../db');
const { DataTypes } = require('sequelize');

const Author = db.define('Author', {
  username: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING(100),
    allowNull: false
  }
}, {
  tableName: 'authors',
  timestamps: false
});

const Petition = db.define('Petition', {
  title: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  text: {
    type: DataTypes.STRING(1000),
    allowNull: false
  },
  petition_current: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  creation_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  expiry_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('In_Progress', 'rejected', 'accepted', 'on-review', 'expired'),
    defaultValue: 'In_Progress'
  }
}, {
  tableName: 'petitions',
  timestamps: false
});

const Signature = db.define('Signature', {}, {
  tableName: 'signatures',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

// Встановлення зв'язків
Author.hasMany(Petition, { foreignKey: 'author_id' });
Petition.belongsTo(Author, { foreignKey: 'author_id' });

Author.hasMany(Signature, { foreignKey: 'author_id' });
Signature.belongsTo(Author, { foreignKey: 'author_id' });

Petition.hasMany(Signature, { foreignKey: 'petition_id' });
Signature.belongsTo(Petition, { foreignKey: 'petition_id' });

module.exports = {
  Author,
  Petition,
  Signature,
  sequelize: db
};