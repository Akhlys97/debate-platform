"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { foundCommunity } from "@/lib/communities";
import { CommunityType, EntranceType } from "@/types/community";
import { isInstitutionalAccount } from "@/types/institutionalAccount";

interface CreateCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateCommunityModal({ isOpen, onClose }: CreateCommunityModalProps) {
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<CommunityType | null>(null);
  const [entranceType, setEntranceType] = useState<EntranceType | null>(null);
  const [isTeamSociety, setIsTeamSociety] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showInstitutionTooltip, setShowInstitutionTooltip] = useState(false);
  const [showTeamSocietyTooltip, setShowTeamSocietyTooltip] = useState(false);

  if (!isOpen || !user) return null;

  const isWrongRole = !isInstitutionalAccount(user);
  const isUnverified = isInstitutionalAccount(user) && user.verificationStatus !== "approved";
  const isInstitutionDisabled = isWrongRole || isUnverified;
  const institutionDisabledReason = isWrongRole
    ? "Only Institutional Accounts can found Institutions."
    : "Your account must be verified before founding an Institution.";
  const isTeamSocietyDisabled = user.role !== "coach";
  const teamSocietyDisabledReason = "Only Coach accounts can found Team societies.";

  function resetForm() {
    setName("");
    setDescription("");
    setIsTeamSociety(false);
    setType(null);
    setEntranceType(null);
    setError(null);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function handleSelectType(selected: CommunityType) {
    if (selected === "institution" && isInstitutionDisabled) return;
    setType(selected);
  }
  function handleToggleTeamSociety(checked: boolean) {
    if (isTeamSocietyDisabled) return;
    setIsTeamSociety(checked);
  }

  async function handleSubmit() {
    if (!name || !type || !entranceType || !user) return;
    setSubmitting(true);
    setError(null);
    try {
      await foundCommunity(user.uid, name, type, entranceType, description, isTeamSociety);
      resetForm();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = !!name && !!type && !!entranceType && !submitting;

  return (
    <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    onClick={handleClose}
    >
      <div 
      className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg flex flex-col gap-4"
      onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Create a Community</h2>
          <button type="button" onClick={handleClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm font-medium text-gray-700">
            Community Name
          </label>
          <input type="text" id="name" name="name" value={name}
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
            onChange={(e) => setName(e.target.value)} 
            autoComplete="off"
            required 
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="description" className="text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>

        <div className="flex gap-1">
          Community Type
        </div>
        <div className="flex gap-3">
          <div
          onClick={() => handleSelectType("society")}
          className={`flex-1 cursor-pointer rounded border-2 px-4 py-3 text-center ${
            type === "society" ? "border-blue-500 bg-blue-50" : "border-gray-300"
          }`}
          >
            <div className="font-medium text-gray-900">Society</div>
            <div className="text-xs text-gray-500">Open to anyone</div>
          </div>
          <div className="relative flex-1">
            <div
            onClick={() => handleSelectType("institution")}
            onMouseEnter={() => isInstitutionDisabled && setShowInstitutionTooltip(true)}
            onMouseLeave={() => setShowInstitutionTooltip(false)}
            className={`rounded border-2 px-4 py-3 text-center ${
              isInstitutionDisabled
              ? "cursor-not-allowed opacity-40 border-gray-300"
              : "cursor-pointer " + (type === "institution" ? "border-blue-500 bg-blue-50" : "border-gray-300")
            }`}
            >
              <div className="font-medium text-gray-900">Institution</div>
              <div className="text-xs text-gray-500">Founded by verified institutions</div>
            </div>
            {showInstitutionTooltip && (
              <div className="absolute -top-9 left-0 right-0 rounded bg-gray-900 px-2 py-1 text-xs text-white text-center">
                {institutionDisabledReason}
              </div>
            )}
          </div>
        </div>

        {type === "society" && (
          <div
            className={`relative flex items-center gap-2 ${
              isTeamSocietyDisabled ? "cursor-not-allowed opacity-40" : ""
            }`}
            onMouseEnter={() => isTeamSocietyDisabled && setShowTeamSocietyTooltip(true)}
            onMouseLeave={() => setShowTeamSocietyTooltip(false)}
          >
            <input
              type="checkbox"
              id="teamSocietyCheckbox"
              checked={isTeamSociety}
              onChange={(e) => handleToggleTeamSociety(e.target.checked)}
              disabled={isTeamSocietyDisabled}
              className="h-4 w-4"
            />
            <label htmlFor="teamSocietyCheckbox" className="text-sm font-medium text-gray-700">
              Is this a team society?
            </label>
            {showTeamSocietyTooltip && (
              <div className="absolute -top-9 left-0 rounded bg-gray-900 px-2 py-1 text-xs text-white whitespace-nowrap">
                {teamSocietyDisabledReason}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">Entrance Type</span>
          <div className="flex gap-2">
            {(["open", "limited", "closed"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setEntranceType(option)}
                className={`flex-1 rounded border-2 px-3 py-2 text-sm capitalize cursor-pointer ${
                  entranceType === option ? "border-blue-500 bg-blue-50" : "border-gray-300"
                }`} 
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {error && 
        (<div className="text-red-700 text-sm font-medium bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>)
        }

        <div className="flex flex-col gap-1">
          <button type="button" className="border-2 rounded" disabled={!canSubmit} onClick={handleSubmit}>{(submitting? "Founding..." : "Submit")}</button>
        </div>
      </div>
    </div>
  );
}