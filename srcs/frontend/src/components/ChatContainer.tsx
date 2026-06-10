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

import MessageBubble from "./MessageBubble";

type ChatContainerProps = {
    messages: { role: string, content: string }[];
    buffer: string;
};

function ChatContainer({ messages, buffer }: ChatContainerProps) {
    return (
        <div className="chat-container">
            {
                messages.map(
                    (message: any, index: number) => (<MessageBubble key={index} role={message.role} content={message.content} />)
                )
            }
            {(buffer !== "") && <MessageBubble role={"assistant"} content={buffer} />}
        </div>
    );
}
export default ChatContainer;
