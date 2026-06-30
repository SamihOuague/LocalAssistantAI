/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ChatInput.tsx                                      :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: odile <odile@student.42.fr>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/06/02 19:29:45 by odile             #+#    #+#             */
/*   Updated: 2026/06/02 19:30:46 by odile            ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

function ChatInput({ message, setMessage, loading, handlePostMessage }: any) {
    return (
        <div className="border-top border-dark d-flex justify-content-center"
            style={{ flex: 2 }}>
            <div className="border border-dark flex-grow-1 m-5 rounded-5 p-2 d-flex align-items-center"
                style={{ backgroundColor: "#111929" }}>
                <div className="flex-grow-1 h-100 d-flex align-items-center">
                    <textarea
                        className="form-control border-0 bg-transparent text-white-50 shadow-none"
                        placeholder="Envoyer un message..."
                        style={{ resize: "none" }}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={1}
                        onKeyDown={(e) => {
                            if (e.code == "Enter") {
                                e.preventDefault();
                                handlePostMessage();
                            }
                        }}
                    />
                </div>
                <button disabled={loading || !message.trim().length} className="btn btn-primary rounded-pill d-flex justify-content-center align-items-center"
                        onClick={() => handlePostMessage()}>
                    <i className="bi bi-send m-2 fs-5"></i>
                </button>
            </div>
        </div>

    );
}
export default ChatInput;