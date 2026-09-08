import { Timestamp } from "firebase/firestore";
export type JoinRequestFirestoreData = Omit<JoinRequestJSON, "createdAt"> & { createdAt: Timestamp }

export interface JoinRequestJSON{
    communityId: string;
    requesterUid: string;
    reviewerUid?: string
    status: "pending" | "accepted" | "declined";
    createdAt: Date;
}

export function convertJoinRequestFirestoreData(raw: JoinRequestFirestoreData): JoinRequestJSON{
    return{
        ...raw,
        createdAt: raw.createdAt.toDate(),
    };
}