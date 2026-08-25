import { Timestamp } from "firebase/firestore";

export type CityRequestFirestoreData = Omit<CityRequestJSON, "createdAt"> & { createdAt: Timestamp };

export interface CityRequestJSON{
    uid: string;
    country: string;
    cityName: string;
    createdAt: Date;
    status: "pending" | "approved" | "rejected";
}

export function convertCityRequestFirestoreData(raw: CityRequestFirestoreData): CityRequestJSON{
    return{
        ...raw,
        createdAt: raw.createdAt.toDate()
    }
}