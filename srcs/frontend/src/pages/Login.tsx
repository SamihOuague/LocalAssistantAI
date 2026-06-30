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

import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_BASE } from "../config";

function Login() {
    const { login, submitTotp } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [searchParams] = useSearchParams();
    const [phase, setPhase] = useState<"credentials" | "totp">(
        searchParams.get("2fa") === "1" ? "totp" : "credentials",
    );
    const [intermediateToken, setIntermediateToken] = useState("");
    const [code, setCode] = useState("");
    const [totpMode, setTotpMode] = useState<"app" | "scratch">("app");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setSubmitting(true);
        const result = await login(email, password);
        setSubmitting(false);
        if (result.status === "ok")
            navigate("/chat");
        else if (result.status === "2fa") {
            setIntermediateToken(result.intermediateToken);
            setPhase("totp");
        } else
            setError(result.message);
    }

    async function handleTotpSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setSubmitting(true);
        const result = await submitTotp(intermediateToken, code);
        setSubmitting(false);
        if (result.status === "ok")
            navigate("/");
        else if (result.status === "error")
            setError(result.message);
    }

    function backToCredentials() {
        setPhase("credentials");
        setIntermediateToken("");
        setCode("");
        setTotpMode("app");
        setError("");
    }

    if (phase === "totp") {
        return (
            <div className="login-card">
                <h1>Vérification en deux étapes</h1>
                <form className="login-form" onSubmit={handleTotpSubmit}>
                    {totpMode === "app" ? (
                        <>
                            <label htmlFor="code">
                                Code d'authentification
                            </label>
                            <input
                                id="code"
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                required
                                pattern="\d{6}"
                                maxLength={6}
                                title="Code à 6 chiffres"
                                placeholder="123456"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                            />
                        </>
                    ) : (
                        <>
                            <label htmlFor="code">
                                Code de secours
                            </label>
                            <input
                                id="code"
                                type="text"
                                autoComplete="off"
                                required
                                minLength={8}
                                maxLength={64}
                                placeholder="Entrez un code de secours"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                            />
                        </>
                    )}
                    {error && <p className="login-error">{error}</p>}
                    <button type="submit" disabled={submitting}>
                        {submitting ? "Vérification..." : "Valider"}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setTotpMode(totpMode === "app" ? "scratch" : "app");
                            setCode("");
                            setError("");
                        }}
                    >
                        {totpMode === "app"
                            ? "Utiliser un code de secours"
                            : "Utiliser l'application d'authentification"}
                    </button>
                    <button type="button" onClick={backToCredentials}>
                        Retour
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="login-card">
            <h1>Connexion</h1>
            <form className="login-form" onSubmit={handleSubmit}>
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
                    Password
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
                {error && <p className="login-error">{error}</p>}
                <button type="submit" disabled={submitting}>
                    {submitting ? "Connexion..." : "Se connecter"}
                </button>
            </form>
            <p>
                Pas de compte ? <Link to="/register">S'inscrire</Link>
            </p>
	    <button
                type="button"
                className="oauth-42-button"
                onClick={() => {
                    window.location.href = `${API_BASE}/auth/oauth/42`;
                }}
            >
                Se connecter avec 42
            </button>
        </div>
    );
}

export default Login;
