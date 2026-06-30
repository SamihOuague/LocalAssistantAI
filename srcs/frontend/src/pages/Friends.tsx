import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { API_BASE } from "../config";

const FRIENDS_BASE = "/auth/friends";
const USERS_BASE = "/auth/users";

interface PublicUser {
    id: string;
    username: string;
    avatarUrl: string | null;
    isOnline: boolean;
}

type SearchUser = Omit<PublicUser, "isOnline">;

interface ListResponse {
    data: PublicUser[];
    pagination: { limit: number; offset: number; hasMore: boolean };
}

interface SearchResponse {
    data: SearchUser[];
    pagination: { limit: number; offset: number; hasMore: boolean };
}

interface UserRowProps {
    user: SearchUser & { isOnline?: boolean };
    actions: React.ReactNode;
}

function UserRow({ user, actions }: UserRowProps) {
    return (
        <li
            className="friend-row"
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 0" }}
        >
            {user.isOnline !== undefined && (
                <span
                    title={user.isOnline ? "En ligne" : "Hors ligne"}
                    style={{
                        display: "inline-block",
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        background: user.isOnline ? "#22c55e" : "#9ca3af",
                        flexShrink: 0,
                    }}
                />
            )}
            {user.avatarUrl && (
                <img
		    src={`${API_BASE}${user.avatarUrl}`}
                    alt=""
                    style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover" }}
                />
            )}
            <span style={{ flexGrow: 1 }}>{user.username}</span>
            {actions}
        </li>
    );
}

function Friends() {
    const { user, accessToken, authedFetch } = useAuth();
    const [friends, setFriends] = useState<PublicUser[]>([]);
    const [incoming, setIncoming] = useState<PublicUser[]>([]);
    const [outgoing, setOutgoing] = useState<PublicUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actingId, setActingId] = useState<string | null>(null);

    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchUser[]>([]);
    const [searching, setSearching] = useState(false);

    const loadAll = useCallback(async () => {
        if (accessToken === null)
            return;
        setError("");
        try {
            const [fRes, iRes, oRes] = await Promise.all([
                authedFetch(`${FRIENDS_BASE}/?limit=100`),
                authedFetch(`${FRIENDS_BASE}/requests/incoming?limit=100`),
                authedFetch(`${FRIENDS_BASE}/requests/outgoing?limit=100`),
            ]);
            if (!fRes.ok || !iRes.ok || !oRes.ok) {
                setError("Impossible de charger vos amis");
                return;
            }
            const [fData, iData, oData] = await Promise.all([
                fRes.json() as Promise<ListResponse>,
                iRes.json() as Promise<ListResponse>,
                oRes.json() as Promise<ListResponse>,
            ]);
            setFriends(fData.data);
            setIncoming(iData.data);
            setOutgoing(oData.data);
        } catch {
            setError("Une erreur est survenue");
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    useEffect(() => {
        if (accessToken === null)
            return;
        const trimmed = query.trim();
        if (trimmed.length < 2) {
            setResults([]);
            setSearching(false);
            return;
        }
        let ignore = false;
        setSearching(true);
        const timer = setTimeout(async () => {
            try {
                const res = await authedFetch(
                    `${USERS_BASE}/search?q=${encodeURIComponent(trimmed)}`,
                );
                if (ignore)
                    return;
                if (!res.ok) {
                    setResults([]);
                    return;
                }
                const body = (await res.json()) as SearchResponse;
                if (!ignore)
                    setResults(body.data);
            } catch {
                if (!ignore)
                    setResults([]);
            } finally {
                if (!ignore)
                    setSearching(false);
            }
        }, 300);
        return () => {
            ignore = true;
            clearTimeout(timer);
        };
    }, [query, accessToken]);

    if (user === null || accessToken === null)
        return null;

    async function add(id: string) {
        setError("");
        setActingId(id);
        try {
            const res = await authedFetch(`${FRIENDS_BASE}/requests`, {
                method: "POST",
                body: JSON.stringify({ userId: id }),
            });
            if (res.ok || res.status === 409) {
                setResults((prev) => prev.filter((u) => u.id !== id));
                await loadAll();
                return;
            }
            setError("Impossible d'envoyer la demande");
        } catch {
            setError("Une erreur est survenue");
        } finally {
            setActingId(null);
        }
    }

    async function accept(id: string) {
        setError("");
        setActingId(id);
        try {
            const res = await authedFetch(`${FRIENDS_BASE}/requests/${id}/accept`, {
                method: "POST",
            });
            if (res.ok || res.status === 409 || res.status === 404) {
                await loadAll();
                return;
            }
            setError("Impossible d'accepter la demande");
        } catch {
            setError("Une erreur est survenue");
        } finally {
            setActingId(null);
        }
    }

    async function remove(id: string) {
        setError("");
        setActingId(id);
        try {
            const res = await authedFetch(`${FRIENDS_BASE}/${id}`, {
                method: "DELETE",
            });
            if (res.ok || res.status === 404) {
                await loadAll();
                return;
            }
            setError("L'action a échoué");
        } catch {
            setError("Une erreur est survenue");
        } finally {
            setActingId(null);
        }
    }

    if (loading)
        return (
            <div className="login-card">
                <h1>Amis</h1>
                <p>Chargement…</p>
            </div>
        );

    return (
        <div className="login-card">
            <h1>Amis</h1>

            {error && <p className="login-error">{error}</p>}

            <h2>Ajouter un ami</h2>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher par nom d'utilisateur…"
                autoComplete="off"
                style={{ width: "100%", boxSizing: "border-box" }}
            />
            {query.trim().length >= 2 && (
                <ul>
                    {searching && results.length === 0 ? (
                        <p>Recherche…</p>
                    ) : results.length === 0 ? (
                        <p>Aucun utilisateur trouvé.</p>
                    ) : (
                        results.map((u) => (
                            <UserRow
                                key={u.id}
                                user={u}
                                actions={
                                    <button onClick={() => add(u.id)} disabled={actingId === u.id}>
                                        Ajouter
                                    </button>
                                }
                            />
                        ))
                    )}
                </ul>
            )}

            <h2>Mes amis ({friends.length})</h2>
            {friends.length === 0 ? (
                <p>Vous n'avez pas encore d'amis.</p>
            ) : (
                <ul>
                    {friends.map((f) => (
                        <UserRow
                            key={f.id}
                            user={f}
                            actions={
                                <button onClick={() => remove(f.id)} disabled={actingId === f.id}>
                                    Retirer
                                </button>
                            }
                        />
                    ))}
                </ul>
            )}

            <h2>Demandes reçues ({incoming.length})</h2>
            {incoming.length === 0 ? (
                <p>Aucune demande reçue.</p>
            ) : (
                <ul>
                    {incoming.map((u) => (
                        <UserRow
                            key={u.id}
                            user={u}
                            actions={
                                <>
                                    <button onClick={() => accept(u.id)} disabled={actingId === u.id}>
                                        Accepter
                                    </button>
                                    <button onClick={() => remove(u.id)} disabled={actingId === u.id}>
                                        Refuser
                                    </button>
                                </>
                            }
                        />
                    ))}
                </ul>
            )}

            <h2>Demandes envoyées ({outgoing.length})</h2>
            {outgoing.length === 0 ? (
                <p>Aucune demande envoyée.</p>
            ) : (
                <ul>
                    {outgoing.map((u) => (
                        <UserRow
                            key={u.id}
                            user={u}
                            actions={
                                <button onClick={() => remove(u.id)} disabled={actingId === u.id}>
                                    Annuler
                                </button>
                            }
                        />
                    ))}
                </ul>
            )}
        </div>
    );
}

export default Friends;
