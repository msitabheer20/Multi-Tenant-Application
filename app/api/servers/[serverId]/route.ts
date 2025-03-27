import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

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