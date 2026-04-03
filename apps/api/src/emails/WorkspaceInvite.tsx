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

interface WorkspaceInviteProps {
  inviterName: string;
  workspaceName: string;
  inviteLink: string;
}

export const WorkspaceInviteEmail = ({
  inviterName = "A teammate",
  workspaceName = "their workspace",
  inviteLink = "http://localhost:3000/invite?token=demo",
}: WorkspaceInviteProps) => {
  const previewText = `Join ${workspaceName} on TaskFlow`;

  return ( 
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
            {/* You can replace this text with your actual Logo Image later! */}
            <Section className="mt-[32px]">
              <Text className="text-[#0f172a] text-[24px] font-bold text-center p-0 my-[30px] mx-0">
                TaskFlow
              </Text>
            </Section>
            
            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              Join <strong>{workspaceName}</strong>
            </Heading>
            
            <Text className="text-black text-[14px] leading-[24px]">
              Hello there,
            </Text>
            
            <Text className="text-black text-[14px] leading-[24px]">
              <strong>{inviterName}</strong> has invited you to collaborate in the <strong>{workspaceName}</strong> workspace on TaskFlow.
            </Text>
            
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-[#0f172a] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href={inviteLink}
              >
                Accept Invitation
              </Button>
            </Section>
            
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              This invitation link will expire in 7 days. If you were not expecting this invitation, you can ignore this email.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default WorkspaceInviteEmail; 