import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { format } from "date-fns";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Mail,
  DollarSign,
  Home,
  Loader2,
  AlertCircle,
} from "lucide-react";

function formatHour(hour: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const h = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${h}:00 ${period}`;
}

function formatDateStr(dateStr: string): string {
  try {
    return format(new Date(dateStr + "T12:00:00"), "EEEE, MMMM d, yyyy");
  } catch {
    return dateStr;
  }
}

export default function ConfirmationPage() {
  const [location] = useLocation();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get("session_id");
    setSessionId(sid);
  }, [location]);

  const { data: booking, isLoading, refetch } = trpc.bookings.getBySessionId.useQuery(
    { sessionId: sessionId! },
    { enabled: !!sessionId, retry: false }
  );

  // Poll up to 10 times (5 seconds apart) waiting for webhook to record the booking
  useEffect(() => {
    if (!booking && !isLoading && sessionId && pollCount < 10) {
      const timer = setTimeout(() => {
        setPollCount((c) => c + 1);
        refetch();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [booking, isLoading, sessionId, pollCount, refetch]);

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-serif text-xl font-semibold text-foreground mb-2">
            No booking found
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            This confirmation link appears to be invalid.
          </p>
          <Link href="/book">
            <Button>Book a Court</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading || (!booking && pollCount < 10)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-sm">
          <Loader2 className="w-10 h-10 text-primary mx-auto mb-4 animate-spin" />
          <h2 className="font-serif text-xl font-semibold text-foreground mb-2">
            Confirming your booking…
          </h2>
          <p className="text-muted-foreground text-sm">
            We're processing your payment. This usually takes just a moment.
          </p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="font-serif text-xl font-semibold text-foreground mb-2">
            Processing your booking
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Your payment was received but your booking is still being processed. Please check your
            email shortly for confirmation, or contact us if you don't receive it within a few
            minutes.
          </p>
          <Link href="/book">
            <Button variant="outline">Return to Booking</Button>
          </Link>
        </div>
      </div>
    );
  }

  const endHour = booking.startHour + booking.durationHours;
  const amountDollars = (booking.amountPaid / 100).toFixed(2);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-white/80 backdrop-blur-sm">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-bold">P</span>
            </div>
            <h1 className="font-serif text-lg font-semibold text-foreground">Pickleball Court</h1>
          </div>
        </div>
      </header>

      <div className="container py-12 md:py-16">
        <div className="max-w-lg mx-auto">
          {/* Success header */}
          <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-serif text-3xl font-semibold text-foreground mb-2">
              Booking Confirmed!
            </h2>
            <p className="text-muted-foreground">
              Your court time is reserved. See you on the court!
            </p>
          </div>

          {/* Booking card */}
          <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
            {/* Green header band */}
            <div className="bg-primary px-6 py-4">
              <p className="text-primary-foreground/80 text-xs font-medium uppercase tracking-widest">
                Booking Reference
              </p>
              <p className="text-primary-foreground font-mono text-sm mt-0.5 truncate">
                {booking.stripeSessionId.startsWith("manual_")
                  ? `#${booking.id}`
                  : booking.stripeSessionId.slice(-12).toUpperCase()}
              </p>
            </div>

            {/* Details */}
            <div className="p-6 space-y-4">
              <DetailRow
                icon={<Calendar className="w-4 h-4" />}
                label="Date"
                value={formatDateStr(booking.bookingDate)}
              />
              <DetailRow
                icon={<Clock className="w-4 h-4" />}
                label="Time"
                value={`${formatHour(booking.startHour)} – ${formatHour(endHour)}`}
              />
              <DetailRow
                icon={<Clock className="w-4 h-4" />}
                label="Duration"
                value={`${booking.durationHours} hour${booking.durationHours > 1 ? "s" : ""}`}
              />
              <div className="h-px bg-border" />
              <DetailRow
                icon={<User className="w-4 h-4" />}
                label="Name"
                value={booking.customerName}
              />
              <DetailRow
                icon={<Mail className="w-4 h-4" />}
                label="Email"
                value={booking.customerEmail}
              />
              <div className="h-px bg-border" />
              <DetailRow
                icon={<DollarSign className="w-4 h-4" />}
                label="Amount Paid"
                value={`$${amountDollars}`}
                valueClass="font-bold text-primary font-serif text-lg"
              />
            </div>
          </div>

          {/* Info box */}
          <div className="mt-4 p-4 bg-primary/5 rounded-xl border border-primary/20 text-sm text-primary/80 animate-in fade-in duration-500 delay-200">
            <p className="font-medium mb-1">What's next?</p>
            <p className="text-xs leading-relaxed">
              A confirmation has been sent to <strong>{booking.customerEmail}</strong>. Please
              arrive 5 minutes before your session. Court equipment is available on-site.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6 animate-in fade-in duration-500 delay-300">
            <Link href="/book" className="flex-1">
              <Button variant="outline" className="w-full">
                Book Another Court
              </Button>
            </Link>
            <Link href="/" className="flex-1">
              <Button variant="ghost" className="w-full gap-2">
                <Home className="w-4 h-4" />
                Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
  valueClass = "text-foreground font-medium",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-muted-foreground text-sm min-w-0">
        {icon}
        <span>{label}</span>
      </div>
      <span className={`text-sm text-right ${valueClass}`}>{value}</span>
    </div>
  );
}
