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

interface WelcomeEmailProps {
  userName: string;
  dashboardLink: string;
}

const baseUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const WelcomeEmail = ({
  userName = "Ajith",
  dashboardLink = `${baseUrl}/dashboard`,
}: WelcomeEmailProps) => {
  const previewText = "Welcome to TaskFlow! Your unified workspace is ready.";

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
              Welcome to the team, <strong>{userName}</strong>!
            </Heading>
            
            <Text className="text-black text-[14px] leading-[24px]">
              We are thrilled to have you on board.
            </Text>
            
            <Text className="text-black text-[14px] leading-[24px]">
              TaskFlow was built to eliminate the chaos of jumping between different apps. Now, your tasks, real-time chats, and collaborative documents all live in one beautiful workspace.
            </Text>

            <Text className="text-black text-[14px] leading-[24px]">
              Let's get started by setting up your first project.
            </Text>
            
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-[#22c55e] rounded text-white text-[14px] font-bold no-underline text-center px-6 py-4 shadow-sm"
                href={dashboardLink}
              >
                Go to Dashboard
              </Button>
            </Section>
            
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              Need help getting started? Just reply to this email, we'd love to chat.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default WelcomeEmail;