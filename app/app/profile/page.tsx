"use client";

import { useAuth } from "@/components/AuthProvider";

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Profile</h1>
        <p className="mt-1 text-muted">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile card */}
        <div className="lg:col-span-1">
          <div className="card text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-accent text-3xl font-bold text-white">
              {user?.displayName?.charAt(0) ||
                user?.email?.charAt(0)?.toUpperCase() ||
                "U"}
            </div>
            <h2 className="mt-4 text-xl font-semibold">
              {user?.displayName || user?.email?.split("@")[0] || "User"}
            </h2>
            <p className="text-sm text-muted">{user?.email || "No email"}</p>
            <div className="mt-4 flex justify-center gap-2">
              <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                Participant
              </span>
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                Active
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="card mt-4">
            <h3 className="font-semibold">Statistics</h3>
            <div className="mt-4 space-y-3">
              {[
                { label: "Projects Completed", value: "4" },
                { label: "Hours Contributed", value: "48" },
                { label: "Achievements Earned", value: "7" },
                { label: "Member Since", value: "Dec 2024" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-muted">{stat.label}</span>
                  <span className="font-medium">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-6 lg:col-span-2">
          {/* Notifications */}
          <div className="card">
            <h3 className="text-lg font-semibold">Notifications</h3>
            <p className="text-sm text-muted">
              Manage how you receive notifications.
            </p>

            <div className="mt-6 space-y-4">
              {[
                {
                  id: "email-updates",
                  label: "Email Updates",
                  description: "Receive project updates via email",
                },
                {
                  id: "reminders",
                  label: "Reminders",
                  description: "Get reminders for upcoming deadlines",
                },
                {
                  id: "newsletter",
                  label: "Newsletter",
                  description: "Monthly newsletter with tips and news",
                },
              ].map((setting) => (
                <div
                  key={setting.id}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{setting.label}</p>
                    <p className="text-sm text-muted">{setting.description}</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      defaultChecked
                    />
                    <div className="peer h-6 w-11 rounded-full bg-border after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-accent peer-checked:after:translate-x-full peer-focus:ring-2 peer-focus:ring-accent/20" />
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Danger zone */}
          <div className="card border-red-200 dark:border-red-900/50">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
              Danger Zone
            </h3>
            <p className="text-sm text-muted">
              Irreversible and destructive actions.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button className="btn border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20">
                Delete Account
              </button>
              <button className="btn btn-secondary">Export Data</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

