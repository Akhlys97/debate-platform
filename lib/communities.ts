import { CommunityFirestoreData, CommunityJSON, CommunityType, convertCommunityFirestoreData, EntranceType, MembershipFirestoreData, Rank } from "@/types/community";
import { addDoc, arrayRemove, arrayUnion, collection, doc, getDoc, getDocs, query, runTransaction, updateDoc, where, writeBatch } from "firebase/firestore";
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

export async function setMemberRank(actorUid: string, communityId: string, targetUid: string, newRank: Rank){
    if (newRank === "leader") throw new Error("You can't appoint another leader");
    if (actorUid === targetUid) throw new Error("You can't change your own rank");

    const actorDocRef = doc(db, "communities", communityId, "members", actorUid);
    const actorDocSnap = await getDoc(actorDocRef);
    if (!actorDocSnap.exists()) throw new Error("The actor doesn't exist in this community");
    const actorRawData = actorDocSnap.data() as MembershipFirestoreData;
    const actorRank = actorRawData.rank;

    const targetDocRef = doc(db, "communities", communityId, "members", targetUid);
    const targetDocSnap = await getDoc(targetDocRef);
    if (!targetDocSnap.exists()) throw new Error("The target for this action doesn't exist in this community");
    const targetRawData = targetDocSnap.data() as MembershipFirestoreData;
    const targetRank = targetRawData.rank;

    if (actorRank === "senior" || actorRank === "member") throw new Error("You don't have the authority to perform this action");
    if (actorRank === "admin" && newRank === "admin") throw new Error("Admins can't appoint admins");
    if (actorRank === "admin" && (targetRank === "admin" || targetRank === "leader")) throw new Error("Admins don't have authority over other admins and the leader");
    
    await updateDoc(targetDocRef, { rank: newRank });
}

export async function transferLeadership(currentLeaderUid: string, communityId: string, newLeaderUid: string){
    if (currentLeaderUid === newLeaderUid) throw new Error("You can't transfer leadership to yourself");
    
    const community = await getCommunity(communityId);
    if (community.type === "institution") throw new Error("Leadership transfer isn't allowed in institutional communities");

    const currentLeaderMembershipDocRef = doc(db, "communities", communityId, "members", currentLeaderUid);
    const currentLeaderMembershipDocSnap = await getDoc(currentLeaderMembershipDocRef);
    if (!currentLeaderMembershipDocSnap.exists()) throw new Error("The current leader doesn't exist in this community");
    
    const currentLeaderRawData = currentLeaderMembershipDocSnap.data() as MembershipFirestoreData;
    if(currentLeaderRawData.rank !== "leader") throw new Error ("You can't transfer leadership when you are not the leader");

    const newLeaderMembershipDocRef = doc(db, "communities", communityId, "members", newLeaderUid);
    const newLeaderMembershipDocSnap = await getDoc(newLeaderMembershipDocRef);
    if (!newLeaderMembershipDocSnap.exists()) throw new Error("The new leader doesn't exist in this community");

    const batch = writeBatch(db);
    batch.update(currentLeaderMembershipDocRef, {rank: "admin"});
    batch.update(newLeaderMembershipDocRef, {rank: "leader"});
    await batch.commit();
}

export async function leaveCommunity(uid: string, communityId: string){
    const userDocRef = doc(db, "users", uid);
    const userDocSnap = await getDoc(userDocRef);
    if (!userDocSnap.exists()) throw new Error("This user doesn't exist");

    const userMembershipDocRef = doc(db, "communities", communityId, "members", uid);
    const userMembershipDocSnap = await getDoc(userMembershipDocRef);
    if (!userMembershipDocSnap.exists()) throw new Error("You cannot leave a community that you are not a member of");

    const userRawData = userMembershipDocSnap.data() as MembershipFirestoreData;
    if(userRawData.rank === "leader") throw new Error ("Leaders must transfer leadership before leaving. Please transfer your leadership (transferLeadership) first.");

    const batch = writeBatch(db);
    batch.delete(userMembershipDocRef);
    batch.update(userDocRef, {communityIds: arrayRemove(communityId)});
    await batch.commit();
}