import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { RiLeafFill } from 'react-icons/ri'
import {
  MdOutlineMenu, MdClose, MdOutlineSettings,
  MdOutlineLogout, MdOutlineSwapHoriz, MdOutlineStorefront,
} from 'react-icons/md'
import {
  BsPlus, BsShop, BsClockHistory, BsCheck2All,
  BsBell, BsPerson, BsGeoAlt, BsArrowRight,
} from 'react-icons/bs'
import { GiWheat, GiTruck } from 'react-icons/gi'
import { FaSeedling } from 'react-icons/fa'
import {
  marketService,
  type Listing, type Demand, type Match,
  type Notification, type CropType,
  AKURE_AREAS,
} from '../../services/marketService'
import { authService } from '../../services/authService'
import styles from './BuyerSellerDashboard.module.css'

// ── Types ──────────────────────────────────────────────
type Section = 'marketplace' | 'sell' | 'buy' | 'matches' | 'waitlist' | 'notifications'
type Intent  = 'buy' | 'sell'

const CROPS: CropType[] = ['Maize', 'Tomato', 'Cassava', 'Pepper']

const CROP_EMOJI: Record<CropType, string> = {
  Maize: '🌽', Tomato: '🍅', Cassava: '🌿', Pepper: '🌶️',
}
const CROP_CSS: Record<CropType, string> = {
  Maize: 'cropMaize', Tomato: 'cropTomato',
  Cassava: 'cropCassava', Pepper: 'cropPepper',
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ── Component ──────────────────────────────────────────
export default function BuyerSellerDashboard() {
  const navigate = useNavigate()
  const user     = authService.getUser() ?? { id: 'mock-001', name: 'Chioma Eze', email: 'buyer@test.com', role: 'buyer' }
  const initials = user.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() ?? 'CE'

  const [section,     setSection]     = useState<Section>('marketplace')
  const [intent,      setIntent]      = useState<Intent>(user.role === 'seller' ? 'sell' : 'buy')
  const [sidebarOpen, setSidebar]     = useState(false)
  const [cropFilter,  setCropFilter]  = useState<CropType | 'All'>('All')
  const [listings,    setListings]    = useState<Listing[]>([])
  const [matches,     setMatches]     = useState<Match[]>([])
  const [waitlist,    setWaitlist]    = useState<Demand[]>([])
  const [notifs,      setNotifs]      = useState<Notification[]>([])
  const [modal,       setModal]       = useState<null | { type: 'match' | 'waitlist' | 'buy'; data: any }>(null)
  const [buyQty,      setBuyQty]      = useState<Record<string, number>>({})

  // init market service + load data
  useEffect(() => {
    marketService.init()
    refresh()
  }, [])

  function refresh() {
    setListings(marketService.getListings())
    setMatches(marketService.getMatchesByUser(user.id))
    setWaitlist(marketService.getWaitlistByUser(user.id))
    setNotifs(marketService.getNotifications(user.id))
  }

  const unread = notifs.filter(n => !n.read).length

  const goTo = (s: Section) => { setSection(s); setSidebar(false) }

  const filteredListings = listings.filter(l =>
    (cropFilter === 'All' || l.cropType === cropFilter) &&
    l.status !== 'sold'
  )

  // ── Direct Buy ──
  const handleDirectBuy = (listing: Listing) => {
    const qty = buyQty[listing.id] || listing.remainingQty
    const match = marketService.buyDirectly(
      listing.id,
      { id: user.id, name: user.name, email: user.email },
      qty,
    )
    if (match) {
      setModal({ type: 'buy', data: match })
      refresh()
    }
  }

  // ── Logout ──
  const handleLogout = () => { authService.clearSession(); navigate('/login') }

  const navItems: { id: Section; label: string; icon: React.ReactNode; badge?: number | string }[] = [
    { id: 'marketplace',   label: 'Marketplace',   icon: <MdOutlineStorefront size={17} /> },
    { id: 'buy',           label: 'Post Demand',    icon: <FaSeedling size={15} /> },
    { id: 'sell',          label: 'List Produce',   icon: <BsShop size={15} /> },
    { id: 'matches',       label: 'My Matches',     icon: <BsCheck2All size={16} />,  badge: matches.length  },
    { id: 'waitlist',      label: 'Waitlist',       icon: <BsClockHistory size={15} />, badge: waitlist.length },
    { id: 'notifications', label: 'Notifications',  icon: <BsBell size={15} />,        badge: unread || undefined },
  ]

  return (
    <div className={styles.shell}>

      {/* Mobile overlay */}
      <div
        className={`${styles.overlay} ${sidebarOpen ? styles.overlayVisible : ''}`}
        onClick={() => setSidebar(false)}
      />

      {/* Modal */}
      {modal && (
        <MatchModal
          modal={modal}
          onClose={() => { setModal(null); goTo('matches') }}
          onViewMatches={() => { setModal(null); goTo('matches') }}
        />
      )}

      {/* ════════════════════════════════════════
          SIDEBAR
      ════════════════════════════════════════ */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>

        <div className={styles.sidebarTop}>
          <div className={styles.logoRow}>
            <div className={styles.logoMark}><RiLeafFill size={16} /></div>
            <span className={styles.logoText}>AgroFlow<span>+</span></span>
          </div>

          <div className={styles.profileRow}>
            <div className={styles.profileAvatar}>{initials}</div>
            <div className={styles.profileInfo}>
              <div className={styles.profileName}>{user.name}</div>
              <div className={styles.profileRole}>
                {intent === 'buy' ? '🛒 Buyer' : '📦 Seller'}
              </div>
            </div>
          </div>

          {/* Buy / Sell toggle */}
          <div className={styles.intentBox}>
            <div className={styles.intentLabel}>I am here to</div>
            <div className={styles.intentToggle}>
              <button
                className={`${styles.intentBtn} ${intent === 'buy' ? styles.intentBtnActive : ''}`}
                onClick={() => setIntent('buy')}
              >
                🛒 Buy
              </button>
              <button
                className={`${styles.intentBtn} ${intent === 'sell' ? styles.intentBtnActive : ''}`}
                onClick={() => setIntent('sell')}
              >
                📦 Sell
              </button>
            </div>
          </div>
        </div>

        <nav className={styles.sidebarNav}>
          <div className={styles.navLabel}>Navigation</div>
          {navItems.map(item => (
            <button
              key={item.id}
              className={`${styles.navItem} ${section === item.id ? styles.navItemActive : ''}`}
              onClick={() => goTo(item.id)}
            >
              <div className={styles.navIcon}>{item.icon}</div>
              <span className={styles.navText}>{item.label}</span>
              {item.badge
                ? (typeof item.badge === 'number' && item.badge > 0
                    ? <span className={item.id === 'notifications' ? styles.navBadge : styles.navBadgeGreen}>{item.badge}</span>
                    : null)
                : null}
            </button>
          ))}
        </nav>

        {/* Switch Role */}
        <div className={styles.switchBox}>
          <div className={styles.switchLbl}>Switch Role</div>
          <button className={styles.switchBtn} onClick={() => navigate('/farmer/dashboard')}>
            <MdOutlineSwapHoriz size={14} /> Go to Farmer Dashboard
          </button>
        </div>

        <div className={styles.sidebarBottom}>
          <button className={styles.sidebarBtn}>
            <MdOutlineSettings size={15} /> Settings
          </button>
          <button className={`${styles.sidebarBtn} ${styles.sidebarBtnDanger}`} onClick={handleLogout}>
            <MdOutlineLogout size={15} /> Log Out
          </button>
        </div>
      </aside>

      {/* ════════════════════════════════════════
          MAIN
      ════════════════════════════════════════ */}
      <div className={styles.main}>

        <div className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button className={styles.menuBtn} onClick={() => setSidebar(p => !p)}>
              {sidebarOpen ? <MdClose size={17} /> : <MdOutlineMenu size={17} />}
            </button>
            <div>
              <div className={styles.topbarTitle}>
                {{
                  marketplace:   'Marketplace',
                  buy:           'Post a Demand',
                  sell:          'List Your Produce',
                  matches:       'My Matches',
                  waitlist:      'Waitlist',
                  notifications: 'Notifications',
                }[section]}
              </div>
              <div className={styles.topbarSub}>Akure Agricultural Hub · 4 crops available</div>
            </div>
          </div>
          <div className={styles.topbarRight}>
            {section === 'marketplace' && intent === 'buy' && (
              <button className={styles.topbarBtnOutline} onClick={() => goTo('buy')}>
                <BsPlus size={15} /> Post Demand
              </button>
            )}
            {section === 'marketplace' && intent === 'sell' && (
              <button className={styles.topbarBtnPrimary} onClick={() => goTo('sell')}>
                <BsPlus size={15} /> List Produce
              </button>
            )}
            <button className={styles.topbarIconBtn} onClick={() => goTo('notifications')}>
              <BsBell size={15} />
              {unread > 0 && <div className={styles.notifBadge} />}
            </button>
            <div className={styles.topbarIconBtn}>
              <BsPerson size={15} />
            </div>
          </div>
        </div>

        <div className={styles.content}>
          {section === 'marketplace'   && <SectionMarketplace listings={filteredListings} cropFilter={cropFilter} setCropFilter={setCropFilter} buyQty={buyQty} setBuyQty={setBuyQty} intent={intent} onBuy={handleDirectBuy} />}
          {section === 'sell'          && <SectionPostListing user={user} onSuccess={() => { refresh(); goTo('marketplace') }} />}
          {section === 'buy'           && <SectionPostDemand  user={user} onResult={(r) => { refresh(); setModal({ type: r.matched ? 'match' : 'waitlist', data: r }) }} />}
          {section === 'matches'       && <SectionMatches  matches={matches} userId={user.id} />}
          {section === 'waitlist'      && <SectionWaitlist waitlist={waitlist} />}
          {section === 'notifications' && <SectionNotifications notifs={notifs} userId={user.id} onMarkAll={() => { marketService.markAllRead(user.id); refresh() }} />}
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════
// MARKETPLACE
// ══════════════════════════════════════════════════════
function SectionMarketplace({ listings, cropFilter, setCropFilter, buyQty, setBuyQty, intent, onBuy }: {
  listings: Listing[]
  cropFilter: CropType | 'All'
  setCropFilter: (c: CropType | 'All') => void
  buyQty: Record<string, number>
  setBuyQty: (v: Record<string, number>) => void
  intent: Intent
  onBuy: (l: Listing) => void
}) {
  return (
    <>
      <div className={styles.pageHeader}>
        <div className={styles.pageTitle}>Available Produce in Akure</div>
        <div className={styles.pageSubtitle}>{listings.length} listings found · Sorted by closest location</div>
      </div>

      <div className={styles.cropTabs}>
        {(['All', ...CROPS] as (CropType | 'All')[]).map(c => (
          <button
            key={c}
            className={`${styles.cropTab} ${cropFilter === c ? styles.cropTabActive : ''}`}
            onClick={() => setCropFilter(c)}
          >
            {c !== 'All' && CROP_EMOJI[c as CropType]} {c}
          </button>
        ))}
      </div>

      {listings.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🌾</div>
          <div className={styles.emptyTitle}>No listings yet</div>
          <div className={styles.emptyText}>No produce available for this crop. Check back soon or post your demand to be notified when stock arrives.</div>
        </div>
      ) : (
        <div className={styles.listingsGrid}>
          {listings.map(listing => (
            <div key={listing.id} className={styles.listingCard}>
              <div className={styles.listingCardTop}>
                <div className={`${styles.listingCropBadge} ${styles[CROP_CSS[listing.cropType] as keyof typeof styles]}`}>
                  {CROP_EMOJI[listing.cropType]} {listing.cropType}
                </div>
                <div className={`${styles.listingStatusBadge} ${
                  listing.status === 'available' ? styles.statusAvailable :
                  listing.status === 'partial'   ? styles.statusPartial   : styles.statusSold
                }`}>
                  {listing.status === 'partial' ? 'Partial' : listing.status}
                </div>
              </div>

              <div className={styles.listingCardBody}>
                <div className={styles.listingSellerRow}>
                  <div className={styles.listingSellerAvatar}>
                    {listing.sellerName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className={styles.listingSellerName}>{listing.sellerName}</div>
                    <div className={styles.listingLocation}>📍 {listing.location}, Akure</div>
                  </div>
                </div>

                <div className={styles.listingStats}>
                  <div className={styles.listingStat}>
                    <div className={styles.listingStatVal}>{listing.remainingQty}kg</div>
                    <div className={styles.listingStatLabel}>Available</div>
                  </div>
                  <div className={styles.listingStat}>
                    <div className={styles.listingStatVal}>₦{listing.pricePerKg}</div>
                    <div className={styles.listingStatLabel}>Per kg</div>
                  </div>
                </div>

                <div className={styles.listingDesc}>{listing.description}</div>

                {/* Qty input for direct buy */}
                {intent === 'buy' && listing.status !== 'sold' && (
                  <div style={{ marginBottom: 10 }}>
                    <input
                      type="number"
                      className={styles.fieldInput}
                      style={{ padding: '7px 12px', fontSize: 13 }}
                      placeholder={`Qty (max ${listing.remainingQty}kg)`}
                      min={1} max={listing.remainingQty}
                      value={buyQty[listing.id] || ''}
                      onChange={e => setBuyQty({ ...buyQty, [listing.id]: Number(e.target.value) })}
                    />
                  </div>
                )}

                <div className={styles.listingCardActions}>
                  {intent === 'buy' ? (
                    <button
                      className={styles.btnBuyNow}
                      disabled={listing.status === 'sold'}
                      onClick={() => onBuy(listing)}
                    >
                      Buy Now — ₦{((buyQty[listing.id] || listing.remainingQty) * listing.pricePerKg).toLocaleString()}
                    </button>
                  ) : (
                    <button className={styles.btnBuyNow} disabled>
                      Your Listing
                    </button>
                  )}
                  <button className={styles.btnDetails}>
                    <BsGeoAlt size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

// ══════════════════════════════════════════════════════
// POST LISTING (Seller)
// ══════════════════════════════════════════════════════
function SectionPostListing({ user, onSuccess }: { user: any; onSuccess: () => void }) {
  const [form, setForm] = useState({
    cropType: 'Maize' as CropType,
    quantity: '', pricePerKg: '',
    location: AKURE_AREAS[0], description: '',
  })
  const [loading, setLoading] = useState(false)
  const [errors,  setErrors]  = useState<Record<string, string>>({})

  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.quantity   || Number(form.quantity)   <= 0) e.quantity   = 'Enter a valid quantity'
    if (!form.pricePerKg || Number(form.pricePerKg) <= 0) e.pricePerKg = 'Enter a valid price'
    if (!form.description.trim())                         e.description = 'Add a short description'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 700))
    marketService.postListing({
      sellerId:    user.id,
      sellerName:  user.name,
      sellerEmail: user.email,
      cropType:    form.cropType,
      quantity:    Number(form.quantity),
      pricePerKg:  Number(form.pricePerKg),
      location:    form.location,
      description: form.description,
    })
    setLoading(false)
    onSuccess()
  }

  return (
    <div className={styles.formCard}>
      <div className={styles.formTitle}>List Your Produce</div>
      <div className={styles.formSubtitle}>Post what you have available. Buyers in Akure will see it instantly.</div>
      <form onSubmit={handleSubmit} noValidate>
        <div className={styles.formFields}>
          <div className={styles.fieldRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Crop Type</label>
              <select className={styles.fieldSelect} value={form.cropType} onChange={e => setF('cropType', e.target.value)}>
                {CROPS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Location (Akure)</label>
              <select className={styles.fieldSelect} value={form.location} onChange={e => setF('location', e.target.value)}>
                {AKURE_AREAS.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <div className={styles.fieldRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Available Quantity (kg)</label>
              <input className={styles.fieldInput} type="number" placeholder="e.g. 500" min={1} value={form.quantity} onChange={e => setF('quantity', e.target.value)} />
              {errors.quantity && <span className={styles.fieldErrMsg}>{errors.quantity}</span>}
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Price per kg (₦)</label>
              <input className={styles.fieldInput} type="number" placeholder="e.g. 180" min={1} value={form.pricePerKg} onChange={e => setF('pricePerKg', e.target.value)} />
              {errors.pricePerKg && <span className={styles.fieldErrMsg}>{errors.pricePerKg}</span>}
            </div>
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Description</label>
            <textarea className={styles.fieldTextarea} placeholder="Describe your produce — quality, harvest date, packaging..." value={form.description} onChange={e => setF('description', e.target.value)} />
            {errors.description && <span className={styles.fieldErrMsg}>{errors.description}</span>}
          </div>
          <button className={styles.formSubmitBtn} type="submit" disabled={loading}>
            {loading ? <><div className={styles.spinner} /> Posting...</> : <>Post Listing <BsArrowRight size={14} /></>}
          </button>
        </div>
      </form>
    </div>
  )
}

// ══════════════════════════════════════════════════════
// POST DEMAND (Buyer)
// ══════════════════════════════════════════════════════
function SectionPostDemand({ user, onResult }: {
  user: any
  onResult: (r: { demand: Demand; matches: Match[]; matched: boolean }) => void
}) {
  const [form, setForm] = useState({
    cropType: 'Maize' as CropType,
    quantity: '', maxPrice: '', location: AKURE_AREAS[0],
  })
  const [loading, setLoading] = useState(false)
  const [errors,  setErrors]  = useState<Record<string, string>>({})

  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.quantity || Number(form.quantity) <= 0) e.quantity = 'Enter a valid quantity'
    if (!form.maxPrice || Number(form.maxPrice) <= 0) e.maxPrice = 'Enter your max price per kg'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 900)) // simulate processing
    const result = marketService.postDemand({
      buyerId:   user.id,
      buyerName: user.name,
      buyerEmail: user.email,
      cropType:  form.cropType,
      quantity:  Number(form.quantity),
      maxPrice:  Number(form.maxPrice),
      location:  form.location,
    })
    setLoading(false)
    onResult(result)
  }

  return (
    <div className={styles.formCard}>
      <div className={styles.formTitle}>Post a Demand</div>
      <div className={styles.formSubtitle}>Tell us what you need. Our system will find the closest seller in Akure and match you automatically.</div>
      <form onSubmit={handleSubmit} noValidate>
        <div className={styles.formFields}>
          <div className={styles.fieldRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Crop Type</label>
              <select className={styles.fieldSelect} value={form.cropType} onChange={e => setF('cropType', e.target.value)}>
                {CROPS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Your Location (Akure)</label>
              <select className={styles.fieldSelect} value={form.location} onChange={e => setF('location', e.target.value)}>
                {AKURE_AREAS.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <div className={styles.fieldRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Quantity Needed (kg)</label>
              <input className={styles.fieldInput} type="number" placeholder="e.g. 200" min={1} value={form.quantity} onChange={e => setF('quantity', e.target.value)} />
              {errors.quantity && <span className={styles.fieldErrMsg}>{errors.quantity}</span>}
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Max Price per kg (₦)</label>
              <input className={styles.fieldInput} type="number" placeholder="e.g. 200" min={1} value={form.maxPrice} onChange={e => setF('maxPrice', e.target.value)} />
              {errors.maxPrice && <span className={styles.fieldErrMsg}>{errors.maxPrice}</span>}
            </div>
          </div>
          <div style={{ background:'#f2f9e4', border:'1px solid rgba(168,216,50,0.3)', borderRadius:10, padding:'12px 14px', fontSize:13, color:'#2d6a35', fontWeight:600 }}>
            🤖 Our system will instantly check available sellers in Akure and match you by closest location first. If no seller is found, you'll be added to the waitlist and notified when one is available.
          </div>
          <button className={styles.formSubmitBtn} type="submit" disabled={loading}>
            {loading ? <><div className={styles.spinner} /> Finding matches...</> : <>Find a Match <BsArrowRight size={14} /></>}
          </button>
        </div>
      </form>
    </div>
  )
}

// ══════════════════════════════════════════════════════
// MY MATCHES
// ══════════════════════════════════════════════════════
function SectionMatches({ matches, userId }: { matches: Match[]; userId: string }) {
  if (matches.length === 0) return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>🤝</div>
      <div className={styles.emptyTitle}>No matches yet</div>
      <div className={styles.emptyText}>Post a demand or list your produce. Our system will automatically match you with the closest buyer or seller in Akure.</div>
    </div>
  )
  return (
    <div className={styles.matchesList}>
      {matches.map(m => (
        <div key={m.id} className={styles.matchRow}>
          <div className={styles.matchRowLeft}>
            <div className={styles.matchCropRow}>
              <span style={{ fontSize: 20 }}>{CROP_EMOJI[m.cropType]}</span>
              <span className={styles.matchCropName}>{m.cropType}</span>
            </div>
            <div className={styles.matchParties}>
              {m.sellerId === userId
                ? <>Sold to <strong>{m.buyerName}</strong> · 📍 {m.buyerLoc}</>
                : <>Bought from <strong>{m.sellerName}</strong> · 📍 {m.sellerLoc}</>
              }
            </div>
          </div>
          <div className={styles.matchStats}>
            <div className={styles.matchStat}>
              <div className={styles.matchStatVal}>{m.quantity}kg</div>
              <div className={styles.matchStatLabel}>Qty</div>
            </div>
            <div className={styles.matchStat}>
              <div className={styles.matchStatVal}>₦{m.pricePerKg}/kg</div>
              <div className={styles.matchStatLabel}>Price</div>
            </div>
            <div className={styles.matchStat}>
              <div className={styles.matchStatVal}>₦{m.totalPrice.toLocaleString()}</div>
              <div className={styles.matchStatLabel}>Total</div>
            </div>
            <div className={styles.matchStat}>
              <div className={styles.matchStatVal}>{m.distance}km</div>
              <div className={styles.matchStatLabel}>Distance</div>
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
            <span className={`${styles.matchStatusChip} ${
              m.status === 'confirmed'         ? styles.chipConfirmed :
              m.status === 'pending_delivery'  ? styles.chipDelivery  : styles.chipDelivered
            }`}>{m.status.replace('_', ' ')}</span>
            <span className={styles.matchDate}>{timeAgo(m.matchedAt)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ══════════════════════════════════════════════════════
// WAITLIST
// ══════════════════════════════════════════════════════
function SectionWaitlist({ waitlist }: { waitlist: Demand[] }) {
  if (waitlist.length === 0) return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>✅</div>
      <div className={styles.emptyTitle}>Waitlist is clear</div>
      <div className={styles.emptyText}>All your demands have been matched. Great news!</div>
    </div>
  )
  return (
    <div className={styles.waitlistList}>
      {waitlist.map(d => (
        <div key={d.id} className={styles.waitlistCard}>
          <div className={styles.waitlistIcon}><GiTruck size={18} /></div>
          <div className={styles.waitlistInfo}>
            <div className={styles.waitlistCrop}>{CROP_EMOJI[d.cropType]} {d.cropType} — {d.quantity}kg</div>
            <div className={styles.waitlistMeta}>📍 {d.location} · Max ₦{d.maxPrice}/kg · Posted {timeAgo(d.createdAt)}</div>
          </div>
          <span className={styles.waitlistBadge}>Waiting</span>
        </div>
      ))}
    </div>
  )
}

// ══════════════════════════════════════════════════════
// NOTIFICATIONS
// ══════════════════════════════════════════════════════
function SectionNotifications({ notifs, userId, onMarkAll }: {
  notifs: Notification[]
  userId: string
  onMarkAll: () => void
}) {
  if (notifs.length === 0) return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>🔔</div>
      <div className={styles.emptyTitle}>No notifications yet</div>
      <div className={styles.emptyText}>When you get matched, buy, or sell — your notifications will appear here.</div>
    </div>
  )
  return (
    <>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:12 }}>
        <button style={{ fontSize:12, fontWeight:700, color:'#2d6a35', background:'none', border:'none', cursor:'pointer' }} onClick={onMarkAll}>
          Mark all as read
        </button>
      </div>
      <div className={styles.notifList}>
        {notifs.map(n => (
          <div key={n.id} className={`${styles.notifCard} ${!n.read ? styles.notifUnread : ''}`}
            onClick={() => { marketService.markNotifRead(n.id) }}>
            <div className={`${styles.notifIconWrap} ${n.type === 'match' ? styles.notiflime : styles.notifamber}`}>
              {n.type === 'match' ? <BsCheck2All size={16} /> : <GiTruck size={16} />}
            </div>
            <div className={styles.notifbody}>
              <div className={styles.notifTitle}>{n.title}</div>
              <div className={styles.notifText}>{n.message}</div>
            </div>
            <div className={styles.notifRight}>
              <div className={styles.notifTime}>{timeAgo(n.createdAt)}</div>
              {!n.read && <div className={styles.unreadDot} />}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

// ══════════════════════════════════════════════════════
// MATCH RESULT MODAL
// ══════════════════════════════════════════════════════
function MatchModal({ modal, onClose, onViewMatches }: {
  modal: { type: string; data: any }
  onClose: () => void
  onViewMatches: () => void
}) {
  const isMatch = modal.type === 'match' || modal.type === 'buy'
  const matches: Match[] = modal.type === 'match'
    ? (modal.data.matches ?? [])
    : (modal.data ? [modal.data] : [])

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={`${styles.modalIcon} ${isMatch ? styles.modalIconSuccess : styles.modalIconWait}`}>
          {isMatch ? '🎉' : '⏳'}
        </div>

        <div className={styles.modalTitle}>
          {isMatch ? 'Match Found!' : 'Added to Waitlist'}
        </div>

        <div className={styles.modalText}>
          {isMatch
            ? `Great news! We found ${matches.length} seller${matches.length > 1 ? 's' : ''} near you in Akure.`
            : 'No seller available right now. We\'ll notify you via SMS and email the moment one lists produce matching your demand.'}
        </div>

        {isMatch && matches.length > 0 && (
          <div className={styles.matchCards}>
            {matches.map(m => (
              <div key={m.id} className={styles.matchCard}>
                <div className={styles.matchCardRow}>
                  <span className={styles.matchCardLabel}>
                    {CROP_EMOJI[m.cropType]} {m.cropType} · {m.quantity}kg
                  </span>
                  <span className={styles.matchCardVal}>📍 {m.sellerLoc} ({m.distance}km)</span>
                </div>
                <div className={styles.matchCardRow}>
                  <span className={styles.matchCardVal}>Seller: {m.sellerName}</span>
                  <span className={styles.matchCardTotal}>₦{m.totalPrice.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={styles.notifNote}>
          📧 Notification sent to both buyer and seller via email & SMS
        </div>

        <div className={styles.modalBtns}>
          {isMatch
            ? <button className={styles.modalBtnPrimary} onClick={onViewMatches}>View My Matches</button>
            : <button className={styles.modalBtnPrimary} onClick={onClose}>View Waitlist</button>
          }
          <button className={styles.modalBtnOutline} onClick={onClose}>Continue</button>
        </div>
      </div>
    </div>
  )
}