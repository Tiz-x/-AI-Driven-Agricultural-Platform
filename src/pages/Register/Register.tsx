import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RiLeafFill } from "react-icons/ri";
import { GiWheat, GiShoppingCart } from "react-icons/gi";
import { MdStorefront } from 'react-icons/md'
import {
  BsArrowRight,
  BsEye,
  BsEyeSlash,
  BsEnvelope,
  BsPhone,
  BsPerson,
  BsExclamationCircle,
} from "react-icons/bs";
import { authService, getContentImages } from "../../services/authService";
import type { RegisterPayload, UserRole } from "../../types/auth";
import styles from "../../styles/auth.module.css";

type Tab = "farmer" | "buyer" | "seller";

// ── Password strength helper ──────────────────────────────
function getPasswordStrength(pwd: string): {
  score: number;       // 0–4
  label: string;
  color: string;
} {
  let score = 0;
  if (pwd.length >= 6)                        score++;
  if (pwd.length >= 10)                       score++;
  if (/[0-9]/.test(pwd))                      score++;
  if (/[^A-Za-z0-9]/.test(pwd))              score++;

  const map = [
    { label: "Too weak",  color: "#e05252" },
    { label: "Weak",      color: "#e07c52" },
    { label: "Fair",      color: "#e0b452" },
    { label: "Good",      color: "#7db83a" },
    { label: "Strong",    color: "#2d6a35" },
  ];
  return { score, ...map[score] };
}

// ── Email domain validation ───────────────────────────────
function isValidEmail(email: string): boolean {
  // Must match: something@something.tld (tld at least 2 chars)
  return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email);
}

// ── Phone validation (Nigerian + international) ───────────
function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-().]/g, "");
  // Nigerian: 08012345678 / +2348012345678 / 2348012345678
  const nigerianLocal       = /^0[7-9][01]\d{8}$/.test(cleaned);
  const nigerianIntlPlus    = /^\+234[7-9][01]\d{8}$/.test(cleaned);
  const nigerianIntlNoPlus  = /^234[7-9][01]\d{8}$/.test(cleaned);
  // Generic international: + followed by 7–15 digits
  const genericIntl         = /^\+\d{7,15}$/.test(cleaned);
  return nigerianLocal || nigerianIntlPlus || nigerianIntlNoPlus || genericIntl;
}

export default function Register() {
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>("farmer");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sideImage, setSideImage] = useState(
    "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=900&q=90",
  );

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });

  useEffect(() => {
    getContentImages().then((imgs) => {
      if (imgs["register_side"]) setSideImage(imgs["register_side"]);
    });
  }, []);

  const set = (k: keyof typeof form, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  const validate = (): boolean => {
    const e: Record<string, string> = {};

    // Full name
    if (!form.fullName.trim()) {
      e.fullName = "Full name is required";
    } else if (form.fullName.trim().split(" ").length < 2) {
      e.fullName = "Enter your first and last name";
    }

    // Email
    if (!form.email.trim()) {
      e.email = "Email is required";
    } else if (!isValidEmail(form.email.trim())) {
      e.email = "Enter a valid email address (e.g. you@example.com)";
    }

    // Phone
    if (!form.phone.trim()) {
      e.phone = "Phone number is required";
    } else if (!isValidPhone(form.phone.trim())) {
      e.phone = "Enter a valid phone number (e.g. 08012345678 or +2348012345678)";
    }

    // Password
    const pwd = form.password;
    if (!pwd) {
      e.password = "Password is required";
    } else if (pwd.length < 6) {
      e.password = "Password must be at least 6 characters";
    } else if (!/[0-9]/.test(pwd)) {
      e.password = "Password must include at least one number";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const role = tab;

      const payload: RegisterPayload = {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role,
      };

      const res = await authService.register(payload);
      authService.saveSession(res);

      const userRole = res.user.role as UserRole;
      if (userRole === "farmer") navigate("/farmer/dashboard");
      else if (userRole === "buyer") navigate("/buyer/dashboard");
      else navigate("/seller/dashboard");
    } catch (err: unknown) {
      setApiError(
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const err = (k: string) =>
    errors[k] ? (
      <div className={styles.fieldErrMsg}>
        <BsExclamationCircle size={11} />
        {errors[k]}
      </div>
    ) : null;

  // Password strength meter
  const pwdStrength = form.password ? getPasswordStrength(form.password) : null;

  return (
    <div className={styles.shell}>
      {/* ── LEFT ── */}
      <div className={styles.left}>
        <div
          className={styles.leftBg}
          style={{ backgroundImage: `url('${sideImage}')` }}
        />
        <div className={styles.leftOverlay} />

        <div className={styles.leftLogo}>
          <div className={styles.leftLogoMark}>
            <RiLeafFill size={17} />
          </div>
          <span className={styles.leftLogoText}>
            AgroFlow<span>+</span>
          </span>
        </div>

        <div className={styles.leftCaption}>
          <div className={styles.leftCaptionTag}>
            <div className={styles.leftCaptionDot} />
            <span className={styles.leftCaptionTagText}>Join the Movement</span>
          </div>
          <div className={styles.leftCaptionTitle}>
            Grow Smarter.
            <br />
            <em>Earn More.</em>
          </div>
          <div className={styles.leftCaptionSub}>
            Connect with buyers, schedule harvests, and let AI handle the rest
            of your supply chain.
          </div>
        </div>
      </div>

      {/* ── RIGHT ── */}
      <div className={styles.right}>
        <div className={styles.rightTopBar}>
          <div className={styles.mobileLogo}>
            <div className={styles.mobileLogoMark}>
              <RiLeafFill size={15} />
            </div>
            <span className={styles.mobileLogoText}>
              AgroFlow<span>+</span>
            </span>
          </div>
          <div className={styles.topBarRight}>
            <span className={styles.topBarText}>Already have an account?</span>
            <button
              className={styles.topBarBtn}
              onClick={() => navigate("/login")}
            >
              Sign In
            </button>
          </div>
        </div>

        <div className={styles.formWrap}>
          <h1 className={styles.formTitle}>Create Account</h1>
          <p className={styles.formSubtitle}>Choose your role to get started</p>

          {/* Role tabs */}
          <div className={styles.roleTabs}>
            <button
              type="button"
              className={`${styles.roleTab} ${tab === "farmer" ? styles.roleTabActive : ""}`}
              onClick={() => { setTab("farmer"); setErrors({}); }}
            >
              <span className={styles.roleTabIcon}><GiWheat size={17} /></span>
              Farmer
            </button>
            <button
              type="button"
              className={`${styles.roleTab} ${tab === "buyer" ? styles.roleTabActive : ""}`}
              onClick={() => { setTab("buyer"); setErrors({}); }}
            >
              <span className={styles.roleTabIcon}><GiShoppingCart size={17} /></span>
              Buyer
            </button>
            <button
              type="button"
              className={`${styles.roleTab} ${tab === "seller" ? styles.roleTabActive : ""}`}
              onClick={() => { setTab("seller"); setErrors({}); }}
            >
              <span className={styles.roleTabIcon}><MdStorefront size={17} /></span>
              Seller
            </button>
          </div>

          {apiError && (
            <div className={styles.errorBanner}>
              <BsExclamationCircle size={15} color="#e05252" />
              <span className={styles.errorBannerText}>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className={styles.fields}>

              {/* Full Name */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Full Name</label>
                <div className={styles.fieldInputWrap}>
                  <span className={styles.fieldInputIcon}><BsPerson size={15} /></span>
                  <input
                    className={`${styles.fieldInput} ${errors["fullName"] ? styles.fieldError : ""}`}
                    type="text"
                    placeholder="e.g. Adewale Okafor"
                    value={form.fullName}
                    onChange={(e) => set("fullName", e.target.value)}
                    autoComplete="name"
                  />
                </div>
                {err("fullName")}
              </div>

              {/* Email */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Email Address</label>
                <div className={styles.fieldInputWrap}>
                  <span className={styles.fieldInputIcon}><BsEnvelope size={14} /></span>
                  <input
                    className={`${styles.fieldInput} ${errors["email"] ? styles.fieldError : ""}`}
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    autoComplete="email"
                  />
                </div>
                {err("email")}
              </div>

              {/* Phone */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Phone Number</label>
                <div className={styles.fieldInputWrap}>
                  <span className={styles.fieldInputIcon}><BsPhone size={14} /></span>
                  <input
                    className={`${styles.fieldInput} ${errors["phone"] ? styles.fieldError : ""}`}
                    type="tel"
                    placeholder="+234 800 000 0000"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    autoComplete="tel"
                  />
                </div>
                {err("phone")}
              </div>

              {/* Password */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Password</label>
                <div className={styles.fieldInputWrap}>
                  <span className={styles.fieldInputIcon}><BsPerson size={14} /></span>
                  <input
                    className={`${styles.fieldInput} ${errors["password"] ? styles.fieldError : ""}`}
                    type={showPwd ? "text" : "password"}
                    placeholder="Min 8 chars, uppercase, number, symbol"
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className={styles.fieldPasswordToggle}
                    onClick={() => setShowPwd((p) => !p)}
                    tabIndex={-1}
                  >
                    {showPwd ? <BsEyeSlash size={15} /> : <BsEye size={15} />}
                  </button>
                </div>

                {/* Password strength meter */}
                {pwdStrength && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{
                      display: "flex", gap: 4, marginBottom: 4
                    }}>
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          style={{
                            flex: 1,
                            height: 4,
                            borderRadius: 99,
                            background: i < pwdStrength.score
                              ? pwdStrength.color
                              : "#e0e0e0",
                            transition: "background 0.3s",
                          }}
                        />
                      ))}
                    </div>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: pwdStrength.color,
                    }}>
                      {pwdStrength.label}
                    </span>
                    {/* Requirements checklist */}
                    <div style={{
                      marginTop: 6,
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }}>
                      {[
                        { label: "At least 6 characters",        pass: form.password.length >= 6 },
                        { label: "At least one number (0–9)",    pass: /[0-9]/.test(form.password) },
                      ].map((req) => (
                        <span
                          key={req.label}
                          style={{
                            fontSize: 11,
                            color: req.pass ? "#2d6a35" : "#999",
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                          }}
                        >
                          <span>{req.pass ? "✓" : "○"}</span>
                          {req.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {err("password")}
              </div>

              {/* Submit */}
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={loading}
              >
                {loading ? (
                  <><div className={styles.spinner} /> Creating account...</>
                ) : (
                  <>
                    Create Account
                    <div className={styles.submitBtnCircle}>
                      <BsArrowRight size={13} />
                    </div>
                  </>
                )}
              </button>
            </div>
          </form>

          <p className={styles.termsText}>
            By creating an account you agree to our{" "}
            <span className={styles.termsLink}>Terms of Service</span> and{" "}
            <span className={styles.termsLink}>Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
}