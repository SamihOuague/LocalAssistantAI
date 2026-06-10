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
            {content} 
        </div>
    );
}
export default MessageBubble;
