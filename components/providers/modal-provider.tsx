"use client"

import { lazy, Suspense, useEffect, useState } from "react"

const CreateServerModal = lazy(() => import("@/components/modals/create-server-modal").then(mod => ({ default: mod.CreateServerModal })));
const InviteModal = lazy(() => import("@/components/modals/invite-modal").then(mod => ({ default: mod.InviteModal })));
const EditServerModal = lazy(() => import("@/components/modals/edit-server-modal").then(mod => ({ default: mod.EditServerModal })));
const MembersModal = lazy(() => import("@/components/modals/members-modal").then(mod => ({ default: mod.MembersModal })));
const CreateChannelModal = lazy(() => import("@/components/modals/create-channel-modal").then(mod => ({ default: mod.CreateChannelModal })));
const LeaveServerModal = lazy(() => import("@/components/modals/leave-server-modal").then(mod => ({ default: mod.LeaveServerModal })));
const DeleteServerModal = lazy(() => import("@/components/modals/delete-server-modal").then(mod => ({ default: mod.DeleteServerModal })));
const DeleteChannelModal = lazy(() => import("@/components/modals/delete-channel-modal").then(mod => ({ default: mod.DeleteChannelModal })));
const EditChannelModal = lazy(() => import("@/components/modals/edit-channel-modal").then(mod => ({ default: mod.EditChannelModal })));
const MessageFileModal = lazy(() => import("@/components/modals/message-file-modal").then(mod => ({ default: mod.MessageFileModal })));
const DeleteMessageModal = lazy(() => import("@/components/modals/delete-message-modal").then(mod => ({ default: mod.DeleteMessageModal })));
const CreateBotModal = lazy(() => import("@/components/modals/create-bot-modal").then(mod => ({ default: mod.CreateBotModal })));

const ModalFallback = () => <div className="hidden"></div>;

export const ModalProvider = () => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return null;
    }

    return (
        <Suspense fallback={<ModalFallback />}>
            <CreateServerModal />
            <InviteModal />
            <EditServerModal />
            <MembersModal />
            <CreateChannelModal />
            <LeaveServerModal />
            <DeleteServerModal />
            <DeleteChannelModal />
            <EditChannelModal />
            <MessageFileModal />
            <DeleteMessageModal />
            <CreateBotModal />
        </Suspense>
    )
}