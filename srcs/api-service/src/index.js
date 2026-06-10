import express from "express";
import axios from "axios";

const app = express();
const PORT = 3000;

// Variables d'environnement injectées par docker-compose + Makefile
const VAULT_ADDR = process.env.VAULT_ADDR;
const ROLE_ID = process.env.VAULT_ROLE_ID;
const SECRET_ID = process.env.VAULT_SECRET_ID;

async function vaultLogin() {
  try {
    console.log("Authenticating to Vault...");

    const response = await axios.post(`${VAULT_ADDR}/v1/auth/approle/login`, {
      role_id: ROLE_ID,
      secret_id: SECRET_ID,
    });

    const clientToken = response.data.auth.client_token;


    return clientToken;
  } catch (err) {
    console.error("Vault login failed:", err.response?.data || err.message);
	console.log("ROLE_ID = ", ROLE_ID, ", SECRET_ID = ", SECRET_ID);
    throw err;
  }
}

async function getSecrets(token) {
  try {
    console.log("Fetching secrets from Vault...");

    const response = await axios.get(`${VAULT_ADDR}/v1/secret/data/mariadb-service`, {
      headers: { "X-Vault-Token": token },
    });

    const secrets = response.data.data.data;
    console.log("Secrets retrieved:", secrets);

    return secrets;
  } catch (err) {
    console.error("Failed to fetch secrets:", err.response?.data || err.message);
    throw err;
  }
}

async function init() {
  try {
    const token = await vaultLogin();
    const secrets = await getSecrets(token);

    // Exemple : utiliser un secret
    console.log("API_KEY =", secrets.API_KEY);

	app.get("/secret", (req, res) => {
      res.json(secrets);
    });

    app.listen(PORT, () => {
      console.log(`API service running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Fatal error during startup:", err.message);
    process.exit(1);
  }
}

init();

