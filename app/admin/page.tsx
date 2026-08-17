"use client";

import { useAuth } from "@/context/AuthContext";
import { isAdmin } from "@/lib/admin";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";


export default function AdminScreen(){
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [isAdminUser, setIsAdminUser] = useState(false);
    const [adminCheckLoading, setAdminCheckLoading] = useState(true);
    const loadingScreen = <div>Loading...</div>;

    useEffect(() => {
        if (!authLoading && !user) router.push("/login");
    }, [authLoading, user]);

    useEffect(() => {
        if(!user) return;

        const checkAdmin = async() => {
            const result = await isAdmin(user.uid);
            setIsAdminUser(result);
            setAdminCheckLoading(false);
        }

        checkAdmin();
    }, [user]);

    if (authLoading || !user || adminCheckLoading) return loadingScreen;

    if (!isAdminUser){
        return (
            <div>
                <p>You don't have the permissions to access this page.</p>
                <Link href="/">Return home</Link>
            </div>
        );
    }

    
    return (
        <div>Admin panel — pending applications will go here.</div>
    );
}