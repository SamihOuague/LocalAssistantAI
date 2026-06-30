import { Sequelize, DataTypes, Model } from "sequelize";

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: process.env.DB_DIALECT,
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
            type: DataTypes.TEXT,
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
        }
    },
    {
        sequelize,
        modelName: "ChatMessage",
        tableName: "chat_message",
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

sequelize.sync();
export { ChatBox, ChatMessage };