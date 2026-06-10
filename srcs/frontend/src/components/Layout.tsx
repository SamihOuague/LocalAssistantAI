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
interface Props {
    children: React.ReactNode;
}
function Layout({ children }: Props) {
    return (
        <>
            <Navbar />
            <main className="content">
                {children}
            </main>
            <Footer />
        </>
    );
}
export default Layout;