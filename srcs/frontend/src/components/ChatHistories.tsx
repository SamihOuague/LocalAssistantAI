import { useEffect, useState } from "react";
import { getHistoryList } from "../api/chatllm";
import { useAuth } from "../context/AuthContext"

async function loader(accessToken: string | null) {
    try {
        const historyList = await getHistoryList(accessToken);

        return historyList;
    } catch (err) {
        console.error(err);
        return [];
    }
}

export default function ChatHistories({ setHistoryId, historyId }: any) {
    const [data, setData] = useState<{}[]>([]);
    const { accessToken } = useAuth();

    useEffect(() => {
        loader(accessToken).then((histories) => {
            setData(histories);
        });
    }, [historyId]);
    
    return (
        <div className="d-flex flex-column p-4 h-75"
            style={{ flex: 10, overflowY: "scroll" }}>
            {data.map((value: any, key: any) => (
                <div key={key} className={`text-secondary border-start border-5 rounded-3 mb-3 p-3 ${(value.id === historyId.id) ? "border-primary" : "border-dark"}`}
                    style={{ height: "100px", cursor: "pointer" }}
                    onClick={() => {
                        setHistoryId(value);
                    }}>
                    <h5>{new Date(value.createdAt).toDateString()}</h5>
                    <p>{value.title}{(value.title.length >= 30) && "..."}</p>
                </div>
            ))}
        </div>
    );
}