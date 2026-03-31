import { createUploadthing, type FileRouter } from "uploadthing/fastify";

const f = createUploadthing();

export const ourFileRouter = {

  // 🟢 NEW: Dedicated endpoint for Canvas Thumbnails
  imageUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  }).onUploadComplete(async ({ metadata, file }) => {
    console.log("Canvas thumbnail uploaded:", file.url);
    return { url: file.url };
  }),

  // Define a route for task attachments
  attachmentUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 4 },
    pdf: { maxFileSize: "8MB", maxFileCount: 2 },
    text: { maxFileSize: "2MB", maxFileCount: 1 },
  }).onUploadComplete(async ({ metadata, file }) => {
    console.log("Upload complete for file:", file.url);
    return { url: file.url };
  }),

  avatarUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  }).onUploadComplete(async ({ metadata, file }) => {
    console.log("Upload complete for userId:", metadata);
    console.log("file url", file.url);
  }),

  messageAttachment: f({
    image: { maxFileSize: "8MB", maxFileCount: 4 },
    pdf: { maxFileSize: "8MB" },
  })
    .middleware(async ({ req }) => {
      // You can add auth checking here!
      return { userId: "user_id_here" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.url);
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

