/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ChatContainer.tsx                                  :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: odile <odile@student.42.fr>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/06/02 19:27:09 by odile             #+#    #+#             */
/*   Updated: 2026/06/02 19:33:30 by odile            ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import Markdown from "react-markdown";

function ChatContainer({ buffer, messages }: any) {
    return (
        <div style={{ flex: 8, overflowY: "scroll", overflowX: "hidden" }} className="d-flex flex-column p-3">
            {messages.map((value: any, key: any) => (
                <div key={key} className={`text-light p-2 d-flex ${(value.role === "user") && "justify-content-end"}`}>
                    <div className={`p-3 ${(value.role === "assistant") ? "flex-grow-1" : "bg-dark rounded-4"}`}>
                        {(value.role !== "assistant") ?
                            <p className="m-0">{value.content}</p> :
                            <Markdown>{value.content}</Markdown>
                        }
                    </div>
                </div>
            ))}
            {(buffer !== "") &&
                <div className={`text-light p-2 d-flex`}>
                    <div className={`p-3 "flex-grow-1"}`}>
                        <Markdown>{buffer}</Markdown>
                    </div>
                </div>
            }
        </div>
    );
}
export default ChatContainer;