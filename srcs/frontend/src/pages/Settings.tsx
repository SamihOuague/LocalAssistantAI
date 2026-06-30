import { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import { useAuth } from "../context/AuthContext";
import { API_BASE } from "../config";

interface SetupData {
    otpauthUri: string;
    secret: string;
    scratchCodes: string[];
}

type Status = "idle" | "setup" | "regenerate";

function Settings() {
    const { user, accessToken, refreshUser, authedFetch } = useAuth();
    const [status, setStatus] = useState<Status>("idle");
    const [setupData, setSetupData] = useState<SetupData | null>(null);
    const [saved, setSaved] = useState(false);
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [regenCodes, setRegenCodes] = useState<string[] | null>(null);
    const [draftUsername, setDraftUsername] = useState(user?.username ?? "");
    const [accountError, setAccountError] = useState("");
    const [accountSaved, setAccountSaved] = useState(false);
    const [savingAccount, setSavingAccount] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avatarError, setAvatarError] = useState("");
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    useEffect(() => {
        return () => {
            if (avatarPreview !== null)
                URL.revokeObjectURL(avatarPreview);
        };
    }, [avatarPreview]);

    if (user === null || accessToken === null)
        return null;

    async function startSetup() {
        setError("");
        setSubmitting(true);
        try {
	    const res = await authedFetch("/auth/2fa/setup", { method: "POST" });
            if (!res.ok) {
                setError("Impossible de démarrer la configuration 2FA");
                return;
            }
            setSetupData((await res.json()) as SetupData);
            setSaved(false);
            setCode("");
            setStatus("setup");
        } catch {
            setError("Une erreur est survenue");
        } finally {
            setSubmitting(false);
        }
    }

    async function confirmEnable() {
        setError("");
        if (!/^\d{6}$/.test(code)) {
            setError("Veuillez entrer un code à 6 chiffres");
            return;
        }
        setSubmitting(true);
        try {
	    const res = await authedFetch("/auth/2fa/enable", {
	      method: "POST",
    	      body: JSON.stringify({ code }),
	    });
            if (res.status === 401) {
                setError("Code invalide");
                return;
            }
            if (!res.ok) {
                setError("Une erreur est survenue");
                return;
            }
            await refreshUser();
            setSetupData(null);
            setStatus("idle");
        } catch {
            setError("Une erreur est survenue");
        } finally {
            setSubmitting(false);
        }
    }

    async function disable() {
        setError("");
        if (!/^\d{6}$/.test(code)) {
            setError("Veuillez entrer un code à 6 chiffres");
            return;
        }
        setSubmitting(true);
        try {
	    const res = await authedFetch("/auth/2fa/disable", {
   	        method: "POST",
    	        body: JSON.stringify({ code }),
	    });
            if (res.status === 401 || res.status === 409) {
                setError("Code invalide");
                return;
            }
            if (!res.ok) {
                setError("Une erreur est survenue");
                return;
            }
            await refreshUser();
            setCode("");
        } catch {
            setError("Une erreur est survenue");
        } finally {
            setSubmitting(false);
        }
    }

    function startRegenerate() {
        setError("");
        setRegenCodes(null);
        setSaved(false);
        setStatus("regenerate");
    }

    async function confirmRegenerate() {
        setError("");
        if (!/^\d{6}$/.test(code)) {
            setError("Veuillez entrer un code à 6 chiffres");
            return;
        }
        setSubmitting(true);
        try {
	    const res = await authedFetch("/auth/2fa/scratch/regenerate", {
    	      method: "POST",
    	      body: JSON.stringify({ code }),
	    });
            if (res.status === 401 || res.status === 409) {
                setError("Code invalide");
                return;
            }
            if (!res.ok) {
                setError("Une erreur est survenue");
                return;
            }
            const data = (await res.json()) as { scratchCodes: string[] };
            setRegenCodes(data.scratchCodes);
        } catch {
            setError("Une erreur est survenue");
        } finally {
            setSubmitting(false);
        }
    }

    function finishRegenerate() {
        setRegenCodes(null);
        setSaved(false);
        setCode("");
        setStatus("idle");
    }

    async function saveUsername() {
        setAccountError("");
        setAccountSaved(false);
        if (!/^[A-Za-z0-9_-]{3,32}$/.test(draftUsername)) {
            setAccountError("Nom d'utilisateur invalide (3 à 32 caractères : lettres, chiffres, _ ou -)");
            return;
        }
        setSavingAccount(true);
        try {
            const res = await authedFetch("/auth/me", {
                method: "PATCH",
                body: JSON.stringify({ username: draftUsername }),
            });
            if (res.status === 409) {
                setAccountError("Ce nom d'utilisateur est déjà pris");
                return;
            }
            if (res.status === 400) {
                setAccountError("Nom d'utilisateur invalide");
                return;
            }
            if (!res.ok) {
                setAccountError("Une erreur est survenue");
                return;
            }
            await refreshUser();
            setAccountSaved(true);
        } catch {
            setAccountError("Une erreur est survenue");
        } finally {
            setSavingAccount(false);
        }
    }

    async function uploadAvatar(file: File) {
        setAvatarError("");
        if (file.size > 1024 * 1024) {
            setAvatarError("Image trop lourde (max 1 Mo)");
            return;
        }
        setUploadingAvatar(true);
        const localPreview = URL.createObjectURL(file);
        setAvatarPreview(localPreview);
        try {
            const formData = new FormData();
            formData.append("avatar", file);
            const res = await authedFetch("/auth/me/avatar", {
                method: "PUT",
                body: formData,
            });
            if (res.status === 413) {
                setAvatarError("Image trop lourde (max 1 Mo)");
                return;
            }
            if (res.status === 400) {
                setAvatarError("Format non supporté (PNG, JPEG ou WebP)");
                return;
            }
            if (!res.ok) {
                setAvatarError("Une erreur est survenue");
                return;
            }
            await refreshUser();
        } catch {
            setAvatarError("Une erreur est survenue");
        } finally {
            setUploadingAvatar(false);
        }
    }
    return (
        <div className="login-card">
            <h1>Paramètres</h1>
            <h2>Compte</h2>
            <div>
                <p>
                    Email : <strong>{user.email}</strong>
                </p>
                <label>
                    Nom d'utilisateur :
                    <input
                        type="text"
                        value={draftUsername}
                        onChange={(e) => {
                            setDraftUsername(e.target.value);
                            setAccountError("");
                            setAccountSaved(false);
                        }}
                    />
                </label>
                {accountError && <p className="login-error">{accountError}</p>}
                {accountSaved && <p>Nom d'utilisateur mis à jour.</p>}
                <button
                    onClick={saveUsername}
                    disabled={
                        savingAccount ||
                        draftUsername === user.username ||
                        draftUsername === ""
                    }
                >
                    {savingAccount ? "Enregistrement..." : "Enregistrer"}
                </button>
            </div>
	    <h2>Avatar</h2>
            <div>
                {(avatarPreview !== null || user.avatarUrl !== null) && (
                    <img
                        src={avatarPreview ?? `${API_BASE}${user.avatarUrl}`}
                        alt="Avatar"
                        style={{ width: 96, height: 96, objectFit: "cover", borderRadius: "50%" }}
                    />
                )}
                <label>
                    Changer d'avatar :
                    <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        disabled={uploadingAvatar}
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file !== undefined)
                                uploadAvatar(file);
                        }}
                    />
                </label>
                {uploadingAvatar && <p>Envoi en cours...</p>}
                {avatarError && <p className="login-error">{avatarError}</p>}
            </div>
            <h2>Authentification à deux facteurs</h2>

            {error && <p className="login-error">{error}</p>}

            {status === "regenerate" ? (
                regenCodes === null ? (
                    <div>
                        <p>
                            <strong>Attention :</strong> régénérer vos codes de secours
                            invalidera immédiatement tous vos codes actuels. Vos anciens
                            codes ne fonctionneront plus.
                        </p>
                        <p>Entrez un code de votre application pour confirmer :</p>
                        <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            placeholder="123456"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                        />
                        <button onClick={confirmRegenerate} disabled={submitting}>
                            {submitting ? "Génération..." : "Régénérer les codes"}
                        </button>
                        <button type="button" onClick={finishRegenerate} disabled={submitting}>
                            Annuler
                        </button>
                    </div>
                ) : (
                    <div>
                        <p>Voici vos nouveaux codes de secours (affichés une seule fois) :</p>
                        <ul>
                            {regenCodes.map((c) => (
                                <li key={c}><code>{c}</code></li>
                            ))}
                        </ul>
                        <label>
                            <input
                                type="checkbox"
                                checked={saved}
                                onChange={(e) => setSaved(e.target.checked)}
                            />
                            J'ai sauvegardé mes nouveaux codes de secours
                        </label>
                        <button onClick={finishRegenerate} disabled={!saved}>
                            Terminé
                        </button>
                    </div>
                )
            ) : status === "setup" && setupData !== null ? (
                <div>
                    <p>1. Scannez ce QR code dans votre application d'authentification :</p>
                    <div style={{ background: "white", padding: "16px", display: "inline-block" }}>
                        <QRCode value={setupData.otpauthUri} size={180} />
                    </div>
                    <p>Ou entrez la clé manuellement :</p>
                    <code>{setupData.secret}</code>

                    <p>2. Sauvegardez vos codes de secours (affichés une seule fois) :</p>
                    <ul>
                        {setupData.scratchCodes.map((c) => (
                            <li key={c}><code>{c}</code></li>
                        ))}
                    </ul>
                    <label>
                        <input
                            type="checkbox"
                            checked={saved}
                            onChange={(e) => setSaved(e.target.checked)}
                        />
                        J'ai sauvegardé mes codes de secours
                    </label>

                    <p>3. Entrez le code de votre application pour activer :</p>
                    <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="123456"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                    />
                    <button onClick={confirmEnable} disabled={!saved || submitting}>
                        Activer
                    </button>
                </div>
            ) : user.totpEnabled ? (
                <div>
                    <p>La 2FA est <strong>activée</strong>.</p>
                    <p>Entrez un code pour la désactiver :</p>
                    <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="123456"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                    />
                    <button onClick={disable} disabled={submitting}>
                        Désactiver la 2FA
                    </button>
                    <button onClick={startRegenerate} disabled={submitting}>
                        Régénérer mes codes de secours
                    </button>
                </div>
            ) : (
                <div>
                    <p>La 2FA n'est pas activée.</p>
                    <button onClick={startSetup} disabled={submitting}>
                        Activer la 2FA
                    </button>
                </div>
            )}
        </div>
    );
}

export default Settings;
