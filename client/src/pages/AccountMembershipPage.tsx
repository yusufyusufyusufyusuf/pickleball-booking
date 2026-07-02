import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Trophy, Zap, Star, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const TIER_ICONS: Record<string, React.ReactNode> = {
  silver: <Zap className="w-6 h-6" />,
  gold: <Trophy className="w-6 h-6" />,
  platinum: <Star className="w-6 h-6" />,
};

const TIER_COLORS: Record<string, string> = {
  silver: "from-slate-100 to-slate-50 border-slate-200",
  gold: "from-amber-50 to-yellow-50 border-amber-200",
  platinum: "from-primary/10 to-primary/5 border-primary/20",
};

export default function AccountMembershipPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const { data: subscription, isLoading: subLoading } = trpc.memberships.getActive.useQuery(undefined, {
    enabled: isAuthenticated && !loading,
  });

  const cancelMutation = trpc.memberships.cancel.useMutation({
    onSuccess: () => {
      toast.success("Membership cancelled successfully");
      setShowCancelDialog(false);
      // Refetch subscription
      trpc.useUtils().memberships.getActive.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to cancel membership");
    },
  });

  // Auth guard
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-primary text-xl font-bold font-serif">P</span>
          </div>
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-2">Sign In Required</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Please sign in to view and manage your membership.
          </p>
          <a href={getLoginUrl()}>
            <Button className="w-full">Sign In</Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-4 flex items-center justify-between">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <h1 className="font-serif text-lg font-semibold text-foreground">My Membership</h1>
          <div className="w-12" />
        </div>
      </header>

      <div className="container py-12 md:py-16">
        {subLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : subscription ? (
          <div className="max-w-2xl mx-auto space-y-8">
            {/* Active Subscription Card */}
            <div className={`rounded-2xl border bg-gradient-to-b ${TIER_COLORS[subscription.tier]} p-8 shadow-sm`}>
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-white/50 flex items-center justify-center text-primary">
                    {TIER_ICONS[subscription.tier]}
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl font-semibold text-foreground capitalize">
                      {subscription.tier} Membership
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">Active since {new Date(subscription.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <Badge variant={subscription.status === "active" ? "default" : "secondary"} className="capitalize">
                  {subscription.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/50 rounded-lg p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Current Period</p>
                  <p className="font-semibold text-foreground">
                    {new Date(subscription.currentPeriodStart).toLocaleDateString()} -{" "}
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                </div>
                <div className="bg-white/50 rounded-lg p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Renewal Date</p>
                  <p className="font-semibold text-foreground">
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setLocation("/memberships")}
                  className="flex-1"
                >
                  Change Plan
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowCancelDialog(true)}
                  disabled={cancelMutation.isPending}
                  className="flex-1"
                >
                  {cancelMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Cancelling...
                    </>
                  ) : (
                    "Cancel Membership"
                  )}
                </Button>
              </div>
            </div>

            {/* Benefits */}
            <Card className="p-8">
              <h3 className="font-serif text-lg font-semibold text-foreground mb-6">Your Benefits</h3>
              <div className="space-y-4">
                {subscription.tier === "silver" && (
                  <>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-foreground">8 Court Hours Per Month</p>
                        <p className="text-sm text-muted-foreground">Reserve up to 8 hours of court time each month</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-foreground">Priority Booking Window</p>
                        <p className="text-sm text-muted-foreground">Book your court time before other members</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-foreground">Member-Only Rates</p>
                        <p className="text-sm text-muted-foreground">Enjoy discounted pricing on all bookings</p>
                      </div>
                    </div>
                  </>
                )}
                {subscription.tier === "gold" && (
                  <>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-foreground">20 Court Hours Per Month</p>
                        <p className="text-sm text-muted-foreground">Reserve up to 20 hours of court time each month</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-foreground">48-Hour Advance Booking</p>
                        <p className="text-sm text-muted-foreground">Book your court time 48 hours in advance</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-foreground">Guest Passes Included</p>
                        <p className="text-sm text-muted-foreground">Bring friends with included guest passes</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-foreground">Equipment Locker</p>
                        <p className="text-sm text-muted-foreground">Store your equipment in a private locker</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-foreground mb-2">No Active Membership</h3>
              <p className="text-muted-foreground text-sm mb-6">
                You don't have an active membership yet. Explore our membership plans and start enjoying exclusive benefits.
              </p>
              <Button onClick={() => setLocation("/memberships")} className="gap-2">
                View Membership Plans
              </Button>
            </Card>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Membership?</AlertDialogTitle>
            <AlertDialogDescription>
              Your membership will remain active until the end of your current billing period. You can reactivate it anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Membership</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Membership
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
