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

// 42 header stopgap — reformat at school with :Stdheader

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas");
            return;
        }
        setSubmitting(true);
        const result = await register(username, email, password);
        setSubmitting(false);
        if (result.status === "ok")
            navigate("/login");
        else
            setError(result.message);
    }

    return (
        <div className="login-card"> <h1>Inscription</h1>
            <form className="login-form" onSubmit={handleSubmit}>
                <label htmlFor="username">
                    Pseudo
                </label>
                <input
                    id="username"
                    type="text"
                    required
                    pattern="[a-zA-Z0-9_\-]{3,32}"
                    title="3 à 32 caractères : lettres, chiffres, _ ou -"
                    placeholder="Votre pseudo"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <label htmlFor="email">
                    Email
                </label>
                <input
                    id="email"
                    type="email"
                    required
                    maxLength={255}
                    placeholder="Votre email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <label htmlFor="password">
                    Mot de passe
                </label>
                <input
                    id="password"
                    type="password"
                    required
                    minLength={8}
                    maxLength={128}
                    placeholder="Votre mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <label htmlFor="confirmPassword">
                    Confirmation
                </label>
                <input
                    id="confirmPassword"
                    type="password"
                    required
                    minLength={8}
                    maxLength={128}
                    placeholder="Confirmez votre mot de passe"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {error && <p className="login-error">{error}</p>}
                <button type="submit" disabled={submitting}>
                    {submitting ? "Inscription..." : "S'inscrire"}
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
