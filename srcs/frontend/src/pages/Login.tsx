/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Login.tsx                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: odile <odile@student.42.fr>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/06/02 10:55:39 by odile             #+#    #+#             */
/*   Updated: 2026/06/02 11:56:56 by odile            ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Link } from "react-router-dom";

function Login() {
    return ( <div className="login-card"> <h1>Connexion</h1>
            <form className="login-form">
                <label htmlFor="email">
                    Email
                </label>
                <input
                    id="email"
                    type="email"
                    placeholder="Votre email"
                />
                <label htmlFor="password">
                    Password
                </label>
                <input
                    id="password"
                    type="password"
                    placeholder="Votre mot de passe"
                />
                <button type="submit">
                    Login
                </button>
                <p className="login-register">
                    Pas encore inscrit ?{" "}
                    <Link to="/register">
                        Créer un compte
                    </Link>
                </p>
            </form>
        </div>
    );
}
export default Login;
