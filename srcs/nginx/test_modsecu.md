
---

### 1️⃣ Principe général avec Nginx

Pour avoir un WAF “hardened” :

- **ModSecurity v3** (libmodsecurity)
- **Module Nginx modsecurity** (nginx-module)
- **OWASP Core Rule Set (CRS)**

Et côté Nginx :

- activer ModSecurity au niveau du `server` ou `location`
- charger les règles globales + CRS
- commencer en `DetectionOnly`, puis passer en `On`

---


---

### 5️⃣ Comment tester que ton WAF fonctionne

Une fois le conteneur lancé :

```bash
curl -k "https://souaguen.42.fr/?param=<script>alert(1)</script>"
```

Puis dans le conteneur Nginx :

```bash
docker logs nginx   # ou
docker exec -it nginx cat /var/log/nginx/modsec_audit.log
```

Tu dois voir des entrées ModSecurity / CRS.

---

## 🔥 Test SQL Injection
```
curl -vk "https://souaguen.42.fr/?id=1%27%20OR%20%271%27=%271"
```

Attendu :  
👉 **403 Forbidden**

## 🔥 Test Path Traversal
```
curl -vk "https://souaguen.42.fr/?file=../../etc/passwd"
```

Attendu :  
👉 **403 Forbidden**

## 🔥 Test User-Agent malveillant
```
curl -vk -A "sqlmap" https://souaguen.42.fr
```

Attendu :  
👉 **403 Forbidden**

# 🟩 Test suivant : NoSQL Injection

Commande :

```
curl -vk "https://souaguen.42.fr/?search%5B%24ne%5D=1"
```

Résultat attendu :  
👉 **403 Forbidden**

---

### 6️⃣ Pour la soutenance, tu peux dire

> “Nous avons intégré un WAF basé sur ModSecurity v3 et l’OWASP Core Rule Set, activé au niveau de Nginx en mode détection, avec possibilité de passer en mode blocage. Le WAF inspecte les requêtes HTTP/HTTPS et journalise les tentatives d’attaque (XSS, SQLi, RCE, etc.), renforçant la surface de sécurité de notre reverse proxy.”
