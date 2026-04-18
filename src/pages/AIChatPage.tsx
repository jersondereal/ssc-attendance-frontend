import axios from "axios";
import { ArrowUp, Calendar, ClipboardList, Users } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import config from "../config";
import { useAuthStore } from "../stores/useAuthStore";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface HistoryEntry {
  role: "user" | "assistant";
  parts: string;
}

// ─── Suggestion categories ────────────────────────────────────────────────────

const CATEGORIES = [
  {
    id: "attendance",
    label: "Attendance",
    icon: <ClipboardList className="w-4 h-4" />,
    prompts: [
      "What is the attendance summary for the most recent event?",
      "How many students were absent at the last event?",
      "Which event had the highest number of absences?",
      "Show the attendance record of ____ across all events",
      "What is the attendance rate for the ____ event?",
    ],
  },
  {
    id: "students",
    label: "Students",
    icon: <Users className="w-4 h-4" />,
    prompts: [
      "Give me the info of ____",
      "List all students from the ____ college",
      "How many students are in each year level?",
      "How many students are there in each college?",
      "How many students have never attended any event?",
    ],
  },
  {
    id: "events",
    label: "Events & Fines",
    icon: <Calendar className="w-4 h-4" />,
    prompts: [
      "How many students per college attended the most recent event?",
      "Show me the details of the ____ event",
      "List students with unpaid fines from the ____ event",
      "What is the attendance breakdown by college for the ____ event?",
      "Which event had the lowest attendance rate?",
    ],
  },
];

// ─── Suggestion buttons with animated dropdown ────────────────────────────────

interface SuggestionButtonsProps {
  onToggle: (id: string) => void;
}

// Renders only the trigger buttons — dropdown is managed at chatbox level
function SuggestionButtons({ onToggle }: SuggestionButtonsProps) {
  return (
    <div className="flex flex-row gap-2">
      {CATEGORIES.map((cat) => (
        <div key={cat.id} className="border-r border-border-dark last:border-r-0 pr-2 last:pr-0 md:border-none md:pr-0">
          <button
            type="button"
            onClick={() => onToggle(cat.id)}
            className="flex items-center gap-1.5 md:px-3 md:py-1.5 rounded-[8px] md:border border-border-dark md:bg-white md:hover:bg-gray-100 text-sm text-gray-500 font-medium transition-colors cursor-pointer"
          >
            <span className="hidden md:flex text-gray-400">{cat.icon}</span>
            {cat.label}
          </button>
        </div>
      ))}
    </div>
  );
}


// ─── Simple markdown renderer ─────────────────────────────────────────────────

const IMAGE_URL_RE = /!\[([^\]]*)\]\((https?:\/\/[^)]+)\)|(https?:\/\/\S+\.(?:png|jpg|jpeg|gif|webp)(\?\S*)?)/gi;

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="bg-gray-100 border border-border-dark rounded px-1 py-0.5 text-xs font-mono">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function renderLineWithImages(line: string): React.ReactNode {
  const result: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  IMAGE_URL_RE.lastIndex = 0;
  while ((match = IMAGE_URL_RE.exec(line)) !== null) {
    if (match.index > lastIndex) {
      result.push(renderInline(line.slice(lastIndex, match.index)));
    }
    const src = match[2] || match[3];
    result.push(
      <img key={match.index} src={src} alt={match[1] || "image"}
        className="mt-2 rounded-[8px] max-w-[160px] max-h-[160px] object-cover border border-border-dark" />
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < line.length) result.push(renderInline(line.slice(lastIndex)));
  return result.length ? result : renderInline(line);
}

function MarkdownContent({ text }: { text: string }) {
  // Rejoin markdown images split across lines: ![alt]\n(url) → ![alt](url)
  const normalized = text.replace(/!\[([^\]]*)\]\n\((https?:\/\/[^)]+)\)/g, "![$1]($2)");
  const lines = normalized.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (/^\|/.test(line)) {
      const rows: string[][] = [];
      while (i < lines.length && /^\|/.test(lines[i])) {
        const cells = lines[i].split("|").slice(1, -1).map(c => c.trim());
        rows.push(cells);
        i++;
      }
      // Filter out separator rows (cells like ---, :---:, etc.)
      const isSeparator = (row: string[]) => row.every(c => /^:?-+:?$/.test(c));
      const headerRow = rows[0];
      const dataRows = rows.filter((_, idx) => idx !== 0 && !isSeparator(rows[idx]));
      elements.push(
        <div key={`tbl-${i}`} className="overflow-x-auto my-2">
          <table className="text-sm text-gray-800 border-collapse w-full">
            <thead>
              <tr>
                {headerRow.map((cell, j) => (
                  <th key={j} className="border border-border-dark px-3 py-1.5 text-left font-semibold bg-gray-50 whitespace-nowrap">{renderInline(cell)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row, j) => (
                <tr key={j} className="even:bg-gray-50">
                  {row.map((cell, k) => (
                    <td key={k} className="border border-border-dark px-3 py-1.5">{renderInline(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }
    else if (line.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={`code-${i}`} className="bg-gray-50 border border-border-dark rounded-[8px] p-3 text-xs overflow-x-auto my-2 font-mono text-gray-800">
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
    }
    else if (/^[-*] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items.push(lines[i].replace(/^[-*] /, ""));
        i++;
      }
      const textItems = items.filter(item => !/^!\[/.test(item.trim()));
      const imageItems = items.filter(item => /^!\[/.test(item.trim()));
      if (textItems.length > 0) {
        elements.push(
          <ul key={`ul-${i}`} className="list-disc list-inside my-1 space-y-0.5 text-sm text-gray-800">
            {textItems.map((item, j) => <li key={j}>{renderLineWithImages(item)}</li>)}
          </ul>
        );
      }
      imageItems.forEach((item, j) => {
        elements.push(<div key={`ulimg-${i}-${j}`} className="mt-1">{renderLineWithImages(item)}</div>);
      });
      continue;
    }
    else if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ""));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="list-decimal list-inside my-1 space-y-0.5 text-sm text-gray-800">
          {items.map((item, j) => <li key={j}>{renderLineWithImages(item)}</li>)}
        </ol>
      );
      continue;
    }
    else if (/^### /.test(line)) {
      elements.push(<p key={`h3-${i}`} className="font-semibold text-sm text-gray-900 mt-2 mb-0.5">{renderInline(line.slice(4))}</p>);
    }
    else if (/^## /.test(line)) {
      elements.push(<p key={`h2-${i}`} className="font-semibold text-sm text-gray-900 mt-2 mb-0.5">{renderInline(line.slice(3))}</p>);
    }
    else if (/^# /.test(line)) {
      elements.push(<p key={`h1-${i}`} className="font-semibold text-base text-gray-900 mt-2 mb-0.5">{renderInline(line.slice(2))}</p>);
    }
    else if (line.trim() === "") {
      elements.push(<div key={`gap-${i}`} className="h-1.5" />);
    }
    else {
      elements.push(<p key={`p-${i}`} className="text-sm text-gray-800 leading-relaxed">{renderLineWithImages(line)}</p>);
    }

    i++;
  }

  return <div className="space-y-0.5">{elements}</div>;
}

// ─── Loading dots ─────────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1 h-5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function AIChatPage() {
  const currentUser = useAuthStore((s) => s.currentUser);

  // All hooks must be declared before any early return
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatboxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 0 || loading) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  // Close dropdown when clicking outside the chatbox
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (chatboxRef.current && !chatboxRef.current.contains(e.target as Node)) {
        setOpenCategoryId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [input]);

  const role = currentUser?.rawRole ?? currentUser?.role?.toLowerCase();
  if (!currentUser || (role !== "administrator" && role !== "moderator")) {
    return <Navigate to="/" replace />;
  }

  const sendText = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage: Message = { role: "user", content: text.trim() };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    const history: HistoryEntry[] = messages.map((m) => ({
      role: m.role,
      parts: m.content,
    }));

    try {
      const { data } = await axios.post<{ reply: string }>(
        `${config.API_BASE_URL}/ai/chat`,
        { message: text.trim(), history }
      );
      setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const errMsg = axiosErr?.response?.data?.message ?? "Something went wrong. Please try again.";
      setMessages([...nextMessages, { role: "assistant", content: errMsg }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendText(input);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full bg-white">

      {/* ── Chat messages + header (scrollable) ── */}
      <div className="flex-1 overflow-y-auto min-h-0 px-6 pb-32 mb-6 [scrollbar-gutter:stable]">
        <div className="w-full max-w-4xl mx-auto">
          <div className="space-y-1 py-5">
            <h1 className="text-lg font-semibold text-gray-900">AI Assistant</h1>
            <p className="text-sm text-gray-500">Ask anything about attendance, events, students and fines</p>
          </div>
          <div className="space-y-6">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "user" ? (
                <div className="max-w-[78%] px-4 py-3 text-sm leading-relaxed bg-gray-100 text-black rounded-[10px] rounded-br-[3px]">
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              ) : (
                <div className="max-w-[85%] text-sm text-gray-800">
                  <MarkdownContent text={msg.content} />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <TypingDots />
            </div>
          )}

          <div ref={bottomRef} />
          </div>
        </div>
      </div>

      {/* ── Input bar — fixed to bottom of viewport ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-transparent border-border-dark pb-6 pl-2 pr-4 z-20">
        {/* Single bordered container wrapping textarea + bottom row */}
        <div
          ref={chatboxRef}
          className="relative w-full max-w-[920px] mx-auto border border-border-dark rounded-[8px] bg-white focus-within:border-border-focus focus-within:ring-2 focus-within:ring-zinc-200 transition-all px-3 pt-3 pb-2 cursor-text"
          onClick={() => inputRef.current?.focus()}
        >
          {/* Dropdown — full chatbox width, opens upward */}
          <div
            className={`absolute z-50 px-2 bottom-full left-0 right-0 mb-1.5 bg-white border border-border-dark rounded-[8px] shadow-sm overflow-hidden
              transition-[opacity,transform] duration-150 ease-out origin-bottom
              ${openCategoryId ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-1 pointer-events-none"}`}
          >
            {CATEGORIES.find(c => c.id === openCategoryId)?.prompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setOpenCategoryId(null);
                  setInput(prompt);
                  setTimeout(() => {
                    const el = inputRef.current;
                    if (!el) return;
                    el.focus();
                    const idx = prompt.indexOf("____");
                    if (idx !== -1) el.setSelectionRange(idx, idx + 4);
                  }, 0);
                }}
                className="w-full text-left p-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b border-border-dark last:border-b-0 cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Textarea */}
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question..."
            disabled={loading}
            className="w-full resize-none bg-transparent text-base md:text-sm text-gray-800 placeholder-gray-400 outline-none leading-relaxed disabled:opacity-50"
            style={{ maxHeight: "130px" }}
          />

          {/* Bottom row: suggestion buttons left, send button right */}
          <div className="flex items-center justify-between mt-2" onClick={(e) => e.stopPropagation()}>
            <SuggestionButtons onToggle={(id) => setOpenCategoryId(prev => prev === id ? null : id)} />
            <button
              onClick={() => sendText(input)}
              disabled={!input.trim() || loading}
              className="h-8 w-8 flex items-center justify-center rounded-[8px] bg-gray-800 text-white shrink-0 transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              aria-label="Send"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
