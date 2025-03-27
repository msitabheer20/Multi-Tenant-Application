import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/db";
import { currentProfile } from "@/lib/current-profile";
import { MemberRole } from "@prisma/client";

export async function createServer(name: string, imageUrl: string) {
    try {
        const profile = await currentProfile();
        
        if (!profile) {
            throw new Error("Unauthorized");
        }

        const server = await db.server.create({
            data: {
                profileId: profile.id,
                name,
                imageUrl,
                inviteCode: uuidv4(),
                channels: {
                    create: [
                        { name: "general", profileId: profile.id }
                    ]
                },
                members: {
                    create: [
                        { profileId: profile.id, role: MemberRole.ADMIN }
                    ]
                }
            }
        });

        return {
            success: true,
            server: {
                id: server.id,
                name: server.name,
                inviteCode: server.inviteCode
            }
        };
    } catch (error) {
        console.error("[CREATE_SERVER]", error);
        return {
            success: false,
            error: "Failed to create server"
        };
    }
}

export async function deleteServer(serverId: string) {
    try {
        const profile = await currentProfile();
        
        if (!profile) {
            throw new Error("Unauthorized");
        }

        const server = await db.server.delete({
            where: {
                id: serverId,
                profileId: profile.id
            },
        });

        return {
            success: true,
            server: {
                id: server.id,
                name: server.name
            }
        };
    } catch (error) {
        console.error("[DELETE_SERVER]", error);
        return {
            success: false,
            error: "Failed to delete server"
        };
    }
}

export async function updateServer(serverId: string, name: string, imageUrl: string) {
    try {
        const profile = await currentProfile();
        
        if (!profile) {
            throw new Error("Unauthorized");
        }

        const server = await db.server.update({
            where: {
                id: serverId,
                profileId: profile.id
            },
            data: {
                name,
                imageUrl,
            }
        });

        return {
            success: true,
            server: {
                id: server.id,
                name: server.name,
                imageUrl: server.imageUrl
            }
        };
    } catch (error) {
        console.error("[UPDATE_SERVER]", error);
        return {
            success: false,
            error: "Failed to update server"
        };
    }
}

export async function getMembers(serverId: string) {
    try {
        const profile = await currentProfile();
        
        if (!profile) {
            throw new Error("Unauthorized");
        }

        const server = await db.server.findUnique({
            where: {
                id: serverId,
            },
            include: {
                members: {
                    include: {
                        profile: true
                    },
                    orderBy: {
                        role: "asc"
                    }
                }
            }
        });

        if (!server) {
            throw new Error("Server not found");
        }

        return {
            success: true,
            server: {
                id: server.id,
                name: server.name,
                members: server.members.map(member => ({
                    id: member.id,
                    role: member.role,
                    profile: {
                        id: member.profile.id,
                        name: member.profile.name,
                        email: member.profile.email,
                        imageUrl: member.profile.imageUrl
                    }
                }))
            }
        };
    } catch (error) {
        console.error("[GET_MEMBERS]", error);
        return {
            success: false,
            error: "Failed to get members"
        };
    }
}