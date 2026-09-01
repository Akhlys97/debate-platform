import { Timestamp } from "firebase/firestore";
export type InviteFirestoreData = Omit<InviteJSON, "createdAt"> & { createdAt: Timestamp }

export interface InviteJSON{
    communityId: string;
    inviterUid: string;
    inviteeUid: string;
    status: "pending" | "accepted" | "declined";
    createdAt: Date;
}

export function convertInviteFirestoreData(raw: InviteFirestoreData): InviteJSON{
    return{
        ...raw,
        createdAt: raw.createdAt.toDate(),
    };
}