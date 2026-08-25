import { CityRequestJSON } from "@/types/cityRequest";
import { addDoc, collection } from "firebase/firestore";
import { db } from "./firebase";

export async function requestCity(uid: string, country: string, cityName: string){
    const requestData: CityRequestJSON = {
        uid,
        country,
        cityName,
        createdAt: new Date(),
        status: "pending"
    }
    await addDoc(collection(db, "cityRequests"), requestData);
}

export function normalizeCityName(name: string): string{
    return name.trim().toLowerCase();
}