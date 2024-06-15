const Sequelize = require('sequelize');

module.exports = class User extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      email: { // 이메일
        type: Sequelize.STRING(40),
        allowNull: true,
        unique: true,
      },
      nick: { // 이름
        type: Sequelize.STRING(15),
        allowNull: false,
      },
      password: { // 비밀번호
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      provider: { // sns 제공자(local, kakao 등)
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: 'local',
      },
      snsId: { // sns 로그인 id
        type: Sequelize.STRING(30),
        allowNull: true,
      },
      contact: { // 연락처
        type: Sequelize.STRING(15),
        allowNull: true,
      },
    }, {
      sequelize,
      timestamps: true,
      paranoid: true,
      modelName: 'User',
      tableName: 'users',
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }

  static associate(db) {
    // User:Post = 1:N
    db.User.hasMany(db.Post);
    // User:Post = N:M
    db.User.belongsToMany(db.Post, { through: 'Like', as: 'LikedPosts', foreignKey: 'UserId' });
  }
};
