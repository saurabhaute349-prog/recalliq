"use client";

import { motion } from "framer-motion";
import { Calendar, MessageSquare, Users, Zap } from "lucide-react";
import Link from "next/link";

import { fadeIn, fadeInDelay } from "@/lib/motion";
import type { DashboardStats } from "@/lib/dashboard/stats";

type DashboardStatsProps = {
  stats: DashboardStats;
};

export function DashboardStatsPanel({ stats }: DashboardStatsProps) {
  const cards = [
    {
      label: "Total meetings",
      value: stats.totalMeetings,
      icon: Calendar,
    },
    {
      label: "This week",
      value: stats.meetingsThisWeek,
      icon: Zap,
    },
    {
      label: "AI questions",
      value: stats.totalAiQuestions,
      icon: MessageSquare,
    },
    {
      label: "People tracked",
      value: stats.topPeople.length,
      icon: Users,
    },
  ];

  return (
    <motion.section {...fadeIn} className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => (
          <motion.div
            key={card.label}
            {...fadeInDelay(0.04 * index)}
            className="rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {card.label}
              </p>
              <card.icon className="size-4 text-primary" />
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{card.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          {...fadeInDelay(0.12)}
          className="rounded-xl border border-border bg-card p-5 shadow-sm"
        >
          <h3 className="text-sm font-semibold">Most discussed people</h3>
          {stats.topPeople.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              People appear here after you analyze meetings.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {stats.topPeople.map((person) => (
                <li
                  key={person.name}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="font-medium">{person.name}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {person.count} meeting{person.count === 1 ? "" : "s"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </motion.div>

        <motion.div
          {...fadeInDelay(0.14)}
          className="rounded-xl border border-border bg-card p-5 shadow-sm"
        >
          <h3 className="text-sm font-semibold">Recent action items</h3>
          {stats.recentActionItems.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Action items are extracted when you create meeting memory.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {stats.recentActionItems.map((item) => (
                <li key={`${item.meetingId}-${item.task}`}>
                  <Link
                    href={`/meetings/${item.meetingId}`}
                    className="group block rounded-lg border border-border/80 bg-muted/20 px-3 py-2 transition-colors hover:bg-muted/40"
                  >
                    <p className="text-sm leading-relaxed text-foreground group-hover:text-primary">
                      {item.task}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.meetingTitle}
                      {item.owner ? ` · ${item.owner}` : ""}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>
    </motion.section>
  );
}
