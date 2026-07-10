import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, CreditCard, ShieldCheck, ArrowRight, Star, Sparkles, Trophy, Zap, Bell, LogOut, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      window.location.href = "/";
    },
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-bold">P</span>
            </div>
            <span className="font-serif text-lg font-semibold text-foreground">
              Pickleball Court
            </span>
          </div>
          <div className="flex items-center gap-3">
            {user?.role === "admin" && (
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  Admin
                </Button>
              </Link>
            )}
            {isAuthenticated ? (
              <>
                <Link href="/memberships">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hidden sm:inline-flex">
                    Memberships
                  </Button>
                </Link>
                <span className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground">
                  <User className="w-3.5 h-3.5" />
                  {user?.name?.split(" ")[0]}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => logoutMutation.mutate()}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="gap-2">
                    Sign Up
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </>
            )}
            <Link href="/book">
              <Button size="sm" variant="outline" className="gap-2 bg-background hidden md:inline-flex">
                Book Now
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, oklch(0.35 0.1 155) 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
        <div className="container py-20 md:py-28 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/20 border border-accent/30 text-accent-foreground text-xs font-medium mb-6">
              <Star className="w-3 h-3 fill-accent text-accent" />
              Premium Court Experience
            </div>
            <h1 className="font-serif text-4xl md:text-6xl font-semibold text-foreground leading-tight mb-6">
              Reserve Your Court,
              <br />
              <span className="text-primary italic">Play Your Best.</span>
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl leading-relaxed mb-8 max-w-xl mx-auto">
              Book a premium pickleball court in seconds. Choose your time, pay securely, and
              show up ready to play.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/book">
                <Button size="lg" className="gap-2 px-8 h-12 text-base w-full sm:w-auto">
                  Reserve a Court
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Pricing */}
      <section className="py-16 md:py-20">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="font-serif text-3xl font-semibold text-foreground mb-2">
              Simple, Transparent Pricing
            </h2>
            <p className="text-muted-foreground">No hidden fees. Pay only for the time you play.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm hover:-translate-y-0.5 transition-transform duration-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-serif text-xl font-semibold text-foreground">1 Hour</h3>
                  <p className="text-muted-foreground text-sm mt-1">Perfect for a quick match</p>
                </div>
                <span className="font-serif text-3xl font-bold text-primary">$20</span>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground mb-5">
                <li className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-primary" />Full court access</li>
                <li className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-primary" />Equipment available on-site</li>
              </ul>
              <Link href="/book"><Button variant="outline" className="w-full">Book 1 Hour</Button></Link>
            </div>
            <div className="bg-primary rounded-2xl border border-primary p-6 shadow-sm hover:-translate-y-0.5 transition-transform duration-200 relative overflow-hidden">
              <div className="absolute top-3 right-3 bg-accent text-accent-foreground text-xs font-semibold px-2 py-0.5 rounded-full">Best Value</div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-serif text-xl font-semibold text-primary-foreground">2 Hours</h3>
                  <p className="text-primary-foreground/70 text-sm mt-1">Extended play session</p>
                </div>
                <span className="font-serif text-3xl font-bold text-primary-foreground">$35</span>
              </div>
              <ul className="space-y-2 text-sm text-primary-foreground/80 mb-5">
                <li className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-primary-foreground" />Full court access</li>
                <li className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-primary-foreground" />Equipment available on-site</li>
              </ul>
              <Link href="/book"><Button variant="outline" className="w-full bg-white/10 border-white/30 text-primary-foreground hover:bg-white/20">Book 2 Hours</Button></Link>
            </div>
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Membership Coming Soon */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        {/* Background decoration */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, oklch(0.35 0.1 155) 1px, transparent 0)`,
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="container relative">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/20 border border-accent/30 text-accent-foreground text-xs font-semibold mb-5">
                <Sparkles className="w-3 h-3 fill-accent text-accent" />
                Coming Soon
              </div>
              <h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-3">
                Membership Plans
              </h2>
              <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto leading-relaxed">
                Unlock unlimited court access, priority booking, and exclusive member perks — all in one plan.
              </p>
            </div>

            {/* Membership tier cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
              <MembershipCard
                tier="Silver"
                icon={<Zap className="w-5 h-5" />}
                color="from-slate-100 to-slate-50"
                borderColor="border-slate-200"
                iconBg="bg-slate-200"
                iconColor="text-slate-600"
                perks={["8 court hours / month", "Priority booking window", "Member-only rates"]}
                price="$50/month"
                status="active"
              />
              <MembershipCard
                tier="Gold"
                icon={<Trophy className="w-5 h-5" />}
                color="from-amber-50 to-yellow-50"
                borderColor="border-amber-200"
                iconBg="bg-amber-100"
                iconColor="text-amber-600"
                featured
                perks={["20 court hours / month", "48-hr advance booking", "Guest passes included", "Equipment locker"]}
                price="$100/month"
                status="active"
              />
              <MembershipCard
                tier="Platinum"
                icon={<Star className="w-5 h-5" />}
                color="from-primary/10 to-primary/5"
                borderColor="border-primary/20"
                iconBg="bg-primary/15"
                iconColor="text-primary"
                perks={["Unlimited court hours", "Instant booking anytime", "Unlimited guest passes", "Private coaching sessions"]}
                status="coming-soon"
              />
            </div>

            {/* Notify me form */}
            <NotifyMeForm />
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Features */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <FeatureCard icon={<Clock className="w-5 h-5 text-primary" />} title="Real-Time Availability" description="See open slots instantly. No double-bookings, ever." />
            <FeatureCard icon={<CreditCard className="w-5 h-5 text-primary" />} title="Secure Payments" description="Pay safely via Stripe. Your booking is confirmed immediately." />
            <FeatureCard icon={<MapPin className="w-5 h-5 text-primary" />} title="Premium Facilities" description="Professional-grade courts with all the equipment you need." />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20">
        <div className="container text-center">
          <h2 className="font-serif text-3xl font-semibold text-foreground mb-4">Ready to play?</h2>
          <p className="text-muted-foreground mb-8">Booking takes less than 2 minutes.</p>
          <Link href="/book"><Button size="lg" className="gap-2 px-10 h-12 text-base">Book Your Court Now<ArrowRight className="w-4 h-4" /></Button></Link>
        </div>
      </section>

      <footer className="border-t border-border py-6">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>© 2025 Pickleball Court. All rights reserved.</span>
          <span></span>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">{icon}</div>
      <h3 className="font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

type MembershipCardProps = {
  tier: string;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
  iconBg: string;
  iconColor: string;
  perks: string[];
  featured?: boolean;
  price?: string;
  status?: 'active' | 'coming-soon';
};

function MembershipCard({ tier, icon, color, borderColor, iconBg, iconColor, perks, featured, price, status = 'coming-soon' }: MembershipCardProps) {
  return (
    <div
      className={`relative rounded-2xl border ${borderColor} bg-gradient-to-b ${color} p-6 flex flex-col gap-4 transition-transform duration-200 hover:-translate-y-1 ${
        featured ? "ring-2 ring-amber-300 shadow-lg" : "shadow-sm"
      }`}
    >
      {featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wide shadow-sm">
          Most Popular
        </div>
      )}
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center ${iconColor}`}>
        {icon}
      </div>
      <div>
        <h3 className="font-serif text-lg font-semibold text-foreground">{tier}</h3>
        <p className="text-xs text-muted-foreground mt-0.5 font-medium uppercase tracking-wide">Membership</p>
      </div>
      <ul className="space-y-2 flex-1">
        {perks.map((perk) => (
          <li key={perk} className="flex items-start gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
            {perk}
          </li>
        ))}
      </ul>
      <div className="mt-2 rounded-xl border border-dashed border-muted-foreground/30 bg-white/50 py-2.5 text-center text-xs font-medium text-muted-foreground">
        {status === 'coming-soon' ? 'Coming Soon' : price}
      </div>
    </div>
  );
}

function NotifyMeForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
    toast.success("You're on the list!", {
      description: "We'll notify you the moment memberships go live.",
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-6 md:p-8 text-center">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <Bell className="w-5 h-5 text-primary" />
      </div>
      <h3 className="font-serif text-xl font-semibold text-foreground mb-2">Get Notified First</h3>
      <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">
        Be the first to know when memberships launch. Early members get a special founding rate.
      </p>
      {submitted ? (
        <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-medium">
          <ShieldCheck className="w-4 h-4" />
          You're on the list — we'll be in touch!
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="flex-1 h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
          <Button type="submit" size="sm" className="h-10 px-5 shrink-0">
            Notify Me
          </Button>
        </form>
      )}
    </div>
  );
}
