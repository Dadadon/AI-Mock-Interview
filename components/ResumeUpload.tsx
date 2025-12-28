// components/ResumeUpload.tsx
"use client";

import { useState } from "react";
import { storage } from "@/firebase/client"; // You'll need to export 'storage' from client.ts
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Button } from "./ui/button";

export default function ResumeUpload({ onUploadComplete }: { onUploadComplete: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `resumes/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      onUploadComplete(url);
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-6 border-2 border-dashed border-input rounded-xl bg-dark-200">
      <p className="text-light-100 text-center">Upload your latest Resume for screening</p>
      <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} className="hidden" id="resume-input" />
      <Button asChild variant="outline" className="cursor-pointer">
        <label htmlFor="resume-input">{uploading ? "Uploading..." : "Select File"}</label>
      </Button>
    </div>
  );
}