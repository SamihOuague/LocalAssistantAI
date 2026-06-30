// **************************************************************************** #
//                                                                              #
//                                                         :::      ::::::::    #
//    RequireAuth.tsx                                    :+:      :+:    :+:    #
//                                                     +:+ +:+         +:+      #
//    By: lsouc <lsouc@student.42paris.fr>           +#+  +:+       +#+         #
//                                                 +#+#+#+#+#+   +#+            #
//    Created: 2026/06/07 21:49:30 by lsouc             #+#    #+#              #
//    Updated: 2026/06/07 21:49:39 by lsouc            ###   ########.fr        #
//                                                                              #
// **************************************************************************** #

import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface Props {
    children: React.ReactNode;
}

function RequireAuth({ children }: Props) {
    const { user, loading } = useAuth();

    if (loading)
        return null;
    if (user === null)
        return <Navigate to="/login" replace />;
    return <>{children}</>;
}

export default RequireAuth;
