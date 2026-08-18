import { addDoc, collection, doc, getDocs, query, where, writeBatch } from "firebase/firestore";
import { db } from "./firebase"; 
import { ApplicationFirestoreData, ApplicationJSON, convertApplicationFirestoreData } from "@/types/application";

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

export async function fetchPendingApplications(): Promise<(ApplicationJSON & {id: string})[]>{
    const q = query(
        collection(db, "applications"),
        where("status", "==", "pending")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => {
        const data = convertApplicationFirestoreData(docSnap.data() as ApplicationFirestoreData);
        return { ...data, id: docSnap.id };
    });
}

export async function decideApplication(applicationId: string, uid: string, decision: "approved" | "rejected"): Promise<void> {
    const batch = writeBatch(db);
    batch.update(doc(db, "applications", applicationId), {status: decision});
    batch.update(doc(db, "users", uid), {verificationStatus: decision});
    await batch.commit();
}