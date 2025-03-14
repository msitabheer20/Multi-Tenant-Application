import React from 'react'
import { initialProfile } from '@/lib/initial-profile'
import { db } from '@/lib/db'
import { redirect } from "next/navigation"
import { InitialModal } from '@/components/modals/initial-modal'

const SetupPage = async () => {

    const profile = await initialProfile()

    const server = await db.server.findFirst({
        where: {
            members: {
                some: {
                    profileId: profile.id
                }
            }
        }
    })

    if (server) {
        return redirect(`/servers/${server.id}`)
    }

    return (
        <div className="h-screen flex justify-center items-center relative w-full max-w-lg mx-auto !m-0 !p-0 !static">
            <InitialModal />
        </div>
    )
}

export default SetupPage