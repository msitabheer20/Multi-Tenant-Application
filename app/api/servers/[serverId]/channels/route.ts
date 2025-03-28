import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";

export async function GET(
    req: Request,
    { params }: { params: { serverId: string } }
) {
    try {
        const profile = await currentProfile();

        if (!profile) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        if (!params.serverId) {
            return new NextResponse("Server ID missing", { status: 400 });
        }

        const server = await db.server.findUnique({
            where: {
                id: params.serverId,
                members: {
                    some: {
                        profileId: profile.id
                    }
                }
            },
            include: {
                channels: {
                    orderBy: {
                        createdAt: "asc",
                    },
                },
            },
        });

        if (!server) {
            return new NextResponse("Server not found", { status: 404 });
        }

        return NextResponse.json(server.channels);
    } catch (error) {
        console.log("[CHANNELS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
} 