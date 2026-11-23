import 'dotenv/config'
import { connectDB, getCollection } from './db.js'

const host = {
  ownerName: 'Maya Okafor',
  ownerEmail: 'host@studora.com',
  ownerImage: ''
}

const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000)

const studios = [
  {
    title: 'Glasshouse Studios',
    category: 'Photo studio',
    hourlyRate: 130,
    securityDeposit: 300,
    maxCapacity: 25,
    location: 'Wynwood, Miami, FL',
    image: '/images/host-cyc-studio.jpg',
    gallery: ['/images/host-cyc-studio.jpg', '/images/creators-in-studio.jpg', '/images/photo-studio-northlight.jpg'],
    amenities: ['24 ft hard cyc', 'Floor-to-ceiling windows', 'Profoto strobe kit', 'Makeup station', 'Wi-Fi', 'Freight elevator'],
    overview: 'A bright corner studio with a 24 ft hard cyc and a full wall of windows. Morning light floods the floor, and blackout curtains turn it into a strobe room in minutes. Great for fashion, product and campaign shoots.',
    rating: 4.94,
    reviewCount: 88,
    createdAt: daysAgo(40)
  },
  {
    title: 'Northlight Daylight Studio',
    category: 'Photo studio',
    hourlyRate: 85,
    securityDeposit: 200,
    maxCapacity: 12,
    location: 'Gowanus, Brooklyn, NY',
    image: '/images/photo-studio-northlight.jpg',
    gallery: ['/images/photo-studio-northlight.jpg', '/images/host-cyc-studio.jpg', '/images/creative-loft.jpg'],
    amenities: ['North-facing skylights', 'Paper backdrops', 'C-stands and flags', 'Steamer', 'Kitchenette', 'Wi-Fi'],
    overview: 'Soft, even north light all day long. Northlight is a calm second-floor studio loved by portrait and editorial photographers who want natural light without the harsh shadows.',
    rating: 4.92,
    reviewCount: 128,
    createdAt: daysAgo(35)
  },
  {
    title: 'Stage Seven Cine Stage',
    category: 'Film stage',
    hourlyRate: 240,
    securityDeposit: 800,
    maxCapacity: 40,
    location: 'Westside, Atlanta, GA',
    image: '/images/film-stage.jpg',
    gallery: ['/images/film-stage.jpg', '/images/creators-on-location.jpg', '/images/green-screen.jpg'],
    amenities: ['Sound-treated stage', 'Lighting grid', '400A power', 'Drive-in load door', 'Green room', 'Parking for 20'],
    overview: 'A silent 4,000 sq ft stage with a full lighting grid and drive-in loading. Built for commercials, music videos and narrative shoots that need real power and real quiet.',
    rating: 4.88,
    reviewCount: 64,
    createdAt: daysAgo(30)
  },
  {
    title: 'The Roundtable Podcast Lounge',
    category: 'Podcast room',
    hourlyRate: 65,
    securityDeposit: 100,
    maxCapacity: 4,
    location: 'East Austin, Austin, TX',
    image: '/images/podcast-room.jpg',
    gallery: ['/images/podcast-room.jpg', '/images/music-suite.jpg', '/images/creative-loft.jpg'],
    amenities: ['4 broadcast mics', 'Rodecaster Pro II', '3 camera angles', 'Acoustic panels', 'Engineer on request', 'Wi-Fi'],
    overview: 'A warm, fully treated room set up for four-person conversations. Plug in and record — mics, mixer and three cameras are ready, and files are on a drive before you leave.',
    rating: 4.95,
    reviewCount: 212,
    createdAt: daysAgo(25)
  },
  {
    title: 'Copperline Recording Suite',
    category: 'Music suite',
    hourlyRate: 120,
    securityDeposit: 250,
    maxCapacity: 8,
    location: 'Music Row, Nashville, TN',
    image: '/images/music-suite.jpg',
    gallery: ['/images/music-suite.jpg', '/images/podcast-room.jpg', '/images/film-stage.jpg'],
    amenities: ['Analog console', 'Tuned live room', 'Vocal booth', 'Mic locker', 'Engineer on call', 'Lounge'],
    overview: 'A control room built around an analog console, with a tuned live room and an isolated vocal booth. Bring the band or just a laptop — an engineer can be booked with the room.',
    rating: 4.97,
    reviewCount: 96,
    createdAt: daysAgo(20)
  },
  {
    title: 'Atelier Nine Art Workshop',
    category: 'Art workshop',
    hourlyRate: 45,
    securityDeposit: 80,
    maxCapacity: 16,
    location: 'Pearl District, Portland, OR',
    image: '/images/art-workshop.jpg',
    gallery: ['/images/art-workshop.jpg', '/images/creative-loft.jpg', '/images/photo-studio-northlight.jpg'],
    amenities: ['North light', '12 easels', 'Long work tables', 'Deep sinks', 'Drying racks', 'Wi-Fi'],
    overview: 'A working painters’ studio with north light, easels and long tables. Ideal for classes, life drawing sessions and messy projects — the floors and sinks are made for paint.',
    rating: 4.9,
    reviewCount: 73,
    createdAt: daysAgo(15)
  },
  {
    title: 'Warehouse 21 Creative Loft',
    category: 'Creative loft',
    hourlyRate: 110,
    securityDeposit: 250,
    maxCapacity: 20,
    location: 'Arts District, Los Angeles, CA',
    image: '/images/creative-loft.jpg',
    gallery: ['/images/creative-loft.jpg', '/images/fashion-studio.jpg', '/images/art-workshop.jpg'],
    amenities: ['Furnished sets', 'Exposed brick', 'Natural light', 'Props library', 'Kitchen', 'Street parking'],
    overview: 'An industrial loft with exposed brick, big windows and furniture you can move around. It works as a lifestyle set, a meeting space or a small event room.',
    rating: 4.86,
    reviewCount: 141,
    createdAt: daysAgo(10)
  },
  {
    title: 'Volume Green Screen Stage',
    category: 'Green screen',
    hourlyRate: 310,
    securityDeposit: 900,
    maxCapacity: 30,
    location: 'Media District, Burbank, CA',
    image: '/images/green-screen.jpg',
    gallery: ['/images/green-screen.jpg', '/images/film-stage.jpg', '/images/creators-on-location.jpg'],
    amenities: ['3-wall green cyc', 'Pre-lit key lights', 'Lighting grid', 'Client monitor', 'Makeup room', 'Parking'],
    overview: 'A three-wall green cyc that comes pre-lit for clean keys. Book it for VFX plates, virtual sets and product spins — the crew room and client monitor are included.',
    rating: 4.91,
    reviewCount: 38,
    createdAt: daysAgo(5)
  },
  {
    title: 'Ringlight Fashion Studio',
    category: 'Fashion studio',
    hourlyRate: 95,
    securityDeposit: 150,
    maxCapacity: 10,
    location: 'Garment District, New York, NY',
    image: '/images/fashion-studio.jpg',
    gallery: ['/images/fashion-studio.jpg', '/images/creators-in-studio.jpg', '/images/host-cyc-studio.jpg'],
    amenities: ['Ring lights', 'Clothing rails', 'Steamer', 'Glam station', 'Seamless paper', 'Wi-Fi'],
    overview: 'A compact fashion studio with ring lights, rails and a glam station ready to go. Perfect for lookbooks, e-commerce days and content shoots.',
    rating: 4.89,
    reviewCount: 157,
    createdAt: daysAgo(2)
  }
]

const seed = async () => {
  await connectDB()
  const collection = getCollection('studios')

  const removed = await collection.deleteMany({ ownerEmail: host.ownerEmail })
  const result = await collection.insertMany(studios.map((studio) => ({ ...studio, ...host })))

  console.log(`Removed ${removed.deletedCount} old sample studios`)
  console.log(`Added ${result.insertedCount} sample studios`)
  process.exit(0)
}

seed().catch((error) => {
  console.error('Seeding failed', error)
  process.exit(1)
})
