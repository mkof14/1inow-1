import {
  Brain,
  CheckCircle2,
  CircleHelp,
  ClipboardList,
  FileText,
  FolderKanban,
  Inbox,
  Layers3,
  Mic,
  Radar,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";

export const publicLearningTopics = [
  {
    slug: "voice-capture",
    title: "Capture by voice",
    eyebrow: "Voice first",
    summary:
      "Use voice to collect thoughts, tasks, questions, and project signals before they disappear.",
    icon: Mic,
    image: "/marketing/voice-capture.jpg",
    sections: [
      [
        "What it means",
        "Voice capture is the fastest entry point into the system. It should save raw thoughts without forcing you to classify everything immediately.",
      ],
      [
        "How it helps",
        "A useful command center lets you capture first, then process later into tasks, notes, reminders, project risks, or decisions.",
      ],
      [
        "1inow direction",
        "The voice layer is prepared for future speech-to-text and command routing. External AI and paid speech services remain disconnected until explicit approval.",
      ],
    ],
    takeaways: ["Capture fast", "Process later", "Keep context", "Avoid losing intent"],
  },
  {
    slug: "review-queue",
    title: "Review the queue",
    eyebrow: "Inbox discipline",
    summary: "Turn scattered inputs into a clear review flow so nothing important stays hidden.",
    icon: Inbox,
    image: "/marketing/project-organization.jpg",
    sections: [
      [
        "What it means",
        "The queue is where raw inputs become useful. It can include voice notes, messages, ideas, open questions, risks, and incomplete tasks.",
      ],
      [
        "How it helps",
        "A review queue prevents the system from becoming another pile of pages. It creates one place to decide what each input really is.",
      ],
      [
        "1inow direction",
        "The next version should support triage states: keep, convert to task, attach to project, ask later, delegate, or archive.",
      ],
    ],
    takeaways: ["Collect inputs", "Clarify meaning", "Convert to action", "Archive noise"],
  },
  {
    slug: "next-action",
    title: "Create the next action",
    eyebrow: "Execution clarity",
    summary: "Convert plans into small, visible next actions that can actually move today.",
    icon: ClipboardList,
    image: "/marketing/execution-momentum.jpg",
    sections: [
      [
        "What it means",
        "A next action is the smallest useful move that advances a project, task, relationship, or decision.",
      ],
      [
        "How it helps",
        "Clear next actions reduce friction. You do not need to rethink the whole project every time you open the system.",
      ],
      [
        "1inow direction",
        "Actions should connect to projects, priorities, owners, timing, and activity history so the system can explain why an action matters.",
      ],
    ],
    takeaways: ["Make it small", "Make it visible", "Attach context", "Move today"],
  },
  {
    slug: "risk-tracking",
    title: "Track risks",
    eyebrow: "Operational awareness",
    summary: "Track risks as living signals, not static notes hidden inside project pages.",
    icon: Radar,
    image: "/marketing/project-organization.jpg",
    sections: [
      [
        "What it means",
        "Risk tracking means seeing what can block progress, create delay, damage quality, or require a decision.",
      ],
      [
        "How it helps",
        "When risks are visible, the system can guide attention before small problems become expensive surprises.",
      ],
      [
        "1inow direction",
        "Risks should connect to projects, tasks, owners, due dates, decisions, and audit history.",
      ],
    ],
    takeaways: ["See blockers", "Assign owners", "Review often", "Act early"],
  },
  {
    slug: "intelligence-layer",
    title: "Intelligence layer",
    eyebrow: "Guided work",
    summary:
      "Prepare the system to guide work, summarize context, and suggest next steps without connecting external AI too early.",
    icon: Brain,
    image: "/marketing/voice-capture.jpg",
    sections: [
      [
        "What it means",
        "The intelligence layer is the reasoning surface of the product: context, suggestions, summaries, questions, and decision support.",
      ],
      [
        "How it helps",
        "It should reduce mental load by explaining what changed, what matters, and what should happen next.",
      ],
      [
        "1inow direction",
        "AI routes remain safe stubs now. Later production integrations can include OpenAI, Anthropic, Gemini, model routing, permissions, and AI audit logs.",
      ],
    ],
    takeaways: [
      "Summarize context",
      "Suggest next moves",
      "Respect permissions",
      "Audit AI actions",
    ],
  },
  {
    slug: "operating-picture",
    title: "Today operating picture",
    eyebrow: "Daily view",
    summary: "A single visual view of current captures, tasks, active projects, and risks.",
    icon: Target,
    image: "/marketing/execution-momentum.jpg",
    sections: [
      [
        "What it means",
        "The operating picture answers what is happening today across projects, life tasks, communication, and decisions.",
      ],
      [
        "How it helps",
        "It keeps attention on movement instead of forcing users to open many disconnected pages.",
      ],
      [
        "1inow direction",
        "The dashboard should become a useful control room: current workload, active priorities, due signals, risks, and recommended review points.",
      ],
    ],
    takeaways: ["See today", "Reduce switching", "Notice drift", "Choose focus"],
  },
  {
    slug: "obvious-system",
    title: "Built to feel obvious",
    eyebrow: "Product principle",
    summary:
      "Every screen should make the next useful step clear without forcing the user to think like a database.",
    icon: Layers3,
    image: "/marketing/project-organization.jpg",
    sections: [
      [
        "What it means",
        "A living system should explain itself through layout, labels, signals, and next-step affordances.",
      ],
      [
        "How it helps",
        "Users should know what to do next without reading instructions or filling empty pages just to make the product look populated.",
      ],
      [
        "1inow direction",
        "The interface should keep moving toward visual clarity, guided states, useful empty screens, and real information hierarchy.",
      ],
    ],
    takeaways: ["Show meaning", "Guide next step", "Avoid empty noise", "Make work visible"],
  },
  {
    slug: "faq",
    title: "FAQ",
    eyebrow: "Product questions",
    summary: "Common questions about 1inow, AI readiness, privacy, and current production scope.",
    icon: CircleHelp,
    image: "/marketing/voice-capture.jpg",
    sections: [
      [
        "Is AI connected now?",
        "No. AI chat, speech-to-text, and text-to-speech are intentionally stubbed until production integration is explicitly approved.",
      ],
      [
        "Can 1inow manage projects and personal work?",
        "Yes. The product direction combines projects, tasks, voice capture, decisions, files, communication, and future assistant workflows.",
      ],
      [
        "Are paid services connected?",
        "No new paid external services should be connected without explicit approval and a separate implementation task.",
      ],
    ],
    takeaways: [
      "AI is not connected",
      "Founder flow exists",
      "External services require approval",
      "Build must stay clean",
    ],
  },
  {
    slug: "legal",
    title: "Legal",
    eyebrow: "Terms and privacy",
    summary:
      "Public legal overview for the current pre-production base. Formal policies can be expanded before launch.",
    icon: FileText,
    image: "/marketing/project-organization.jpg",
    sections: [
      [
        "Current status",
        "1inow is in active product development. Public legal pages are informational until final production policies are approved.",
      ],
      [
        "Privacy direction",
        "No production secrets should be committed. User data, AI actions, permissions, and audit logs should be treated as first-class production concerns.",
      ],
      [
        "Production requirement",
        "Before launch, finalize Terms, Privacy Policy, cookie/analytics rules, data retention, and support contact paths.",
      ],
    ],
    takeaways: [
      "No secrets in repo",
      "Finalize before launch",
      "Audit sensitive actions",
      "Keep policies visible",
    ],
  },
  {
    slug: "security",
    title: "Security",
    eyebrow: "Trust foundation",
    summary:
      "The product needs clear permissions, clean environment handling, and explicit approval for integrations.",
    icon: ShieldCheck,
    image: "/marketing/execution-momentum.jpg",
    sections: [
      [
        "What matters",
        "Security starts with buildable code, no secrets in the repository, scoped environment variables, and role-based access control.",
      ],
      [
        "Access model",
        "Founder and admin flows should be separated from regular user access, with future roles for admin, manager, member, and viewer.",
      ],
      [
        "Production direction",
        "Before launch, add monitoring, audit logs, rate limits where needed, and clear service-specific permission rules.",
      ],
    ],
    takeaways: ["No secrets", "Use RBAC", "Audit changes", "Approve integrations"],
  },
  {
    slug: "projects",
    title: "Projects",
    eyebrow: "Execution engine",
    summary:
      "Projects should connect strategy, milestones, tasks, comments, risks, owners, and activity.",
    icon: FolderKanban,
    image: "/marketing/project-organization.jpg",
    sections: [
      [
        "What it means",
        "A project is not only a page. It is an execution context with goals, owners, milestones, work, blockers, and decisions.",
      ],
      [
        "How it helps",
        "When project context is structured, users can see what is active, what is stuck, and what needs attention.",
      ],
      [
        "1inow direction",
        "Project records should support milestones, tasks, subtasks, comments, attachments, activity logs, status, priority, and ownership.",
      ],
    ],
    takeaways: ["Connect work", "Track progress", "Expose blockers", "Preserve history"],
  },
  {
    slug: "automation-readiness",
    title: "Automation readiness",
    eyebrow: "Future workflows",
    summary: "Automation should come after the workflow is clear, useful, and safe for daily use.",
    icon: Sparkles,
    image: "/marketing/execution-momentum.jpg",
    sections: [
      [
        "What it means",
        "Automation readiness means the product can safely suggest, prepare, or execute repetitive work only when permissions and audit trails are clear.",
      ],
      [
        "How it helps",
        "Good automation reduces repetitive steps. Bad automation hides risk. 1inow should avoid automating before the human workflow is reliable.",
      ],
      [
        "1inow direction",
        "Future automations can include reminders, summaries, task creation, notification routing, and AI-assisted reviews after explicit approval.",
      ],
    ],
    takeaways: ["Workflow first", "Permission before action", "Audit everything", "Automate later"],
  },
] as const;

export type PublicLearningTopic = (typeof publicLearningTopics)[number];

export function getPublicLearningTopic(slug: string) {
  return publicLearningTopics.find((topic) => topic.slug === slug);
}
