import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RiLeafFill } from 'react-icons/ri'
import { GiWheat, GiShoppingCart } from 'react-icons/gi'
import {
  BsArrowRight, BsEye, BsEyeSlash,
  BsEnvelope, BsPhone, BsPerson, BsGeoAlt,
  BsExclamationCircle,
} from 'react-icons/bs'
import { authService } from '../../services/authService'
import type { RegisterPayload, UserRole } from '../../types/auth'
import styles from '../../styles/auth.module.css'

// ── Crop options ──────────────────────────────────────
const CROP_OPTIONS = [
  'Maize', 'Pepper', 'Tomato', 'Cassava', ]
const SOIL_OPTIONS = ['Loamy', 'Sandy', 'Clay', 'Silty', 'Peaty', 'Chalky']

type Tab    = 'farmer' | 'buyer-seller'
type Intent = 'buy' | 'sell'

export default function Register() {
  const navigate = useNavigate()

  // ── UI state ──
  const [tab, setTab]         = useState<Tab>('farmer')
  const [intent, setIntent]   = useState<Intent>('buy')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  // ── Farmer form ──
  const [farmer, setFarmer] = useState({
    fullName: '', email: '', phone: '', password: '',
    cropTypes: [] as string[], soilType: '', location: '', farmSize: '',
  })

  // ── Buyer/Seller form ──
  const [bs, setBs] = useState({
    fullName: '', email: '', phone: '', password: '',
    cropTypes: [] as string[], location: '', quantity: '',
  })

  // ── Field errors ──
  const [errors, setErrors] = useState<Record<string, string>>({})

  // ── Helpers ──
  const setF = (k: keyof typeof farmer, v: string) =>
    setFarmer(p => ({ ...p, [k]: v }))
  const setB = (k: keyof typeof bs, v: string) =>
    setBs(p => ({ ...p, [k]: v }))

  const toggleCrop = (list: string[], crop: string) =>
    list.includes(crop) ? list.filter(c => c !== crop) : [...list, crop]

  // ── Validation ──
  const validate = (): boolean => {
    const e: Record<string, string> = {}
    const src = tab === 'farmer' ? farmer : bs

    if (!src.fullName.trim())    e.fullName = 'Full name is required'
    if (!src.email.trim())       e.email    = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(src.email)) e.email = 'Enter a valid email'
    if (!src.phone.trim())       e.phone    = 'Phone number is required'
    if (src.password.length < 6) e.password = 'Password must be at least 6 characters'
    if (!src.location.trim())    e.location = 'Location is required'
    if (src.cropTypes.length === 0) e.cropTypes = 'Select at least one crop'

    if (tab === 'farmer') {
      if (!farmer.soilType)   e.soilType  = 'Select a soil type'
      if (!farmer.farmSize.trim()) e.farmSize = 'Farm size is required'
    } else {
      if (!bs.quantity.trim()) e.quantity = 'Quantity is required'
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setApiError('')
    if (!validate()) return

    setLoading(true)
    try {
      let payload: RegisterPayload
      if (tab === 'farmer') {
        payload = { ...farmer, role: 'farmer' }
      } else {
        payload = { ...bs, role: intent === 'buy' ? 'buyer' : 'seller', intent }
      }

      const res = await authService.register(payload)
      authService.saveSession(res)

      // Redirect based on role
      const role: UserRole = res.user.role
      if (role === 'farmer')                navigate('/farmer/dashboard')
      else if (role === 'buyer')            navigate('/buyer/dashboard')
      else                                  navigate('/seller/dashboard')

    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const err = (k: string) => errors[k]
    ? <div className={styles.fieldErrMsg}><BsExclamationCircle size={11}/>{errors[k]}</div>
    : null

  return (
    <div className={styles.shell}>

      {/* ── LEFT — farm photo ── */}
      <div className={styles.left}>
        <div
          className={styles.leftBg}
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=900&q=90')` }}
        />
        <div className={styles.leftOverlay} />

        <div className={styles.leftLogo}>
          <div className={styles.leftLogoMark}><RiLeafFill size={17} /></div>
          <span className={styles.leftLogoText}>AgroFlow<span>+</span></span>
        </div>

        <div className={styles.leftCaption}>
          <div className={styles.leftCaptionTag}>
            <div className={styles.leftCaptionDot} />
            <span className={styles.leftCaptionTagText}>Join the Movement</span>
          </div>
          <div className={styles.leftCaptionTitle}>
            Grow Smarter.<br /><em>Earn More.</em>
          </div>
          <div className={styles.leftCaptionSub}>
            Connect with buyers, schedule harvests, and let AI
            handle the rest of your supply chain.
          </div>
        </div>
      </div>

      {/* ── RIGHT — form ── */}
      <div className={styles.right}>
        <div className={styles.rightTopBar}>
          {/* Mobile logo */}
          <div className={styles.mobileLogo}>
            <div className={styles.mobileLogoMark}><RiLeafFill size={15} /></div>
            <span className={styles.mobileLogoText}>AgroFlow<span>+</span></span>
          </div>
          <span className={styles.topBarText}>Already have an account?</span>
          <button className={styles.topBarBtn} onClick={() => navigate('/login')}>
            Sign In
          </button>
        </div>

        <div className={styles.formWrap}>
          <h1 className={styles.formTitle}>Create Account</h1>
          <p className={styles.formSubtitle}>Choose your role to get started</p>

          {/* Role tabs */}
          <div className={styles.roleTabs}>
            <button
              type="button"
              className={`${styles.roleTab} ${tab === 'farmer' ? styles.roleTabActive : ''}`}
              onClick={() => { setTab('farmer'); setErrors({}) }}
            >
              <span className={styles.roleTabIcon}><GiWheat size={17} /></span>
              Farmer
            </button>
            <button
              type="button"
              className={`${styles.roleTab} ${tab === 'buyer-seller' ? styles.roleTabActive : ''}`}
              onClick={() => { setTab('buyer-seller'); setErrors({}) }}
            >
              <span className={styles.roleTabIcon}><GiShoppingCart size={17} /></span>
              Buyer / Seller
            </button>
          </div>

          {/* Buyer/Seller intent toggle */}
          {tab === 'buyer-seller' && (
            <div className={styles.intentRow}>
              <span className={styles.intentLabel}>I want to:</span>
              <div className={styles.intentToggle}>
                <button
                  type="button"
                  className={`${styles.intentBtn} ${intent === 'buy' ? styles.intentBtnActive : ''}`}
                  onClick={() => setIntent('buy')}
                >
                  Buy Produce
                </button>
                <button
                  type="button"
                  className={`${styles.intentBtn} ${intent === 'sell' ? styles.intentBtnActive : ''}`}
                  onClick={() => setIntent('sell')}
                >
                  Sell Produce
                </button>
              </div>
            </div>
          )}

          {/* API error */}
          {apiError && (
            <div className={styles.errorBanner}>
              <BsExclamationCircle size={15} color="#e05252" />
              <span className={styles.errorBannerText}>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className={styles.fields}>

              {/* ── SHARED FIELDS ── */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Full Name</label>
                <div className={styles.fieldInputWrap}>
                  <span className={styles.fieldInputIcon}><BsPerson size={15} /></span>
                  <input
                    className={`${styles.fieldInput} ${err('fullName') ? styles.fieldError : ''}`}
                    type="text"
                    placeholder="e.g. Adewale Okafor"
                    value={tab === 'farmer' ? farmer.fullName : bs.fullName}
                    onChange={e => tab === 'farmer' ? setF('fullName', e.target.value) : setB('fullName', e.target.value)}
                  />
                </div>
                {err('fullName')}
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Email Address</label>
                  <div className={styles.fieldInputWrap}>
                    <span className={styles.fieldInputIcon}><BsEnvelope size={14} /></span>
                    <input
                      className={`${styles.fieldInput} ${err('email') ? styles.fieldError : ''}`}
                      type="email"
                      placeholder="you@example.com"
                      value={tab === 'farmer' ? farmer.email : bs.email}
                      onChange={e => tab === 'farmer' ? setF('email', e.target.value) : setB('email', e.target.value)}
                    />
                  </div>
                  {err('email')}
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Phone Number</label>
                  <div className={styles.fieldInputWrap}>
                    <span className={styles.fieldInputIcon}><BsPhone size={14} /></span>
                    <input
                      className={`${styles.fieldInput} ${err('phone') ? styles.fieldError : ''}`}
                      type="tel"
                      placeholder="+234 800 000 0000"
                      value={tab === 'farmer' ? farmer.phone : bs.phone}
                      onChange={e => tab === 'farmer' ? setF('phone', e.target.value) : setB('phone', e.target.value)}
                    />
                  </div>
                  {err('phone')}
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Password</label>
                <div className={styles.fieldInputWrap}>
                  <span className={styles.fieldInputIcon}><BsPerson size={14} /></span>
                  <input
                    className={`${styles.fieldInput} ${err('password') ? styles.fieldError : ''}`}
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Minimum 6 characters"
                    value={tab === 'farmer' ? farmer.password : bs.password}
                    onChange={e => tab === 'farmer' ? setF('password', e.target.value) : setB('password', e.target.value)}
                  />
                  <button
                    type="button"
                    className={styles.fieldPasswordToggle}
                    onClick={() => setShowPwd(p => !p)}
                    tabIndex={-1}
                  >
                    {showPwd ? <BsEyeSlash size={15} /> : <BsEye size={15} />}
                  </button>
                </div>
                {err('password')}
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Location</label>
                <div className={styles.fieldInputWrap}>
                  <span className={styles.fieldInputIcon}><BsGeoAlt size={14} /></span>
                  <input
                    className={`${styles.fieldInput} ${err('location') ? styles.fieldError : ''}`}
                    type="text"
                    placeholder="e.g. Ibadan, Oyo State"
                    value={tab === 'farmer' ? farmer.location : bs.location}
                    onChange={e => tab === 'farmer' ? setF('location', e.target.value) : setB('location', e.target.value)}
                  />
                </div>
                {err('location')}
              </div>

              {/* ── FARMER SPECIFIC ── */}
              {tab === 'farmer' && <>
                <div className={styles.fieldRow}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Soil Type</label>
                    <select
                      className={`${styles.fieldSelect} ${err('soilType') ? styles.fieldError : ''}`}
                      value={farmer.soilType}
                      onChange={e => setF('soilType', e.target.value)}
                    >
                      <option value="">Select soil type</option>
                      {SOIL_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {err('soilType')}
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Farm Size (hectares)</label>
                    <input
                      className={`${styles.fieldInput} ${err('farmSize') ? styles.fieldError : ''}`}
                      type="text"
                      placeholder="e.g. 5 hectares"
                      value={farmer.farmSize}
                      onChange={e => setF('farmSize', e.target.value)}
                    />
                    {err('farmSize')}
                  </div>
                </div>
              </>}

              {/* ── BUYER/SELLER SPECIFIC ── */}
              {tab === 'buyer-seller' && (
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>
                    {intent === 'buy' ? 'Required Quantity (kg)' : 'Available Quantity (kg)'}
                  </label>
                  <input
                    className={`${styles.fieldInput} ${err('quantity') ? styles.fieldError : ''}`}
                    type="text"
                    placeholder="e.g. 500 kg"
                    value={bs.quantity}
                    onChange={e => setB('quantity', e.target.value)}
                  />
                  {err('quantity')}
                </div>
              )}

              {/* ── CROP TYPE SELECTOR ── */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>
                  Crop Types {tab === 'buyer-seller' ? `(${intent === 'buy' ? 'Interested In' : 'Available'})` : ''}
                </label>
                <CropPicker
                  selected={tab === 'farmer' ? farmer.cropTypes : bs.cropTypes}
                  onChange={crops =>
                    tab === 'farmer'
                      ? setFarmer(p => ({ ...p, cropTypes: crops }))
                      : setBs(p => ({ ...p, cropTypes: crops }))
                  }
                />
                {err('cropTypes')}
              </div>

              {/* Submit */}
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={loading}
              >
                {loading
                  ? <><div className={styles.spinner} /> Creating account...</>
                  : <>
                      Create Account
                      <div className={styles.submitBtnCircle}>
                        <BsArrowRight size={13} />
                      </div>
                    </>
                }
              </button>

            </div>
          </form>

          <p className={styles.termsText}>
            By creating an account you agree to our{' '}
            <span className={styles.termsLink}>Terms of Service</span> and{' '}
            <span className={styles.termsLink}>Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  )
}

/* ── Crop Picker Sub-component ── */
function CropPicker({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (crops: string[]) => void
}) {
  const toggle = (crop: string) =>
    onChange(
      selected.includes(crop)
        ? selected.filter(c => c !== crop)
        : [...selected, crop]
    )

  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 4,
    }}>
      {CROP_OPTIONS.map(crop => (
        <button
          key={crop}
          type="button"
          onClick={() => toggle(crop)}
          style={{
            padding: '5px 13px',
            borderRadius: 100,
            border: `1.5px solid ${selected.includes(crop) ? '#a8d832' : '#e2e8df'}`,
            background: selected.includes(crop) ? '#f2f9e4' : '#f7f8f5',
            color: selected.includes(crop) ? '#1e3d22' : '#6b7f6e',
            fontSize: 12, fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            fontFamily: 'inherit',
          }}
        >
          {crop}
        </button>
      ))}
    </div>
  )
}