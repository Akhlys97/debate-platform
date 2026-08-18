"use client";

import { useAuth } from "@/context/AuthContext";
import { isAdmin } from "@/lib/admin";
import { decideApplication, fetchPendingApplications } from "@/lib/applications";
import { ApplicationJSON } from "@/types/application";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminScreen(){
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [isAdminUser, setIsAdminUser] = useState(false);
    const [adminCheckLoading, setAdminCheckLoading] = useState(true);
    const [applications, setApplications] = useState<(ApplicationJSON & {id: string})[]>([]);
    const [applicationsLoading, setApplicationsLoading] = useState(true);
    const loadingScreen = <div>Loading...</div>;
    const [errorMessage, setErrorMessage] = useState("");

    async function handleDecision(applicationId: string, uid: string, decision: "approved" | "rejected"){
        setErrorMessage("");
        try{
            await decideApplication(applicationId, uid, decision);
            setApplications((prev) => prev.filter((app) => app.id !== applicationId));
        }
        catch (error){
            console.error("Failed to decide application", error);
            setErrorMessage("Failed to decide application");
        }
    }

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

    useEffect(() => {
        if (!isAdminUser) return;

        const fetchApplications = async() => {
            const apps = await fetchPendingApplications();
            setApplications(apps);
            setApplicationsLoading(false);
        };

        fetchApplications();
    }, [isAdminUser]);

    if (authLoading || !user || adminCheckLoading) return loadingScreen;

    if (!isAdminUser){
        return (
            <div>
                <p>You don't have the permissions to access this page.</p>
                <Link href="/">Return home</Link>
            </div>
        );
    }

    if (applicationsLoading) return loadingScreen;

    return (
    <div className="p-8">
        {errorMessage && (
        <div className="text-red-700 text-sm font-medium bg-red-50 border border-red-200 rounded px-3 py-2 mb-4">
            {errorMessage}
        </div>
        )}
        <h1 className="text-xl font-semibold mb-4">Pending Applications</h1>
        {applications.length === 0 ? (
        <p>No pending applications.</p>
        ) : (
        applications.map((app) => (
            <div key={app.id} className="border border-gray-300 rounded p-4 mb-4">
            <p><strong>{app.institutionName}</strong></p>
            <p>{app.contactAddress}</p>
            <p className="text-sm text-gray-500">{app.submittedAt.toLocaleDateString()}</p>
            <div className="flex gap-2 mt-2">
                <button className="border-2 rounded px-3 py-1" onClick={() => handleDecision(app.id, app.uid, "approved")}>Approve</button>
                <button className="border-2 rounded px-3 py-1" onClick={() => handleDecision(app.id, app.uid, "rejected")}>Reject</button>
            </div>
            </div>
        ))
        )}
    </div>
    );
}