import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { ServerWithMembersWithProfiles } from "@/types";

export async function DELETE(
    req: Request, 
    {params} : {params: {serverId: string}}
) {
    try {
        const profile = await currentProfile();

        if (!profile) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const server = await db.server.delete({
            where: {
                id: params.serverId,
                profileId: profile.id
            },
        });

        return NextResponse.json({
            success: true,
            server: {
                id: server.id,
                name: server.name
            }
        });
    } catch (error) {
        console.error("[SERVER_ID_DELETE]", error);
        return NextResponse.json(
            { success: false, error: "Failed to delete server" },
            { status: 500 }
        );
    }
}


export async function PATCH(
    req: Request, 
    {params} : {params: {serverId: string}}
) {
    try {
        const profile = await currentProfile();
        const { name, imageUrl } = await req.json();

        if (!profile) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const server = await db.server.update({
            where: {
                id: params.serverId,
                profileId: profile.id
            },
            data: {
                name,
                imageUrl,
            }
        });

        return NextResponse.json({
            success: true,
            server: {
                id: server.id,
                name: server.name,
                imageUrl: server.imageUrl
            }
        });
    } catch (error) {
        console.error("[SERVER_ID_PATCH]", error);
        return NextResponse.json(
            { success: false, error: "Failed to update server" },
            { status: 500 }
        );
    }
}

export async function GET(
    req: Request,
    { params }: { params: { serverId: string } }
) {
    try {
        const profile = await currentProfile();

        if (!profile) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const server = await db.server.findUnique({
            where: {
                id: params.serverId,
            },
            include: {
                members: {
                    include: {
                        profile: true
                    }
                }
            }
        });

        if (!server) {
            return NextResponse.json(
                { success: false, error: "Server not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            server: server as unknown as ServerWithMembersWithProfiles
        });
    } catch (error) {
        console.error("[SERVER_ID_GET]", error);
        return NextResponse.json(
            { success: false, error: "Failed to get server" },
            { status: 500 }
        );
    }
}