const { Sequelize, DataTypes, Model } = require("sequelize");
const bcrypt = require("bcrypt");

const sequelize = new Sequelize(
    'transcendence',
    'souaguen',
    'secretpass',
    {
        host: 'mariadb',
        dialect: 'mariadb',
    }
);

// Valid
class User extends Model {}

User.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        username: {
            type: DataTypes.TEXT,
            allowNull: false,
            unique: true,
            validate: {
                is: /^[a-zA-Z0-9_-]{3,}$/i
            }
        },
        password: {
            type: DataTypes.TEXT,
            allowNull: false
        }
    },
    {
        sequelize,
        hooks: {
            beforeValidate: (user, options) => {
                const   salt = bcrypt.genSaltSync(10);
                user.password = bcrypt.hashSync(user.password, salt);
            },
        }
    },
);

(async function () {
    await sequelize.drop();
    console.log('All tables dropped!');
    await sequelize.sync({ force: true });
    console.log('All models were synchronized successfully.');
})();

module.exports = {
    User
};