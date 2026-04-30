import jwt from "jsonwebtoken";

export const getToken = async (req, res) => {
    let token = "";

    if (!req.user)
        return res.status(401).send({ msg: "Error: Authentication failed." });
    token = jwt.sign({ userId: req.user.id }, "secretkey", { expiresIn: "1h" });
    
    return res.send({ token });
};

export const ping = async (req, res) => {
    return res.send({ pong: "pong" });
};
