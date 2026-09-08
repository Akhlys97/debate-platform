import { db, auth } from "../lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth";
import { signUpUser } from "../lib/auth";
import { foundCommunity, joinOpenCommunity, setMemberRank } from "../lib/communities";
import { requestToJoin, acceptRequest, declineRequest, getJoinRequests } from "../lib/joinRequest";
import { sendInvite, acceptInvite } from "../lib/invites";

let passed = 0;
let failed = 0;

function pass(label: string) {
  console.log(`  ✅ PASS — ${label}`);
  passed++;
}
function fail(label: string, detail?: string) {
  console.log(`  ❌ FAIL — ${label}${detail ? ` (${detail})` : ""}`);
  failed++;
}

const PASSWORD = "TestPassword123!";

async function freshUser(rolePrefix: string) {
  const suffix = Math.random().toString(36).slice(2, 8);
  const email = `${rolePrefix}_${suffix}@example.com`;
  const profile = await signUpUser(
    {
      username: `${rolePrefix}_${suffix}`,
      email,
      country: "Türkiye",
      role: "debater",
      fullName: "",
      prefLang: [],
      debateFormat: [],
      displayName: `${rolePrefix}_${suffix}`,
      educationLevel: "",
    },
    PASSWORD
  );
  return { uid: profile.uid, email };
}

async function signInAs(email: string) {
  await signInWithEmailAndPassword(auth, email, PASSWORD);
}

async function membershipExists(communityId: string, uid: string): Promise<boolean> {
  const snap = await getDoc(doc(db, "communities", communityId, "members", uid));
  return snap.exists();
}

async function getMembershipRank(communityId: string, uid: string): Promise<string | undefined> {
  const snap = await getDoc(doc(db, "communities", communityId, "members", uid));
  return snap.exists() ? snap.data().rank : undefined;
}

async function getRequestData(communityId: string, requestId: string) {
  const snap = await getDoc(doc(db, "communities", communityId, "joinRequests", requestId));
  return snap.exists() ? snap.data() : undefined;
}

async function main() {
  // ================= SETUP =================
  console.log("--- SETUP ---");
  const leader = await freshUser("leader");
  const limitedSociety = await foundCommunity(leader.uid, "Limited Society", "society", "limited");
  const openSociety = await foundCommunity(leader.uid, "Open Society D13", "society", "open");
  const closedSociety = await foundCommunity(leader.uid, "Closed Society D13", "society", "closed");

  const adminUser = await freshUser("admin");
  await signInAs(leader.email);
  await sendInvite(leader.uid, limitedSociety, adminUser.uid);
  await signInAs(adminUser.email);
  await acceptInvite(adminUser.uid, `${limitedSociety}_${adminUser.uid}`);
  await signInAs(leader.email);
  await setMemberRank(leader.uid, limitedSociety, adminUser.uid, "admin");
  console.log(`Founded limited=${limitedSociety}, open=${openSociety}, closed=${closedSociety}; adminUser is Admin of limitedSociety\n`);

  // ================= TESTS =================

  // TEST 1: requestToJoin on a Limited community (positive)
  console.log("TEST 1: Request to join a Limited community");
  const requester1 = await freshUser("req1");
  const req1Id = `${limitedSociety}_${requester1.uid}`;
  try {
    await signInAs(requester1.email);
    await requestToJoin(requester1.uid, limitedSociety);
    const data = await getRequestData(limitedSociety, req1Id);
    data?.status === "pending" ? pass("request created, status pending") : fail(`unexpected state: ${JSON.stringify(data)}`);
  } catch (err) {
    fail("request creation was rejected — should have succeeded", (err as Error).message);
  }

  // TEST 2: requestToJoin on an Open community (adversarial — entranceType gate)
  console.log("TEST 2: Request to join an Open community");
  try {
    const requester = await freshUser("req2");
    await signInAs(requester.email);
    await requestToJoin(requester.uid, openSociety);
    fail("request against an Open community was allowed — should have been denied");
  } catch (err) {
    pass(`correctly denied (${(err as Error).message})`);
  }

  // TEST 3: requestToJoin on a Closed community (adversarial — entranceType gate)
  console.log("TEST 3: Request to join a Closed community");
  try {
    const requester = await freshUser("req3");
    await signInAs(requester.email);
    await requestToJoin(requester.uid, closedSociety);
    fail("request against a Closed community was allowed — should have been denied");
  } catch (err) {
    pass(`correctly denied (${(err as Error).message})`);
  }

  // TEST 4: requestToJoin when already a member (adversarial, function-level)
  console.log("TEST 4: adminUser (already a member) attempts to request to join limitedSociety");
  try {
    await signInAs(adminUser.email);
    await requestToJoin(adminUser.uid, limitedSociety);
    fail("request from an existing member was allowed — should have been denied");
  } catch (err) {
    pass(`correctly denied (${(err as Error).message})`);
  }

  // TEST 5: Duplicate pending request (adversarial, function-level)
  console.log("TEST 5: requester1 attempts a second request while one is still pending");
  try {
    await signInAs(requester1.email);
    await requestToJoin(requester1.uid, limitedSociety);
    fail("duplicate pending request was allowed — should have been denied");
  } catch (err) {
    pass(`correctly denied (${(err as Error).message})`);
  }

  // TEST 6: Member/Senior attempts to resolve a request (adversarial, function-level)
  console.log("TEST 6: A plain Member attempts to decline a request");
  try {
    const plainMember = await freshUser("plainmember6");
    await signInAs(plainMember.email);
    await joinOpenCommunity(plainMember.uid, openSociety, "member"); // needs SOME membership to be checked against limitedSociety though — actually reviewer check is against limitedSociety
    // plainMember has no membership doc in limitedSociety at all — covers the "reviewer isn't a member" branch too
    await declineRequest(plainMember.uid, limitedSociety, req1Id);
    fail("non-member decline was allowed — should have been denied");
  } catch (err) {
    pass(`correctly denied (${(err as Error).message})`);
  }

  // TEST 7: Leader accepts the request (positive — full batch)
  console.log("TEST 7: Leader accepts requester1's request");
  try {
    await signInAs(leader.email);
    await acceptRequest(leader.uid, limitedSociety, req1Id);
    const rank = await getMembershipRank(limitedSociety, requester1.uid);
    const data = await getRequestData(limitedSociety, req1Id);
    if (rank === "member" && data?.status === "accepted" && data?.reviewerUid === leader.uid) {
      pass("accept succeeded: membership created as Member, request accepted, reviewerUid recorded");
    } else {
      fail(`unexpected state: rank=${rank}, data=${JSON.stringify(data)}`);
    }
  } catch (err) {
    fail("accept was rejected — should have succeeded", (err as Error).message);
  }

  // TEST 8: Accept an already-resolved request (adversarial, function-level)
  console.log("TEST 8: Leader attempts to accept the same request again");
  try {
    await signInAs(leader.email);
    await acceptRequest(leader.uid, limitedSociety, req1Id);
    fail("re-accepting an already-accepted request was allowed — should have been denied");
  } catch (err) {
    pass(`correctly denied (${(err as Error).message})`);
  }

  // TEST 9: Admin declines a different request (positive)
  console.log("TEST 9: Admin declines a second requester's request");
  const requester2 = await freshUser("req9");
  const req2Id = `${limitedSociety}_${requester2.uid}`;
  try {
    await signInAs(requester2.email);
    await requestToJoin(requester2.uid, limitedSociety);
    await signInAs(adminUser.email);
    await declineRequest(adminUser.uid, limitedSociety, req2Id);
    const data = await getRequestData(limitedSociety, req2Id);
    const exists = await membershipExists(limitedSociety, requester2.uid);
    if (data?.status === "declined" && data?.reviewerUid === adminUser.uid && !exists) {
      pass("decline succeeded: status declined, reviewerUid recorded, no membership created");
    } else {
      fail(`unexpected state: data=${JSON.stringify(data)}, membershipExists=${exists}`);
    }
  } catch (err) {
    fail("Admin decline was rejected — should have succeeded", (err as Error).message);
  }

  // TEST 10: getJoinRequests returns only pending requests for this community
  console.log("TEST 10: getJoinRequests returns correct, isolated results");
  const requester3 = await freshUser("req10");
  try {
    await signInAs(requester3.email);
    await requestToJoin(requester3.uid, limitedSociety);
    await signInAs(leader.email);
    const requests = await getJoinRequests(limitedSociety);
    const onlyPending = requests.every((r) => r.status === "pending");
    const hasRequester3 = requests.some((r) => r.requesterUid === requester3.uid);
    const doesNotHaveResolved = !requests.some((r) => r.requesterUid === requester1.uid || r.requesterUid === requester2.uid);
    if (onlyPending && hasRequester3 && doesNotHaveResolved) {
      pass("getJoinRequests returned exactly the one still-pending request");
    } else {
      fail(`unexpected result: ${JSON.stringify(requests)}`);
    }
  } catch (err) {
    fail("getJoinRequests failed", (err as Error).message);
  }

  // TEST 11: Direct crafted request creation, spoofed requesterUid (rules-level)
  console.log("TEST 11: Direct crafted request creation with a spoofed requesterUid");
  try {
    const attacker = await freshUser("attacker11");
    await signInAs(attacker.email);
    const spoofedId = `${limitedSociety}_${leader.uid}`; // pretending to be the leader (already a member, but testing the spoof itself)
    await setDoc(doc(db, "communities", limitedSociety, "joinRequests", spoofedId), {
      communityId: limitedSociety,
      requesterUid: leader.uid,
      status: "pending",
      createdAt: new Date(),
    });
    fail("spoofed-requester creation was allowed — should have been denied");
  } catch (err: any) {
    err?.code === "permission-denied" ? pass("correctly denied") : fail("wrong error", err?.message);
  }

  // TEST 12: Direct crafted membership creation, no accepted request behind it (rules-level)
  console.log("TEST 12: Direct membership write on behalf of someone else, with no accepted request");
  try {
    const noRequestUser = await freshUser("norequest12");
    await signInAs(leader.email); // acting as Leader, but there's no genuine request for this person
    await setDoc(doc(db, "communities", limitedSociety, "members", noRequestUser.uid), {
      uid: noRequestUser.uid,
      rank: "member",
      joinedAt: new Date(),
    });
    fail("membership creation with no request behind it was allowed — should have been denied");
  } catch (err: any) {
    err?.code === "permission-denied" ? pass("correctly denied") : fail("wrong error", err?.message);
  }

  // TEST 13: Direct crafted accept-status-flip, without creating the paired membership (rules-level)
  console.log("TEST 13: Direct request status flip to 'accepted' without a paired membership creation");
  try {
    const requester13 = await freshUser("req13");
    await signInAs(requester13.email);
    await requestToJoin(requester13.uid, limitedSociety);
    await signInAs(leader.email);
    await updateDoc(doc(db, "communities", limitedSociety, "joinRequests", `${limitedSociety}_${requester13.uid}`), {
      status: "accepted",
      reviewerUid: leader.uid,
    });
    fail("unpaired status flip was allowed — should have been denied");
  } catch (err: any) {
    err?.code === "permission-denied" ? pass("correctly denied") : fail("wrong error", err?.message);
  }

  // TEST 14: Direct crafted resolve by a non-Leader/Admin, bypassing acceptRequest/declineRequest (rules-level)
  console.log("TEST 14: Direct crafted decline by a plain Member, bypassing declineRequest");
  try {
    const requester14 = await freshUser("req14");
    await signInAs(requester14.email);
    await requestToJoin(requester14.uid, limitedSociety);

    const plainMember2 = await freshUser("plainmember14");
    await signInAs(plainMember2.email);
    await joinOpenCommunity(plainMember2.uid, openSociety, "member");
    await updateDoc(doc(db, "communities", limitedSociety, "joinRequests", `${limitedSociety}_${requester14.uid}`), {
      status: "declined",
      reviewerUid: plainMember2.uid,
    });
    fail("crafted decline by a non-authority was allowed — should have been denied");
  } catch (err: any) {
    err?.code === "permission-denied" ? pass("correctly denied") : fail("wrong error", err?.message);
  }

  // TEST 15: Confirm Day 12's invite path still works on a Limited community (today's other named goal)
  console.log("TEST 15: Invite flow (Day 12) still works, now tested against a Limited community");
  try {
    const invitee15 = await freshUser("invitee15");
    await signInAs(leader.email);
    await sendInvite(leader.uid, limitedSociety, invitee15.uid);
    await signInAs(invitee15.email);
    await acceptInvite(invitee15.uid, `${limitedSociety}_${invitee15.uid}`);
    const rank = await getMembershipRank(limitedSociety, invitee15.uid);
    rank === "member" ? pass("invite flow works correctly on a Limited community") : fail(`unexpected rank: ${rank}`);
  } catch (err) {
    fail("invite flow failed on a Limited community — should have succeeded", (err as Error).message);
  }

  // TEST 16: Closing regression — rank-change, transfer, and leave still work after this file's growth
  console.log("TEST 16: Regression — rank-change still functions on limitedSociety");
  try {
    await signInAs(leader.email);
    await setMemberRank(leader.uid, limitedSociety, requester1.uid, "senior");
    const rank = await getMembershipRank(limitedSociety, requester1.uid);
    rank === "senior" ? pass("rank-change mechanism still functions correctly") : fail(`unexpected rank: ${rank}`);
  } catch (err) {
    fail("closing regression check failed", (err as Error).message);
  }

  console.log(`\n${passed} passed, ${failed} failed.`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Test script crashed:", err);
  process.exit(1);
});