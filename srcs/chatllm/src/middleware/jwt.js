import jwt from "jsonwebtoken";

export function verify(req, res, next) {
    if (!req.headers.authorization)
        return res.status(401).send({ err: "Unauthorized" });
    try {
        let barear = req.headers.authorization.split(" ")[1];
        let decoded = jwt.verify(barear, process.env.JWT_SECRET || "secretkey");
        req.userId = decoded.userId;
    } catch (err) {
        return res.status(401).send({ err });
    }
    next();
}
