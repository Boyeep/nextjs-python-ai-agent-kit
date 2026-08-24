"use client";

import { ArrowUp, Bot, MessageSquarePlus, PanelLeft, Sparkles, User } from "lucide-react";
import { FormEvent, KeyboardEvent, useState } from "react";

type Message = { id: string; role: "user" | "assistant"; content: string };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";
const starters = ["Explain a difficult idea simply", "Draft a product launch plan", "Review an API design"];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendMessage(value = input) {
    const content = value.trim();
    if (!content || isStreaming) return;
    const userMessage: Message = { id: crypto.randomUUID(), role: "user", content };
    const assistantId = crypto.randomUUID();
    const history = [...messages, userMessage];
    setMessages([...history, { id: assistantId, role: "assistant", content: "" }]);
    setInput(""); setError(null); setIsStreaming(true);

    try {
      const response = await fetch(`${API_URL}/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.map(({ role, content: text }) => ({ role, content: text })) }),
      });
      if (!response.ok || !response.body) throw new Error("The chat API did not return a stream.");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        buffer += decoder.decode(chunk, { stream: true });
        const events = buffer.split("\n\n"); buffer = events.pop() ?? "";
        for (const event of events) {
          if (!event.startsWith("data: ")) continue;
          const payload = JSON.parse(event.slice(6)) as { token?: string; error?: string };
          if (payload.error) throw new Error(payload.error);
          if (payload.token) setMessages((current) => current.map((message) => message.id === assistantId ? { ...message, content: message.content + payload.token } : message));
        }
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to reach the chat API.");
      setMessages((current) => current.filter((message) => message.id !== assistantId));
    } finally { setIsStreaming(false); }
  }

  function submit(event: FormEvent) { event.preventDefault(); void sendMessage(); }
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); }
  }
  function newChat() { setMessages([]); setError(null); setInput(""); setIsSidebarOpen(false); }

  return <main className="flex h-dvh overflow-hidden bg-[#f3f2ed] text-[#16201d]">
    <aside className={`fixed inset-y-0 left-0 z-30 flex w-72 flex-col bg-[#19231f] p-4 text-white transition-transform duration-300 lg:static lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex items-center gap-3 px-2 py-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#d8f28c] text-[#19231f]"><Sparkles className="h-5 w-5" /></span><div><p className="font-semibold">Threadline</p><p className="text-xs text-white/45">AI workspace</p></div></div>
      <button className="mt-5 flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl bg-white/10 px-4 text-sm font-medium transition hover:bg-white/16" onClick={newChat}><MessageSquarePlus className="h-4 w-4" />New conversation</button>
      <div className="mt-8 px-3"><p className="text-[10px] uppercase tracking-[0.2em] text-white/35">Today</p>{messages.length > 0 ? <button className="mt-3 w-full truncate rounded-xl px-2 py-2 text-left text-sm text-white/65 hover:bg-white/8">{messages.find((message) => message.role === "user")?.content}</button> : <p className="mt-3 text-sm text-white/35">No conversations yet</p>}</div>
      <div className="mt-auto rounded-2xl bg-[#d8f28c] p-4 text-[#19231f]"><p className="text-xs font-semibold">Mock mode ready</p><p className="mt-1 text-xs leading-5 opacity-60">Connect any OpenAI-compatible model from the backend environment.</p></div>
    </aside>

    {isSidebarOpen ? <button aria-label="Close sidebar" className="fixed inset-0 z-20 bg-black/20 lg:hidden" onClick={() => setIsSidebarOpen(false)} /> : null}

    <section className="flex min-w-0 flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center justify-between px-4 md:px-7"><button aria-label="Open sidebar" className="grid h-11 w-11 cursor-pointer place-items-center rounded-full bg-white lg:hidden" onClick={() => setIsSidebarOpen(true)}><PanelLeft className="h-5 w-5" /></button><div className="hidden lg:block"><p className="text-sm font-semibold">New conversation</p><p className="text-xs text-black/40">AI Chatbot Template</p></div><span className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-medium shadow-sm"><span className="h-2 w-2 rounded-full bg-[#66ad72]" />Online</span></header>

      <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col px-4 md:px-8">
        <div className="min-h-0 flex-1 overflow-y-auto py-6">
          {messages.length === 0 ? <div className="flex h-full flex-col items-center justify-center text-center"><span className="grid h-16 w-16 place-items-center rounded-[1.6rem] bg-[#d8f28c]"><Bot className="h-7 w-7" /></span><h1 className="mt-6 text-4xl font-semibold tracking-[-0.055em] md:text-5xl">What are we making?</h1><p className="mt-3 max-w-md text-sm leading-6 text-black/50">Start with an idea, a question, or a rough draft. The backend streams every response as it arrives.</p><div className="mt-7 flex flex-wrap justify-center gap-2">{starters.map((starter) => <button className="cursor-pointer rounded-full bg-white px-4 py-2.5 text-xs font-medium shadow-sm transition hover:-translate-y-0.5 hover:bg-[#e9f4ca]" key={starter} onClick={() => void sendMessage(starter)}>{starter}</button>)}</div></div> : <div className="space-y-6">{messages.map((message) => <article className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`} key={message.id}>{message.role === "assistant" ? <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#d8f28c]"><Bot className="h-4 w-4" /></span> : null}<div className={`max-w-[80%] whitespace-pre-wrap rounded-[1.4rem] px-4 py-3 text-sm leading-6 ${message.role === "user" ? "bg-[#19231f] text-white" : "bg-white"}`}>{message.content || <span className="inline-flex gap-1"><i /><i /><i /></span>}</div>{message.role === "user" ? <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#e6ded3]"><User className="h-4 w-4" /></span> : null}</article>)}</div>}
        </div>

        <div className="shrink-0 pb-4 md:pb-6">{error ? <p className="mb-2 rounded-xl bg-[#f6d8cf] px-4 py-2 text-xs text-[#7d3222]" role="alert">{error}</p> : null}<form className="flex items-end gap-2 rounded-[1.75rem] bg-white p-2 shadow-[0_18px_60px_rgba(26,40,35,0.12)]" onSubmit={submit}><textarea aria-label="Message" className="max-h-32 min-h-12 flex-1 resize-none bg-transparent px-3 py-3 text-sm outline-none placeholder:text-black/30" onChange={(event) => setInput(event.target.value)} onKeyDown={handleKeyDown} placeholder="Message Threadline…" rows={1} value={input} /><button aria-label="Send message" className="grid h-12 w-12 shrink-0 cursor-pointer place-items-center rounded-full bg-[#19231f] text-white transition hover:bg-[#314039] disabled:cursor-not-allowed disabled:opacity-35" disabled={!input.trim() || isStreaming} type="submit"><ArrowUp className="h-5 w-5" /></button></form><p className="mt-2 text-center text-[10px] text-black/35">AI can make mistakes. Verify important information.</p></div>
      </div>
    </section>
  </main>;
}
