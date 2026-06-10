/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Dashboard.tsx                                      :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: odile <odile@student.42.fr>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/06/02 19:18:52 by odile             #+#    #+#             */
/*   Updated: 2026/06/02 19:20:16 by odile            ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

function Dashboard() {
    const user = {
    username: "odile",
    status: "active",
    role: "admin",
    };
    const apiData = [
        "Première donnée API",
        "Deuxième donnée API",
        "Troisième donnée API",
    ];
    return (
        <div className="dashboard-container">
            <h1>Dashboard API</h1>
            <div className="dashboard-card">
                <p>
                    <strong>User Name :</strong> {user.username}
                </p>
                <p>
                    <strong>Status :</strong> {user.status}
                </p>
                <p>
                    <strong>Role :</strong> {user.role}
                </p>
            </div>
            <div className="dashboard-card">
                <h2>Données API</h2>
                <ul>
                    {apiData.map((item, index) => (
                        <li key={index}>
                            {item}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
export default Dashboard;
