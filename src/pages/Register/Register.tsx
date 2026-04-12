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
    if (!form.fullName.trim()) e.fullName = "Full name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    if (form.password.length < 6)
      e.password = "Password must be at least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const role = tab; // 'farmer', 'buyer', or 'seller' directly

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

          {/* Role tabs — now three separate options */}
          <div className={styles.roleTabs}>
            <button
              type="button"
              className={`${styles.roleTab} ${tab === "farmer" ? styles.roleTabActive : ""}`}
              onClick={() => {
                setTab("farmer");
                setErrors({});
              }}
            >
              <span className={styles.roleTabIcon}>
                <GiWheat size={17} />
              </span>
              Farmer
            </button>
            <button
              type="button"
              className={`${styles.roleTab} ${tab === "buyer" ? styles.roleTabActive : ""}`}
              onClick={() => {
                setTab("buyer");
                setErrors({});
              }}
            >
              <span className={styles.roleTabIcon}>
                <GiShoppingCart size={17} />
              </span>
              Buyer
            </button>
            <button
              type="button"
              className={`${styles.roleTab} ${tab === "seller" ? styles.roleTabActive : ""}`}
              onClick={() => {
                setTab("seller");
                setErrors({});
              }}
            >
              <span className={styles.roleTabIcon}><MdStorefront size={17} />
              </span>
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
                  <span className={styles.fieldInputIcon}>
                    <BsPerson size={15} />
                  </span>
                  <input
                    className={`${styles.fieldInput} ${errors["fullName"] ? styles.fieldError : ""}`}
                    type="text"
                    placeholder="e.g. Adewale Okafor"
                    value={form.fullName}
                    onChange={(e) => set("fullName", e.target.value)}
                  />
                </div>
                {err("fullName")}
              </div>

              {/* Email */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Email Address</label>
                <div className={styles.fieldInputWrap}>
                  <span className={styles.fieldInputIcon}>
                    <BsEnvelope size={14} />
                  </span>
                  <input
                    className={`${styles.fieldInput} ${errors["email"] ? styles.fieldError : ""}`}
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                  />
                </div>
                {err("email")}
              </div>

              {/* Phone */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Phone Number</label>
                <div className={styles.fieldInputWrap}>
                  <span className={styles.fieldInputIcon}>
                    <BsPhone size={14} />
                  </span>
                  <input
                    className={`${styles.fieldInput} ${errors["phone"] ? styles.fieldError : ""}`}
                    type="tel"
                    placeholder="+234 800 000 0000"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                  />
                </div>
                {err("phone")}
              </div>

              {/* Password */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Password</label>
                <div className={styles.fieldInputWrap}>
                  <span className={styles.fieldInputIcon}>
                    <BsPerson size={14} />
                  </span>
                  <input
                    className={`${styles.fieldInput} ${errors["password"] ? styles.fieldError : ""}`}
                    type={showPwd ? "text" : "password"}
                    placeholder="Minimum 6 characters"
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
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
                {err("password")}
              </div>

              {/* Submit */}
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className={styles.spinner} /> Creating account...
                  </>
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
