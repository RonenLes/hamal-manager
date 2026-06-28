"use client";

import { FormEvent, useMemo, useState } from "react";

import {
  createSupportTicket,
  type ApiError,
  type TicketMainSubject,
  type TicketSubSubject,
} from "@/lib/api-client";

type SupportTicketPanelProps = {
  onClose?: () => void;
  onSubmitted?: () => void;
  className?: string;
};

type SubjectOption<T extends string> = {
  value: T;
  label: string;
};

const mainSubjectOptions: SubjectOption<TicketMainSubject>[] = [
  { value: "technical", label: "Technical" },
  { value: "account", label: "Account" },
  { value: "mission", label: "Mission" },
  { value: "driver", label: "Driver" },
  { value: "other", label: "Other" },
];

const subSubjectLabels: Record<TicketSubSubject, string> = {
  login_problem: "Login problem",
  map_problem: "Map problem",
  mission_assignment: "Mission assignment",
  driver_status: "Driver status",
  message_problem: "Message problem",
  other: "Other",
};

const subSubjectsByMain: Record<TicketMainSubject, TicketSubSubject[]> = {
  technical: ["login_problem", "map_problem", "message_problem", "other"],
  account: ["login_problem", "other"],
  mission: ["mission_assignment", "map_problem", "other"],
  driver: ["driver_status", "mission_assignment", "other"],
  other: ["other"],
};

// Returns the api error message.
function getApiErrorMessage(error: unknown): string {
  const apiError = error as Partial<ApiError>;
  return apiError.detail || "Could not create the support ticket.";
}

// Renders the support ticket panel component.
export default function SupportTicketPanel({
  onClose,
  onSubmitted,
  className = "",
}: SupportTicketPanelProps) {
  const [mainSubject, setMainSubject] =
    useState<TicketMainSubject>("technical");
  const [subSubject, setSubSubject] =
    useState<TicketSubSubject>("login_problem");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subSubjectOptions = useMemo(
    () =>
      subSubjectsByMain[mainSubject].map((value) => ({
        value,
        label: subSubjectLabels[value],
      })),
    [mainSubject],
  );

  // Handles the main subject change action.
  const handleMainSubjectChange = (value: TicketMainSubject) => {
    const nextSubSubjects = subSubjectsByMain[value];
    setMainSubject(value);
    setSubSubject(nextSubSubjects[0]);
  };

  // Handles the submit action.
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (!trimmedTitle || !trimmedDescription) {
      setError("Title and description are required.");
      return;
    }

    try {
      setIsSubmitting(true);
      await createSupportTicket({
        main_subject: mainSubject,
        sub_subject: subSubject,
        title: trimmedTitle,
        description: trimmedDescription,
      });
      setTitle("");
      setDescription("");
      setMainSubject("technical");
      setSubSubject("login_problem");
      setSuccess("Support ticket opened.");
      onSubmitted?.();
    } catch (submitError) {
      setError(getApiErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      className={`rounded-2xl border border-app bg-card p-5 shadow-xl ${className}`}
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-400">
            Support
          </p>
          <h2 className="mt-1 text-2xl font-black text-main">
            Open Support Ticket
          </h2>
        </div>

        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-app bg-card-soft px-4 py-2 text-sm font-bold text-main transition hover:border-blue-400 hover:text-blue-300"
          >
            Back
          </button>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-bold text-main">Main subject</span>
            <select
              value={mainSubject}
              onChange={(event) =>
                handleMainSubjectChange(event.target.value as TicketMainSubject)
              }
              className="mt-2 w-full rounded-xl border border-app bg-card-soft px-4 py-3 text-sm text-main outline-none transition focus:border-blue-400"
            >
              {mainSubjectOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-bold text-main">Sub subject</span>
            <select
              value={subSubject}
              onChange={(event) =>
                setSubSubject(event.target.value as TicketSubSubject)
              }
              className="mt-2 w-full rounded-xl border border-app bg-card-soft px-4 py-3 text-sm text-main outline-none transition focus:border-blue-400"
            >
              {subSubjectOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-bold text-main">Title</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={120}
            className="mt-2 w-full rounded-xl border border-app bg-card-soft px-4 py-3 text-sm text-main outline-none transition placeholder:text-muted focus:border-blue-400"
            placeholder="Short summary"
          />
        </label>

        <label className="block">
          <span className="text-sm font-bold text-main">Description</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={2000}
            rows={6}
            className="mt-2 w-full resize-none rounded-xl border border-app bg-card-soft px-4 py-3 text-sm text-main outline-none transition placeholder:text-muted focus:border-blue-400"
            placeholder="What happened?"
          />
        </label>

        {error ? (
          <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-300">
            {success}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Opening..." : "Open Ticket"}
        </button>
      </form>
    </section>
  );
}
