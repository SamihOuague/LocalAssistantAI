/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Dashboard.tsx                                      :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: odile <odile@student.42.fr>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/06/02 19:18:52 by odile             #+#    #+#             */
/*   Updated: 2026/06/03 22:21:26 by odile            ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { useEffect, useState } from "react";

interface Config {
	db_name: string;
	db_host: string;
	db_dialect: string;
}

function Dashboard() {
	const [config, setConfig] = useState<Config | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	useEffect(() => {
		fetch("http://api-test:3001/config")
			.then((res) => {
				if (!res.ok)
					throw new Error("API unavailable");
				return res.json();
			})
			.then((data) => {
				setConfig(data);
				setLoading(false);
			})
			.catch((err) => {
				setError(err.message);
				setLoading(false);
			});
	}, []);
	if (loading)
		return <h2>Loading...</h2>;
	if (error)
		return <h2>Error: {error}</h2>;
	return (
		<div style={{ padding: "2rem" }}>
			<h1>Dashboard</h1>
			<h2>Configuration récupérée depuis Vault</h2>
			<ul>
				<li>
					<strong>DB_NAME :</strong>{" "}
					{config?.db_name}
				</li>
				<li>
					<strong>DB_HOST :</strong>{" "}
					{config?.db_host}
				</li>
				<li>
					<strong>DB_DIALECT :</strong>{" "}
					{config?.db_dialect}
				</li>
			</ul>
		</div>
	);
}
export default Dashboard;