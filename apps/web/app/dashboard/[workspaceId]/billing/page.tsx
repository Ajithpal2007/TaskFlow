"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWorkspaceStore } from "@/app/lib/stores/use-workspace-store";
import { apiClient } from "@/app/lib/api-client";
import { CheckCircle2, CreditCard, Zap, Shield, Loader2 } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Badge } from "@repo/ui/components/badge";

export default function BillingPage({ params }: { params: { workspaceId: string } }) {
  const { currentRole } = useWorkspaceStore();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const isAdminOrOwner = currentRole === "OWNER" || currentRole === "ADMIN";

  // 1. Fetch current billing status from your Fastify backend
  const { data: billingData, isLoading } = useQuery({
    queryKey: ["workspace-billing", params.workspaceId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/workspaces/${params.workspaceId}`);
      return data.data; // Assuming this returns { planId, currentPeriodEnd, etc. }
    },
  });

  const isPro = billingData?.planId === "PRO" && new Date(billingData.currentPeriodEnd) > new Date();

  // 2. Route to Stripe Checkout (To Buy)
  const handleUpgrade = async () => {
    if (!isAdminOrOwner) return;
    try {
      setIsRedirecting(true);
      const { data } = await apiClient.post(`/workspaces/${params.workspaceId}/checkout`);
      window.location.href = data.url;
    } catch (error) {
      console.error("Checkout error:", error);
      setIsRedirecting(false);
    }
  };

  // 3. Route to Stripe Portal (To Manage/Cancel)
  const handleManageBilling = async () => {
    if (!isAdminOrOwner) return;
    try {
      setIsRedirecting(true);
      const { data } = await apiClient.get(`/workspaces/${params.workspaceId}/portal`);
      window.location.href = data.url;
    } catch (error) {
      console.error("Portal error:", error);
      setIsRedirecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-6 h-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Billing & Plans</h1>
        <p className="text-muted-foreground mt-2">Manage your workspace subscription and billing details.</p>
      </div>

      {/* 🟢 CURRENT PLAN STATUS CARD */}
      <Card className="mb-10 border-primary/20 shadow-sm bg-primary/5">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              Current Plan: <Badge variant={isPro ? "default" : "secondary"} className="text-sm">{isPro ? "Pro" : "Free"}</Badge>
            </CardTitle>
            <CardDescription className="mt-1">
              {isPro 
                ? `Your subscription is active. Next billing date: ${new Date(billingData.currentPeriodEnd).toLocaleDateString()}` 
                : "You are currently on the free tier. Upgrade to unlock premium features."}
            </CardDescription>
          </div>
          {isPro && isAdminOrOwner && (
            <Button variant="outline" onClick={handleManageBilling} disabled={isRedirecting}>
              <CreditCard className="mr-2 h-4 w-4" />
              Manage Billing
            </Button>
          )}
        </CardHeader>
      </Card>

      {/* 🟢 PRICING TIERS GRID */}
      <div className="grid md:grid-cols-2 gap-8">
        
        {/* FREE TIER */}
        <Card className="flex flex-col relative border-muted">
          <CardHeader>
            <CardTitle className="text-2xl">Hobby</CardTitle>
            <CardDescription>Perfect for small teams just getting started.</CardDescription>
            <div className="mt-4 text-4xl font-extrabold">
              $0 <span className="text-lg font-normal text-muted-foreground">/ forever</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-primary" /> Up to 5 Workspace Members</li>
              <li className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-primary" /> Unlimited Tasks & Docs</li>
              <li className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-primary" /> 3 Whiteboards Limit</li>
              <li className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-primary" /> Standard RBAC (No Viewer Role)</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline" disabled>
              {isPro ? "Downgrade in Portal" : "Current Plan"}
            </Button>
          </CardFooter>
        </Card>

        {/* PRO TIER */}
        <Card className="flex flex-col relative border-primary shadow-md">
          <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-3">
            <Badge className="bg-primary text-primary-foreground font-bold shadow-sm flex items-center gap-1 px-3 py-1">
              <Zap className="h-3 w-3" /> Most Popular
            </Badge>
          </div>
          <CardHeader>
            <CardTitle className="text-2xl">Pro</CardTitle>
            <CardDescription>For scaling teams that need ultimate flexibility.</CardDescription>
            <div className="mt-4 text-4xl font-extrabold">
              $8 <span className="text-lg font-normal text-muted-foreground">/ user / mo</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-3 text-foreground font-medium"><CheckCircle2 className="h-4 w-4 text-primary" /> Everything in Hobby, plus:</li>
              <li className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-primary" /> Unlimited Whiteboards</li>
              <li className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-primary" /> 500 AI Generations / mo</li>
              <li className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-primary" /> 10GB File Storage</li>
              <li className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-primary" /> Advanced Project Roles</li>
            </ul>
          </CardContent>
          <CardFooter>
            {isPro ? (
              <Button className="w-full" variant="default" disabled>
                <CheckCircle2 className="mr-2 h-4 w-4" /> Active Plan
              </Button>
            ) : (
              <Button 
                className="w-full transition-all" 
                variant={isAdminOrOwner ? "default" : "secondary"}
                onClick={handleUpgrade}
                disabled={!isAdminOrOwner || isRedirecting}
              >
                {isRedirecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isAdminOrOwner ? "Upgrade to Pro" : "Ask Admin to Upgrade"}
              </Button>
            )}
          </CardFooter>
        </Card>

      </div>
      
      {/* ENTERPRISE FOOTER NOTE */}
      <div className="mt-12 text-center text-sm text-muted-foreground flex flex-col items-center">
        <Shield className="h-6 w-6 mb-2 text-muted-foreground/50" />
        <p>Need custom SAML SSO, Audit Logs, or Dedicated Support?</p>
        <a href="mailto:sales@korevix.com" className="text-primary font-medium hover:underline mt-1">
          Contact Sales for Enterprise
        </a>
      </div>
    </div>
  );
}