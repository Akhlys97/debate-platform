import { Timestamp } from "firebase/firestore";

export type CommunityFirestoreData = Omit<CommunityJSON, "creationDate"> & { creationDate: Timestamp };
export type MembershipFirestoreData = Omit<MembershipJSON, "joinedAt"> & { joinedAt: Timestamp };
export type CommunityType = "global" | "country" | "city" | "institution"| "society";
export type Rank = "leader" | "admin" | "senior" | "member";
export type EntranceType = "open" | "limited" | "closed";

export function convertCommunityFirestoreData(raw: CommunityFirestoreData): CommunityJSON{
    return{
        ...raw,
        creationDate: raw.creationDate.toDate()
    };
}

export function convertMembershipFirestoreData(raw: MembershipFirestoreData): MembershipJSON{
    return{
        ...raw,
        joinedAt: raw.joinedAt.toDate()
    };
}

export interface CommunityJSON{
    name: string;
    description: string;
    type: CommunityType;
    entranceType: EntranceType;
    founderId: string;
    creationDate: Date;
    isTeamSociety: boolean;
} 

export interface MembershipJSON{
    uid: string;
    rank: Rank;
    joinedAt: Date;
}

export class Community{
    public name: string;
    public description: string;
    public type: CommunityType;
    public entranceType: EntranceType;
    public founderId: string;
    public creationDate: Date;
    public isTeamSociety: boolean;

    constructor(
        name: string,
        type: CommunityType,
        entranceType: EntranceType,
        founderId: string,
        isTeamSociety: boolean = false,
        description: string = ""
    ){
        this.name = name;
        this.type = type;
        this.entranceType = entranceType;
        this.founderId = founderId;
        this.isTeamSociety = isTeamSociety;
        this.description = description;
        this.creationDate = new Date();
    }

    getJSON(): CommunityJSON{
        return{
            name: this.name,
            type: this.type,
            entranceType: this.entranceType,
            founderId: this.founderId,
            isTeamSociety: this.isTeamSociety,
            description: this.description,
            creationDate: this.creationDate,
        }
    }

    get isInstitutionFounded(): boolean {
        return this.type === "institution";
    }
}