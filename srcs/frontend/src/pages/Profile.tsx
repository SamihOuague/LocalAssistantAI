import { useAuth } from "../context/AuthContext";
import { API_BASE } from "../config";

function Profile() {
    const { user } = useAuth();

    if (user === null)
        return null;

    const initial = user.username.charAt(0).toUpperCase();
    const memberSince = new Date(user.createdAt).toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    return (
        <div className="login-card">
            <h1>Mon profil</h1>

            {user.avatarUrl !== null ? (
                <img
		    src={`${API_BASE}${user.avatarUrl}`}
                    alt="Avatar"
                    style={{
                        width: "96px",
                        height: "96px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        margin: "0 auto 16px",
                        display: "block",
                    }}
                />
            ) : (
                <div
                    style={{
                        width: "96px",
                        height: "96px",
                        borderRadius: "50%",
                        background: "#888",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "40px",
                        margin: "0 auto 16px",
                    }}
                >
                    {initial}
                </div>
            )}

            <p><strong>Nom d'utilisateur :</strong> {user.username}</p>
            <p><strong>Email :</strong> {user.email}</p>
            <p><strong>Membre depuis :</strong> {memberSince}</p>
            <p><strong>Amis :</strong> {user.friendCount}</p>
            <p>
                <strong>Authentification à deux facteurs :</strong>{" "}
                {user.totpEnabled ? "activée" : "désactivée"}
            </p>
        </div>
    );
}

export default Profile;
