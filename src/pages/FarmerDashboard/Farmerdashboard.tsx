import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RiLeafFill, RiRobot2Fill } from "react-icons/ri";
import { BsPerson, BsPencilSquare } from "react-icons/bs";
import {
  MdOutlineLogout,
  MdSend,
  MdOutlineMenu,
  MdClose,
  MdSwapHoriz,
  MdDeleteOutline,
} from "react-icons/md";
import { GiWheat, GiWateringCan } from "react-icons/gi";
import { FaSeedling } from "react-icons/fa";
import { BsTruck } from "react-icons/bs";
import { authService } from "../../services/authService";
import { chatService } from '../../services/chatService';
import type { ChatSession as ServiceChatSession } from '../../services/chatService';
import styles from "./Farmerdashboard.module.css";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
  time: string;
}

interface ChatSession {
  id: string;
  title: string;
  preview: string;
  date: string;
  messages: Message[];
}

// ── API ───────────────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

async function fetchAIResponse(message: string): Promise<string> {
  const token = authService.getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${BASE_URL}/ai/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ message }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "AI request failed");
  return data.aiText as string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const user = authService.getUser() ?? { name: "Farmer", email: "" };
const initials = user.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase() ?? "F";
const firstName = user.name?.split(" ")[0] ?? "Farmer";

function newId() { return Math.random().toString(36).slice(2); }
function nowTime() {
  return new Date().toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function FarmerChat() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setSection] = useState<"chat" | "profile">("chat");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const SUGGESTIONS = [
    { icon: <GiWheat size={14} />, text: "Check my Maize crop" },
    { icon: <FaSeedling size={13} />, text: "Tomato harvest advice" },
    { icon: <GiWateringCan size={14} />, text: "When to water Cassava" },
    { icon: <BsTruck size={13} />, text: "Upcoming deliveries" },
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  useEffect(() => {
    loadSessions();
  }, []);

  // Load all chat sessions from database
  const loadSessions = async () => {
    try {
      setLoading(true);
      const { sessions: dbSessions } = await chatService.getSessions();
      
      const loadedSessions: ChatSession[] = dbSessions.map((s: ServiceChatSession) => ({
        id: s.id,
        title: s.title,
        preview: s.messages[0]?.content?.substring(0, 50) || 'New Chat',
        date: new Date(s.updatedAt).toLocaleDateString(),
        messages: s.messages.map((m: any) => ({
          id: m.id,
          role: m.role,
          text: m.content,
          time: new Date(m.createdAt).toLocaleTimeString()
        }))
      }));
      
      setSessions(loadedSessions);
      
      // Load the most recent session if exists
      if (loadedSessions.length > 0) {
        const mostRecent = loadedSessions[0];
        setActiveId(mostRecent.id);
        setCurrentSessionId(mostRecent.id);
        setMessages(mostRecent.messages);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Start a new chat
  const startNewChat = async () => {
    setActiveId(null);
    setCurrentSessionId(null);
    setMessages([]);
    setInput("");
    setSidebarOpen(false);
    setSection("chat");
  };

  // Load an existing session
  const loadSession = (s: ChatSession) => {
    setActiveId(s.id);
    setCurrentSessionId(s.id);
    setMessages(s.messages);
    setSidebarOpen(false);
    setSection("chat");
  };

  // Delete a session
  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this chat session?')) {
      try {
        await chatService.deleteSession(sessionId);
        await loadSessions(); // Refresh the list
        if (activeId === sessionId) {
          startNewChat();
        }
      } catch (error) {
        console.error('Failed to delete session:', error);
      }
    }
  };

  // Send message
  const send = async (text: string) => {
    if (!text.trim() || typing) return;

    const userMsg: Message = {
      id: newId(),
      role: "user",
      text: text.trim(),
      time: nowTime(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    try {
      // Create session if none exists
      let sessionId = currentSessionId;
      if (!sessionId) {
        const { session } = await chatService.createSession(text.slice(0, 40));
        sessionId = session.id;
        setCurrentSessionId(sessionId);
        setActiveId(sessionId);
      }
      
      // Save user message to database
      await chatService.saveMessage(sessionId, 'user', userMsg.text);
      
      // Get AI response
      const aiText = await fetchAIResponse(text.trim());
      
      const aiMsg: Message = {
        id: newId(),
        role: "ai",
        text: aiText,
        time: nowTime(),
      };
      
      // Save AI message to database
      await chatService.saveMessage(sessionId, 'ai', aiMsg.text);
      
      // Update UI
      setMessages((prev) => {
        const updated = [...prev, aiMsg];
        
        // Update or add session in the list
        setSessions((prevSessions) => {
          const existingIndex = prevSessions.findIndex(s => s.id === sessionId);
          if (existingIndex !== -1) {
            // Update existing session
            const updatedSessions = [...prevSessions];
            updatedSessions[existingIndex] = {
              ...updatedSessions[existingIndex],
              messages: updated,
              preview: text,
              date: 'Today'
            };
            // Move to top
            const [moved] = updatedSessions.splice(existingIndex, 1);
            return [moved, ...updatedSessions];
          } else {
            // Create new session
            const newSession: ChatSession = {
              id: sessionId!,
              title: text.length > 40 ? text.slice(0, 40) + "…" : text,
              preview: text,
              date: "Today",
              messages: updated,
            };
            return [newSession, ...prevSessions];
          }
        });
        
        return updated;
      });
    } catch (err: any) {
      const errMsg: Message = {
        id: newId(),
        role: "ai",
        text: err.message === "Not authenticated"
          ? "Your session has expired. Please log in again."
          : "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
        time: nowTime(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setTyping(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const isEmpty = messages.length === 0;

  if (loading) {
    return (
      <div className={styles.shell}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading your chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.sidebarLogo}>
          <div className={styles.logoMark}><RiLeafFill size={16} /></div>
          <span className={styles.logoText}>AgroFlow<span>+</span></span>
          <button className={styles.sidebarCloseBtn} onClick={() => setSidebarOpen(false)}>
            <MdClose size={18} />
          </button>
        </div>

        <button className={styles.newChatBtn} onClick={startNewChat}>
          <BsPencilSquare size={15} />
          <span>New Chat</span>
        </button>

        <div className={styles.historySection}>
          <div className={styles.historyLabel}>Recent Chats</div>
          <div className={styles.historyList}>
            {sessions.map((s) => (
              <div key={s.id} className={styles.historyItemWrapper}>
                <button
                  className={`${styles.historyItem} ${activeId === s.id ? styles.historyItemActive : ""}`}
                  onClick={() => loadSession(s)}
                >
                  <div className={styles.historyItemTitle}>{s.title}</div>
                  <div className={styles.historyItemMeta}>
                    <span className={styles.historyItemPreview}>{s.preview}</span>
                    <span className={styles.historyItemDate}>{s.date}</span>
                  </div>
                </button>
                <button
                  className={styles.deleteSessionBtn}
                  onClick={(e) => deleteSession(s.id, e)}
                  title="Delete chat"
                >
                  <MdDeleteOutline size={16} />
                </button>
              </div>
            ))}
            {sessions.length === 0 && (
              <div className={styles.noHistory}>
                <p>No chats yet</p>
                <p className={styles.noHistoryHint}>Start a new conversation above</p>
              </div>
            )}
          </div>
        </div>

        <div className={styles.sidebarBottom}>
          <div className={styles.switchBox}>
            <div className={styles.switchLbl}>Switch Role</div>
            <button className={styles.switchBtn} onClick={() => navigate("/buyer")}>
              <MdSwapHoriz size={14} /> Switch to Buyer / Seller
            </button>
          </div>

          <div className={styles.sidebarDivider} />

          <button
            className={`${styles.sidebarBottomBtn} ${activeSection === "profile" ? styles.sidebarBottomBtnActive : ""}`}
            onClick={() => { setSection("profile"); setSidebarOpen(false); }}
          >
            <div className={styles.sidebarBottomIcon}><BsPerson size={16} /></div>
            <span className={styles.sidebarBottomText}>Profile</span>
          </button>

          <button
            className={styles.sidebarBottomBtn}
            onClick={() => {
              authService.clearSession();
              navigate("/login");
            }}
          >
            <div className={`${styles.sidebarBottomIcon} ${styles.logoutIcon}`}>
              <MdOutlineLogout size={16} />
            </div>
            <span className={`${styles.sidebarBottomText} ${styles.logoutText}`}>Log Out</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className={styles.main}>
        <header className={styles.topbar}>
          <button className={styles.menuBtn} onClick={() => setSidebarOpen((p) => !p)}>
            <MdOutlineMenu size={20} />
          </button>
          <div className={styles.topbarCenter}>
            <RiRobot2Fill size={16} style={{ color: "#a8d832" }} />
            <span className={styles.topbarTitle}>AgroFlow AI</span>
          </div>
          <div className={styles.topbarAvatar}>{initials}</div>
        </header>

        {/* ── Profile ── */}
        {activeSection === "profile" && (
          <div className={styles.profileWrap}>
            <div className={styles.profileCard}>
              <div className={styles.profileAvatar}>{initials}</div>
              <div className={styles.profileName}>{user.name}</div>
              <div className={styles.profileBadge}>🌾 Farmer</div>
              <div className={styles.profileStats}>
                {[
                  { val: "4", label: "Crops" },
                  { val: "12", label: "Harvests" },
                  { val: "8", label: "Deliveries" },
                  { val: "98%", label: "On-Time" },
                ].map(({ val, label }) => (
                  <div key={label} className={styles.profileStat}>
                    <div className={styles.profileStatVal}>{val}</div>
                    <div className={styles.profileStatLabel}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.profileForm}>
              <div className={styles.profileFormTitle}>Edit Profile</div>
              <div className={styles.profileFields}>
                <div className={styles.fieldRow}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Full Name</label>
                    <input className={styles.fieldInput} defaultValue={user.name} />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Email</label>
                    <input className={styles.fieldInput} defaultValue={user.email} type="email" />
                  </div>
                </div>
                <div className={styles.fieldRow}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Phone</label>
                    <input className={styles.fieldInput} placeholder="+234 800 000 0000" />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Location</label>
                    <input className={styles.fieldInput} placeholder="e.g. Ibadan, Oyo" />
                  </div>
                </div>
                <div className={styles.fieldRow}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Farm Size</label>
                    <input className={styles.fieldInput} placeholder="e.g. 5 hectares" />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Soil Type</label>
                    <input className={styles.fieldInput} placeholder="e.g. Loamy" />
                  </div>
                </div>
                <button className={styles.saveBtn}>Save Changes</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Chat ── */}
        {activeSection === "chat" && (
          <>
            <div className={styles.chatArea}>
              {isEmpty && (
                <div className={styles.emptyState}>
                  <div className={styles.emptyOrb}>
                    <RiRobot2Fill size={36} style={{ color: "#2d6a35" }} />
                  </div>
                  <h2 className={styles.emptyTitle}>Good morning, {firstName} 👋</h2>
                  <p className={styles.emptySubtitle}>
                    I'm your AgroFlow AI assistant. Ask me anything about your
                    crops, harvest timing, soil health, weather, or deliveries.
                  </p>
                  <div className={styles.suggestions}>
                    {SUGGESTIONS.map(({ icon, text }) => (
                      <button key={text} className={styles.suggestionChip} onClick={() => send(text)}>
                        {icon}
                        <span>{text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!isEmpty && (
                <div className={styles.messages}>
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`${styles.msgRow} ${msg.role === "user" ? styles.msgRowUser : styles.msgRowAI}`}
                    >
                      {msg.role === "ai" && (
                        <div className={styles.msgAvatar}>
                          <RiRobot2Fill size={16} style={{ color: "#2d6a35" }} />
                        </div>
                      )}
                      <div className={`${styles.msgBubble} ${msg.role === "user" ? styles.msgBubbleUser : styles.msgBubbleAI}`}>
                        <div className={styles.msgText}>
                          {msg.text.split("\n").map((line, i, arr) => (
                            <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
                          ))}
                        </div>
                        <div className={styles.msgTime}>{msg.time}</div>
                      </div>
                      {msg.role === "user" && (
                        <div className={`${styles.msgAvatar} ${styles.msgAvatarUser}`}>
                          {initials}
                        </div>
                      )}
                    </div>
                  ))}

                  {typing && (
                    <div className={`${styles.msgRow} ${styles.msgRowAI}`}>
                      <div className={styles.msgAvatar}>
                        <RiRobot2Fill size={16} style={{ color: "#2d6a35" }} />
                      </div>
                      <div className={`${styles.msgBubble} ${styles.msgBubbleAI} ${styles.typingBubble}`}>
                        <div className={styles.typingDots}>
                          <span /><span /><span />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            <div className={styles.inputWrap}>
              {!isEmpty && (
                <div className={styles.suggestionsRow}>
                  {SUGGESTIONS.map(({ icon, text }) => (
                    <button key={text} className={styles.suggestionChipSm} onClick={() => send(text)}>
                      {icon}<span>{text}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className={styles.inputBox}>
                <textarea
                  ref={inputRef}
                  className={styles.inputField}
                  placeholder="Ask about your crops, harvest, soil, weather…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  rows={1}
                />
                <button
                  className={`${styles.sendBtn} ${input.trim() ? styles.sendBtnActive : ""}`}
                  onClick={() => send(input)}
                  disabled={!input.trim() || typing}
                >
                  <MdSend size={18} />
                </button>
              </div>
              <div className={styles.inputHint}>
                Press Enter to send · Shift+Enter for new line
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}