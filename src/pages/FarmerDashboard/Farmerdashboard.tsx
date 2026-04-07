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
} from "react-icons/md";
import { GiWheat, GiWateringCan } from "react-icons/gi";
import { FaSeedling } from "react-icons/fa";
import { BsTruck } from "react-icons/bs";
// import { authService } from '../../services/authService'
import styles from "./Farmerdashboard.module.css";

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

const AI_RESPONSES: Record<string, string> = {
  default:
    "I'm here to help with your farming questions! Ask me about crop selection, planting schedules, soil health, harvest timing, pest control, or anything else about your farm.",
  maize:
    "🌽 Maize Update — Oyo Farm\n\nYour maize is currently at 72% growth. Based on current soil moisture and weather patterns:\n\n• Expected harvest: April 8 — 10 days away\n• Estimated yield: 420–460 kg\n• Action needed: Reduce irrigation by 30% in the final week to improve grain quality\n• Tip: Monitor for fall armyworm — humidity levels this week are favorable for infestation",
  tomato:
    "🍅 Tomato Status — Lagos Farm\n\nYour tomatoes are 90% mature and ready for harvest soon!\n\n• Harvest window: Next 5–7 days for peak freshness\n• Buyer matched: Emeka Foods Ltd wants 200kg\n• Delivery scheduled: April 16\n• Storage tip: Harvest in the early morning to reduce field heat and extend shelf life",
  cassava:
    "🥔 Cassava — Ibadan Farm\n\nYour cassava is at 40% growth and on a healthy track.\n\n• Estimated harvest: August 2026 (18 months from planting)\n• Next action: Irrigation is due — last watered 5 days ago\n• Soil check: Nitrogen levels are adequate. No fertilizer needed this week\n• Watch out: Check for cassava mosaic disease — inspect leaves for yellowing patterns",
  pepper:
    "🌶️ Pepper — Kaduna Farm\n\nYour pepper is in early planning stage at 15% growth.\n\n• Planting date: April 25 as scheduled\n• Soil readiness: Loamy soil confirmed — good drainage for pepper\n• Fertilizer plan: Apply NPK 15-15-15 at planting time\n• Water needs: Pepper needs consistent moisture — set up drip irrigation if possible",
  weather:
    "🌦️ Weather Advisory\n\nCurrent forecast for your farm locations:\n\n• Oyo (Maize): Sunny, 28°C — Ideal for final grain filling\n• Lagos (Tomato): Partly cloudy, 30°C — Good harvest conditions\n• Ibadan (Cassava): Heavy rain expected this weekend — protect from waterlogging\n• Kaduna (Pepper): Dry and warm — irrigation will be critical post-planting",
  harvest:
    "🌾 Harvest Schedule\n\nHere's your upcoming harvest calendar:\n\n• Apr 8 — Maize harvest, Oyo Farm (450kg estimated)\n• Apr 16 — Tomato delivery to Emeka Foods Ltd\n• Apr 21 — Cassava growth inspection\n• Apr 25 — Pepper planting, Kaduna\n\nWould you like me to notify your matched buyers or adjust any of these dates?",
  soil: "🪨 Soil Health Report\n\nBased on your registered farm data:\n\n• Oyo (Loamy): Excellent — high water retention, good for maize\n• Lagos (Sandy): Good — fast drainage suits tomatoes well\n• Ibadan (Clay): Moderate — prone to waterlogging, monitor after heavy rain\n• Kaduna (Loamy): Excellent — ideal for pepper cultivation\n\nRecommendation: Add organic compost to the Ibadan clay soil to improve aeration.",
};

function getAIResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("maize") || lower.includes("corn"))
    return AI_RESPONSES.maize;
  if (lower.includes("tomato")) return AI_RESPONSES.tomato;
  if (lower.includes("cassava")) return AI_RESPONSES.cassava;
  if (lower.includes("pepper")) return AI_RESPONSES.pepper;
  if (lower.includes("weather") || lower.includes("rain"))
    return AI_RESPONSES.weather;
  if (lower.includes("harvest")) return AI_RESPONSES.harvest;
  if (lower.includes("soil")) return AI_RESPONSES.soil;
  return AI_RESPONSES.default;
}

const DUMMY_HISTORY: ChatSession[] = [
  {
    id: "h1",
    title: "Maize harvest timing",
    preview: "When should I harvest my maize?",
    date: "Today",
    messages: [
      {
        id: "m1",
        role: "user",
        text: "When should I harvest my maize?",
        time: "9:10 AM",
      },
      { id: "m2", role: "ai", text: AI_RESPONSES.maize, time: "9:10 AM" },
    ],
  },
  {
    id: "h2",
    title: "Cassava irrigation",
    preview: "How often should I water cassava?",
    date: "Yesterday",
    messages: [
      {
        id: "m1",
        role: "user",
        text: "How often should I water cassava?",
        time: "3:22 PM",
      },
      { id: "m2", role: "ai", text: AI_RESPONSES.cassava, time: "3:22 PM" },
    ],
  },
  {
    id: "h3",
    title: "Soil health check",
    preview: "What is the state of my soil?",
    date: "Apr 3",
    messages: [
      {
        id: "m1",
        role: "user",
        text: "What is the state of my soil?",
        time: "11:05 AM",
      },
      { id: "m2", role: "ai", text: AI_RESPONSES.soil, time: "11:05 AM" },
    ],
  },
  {
    id: "h4",
    title: "Pepper planting plan",
    preview: "Help me plan my pepper planting",
    date: "Apr 1",
    messages: [
      {
        id: "m1",
        role: "user",
        text: "Help me plan my pepper planting",
        time: "2:48 PM",
      },
      { id: "m2", role: "ai", text: AI_RESPONSES.pepper, time: "2:48 PM" },
    ],
  },
];

const SUGGESTIONS = [
  { icon: <GiWheat size={14} />, text: "Check my Maize crop" },
  { icon: <FaSeedling size={13} />, text: "Tomato harvest advice" },
  { icon: <GiWateringCan size={14} />, text: "When to water Cassava" },
  { icon: <BsTruck size={13} />, text: "Upcoming deliveries" },
];

const user = JSON.parse(
  localStorage.getItem("agf_user") ||
    '{"name":"Adewale Okafor","email":"adewale@farm.ng"}',
);
const initials =
  user.name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase() ?? "AO";
const firstName = user.name?.split(" ")[0] ?? "Farmer";

function newId() {
  return Math.random().toString(36).slice(2);
}
function nowTime() {
  return new Date().toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function FarmerChat() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ChatSession[]>(DUMMY_HISTORY);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setSection] = useState<"chat" | "profile">("chat");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const startNewChat = () => {
    setActiveId(null);
    setMessages([]);
    setInput("");
    setSidebarOpen(false);
    setSection("chat");
  };
  const loadSession = (s: ChatSession) => {
    setActiveId(s.id);
    setMessages(s.messages);
    setSidebarOpen(false);
    setSection("chat");
  };

  const send = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = {
      id: newId(),
      role: "user",
      text: text.trim(),
      time: nowTime(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);
    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 600));
    const aiMsg: Message = {
      id: newId(),
      role: "ai",
      text: getAIResponse(text),
      time: nowTime(),
    };
    setMessages((prev) => {
      const updated = [...prev, aiMsg];
      if (activeId) {
        setSessions((s) =>
          s.map((sess) =>
            sess.id === activeId
              ? { ...sess, messages: updated, preview: text }
              : sess,
          ),
        );
      } else {
        const ns: ChatSession = {
          id: newId(),
          title: text.length > 40 ? text.slice(0, 40) + "…" : text,
          preview: text,
          date: "Today",
          messages: updated,
        };
        setSessions((s) => [ns, ...s]);
        setActiveId(ns.id);
      }
      return updated;
    });
    setTyping(false);
    inputRef.current?.focus();
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className={styles.shell}>
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}
      >
        <div className={styles.sidebarLogo}>
          <div className={styles.logoMark}>
            <RiLeafFill size={16} />
          </div>
          <span className={styles.logoText}>
            AgroFlow<span>+</span>
          </span>
          <button
            className={styles.sidebarCloseBtn}
            onClick={() => setSidebarOpen(false)}
          >
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
              <button
                key={s.id}
                className={`${styles.historyItem} ${activeId === s.id ? styles.historyItemActive : ""}`}
                onClick={() => loadSession(s)}
              >
                <div className={styles.historyItemTitle}>{s.title}</div>
                <div className={styles.historyItemMeta}>
                  <span className={styles.historyItemPreview}>{s.preview}</span>
                  <span className={styles.historyItemDate}>{s.date}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.sidebarBottom}>
          {/* Switch Role */}
          <div className={styles.switchBox}>
            <div className={styles.switchLbl}>Switch Role</div>
            <button
              className={styles.switchBtn}
              onClick={() => navigate("/buyer")}
            >
              <MdSwapHoriz size={14} /> Switch to Buyer / Seller
            </button>
          </div>

          <div className={styles.sidebarDivider} />

          <button
            className={`${styles.sidebarBottomBtn} ${activeSection === "profile" ? styles.sidebarBottomBtnActive : ""}`}
            onClick={() => {
              setSection("profile");
              setSidebarOpen(false);
            }}
          >
            <div className={styles.sidebarBottomIcon}>
              <BsPerson size={16} />
            </div>
            <span className={styles.sidebarBottomText}>Profile</span>
          </button>

          <button
            className={styles.sidebarBottomBtn}
            onClick={() => {
              localStorage.removeItem("agf_user");
              navigate("/login");
            }}
          >
            <div className={`${styles.sidebarBottomIcon} ${styles.logoutIcon}`}>
              <MdOutlineLogout size={16} />
            </div>
            <span
              className={`${styles.sidebarBottomText} ${styles.logoutText}`}
            >
              Log Out
            </span>
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className={styles.main}>
        <header className={styles.topbar}>
          <button
            className={styles.menuBtn}
            onClick={() => setSidebarOpen((p) => !p)}
          >
            <MdOutlineMenu size={20} />
          </button>
          <div className={styles.topbarCenter}>
            <RiRobot2Fill size={16} style={{ color: "#a8d832" }} />
            <span className={styles.topbarTitle}>AgroFlow AI</span>
          </div>
          <div className={styles.topbarAvatar}>{initials}</div>
        </header>

        {/* Profile */}
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
                    <input
                      className={styles.fieldInput}
                      defaultValue={user.name}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Email</label>
                    <input
                      className={styles.fieldInput}
                      defaultValue={user.email}
                      type="email"
                    />
                  </div>
                </div>
                <div className={styles.fieldRow}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Phone</label>
                    <input
                      className={styles.fieldInput}
                      placeholder="+234 800 000 0000"
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Location</label>
                    <input
                      className={styles.fieldInput}
                      placeholder="e.g. Ibadan, Oyo"
                    />
                  </div>
                </div>
                <div className={styles.fieldRow}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Farm Size</label>
                    <input
                      className={styles.fieldInput}
                      placeholder="e.g. 5 hectares"
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Soil Type</label>
                    <input
                      className={styles.fieldInput}
                      placeholder="e.g. Loamy"
                    />
                  </div>
                </div>
                <button className={styles.saveBtn}>Save Changes</button>
              </div>
            </div>
          </div>
        )}

        {/* Chat */}
        {activeSection === "chat" && (
          <>
            <div className={styles.chatArea}>
              {isEmpty && (
                <div className={styles.emptyState}>
                  <div className={styles.emptyOrb}>
                    <RiRobot2Fill size={36} style={{ color: "#2d6a35" }} />
                  </div>
                  <h2 className={styles.emptyTitle}>
                    Good morning, {firstName} 👋
                  </h2>
                  <p className={styles.emptySubtitle}>
                    I'm your AgroFlow AI assistant. Ask me anything about your
                    crops, harvest timing, soil health, weather, or deliveries.
                  </p>
                  <div className={styles.suggestions}>
                    {SUGGESTIONS.map(({ icon, text }) => (
                      <button
                        key={text}
                        className={styles.suggestionChip}
                        onClick={() => send(text)}
                      >
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
                          <RiRobot2Fill
                            size={16}
                            style={{ color: "#2d6a35" }}
                          />
                        </div>
                      )}
                      <div
                        className={`${styles.msgBubble} ${msg.role === "user" ? styles.msgBubbleUser : styles.msgBubbleAI}`}
                      >
                        <div className={styles.msgText}>
                          {msg.text.split("\n").map((line, i, arr) => (
                            <span key={i}>
                              {line}
                              {i < arr.length - 1 && <br />}
                            </span>
                          ))}
                        </div>
                        <div className={styles.msgTime}>{msg.time}</div>
                      </div>
                      {msg.role === "user" && (
                        <div
                          className={`${styles.msgAvatar} ${styles.msgAvatarUser}`}
                        >
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
                      <div
                        className={`${styles.msgBubble} ${styles.msgBubbleAI} ${styles.typingBubble}`}
                      >
                        <div className={styles.typingDots}>
                          <span />
                          <span />
                          <span />
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
                    <button
                      key={text}
                      className={styles.suggestionChipSm}
                      onClick={() => send(text)}
                    >
                      {icon}
                      <span>{text}</span>
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
