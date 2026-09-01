import { addDoc, collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { MembershipFirestoreData, Rank } from "@/types/community";
import { InviteJSON } from "@/types/invite";

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
        where("inviteeUid", "==", inviteeUid),
        where("status", "==", "pending")
    );
    const pendingInvites = await getDocs(q);
    if(!pendingInvites.empty) throw new Error("There is already a pending invite for this invitee");
    
    await addDoc(collection(db, "invites"), invitation);
}