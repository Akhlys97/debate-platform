import { arrayUnion, collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import { MembershipFirestoreData, Rank } from "@/types/community";
import { convertInviteFirestoreData, InviteFirestoreData, InviteJSON } from "@/types/invite";

export async function sendInvite(inviterUid: string, communityId: string, inviteeUid: string){
    const inviterMembershipDocRef = doc(db, "communities", communityId, "members", inviterUid);
    const inviterMembershipDocSnap = await getDoc(inviterMembershipDocRef);
    if (!inviterMembershipDocSnap.exists()) throw new Error("The inviter doesn't exist in this community");

    const inviterRawData = inviterMembershipDocSnap.data() as MembershipFirestoreData;
    const inviterRank: Rank = inviterRawData.rank;
    if(inviterRank === "senior" || inviterRank === "member") throw new Error("Seniors and members don't have the permission to send invites");

    const inviteeMembershipDocRef = doc(db, "communities", communityId, "members", inviteeUid);
    const inviteeMembershipDocSnap = await getDoc(inviteeMembershipDocRef);
    if (inviteeMembershipDocSnap.exists()) throw new Error("You can't invite someone who is already a member of the community");

    const invitation: InviteJSON = {
        communityId,
        inviterUid,
        inviteeUid,
        status: "pending",
        createdAt: new Date()
    }
    const q = query(
        collection(db, "invites"),
        where("communityId", "==", communityId),
        where("inviterUid", "==", inviterUid),
        where("inviteeUid", "==", inviteeUid),
        where("status", "==", "pending")
    );
    const pendingInvites = await getDocs(q);
    if(!pendingInvites.empty) throw new Error("There is already a pending invite for this invitee");

    const inviteId = `${communityId}_${inviteeUid}`;
    await setDoc(doc(db, "invites", inviteId), invitation);
}

export async function acceptInvite(inviteeUid: string, inviteId: string){
    const inviteDocRef = doc(db, "invites", inviteId);
    const inviteDocSnap = await getDoc(inviteDocRef);
    if(!inviteDocSnap.exists()) throw new Error("The invite doesn't exist.");
    
    const inviteRawData = inviteDocSnap.data() as InviteFirestoreData;
    if(inviteRawData.inviteeUid !== inviteeUid) throw new Error("This invitation doesn't belong to you");
    if(inviteRawData.status !== "pending") throw new Error("An invite can only be resolved once");

    const inviteeMembershipDocRef = doc(db, "communities", inviteRawData.communityId, "members", inviteeUid);
    const inviteeMembershipDocSnap = await getDoc(inviteeMembershipDocRef);
    if(inviteeMembershipDocSnap.exists()) throw new Error("You are already a member");

    const inviteeDocRef = doc(db, "users", inviteeUid);
    
    const batch = writeBatch(db);
    batch.set(inviteeMembershipDocRef, {uid: inviteeUid, rank: "member", joinedAt: new Date()});
    batch.update(inviteDocRef, {status: "accepted"});
    batch.update(inviteeDocRef, {communityIds: arrayUnion(inviteRawData.communityId)});
    await batch.commit();
}

export async function declineInvite(inviteeUid: string, inviteId: string){
    const inviteDocRef = doc(db, "invites", inviteId);
    const inviteDocSnap = await getDoc(inviteDocRef);
    if(!inviteDocSnap.exists()) throw new Error("The invite doesn't exist.");

    const inviteRawData = inviteDocSnap.data() as InviteFirestoreData;
    if(inviteRawData.inviteeUid !== inviteeUid) throw new Error("This invitation doesn't belong to you");
    if(inviteRawData.status !== "pending") throw new Error("An invite can only be resolved once");

    await updateDoc(inviteDocRef, {status: "declined"});
}

export async function getUserInvites(inviteeUid: string): Promise<(InviteJSON & { id: string })[]>{
    const q = query(
        collection(db, "invites"),
        where("inviteeUid", "==", inviteeUid),
        where("status", "==", "pending")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => {
        const data = convertInviteFirestoreData(docSnap.data() as InviteFirestoreData);
        return {...data, id: docSnap.id};
    });
}
