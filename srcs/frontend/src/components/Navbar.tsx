/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Navbar.tsx                                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: odile <odile@student.42.fr>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/06/02 00:05:20 by odile             #+#    #+#             */
/*   Updated: 2026/06/02 12:24:05 by odile            ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Link } from "react-router-dom";
import { FaRobot } from "react-icons/fa";
function Navbar() {
    return (
        <nav className="navbar">
            <div className="logo" >
                <Link to="/login" className="logo">
                    <FaRobot />
                    <span>Transcendance</span>
                </Link>
            </div>
            <div className="nav-links">
                <Link to="/">Accueil</Link>
                <Link to="/chat">Chat</Link>
                <Link to="/login">Connexion</Link>
                <Link to="/register">Inscription</Link>
                <Link to="/dashboard">Dashboard</Link>
            </div>
        </nav>
    );
}
export default Navbar;