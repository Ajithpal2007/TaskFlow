import { useState } from "react";
import { X, Users, Image as ImageIcon, Trash2, Edit2 } from "lucide-react";
import Image from "next/image";

export function ChannelSettingsPanel({ channel, currentUser, onClose, onEditName, onDelete }) {
  const [activeTab, setActiveTab] = useState<"overview" | "members" | "media">("overview");

  // Check if current user is the owner of this specific channel
  const isOwner = channel.members.find(m => m.userId === currentUser.id)?.role === "OWNER";

  return (
    <div className="w-80 border-l bg-background flex flex-col h-full animate-in slide-in-from-right-8 duration-300">
      
      {/* HEADER */}
      <div className="flex items-center justify-between border-b px-4 py-4">
        <h2 className="font-semibold text-lg">Details</h2>
        <button title="Details" onClick={onClose} className="p-1 rounded-md hover:bg-muted text-muted-foreground">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* TABS */}
      <div className="flex border-b px-4 gap-4 mt-2">
        <button 
          onClick={() => setActiveTab("overview")}
          className={`pb-2 text-sm font-medium ${activeTab === "overview" ? "border-b-2 border-indigo-500 text-foreground" : "text-muted-foreground"}`}
        >
          Overview
        </button>
        <button 
          onClick={() => setActiveTab("members")}
          className={`pb-2 text-sm font-medium ${activeTab === "members" ? "border-b-2 border-indigo-500 text-foreground" : "text-muted-foreground"}`}
        >
          Members ({channel.members.length})
        </button>
        <button 
          onClick={() => setActiveTab("media")}
          className={`pb-2 text-sm font-medium ${activeTab === "media" ? "border-b-2 border-indigo-500 text-foreground" : "text-muted-foreground"}`}
        >
          Media
        </button>
      </div>

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="p-4 flex flex-col gap-6">
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Channel Name</div>
            <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg border">
              <span className="font-medium"># {channel.name}</span>
              {isOwner && (
                <button title="Edit" onClick={onEditName} className="text-muted-foreground hover:text-indigo-500">
                  <Edit2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {isOwner && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Danger Zone</div>
              <button 
                onClick={onDelete}
                className="w-full flex items-center justify-center gap-2 bg-red-500/10 text-red-600 p-3 rounded-lg border border-red-500/20 hover:bg-red-500/20 transition-colors"
              >
                <Trash2 className="h-4 w-4" /> Delete Channel
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: MEMBERS */}
      {activeTab === "members" && (
        <div className="p-4 flex flex-col gap-3 overflow-y-auto">
          {channel.members.map((member) => (
            <div key={member.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Image src={member.user.image || "/default-avatar.png"} alt="" width={32} height={32} className="rounded-full" />
                <span className="text-sm font-medium">{member.user.name}</span>
              </div>
              {member.role === "OWNER" && (
                <span className="text-[10px] bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-full font-bold">OWNER</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TAB CONTENT: MEDIA */}
      {activeTab === "media" && (
        <div className="p-4 grid grid-cols-3 gap-2 overflow-y-auto">
          {channel.mediaFiles?.length === 0 ? (
            <div className="col-span-3 text-center text-sm text-muted-foreground mt-4">No media shared yet.</div>
          ) : (
            channel.mediaFiles.map((url, i) => (
              <div key={i} className="aspect-square bg-muted rounded-md overflow-hidden border">
                {/* Assuming they are images. If they are PDFs, you'd show a file icon instead! */}
                <img src={url} alt="Shared media" className="w-full h-full object-cover hover:opacity-80 cursor-pointer" />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}