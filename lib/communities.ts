import { CommunityFirestoreData, CommunityJSON, CommunityType, convertCommunityFirestoreData, EntranceType, Rank } from "@/types/community";
import { addDoc, arrayUnion, collection, doc, getDoc, runTransaction, Transaction } from "firebase/firestore";
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
    description: string = ""
)
{
    const communityData: CommunityJSON = {
        name,
        type,
        entranceType,
        founderId,
        isTeamSociety,
        description,
        creationDate: new Date()
    };
    await addDoc(collection(db, "communities"), communityData);
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
                founderId: "system",
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

