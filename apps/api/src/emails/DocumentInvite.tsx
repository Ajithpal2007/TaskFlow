import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";
import * as React from "react";

interface DocumentInviteProps {
  inviterName: string;
  documentTitle: string;
  accessLevel: string;
  isNewUser: boolean;
  actionLink: string;
}

export const DocumentInviteEmail = ({
  inviterName = "A teammate",
  documentTitle = "Untitled Document",
  accessLevel = "EDITOR",
  isNewUser = true, // Set to true for local preview testing!
  actionLink = "http://localhost:3000/signup",
}: DocumentInviteProps) => {
  const previewText = isNewUser 
    ? `${inviterName} invited you to join TaskFlow`
    : `${inviterName} shared a document with you`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
            <Section className="mt-[32px]">
              <Text className="text-[#0f172a] text-[24px] font-bold text-center p-0 my-[30px] mx-0">
                TaskFlow
              </Text>
            </Section>
            
            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              {isNewUser ? "Join TaskFlow to collaborate" : "You've been invited!"}
            </Heading>
            
            <Text className="text-black text-[14px] leading-[24px]">
              Hello there,
            </Text>
            
            <Text className="text-black text-[14px] leading-[24px]">
              <strong>{inviterName}</strong> has given you <strong>{accessLevel.toLowerCase()}</strong> access to the document: <strong>{documentTitle}</strong>.
            </Text>

            {isNewUser && (
              <Text className="text-black text-[14px] leading-[24px]">
                TaskFlow is a unified workspace for your tasks, docs, and chats. Create a free account to view and collaborate on this document.
              </Text>
            )}
            
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-[#0f172a] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href={actionLink}
              >
                {isNewUser ? "Create an Account" : "Open Document"}
              </Button>
            </Section>
            
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              If you did not expect this invitation, you can safely ignore this email.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default DocumentInviteEmail;