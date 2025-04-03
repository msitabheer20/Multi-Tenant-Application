import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { currentProfile } from '@/lib/current-profile'


export async function POST(req: Request) {
    const SIGNING_SECRET = process.env.SIGNING_SECRET

  if (!SIGNING_SECRET) {
    throw new Error('Error: Please add SIGNING_SECRET from Clerk Dashboard to .env or .env')
  }

  // Create new Svix instance with secret
  const wh = new Webhook(SIGNING_SECRET)

    // Get headers
    const headerPayload = await headers()
    const svix_id = headerPayload.get('svix-id')
    const svix_timestamp = headerPayload.get('svix-timestamp')
    const svix_signature = headerPayload.get('svix-signature')

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response('Error: Missing Svix headers', {
            status: 400,
        })
    }

    // Get body
    const payload = await req.json()
    const body = JSON.stringify(payload)
    // const profile = await currentProfile();

    let evt: WebhookEvent

    // Verify payload with headers
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

    // Do something with payload
    // For this guide, log payload to console
    const { id } = evt.data
    const eventType = evt.type

    if (eventType === "user.updated") {
        const { id, first_name, last_name, image_url } = evt.data;

        // Ensure profile is fetched correctly
        // if (!profile) {
        //     console.error('Profile not found for the current user.');
        //     return new Response('Profile not found', { status: 404 });
        // }

        try {
            const profile = await db.profile.findUnique({
                where: { userId: id },
            })
            if (!profile) {
                return new Response('Profile not found', { status: 404 });
            }
            
            const updatedProfile = await db.profile.update({
                where: { userId: id }, // Ensure this userId exists
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