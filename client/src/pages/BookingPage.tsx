import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  CreditCard,
  CheckCircle2,
  Loader2,
} from "lucide-react";

const contactSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerEmail: z.string().email("Please enter a valid email address"),
});
type ContactForm = z.infer<typeof contactSchema>;

function formatHour(hour: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const h = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${h}:00 ${period}`;
}

const STEPS = ["Select Date", "Choose Time", "Your Details", "Review & Pay"] as const;
type Step = 0 | 1 | 2 | 3;

export default function BookingPage() {
  const today = startOfDay(new Date());
  const [step, setStep] = useState<Step>(0);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedHour, setSelectedHour] = useState<number | undefined>(undefined);
  const [selectedDuration, setSelectedDuration] = useState<1 | 2 | undefined>(undefined);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const dateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";

  const { data: slots, isLoading: slotsLoading } = trpc.bookings.getAvailableSlots.useQuery(
    { date: dateStr },
    { enabled: !!dateStr }
  );

  const createCheckout = trpc.bookings.createCheckoutSession.useMutation({
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
    onError: (err) => {
      setIsRedirecting(false);
      toast.error(err.message || "Failed to create checkout session. Please try again.");
    },
  });

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ContactForm>({ resolver: zodResolver(contactSchema) });

  const canGoNext = useMemo(() => {
    if (step === 0) return !!selectedDate;
    if (step === 1) return selectedHour !== undefined && selectedDuration !== undefined;
    if (step === 2) return true; // validated on submit
    return true;
  }, [step, selectedDate, selectedHour, selectedDuration]);

  const handleNext = handleSubmit(
    () => {
      if (step < 3) setStep((s) => (s + 1) as Step);
    },
    () => {
      if (step !== 2) {
        if (step < 3) setStep((s) => (s + 1) as Step);
      }
    }
  );

  const handleStepNext = () => {
    if (step === 2) {
      handleSubmit(() => setStep(3))();
    } else if (step < 3) {
      setStep((s) => (s + 1) as Step);
    }
  };

  const handlePay = () => {
    const values = getValues();
    if (!selectedDate || selectedHour === undefined || !selectedDuration) return;
    setIsRedirecting(true);
    createCheckout.mutate({
      customerName: values.customerName,
      customerEmail: values.customerEmail,
      bookingDate: format(selectedDate, "yyyy-MM-dd"),
      startHour: selectedHour,
      durationHours: selectedDuration,
    });
  };

  const priceLabel = selectedDuration === 1 ? "$20" : selectedDuration === 2 ? "$35" : "";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-bold">P</span>
            </div>
            <div>
              <h1 className="font-serif text-lg font-semibold text-foreground leading-none">
                Pickleball Court
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">Reserve your court time</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Court 1</span>
          </div>
        </div>
      </header>

      <div className="container py-8 md:py-12">
        {/* Step indicator */}
        <div className="mb-10">
          <div className="flex items-center justify-center gap-0">
            {STEPS.map((label, i) => (
              <div key={i} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                      i < step
                        ? "bg-primary text-primary-foreground"
                        : i === step
                        ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                  </div>
                  <span
                    className={`text-xs mt-1.5 font-medium hidden sm:block ${
                      i === step ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`w-16 md:w-24 h-px mx-1 transition-all duration-500 ${
                      i < step ? "bg-primary" : "bg-border"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="max-w-2xl mx-auto">
          {/* Step 0: Date */}
          {step === 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-border p-6 md:p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="font-serif text-2xl font-semibold text-foreground mb-1">
                Select a Date
              </h2>
              <p className="text-muted-foreground text-sm mb-6">
                Choose the date you'd like to play. Bookings are available up to 60 days in advance.
              </p>
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) =>
                    isBefore(startOfDay(date), today) ||
                    isBefore(addDays(today, 60), startOfDay(date))
                  }
                  className="rounded-xl border border-border"
                />
              </div>
              {selectedDate && (
                <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20 text-center">
                  <p className="text-sm font-medium text-primary">
                    {format(selectedDate, "EEEE, MMMM d, yyyy")}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 1: Time + Duration */}
          {step === 1 && (
            <div className="bg-white rounded-2xl shadow-sm border border-border p-6 md:p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="font-serif text-2xl font-semibold text-foreground mb-1">
                Choose Your Time
              </h2>
              <p className="text-muted-foreground text-sm mb-2">
                {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}
              </p>

              {/* Duration selector */}
              <div className="mb-6">
                <p className="text-sm font-medium text-foreground mb-3">Duration</p>
                <div className="grid grid-cols-2 gap-3">
                  {([1, 2] as const).map((dur) => (
                    <button
                      key={dur}
                      onClick={() => {
                        setSelectedDuration(dur);
                        setSelectedHour(undefined);
                      }}
                      className={`p-4 rounded-xl border-2 text-left transition-all duration-150 ${
                        selectedDuration === dur
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40 hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-foreground">
                            {dur} hour{dur > 1 ? "s" : ""}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {dur === 1 ? "Perfect for a quick game" : "Extended play session"}
                          </p>
                        </div>
                        <div
                          className={`text-lg font-bold font-serif ${
                            selectedDuration === dur ? "text-primary" : "text-foreground"
                          }`}
                        >
                          ${dur === 1 ? "20" : "35"}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time slots */}
              <div>
                <p className="text-sm font-medium text-foreground mb-3">
                  Available Start Times
                  {!selectedDuration && (
                    <span className="text-muted-foreground font-normal ml-1">
                      — select a duration first
                    </span>
                  )}
                </p>
                {slotsLoading ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {Array.from({ length: 13 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 rounded-lg" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {slots?.map((slot) => {
                      const isAvailable =
                        selectedDuration === 1
                          ? slot.available1hr
                          : selectedDuration === 2
                          ? slot.available2hr
                          : false;
                      const isSelected = selectedHour === slot.hour;
                      const isDisabled = !selectedDuration || !isAvailable;

                      return (
                        <button
                          key={slot.hour}
                          disabled={isDisabled}
                          onClick={() => setSelectedHour(slot.hour)}
                          className={`py-2.5 px-2 rounded-lg text-sm font-medium transition-all duration-150 border-2 ${
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground shadow-md"
                              : isDisabled
                              ? "border-border bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                              : "border-primary/30 bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary cursor-pointer"
                          }`}
                        >
                          {formatHour(slot.hour)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {selectedHour !== undefined && selectedDuration && (
                <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-sm font-medium text-primary flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {formatHour(selectedHour)} – {formatHour(selectedHour + selectedDuration)} ·{" "}
                    {selectedDuration} hour{selectedDuration > 1 ? "s" : ""} · ${selectedDuration === 1 ? "20" : "35"}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Contact info */}
          {step === 2 && (
            <div className="bg-white rounded-2xl shadow-sm border border-border p-6 md:p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="font-serif text-2xl font-semibold text-foreground mb-1">
                Your Details
              </h2>
              <p className="text-muted-foreground text-sm mb-6">
                We'll send your booking confirmation to this email address.
              </p>
              <form className="space-y-5">
                <div>
                  <Label htmlFor="customerName" className="text-sm font-medium text-foreground">
                    Full Name
                  </Label>
                  <Input
                    id="customerName"
                    placeholder="Jane Smith"
                    className="mt-1.5"
                    {...register("customerName")}
                  />
                  {errors.customerName && (
                    <p className="text-destructive text-xs mt-1">{errors.customerName.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="customerEmail" className="text-sm font-medium text-foreground">
                    Email Address
                  </Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    placeholder="jane@example.com"
                    className="mt-1.5"
                    {...register("customerEmail")}
                  />
                  {errors.customerEmail && (
                    <p className="text-destructive text-xs mt-1">{errors.customerEmail.message}</p>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="bg-white rounded-2xl shadow-sm border border-border p-6 md:p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="font-serif text-2xl font-semibold text-foreground mb-1">
                Review & Pay
              </h2>
              <p className="text-muted-foreground text-sm mb-6">
                Please confirm your booking details before proceeding to payment.
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center py-3 border-b border-border">
                  <span className="text-sm text-muted-foreground">Date</span>
                  <span className="text-sm font-medium text-foreground">
                    {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-border">
                  <span className="text-sm text-muted-foreground">Time</span>
                  <span className="text-sm font-medium text-foreground">
                    {selectedHour !== undefined && selectedDuration
                      ? `${formatHour(selectedHour)} – ${formatHour(selectedHour + selectedDuration)}`
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-border">
                  <span className="text-sm text-muted-foreground">Duration</span>
                  <span className="text-sm font-medium text-foreground">
                    {selectedDuration} hour{selectedDuration && selectedDuration > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-border">
                  <span className="text-sm text-muted-foreground">Name</span>
                  <span className="text-sm font-medium text-foreground">
                    {getValues("customerName")}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-border">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <span className="text-sm font-medium text-foreground">
                    {getValues("customerEmail")}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-base font-semibold text-foreground">Total</span>
                  <span className="text-xl font-bold font-serif text-primary">{priceLabel}</span>
                </div>
              </div>

              <div className="p-3 bg-muted rounded-lg text-xs text-muted-foreground mb-4">
                You will be redirected to Stripe's secure checkout to complete your payment. Your
                booking is confirmed only after successful payment.
              </div>

              <Button
                className="w-full h-12 text-base font-semibold"
                onClick={handlePay}
                disabled={isRedirecting || createCheckout.isPending}
              >
                {isRedirecting || createCheckout.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Redirecting to payment…
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pay {priceLabel} Securely
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => (s - 1) as Step)}
              disabled={step === 0}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>

            {step < 3 && (
              <Button
                onClick={handleStepNext}
                disabled={!canGoNext}
                className="gap-2 px-6"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-6">
        <div className="container text-center text-xs text-muted-foreground">
          <p>Secure payments powered by Stripe · Bookings confirmed after payment</p>
        </div>
      </footer>
    </div>
  );
}
