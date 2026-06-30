export const isAuth = async (req, res, next) => {
    try {
        const response = await fetch("http://auth:3001/me", {
            headers: req.headers,
        });
        const data = await response.json();
        if (response.status != 200)
            return res.status(response.status).send(data);
        
        req.user = data;
    } catch(e) {
        console.error(e);
        return res.status(500).send({error: e});
    }

    next();
}