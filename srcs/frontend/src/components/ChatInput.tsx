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
type ChatInputProps = {
  setMessage: (message: string) => void;
  postMessage: () => void;
  message: string;
};

function ChatInput({ setMessage, postMessage, message }: ChatInputProps) {

    const handleChange = (e: any) => {
        setMessage(e.target.value);
    }

    return ( 
        <div className="chat-input-container"> 
            <input onChange={handleChange} value={message} type="text" placeholder="Écrivez votre message..."/>
            <button onClick={() => postMessage()}>
                Envoyer
            </button>
        </div>
    );
}
export default ChatInput;
