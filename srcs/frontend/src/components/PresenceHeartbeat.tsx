import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";

const HEARTBEAT_INTERVAL_MS = 30_000;

export default function PresenceHeartbeat() {
    const { accessToken, authedFetch } = useAuth();

    const authedFetchRef = useRef(authedFetch);
    useEffect(() => {
        authedFetchRef.current = authedFetch;
    });

    useEffect(() => {
        if (!accessToken) return;

        const beat = () => {
            void authedFetchRef.current("/auth/presence/heartbeat", {
                method: "POST",
            }).catch(() => {
            });
        };

        beat();
        const id = window.setInterval(beat, HEARTBEAT_INTERVAL_MS);

        const onVisible = () => {
            if (document.visibilityState === "visible") beat();
        };
        document.addEventListener("visibilitychange", onVisible);

        return () => {
            window.clearInterval(id);
            document.removeEventListener("visibilitychange", onVisible);
        };
    }, [accessToken]);

    return null;
}
