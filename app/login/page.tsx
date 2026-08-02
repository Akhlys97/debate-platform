"use client"

import { useState } from "react"
import { logInUser } from "@/lib/auth";
import Link from "next/link";

export default function LoginScreen(){
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>){
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMessage("");
        try{
            const userData = await logInUser(email, password);
            console.log(userData);
        }
        catch{
            setErrorMessage("Invalid email or password. Please try again.");
        }
        finally{
            setIsSubmitting(false);
        }
    }

    return(
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <form className="flex flex-col gap-4 w-full max-w-sm p-8 bg-white rounded-lg shadow-md" onSubmit={handleSubmit}>
                <div className="flex flex-col gap-1">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address
                </label>
                <input type="email" id="email" name="email" 
                className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                />
                </div>
                <div className="flex flex-col gap-1">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                </label>
                <input type="password" id="password" name="password" 
                className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                />
                </div>
                <div className="flex flex-col gap-1">
                    <button type="submit" className="border-2 rounded" disabled={isSubmitting}> Login </button>
                </div>
                {errorMessage && 
                (<div className="text-red-700 text-sm font-medium bg-red-50 border border-red-200 rounded px-3 py-2">{errorMessage}</div>)
                }
                <p className="text-sm text-gray-600 text-center">
                    Don&apos;t have an account?{" "}
                    <Link href="/signup" className="text-blue-600 hover:underline">
                        Sign up
                    </Link>
                </p>
            </form>
        </div>
    );
}