import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Plus,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  LogOut,
  LayoutGrid,
  List,
  Clock,
} from "lucide-react";
import { Link } from "wouter";

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8..20

function formatHour(hour: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const h = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${h}:00 ${period}`;
}

function formatDateStr(dateStr: string): string {
  try {
    return format(new Date(dateStr + "T12:00:00"), "MMM d, yyyy");
  } catch {
    return dateStr;
  }
}

const addBookingSchema = z.object({
  customerName: z.string().min(1, "Required"),
  customerEmail: z.string().email("Valid email required"),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Required"),
  startHour: z.coerce.number().int().min(8).max(20),
  durationHours: z.union([z.literal(1), z.literal(2)]),
  notes: z.string().optional(),
});
type AddBookingForm = z.infer<typeof addBookingSchema>;

export default function AdminDashboard() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [cancelId, setCancelId] = useState<number | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

  const utils = trpc.useUtils();

  const { data: stats, isLoading: statsLoading } = trpc.bookings.adminStats.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const { data: bookings, isLoading: bookingsLoading } = trpc.bookings.adminList.useQuery(
    { search: search || undefined, dateFilter: dateFilter || undefined },
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  const cancelMutation = trpc.bookings.adminCancel.useMutation({
    onSuccess: () => {
      toast.success("Booking cancelled successfully");
      utils.bookings.adminList.invalidate();
      utils.bookings.adminStats.invalidate();
      setCancelId(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const addForm = useForm<AddBookingForm>({
    resolver: zodResolver(addBookingSchema) as any,
    defaultValues: { durationHours: 1, startHour: 8 },
  });

  const addMutation = trpc.bookings.adminAdd.useMutation({
    onSuccess: () => {
      toast.success("Booking added successfully");
      utils.bookings.adminList.invalidate();
      utils.bookings.adminStats.invalidate();
      setShowAddDialog(false);
      addForm.reset();
    },
    onError: (err) => toast.error(err.message),
  });

  // Week calendar
  const weekStart = useMemo(() => {
    const base = startOfWeek(new Date(), { weekStartsOn: 1 });
    return addDays(base, weekOffset * 7);
  }, [weekOffset]);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const weekBookings = useMemo(() => {
    if (!bookings) return [];
    const start = format(weekStart, "yyyy-MM-dd");
    const end = format(addDays(weekStart, 6), "yyyy-MM-dd");
    return bookings.filter(
      (b) => b.bookingDate >= start && b.bookingDate <= end && b.status === "confirmed"
    );
  }, [bookings, weekStart]);

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
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-2">Admin Access</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Please sign in to access the admin dashboard.
          </p>
          <a href={getLoginUrl()}>
            <Button className="w-full">Sign In</Button>
          </a>
          <Link href="/">
            <Button variant="ghost" className="w-full mt-2">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <X className="w-6 h-6 text-destructive" />
          </div>
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground text-sm mb-6">
            You don't have permission to access the admin dashboard.
          </p>
          <Link href="/">
            <Button variant="outline">Return to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar + Main layout */}
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className="w-56 bg-sidebar flex-shrink-0 flex flex-col border-r border-sidebar-border">
          <div className="p-5 border-b border-sidebar-border">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-sidebar-primary flex items-center justify-center">
                <span className="text-sidebar-primary-foreground text-xs font-bold">P</span>
              </div>
              <div>
                <p className="text-sidebar-foreground font-serif font-semibold text-sm leading-none">
                  Pickleball
                </p>
                <p className="text-sidebar-foreground/50 text-xs mt-0.5">Admin Panel</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-1">
            <NavItem icon={<LayoutGrid className="w-4 h-4" />} label="Dashboard" active />
            <Link href="/book">
              <NavItem icon={<Calendar className="w-4 h-4" />} label="Booking Page" />
            </Link>
          </nav>

          <div className="p-3 border-t border-sidebar-border">
            <div className="px-3 py-2 mb-2">
              <p className="text-sidebar-foreground text-xs font-medium truncate">{user.name}</p>
              <p className="text-sidebar-foreground/50 text-xs truncate">{user.email}</p>
            </div>
            <button
              onClick={() => logout()}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent text-sm transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {/* Top bar */}
          <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="font-serif text-xl font-semibold text-foreground">Dashboard</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {format(new Date(), "EEEE, MMMM d, yyyy")}
              </p>
            </div>
            <Button onClick={() => setShowAddDialog(true)} size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Booking
            </Button>
          </div>

          <div className="p-6 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<Users className="w-4 h-4" />}
                label="Total Bookings"
                value={statsLoading ? null : stats?.total ?? 0}
                color="primary"
              />
              <StatCard
                icon={<DollarSign className="w-4 h-4" />}
                label="Total Revenue"
                value={statsLoading ? null : `$${((stats?.revenue ?? 0) / 100).toFixed(0)}`}
                color="accent"
              />
              <StatCard
                icon={<Calendar className="w-4 h-4" />}
                label="Today's Bookings"
                value={statsLoading ? null : stats?.todayCount ?? 0}
                color="primary"
              />
              <StatCard
                icon={<TrendingUp className="w-4 h-4" />}
                label="Upcoming"
                value={statsLoading ? null : stats?.upcomingCount ?? 0}
                color="primary"
              />
            </div>

            {/* Tabs: Table / Calendar */}
            <Tabs defaultValue="table">
              <div className="flex items-center justify-between mb-4">
                <TabsList>
                  <TabsTrigger value="table" className="gap-2">
                    <List className="w-3.5 h-3.5" />
                    All Bookings
                  </TabsTrigger>
                  <TabsTrigger value="calendar" className="gap-2">
                    <LayoutGrid className="w-3.5 h-3.5" />
                    Week View
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Table view */}
              <TabsContent value="table">
                <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
                  {/* Filters */}
                  <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name or email…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="w-40"
                      />
                      {dateFilter && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDateFilter("")}
                          className="px-2"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Customer
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Date
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Time
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Duration
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Paid
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Status
                          </th>
                          <th className="px-4 py-3" />
                        </tr>
                      </thead>
                      <tbody>
                        {bookingsLoading ? (
                          Array.from({ length: 5 }).map((_, i) => (
                            <tr key={i} className="border-b border-border">
                              {Array.from({ length: 7 }).map((_, j) => (
                                <td key={j} className="px-4 py-3">
                                  <Skeleton className="h-4 w-full" />
                                </td>
                              ))}
                            </tr>
                          ))
                        ) : bookings?.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                              <p>No bookings found</p>
                            </td>
                          </tr>
                        ) : (
                          bookings?.map((b) => (
                            <tr
                              key={b.id}
                              className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                            >
                              <td className="px-4 py-3">
                                <p className="font-medium text-foreground">{b.customerName}</p>
                                <p className="text-xs text-muted-foreground">{b.customerEmail}</p>
                              </td>
                              <td className="px-4 py-3 text-foreground">
                                {formatDateStr(b.bookingDate)}
                              </td>
                              <td className="px-4 py-3 text-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                  {formatHour(b.startHour)} – {formatHour(b.startHour + b.durationHours)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-foreground">
                                {b.durationHours}h
                              </td>
                              <td className="px-4 py-3 font-medium text-foreground">
                                ${(b.amountPaid / 100).toFixed(0)}
                              </td>
                              <td className="px-4 py-3">
                                <Badge
                                  variant={b.status === "confirmed" ? "default" : "secondary"}
                                  className={
                                    b.status === "confirmed"
                                      ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/10"
                                      : "bg-muted text-muted-foreground"
                                  }
                                >
                                  {b.status}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                {b.status === "confirmed" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2 text-xs"
                                    onClick={() => setCancelId(b.id)}
                                  >
                                    Cancel
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>

              {/* Calendar week view */}
              <TabsContent value="calendar">
                <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
                  {/* Week nav */}
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={() => setWeekOffset((w) => w - 1)}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <p className="text-sm font-medium text-foreground">
                      {format(weekStart, "MMM d")} – {format(addDays(weekStart, 6), "MMM d, yyyy")}
                    </p>
                    <Button variant="ghost" size="sm" onClick={() => setWeekOffset((w) => w + 1)}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Grid */}
                  <div className="overflow-x-auto">
                    <div className="min-w-[700px]">
                      {/* Day headers */}
                      <div className="grid grid-cols-8 border-b border-border">
                        <div className="px-3 py-2 text-xs text-muted-foreground font-medium" />
                        {weekDays.map((day) => (
                          <div
                            key={day.toISOString()}
                            className={`px-2 py-2 text-center border-l border-border ${
                              isSameDay(day, new Date())
                                ? "bg-primary/5"
                                : ""
                            }`}
                          >
                            <p className="text-xs text-muted-foreground font-medium">
                              {format(day, "EEE")}
                            </p>
                            <p
                              className={`text-sm font-semibold mt-0.5 ${
                                isSameDay(day, new Date())
                                  ? "text-primary"
                                  : "text-foreground"
                              }`}
                            >
                              {format(day, "d")}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Time rows */}
                      {HOURS.map((hour) => (
                        <div
                          key={hour}
                          className="grid grid-cols-8 border-b border-border last:border-0"
                        >
                          <div className="px-3 py-2 text-xs text-muted-foreground font-medium border-r border-border flex items-center">
                            {formatHour(hour)}
                          </div>
                          {weekDays.map((day) => {
                            const dayStr = format(day, "yyyy-MM-dd");
                            const booking = weekBookings.find(
                              (b) =>
                                b.bookingDate === dayStr &&
                                b.startHour <= hour &&
                                hour < b.startHour + b.durationHours
                            );
                            const isStart = booking?.startHour === hour;

                            return (
                              <div
                                key={day.toISOString()}
                                className={`border-l border-border min-h-[40px] relative ${
                                  isSameDay(day, new Date()) ? "bg-primary/5" : ""
                                }`}
                              >
                                {booking && isStart && (
                                  <div
                                    className="absolute inset-x-1 top-1 bg-primary/90 text-primary-foreground rounded text-xs px-1.5 py-1 leading-tight overflow-hidden z-10"
                                    style={{
                                      height: `calc(${booking.durationHours * 100}% - 4px)`,
                                    }}
                                  >
                                    <p className="font-medium truncate">{booking.customerName}</p>
                                    <p className="opacity-80 truncate text-[10px]">
                                      {formatHour(booking.startHour)}–{formatHour(booking.startHour + booking.durationHours)}
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Cancel confirmation dialog */}
      <AlertDialog open={cancelId !== null} onOpenChange={() => setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the booking as cancelled and free up the time slot. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Booking</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => cancelId !== null && cancelMutation.mutate({ id: cancelId })}
            >
              {cancelMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Cancel Booking"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add booking dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Add Manual Booking</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={addForm.handleSubmit((data: AddBookingForm) => addMutation.mutate(data))}
            className="space-y-4 py-2"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Customer Name</Label>
                <Input
                  placeholder="Jane Smith"
                  className="mt-1"
                  {...addForm.register("customerName")}
                />
                {addForm.formState.errors.customerName && (
                  <p className="text-destructive text-xs mt-1">
                    {addForm.formState.errors.customerName.message}
                  </p>
                )}
              </div>
              <div className="col-span-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="jane@example.com"
                  className="mt-1"
                  {...addForm.register("customerEmail")}
                />
                {addForm.formState.errors.customerEmail && (
                  <p className="text-destructive text-xs mt-1">
                    {addForm.formState.errors.customerEmail.message}
                  </p>
                )}
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" className="mt-1" {...addForm.register("bookingDate")} />
                {addForm.formState.errors.bookingDate && (
                  <p className="text-destructive text-xs mt-1">
                    {addForm.formState.errors.bookingDate.message}
                  </p>
                )}
              </div>
              <div>
                <Label>Start Time</Label>
                <Select
                  onValueChange={(v) => addForm.setValue("startHour", parseInt(v))}
                  defaultValue="8"
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {HOURS.map((h) => (
                      <SelectItem key={h} value={String(h)}>
                        {formatHour(h)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Duration</Label>
                <Select
                  onValueChange={(v) =>
                    addForm.setValue("durationHours", parseInt(v) as 1 | 2)
                  }
                  defaultValue="1"
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hour — $20</SelectItem>
                    <SelectItem value="2">2 hours — $40</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Notes (optional)</Label>
                <Input placeholder="Any notes…" className="mt-1" {...addForm.register("notes")} />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false);
                  addForm.reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={addMutation.isPending}>
                {addMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Add Booking
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string | null;
  color: "primary" | "accent";
}) {
  return (
    <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center ${
            color === "accent"
              ? "bg-accent/20 text-accent-foreground"
              : "bg-primary/10 text-primary"
          }`}
        >
          {icon}
        </div>
      </div>
      {value === null ? (
        <Skeleton className="h-7 w-16" />
      ) : (
        <p className="font-serif text-2xl font-bold text-foreground">{value}</p>
      )}
    </div>
  );
}

function NavItem({
  icon,
  label,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
      }`}
    >
      {icon}
      {label}
    </div>
  );
}
