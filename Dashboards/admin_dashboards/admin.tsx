import React from "react";
import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  Wallet,
  Users,
  FileText,
  ClipboardCheck,
  Bell,
  Settings,
  LogOut,
  Search,
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  Menu,
  X,
} from "lucide-react";

type CaseStatus =
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "CHANGES_REQUESTED";

interface Case {
  id: string;
  caseNumber: string;
  organisation: string;
  funding: string;
  status: CaseStatus;
  dueDate: string;
  reviewer: string;
}

interface AttentionItem {
  id: string;
  title: string;
  description: string;
  type: "overdue" | "review" | "changes";
  caseNumber: string;
}

const cases: Case[] = [
  {
    id: "1",
    caseNumber: "DSAC-2026-0042",
    organisation: "Youth Arts Foundation",
    funding: "R850,000",
    status: "UNDER_REVIEW",
    dueDate: "20 Sep 2026",
    reviewer: "Thabo M.",
  },
  {
    id: "2",
    caseNumber: "DSAC-2026-0041",
    organisation: "KwaZulu Arts Network",
    funding: "R1,200,000",
    status: "IN_PROGRESS",
    dueDate: "25 Sep 2026",
    reviewer: "Sarah N.",
  },
  {
    id: "3",
    caseNumber: "DSAC-2026-0039",
    organisation: "Community Theatre SA",
    funding: "R650,000",
    status: "SUBMITTED",
    dueDate: "18 Sep 2026",
    reviewer: "David K.",
  },
  {
    id: "4",
    caseNumber: "DSAC-2026-0037",
    organisation: "Heritage Development Trust",
    funding: "R2,100,000",
    status: "APPROVED",
    dueDate: "10 Sep 2026",
    reviewer: "Thabo M.",
  },
];

const attentionItems: AttentionItem[] = [
  {
    id: "1",
    title: "Review required",
    description: "Youth Arts Foundation submitted new evidence.",
    type: "review",
    caseNumber: "DSAC-2026-0042",
  },
  {
    id: "2",
    title: "Overdue accountability",
    description: "KwaZulu Arts Network has an overdue task.",
    type: "overdue",
    caseNumber: "DSAC-2026-0041",
  },
  {
    id: "3",
    title: "Changes requested",
    description: "Additional financial documentation is required.",
    type: "changes",
    caseNumber: "DSAC-2026-0036",
  },
];

function statusLabel(status: CaseStatus) {
  switch (status) {
    case "IN_PROGRESS":
      return "In Progress";
    case "SUBMITTED":
      return "Submitted";
    case "UNDER_REVIEW":
      return "Under Review";
    case "APPROVED":
      return "Approved";
    case "CHANGES_REQUESTED":
      return "Changes Requested";
  }
}

function statusClasses(status: CaseStatus) {
  switch (status) {
    case "APPROVED":
      return "bg-green-50 text-green-700";
    case "UNDER_REVIEW":
      return "bg-blue-50 text-blue-700";
    case "SUBMITTED":
      return "bg-purple-50 text-purple-700";
    case "CHANGES_REQUESTED":
      return "bg-orange-50 text-orange-700";
    case "IN_PROGRESS":
      return "bg-gray-100 text-gray-700";
  }
}

const SidebarItem = ({
  icon: Icon,
  label,
  active = false,
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
}) => (
  <button
    className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
      active
        ? "bg-blue-50 text-blue-700"
        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
    }`}
  >
    <Icon size={19} />
    <span>{label}</span>
  </button>
);

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClass,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  iconClass: string;
}) => (
  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
        <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
      </div>

      <div className={`rounded-lg p-3 ${iconClass}`}>
        <Icon size={22} />
      </div>
    </div>
  </div>
);

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex h-16 items-center justify-between border-b px-5">
          <div>
            <h1 className="text-lg font-bold text-gray-900">DSAC</h1>
            <p className="text-xs text-gray-500">Accountability System</p>
          </div>

          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          <p className="mb-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Main
          </p>

          <SidebarItem
            icon={LayoutDashboard}
            label="Dashboard"
            active
          />

          <SidebarItem
            icon={Building2}
            label="Organisations"
          />

          <SidebarItem
            icon={FolderKanban}
            label="Cases & Workspaces"
          />

          <SidebarItem
            icon={Wallet}
            label="Funding"
          />

          <SidebarItem
            icon={Users}
            label="Users"
          />

          <SidebarItem
            icon={FileText}
            label="Reports"
          />

          <p className="mb-3 mt-8 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
            System
          </p>

          <SidebarItem
            icon={ClipboardCheck}
            label="Audit Log"
          />

          <SidebarItem
            icon={Settings}
            label="Settings"
          />
        </nav>

        <div className="border-t p-4">
          <div className="mb-3 flex items-center gap-3 rounded-lg bg-gray-50 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
              DA
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">
                DSAC Admin
              </p>
              <p className="truncate text-xs text-gray-500">
                Administrator
              </p>
            </div>
          </div>

          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={22} />
            </button>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Dashboard
              </h2>
              <p className="hidden text-xs text-gray-500 sm:block">
                DSAC accountability overview
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100">
              <Bell size={20} />

              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
            </button>

            <div className="hidden h-8 w-px bg-gray-200 sm:block" />

            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-gray-900">
                DSAC Admin
              </p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
              DA
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          {/* Page heading */}
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Good morning, Admin
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Here is what is happening across your accountability
                programmes.
              </p>
            </div>

            <button className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
              + Create Case
            </button>
          </div>

          {/* KPI cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard
              title="Organisations"
              value="128"
              subtitle="+8 this month"
              icon={Building2}
              iconClass="bg-blue-50 text-blue-600"
            />

            <StatCard
              title="Active Workspaces"
              value="64"
              subtitle="12 awaiting submission"
              icon={FolderKanban}
              iconClass="bg-purple-50 text-purple-600"
            />

            <StatCard
              title="Pending Reviews"
              value="17"
              subtitle="5 due this week"
              icon={ClipboardCheck}
              iconClass="bg-orange-50 text-orange-600"
            />

            <StatCard
              title="Overdue"
              value="9"
              subtitle="Requires attention"
              icon={Clock}
              iconClass="bg-red-50 text-red-600"
            />

            <StatCard
              title="Total Funding"
              value="R24.8m"
              subtitle="Current agreements"
              icon={Wallet}
              iconClass="bg-green-50 text-green-600"
            />
          </div>

          {/* Main grid */}
          <div className="mt-6 grid gap-6 xl:grid-cols-3">
            {/* Recent cases */}
            <section className="rounded-xl border border-gray-200 bg-white shadow-sm xl:col-span-2">
              <div className="flex items-center justify-between border-b px-5 py-4">
                <div>
                  <h2 className="font-semibold text-gray-900">
                    Recent Accountability Cases
                  </h2>
                  <p className="mt-1 text-xs text-gray-500">
                    Latest case and workspace activity
                  </p>
                </div>

                <button className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
                  View all
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Search */}
              <div className="border-b px-5 py-3">
                <div className="relative">
                  <Search
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="text"
                    placeholder="Search cases or organisations..."
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <th className="px-5 py-3">Case</th>
                      <th className="px-5 py-3">Organisation</th>
                      <th className="px-5 py-3">Funding</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Due</th>
                    </tr>
                  </thead>

                  <tbody>
                    {cases.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b last:border-0 hover:bg-gray-50"
                      >
                        <td className="px-5 py-4">
                          <button className="font-medium text-blue-600 hover:underline">
                            {item.caseNumber}
                          </button>
                          <p className="mt-1 text-xs text-gray-400">
                            Reviewer: {item.reviewer}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-700">
                          {item.organisation}
                        </td>

                        <td className="px-5 py-4 text-sm font-medium text-gray-700">
                          {item.funding}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses(
                              item.status
                            )}`}
                          >
                            {statusLabel(item.status)}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-600">
                          {item.dueDate}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="divide-y md:hidden">
                {cases.map((item) => (
                  <div key={item.id} className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <button className="font-medium text-blue-600">
                          {item.caseNumber}
                        </button>

                        <p className="mt-1 text-sm text-gray-700">
                          {item.organisation}
                        </p>
                      </div>

                      <span
                        className={`whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${statusClasses(
                          item.status
                        )}`}
                      >
                        {statusLabel(item.status)}
                      </span>
                    </div>

                    <div className="mt-3 flex justify-between text-xs text-gray-500">
                      <span>Funding: {item.funding}</span>
                      <span>Due: {item.dueDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Attention required */}
            <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      Attention Required
                    </h2>

                    <p className="mt-1 text-xs text-gray-500">
                      Items that need admin action
                    </p>
                  </div>

                  <AlertCircle
                    size={20}
                    className="text-orange-500"
                  />
                </div>
              </div>

              <div className="divide-y">
                {attentionItems.map((item) => (
                  <button
                    key={item.id}
                    className="flex w-full gap-3 p-5 text-left hover:bg-gray-50"
                  >
                    <div className="mt-0.5">
                      {item.type === "review" && (
                        <ClipboardCheck
                          size={18}
                          className="text-blue-600"
                        />
                      )}

                      {item.type === "overdue" && (
                        <Clock
                          size={18}
                          className="text-red-600"
                        />
                      )}

                      {item.type === "changes" && (
                        <AlertCircle
                          size={18}
                          className="text-orange-600"
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {item.title}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-gray-500">
                        {item.description}
                      </p>

                      <p className="mt-2 text-xs font-medium text-blue-600">
                        {item.caseNumber}
                      </p>
                    </div>

                    <ChevronRight
                      size={16}
                      className="mt-1 shrink-0 text-gray-400"
                    />
                  </button>
                ))}
              </div>

              <div className="border-t p-4">
                <button className="w-full rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  View all attention items
                </button>
              </div>
            </section>
          </div>

          {/* Funding overview */}
          <section className="mt-6 rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="font-semibold text-gray-900">
                  Funding Overview
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Current funding agreements and accountability status
                </p>
              </div>

              <button className="text-sm font-medium text-blue-600">
                View funding
              </button>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-3">
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase text-gray-500">
                  Allocated
                </p>

                <p className="mt-2 text-xl font-bold text-gray-900">
                  R24.8m
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase text-gray-500">
                  Accounted For
                </p>

                <p className="mt-2 text-xl font-bold text-gray-900">
                  R18.4m
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase text-gray-500">
                  Outstanding
                </p>

                <p className="mt-2 text-xl font-bold text-gray-900">
                  R6.4m
                </p>
              </div>
            </div>

            {/* Progress */}
            <div className="px-5 pb-5">
              <div className="mb-2 flex justify-between text-xs">
                <span className="font-medium text-gray-600">
                  Overall accountability progress
                </span>

                <span className="font-semibold text-gray-900">
                  74%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{ width: "74%" }}
                />
              </div>
            </div>
          </section>

          {/* System activity */}
          <section className="mt-6 rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b px-5 py-4">
              <h2 className="font-semibold text-gray-900">
                Recent System Activity
              </h2>
            </div>

            <div className="divide-y">
              {[
                {
                  text: "Youth Arts Foundation uploaded supporting evidence",
                  time: "12 minutes ago",
                },
                {
                  text: "Reviewer submitted changes for DSAC-2026-0036",
                  time: "43 minutes ago",
                },
                {
                  text: "New organisation registered: Arts Connect SA",
                  time: "2 hours ago",
                },
                {
                  text: "Case DSAC-2026-0037 was approved",
                  time: "4 hours ago",
                },
              ].map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 px-5 py-4"
                >
                  <CheckCircle2
                    size={17}
                    className="shrink-0 text-green-600"
                  />

                  <p className="flex-1 text-sm text-gray-700">
                    {activity.text}
                  </p>

                  <span className="whitespace-nowrap text-xs text-gray-400">
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}