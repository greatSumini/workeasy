"use client";

import React from "react";
import type { LucideIcon } from "lucide-react";

export type FeatureItem = {
  icon: LucideIcon;
  title: string;
  description: string;
};

type FeatureCardProps = FeatureItem & {
  className?: string;
};

export default function FeatureCard({
  icon: Icon,
  title,
  description,
  className,
}: FeatureCardProps) {
  const headingId = React.useId();
  return (
    <article
      className={`glass glass-animation rounded-2xl p-5 hover:scale-105 will-change-transform ${className ?? ""}`}
      aria-labelledby={headingId}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-gray-900" aria-hidden="true" />
        <div
          id={headingId}
          className="text-xs text-muted-foreground font-medium uppercase tracking-wider"
        >
          {title}
        </div>
      </div>
      <div className="mt-2 text-base text-gray-700">{description}</div>
    </article>
  );
}
