import { User, UserJSON } from './user'
import { VerificationStatus } from './common';

export interface InstitutionalAccountJSON extends UserJSON{
    verificationStatus: VerificationStatus;
}

export class InstitutionalAccount extends User{
    public verificationStatus: VerificationStatus = "pending";

    constructor(
        username: string,
        email: string,
        country: string,
        uid: string,
        displayName: string = username
    ){
        super(username, email, country, uid, "institutional_account",
            "", [], [], displayName
        );
    }

    getJSON(): InstitutionalAccountJSON{
        return{
            ...super.getJSON(),
            verificationStatus: this.verificationStatus
        };
    }

    get isProfileComplete(): boolean{
        return !!(this.displayName);
    }
}