/* ═══════════════════════════════════════════════════════
   services/marketService.ts

   Mock marketplace engine — runs entirely in localStorage.
   Real matching algorithm (location + quantity).
   When Node.js backend is ready, replace each function
   body with an API call. The UI never changes.
   ═══════════════════════════════════════════════════════ */

// ── Types ──────────────────────────────────────────────
export type CropType = 'Maize' | 'Tomato' | 'Cassava' | 'Pepper'
export type ListingStatus = 'available' | 'matched' | 'partial' | 'sold'
export type DemandStatus  = 'pending'   | 'matched' | 'waitlist'
export type MatchStatus   = 'confirmed' | 'pending_delivery' | 'delivered'

export interface Listing {
  id:           string
  sellerId:     string
  sellerName:   string
  sellerEmail:  string
  cropType:     CropType
  quantity:     number        // kg
  pricePerKg:   number        // ₦
  location:     string        // Akure area
  description:  string
  status:       ListingStatus
  createdAt:    string
  remainingQty: number
}

export interface Demand {
  id:          string
  buyerId:     string
  buyerName:   string
  buyerEmail:  string
  cropType:    CropType
  quantity:    number
  maxPrice:    number
  location:    string
  status:      DemandStatus
  createdAt:   string
  matchedQty:  number
}

export interface Match {
  id:          string
  listingId:   string
  demandId:    string
  sellerId:    string
  sellerName:  string
  sellerEmail: string
  buyerId:     string
  buyerName:   string
  buyerEmail:  string
  cropType:    CropType
  quantity:    number
  pricePerKg:  number
  totalPrice:  number
  sellerLoc:   string
  buyerLoc:    string
  distance:    number        // km (simulated)
  status:      MatchStatus
  matchedAt:   string
  notification: 'sent' | 'pending'
}

export interface Notification {
  id:        string
  userId:    string
  type:      'match' | 'waitlist' | 'delivery' | 'system'
  title:     string
  message:   string
  read:      boolean
  createdAt: string
}

// ── Akure Areas + distance matrix ──────────────────────
// Real Akure neighbourhoods for location matching
export const AKURE_AREAS = [
  'Adegbola', 'Alagbaka', 'Araromi', 'Ijoka',
  'Isinkan', 'FUTA Road', 'Oba-Ile', 'Oke-Irese',
  'Shagari Village', 'Isikan', 'Oyemekun', 'Okuta-Pupa',
]

// Simulated distance between any two Akure areas (km)
function getDistance(loc1: string, loc2: string): number {
  if (loc1 === loc2) return 0
  // Seed a consistent pseudo-random distance 1–15km based on names
  const seed = (loc1.charCodeAt(0) + loc2.charCodeAt(0)) % 14 + 1
  return seed
}

// ── Storage keys ────────────────────────────────────────
const KEYS = {
  listings:      'agf_listings',
  demands:       'agf_demands',
  matches:       'agf_matches',
  notifications: 'agf_notifications',
}

// ── Helpers ─────────────────────────────────────────────
function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}
function now(): string {
  return new Date().toISOString()
}
function read<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) ?? '[]') } catch { return [] }
}
function write<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data))
}

// ── Seed demo data (first time only) ───────────────────
function seedIfEmpty() {
  if (read(KEYS.listings).length > 0) return

  const listings: Listing[] = [
    {
      id: uid(), sellerId: 'seller-001', sellerName: 'Musa Ibrahim',
      sellerEmail: 'musa@farm.ng', cropType: 'Maize', quantity: 500,
      remainingQty: 500, pricePerKg: 180, location: 'Alagbaka',
      description: 'Fresh maize, harvested this week. Grade A quality.',
      status: 'available', createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: uid(), sellerId: 'seller-002', sellerName: 'Taiwo Adeyemi',
      sellerEmail: 'taiwo@farm.ng', cropType: 'Tomato', quantity: 200,
      remainingQty: 200, pricePerKg: 320, location: 'Oba-Ile',
      description: 'Ripe tomatoes, firm and fresh. Ready for immediate pickup.',
      status: 'available', createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      id: uid(), sellerId: 'seller-003', sellerName: 'Ngozi Okonkwo',
      sellerEmail: 'ngozi@farm.ng', cropType: 'Cassava', quantity: 800,
      remainingQty: 800, pricePerKg: 120, location: 'Isinkan',
      description: 'Premium cassava, suitable for garri and starch processing.',
      status: 'available', createdAt: new Date(Date.now() - 259200000).toISOString(),
    },
    {
      id: uid(), sellerId: 'seller-004', sellerName: 'Emeka Obi',
      sellerEmail: 'emeka@farm.ng', cropType: 'Pepper', quantity: 150,
      remainingQty: 150, pricePerKg: 550, location: 'FUTA Road',
      description: 'Hot pepper (Tatashe blend), sun-dried and fresh mix available.',
      status: 'available', createdAt: new Date(Date.now() - 345600000).toISOString(),
    },
    {
      id: uid(), sellerId: 'seller-005', sellerName: 'Funke Balogun',
      sellerEmail: 'funke@farm.ng', cropType: 'Maize', quantity: 300,
      remainingQty: 300, pricePerKg: 170, location: 'Ijoka',
      description: 'Yellow maize, dried and bagged. Large quantities available.',
      status: 'available', createdAt: new Date(Date.now() - 432000000).toISOString(),
    },
    {
      id: uid(), sellerId: 'seller-006', sellerName: 'Adebayo Ojo',
      sellerEmail: 'adebayo@farm.ng', cropType: 'Tomato', quantity: 100,
      remainingQty: 100, pricePerKg: 300, location: 'Oyemekun',
      description: 'Cherry tomatoes, perfect for restaurants and hotels.',
      status: 'available', createdAt: new Date(Date.now() - 518400000).toISOString(),
    },
  ]

  write(KEYS.listings, listings)
}

// ── CORE MATCHING ENGINE ─────────────────────────────────
// This is the real logic that will power the backend too.
// Matches by: 1) same crop 2) quantity 3) closest location
function runMatchingEngine(
  newDemand: Demand,
  listings:  Listing[],
): { matched: Listing[]; totalQty: number } {
  // Step 1: Filter available listings for same crop
  const eligible = listings.filter(
    l => l.cropType === newDemand.cropType &&
         l.status !== 'sold' &&
         l.remainingQty > 0 &&
         l.sellerId !== newDemand.buyerId
  )
  if (eligible.length === 0) return { matched: [], totalQty: 0 }

  // Step 2: Sort by distance (closest first — Akure proximity)
  const withDistance = eligible.map(l => ({
    listing:  l,
    distance: getDistance(l.location, newDemand.location),
  }))
  withDistance.sort((a, b) => a.distance - b.distance)

  // Step 3: Greedily fill demand quantity
  let remaining = newDemand.quantity
  const matched: Listing[] = []

  for (const { listing } of withDistance) {
    if (remaining <= 0) break
    matched.push(listing)
    remaining -= listing.remainingQty
  }

  const totalQty = matched.reduce((s, l) => s + Math.min(l.remainingQty, newDemand.quantity), 0)
  return { matched, totalQty: Math.min(totalQty, newDemand.quantity) }
}

// ── Notification helper ─────────────────────────────────
function addNotification(userId: string, notif: Omit<Notification, 'id' | 'createdAt'>) {
  const notifs = read<Notification>(KEYS.notifications)
  notifs.unshift({ ...notif, id: uid(), createdAt: now() })
  write(KEYS.notifications, notifs.slice(0, 50)) // keep last 50
}

// ── PUBLIC API ───────────────────────────────────────────
export const marketService = {

  // ── init ──
  init() { seedIfEmpty() },

  // ── LISTINGS ──
  getListings(): Listing[] {
    return read<Listing>(KEYS.listings)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },

  getListingsByUser(userId: string): Listing[] {
    return read<Listing>(KEYS.listings).filter(l => l.sellerId === userId)
  },

  postListing(data: Omit<Listing, 'id' | 'createdAt' | 'status' | 'remainingQty'>): Listing {
    const listings = read<Listing>(KEYS.listings)
    const listing: Listing = {
      ...data,
      id:          uid(),
      status:      'available',
      remainingQty: data.quantity,
      createdAt:   now(),
    }
    listings.unshift(listing)
    write(KEYS.listings, listings)

    // After posting a listing, check if any waiting demands can be matched
    marketService._checkWaitlistForListing(listing)

    return listing
  },

  // ── DEMANDS ──
  getDemands(): Demand[] {
    return read<Demand>(KEYS.demands)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },

  getDemandsByUser(userId: string): Demand[] {
    return read<Demand>(KEYS.demands).filter(d => d.buyerId === userId)
  },

  postDemand(data: Omit<Demand, 'id' | 'createdAt' | 'status' | 'matchedQty'>): {
    demand: Demand
    matches: Match[]
    matched: boolean
  } {
    const listings = read<Listing>(KEYS.listings)
    const demand: Demand = {
      ...data,
      id:         uid(),
      status:     'pending',
      matchedQty: 0,
      createdAt:  now(),
    }

    // Run matching engine
    const { matched: matchedListings, totalQty } = runMatchingEngine(demand, listings)

    const newMatches: Match[] = []

    if (matchedListings.length > 0) {
      demand.status     = 'matched'
      demand.matchedQty = totalQty

      let remaining = demand.quantity

      // Create match records + update listing quantities
      const updatedListings = read<Listing>(KEYS.listings)
      for (const listing of matchedListings) {
        if (remaining <= 0) break
        const qty  = Math.min(listing.remainingQty, remaining)
        remaining -= qty

        const match: Match = {
          id:          uid(),
          listingId:   listing.id,
          demandId:    demand.id,
          sellerId:    listing.sellerId,
          sellerName:  listing.sellerName,
          sellerEmail: listing.sellerEmail,
          buyerId:     demand.buyerId,
          buyerName:   demand.buyerName,
          buyerEmail:  demand.buyerEmail,
          cropType:    demand.cropType,
          quantity:    qty,
          pricePerKg:  listing.pricePerKg,
          totalPrice:  qty * listing.pricePerKg,
          sellerLoc:   listing.location,
          buyerLoc:    demand.location,
          distance:    getDistance(listing.location, demand.location),
          status:      'confirmed',
          matchedAt:   now(),
          notification: 'sent',
        }
        newMatches.push(match)

        // Update listing remaining quantity
        const li = updatedListings.find(l => l.id === listing.id)
        if (li) {
          li.remainingQty -= qty
          if (li.remainingQty <= 0) li.status = 'sold'
          else if (li.remainingQty < li.quantity) li.status = 'partial'
        }
      }

      write(KEYS.listings, updatedListings)

      // Save matches
      const allMatches = read<Match>(KEYS.matches)
      write(KEYS.matches, [...newMatches, ...allMatches])

      // Send notifications (mock)
      for (const match of newMatches) {
        addNotification(match.buyerId, {
          userId:  match.buyerId,
          type:    'match',
          title:   '🎉 Match Found!',
          message: `We matched you with ${match.sellerName} for ${match.quantity}kg of ${match.cropType} at ₦${match.pricePerKg}/kg. Total: ₦${match.totalPrice.toLocaleString()}. Distance: ${match.distance}km.`,
          read:    false,
        })
        addNotification(match.sellerId, {
          userId:  match.sellerId,
          type:    'match',
          title:   '🎉 Buyer Found!',
          message: `${match.buyerName} wants to buy ${match.quantity}kg of your ${match.cropType} at ₦${match.pricePerKg}/kg. Total: ₦${match.totalPrice.toLocaleString()}. Distance: ${match.distance}km.`,
          read:    false,
        })
      }

    } else {
      // No match — add to waitlist
      demand.status = 'waitlist'
      addNotification(demand.buyerId, {
        userId:  demand.buyerId,
        type:    'waitlist',
        title:   '⏳ Added to Waitlist',
        message: `No seller found for ${demand.quantity}kg of ${demand.cropType} right now. We'll notify you the moment one becomes available in Akure.`,
        read:    false,
      })
    }

    // Save demand
    const demands = read<Demand>(KEYS.demands)
    demands.unshift(demand)
    write(KEYS.demands, demands)

    return { demand, matches: newMatches, matched: newMatches.length > 0 }
  },

  // When a new listing is posted, try to match waiting demands
  _checkWaitlistForListing(newListing: Listing) {
    const demands  = read<Demand>(KEYS.demands)
    const waitlist = demands.filter(
      d => d.status === 'waitlist' && d.cropType === newListing.cropType
    )

    for (const demand of waitlist) {
      const listings = read<Listing>(KEYS.listings)
      const { matched: matchedListings, totalQty } = runMatchingEngine(demand, listings)
      if (matchedListings.length > 0) {
        // Re-run full postDemand logic for this demand
        // (simplified: just notify — full re-match happens on backend)
        addNotification(demand.buyerId, {
          userId:  demand.buyerId,
          type:    'match',
          title:   '🎉 Match Now Available!',
          message: `A seller just listed ${newListing.quantity}kg of ${newListing.cropType} near you in Akure. Check the marketplace to confirm your order!`,
          read:    false,
        })
      }
    }
  },

  // ── Direct buy (manual — buyer picks listing themselves) ──
  buyDirectly(listingId: string, buyer: { id: string; name: string; email: string }, qty: number): Match | null {
    const listings = read<Listing>(KEYS.listings)
    const listing  = listings.find(l => l.id === listingId)
    if (!listing || listing.remainingQty < qty) return null

    const match: Match = {
      id:          uid(),
      listingId:   listing.id,
      demandId:    'direct-' + uid(),
      sellerId:    listing.sellerId,
      sellerName:  listing.sellerName,
      sellerEmail: listing.sellerEmail,
      buyerId:     buyer.id,
      buyerName:   buyer.name,
      buyerEmail:  buyer.email,
      cropType:    listing.cropType,
      quantity:    qty,
      pricePerKg:  listing.pricePerKg,
      totalPrice:  qty * listing.pricePerKg,
      sellerLoc:   listing.location,
      buyerLoc:    'Akure',
      distance:    getDistance(listing.location, 'Alagbaka'),
      status:      'confirmed',
      matchedAt:   now(),
      notification: 'sent',
    }

    // Update listing
    listing.remainingQty -= qty
    if (listing.remainingQty <= 0) listing.status = 'sold'
    else listing.status = 'partial'
    write(KEYS.listings, listings)

    // Save match
    const matches = read<Match>(KEYS.matches)
    matches.unshift(match)
    write(KEYS.matches, matches)

    // Notify both
    addNotification(buyer.id, {
      userId:  buyer.id,
      type:    'match',
      title:   '✅ Purchase Confirmed!',
      message: `You bought ${qty}kg of ${listing.cropType} from ${listing.sellerName} for ₦${match.totalPrice.toLocaleString()}. Delivery will be scheduled shortly.`,
      read:    false,
    })
    addNotification(listing.sellerId, {
      userId:  listing.sellerId,
      type:    'match',
      title:   '✅ Sale Confirmed!',
      message: `${buyer.name} purchased ${qty}kg of your ${listing.cropType} for ₦${match.totalPrice.toLocaleString()}.`,
      read:    false,
    })

    return match
  },

  // ── MATCHES ──
  getMatches(): Match[] {
    return read<Match>(KEYS.matches)
      .sort((a, b) => new Date(b.matchedAt).getTime() - new Date(a.matchedAt).getTime())
  },

  getMatchesByUser(userId: string): Match[] {
    return read<Match>(KEYS.matches).filter(
      m => m.buyerId === userId || m.sellerId === userId
    ).sort((a, b) => new Date(b.matchedAt).getTime() - new Date(a.matchedAt).getTime())
  },

  // ── NOTIFICATIONS ──
  getNotifications(userId: string): Notification[] {
    return read<Notification>(KEYS.notifications)
      .filter(n => n.userId === userId)
  },

  markNotifRead(id: string) {
    const notifs = read<Notification>(KEYS.notifications)
    const n = notifs.find(n => n.id === id)
    if (n) { n.read = true; write(KEYS.notifications, notifs) }
  },

  markAllRead(userId: string) {
    const notifs = read<Notification>(KEYS.notifications)
    notifs.filter(n => n.userId === userId).forEach(n => n.read = true)
    write(KEYS.notifications, notifs)
  },

  unreadCount(userId: string): number {
    return read<Notification>(KEYS.notifications)
      .filter(n => n.userId === userId && !n.read).length
  },

  // ── WAITLIST ──
  getWaitlist(): Demand[] {
    return read<Demand>(KEYS.demands)
      .filter(d => d.status === 'waitlist')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },

  getWaitlistByUser(userId: string): Demand[] {
    return read<Demand>(KEYS.demands)
      .filter(d => d.buyerId === userId && d.status === 'waitlist')
  },

  // ── CLEAR all data (dev only) ──
  clearAll() {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k))
  },
}