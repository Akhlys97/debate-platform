import { Timestamp } from "firebase/firestore";

export interface ApplicationJSON{
   uid: string;
   institutionName: string;
   contactAddress: string;
   status: "pending" | "approved" | "rejected";
   submittedAt: Date; 
}

export type ApplicationFirestoreData = Omit<ApplicationJSON, "submittedAt"> & { submittedAt: Timestamp }

export function convertApplicationFirestoreData(raw: ApplicationFirestoreData): ApplicationJSON{
    return{
        ...raw,
        submittedAt: raw.submittedAt.toDate()
    };
}