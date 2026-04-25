import { Sequelize, DataTypes, Model } from "sequelize";

const sequelize = new Sequelize(
    'transcendence',
    'souaguen',
    'secretpass',
    {
        host: 'mariadb',
        dialect: 'mariadb',
    }
);

class ChatBox extends Model { }

ChatBox.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        idUser: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        title: {
            type: DataTypes.TEXT,
            allowNull: false,
        }
    },
    {
        sequelize,
        modelName: "ChatBox",
        tableName: "chat_box",
    },
);

class ChatMessage extends Model { }

ChatMessage.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        role: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        thinking: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: "ChatMessages",
        tableName: "chat_messages",
    },
);

ChatBox.hasMany(ChatMessage, {
    as: "messages",
    onDelete: "CASCADE",
});

ChatMessage.belongsTo(ChatBox, {
    foreignKey: "ChatBoxId",
    as: "chatBox",
});

(async function () {
    await sequelize.drop();
    console.log('All tables dropped!');
    await sequelize.sync({ force: true });
    console.log('All models were synchronized successfully.');
})();

export { ChatBox, ChatMessage };