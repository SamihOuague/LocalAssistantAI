import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import "./style.css";
type Mode = "login" | "register";

export default function Auth() {
  const [mode, setMode] = useState<Mode>("login");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("token")) navigate("/");
  }, []);

  const endpoint =
    mode === "login"
      ? "https://localhost/api/auth/signin"
      : "https://localhost/api/auth/signup";

  const submit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!username || !password) {
      setError("Champs requis");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.msg || "Erreur serveur");
        setLoading(false);
        return;
      }

      if (data.token) localStorage.setItem("token", data.token);

      navigate("/");
    } catch {
      setError("Erreur réseau");
    }

    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* HEADER */}
        <div className="auth-header">
          <h2>⚖️ LegalIA</h2>
          <p>{mode === "login" ? "Connexion" : "Créer un compte"}</p>
        </div>

        {/* FORM */}
        <form onSubmit={submit} className="auth-form">

          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <div className="pwd-wrapper">
            <input
              type={showPwd ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
            >
              {showPwd ? "🙈" : "👁️"}
            </button>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button disabled={loading} className="auth-btn">
            {loading ? "..." : mode === "login" ? "Login" : "Register"}
          </button>
        </form>

        {/* SWITCH */}
        <div className="auth-switch">
          {mode === "login" ? (
            <>
              Pas de compte ?
              <button onClick={() => setMode("register")}>
                S’inscrire
              </button>
            </>
          ) : (
            <>
              Déjà un compte ?
              <button onClick={() => setMode("login")}>
                Se connecter
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}