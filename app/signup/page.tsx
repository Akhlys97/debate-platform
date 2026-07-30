"use client";

import { useState } from "react";
import { getNames } from "country-list";
import { Role } from "@/types/user";

export function SignUpScreen(){
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [prefLang, setPrefLang] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [role, setRole] = useState <Role | "">("");
  const [step, setStep] = useState(1);

  const countryNames = getNames();
  const roles: { value: Role; label: string }[] = [
  { value: "debater", label: "Debater" },
  { value: "judge", label: "Judge" },
  { value: "coach", label: "Coach" },
  { value: "institutional_account", label: "Institutional Account" },
];

  
  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>){
    e.preventDefault();
    console.log(email, " ", password, " ", username, " ", country, " ", role);
  }

  function renderStep1(){
    return (
        <>
        <div className="flex flex-col gap-1">
          <label htmlFor="username" className="text-sm font-medium text-gray-700">
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="off"
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="off"
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="off"
            required
            minLength={8}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="role-select" className="text-sm font-medium text-gray-700">
            Role
          </label>
          <select value={role} name="role-select" id="role-select" onChange={(e) => {setRole(e.target.value as Role)}} autoComplete="off" required>
            <option value="" disabled>Select a role</option>
            {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="country-select" className="text-sm font-medium text-gray-700">
            Country
          </label>
          <select value={country} name="country-select" id="country-select" onChange={(e) => {setCountry(e.target.value)}} autoComplete="off" required>
            <option value="" disabled>Select a country</option>
            {countryNames.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
            <button type="button" className="border-2 rounded" onClick={() => setStep(2)}>Continue</button>
        </div>
        </>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <form className="flex flex-col gap-4 w-full max-w-sm p-8 bg-white rounded-lg shadow-md" onSubmit={handleSubmit}>
        {step === 1 && renderStep1()}
        {/*step === 2 && renderStep2()*/}
      </form>
    </div>
  );
}