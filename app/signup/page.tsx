"use client";

import { useState } from "react";
import { getNames } from "country-list";
import ISO6391 from "iso-639-1";
import { Role, EducationLevel, DebateFormat } from "@/types/user";
import { SignupFormData, signUpUser } from "@/lib/auth";
import { isValidEmail } from "@/lib/validation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isInstitutionalAccount } from "@/types/institutionalAccount";
import { joinCountryCommunity } from "@/lib/communities";


export default function SignUpScreen(){
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [prefLang, setPrefLang] = useState<string[]>([]);
  const [debateFormat, setDebateFormat] = useState<DebateFormat[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [educationLevel, setEducationLevel] = useState <EducationLevel | "">("");
  const [role, setRole] = useState <Role | "">("");
  const [step, setStep] = useState(1);
  const router = useRouter();

  const countryNames = getNames();
  const languages = ISO6391.getLanguages(ISO6391.getAllCodes());
  const levels: { value: EducationLevel; label: string }[] = [
    {value: "high-school", label: "High School"},
    {value: "university", label: "University"},
    {value: "graduate", label: "Graduate"},
    {value: "other", label: "Other"}
  ]
  const roles: { value: Role; label: string }[] = [
    { value: "debater", label: "Debater" },
    { value: "judge", label: "Judge" },
    { value: "coach", label: "Coach" },
    { value: "institutional_account", label: "Institutional Account" }
  ];
  const debateFormats: { value: DebateFormat; label: string }[] = [
    { value: "BP", label: "British Parliamentary" },
    { value: "AP", label: "Asian Parliamentary" },
    { value: "WSDC", label: "World Schools" },
  ]; 

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>){
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);
    const formData: SignupFormData = {
      username: username.trim(),
      email: email.trim(),
      country,
      role: role as Role,
      fullName: fullName.trim(),
      prefLang,
      debateFormat,
      displayName: displayName.trim() || username.trim(),
      educationLevel: educationLevel as EducationLevel,
    };
    try{
      const user = await signUpUser(formData, password);
      try{
        await joinCountryCommunity(user.uid, user.country, user.role);
      }
      catch (joinError){
        console.error("Community auto-join failed:", joinError);
      }
      if(isInstitutionalAccount(user)){
        router.push(user.verificationStatus === "approved" ? "/" : "/apply");
      }
      else setSuccessMessage("Successfully signed up");
    }
    catch (error){
      setErrorMessage("Signup wasn't completed successfully. Try again.");
    }
    finally{
      setIsSubmitting(false);
    }
  }

  function handleContinue(){
    setErrorMessage("");
    if (!username.trim() || !email.trim() || !password || !role || !country){
      setErrorMessage("Please fill all the fields before you continue");
      return;
    }
    if(password.length < 8){
      setErrorMessage("Your password should be at least 8 characters long");
      return;
    }
    if(!isValidEmail(email)){
      setErrorMessage("Please enter a valid email address");
      return;
    } 
    setStep(2);
    return;
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
            <button type="button" className="border-2 rounded" onClick={() => handleContinue()}>Continue</button>
        </div>
        <p className="text-sm text-gray-600 text-center">
          Already have an account? {" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Log in
          </Link>
        </p>
        </>
    );
  }

  function renderStep2(){
    return(
      <>
        <div className="flex flex-col gap-1">
            <button type="button" className="border-2 rounded" onClick={() => setStep(1)}> Back </button>
        </div>
        {role !== "institutional_account" && (
        <div className="flex flex-col gap-1">
          <label htmlFor="fullName" className="text-sm font-medium text-gray-700">
            Full Name (Optional)
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="off"
          />
        </div>
        )}
        <div className="flex flex-col gap-1">
          <label htmlFor="displayName" className="text-sm font-medium text-gray-700">
            Display Name (Optional, defaults to username)
          </label>
          <input
            type="text"
            id="displayName"
            name="displayName"
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setDisplayName(e.target.value)}
            autoComplete="off"
          />
        </div>
        {role !== "institutional_account" && (          
        <div className="flex flex-col gap-1">
          <label htmlFor="education-select" className="text-sm font-medium text-gray-700">
            Education Level (Optional)
          </label>
          <select value={educationLevel} name="education-select" id="education-select" onChange={(e) => {setEducationLevel(e.target.value as EducationLevel)}} autoComplete="off" >
            <option value="" disabled>Select your education level</option>
            {levels.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>
        )}
        {role !== "institutional_account" && (
        <div className="flex flex-col gap-1">
          <label htmlFor="prefLang-select" className="text-sm font-medium text-gray-700">
            Preferred Languages (Optional)
          </label>
          <select
            multiple
            value={prefLang}
            name="prefLang-select"
            id="prefLang-select"
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
              setPrefLang(selected);
            }}
            className="border border-gray-300 rounded px-3 py-2"
            autoComplete="off"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
        )}
        {role !== "institutional_account" && (
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Debate Formats (Optional)</label>
          {debateFormats.map((f) => (
            <label key={f.value} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={debateFormat.includes(f.value)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setDebateFormat([...debateFormat, f.value]);
                  } else {
                    setDebateFormat(debateFormat.filter((item) => item !== f.value));
                  }
                }}
                autoComplete="off"
              />
              {f.label}
            </label>
          ))}
        </div>
        )}
        <div className="flex flex-col gap-1">
            <button type="submit" className="border-2 rounded" disabled={isSubmitting}> Sign Up </button>
        </div>
      </>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <form className="flex flex-col gap-4 w-full max-w-sm p-8 bg-white rounded-lg shadow-md" onSubmit={handleSubmit}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {errorMessage && 
        (<div className="text-red-700 text-sm font-medium bg-red-50 border border-red-200 rounded px-3 py-2">{errorMessage}</div>)
        }
        {successMessage && 
        (<div className="text-green-700 text-sm font-medium bg-green-50 border border-green-200 rounded px-3 py-2">{successMessage}</div>)
        }
      </form>
    </div>
  );
}