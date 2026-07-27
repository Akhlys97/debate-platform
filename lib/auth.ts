import { auth, db } from './firebase'
import { User } from '@/types/user'
import { Role } from '@/types/user'
import { EducationLevel } from '@/types/user'
import { Debater } from '@/types/debater'
import { Judge } from '@/types/judge'
import { Coach } from '@/types/coach'
import { InstitutionalAccount } from '@/types/institutionalAccount'

export interface SignupFormData{
    username: string,
    email: string,
    country: string,
    role: Role,
    fullName?: string,
    prefLang?: string,
    displayName?: string,
    educationLevel?: EducationLevel
}

function createUserInstance(formData: SignupFormData, uid: string): User{
    if (formData.role === "debater"){
        return new Debater(
            formData.username,
            formData.email,
            formData.country,
            uid,
            formData.fullName,
            formData.prefLang,
            formData.displayName,
            formData.educationLevel
        );
    }
    else if (formData.role === "judge"){
        return new Judge(
            formData.username,
            formData.email,
            formData.country,
            uid,
            formData.fullName,
            formData.prefLang,
            formData.displayName,
            formData.educationLevel
        );
    }
    else if (formData.role === "coach"){
        return new Coach(
            formData.username,
            formData.email,
            formData.country,
            uid,
            formData.fullName,
            formData.prefLang,
            formData.displayName,
            formData.educationLevel
        )
    }
    else{
        return new InstitutionalAccount(
            formData.username,
            formData.email,
            formData.country,
            uid,
            formData.displayName,
        );
    }
}

