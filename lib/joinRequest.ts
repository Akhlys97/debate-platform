import { arrayUnion, collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import { getCommunity } from "./communities";
import { convertJoinRequestFirestoreData, JoinRequestFirestoreData, JoinRequestJSON } from "@/types/joinRequest";
import { MembershipFirestoreData } from "@/types/community";

export async function requestToJoin(requesterUid: string, communityId: string){
    const community = await getCommunity(communityId);
    if (community.entranceType !== "limited") throw new Error("You can only request to join Limited communities");

    const requesterMembershipDocRef = doc(db, "communities", communityId, "members", requesterUid);
    const requesterMembershipDocSnap = await getDoc(requesterMembershipDocRef);
    if (requesterMembershipDocSnap.exists()) throw new Error("You are already in this community");

    const request: JoinRequestJSON = {
        communityId,
        requesterUid,
        status: "pending",
        createdAt: new Date(),
    }
    const q = query(
        collection(db, "communities", communityId, "joinRequests"),
        where("communityId", "==", communityId),
        where("requesterUid", "==", requesterUid),
        where("status", "==", "pending"),
    )
    const pendingRequests = await getDocs(q);
    if (!pendingRequests.empty) throw new Error("You already have an unresolved request");

    const requestId = `${communityId}_${requesterUid}`;
    await setDoc(doc(db, "communities", communityId, "joinRequests", requestId), request);
}

export async function declineRequest(reviewerUid: string, communityId: string, requestId: string){
    const requestDocRef = doc(db, "communities", communityId, "joinRequests", requestId);
    const requestDocSnap = await getDoc(requestDocRef);
    if(!requestDocSnap.exists()) throw new Error("This request doesn't exist");

    const requestRawData = requestDocSnap.data() as JoinRequestFirestoreData;
    if(requestRawData.status !== "pending") throw new Error("A request can only be resolved once");

    const reviewerMembershipDocRef = doc(db, "communities", communityId, "members", reviewerUid);
    const reviewerMembershipDocSnap = await getDoc(reviewerMembershipDocRef);
    if(!reviewerMembershipDocSnap.exists()) throw new Error("The reviewer isn't a member of this community");
    
    const reviewerMembershipRawData = reviewerMembershipDocSnap.data() as MembershipFirestoreData;
    const reviewerRank = reviewerMembershipRawData.rank;
    if (reviewerRank === "member" || reviewerRank === "senior") throw new Error("Members and seniors don't have the permission to resolve requests");

    await updateDoc(requestDocRef, {status: "declined", reviewerUid});
}

export async function acceptRequest(reviewerUid: string, communityId: string, requestId: string){
    const requestDocRef = doc(db, "communities", communityId, "joinRequests", requestId);
    const requestDocSnap = await getDoc(requestDocRef);
    if(!requestDocSnap.exists()) throw new Error("This request doesn't exist");

    const requestRawData = requestDocSnap.data() as JoinRequestFirestoreData;
    if(requestRawData.status !== "pending") throw new Error("A request can only be resolved once");

    const reviewerMembershipDocRef = doc(db, "communities", communityId, "members", reviewerUid);
    const reviewerMembershipDocSnap = await getDoc(reviewerMembershipDocRef);
    if(!reviewerMembershipDocSnap.exists()) throw new Error("The reviewer isn't a member of this community");
    
    const reviewerMembershipRawData = reviewerMembershipDocSnap.data() as MembershipFirestoreData;
    const reviewerRank = reviewerMembershipRawData.rank;
    if (reviewerRank === "member" || reviewerRank === "senior") throw new Error("Members and seniors don't have the permission to resolve requests");

    const requesterMembershipDocRef = doc(db, "communities", communityId, "members", requestRawData.requesterUid);
    const requesterMembershipDocSnap = await getDoc(requesterMembershipDocRef);
    if(requesterMembershipDocSnap.exists()) throw new Error("The requester is already a member");

    const requesterDocRef = doc(db, "users", requestRawData.requesterUid);

    const batch = writeBatch(db);
    batch.set(requesterMembershipDocRef, {uid: requestRawData.requesterUid, rank: "member", joinedAt: new Date()});
    batch.update(requestDocRef, {status: "accepted", reviewerUid});
    batch.update(requesterDocRef, {communityIds: arrayUnion(communityId)});
    await batch.commit();
}

export async function getJoinRequests(communityId: string): Promise<(JoinRequestJSON & { id: string })[]>{
    const q = query(
        collection(db, "communities", communityId, "joinRequests"),
        where("status", "==", "pending")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => {
        const data = convertJoinRequestFirestoreData(docSnap.data() as JoinRequestFirestoreData);
        return {...data, id: docSnap.id};
    });
}