import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase"; 
import { ApplicationJSON } from "@/types/application";

export async function hasPendingApplication(uid: string): Promise<boolean>{
    const q = query(
        collection(db, "applications"),
        where("uid", "==", uid),
        where("status", "==", "pending")
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
}

export async function createApplication(uid: string, institutionName: string, contactAddress: string){
    const applicationData: ApplicationJSON = {
        uid,
        institutionName,
        contactAddress,
        status: "pending",
        submittedAt: new Date()
    };
    await addDoc(collection(db, "applications"), applicationData);
}