import { User } from "../users/Model.js";


export const register = async (req, res, next) => {
    const { username, password } = req.body;

    if (!username || !password)
        return res.status(403).send({ msg: "Missing inputs" });

    const userExist = await User.findOne({ where: { username } });

    if (userExist)
        return res.status(403).send({ msg: "Username already taken" });

    try {
        const user = User.build({
            username,
            password,
        });
        await user.save();
        req.user = user;
        next();
    } catch (e) {
        return res.status(500).send({ msg: "Signin failed.", e });
    }
};

export const login = async (req, res, next) => {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });

    if (!username && !password)
        return res.status(403).send({ msg: "Missing inputs" });
    if (!user)
        return res.status(401).send({ msg: "Username does not exists" });
    else if (!user.passwordCompare(password))
        return res.status(401).send({ msg: "Invalid password" });
    req.user = user;
    next();
};