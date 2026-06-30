import { ChatBox } from "../Model.mjs";

export const createChatBox = async (data) => {
    try {
        const { idUser, title } = data;
    
        let chatBox = ChatBox.build({
            idUser: idUser,
            title,
        });

        return await chatBox.save();
    } catch (err) {
        console.error(err);
        return (null);
    }
};

export const readChatBox = async (id) => {
    try {
        return await ChatBox.findAll({
            where: {
                idUser: id
            },
            order: [["createdAt", "DESC"]]
        });
    } catch (err) {
        console.error(err);
        return (null);
    }
};