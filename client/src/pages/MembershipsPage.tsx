import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, ArrowRight, Zap, Trophy, Star } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";

const TIERS = [
  {
    id: "silver",
    name: "Silver",
    price: "$50",
    period: "per month",
    icon: <Zap className="w-6 h-6" />,
    color: "from-slate-100 to-slate-50",
    borderColor: "border-slate-200",
    iconBg: "bg-slate-200",
    iconColor: "text-slate-600",
    perks: [
      "8 court hours per month",
      "Priority booking window",
      "Member-only rates",
      "Email support",
    ],
  },
  {
    id: "gold",
    name: "Gold",
    price: "$100",
    period: "per month",
    icon: <Trophy className="w-6 h-6" />,
    color: "from-amber-50 to-yellow-50",
    borderColor: "border-amber-200",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    featured: true,
    perks: [
      "20 court hours per month",
      "48-hour advance booking",
      "Guest passes included",
      "Equipment locker",
      "Priority support",
    ],
  },
  {
    id: "platinum",
    name: "Platinum",
    price: "Coming Soon",
    period: "TBD",
    icon: <Star className="w-6 h-6" />,
    color: "from-primary/10 to-primary/5",
    borderColor: "border-primary/20",
    iconBg: "bg-primary/15",
    iconColor: "text-primary",
    disabled: true,
    perks: [
      "Unlimited court hours",
      "Instant booking anytime",
      "Unlimited guest passes",
      "Private coaching sessions",
      "VIP support",
    ],
  },
];

export default function MembershipsPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const createCheckout = trpc.memberships.createCheckoutSession.useMutation({
    onSuccess: ({ url }) => {
      if (url) {
        window.open(url, "_blank");
        toast.success("Redirecting to checkout...");
      }
    },
    onError: (err) => {
      setLoadingTier(null);
      toast.error(err.message || "Failed to create checkout session");
    },
  });

  const handleCheckout = (tierId: string) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    setLoadingTier(tierId);
    createCheckout.mutate({ tier: tierId as "silver" | "gold" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-bold">P</span>
              </div>
              <div>
                <h1 className="font-serif text-lg font-semibold text-foreground leading-none">
                  Pickleball Court
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">Memberships</p>
              </div>
            </div>
          </Link>
          {isAuthenticated && (
            <Link href="/account/membership">
              <Button variant="outline" size="sm">
                My Membership
              </Button>
            </Link>
          )}
        </div>
      </header>

      <div className="container py-12 md:py-16">
        {/* Hero */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-3">
            Membership Plans
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Unlock unlimited court access, priority booking, and exclusive member perks. Choose the plan that fits your play style.
          </p>
        </div>

        {/* Tier Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`relative rounded-2xl border ${tier.borderColor} bg-gradient-to-b ${tier.color} p-6 md:p-8 flex flex-col gap-6 transition-transform duration-200 hover:-translate-y-1 ${
                tier.featured ? "ring-2 ring-amber-300 shadow-lg md:scale-105" : "shadow-sm"
              } ${tier.disabled ? "opacity-60 pointer-events-none" : ""}`}
            >
              {tier.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wide shadow-sm">
                  Most Popular
                </div>
              )}

              {tier.disabled && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-muted text-muted-foreground text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wide shadow-sm">
                  Coming Soon
                </div>
              )}

              <div className={`w-12 h-12 rounded-xl ${tier.iconBg} flex items-center justify-center ${tier.iconColor}`}>
                {tier.icon}
              </div>

              <div>
                <h3 className="font-serif text-2xl font-semibold text-foreground">{tier.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-serif text-3xl font-bold text-foreground">{tier.price}</span>
                  <span className="text-sm text-muted-foreground">{tier.period}</span>
                </div>
              </div>

              <ul className="space-y-3 flex-1">
                {tier.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>

              {!tier.disabled && (
                <Button
                  onClick={() => handleCheckout(tier.id)}
                  disabled={loadingTier === tier.id}
                  className="w-full gap-2"
                  size="lg"
                >
                  {loadingTier === tier.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Get Started
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              )}

              {tier.disabled && (
                <Button disabled className="w-full">
                  Coming Soon
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-border shadow-sm p-8 md:p-10">
          <h3 className="font-serif text-xl font-semibold text-foreground mb-6">Frequently Asked Questions</h3>
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-foreground mb-2">Can I cancel my membership anytime?</h4>
              <p className="text-muted-foreground text-sm">
                Yes, you can cancel your membership at any time. Your access will continue until the end of your current billing period.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">What happens to my unused hours?</h4>
              <p className="text-muted-foreground text-sm">
                Monthly hours reset on the first day of each month. Unused hours do not roll over to the next month.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">Can I upgrade or downgrade my plan?</h4>
              <p className="text-muted-foreground text-sm">
                Yes, you can change your membership tier anytime. Changes take effect on your next billing date.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">Do I get a discount on court bookings?</h4>
              <p className="text-muted-foreground text-sm">
                Members enjoy priority booking and member-only rates. Gold members receive additional benefits like guest passes and equipment lockers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
