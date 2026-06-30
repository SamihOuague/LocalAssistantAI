/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Footer.tsx                                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: odile <odile@student.42.fr>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/06/02 00:07:03 by odile             #+#    #+#             */
/*   Updated: 2026/06/02 11:06:18 by odile            ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Link } from "react-router-dom";


function Footer() {
    return (
		<footer className="bg-dark text-light py-3">
			<div className="container text-center">
				<p className="mb-2">
					© 2026 Transcendance
				</p>
				<div className="d-flex justify-content-center gap-3">
					<Link className="text-light" to="/privacy">
						Privacy Policy
					</Link>
					<Link className="text-light" to="/terms">
						Terms of Service
					</Link>
				</div>
			</div>
		</footer>
    );
}
export default Footer;
