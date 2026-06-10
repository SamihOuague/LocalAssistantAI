/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Home.tsx                                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: odile <odile@student.42.fr>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/06/02 00:08:24 by odile             #+#    #+#             */
/*   Updated: 2026/06/02 12:03:17 by odile            ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Link } from "react-router-dom";
function Home() {
    return (
        <div className="card">
            <h1>Bienvenue</h1>
            <p>
                Page d'accueil, projet de Samih, Logan, Moussa, Odile.
            </p>
            <Link to="/login">
                <button>
                    Commencer
                </button>
            </Link>
        </div>
    );
}
export default Home;