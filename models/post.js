const Sequelize = require('sequelize');

module.exports = class Post extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      title: { // 제목
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      description: { // 상세 설명
        type: Sequelize.TEXT,
        allowNull: false,
      },
      price: { // 월세(가격)
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      location: { // 위치
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      imageUrl: { // imageUrl
        type: Sequelize.TEXT,
        allowNull: true,
      },
    }, {
      sequelize,
      timestamps: true,
      paranoid: true,
      modelName: 'Post',
      tableName: 'posts',
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }

  static associate(db) {
    // Post:User = N:1
    db.Post.belongsTo(db.User);
    // Post:User = N:M
    db.Post.belongsToMany(db.User, { through: 'Like', as: 'LikedBy', foreignKey: 'PostId' });
  }
};
