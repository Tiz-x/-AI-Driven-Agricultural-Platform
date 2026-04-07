// src/services/marketService.ts

export type CropType = 'Maize' | 'Tomato' | 'Cassava' | 'Pepper'

export const AKURE_AREAS = [
  'Oba-Ile', 'Ijapo Estate', 'Oke-Aro', 'Arakale', 'Isolo',
  'Oda', 'Oke-Ogba', 'Ijomu', 'Ayedun', 'Alagbaka'
]

export interface Listing {
  id: string
  sellerId: string
  sellerName: string
  sellerEmail: string
  cropType: CropType
  quantity: number
  remainingQty: number
  location: string
  description: string
  photoUrl?: string
  status: 'available' | 'partial' | 'sold'
  createdAt: string
  distance?: number
  requests?: Request[]
}

export interface Demand {
  id: string
  buyerId: string
  buyerName: string
  buyerEmail: string
  cropType: CropType
  quantity: number
  maxPrice?: number  // Optional - only for internal matching
  location: string
  status: 'pending' | 'matched' | 'expired'
  createdAt: string
}

export interface Request {
  id: string
  listingId: string
  buyerId: string
  buyerName: string
  buyerEmail: string
  requestedQty: number
  message: string
  status: 'pending' | 'accepted' | 'rejected' | 'completed'
  createdAt: string
  updatedAt: string
}

export interface Match {
  id: string
  listingId: string
  demandId?: string
  requestId: string
  cropType: CropType
  buyerId: string
  buyerName: string
  buyerEmail: string
  buyerLoc: string
  sellerId: string
  sellerName: string
  sellerEmail: string
  sellerLoc: string
  quantity: number
  distance: number
  status: 'confirmed' | 'pending_delivery' | 'delivered'
  matchedAt: string
}

export interface Notification {
  id: string
  userId: string
  type: 'request' | 'match' | 'delivery' | 'waitlist'
  title: string
  message: string
  read: boolean
  data?: any
  createdAt: string
}

// Mock data store
let listings: Listing[] = []
let demands: Demand[] = []
let requests: Request[] = []
let matches: Match[] = []
let notifications: Notification[] = []

// Helper functions
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function calculateDistance(loc1: string, loc2: string): number {
  const index1 = AKURE_AREAS.indexOf(loc1)
  const index2 = AKURE_AREAS.indexOf(loc2)
  if (index1 === -1 || index2 === -1) return 15
  return Math.abs(index1 - index2) * 2 + 5
}

// Initialize with sample listings (with photos)
export const marketService = {
  init() {
    if (listings.length === 0) {
      listings = [
        {
          id: '1',
          sellerId: 'seller-1',
          sellerName: 'Adewale Okafor',
          sellerEmail: 'adewale@example.com',
          cropType: 'Maize',
          quantity: 500,
          remainingQty: 500,
          location: 'Oba-Ile',
          description: 'Fresh yellow maize harvested this week. High quality, no pesticides.',
          photoUrl: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400',
          status: 'available',
          createdAt: new Date().toISOString(),
          requests: []
        },
        {
          id: '2',
          sellerId: 'seller-2',
          sellerName: 'Chinonso Eze',
          sellerEmail: 'chinonso@example.com',
          cropType: 'Tomato',
          quantity: 300,
          remainingQty: 300,
          location: 'Ijapo Estate',
          description: 'Ripe organic tomatoes, perfect for cooking and salads.',
          photoUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400',
          status: 'available',
          createdAt: new Date().toISOString(),
          requests: []
        },
        {
          id: '3',
          sellerId: 'seller-3',
          sellerName: 'Folake Adeyemi',
          sellerEmail: 'folake@example.com',
          cropType: 'Cassava',
          quantity: 1000,
          remainingQty: 1000,
          location: 'Oke-Aro',
          description: 'High starch cassava, good for garri and fufu production.',
          photoUrl: 'https://images.unsplash.com/photo-1590164552852-4ff5df7b251d?w=400',
          status: 'available',
          createdAt: new Date().toISOString(),
          requests: []
        },
        {
          id: '4',
          sellerId: 'seller-1',
          sellerName: 'Adewale Okafor',
          sellerEmail: 'adewale@example.com',
          cropType: 'Pepper',
          quantity: 200,
          remainingQty: 150,
          location: 'Oba-Ile',
          description: 'Hot habanero peppers, very spicy and fresh.',
          photoUrl: 'https://images.unsplash.com/photo-1587394929000-7d3c2a4d243f?w=400',
          status: 'partial',
          createdAt: new Date().toISOString(),
          requests: []
        }
      ]
    }
  },

  getListings() {
    return listings.map(l => ({
      ...l,
      distance: calculateDistance(l.location, 'Ijapo Estate')
    }))
  },

  getListingsBySeller(sellerId: string) {
    return listings.filter(l => l.sellerId === sellerId)
  },

  getRequestsByBuyer(buyerId: string) {
    return requests.filter(r => r.buyerId === buyerId)
  },

  getRequestsBySeller(sellerId: string) {
    const sellerListings = listings.filter(l => l.sellerId === sellerId)
    return requests.filter(r => sellerListings.some(l => l.id === r.listingId))
  },

  getMatchesByUser(userId: string) {
    return matches.filter(m => m.buyerId === userId || m.sellerId === userId)
  },

  getWaitlistByUser(userId: string) {
    return demands.filter(d => d.buyerId === userId && d.status === 'pending')
  },

  getNotifications(userId: string) {
    return notifications.filter(n => n.userId === userId).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  },

  postListing(data: Omit<Listing, 'id' | 'remainingQty' | 'status' | 'createdAt' | 'requests'>) {
    const newListing: Listing = {
      id: generateId(),
      remainingQty: data.quantity,
      status: 'available',
      createdAt: new Date().toISOString(),
      requests: [],
      ...data
    }
    listings.unshift(newListing)
    
    // Check for matching demands
    const matchingDemands = demands.filter(d => 
      d.status === 'pending' &&
      d.cropType === data.cropType &&
      d.quantity <= data.quantity &&
      calculateDistance(d.location, data.location) <= 15
    )
    
    matchingDemands.forEach(demand => {
      this.createMatchFromDemand(demand, newListing)
    })
    
    return newListing
  },

  postDemand(data: Omit<Demand, 'id' | 'status' | 'createdAt'>) {
    const newDemand: Demand = {
      id: generateId(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      ...data
    }
    
    // Find matching listings
    const matchingListings = listings.filter(l => 
      l.status !== 'sold' &&
      l.cropType === data.cropType &&
      l.remainingQty >= data.quantity &&
      calculateDistance(l.location, data.location) <= 15
    ).sort((a, b) => (a.distance || 0) - (b.distance || 0))
    
    if (matchingListings.length > 0) {
      const matches = matchingListings.slice(0, 3).map(listing => ({
        listing,
        distance: calculateDistance(listing.location, data.location)
      }))
      return { demand: newDemand, matches, matched: true }
    } else {
      demands.push(newDemand)
      return { demand: newDemand, matches: [], matched: false }
    }
  },

  createRequest(listingId: string, buyerId: string, buyerName: string, buyerEmail: string, requestedQty: number, message: string) {
    const listing = listings.find(l => l.id === listingId)
    if (!listing) throw new Error('Listing not found')
    if (requestedQty > listing.remainingQty) throw new Error('Requested quantity exceeds available')
    
    const newRequest: Request = {
      id: generateId(),
      listingId,
      buyerId,
      buyerName,
      buyerEmail,
      requestedQty,
      message,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    if (!listing.requests) listing.requests = []
    listing.requests.push(newRequest)
    
    // Create notification for seller
    this.addNotification({
      userId: listing.sellerId,
      type: 'request',
      title: 'New Purchase Request',
      message: `${buyerName} wants to buy ${requestedQty}kg of your ${listing.cropType}`,
      data: { requestId: newRequest.id, listingId }
    })
    
    return newRequest
  },

  acceptRequest(requestId: string) {
    const request = this.findRequestById(requestId)
    if (!request) throw new Error('Request not found')
    
    const listing = listings.find(l => l.id === request.listingId)
    if (!listing) throw new Error('Listing not found')
    
    request.status = 'accepted'
    request.updatedAt = new Date().toISOString()
    
    // Update listing quantity
    listing.remainingQty -= request.requestedQty
    if (listing.remainingQty === 0) {
      listing.status = 'sold'
    } else if (listing.remainingQty < listing.quantity) {
      listing.status = 'partial'
    }
    
    // Create match
    const newMatch: Match = {
      id: generateId(),
      listingId: listing.id,
      requestId: request.id,
      cropType: listing.cropType,
      buyerId: request.buyerId,
      buyerName: request.buyerName,
      buyerEmail: request.buyerEmail,
      buyerLoc: 'Akure', // Would come from user profile
      sellerId: listing.sellerId,
      sellerName: listing.sellerName,
      sellerEmail: listing.sellerEmail,
      sellerLoc: listing.location,
      quantity: request.requestedQty,
      distance: calculateDistance(listing.location, 'Akure'),
      status: 'confirmed',
      matchedAt: new Date().toISOString()
    }
    
    matches.push(newMatch)
    
    // Notify buyer
    this.addNotification({
      userId: request.buyerId,
      type: 'match',
      title: 'Request Accepted! 🎉',
      message: `${listing.sellerName} accepted your request for ${request.requestedQty}kg of ${listing.cropType}. Contact them to arrange pickup/delivery.`,
      data: { matchId: newMatch.id }
    })
    
    // Notify seller
    this.addNotification({
      userId: listing.sellerId,
      type: 'match',
      title: 'You have a new match!',
      message: `${request.buyerName} accepted your offer. Contact them to complete the transaction.`,
      data: { matchId: newMatch.id }
    })
    
    return newMatch
  },

  rejectRequest(requestId: string) {
    const request = this.findRequestById(requestId)
    if (!request) throw new Error('Request not found')
    
    request.status = 'rejected'
    request.updatedAt = new Date().toISOString()
    
    const listing = listings.find(l => l.id === request.listingId)
    if (listing?.sellerId) {
      this.addNotification({
        userId: request.buyerId,
        type: 'request',
        title: 'Request Declined',
        message: `Your request for ${request.requestedQty}kg was declined. Try another listing.`,
        data: { requestId }
      })
    }
  },

  findRequestById(requestId: string): Request | undefined {
    for (const listing of listings) {
      const found = listing.requests?.find(r => r.id === requestId)
      if (found) return found
    }
    return undefined
  },

  createMatchFromDemand(demand: Demand, listing: Listing) {
    const request: Request = {
      id: generateId(),
      listingId: listing.id,
      buyerId: demand.buyerId,
      buyerName: demand.buyerName,
      buyerEmail: demand.buyerEmail,
      requestedQty: demand.quantity,
      message: `Auto-matched from your demand for ${demand.quantity}kg`,
      status: 'accepted',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    if (!listing.requests) listing.requests = []
    listing.requests.push(request)
    
    const newMatch: Match = {
      id: generateId(),
      listingId: listing.id,
      requestId: request.id,
      cropType: listing.cropType,
      buyerId: demand.buyerId,
      buyerName: demand.buyerName,
      buyerEmail: demand.buyerEmail,
      buyerLoc: demand.location,
      sellerId: listing.sellerId,
      sellerName: listing.sellerName,
      sellerEmail: listing.sellerEmail,
      sellerLoc: listing.location,
      quantity: demand.quantity,
      distance: calculateDistance(listing.location, demand.location),
      status: 'confirmed',
      matchedAt: new Date().toISOString()
    }
    
    matches.push(newMatch)
    demand.status = 'matched'
    
    this.addNotification({
      userId: demand.buyerId,
      type: 'match',
      title: 'Auto-Match Found! 🎉',
      message: `We found a seller for your ${demand.cropType} demand. Check your matches!`,
      data: { matchId: newMatch.id }
    })
    
    this.addNotification({
      userId: listing.sellerId,
      type: 'match',
      title: 'New Match from Demand',
      message: `${demand.buyerName} needs ${demand.quantity}kg of your ${listing.cropType}`,
      data: { matchId: newMatch.id }
    })
  },

  addNotification(notif: Omit<Notification, 'id' | 'read' | 'createdAt'>) {
    const newNotif: Notification = {
      id: generateId(),
      read: false,
      createdAt: new Date().toISOString(),
      ...notif
    }
    notifications.unshift(newNotif)
  },

  markNotifRead(notifId: string) {
    const notif = notifications.find(n => n.id === notifId)
    if (notif) notif.read = true
  },

  markAllRead(userId: string) {
    notifications.forEach(n => {
      if (n.userId === userId) n.read = true
    })
  },

  updateDeliveryStatus(matchId: string, status: Match['status']) {
    const match = matches.find(m => m.id === matchId)
    if (match) match.status = status
  }
}