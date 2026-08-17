import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export async function isAdmin(uid:string): Promise<boolean>{
    const adminDocRef = doc (db, "admins", uid);
    const docSnap = await getDoc(adminDocRef);
    return docSnap.exists();
}