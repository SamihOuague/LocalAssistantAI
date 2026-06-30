/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   MessageBubble.tsx                                  :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: odile <odile@student.42.fr>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/06/02 19:27:26 by odile             #+#    #+#             */
/*   Updated: 2026/06/02 19:28:41 by odile            ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import Markdown from "react-markdown"

interface MessageBubbleProps {
    content: string;
    role: "user" | "assistant";
}

function MessageBubble({
    content,
    role,
}: MessageBubbleProps) {
    return (
        <div className={role === "user" ? "message user-message" : "message assistant-message"}>
            {(role === "user") ? content :
            <Markdown>
                {content}
            </Markdown>}
        </div>
    );
}
export default MessageBubble;
