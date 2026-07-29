import { Timestamp } from "firebase/firestore";

export type EducationLevel = "high-school" | "university" | "graduate" | "other" | "";
export type Role = "debater" | "judge" | "coach" | "institutional_account";
export type UserFirestoreData = Omit<UserJSON, "creationDate"> & { creationDate: Timestamp };

export function convertFirestoreData(raw: UserFirestoreData): UserJSON {
    return{
        ...raw,
        creationDate: raw.creationDate.toDate(),
    };
}

export interface UserJSON{
    username: string;
    email: string;
    fullName: string;
    country: string; 
    prefLang: string;
    uid: string;
    displayName: string;
    educationLevel: EducationLevel;
    readonly role: Role;
    creationDate: Date;
}

export class User{
    public username: string;
    public email: string;
    public fullName: string;
    public country: string; 
    public prefLang: string;
    public uid: string;
    public displayName: string;
    public educationLevel: EducationLevel;
    public readonly role: Role;
    public creationDate: Date;

    constructor(
        username: string,
        email: string,  
        country: string, 
        uid: string, 
        role: Role,
        fullName: string = "",
        prefLang: string = "",
        displayName: string = username,
        educationLevel: EducationLevel = ""
    ){
        this.username = username;
        this.email = email;
        this.fullName = fullName;
        this.country = country;
        this.prefLang = prefLang;
        this.uid = uid;
        this.displayName = displayName;
        this.educationLevel = educationLevel;
        this.role = role;
        this.creationDate = new Date();
    }

    getJSON(): UserJSON{
        return{
            username: this.username,
            email: this.email,
            fullName: this.fullName,
            country: this.country,
            prefLang: this.prefLang,
            uid: this.uid,
            displayName: this.displayName,
            educationLevel: this.educationLevel,
            role: this.role,
            creationDate: this.creationDate
        }
    }

    get isProfileComplete(): boolean {
        return !!(this.fullName && this.prefLang && this.displayName && this.educationLevel);
    }
}