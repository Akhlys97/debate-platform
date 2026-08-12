"use client";

import { useAuth } from "@/context/AuthContext";
import { hasPendingApplication } from "@/lib/applications";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ApplyScreen(){
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [hasPending, setHasPending] = useState(false);
    const [pendingCheckLoading, setPendingCheckLoading] = useState(true);
    const loadingScreen = <div>Loading...</div>;

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

    return(
        <div>{/* the actual form goes here */}</div>
    );
}