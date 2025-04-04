import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { db } from '@/lib/db'


export async function POST(req: Request) {
    const SIGNING_SECRET = process.env.SIGNING_SECRET

  if (!SIGNING_SECRET) {
    throw new Error('Error: Please add SIGNING_SECRET from Clerk Dashboard to .env or .env')
  }

  const wh = new Webhook(SIGNING_SECRET)

    const headerPayload = await headers()
    const svix_id = headerPayload.get('svix-id')
    const svix_timestamp = headerPayload.get('svix-timestamp')
    const svix_signature = headerPayload.get('svix-signature')

    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response('Error: Missing Svix headers', {
            status: 400,
        })
    }

    const payload = await req.json()
    const body = JSON.stringify(payload)

    let evt: WebhookEvent


    try {
        evt = wh.verify(body, {
            'svix-id': svix_id,
            'svix-timestamp': svix_timestamp,
            'svix-signature': svix_signature,
        }) as WebhookEvent
    } catch (err) {
        console.error('Error: Could not verify webhook:', err)
        return new Response('Error: Verification error', {
            status: 400,
        })
    }

    const { id } = evt.data
    const eventType = evt.type

    if (eventType === "user.updated") {
        const { id, first_name, last_name, image_url } = evt.data;

        try {
            const profile = await db.profile.findUnique({
                where: { userId: id },
            })
            if (!profile) {
                return new Response('Profile not found', { status: 404 });
            }
            
            const updatedProfile = await db.profile.update({
                where: { userId: id },
                data: { 
                    name: `${first_name} ${last_name}`, 
                    imageUrl: image_url 
                }
            });
            console.log('Profile updated successfully:', updatedProfile);
        } catch (error) {
            console.error('Error updating profile:', error);
            return new Response('Error updating profile', { status: 500 });
        }
    }
    
    console.log(`Received webhook with ID ${id} and event type of ${eventType}`)
    console.log('Webhook payload:', body)
    console.log('Received webhook data:', evt.data)

    return new Response('Webhook received', { status: 200 })
}