/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Chat.tsx                                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: odile <odile@student.42.fr>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/06/02 19:34:06 by odile             #+#    #+#             */
/*   Updated: 2026/06/02 19:34:55 by odile            ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext"
import { deleteHistory, handleGenerate, getHistory } from "../api/chatllm";
import ChatContainer from "../components/ChatContainer";
import ChatHistories from "../components/ChatHistories";
import ChatInput from "../components/ChatInput";

async function loader({ accessToken, historyId }: any) {
    try {
        const history = await getHistory(historyId.id, accessToken);

        return history;
    }
    catch (err) {
        console.error(err);
        return ([]);
    }
}

function SideBarBody({ setHistoryId }: any) {
    return (
        <div className="offcanvas-body">
            <Link to={"/"} className="border-bottom border-dark d-flex flex-column justify-content-center p-3 text-light"
                style={{ flex: 1, textDecoration: "none" }}>
                <h2 className="m-0">ChatLLM</h2>
                <i className="text-secondary">Self hosted LLM</i>
            </Link>
            <div className="border-bottom border-dark p-4 d-flex flex-column justify-content-center"
                style={{ flex: 1 }}>
                <button className="btn btn-primary d-flex justify-content-center p-2"
                    onClick={() => setHistoryId({ id: 0, title: "Nouvelle conversation", createdAt: "" })}>
                    <i className="bi bi-plus-lg"></i>
                    <span className="ms-1">Nouvelle conversation</span>
                </button>
            </div>
        </div>
    );
}

function Chat() {

    const [historyId, setHistoryId] = useState({ id: 0, title: "Nouvelle conversation", createdAt: "" });
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState<{}[]>([]);
    const [buffer, setBuffer] = useState("");
    const [ loading, setLoading ] = useState(false);
    const { accessToken } = useAuth();

    useEffect(() => {
        loader({ historyId, accessToken }).then((history) => {
            setMessages(history);
        });
    }, [historyId]);

    const handlePostMessage = async () => {
        const msg = { role: "user", content: message };
        try {
            if (!message.trim().length)
            {
                setMessage("");
                return ;
            }
            setLoading(true);
            const response = handleGenerate({ content: msg, id: historyId.id, accessToken }, (data: any) => {
                setBuffer(data);
            });

            setMessages([...messages, msg]);
            setMessage("");
            const prom = await response;

            setMessages([...messages, msg, prom]);
            if (historyId.id === 0)
                setHistoryId({ id: prom.id, title: "Nouvelle conversation", createdAt: "" });
            setBuffer("");
            setLoading(false);
        } catch (err) {
            setBuffer(`${err}`);
        }
    }

    const handleDelete = async (id: any) => {
        await deleteHistory(id, accessToken);
        setHistoryId({ id: 0, title: "Nouvelle conversation", createdAt: "" });
    }

    return (
        <div className="d-flex vh-100 w-100">
            <div className="offcanvas offcanvas-start" tabIndex={-1} id="offcanvasHistory" aria-labelledby="offcanvasHistoryLabel"
                style={{ flex: 1, backgroundColor: "#111929" }}>
                <div className="offcanvas-header">
                    <button type="button" className="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Close"></button>
                </div>
                <SideBarBody setHistoryId={setHistoryId} />
                <ChatHistories historyId={historyId} setHistoryId={setHistoryId} />
            </div>
            <div className="d-none d-xl-block h-100"
                style={{ flex: 1, backgroundColor: "#111929" }}>
                <SideBarBody setHistoryId={setHistoryId} />
                <ChatHistories historyId={historyId} setHistoryId={setHistoryId} />
            </div>
            <div className="d-flex flex-column border-start border-dark"
                style={{ flex: 3, backgroundColor: "#0d1420" }}>
                <div style={{ flex: 1 }} className="border-bottom border-dark d-flex justify-content-between align-items-center p-2">
                    <div className="d-block d-xl-none">
                        <button className="btn btn-dark" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasHistory" aria-controls="offcanvasHistory">
                            <i className="bi bi-layout-sidebar-inset"></i>
                        </button>
                    </div>
                    <h4 className="text-light ms-4 mb-0">{(!historyId.createdAt) ? "Nouvelle conversation" : new Date(historyId.createdAt).toDateString() }</h4>

                    {(historyId.id) &&
                        <button className="btn text-danger fs-3" onClick={() => handleDelete(historyId.id)}>
                            <i className="bi bi-trash"></i>
                        </button>
                    }
                </div>
                <ChatContainer historyId={historyId} buffer={buffer} messages={messages} />
                <ChatInput message={message} loading={loading} setMessage={setMessage} handlePostMessage={handlePostMessage} />
            </div>
        </div>
    );
}
export default Chat;