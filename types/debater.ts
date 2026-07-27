import { User, EducationLevel } from './user'

export class Debater extends User{

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
             "debater", fullName, prefLang, 
             displayName, educationLevel);
    }
}