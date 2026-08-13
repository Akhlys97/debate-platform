"use client";

import { useAuth } from "@/context/AuthContext";
import { createApplication, hasPendingApplication } from "@/lib/applications";
import { isValidEmail } from "@/lib/validation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ApplyScreen(){
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [hasPending, setHasPending] = useState(false);
    const [pendingCheckLoading, setPendingCheckLoading] = useState(true);
    const loadingScreen = <div>Loading...</div>;
    const [institutionName, setInstitutionName] = useState("");
    const [contactAddress, setContactAddress] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    
    useEffect(() => {
        if (!authLoading && !user) router.push("/login");
    }, [authLoading, user]);
    
    useEffect(() => {
        if (!user || user.role !== "institutional_account") return;
        
        const checkPending = async() => {
            const result = await hasPendingApplication(user.uid);
            setHasPending(result);
            setPendingCheckLoading(false);
        }
        
        checkPending();
    }, [user]);
    
    if (authLoading){
        return loadingScreen; 
    }
    if (!user){
        return loadingScreen; 
    }
    if (user.role !== "institutional_account"){
        return (
            <div>
            <p>Only institutional accounts can access this page.</p>
            <Link href="/">Return home</Link>
        </div>
        );
    }
    if (pendingCheckLoading){
        return loadingScreen;
    }
    if (hasPending){
        return <div>You already have a pending application.</div>;
    }
    if (successMessage) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="flex flex-col gap-4 w-full max-w-sm p-8 bg-white rounded-lg shadow-md text-center">
                    <p className="text-green-700 text-sm font-medium bg-green-50 border border-green-200 rounded px-3 py-2">{successMessage}</p>
                    <Link href="/" className="text-blue-600 hover:underline">Return to main page</Link>
                </div>
            </div>
        );
    }
    

    async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>){
        e.preventDefault();
        if (!user) return;
        setErrorMessage("");
        setSuccessMessage("");
        setIsSubmitting(true);
        if (!isValidEmail(contactAddress)){
            setErrorMessage("Please enter a valid email address.");
            setIsSubmitting(false);
            return;
        }
        try{
            await createApplication(user.uid, institutionName, contactAddress);
            setSuccessMessage("Your application is successfully submitted. You will be hearing from us as soon as possible");
        }
        catch(error){
            setErrorMessage("Application wasn't submitted successfully. Try again.");
        }
        finally{
            setIsSubmitting(false);
        }
    }

    return(
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <form className="flex flex-col gap-4 w-full max-w-sm p-8 bg-white rounded-lg shadow-md" onSubmit={handleSubmit}>
                <div className="flex flex-col gap-1">
                    <label htmlFor="institutionName" className="text-sm font-medium text-gray-700">
                    Institution Name
                    </label>
                    <input 
                    value={institutionName}
                    type="text"
                    id="institutionName"
                    name="institutionName"
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => setInstitutionName(e.target.value)}
                    autoComplete="off"
                    required
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label htmlFor="contactAddress" className="text-sm font-medium text-gray-700">
                    Contact Address
                    </label>
                    <input 
                    value={contactAddress}
                    type="email"
                    id="contactAddress"
                    name="contactAddress"
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => setContactAddress(e.target.value)}
                    autoComplete="off"
                    required
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <button type="submit" className="border-2 rounded" disabled={isSubmitting}> Submit Application </button>
                </div>
                {errorMessage && 
                (<div className="text-red-700 text-sm font-medium bg-red-50 border border-red-200 rounded px-3 py-2">{errorMessage}</div>)
                }
            </form>
        </div>
    );
}