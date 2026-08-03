import { auth, db } from "./firebase";
import {
  User,
  UserJSON,
  UserFirestoreData,
  convertFirestoreData,
} from "@/types/user";
import { Role } from "@/types/user";
import { EducationLevel, DebateFormat } from "@/types/user";
import { Debater } from "@/types/debater";
import { Judge } from "@/types/judge";
import { Coach } from "@/types/coach";
import { InstitutionalAccount } from "@/types/institutionalAccount";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  deleteUser,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

export interface SignupFormData {
  username: string;
  email: string;
  country: string;
  role: Role;
  fullName?: string;
  prefLang?: string[];
  debateFormat?: DebateFormat[];
  displayName?: string;
  educationLevel?: EducationLevel;
}

function createUserInstance(formData: SignupFormData, uid: string): User {
  if (formData.role === "debater") {
    return new Debater(
      formData.username,
      formData.email,
      formData.country,
      uid,
      formData.fullName,
      formData.prefLang,
      formData.debateFormat,
      formData.displayName,
      formData.educationLevel,
    );
  } 
  else if (formData.role === "judge") {
    return new Judge(
      formData.username,
      formData.email,
      formData.country,
      uid,
      formData.fullName,
      formData.prefLang,
      formData.debateFormat,
      formData.displayName,
      formData.educationLevel,
    );
  } 
  else if (formData.role === "coach") {
    return new Coach(
      formData.username,
      formData.email,
      formData.country,
      uid,
      formData.fullName,
      formData.prefLang,
      formData.debateFormat,
      formData.displayName,
      formData.educationLevel,
    );
  } 
  else {
    return new InstitutionalAccount(
      formData.username,
      formData.email,
      formData.country,
      uid,
      formData.displayName,
    );
  }
}

export async function signUpUser(formData: SignupFormData, password: string) {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    formData.email,
    password,
  );
  const uid: string = userCredential.user.uid;

  try {
    const jsonData: UserJSON = createUserInstance(formData, uid).getJSON();
    const userDocRef = doc(db, "users", uid);
    await setDoc(userDocRef, jsonData);
  } 
  catch (error) {
    try {
      await deleteUser(userCredential.user);
    } 
    catch (rollbackError) {
      console.error(
        "Rollback failed. Orphaned Auth user:",
        userCredential.user.uid,
        rollbackError,
      );
    }
    throw error;
  }
}

export async function fetchProfile(uid: string): Promise<UserJSON>{
  const userDocRef = doc(db, "users", uid);
  const docSnap = await getDoc(userDocRef);
  if (docSnap.exists()) {
    const rawData = docSnap.data() as UserFirestoreData;
    const data = convertFirestoreData(rawData);
    return data;
  } 
  else {
    console.error("Orphan user case.");
    throw new Error("Orphan user case.");
  }
}

export async function logInUser(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password,
  );
  const uid: string = userCredential.user.uid;
  return await fetchProfile(uid);
}
