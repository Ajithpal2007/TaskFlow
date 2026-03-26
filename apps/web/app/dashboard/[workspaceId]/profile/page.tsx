"use client";

import { useState, useEffect } from "react";
import { useSession,authClient } from "@/app/lib/auth/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";


// 🟢 1. Import your UploadThing hook (adjust path if your utils file is somewhere else)
import { useUploadThing } from "@/app/lib/uploadthing";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import { Button } from "@repo/ui/components/button";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/avatar";
import { Camera, Loader2, User, Mail, ShieldCheck } from "lucide-react";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileSettingsPage() {
  const { data: session, refetch: updateSession } = useSession();
  const user = session?.user;

  const [isUploading, setIsUploading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // 🟢 2. Initialize the UploadThing Hook
  // Make sure "avatarUploader" matches the exact key in your core.ts file!
  const { startUpload } = useUploadThing("avatarUploader", {
    onClientUploadComplete: async (res) => {
      if (res && res[0]) {
        // 1. Get the new secure URL from UploadThing
        const newAvatarUrl = res[0].url;
        
        // 2. Instantly save it to the database via Better Auth
        await authClient.updateUser({ image: newAvatarUrl });
        
        // 3. Refresh the session so the UI updates
        updateSession();
      }
      setIsUploading(false);
    },
    onUploadError: (error: Error) => {
      setIsUploading(false);
      console.error("Upload failed:", error.message);
      // You could fire a toast notification here!
    },
  });

  // 🟢 3. The File Input Handler
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    // Send the file directly to UploadThing
    await startUpload([file]);
  };

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({ name: user.name || "", email: user.email || "" });
    }
  }, [user, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    setIsUpdating(true);
    const { error } = await authClient.updateUser({ name: data.name });
    setIsUpdating(false);

    if (error) {
      console.error("Failed to update profile:", error);
      return;
    }
    updateSession();
    form.reset({ name: data.name, email: data.email });
  };

  if (!user) return <div className="p-10 text-muted-foreground flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-y-auto bg-muted/10">
      <div className="shrink-0 px-8 py-8 bg-background border-b">
        <h1 className="text-3xl font-bold tracking-tight">Account Profile</h1>
        <p className="text-muted-foreground mt-2">Manage your personal information and avatar.</p>
      </div>

      <div className="max-w-3xl w-full mx-auto p-8 space-y-8">

        {/* --- AVATAR UPLOAD SECTION --- */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>Click the avatar to upload a new custom image.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              
              <label htmlFor="avatar-upload" className="relative group cursor-pointer rounded-full overflow-hidden h-24 w-24 border-4 border-background shadow-sm block">
                {/* Notice how we still use user.image here? When updateSession() fires, this will instantly update! */}
                <Avatar className="h-full w-full">
                  <AvatarImage src={user.image || ""} alt={user.name || "User"} />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {isUploading ? (
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  ) : (
                    <>
                      <Camera className="h-6 w-6 text-white mb-1" />
                      <span className="text-[10px] text-white font-medium uppercase tracking-wider">Change</span>
                    </>
                  )}
                </div>
              </label>

              {/* 🟢 4. Wired the input to the handler */}
              <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                id="avatar-upload"
                onChange={handleImageChange} 
                disabled={isUploading}
              />
              
              <div className="space-y-1">
                <h3 className="font-medium">{user.name}</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* --- PERSONAL INFO FORM --- */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your display name and email address.</CardDescription>
          </CardHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="max-w-md">
                      <FormLabel className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-muted-foreground"/> Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Ajith Pal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="max-w-md">
                      <FormLabel className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground"/> Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="ajith@example.com" {...field} disabled /> 
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="border-t bg-muted/20 px-6 py-3 flex justify-between items-center">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" /> Information is stored securely.
                </p>
                <Button type="submit" disabled={isUpdating || !form.formState.isDirty}>
                  {isUpdating ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>

      </div>
    </div>
  );
}