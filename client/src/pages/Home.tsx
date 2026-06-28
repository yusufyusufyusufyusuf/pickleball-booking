import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, CreditCard, ShieldCheck, ArrowRight, Star } from "lucide-react";

export default function Home() {
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
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                Admin
              </Button>
            </Link>
            <Link href="/book">
              <Button size="sm" className="gap-2">
                Book Now
                <ArrowRight className="w-3.5 h-3.5" />
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
                <span className="font-serif text-3xl font-bold text-primary-foreground">$40</span>
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
          <span>Secure payments powered by Stripe</span>
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
