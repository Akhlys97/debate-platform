import { User, EducationLevel } from './user'

export class Judge extends User{

    constructor(
        username: string,
        email: string,  
        country: string, 
        uid: string, 
        fullName: string = "",
        prefLang: string = "",
        displayName: string = username,
        educationLevel: EducationLevel = ""
    ){
        super(username, email, country, uid,
             "judge", fullName, prefLang, 
             displayName, educationLevel);
    }
}