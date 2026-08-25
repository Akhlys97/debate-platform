"use client";

import { useAuth } from "@/context/AuthContext";
import { getCityCommunities, joinCityCommunity } from "@/lib/communities";
import { requestCity, normalizeCityName } from "@/lib/cityRequests";
import { CommunityJSON } from "@/types/community";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function CitySelection() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [cities, setCities] = useState<(CommunityJSON & { id: string })[] | null>(null);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [requestInput, setRequestInput] = useState("");
  const [matchedCity, setMatchedCity] = useState<(CommunityJSON & { id: string }) | null>(null);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user]);

  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;
    async function fetchCities() {
      const result = await getCityCommunities(user!.country);
      if (!cancelled) {
        setCities(result);
        setCitiesLoading(false);
      }
    }
    fetchCities();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  function toggleCity(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleRequestInputChange(value: string) {
    setRequestInput(value);
    setMatchedCity(null);
    setRequestSubmitted(false);
  }

  async function handleRequestSubmit() {
    const trimmed = requestInput.trim();
    if (!trimmed || !cities || !user) return;

    const normalizedInput = normalizeCityName(trimmed);
    const match = cities.find((c) => normalizeCityName(c.name) === normalizedInput);

    if (match) {
      setMatchedCity(match);
      setRequestSubmitted(false);
    } else {
      await requestCity(user.uid, user.country, trimmed);
      setRequestSubmitted(true);
      setMatchedCity(null);
      setRequestInput("");
    }
  }

  function handleJoinMatched() {
    if (!matchedCity) return;
    setSelectedIds((prev) => new Set(prev).add(matchedCity.id));
    setMatchedCity(null);
    setRequestInput("");
  }

  async function handleContinue() {
    if (!user) return;
    setSubmitting(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) => joinCityCommunity(user.uid, id, user.role))
      );
    } catch (err) {
      console.error("One or more city joins failed:", err);
    } finally {
      setSubmitting(false);
      router.push("/");
    }
  }

  function handleSkip() {
    router.push("/");
  }

  if (authLoading || !user) {
    return <div className="flex justify-center items-center min-h-screen text-gray-500">Loading...</div>;
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold text-gray-900">Join your city's community</h1>
      <p className="mt-2 text-sm text-gray-500">
        Optional — connect with debaters in your city. You can always join later.
      </p>

      <div className="mt-6 space-y-2">
        {citiesLoading ? (
          <div className="text-gray-500 text-sm">Loading cities...</div>
        ) : cities && cities.length > 0 ? (
          cities.map((city) => (
            <label
              key={city.id}
              className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedIds.has(city.id)}
                onChange={() => toggleCity(city.id)}
                className="h-4 w-4 accent-indigo-600"
              />
              <span className="text-gray-900">{city.name}</span>
            </label>
          ))
        ) : (
          <div className="text-gray-500 text-sm">No cities found for your country yet.</div>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <p className="text-sm text-gray-700 mb-2">Don't see your city? Request it.</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={requestInput}
            onChange={(e) => handleRequestInputChange(e.target.value)}
            placeholder="City name"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleRequestSubmit}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Request
          </button>
        </div>

        {matchedCity && (
          <div className="mt-3 rounded-lg bg-indigo-50 border border-indigo-200 px-4 py-3 text-sm text-indigo-900 flex items-center justify-between">
            <span>{matchedCity.name} already exists.</span>
            <button
              onClick={handleJoinMatched}
              className="text-indigo-700 font-medium hover:underline"
            >
              Join it
            </button>
          </div>
        )}

        {requestSubmitted && (
          <div className="mt-3 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-900">
            Request submitted.
          </div>
        )}
      </div>

      <div className="mt-8 flex gap-3">
        <button
          onClick={handleContinue}
          disabled={submitting}
          className="flex-1 rounded-lg bg-indigo-600 text-white font-medium py-2.5 hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? "Joining..." : "Continue"}
        </button>
        <button
          onClick={handleSkip}
          disabled={submitting}
          className="flex-1 rounded-lg border border-gray-300 text-gray-700 font-medium py-2.5 hover:bg-gray-50 disabled:opacity-50"
        >
          Skip
        </button>
      </div>
    </div>
  );
}