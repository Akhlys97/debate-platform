import { CommunityFirestoreData, CommunityJSON, CommunityType, convertCommunityFirestoreData, EntranceType, Rank } from "@/types/community";
import { addDoc, arrayUnion, collection, doc, getDoc, getDocs, query, runTransaction, where, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import { convertFirestoreData, UserFirestoreData } from "@/types/user";
import { getCode } from "country-list";
import { Role } from "@/types/user";

export async function createCommunity(
    name: string,
    type: CommunityType,
    entranceType: EntranceType,
    founderId: string,
    isTeamSociety: boolean = false,
    description: string = "",
    country?: string
): Promise<string>
{
    const communityData: CommunityJSON = {
        name,
        type,
        entranceType,
        founderId,
        isTeamSociety,
        description,
        country,
        creationDate: new Date()
    };
    const docRef = await addDoc(collection(db, "communities"), communityData);
    return docRef.id;
}

export async function getCommunity(communityId: string): Promise<(CommunityJSON & {id: string})>{
    const communityDocRef = doc(db, "communities", communityId);
    const docSnap = await getDoc(communityDocRef);
    if (docSnap.exists()){
        const rawData = docSnap.data();
        const data = convertCommunityFirestoreData(rawData as CommunityFirestoreData);
        return{ ...data, id: docSnap.id};
    }
    else{
        throw new Error("Community not found");
    }
}

export async function getUserCommunities(uid: string): Promise<(CommunityJSON & {id: string})[]>{
    const userDocRef = doc(db, "users", uid);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()){
        const rawData = docSnap.data();
        const data = convertFirestoreData(rawData as UserFirestoreData);
        const communityArray = data.communityIds;
        const communityPromises = communityArray.map((id) => getCommunity(id));
        const results = await Promise.allSettled(communityPromises);
        const successful = results
        .filter((r): r is PromiseFulfilledResult<CommunityJSON & { id: string }> => r.status === "fulfilled")
        .map(r => r.value);
        return successful;
    }
    else{
        throw new Error("User not found");
    }
}

export function getCountryCommunityId(country: string): string{
    const code = getCode(country)
    if (!code){
        throw new Error(`No country code found for: ${country}`);
    }
    const prefix: string = "country_";
    return prefix + code;
}

export async function joinCountryCommunity(uid: string, country: string, role: Role){
    const communityId: string = getCountryCommunityId(country);
    const rank: Rank = (role === "institutional_account"? "senior" : "member");    
    await runTransaction(db, async (transaction) => {
        const communityDocRef = doc(db, "communities", communityId);
        const docSnap = await transaction.get(communityDocRef);
        if (!docSnap.exists()){
            transaction.set(communityDocRef, {
                name: country,
                description: "",
                type: "country",
                entranceType: "open",
                founderId: uid,
                isTeamSociety: false,
                creationDate: new Date(),
            });
        }
        const membershipDocRef = doc(db, "communities", communityId, "members", uid);
        transaction.set(membershipDocRef, {
            uid: uid,
            rank: rank,
            joinedAt: new Date(),
        });
        const userDocRef = doc(db, "users", uid);
        transaction.update(userDocRef, { communityIds: arrayUnion(communityId) });
    });
}

export async function joinOpenCommunity(uid: string, communityId: string, rank: Rank){
    const targetCommunity: (CommunityJSON & {id: string}) = await getCommunity(communityId);
    if (targetCommunity.entranceType !== "open") throw new Error("Community is not open for direct join");
    const membershipDocRef = doc(db, "communities", communityId, "members", uid);
    const userDocRef = doc(db, "users", uid);
    const batch = writeBatch(db);
    batch.set(membershipDocRef, {uid, rank, joinedAt: new Date()});
    batch.update(userDocRef, {communityIds: arrayUnion(communityId)});
    await batch.commit();
}

export async function joinCityCommunity(uid: string, cityCommunityId: string, role: Role){
    const rank: Rank = (role === "institutional_account"? "senior" : "member");
    await joinOpenCommunity(uid, cityCommunityId, rank);
}

export async function getCityCommunities(country: string): Promise<(CommunityJSON & { id: string })[]>{
    const q = query(
        collection(db, "communities"),
        where("type", "==", "city"),
        where("country", "==", country)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => {
        const data = convertCommunityFirestoreData(docSnap.data() as CommunityFirestoreData);
        return {...data, id: docSnap.id};
    });
}

export async function foundCommunity(
    uid: string, 
    name: string, 
    type: CommunityType, 
    entranceType: EntranceType, 
    description: string = "",
    isTeamSociety: boolean = false): Promise<string>
{
    const communityDocRef = doc(collection(db, "communities"));
    const membershipDocRef = doc(db, "communities", communityDocRef.id, "members", uid);
    const userDocRef = doc(db, "users", uid);
    const batch = writeBatch(db);
    batch.set(communityDocRef, {founderId: uid, type, entranceType, name, description, isTeamSociety, creationDate: new Date()});
    batch.set(membershipDocRef, {uid, rank: "leader", joinedAt: new Date()});
    batch.update(userDocRef, {communityIds: arrayUnion(communityDocRef.id)});
    await batch.commit();
    return communityDocRef.id;
}