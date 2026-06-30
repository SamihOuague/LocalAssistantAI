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

import { Link, useNavigate } from "react-router-dom";
import { FaRobot } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

function Navbar() {
    const { user, loading, logout } = useAuth();
    const navigate = useNavigate();

    async function handleLogout() {
        await logout();
        navigate("/");
    }

    return (
		<nav className="navbar navbar-expand-lg bg-dark">
  			<div className="container-fluid">
				<Link to="/" className="navbar-brand d-flex align-items-center text-light">
				<FaRobot className="me-2" />
				<span>Transcendance</span>
				</Link>
				<button
				className="navbar-toggler bg-light"
				type="button"
				data-bs-toggle="collapse"
				data-bs-target="#navbarNav"
				aria-controls="navbarNav"
				aria-expanded="false"
				aria-label="Toggle navigation"
				>
				<span className="navbar-toggler-icon"></span>
				</button>
				<div className="collapse navbar-collapse" id="navbarNav">
				<ul className="navbar-nav ms-auto">
					<li className="nav-item">
					<Link className="nav-link text-light" to="/">
						Accueil
					</Link>
					</li>
					<li className="nav-item">
					<Link className="nav-link text-light" to="/chat">
						Chat
					</Link>
					</li>
					{!loading && user === null && (
					<>
						<li className="nav-item">
						<Link className="nav-link text-light" to="/login">
							Connexion
						</Link>
						</li>
						<li className="nav-item">
						<Link className="nav-link text-light" to="/register">
							Inscription
						</Link>
						</li>
					</>
					)}
					{!loading && user !== null && (
					<>
						{/*<li className="nav-item">
						<Link className="nav-link text-light" to="/dashboard">
							Dashboard
						</Link>
						</li>*/}

						<li className="nav-item">
						<Link className="nav-link text-light" to="/friends">
							Amis
						</Link>
						</li>

						<li className="nav-item">
                                                <Link className="nav-link text-light" to="/profile">
                                                        Mon profil
                                                </Link>
                                                </li>

						<li className="nav-item">
						<Link className="nav-link text-light" to="/settings">
							Paramètres
						</Link>
						</li>
						<li className="nav-item">
						<button
							type="button"
							className="btn btn-outline-light ms-lg-2"
							onClick={handleLogout}
						>
							Déconnexion
						</button>
						</li>
					</>
					)}
				</ul>
				</div>
			</div>
			</nav>
    );
}
export default Navbar;
