
const createNewChat = async (accessToken: string, title: string) => {
    const res = await fetch(`https://api.ft_transcendence/v1/llm/new-chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify({ title }),
    });

    if (!res.ok)
        throw new Error(`Request failed : ${res.status}`);

    const body = await res.json();
    return (body.id);
}

const getJobId = async ({ content, id, accessToken }: any) => {
    const rNumber = Math.round(Math.random() * 999999999);
    const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${rNumber}`));
    const hashNonce = Array.from(new Uint8Array(buffer)); // convertit le buffer en tableau d'octet
    const nonce = hashNonce
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""); // convertit le tableau en chaîne hexadélimale
    
    const title = content.content.substr(0, 40);
    
    if (id === 0)
        id = await createNewChat(accessToken, title);

    const resJob = await fetch(`https://api.ft_transcendence/v1/llm/chat/${id}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify({ content: content.content, nonce }),
    });

    if (!resJob.ok)
        throw new Error(`Request failed : ${resJob.status}`);

    const job = await resJob.json();

    if (!job || !job.jobId)
        throw new Error(`Bad response : ${job}`);

    return ({ n: rNumber, hash: nonce, id });
}

const getStream = async ({ jobId, nonce }: any, callback: any) => {
    const decoder = new TextDecoder();
    const res = await fetch(`https://api.ft_transcendence/v1/llm/stream/${jobId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ nonce }),
    });

    let tmp = "";

    if (res.status != 200)
        throw new Error(`Request failed : ${res.status}`);
    else if (!res.body) {
        throw new Error("No response body");
    }

    for await (const result of res.body) {
        const chunk = decoder.decode(result, { stream: true });

        if (!chunk) continue
        try {
            let data = JSON.parse(chunk);

            console.log("data => ", data);
            if (data.type === 'ai') {
                tmp += data.content;
                callback(tmp);
            }
        } catch (err) {
            continue;
        }
    }

    return ({ role: "assistant", content: tmp });
}

export const handleGenerate = async (params: any, callback: any) => {
    try {
        const { n, hash, id } = await getJobId(params);
        const response = await getStream({ jobId: hash, nonce: n }, callback);

        return ({...response, id});
    } catch (err) {
        throw new Error(`${err}`);
    }
}

export const getHistoryList = async (accessToken: string | null) => {
    try {
        const response = await fetch("https://api.ft_transcendence/v1/llm/chat", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${accessToken}`
            }
        });

        return (await response.json());
    } catch (err) {
        return ([]);
    }
}

export const getHistory = async (id: any, accessToken: string | null) => {
    if (id === 0)
        return ([]);
    try {
        const response = await fetch(`https://api.ft_transcendence/v1/llm/history/${id}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${accessToken}`
            }
        });

        if (!response.ok)
            return ([]);
        return (await response.json());
    } catch (err) {
        return ([]);
    }
}

export const deleteHistory = async (id: any, accessToken: string | null) => {
    if (id === 0)
        return ([]);
    try {
        const response = await fetch(`https://api.ft_transcendence/v1/llm/history/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${accessToken}`
            }
        });

        return (await response.json());
    } catch (err) {
        return ({});
    }
}
