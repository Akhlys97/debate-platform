"use client";

import { useState } from "react";
import CreateCommunityModal from "./components/communities/CreateCommunityModal"; 

export default function Home() {
  const [isCreateCommunityOpen, setIsCreateCommunityOpen] = useState(false);

  return (
    <>
      <div>
        <button onClick={() => setIsCreateCommunityOpen(true)}>Create Community</button>
      </div>
      <CreateCommunityModal
        isOpen={isCreateCommunityOpen}
        onClose={() => setIsCreateCommunityOpen(false)}
      />
    </>
  );
}
