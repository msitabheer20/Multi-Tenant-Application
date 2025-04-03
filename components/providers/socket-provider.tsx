"use client"

import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";
import { io as ClientIO } from "socket.io-client";

type SocketContextType = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socket: any | null;
    isConnected: boolean;
};

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({
    children
}: {
    children: React.ReactNode
}) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        // Delay socket initialization to improve initial load time
        const initializeSocket = () => {
            if (isInitialized) return;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const socketInstance = new (ClientIO as any)(process.env.NEXT_PUBLIC_SITE_URL!, {
                path: "/api/socket/io",
                addTrailingSlash: false,
            });

            socketInstance.on("connect", () => {
                setIsConnected(true);
            });

            socketInstance.on("disconnect", () => {
                setIsConnected(false);
            });

            setSocket(socketInstance);
            setIsInitialized(true);
        };

        // Delay socket initialization to prioritize UI rendering
        const timer = setTimeout(initializeSocket, 500);

        return () => {
            clearTimeout(timer);
            if (socket) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (socket as any).disconnect();
            }
        }
    }, [isInitialized, socket]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    )
}