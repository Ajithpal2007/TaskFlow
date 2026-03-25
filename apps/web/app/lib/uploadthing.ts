import {
  generateUploadButton,
  generateUploadDropzone,
} from "@uploadthing/react";
import type { OurFileRouter } from "../../../api/src/lib/uploadthing"; 
import { generateReactHelpers } from "@uploadthing/react";

const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const uploadUrl = `${backendUrl}/api/uploadthing`;

// 🟢 Generate them individually
export const UploadButton = generateUploadButton<OurFileRouter>({
  url: uploadUrl,
});

export const UploadDropzone = generateUploadDropzone<OurFileRouter>({
  url: uploadUrl,
});


export const { useUploadThing, uploadFiles } = 
  generateReactHelpers<OurFileRouter>({
    url: `${backendUrl}/api/uploadthing`,
  });