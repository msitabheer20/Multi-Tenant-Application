import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { MemberRole } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
    try {
        const { name, imageUrl } = await req.json();
        const profile = await currentProfile();

        if (!profile) {
            return new NextResponse("Unauthorized", { status: 401 });
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

        return NextResponse.json({
            success: true,
            server: {
                id: server.id,
                name: server.name,
                inviteCode: server.inviteCode
            }
        });
    } catch (error) {
        console.error("[SERVER_CREATE]", error);
        return NextResponse.json(
            { success: false, error: "Failed to create server" },
            { status: 500 }
        );
    }
} 