/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Layout.tsx                                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: odile <odile@student.42.fr>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/06/02 00:07:48 by odile             #+#    #+#             */
/*   Updated: 2026/06/02 11:05:15 by odile            ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import Navbar from "./Navbar";
import Footer from "./Footer";
import { useLocation } from "react-router-dom";

interface Props {
    children: React.ReactNode;
}

function Layout({ children }: Props) {
	const location = useLocation();

	return (
		<div className="d-flex flex-column justyfy-content-center min-vh-100">
			{(location.pathname !== "/chat") && <Navbar />}
			<main className="flex-grow-1 d-flex justify-content-center align-items-center">
				{children}
			</main>
			{(location.pathname !== "/chat") && <Footer />}
		</div>
    );
}
export default Layout;
