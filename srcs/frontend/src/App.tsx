/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   App.tsx                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: odile <odile@student.42.fr>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/06/02 00:24:23 by odile             #+#    #+#             */
/*   Updated: 2026/06/02 19:35:18 by odile            ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
//import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Friends from "./pages/Friends";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Chat from "./pages/Chat";
import { AuthProvider } from "./context/AuthContext";
import RequireAuth from "./components/RequireAuth";
import PresenceHeartbeat from "./components/PresenceHeartbeat";
import Profile from "./pages/Profile";

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <PresenceHeartbeat />
                <Layout>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
                        <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
                        {/*<Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />*/}
                        <Route path="/chat" element={<RequireAuth><Chat /></RequireAuth>} />
                        <Route path="/friends" element={<RequireAuth><Friends /></RequireAuth>} />
                        <Route path="/privacy" element={<PrivacyPolicy />} />
                        <Route path="/terms" element={<TermsOfService />} />
                    </Routes>
                </Layout>
            </AuthProvider>
        </BrowserRouter>
    );
}
export default App;
