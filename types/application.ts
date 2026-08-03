import { Timestamp } from "firebase/firestore";

export type ApplicationFirestoreData = Omit<ApplicationJSON, "submittedAt"> & { submittedAt: Timestamp }

export interface ApplicationJSON{
   uid: string;
   institutionName: string;
   contactAddress: string;
   status: "pending" | "approved" | "rejected";
   submittedAt: Date; 
}

export function convertApplicationFirestoreData(raw: ApplicationFirestoreData): ApplicationJSON{
    return{
        ...raw,
        submittedAt: raw.submittedAt.toDate()
    };
}