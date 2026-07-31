import { User, EducationLevel, DebateFormat } from './user'

export class Coach extends User{

    constructor(
        username: string,
        email: string,  
        country: string, 
        uid: string, 
        fullName: string = "",
        prefLang: string[] = [],
        debateFormat: DebateFormat[] = [],
        displayName: string = username,
        educationLevel: EducationLevel = ""
    ){
        super(username, email, country, uid,
             "coach", fullName, prefLang, debateFormat,
             displayName, educationLevel);
    }
}