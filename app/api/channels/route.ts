import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { MemberRole } from "@prisma/client";
import { NextResponse } from "next/server";

export async function POST(
    request: Request,
    { params }: { params: { serverId: string } }
) {
    try {
        const profile = await currentProfile();

        const { name, type} = await request.json();

        const { searchParams } = new URL(request.url);

        const serverId = searchParams.get("serverId");

        if (!profile) {
            return new NextResponse("Unauthorized", { status: 401 } );
        }

        if (!serverId) {
            return new NextResponse("Server ID is missing", { status: 400 } );
        }

        if (name === "general") {
            return new NextResponse("Name cannot be 'general'", { status: 400 } );
        }

        const server = await db.server.update({
            where: {
                id: serverId,
                members: {
                    some: {
                        profileId: profile.id,
                        role: {
                            in: [MemberRole.ADMIN, MemberRole.MODERATOR]
                        }
                    }
                }
            },
            data: {
                channels: {
                    create: {
                        profileId: profile.id,
                        name,
                        type
                    }
                }
            }
        });

        return NextResponse.json(server);
        
    } catch (error: any) {
        console.log(`Failed to create channel: ${error.message}`);
        return new NextResponse("Internal error", { status: 500 } );
    }
}
