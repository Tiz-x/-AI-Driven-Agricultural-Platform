// src/pages/BuyerSellerDashboard/BuyerSellerDashboard.tsx

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  RiLeafFill, 
  RiMapPinLine, 
  RiCheckboxCircleLine,
  RiChatCheckLine,
  RiNotificationLine,
  RiUserLine,
  RiSettings4Line,
  RiLogoutBoxRLine,
  RiExchangeLine,
  RiStore3Line,
  RiShoppingBagLine,
  RiTimeLine,
  RiCheckDoubleLine,
  RiBellLine,
  RiSeedlingLine,
  RiShoppingCartLine,
  RiArrowLeftLine,
  RiSendPlaneLine,
  RiMailSendLine,
  RiImageAddLine,
  RiHomeSmileLine
} from 'react-icons/ri'
import { 
  GiCorn, 
  GiTomato, 
  GiChiliPepper,
  GiTruck,
  GiFarmer,
  GiPlantRoots
} from 'react-icons/gi'
import { 
  MdOutlineMenu, 
  MdClose, 
  MdCheckCircle, 
  MdCancel,
  MdCameraAlt
} from 'react-icons/md'
import { BsArrowRight } from 'react-icons/bs'
import { FaStore, FaSeedling } from 'react-icons/fa'
import { marketService, type Listing, type Demand, type Match, type Notification, type CropType, type Request, AKURE_AREAS } from '../../services/marketService'
import { authService } from '../../services/authService'
import styles from './BuyerSellerDashboard.module.css'

type Section = 'marketplace' | 'myStore' | 'sell' | 'buy' | 'matches' | 'waitlist' | 'notifications' | 'requests'
type Intent = 'buy' | 'sell'

const CROPS: CropType[] = ['Maize', 'Tomato', 'Cassava', 'Pepper']

const CROP_ICON: Record<CropType, React.ReactNode> = {
  Maize: <GiCorn size={20} />,
  Tomato: <GiTomato size={20} />,
  Cassava: <GiPlantRoots size={20} />,
  Pepper: <GiChiliPepper size={20} />
}

const CROP_CSS: Record<CropType, string> = {
  Maize: 'cropMaize',
  Tomato: 'cropTomato',
  Cassava: 'cropCassava',
  Pepper: 'cropPepper'
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// Helper for image fallback
const getImageFallback = (cropType: CropType): string => {
  const icons: Record<CropType, string> = {
    Maize: '🌽',
    Tomato: '🍅',
    Cassava: '🌿',
    Pepper: '🌶️'
  }
  return `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23f2f9e4"/%3E%3Ctext x="50%25" y="45%25" text-anchor="middle" font-family="Arial" font-size="64" fill="%23a8d832"%3E${encodeURIComponent(icons[cropType])}%3C/text%3E%3Ctext x="50%25" y="65%25" text-anchor="middle" font-family="Arial" font-size="14" fill="%239ead9f"%3ENo Image%3C/text%3E%3C/svg%3E`
}

export default function BuyerSellerDashboard() {
  const navigate = useNavigate()
  const user = authService.getUser() ?? { id: 'mock-001', name: 'Chioma Eze', email: 'buyer@test.com', role: 'buyer' }
  const initials = user.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() ?? 'CE'

  const [section, setSection] = useState<Section>('marketplace')
  const [intent, setIntent] = useState<Intent>(user.role === 'seller' ? 'sell' : 'buy')
  const [sidebarOpen, setSidebar] = useState(false)
  const [cropFilter, setCropFilter] = useState<CropType | 'All'>('All')
  const [listings, setListings] = useState<Listing[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [waitlist, setWaitlist] = useState<Demand[]>([])
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [myListings, setMyListings] = useState<Listing[]>([])
  const [myRequests, setMyRequests] = useState<Request[]>([])
  const [showRequestModal, setShowRequestModal] = useState<{ listing: Listing } | null>(null)
  const [requestQty, setRequestQty] = useState('')
  const [requestMsg, setRequestMsg] = useState('')
  const [modal, setModal] = useState<null | { type: 'match' | 'waitlist' | 'requestSent'; data: any }>(null)

  useEffect(() => {
    marketService.init()
    refresh()
  }, [])

  function refresh() {
    setListings(marketService.getListings())
    setMatches(marketService.getMatchesByUser(user.id))
    setWaitlist(marketService.getWaitlistByUser(user.id))
    setNotifs(marketService.getNotifications(user.id))
    setMyListings(marketService.getListingsBySeller(user.id))
    setMyRequests(marketService.getRequestsByBuyer(user.id))
  }

  const unread = notifs.filter(n => !n.read).length

  const handleRequestToBuy = (listing: Listing) => {
    setShowRequestModal({ listing })
    setRequestQty('')
    setRequestMsg('')
  }

  const submitRequest = () => {
    const qty = Number(requestQty)
    if (!showRequestModal) return
    if (qty <= 0 || qty > showRequestModal.listing.remainingQty) {
      alert(`Please enter a valid quantity (max ${showRequestModal.listing.remainingQty}kg)`)
      return
    }
    
    const newRequest = marketService.createRequest(
      showRequestModal.listing.id,
      user.id,
      user.name,
      user.email,
      qty,
      requestMsg || `I would like to buy ${qty}kg of your ${showRequestModal.listing.cropType}`
    )
    
    setShowRequestModal(null)
    setModal({ type: 'requestSent', data: newRequest })
    refresh()
  }

  const handleAcceptRequest = (request: Request) => {
    if (window.confirm(`Accept ${request.buyerName}'s request for ${request.requestedQty}kg?`)) {
      marketService.acceptRequest(request.id)
      refresh()
    }
  }

  const handleRejectRequest = (request: Request) => {
    if (window.confirm(`Reject ${request.buyerName}'s request?`)) {
      marketService.rejectRequest(request.id)
      refresh()
    }
  }

  const handleLogout = () => { 
    authService.clearSession()
    navigate('/login') 
  }

  const filteredListings = listings.filter(l =>
    (cropFilter === 'All' || l.cropType === cropFilter) &&
    l.status !== 'sold'
  )

  const handleIntentChange = (newIntent: Intent) => {
    setIntent(newIntent)
    if (newIntent === 'buy') {
      setSection('marketplace')
    } else {
      setSection('sell')
    }
  }

  const bottomNavItems = [
    { id: 'marketplace' as Section, label: 'Home', icon: <RiHomeSmileLine size={22} /> },
    { id: 'myStore' as Section, label: 'Store', icon: <FaStore size={20} /> },
    { id: 'matches' as Section, label: 'Matches', icon: <RiCheckDoubleLine size={20} />, badge: matches.length },
    { id: 'notifications' as Section, label: 'Alerts', icon: <RiBellLine size={20} />, badge: unread },
  ]

  const sidebarNavItems: { id: Section; label: string; icon: React.ReactNode; badge?: number | string }[] = [
    { id: 'marketplace', label: 'Marketplace', icon: <RiStore3Line size={17} /> },
    { id: 'myStore', label: 'My Store', icon: <FaStore size={15} />, badge: myListings.length },
    { id: 'buy', label: 'Post Demand', icon: <FaSeedling size={15} /> },
    { id: 'sell', label: 'List Produce', icon: <RiShoppingBagLine size={15} /> },
    { id: 'matches', label: 'My Matches', icon: <RiCheckDoubleLine size={16} />, badge: matches.length },
    { id: 'requests', label: 'Requests', icon: <RiChatCheckLine size={15} />, badge: myRequests.filter(r => r.status === 'pending').length },
    { id: 'waitlist', label: 'Waitlist', icon: <RiTimeLine size={15} />, badge: waitlist.length },
    { id: 'notifications', label: 'Notifications', icon: <RiBellLine size={15} />, badge: unread || undefined },
  ]

  return (
    <div className={styles.shell}>
      <div className={`${styles.overlay} ${sidebarOpen ? styles.overlayVisible : ''}`} onClick={() => setSidebar(false)} />

      {/* Request Modal */}
      {showRequestModal && (
        <div className={styles.modalOverlay} onClick={() => setShowRequestModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className={styles.modalIcon} style={{ background: '#f2f9e4' }}>
              <RiSendPlaneLine size={32} color="#2d6a35" />
            </div>
            <div className={styles.modalTitle}>Request to Buy</div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16, padding: 12, background: '#f7f8f5', borderRadius: 12 }}>
                {showRequestModal.listing.photoUrl ? (
                  <img src={showRequestModal.listing.photoUrl} alt="" style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 60, height: 60, borderRadius: 8, background: '#e2e8df', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {CROP_ICON[showRequestModal.listing.cropType]}
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 800, marginBottom: 4 }}>{showRequestModal.listing.cropType}</div>
                  <div style={{ fontSize: 12, color: '#6b7f6e' }}>Seller: {showRequestModal.listing.sellerName}</div>
                  <div style={{ fontSize: 12, color: '#6b7f6e' }}>Available: {showRequestModal.listing.remainingQty}kg</div>
                </div>
              </div>
              
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Quantity Needed (kg) *</label>
                <input 
                  type="number" 
                  className={styles.fieldInput} 
                  value={requestQty} 
                  onChange={e => setRequestQty(e.target.value)} 
                  min={1} 
                  max={showRequestModal.listing.remainingQty} 
                  placeholder={`Max ${showRequestModal.listing.remainingQty}kg`} 
                />
              </div>
              
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Message to Seller (Optional)</label>
                <textarea 
                  className={styles.fieldTextarea} 
                  rows={3} 
                  value={requestMsg} 
                  onChange={e => setRequestMsg(e.target.value)} 
                  placeholder="e.g., When can I pick up? Do you deliver?" 
                />
              </div>
            </div>
            
            <div className={styles.modalBtns}>
              <button className={styles.modalBtnPrimary} onClick={submitRequest}>
                <RiMailSendLine size={16} /> Send Request
              </button>
              <button className={styles.modalBtnOutline} onClick={() => setShowRequestModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {modal && (
        <div className={styles.modalOverlay} onClick={() => { setModal(null); refresh() }}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={`${styles.modalIcon} ${modal.type === 'match' || modal.type === 'requestSent' ? styles.modalIconSuccess : styles.modalIconWait}`}>
              {modal.type === 'requestSent' ? <RiMailSendLine size={32} /> : modal.type === 'match' ? <RiCheckboxCircleLine size={32} /> : <RiTimeLine size={32} />}
            </div>
            <div className={styles.modalTitle}>
              {modal.type === 'requestSent' ? 'Request Sent!' : modal.type === 'match' ? 'Match Found!' : 'Added to Waitlist'}
            </div>
            <div className={styles.modalText}>
              {modal.type === 'requestSent' 
                ? `Your request has been sent to the seller. You'll be notified when they respond.`
                : modal.type === 'match'
                ? `Great news! We found matches for your demand.`
                : `No sellers available right now. We'll notify you when someone lists matching produce.`}
            </div>
            <div className={styles.modalBtns}>
              <button className={styles.modalBtnPrimary} onClick={() => { setModal(null); refresh() }}>Continue</button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
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
                {intent === 'buy' ? <><RiShoppingCartLine size={10} /> Buyer</> : <><RiStore3Line size={10} /> Seller</>}
              </div>
            </div>
          </div>
        </div>

        <nav className={styles.sidebarNav}>
          <div className={styles.navLabel}>NAVIGATION</div>
          {sidebarNavItems.map(item => (
            <button
              key={item.id}
              className={`${styles.navItem} ${section === item.id ? styles.navItemActive : ''}`}
              onClick={() => { setSection(item.id); setSidebar(false) }}
            >
              <div className={styles.navIcon}>{item.icon}</div>
              <span className={styles.navText}>{item.label}</span>
              {item.badge && typeof item.badge === 'number' && item.badge > 0 && (
                <span className={item.id === 'notifications' ? styles.navBadge : styles.navBadgeGreen}>{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        <div className={styles.switchBox}>
          <div className={styles.switchLbl}>Switch Role</div>
          <button className={styles.switchBtn} onClick={() => navigate('/farmer/dashboard')}>
            <RiExchangeLine size={14} /> Go to Farmer Dashboard
          </button>
        </div>

        <div className={styles.sidebarBottom}>
          <button className={styles.sidebarBtn}>
            <RiSettings4Line size={15} /> Settings
          </button>
          <button className={`${styles.sidebarBtn} ${styles.sidebarBtnDanger}`} onClick={handleLogout}>
            <RiLogoutBoxRLine size={15} /> Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={styles.main}>
        <div className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button className={styles.menuBtn} onClick={() => setSidebar(p => !p)}>
              {sidebarOpen ? <MdClose size={17} /> : <MdOutlineMenu size={17} />}
            </button>
            <div className={styles.intentToggleHeader}>
              <button
                className={`${styles.headerIntentBtn} ${intent === 'buy' ? styles.headerIntentActive : ''}`}
                onClick={() => handleIntentChange('buy')}
              >
                <RiShoppingCartLine size={14} /> Buy
              </button>
              <button
                className={`${styles.headerIntentBtn} ${intent === 'sell' ? styles.headerIntentActive : ''}`}
                onClick={() => handleIntentChange('sell')}
              >
                <RiStore3Line size={14} /> Sell
              </button>
            </div>
          </div>
          <div className={styles.topbarRight}>
            <button className={styles.topbarIconBtn} onClick={() => setSection('notifications')}>
              <RiBellLine size={15} />
              {unread > 0 && <div className={styles.notifBadge} />}
            </button>
            <div className={styles.topbarIconBtn}>
              <RiUserLine size={15} />
            </div>
          </div>
        </div>

        <div className={styles.content}>
          {section === 'marketplace' && (
            <SectionMarketplace 
              listings={filteredListings} 
              cropFilter={cropFilter} 
              setCropFilter={setCropFilter} 
              intent={intent} 
              onRequestToBuy={handleRequestToBuy} 
            />
          )}
          {section === 'myStore' && (
            <SectionMyStore listings={myListings} onRefresh={refresh} />
          )}
          {section === 'sell' && (
            <SectionPostListing user={user} onSuccess={() => { refresh(); setSection('marketplace') }} />
          )}
          {section === 'buy' && (
            <SectionPostDemand 
              user={user} 
              onResult={(r) => { 
                refresh() 
                setModal({ type: r.matched ? 'match' : 'waitlist', data: r })
              }} 
            />
          )}
          {section === 'matches' && (
            <SectionMatches matches={matches} userId={user.id} />
          )}
          {section === 'requests' && (
            <SectionRequests 
              requests={myRequests} 
              onAccept={handleAcceptRequest} 
              onReject={handleRejectRequest} 
            />
          )}
          {section === 'waitlist' && (
            <SectionWaitlist waitlist={waitlist} />
          )}
          {section === 'notifications' && (
            <SectionNotifications 
              notifs={notifs} 
              onMarkAll={() => { marketService.markAllRead(user.id); refresh() }} 
            />
          )}
        </div>

        {/* Bottom Navigation */}
        <div className={styles.bottomNav}>
          <div className={styles.bottomNavItems}>
            {bottomNavItems.map(item => (
              <button
                key={item.id}
                className={`${styles.bottomNavItem} ${section === item.id ? styles.bottomNavItemActive : ''}`}
                onClick={() => setSection(item.id)}
              >
                <div className={styles.bottomNavIcon}>
                  {item.icon}
                  {item.badge && item.badge > 0 && (
                    <span className={styles.bottomNavBadge}>{item.badge > 99 ? '99+' : item.badge}</span>
                  )}
                </div>
                <span className={styles.bottomNavLabel}>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════
// MARKETPLACE SECTION
// ══════════════════════════════════════════════════════
function SectionMarketplace({ listings, cropFilter, setCropFilter, intent, onRequestToBuy }: {
  listings: Listing[]
  cropFilter: CropType | 'All'
  setCropFilter: (c: CropType | 'All') => void
  intent: Intent
  onRequestToBuy: (l: Listing) => void
}) {
  return (
    <>
      <div className={styles.pageHeader}>
        <div className={styles.pageTitle}>Fresh Produce Marketplace</div>
        <div className={styles.pageSubtitle}>{listings.length} listings available · Browse what farmers have harvested</div>
      </div>
      
      <div className={styles.cropTabs}>
        {(['All', ...CROPS] as (CropType | 'All')[]).map(c => (
          <button
            key={c}
            className={`${styles.cropTab} ${cropFilter === c ? styles.cropTabActive : ''}`}
            onClick={() => setCropFilter(c)}
          >
            {c !== 'All' && CROP_ICON[c as CropType]} {c}
          </button>
        ))}
      </div>

      {listings.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}><RiSeedlingLine size={48} /></div>
          <div className={styles.emptyTitle}>No produce listed yet</div>
          <div className={styles.emptyText}>Check back later for fresh produce from local farmers.</div>
        </div>
      ) : (
        <div className={styles.marketplaceGrid}>
          {listings.map(listing => (
            <ListingCard 
              key={listing.id} 
              listing={listing} 
              intent={intent} 
              onRequestToBuy={onRequestToBuy} 
            />
          ))}
        </div>
      )}
    </>
  )
}

// ══════════════════════════════════════════════════════
// LISTING CARD
// ══════════════════════════════════════════════════════
function ListingCard({ listing, intent, onRequestToBuy }: { 
  listing: Listing
  intent: Intent
  onRequestToBuy: (l: Listing) => void
}) {
  return (
    <div className={styles.marketplaceCard}>
      <div className={styles.cardPhoto}>
        {listing.photoUrl ? (
          <img 
            src={listing.photoUrl} 
            alt={listing.cropType} 
            onError={(e) => {
              (e.target as HTMLImageElement).src = getImageFallback(listing.cropType)
            }}
          />
        ) : (
          <div className={styles.photoPlaceholder}>
            <span className={styles.photoEmoji}>{CROP_ICON[listing.cropType]}</span>
            <span className={styles.photoText}>No photo</span>
          </div>
        )}
        <div className={`${styles.cardBadge} ${styles[CROP_CSS[listing.cropType]]}`}>
          {CROP_ICON[listing.cropType]} {listing.cropType}
        </div>
        {listing.status !== 'available' && (
          <div className={styles.statusOverlay}>
            <span>{listing.status === 'partial' ? 'Partially Sold' : 'Sold Out'}</span>
          </div>
        )}
      </div>
      
      <div className={styles.cardInfo}>
        <div className={styles.sellerRow}>
          <div className={styles.sellerAvatar}>
            <GiFarmer size={16} />
          </div>
          <div>
            <div className={styles.sellerName}>{listing.sellerName}</div>
            <div className={styles.sellerLocation}>
              <RiMapPinLine size={10} /> {listing.location} · {listing.distance || 'nearby'}
            </div>
          </div>
        </div>
        
        <div className={styles.produceStats}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{listing.remainingQty}kg</span>
            <span className={styles.statLabel}>Available</span>
          </div>
          <div className={styles.statDivider}>|</div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>Fresh</span>
            <span className={styles.statLabel}>Quality</span>
          </div>
        </div>
        
        {listing.description && (
          <p className={styles.produceDesc}>
            {listing.description.length > 80 
              ? `${listing.description.substring(0, 80)}...` 
              : listing.description}
          </p>
        )}
        
        {intent === 'buy' && listing.status !== 'sold' && (
          <button className={styles.requestBtn} onClick={() => onRequestToBuy(listing)}>
            Request to Buy
          </button>
        )}
        
        {intent === 'sell' && (
          <button className={styles.yourListingBtn} disabled>
            Your Listing
          </button>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════
// MY STORE SECTION
// ══════════════════════════════════════════════════════
function SectionMyStore({ listings, onRefresh }: { 
  listings: Listing[]
  onRefresh: () => void 
}) {
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)
  const incomingRequests = listings.flatMap(l => l.requests || []).filter(r => r.status === 'pending')
  
  if (selectedListing) {
    return (
      <>
        <button className={styles.backBtn} onClick={() => setSelectedListing(null)}>
          <RiArrowLeftLine size={16} /> Back to My Listings
        </button>
        <SectionRequests 
          requests={selectedListing.requests || []} 
          onAccept={(r) => { 
            marketService.acceptRequest(r.id)
            onRefresh()
            setSelectedListing(null)
          }} 
          onReject={(r) => { 
            marketService.rejectRequest(r.id)
            onRefresh()
          }} 
        />
      </>
    )
  }
  
  if (listings.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}><RiStore3Line size={48} /></div>
        <div className={styles.emptyTitle}>No listings yet</div>
        <div className={styles.emptyText}>Start selling by listing your produce.</div>
      </div>
    )
  }
  
  return (
    <>
      <div className={styles.pageHeader}>
        <div className={styles.pageTitle}>My Store</div>
        <div className={styles.pageSubtitle}>{listings.length} active listings · {incomingRequests.length} pending requests</div>
      </div>
      <div className={styles.marketplaceGrid}>
        {listings.map(listing => (
          <div key={listing.id} className={styles.marketplaceCard} style={{ cursor: 'pointer' }} onClick={() => setSelectedListing(listing)}>
            <div className={styles.cardPhoto}>
              {listing.photoUrl ? (
                <img src={listing.photoUrl} alt={listing.cropType} />
              ) : (
                <div className={styles.photoPlaceholder}>
                  <span className={styles.photoEmoji}>{CROP_ICON[listing.cropType]}</span>
                </div>
              )}
              <div className={`${styles.cardBadge} ${styles[CROP_CSS[listing.cropType]]}`}>
                {CROP_ICON[listing.cropType]} {listing.cropType}
              </div>
            </div>
            <div className={styles.cardInfo}>
              <div className={styles.produceStats}>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>{listing.remainingQty}/{listing.quantity}kg</span>
                  <span className={styles.statLabel}>Remaining</span>
                </div>
                <div className={styles.statDivider}>|</div>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>{listing.requests?.filter(r => r.status === 'pending').length || 0}</span>
                  <span className={styles.statLabel}>Pending</span>
                </div>
              </div>
              <div className={styles.requestBtn} style={{ background: '#f2f4ef', color: '#2d6a35' }}>
                View Requests →
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

// ══════════════════════════════════════════════════════
// POST LISTING SECTION with Camera/File Upload
// ══════════════════════════════════════════════════════
function SectionPostListing({ user, onSuccess }: { user: any; onSuccess: () => void }) {
  const [form, setForm] = useState({
    cropType: 'Maize' as CropType,
    quantity: '',
    location: AKURE_AREAS[0],
    description: '',
    photoUrl: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [imagePreview, setImagePreview] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image is too large. Please choose an image under 5MB.')
        return
      }
      
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setImagePreview(base64String)
        setF('photoUrl', base64String)
      }
      reader.readAsDataURL(file)
    }
  }

  const takePhoto = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64String = reader.result as string
          setImagePreview(base64String)
          setF('photoUrl', base64String)
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.quantity || Number(form.quantity) <= 0) e.quantity = 'Enter a valid quantity'
    if (!form.description.trim()) e.description = 'Add a short description'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 700))
    marketService.postListing({
      sellerId: user.id,
      sellerName: user.name,
      sellerEmail: user.email,
      cropType: form.cropType,
      quantity: Number(form.quantity),
      location: form.location,
      description: form.description,
      photoUrl: form.photoUrl || undefined
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
          
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Available Quantity (kg)</label>
            <input className={styles.fieldInput} type="number" placeholder="e.g. 500" min={1} value={form.quantity} onChange={e => setF('quantity', e.target.value)} />
            {errors.quantity && <span className={styles.fieldErrMsg}>{errors.quantity}</span>}
          </div>
          
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Product Photo</label>
            <div className={styles.photoUploadArea}>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 12 }}>
                <button 
                  type="button" 
                  className={styles.photoUploadBtn}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <RiImageAddLine size={20} /> Choose from Gallery
                </button>
                <button 
                  type="button" 
                  className={styles.photoUploadBtn}
                  onClick={takePhoto}
                >
                  <MdCameraAlt size={18} /> Take Photo
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageSelect}
              />
              <div style={{ fontSize: 12, color: '#9ead9f', textAlign: 'center' }}>
                Upload a clear photo of your produce (max 5MB)
              </div>
              {imagePreview && (
                <div className={styles.imagePreviewContainer}>
                  <img src={imagePreview} className={styles.photoPreview} alt="Preview" />
                  <button 
                    type="button" 
                    className={styles.removePhotoBtn}
                    onClick={() => { setImagePreview(''); setF('photoUrl', '') }}
                  >
                    ✕ Remove
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Description</label>
            <textarea 
              className={styles.fieldTextarea} 
              placeholder="Describe your produce — quality, harvest date, packaging..." 
              value={form.description} 
              onChange={e => setF('description', e.target.value)} 
            />
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
// POST DEMAND SECTION
// ══════════════════════════════════════════════════════
function SectionPostDemand({ user, onResult }: {
  user: any
  onResult: (r: any) => void
}) {
  const [form, setForm] = useState({
    cropType: 'Maize' as CropType,
    quantity: '',
    location: AKURE_AREAS[0]
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.quantity || Number(form.quantity) <= 0) e.quantity = 'Enter a valid quantity'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 900))
    const result = marketService.postDemand({
      buyerId: user.id,
      buyerName: user.name,
      buyerEmail: user.email,
      cropType: form.cropType,
      quantity: Number(form.quantity),
      location: form.location
    })
    setLoading(false)
    onResult(result)
  }

  return (
    <div className={styles.formCard}>
      <div className={styles.formTitle}>Post a Demand</div>
      <div className={styles.formSubtitle}>Tell us what you need. Our system will find the closest seller in Akure.</div>
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
          
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Quantity Needed (kg)</label>
            <input className={styles.fieldInput} type="number" placeholder="e.g. 200" min={1} value={form.quantity} onChange={e => setF('quantity', e.target.value)} />
            {errors.quantity && <span className={styles.fieldErrMsg}>{errors.quantity}</span>}
          </div>
          
          <div style={{ background:'#f2f9e4', border:'1px solid rgba(168,216,50,0.3)', borderRadius:10, padding:'12px 14px', fontSize:13, color:'#2d6a35', fontWeight:600 }}>
            <RiSeedlingLine size={16} style={{ display: 'inline', marginRight: 8 }} />
            Our system will check available sellers in Akure and match you by closest location first.
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
// MATCHES SECTION
// ══════════════════════════════════════════════════════
function SectionMatches({ matches, userId }: { matches: Match[]; userId: string }) {
  if (matches.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}><RiCheckDoubleLine size={48} /></div>
        <div className={styles.emptyTitle}>No matches yet</div>
        <div className={styles.emptyText}>Post a demand or list your produce to get matched.</div>
      </div>
    )
  }
  
  return (
    <div className={styles.matchesList}>
      {matches.map(m => (
        <div key={m.id} className={styles.matchRow}>
          <div className={styles.matchRowLeft}>
            <div className={styles.matchCropRow}>
              <span style={{ fontSize: 20 }}>{CROP_ICON[m.cropType]}</span>
              <span className={styles.matchCropName}>{m.cropType}</span>
            </div>
            <div className={styles.matchParties}>
              {m.sellerId === userId
                ? <>Sold to <strong>{m.buyerName}</strong> · <RiMapPinLine size={10} /> {m.buyerLoc}</>
                : <>Bought from <strong>{m.sellerName}</strong> · <RiMapPinLine size={10} /> {m.sellerLoc}</>
              }
            </div>
          </div>
          <div className={styles.matchStats}>
            <div className={styles.matchStat}>
              <div className={styles.matchStatVal}>{m.quantity}kg</div>
              <div className={styles.matchStatLabel}>Qty</div>
            </div>
            <div className={styles.matchStat}>
              <div className={styles.matchStatVal}>{m.distance}km</div>
              <div className={styles.matchStatLabel}>Distance</div>
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
            <span className={`${styles.matchStatusChip} ${
              m.status === 'confirmed' ? styles.chipConfirmed :
              m.status === 'pending_delivery' ? styles.chipDelivery : styles.chipDelivered
            }`}>{m.status.replace('_', ' ')}</span>
            <span className={styles.matchDate}>{timeAgo(m.matchedAt)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ══════════════════════════════════════════════════════
// REQUESTS SECTION
// ══════════════════════════════════════════════════════
function SectionRequests({ requests, onAccept, onReject }: { 
  requests: Request[]
  onAccept: (r: Request) => void
  onReject: (r: Request) => void
}) {
  if (requests.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}><RiChatCheckLine size={48} /></div>
        <div className={styles.emptyTitle}>No requests yet</div>
        <div className={styles.emptyText}>When buyers request your produce, they'll appear here.</div>
      </div>
    )
  }
  
  return (
    <div className={styles.requestsList}>
      {requests.map(req => (
        <div key={req.id} className={styles.requestCard}>
          <div className={styles.requestHeader}>
            <div className={styles.requestBuyer}>{req.buyerName}</div>
            <div className={`${styles.requestStatus} ${req.status === 'pending' ? styles.statusPending : req.status === 'accepted' ? styles.statusAccepted : styles.statusRejected}`}>
              {req.status}
            </div>
          </div>
          <div className={styles.requestDetails}>
            <div><RiShoppingBagLine size={12} /> {req.requestedQty}kg</div>
            <div><RiTimeLine size={12} /> {timeAgo(req.createdAt)}</div>
          </div>
          {req.message && (
            <div className={styles.requestMessage}>
              <RiChatCheckLine size={12} /> "{req.message}"
            </div>
          )}
          {req.status === 'pending' && (
            <div className={styles.requestActions}>
              <button className={styles.acceptBtn} onClick={() => onAccept(req)}>
                <MdCheckCircle size={16} /> Accept
              </button>
              <button className={styles.rejectBtn} onClick={() => onReject(req)}>
                <MdCancel size={16} /> Decline
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ══════════════════════════════════════════════════════
// WAITLIST SECTION
// ══════════════════════════════════════════════════════
function SectionWaitlist({ waitlist }: { waitlist: Demand[] }) {
  if (waitlist.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}><RiCheckboxCircleLine size={48} /></div>
        <div className={styles.emptyTitle}>Waitlist is clear</div>
        <div className={styles.emptyText}>All your demands have been matched. Great news!</div>
      </div>
    )
  }
  
  return (
    <div className={styles.waitlistList}>
      {waitlist.map(d => (
        <div key={d.id} className={styles.waitlistCard}>
          <div className={styles.waitlistIcon}><GiTruck size={18} /></div>
          <div className={styles.waitlistInfo}>
            <div className={styles.waitlistCrop}>
              {CROP_ICON[d.cropType]} {d.cropType} — {d.quantity}kg
            </div>
            <div className={styles.waitlistMeta}>
              <RiMapPinLine size={10} /> {d.location} · Posted {timeAgo(d.createdAt)}
            </div>
          </div>
          <span className={styles.waitlistBadge}>Waiting</span>
        </div>
      ))}
    </div>
  )
}

// ══════════════════════════════════════════════════════
// NOTIFICATIONS SECTION
// ══════════════════════════════════════════════════════
function SectionNotifications({ notifs, onMarkAll }: {
  notifs: Notification[]
  onMarkAll: () => void
}) {
  if (notifs.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}><RiNotificationLine size={48} /></div>
        <div className={styles.emptyTitle}>No notifications yet</div>
        <div className={styles.emptyText}>When you get matched, your notifications will appear here.</div>
      </div>
    )
  }
  
  return (
    <>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:12 }}>
        <button style={{ fontSize:12, fontWeight:700, color:'#2d6a35', background:'none', border:'none', cursor:'pointer' }} onClick={onMarkAll}>
          Mark all as read
        </button>
      </div>
      <div className={styles.notifList}>
        {notifs.map(n => (
          <div 
            key={n.id} 
            className={`${styles.notifCard} ${!n.read ? styles.notifUnread : ''}`}
            onClick={() => { marketService.markNotifRead(n.id) }}
          >
            <div className={`${styles.notifIconWrap} ${n.type === 'match' ? styles.notiflime : styles.notifamber}`}>
              {n.type === 'match' ? <RiCheckDoubleLine size={16} /> : <GiTruck size={16} />}
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