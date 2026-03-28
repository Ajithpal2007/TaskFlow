//import ChatRoom  from "@/components/chat/ChatRoom";
import ChatRoom  from "@/components/chat/ChatRoom";

export default function DynamicChatPage({ params }: { params: { channelId: string } }) {
  // Pass the dynamic channelId from the URL directly into your ChatRoom component
  return <ChatRoom channelId={params.channelId} />;
}