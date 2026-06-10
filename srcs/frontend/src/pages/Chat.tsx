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

import { useState } from "react";
import ChatContainer from "../components/ChatContainer";
import ChatInput from "../components/ChatInput";

function Chat() {
    const [ message, setMessage ] = useState("");
    const [ messages, setMessages ] = useState<{role: string, content:string}[]>([]);
    const [ buffer, setBuffer ] = useState("");

    const handleSubmit = async () => {
        const msg = { role: "user", content: message };

        setMessages([...messages, msg]);
        setMessage("");
        const res = await fetch("https://api.localhost/v1/llm/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "barear token"
            },
            body: JSON.stringify({ messages: [...messages, msg] }),
        });
        
        const decoder = new TextDecoder();
        let tmp = "";

        for await (const result of res.body) {
            const chunk = decoder.decode(result, {stream: true});
            tmp += chunk;
            setBuffer(tmp);
        }
        
        setMessages([...messages, msg, { role: "assistant", content: tmp }]);
        setBuffer("");
        console.log(messages);
    }

    return (
        <div className="chat-page">
            <h1>Chat LLM</h1>
            <ChatContainer messages={messages} buffer={buffer} />
            <ChatInput setMessage={setMessage} postMessage={handleSubmit} message={message} />
        </div>
    );
}
export default Chat;
