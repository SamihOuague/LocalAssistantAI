/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Register.tsx                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: odile <odile@student.42.fr>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/06/02 11:48:43 by odile             #+#    #+#             */
/*   Updated: 2026/06/02 11:52:12 by odile            ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Link } from "react-router-dom";
function Register() {
    return ( 
        <div className="login-card"> <h1>Inscription</h1>
            <form className="login-form">
                <label htmlFor="username">
                    Pseudo
                </label>
                <input
                    id="username"
                    type="text"
                    placeholder="Votre pseudo"
                />
                <label htmlFor="email">
                    Email
                </label>
                <input
                    id="email"
                    type="email"
                    placeholder="Votre email"
                />
                <label htmlFor="password">
                    Mot de passe
                </label>
                <input
                    id="password"
                    type="password"
                    placeholder="Votre mot de passe"
                />
                <label htmlFor="confirmPassword">
                    Confirmation
                </label>
                <input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirmez votre mot de passe"
                />
                <button type="submit">
                    S'inscrire
                </button>
                <p className="login-register">
                    Déjà inscrit ?{" "}
                    <Link to="/login">
                        Connexion
                    </Link>
                </p>
            </form>
        </div>
    );
}
export default Register;
