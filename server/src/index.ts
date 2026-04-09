import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { addresses, routes, type Address, type Route } from "./schema";

const app = express();
const port = process.env.PORT || 9091;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Database connection (mock for demo - using in-memory storage)
interface AddressItem {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  city?: string;
  isStart: boolean;
  isEnd: boolean;
  orderIndex: number;
  createdAt: Date;
}

interface RouteItem {
  id: number;
  name: string;
  optimizationMode: string;
  totalDistance: number;
  addressIds: number[];
  orderedAddresses: AddressItem[];
  createdAt: Date;
}

interface PopularAttraction {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  city: string;
  category: string;
  region: string;
}

// In-memory storage
let addressesList: AddressItem[] = [
  {
    id: 1,
    name: "天安门广场",
    address: "北京市东城区天安门广场",
    latitude: 39.9073,
    longitude: 116.3910,
    city: "北京",
    isStart: false,
    isEnd: false,
    orderIndex: 0,
    createdAt: new Date(),
  },
  {
    id: 2,
    name: "故宫博物院",
    address: "北京市东城区景山前街4号",
    latitude: 39.9163,
    longitude: 116.3972,
    city: "北京",
    isStart: false,
    isEnd: false,
    orderIndex: 1,
    createdAt: new Date(),
  },
  {
    id: 3,
    name: "王府井大街",
    address: "北京市东城区王府井大街",
    latitude: 39.9143,
    longitude: 116.4105,
    city: "北京",
    isStart: false,
    isEnd: false,
    orderIndex: 2,
    createdAt: new Date(),
  },
];

let routesList: RouteItem[] = [];
let nextAddressId = 4;
let nextRouteId = 1;

// Haversine formula to calculate distance between two coordinates
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate total route distance
function calculateTotalDistance(addresses: AddressItem[]): number {
  let total = 0;
  for (let i = 0; i < addresses.length - 1; i++) {
    total += haversineDistance(
      addresses[i].latitude,
      addresses[i].longitude,
      addresses[i + 1].latitude,
      addresses[i + 1].longitude
    );
  }
  return Math.round(total * 100) / 100;
}

// TSP Greedy Algorithm
function tspGreedy(addresses: AddressItem[], startIndex: number = 0, endIndex: number = -1): AddressItem[] {
  if (addresses.length <= 2) return [...addresses];
  
  const result: AddressItem[] = [];
  const used = new Set<number>();
  
  // Determine start and end points
  let start = addresses[startIndex];
  if (endIndex >= 0 && endIndex < addresses.length) {
    start = addresses[endIndex];
  }
  
  result.push(start);
  used.add(start.id);
  
  let current = start;
  while (used.size < addresses.length) {
    let nearest: AddressItem | null = null;
    let minDist = Infinity;
    
    for (const addr of addresses) {
      if (!used.has(addr.id)) {
        const dist = haversineDistance(
          current.latitude,
          current.longitude,
          addr.latitude,
          addr.longitude
        );
        if (dist < minDist) {
          minDist = dist;
          nearest = addr;
        }
      }
    }
    
    if (nearest) {
      result.push(nearest);
      used.add(nearest.id);
      current = nearest;
    }
  }
  
  return result;
}

// 2-opt optimization
function twoOpt(addresses: AddressItem[], iterations: number = 100): AddressItem[] {
  if (addresses.length < 4) return addresses;
  
  let best = [...addresses];
  let improved = true;
  let iter = 0;
  
  while (improved && iter < iterations) {
    improved = false;
    iter++;
    
    for (let i = 0; i < best.length - 2; i++) {
      for (let j = i + 2; j < best.length; j++) {
        const delta = haversineDistance(best[i].latitude, best[i].longitude, best[j].latitude, best[j].longitude) +
          haversineDistance(best[i + 1].latitude, best[i + 1].longitude, best[j + 1].latitude, best[j + 1].longitude) -
          haversineDistance(best[i].latitude, best[i].longitude, best[i + 1].latitude, best[i + 1].longitude) -
          haversineDistance(best[j].latitude, best[j].longitude, best[j + 1].latitude, best[j + 1].longitude);
        
        if (delta < -0.0001) {
          // Reverse segment between i+1 and j
          const newRoute = [
            ...best.slice(0, i + 1),
            ...best.slice(i + 1, j + 1).reverse(),
            ...best.slice(j + 1),
          ];
          best = newRoute;
          improved = true;
        }
      }
    }
  }
  
  return best;
}

// Health check
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============ Address APIs ============

// Get all addresses
app.get('/api/v1/addresses', (req, res) => {
  res.status(200).json({
    success: true,
    data: addressesList.sort((a, b) => a.orderIndex - b.orderIndex),
  });
});

// Get single address
app.get('/api/v1/addresses/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const address = addressesList.find((a) => a.id === id);
  
  if (!address) {
    return res.status(404).json({ success: false, error: 'Address not found' });
  }
  
  res.status(200).json({ success: true, data: address });
});

// Create address
app.post('/api/v1/addresses', (req, res) => {
  const { name, address, latitude, longitude, city } = req.body;
  
  if (!name || !address || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }
  
  const newAddress: AddressItem = {
    id: nextAddressId++,
    name,
    address,
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    city: city || '',
    isStart: false,
    isEnd: false,
    orderIndex: addressesList.length,
    createdAt: new Date(),
  };
  
  addressesList.push(newAddress);
  res.status(201).json({ success: true, data: newAddress });
});

// Update address
app.put('/api/v1/addresses/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = addressesList.findIndex((a) => a.id === id);
  
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Address not found' });
  }
  
  const { name, address, latitude, longitude, city, isStart, isEnd, orderIndex } = req.body;
  
  addressesList[index] = {
    ...addressesList[index],
    name: name ?? addressesList[index].name,
    address: address ?? addressesList[index].address,
    latitude: latitude !== undefined ? parseFloat(latitude) : addressesList[index].latitude,
    longitude: longitude !== undefined ? parseFloat(longitude) : addressesList[index].longitude,
    city: city ?? addressesList[index].city,
    isStart: isStart ?? addressesList[index].isStart,
    isEnd: isEnd ?? addressesList[index].isEnd,
    orderIndex: orderIndex ?? addressesList[index].orderIndex,
  };
  
  res.status(200).json({ success: true, data: addressesList[index] });
});

// Delete address
app.delete('/api/v1/addresses/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = addressesList.findIndex((a) => a.id === id);
  
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Address not found' });
  }
  
  addressesList.splice(index, 1);
  res.status(200).json({ success: true, message: 'Address deleted' });
});

// Geocode address using Nominatim
app.post('/api/v1/geocode', async (req, res) => {
  const { query } = req.body;
  
  if (!query) {
    return res.status(400).json({ success: false, error: 'Query is required' });
  }
  
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`,
      {
        headers: {
          'User-Agent': 'RoutePlannerApp/1.0',
        },
      }
    );
    
    const data = await response.json() as Array<{
      lat: string;
      lon: string;
      display_name: string;
      address?: { city?: string; town?: string; village?: string; county?: string };
    }>;
    
    if (data && data.length > 0) {
      res.status(200).json({
        success: true,
        data: {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
          displayName: data[0].display_name,
          city: extractCity(data[0]),
        },
      });
    } else {
      res.status(404).json({ success: false, error: 'Address not found' });
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({ success: false, error: 'Geocoding failed' });
  }
});

// Reverse geocode
app.post('/api/v1/reverse-geocode', async (req, res) => {
  const { latitude, longitude } = req.body;
  
  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({ success: false, error: 'Latitude and longitude are required' });
  }
  
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
      {
        headers: {
          'User-Agent': 'RoutePlannerApp/1.0',
        },
      }
    );
    
    const data = await response.json() as {
      display_name: string;
      address?: { city?: string; town?: string; village?: string; county?: string };
    };
    
    res.status(200).json({
      success: true,
      data: {
        displayName: data.display_name,
        city: extractCity(data),
      },
    });
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    res.status(500).json({ success: false, error: 'Reverse geocoding failed' });
  }
});

function extractCity(data: any): string {
  const components = data.address || {};
  return (
    components.city ||
    components.town ||
    components.village ||
    components.county ||
    ''
  );
}

// ============ Route APIs ============

// Get all routes
app.get('/api/v1/routes', (req, res) => {
  res.status(200).json({
    success: true,
    data: routesList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
  });
});

// Get single route
app.get('/api/v1/routes/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const route = routesList.find((r) => r.id === id);
  
  if (!route) {
    return res.status(404).json({ success: false, error: 'Route not found' });
  }
  
  res.status(200).json({ success: true, data: route });
});

// Optimize route
app.post('/api/v1/routes/optimize', (req, res) => {
  const { addressIds, mode = 'shortest' } = req.body;
  
  if (!addressIds || !Array.isArray(addressIds) || addressIds.length < 2) {
    return res.status(400).json({
      success: false,
      error: 'At least 2 addresses are required',
    });
  }
  
  // Get addresses by IDs
  const selectedAddresses = addressIds
    .map((id: number) => addressesList.find((a) => a.id === id))
    .filter(Boolean) as AddressItem[];
  
  if (selectedAddresses.length < 2) {
    return res.status(400).json({
      success: false,
      error: 'Not enough valid addresses',
    });
  }
  
  // Check for start/end points
  const startAddr = selectedAddresses.find((a) => a.isStart);
  const endAddr = selectedAddresses.find((a) => a.isEnd);
  let optimizedAddresses: AddressItem[];
  
  if (mode === 'balanced') {
    // Multiple iterations of 2-opt
    let bestRoute = selectedAddresses;
    let bestDistance = calculateTotalDistance(bestRoute);
    
    for (let i = 0; i < 5; i++) {
      const shuffled = [...selectedAddresses].sort(() => Math.random() - 0.5);
      const optimized = twoOpt(tspGreedy(shuffled), 200);
      const distance = calculateTotalDistance(optimized);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestRoute = optimized;
      }
    }
    optimizedAddresses = bestRoute;
  } else if (mode === 'regional') {
    // Greedy with more 2-opt iterations
    const greedy = tspGreedy(selectedAddresses);
    optimizedAddresses = twoOpt(greedy, 150);
  } else {
    // Shortest: Greedy + single 2-opt
    const greedy = tspGreedy(selectedAddresses);
    optimizedAddresses = twoOpt(greedy, 100);
  }
  
  // Apply start/end constraints
  if (startAddr) {
    const startIndex = optimizedAddresses.findIndex((a) => a.id === startAddr.id);
    if (startIndex > 0) {
      optimizedAddresses = [
        startAddr,
        ...optimizedAddresses.filter((a) => a.id !== startAddr.id),
      ];
    }
  }
  
  if (endAddr) {
    const endIndex = optimizedAddresses.findIndex((a) => a.id === endAddr.id);
    if (endIndex < optimizedAddresses.length - 1 && endIndex !== -1) {
      optimizedAddresses = [
        ...optimizedAddresses.filter((a) => a.id !== endAddr.id),
        endAddr,
      ];
    }
  }
  
  const totalDistance = calculateTotalDistance(optimizedAddresses);
  
  // Create route
  const newRoute: RouteItem = {
    id: nextRouteId++,
    name: `路线 ${routesList.length + 1}`,
    optimizationMode: mode,
    totalDistance,
    addressIds: optimizedAddresses.map((a) => a.id),
    orderedAddresses: optimizedAddresses,
    createdAt: new Date(),
  };
  
  routesList.push(newRoute);
  
  res.status(201).json({
    success: true,
    data: newRoute,
  });
});

// Save route
app.post('/api/v1/routes', (req, res) => {
  const { name, optimizationMode, totalDistance, addressIds, orderedAddresses } = req.body;
  
  if (!name || !optimizationMode || totalDistance === undefined) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }
  
  const newRoute: RouteItem = {
    id: nextRouteId++,
    name,
    optimizationMode,
    totalDistance,
    addressIds: addressIds || [],
    orderedAddresses: orderedAddresses || [],
    createdAt: new Date(),
  };
  
  routesList.push(newRoute);
  res.status(201).json({ success: true, data: newRoute });
});

// Delete route
app.delete('/api/v1/routes/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = routesList.findIndex((r) => r.id === id);
  
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Route not found' });
  }
  
  routesList.splice(index, 1);
  res.status(200).json({ success: true, message: 'Route deleted' });
});

// Calculate distance between two points
app.post('/api/v1/distance', (req, res) => {
  const { from, to } = req.body;
  
  if (!from || !to || !from.latitude || !from.longitude || !to.latitude || !to.longitude) {
    return res.status(400).json({ success: false, error: 'Invalid coordinates' });
  }
  
  const distance = haversineDistance(
    from.latitude,
    from.longitude,
    to.latitude,
    to.longitude
  );
  
  res.status(200).json({
    success: true,
    data: {
      distance: Math.round(distance * 100) / 100,
      unit: 'km',
    },
  });
});

// External map URL generation
app.post('/api/v1/external-map-url', (req, res) => {
  const { latitude, longitude, name, provider = 'amap' } = req.body;
  
  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({ success: false, error: 'Latitude and longitude are required' });
  }
  
  let url = '';
  
  switch (provider) {
    case 'amap':
      // 高德地图
      url = `https://uri.amap.com/navigation?to=${longitude},${latitude},${encodeURIComponent(name || '目的地')}&mode=car&callnative=1`;
      break;
    case 'baidu':
      // 百度地图
      url = `baidumap://map/direction?destination=name:${name || '目的地'}|latlng:${latitude},${longitude}&coord_type=gcj02&mode=driving`;
      break;
    case 'google':
      // 谷歌地图
      url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      break;
    default:
      url = `https://maps.apple.com/?ll=${latitude},${longitude}&q=${encodeURIComponent(name || '目的地')}`;
  }
  
  res.status(200).json({
    success: true,
    data: { url, provider },
  });
});

// ============ Geocoding APIs (Three-level Fallback Strategy) ============

// Level 1: Local attractions database lookup
app.post('/api/v1/geocode/local', async (req, res) => {
  const { query } = req.body;
  
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ success: false, error: 'Query is required' });
  }
  
  const queryLower = query.toLowerCase();
  const results = popularAttractions.filter(a => 
    a.name.toLowerCase().includes(queryLower) ||
    a.address.toLowerCase().includes(queryLower) ||
    a.city.toLowerCase().includes(queryLower)
  ).slice(0, 10);
  
  res.status(200).json({
    success: true,
    data: {
      results: results.map(a => ({
        name: a.name,
        address: a.address,
        latitude: a.latitude,
        longitude: a.longitude,
        city: a.city,
        type: 'local',
      })),
      source: 'local_database',
    },
  });
});

// Level 2: Nominatim OpenStreetMap API
interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
  class?: string;
  importance?: number;
}

app.post('/api/v1/geocode/nominatim', async (req, res) => {
  const { query } = req.body;
  
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ success: false, error: 'Query is required' });
  }
  
  try {
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=5&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'RoutePlannerApp/1.0',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error('Nominatim API error');
    }
    
    const data = await response.json() as NominatimResult[];
    
    res.status(200).json({
      success: true,
      data: {
        results: data.map(item => ({
          name: item.display_name.split(',')[0],
          address: item.display_name,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          type: item.type,
          importance: item.importance,
          city: extractCityFromAddress(item.display_name),
        })),
        source: 'nominatim',
      },
    });
  } catch (error) {
    res.status(200).json({
      success: true,
      data: {
        results: [],
        source: 'nominatim',
        error: 'Nominatim service unavailable',
      },
    });
  }
});

// Level 3: Batch Geocoding API
app.post('/api/v1/geocode/batch', async (req, res) => {
  const { addresses } = req.body;
  
  if (!addresses || !Array.isArray(addresses)) {
    return res.status(400).json({ success: false, error: 'Addresses array is required' });
  }
  
  if (addresses.length > 50) {
    return res.status(400).json({ success: false, error: 'Maximum 50 addresses allowed per batch' });
  }
  
  const results: Array<{
    original: string;
    success: boolean;
    latitude?: number;
    longitude?: number;
    address?: string;
    source?: string;
    error?: string;
  }> = [];
  
  // Process each address with fallback strategy
  for (const address of addresses) {
    // Try local database first
    const localMatch = popularAttractions.find(a => 
      a.name.toLowerCase().includes(address.toLowerCase()) ||
      a.address.toLowerCase().includes(address.toLowerCase())
    );
    
    if (localMatch) {
      results.push({
        original: address,
        success: true,
        latitude: localMatch.latitude,
        longitude: localMatch.longitude,
        address: localMatch.address,
        source: 'local',
      });
      continue;
    }
    
    // Try Nominatim
    try {
      const encodedQuery = encodeURIComponent(address);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=1`,
        {
          headers: {
            'User-Agent': 'RoutePlannerApp/1.0',
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json() as NominatimResult[];
        if (data.length > 0) {
          results.push({
            original: address,
            success: true,
            latitude: parseFloat(data[0].lat),
            longitude: parseFloat(data[0].lon),
            address: data[0].display_name,
            source: 'nominatim',
          });
          continue;
        }
      }
    } catch (e) {
      // Continue to error case
    }
    
    // Failed to geocode
    results.push({
      original: address,
      success: false,
      error: 'Could not geocode address',
      source: 'failed',
    });
  }
  
  res.status(200).json({
    success: true,
    data: {
      results,
      total: addresses.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
    },
  });
});

// ============ Place Search Suggestions API ============

app.get('/api/v1/places/search', async (req, res) => {
  const { q, city, type, limit = 10 } = req.query;
  
  if (!q || typeof q !== 'string') {
    return res.status(400).json({ success: false, error: 'Query parameter q is required' });
  }
  
  const query = q.toLowerCase();
  let suggestions: Array<{
    text: string;
    type: string;
    category?: string;
    city?: string;
    placeId?: number;
  }> = [];
  
  // Search local attractions
  const matchedAttractions = popularAttractions.filter(a => 
    a.name.toLowerCase().includes(query) ||
    a.address.toLowerCase().includes(query)
  );
  
  // Filter by city if specified
  const filteredAttractions = city && typeof city === 'string'
    ? matchedAttractions.filter(a => a.city.includes(city))
    : matchedAttractions;
  
  suggestions.push(...filteredAttractions.slice(0, Number(limit)).map(a => ({
    text: `${a.name} (${a.city})`,
    type: 'attraction',
    category: a.category,
    city: a.city,
    placeId: a.id,
  })));
  
  // Search saved addresses
  const matchedAddresses = addressesList.filter(a =>
    a.name.toLowerCase().includes(query) ||
    a.address.toLowerCase().includes(query)
  );
  
  suggestions.push(...matchedAddresses.slice(0, Number(limit)).map(a => ({
    text: `${a.name} - ${a.address}`,
    type: 'saved_address',
    city: a.city,
  })));
  
  res.status(200).json({
    success: true,
    data: {
      suggestions: suggestions.slice(0, Number(limit)),
      query: q,
    },
  });
});

// ============ Place Details API ============

app.get('/api/v1/places/:id', (req, res) => {
  const id = parseInt(req.params.id);
  
  // Check local attractions first
  const attraction = popularAttractions.find(a => a.id === id);
  if (attraction) {
    return res.status(200).json({
      success: true,
      data: {
        id: attraction.id,
        name: attraction.name,
        address: attraction.address,
        latitude: attraction.latitude,
        longitude: attraction.longitude,
        city: attraction.city,
        category: attraction.category,
        region: attraction.region,
        type: 'attraction',
      },
    });
  }
  
  // Check saved addresses
  const address = addressesList.find(a => a.id === id);
  if (address) {
    return res.status(200).json({
      success: true,
      data: {
        id: address.id,
        name: address.name,
        address: address.address,
        latitude: address.latitude,
        longitude: address.longitude,
        city: address.city,
        isStart: address.isStart,
        isEnd: address.isEnd,
        type: 'saved_address',
      },
    });
  }
  
  res.status(404).json({ success: false, error: 'Place not found' });
});

// Helper function to extract city from Nominatim address
function extractCityFromAddress(displayName: string): string {
  const parts = displayName.split(',');
  // Try to find city in the address parts
  for (let i = 0; i < Math.min(3, parts.length); i++) {
    const part = parts[i].trim();
    // Check if it looks like a city name (usually in Chinese or with common suffixes)
    if (part.match(/市|区|县|省/) || part.match(/City|District/)) {
      return part;
    }
  }
  // Return the first part as fallback
  return parts[0]?.trim() || '';
}

// ============ Popular Attractions Database ============

// 60+ Popular attractions across major Chinese cities
const popularAttractions: PopularAttraction[] = [
  // 北京
  { id: 1001, name: "故宫博物院", address: "北京市东城区景山前街4号", latitude: 39.9163, longitude: 116.3972, city: "北京", category: "景点", region: "华北" },
  { id: 1002, name: "天安门广场", address: "北京市东城区天安门广场", latitude: 39.9073, longitude: 116.3910, city: "北京", category: "景点", region: "华北" },
  { id: 1003, name: "长城", address: "北京市延庆区八达岭长城", latitude: 40.3580, longitude: 116.6040, city: "北京", category: "景点", region: "华北" },
  { id: 1004, name: "颐和园", address: "北京市海淀区新建宫门路19号", latitude: 39.9993, longitude: 116.4652, city: "北京", category: "景点", region: "华北" },
  { id: 1005, name: "天坛公园", address: "北京市东城区天坛路甲1号", latitude: 39.8814, longitude: 116.4106, city: "北京", category: "景点", region: "华北" },
  { id: 1006, name: "鸟巢", address: "北京市朝阳区国家体育场南路1号", latitude: 39.9929, longitude: 116.4042, city: "北京", category: "景点", region: "华北" },
  { id: 1007, name: "王府井步行街", address: "北京市东城区王府井大街", latitude: 39.9149, longitude: 116.4099, city: "北京", category: "购物", region: "华北" },
  // 上海
  { id: 2001, name: "外滩", address: "上海市黄浦区中山东一路", latitude: 31.2399, longitude: 121.4901, city: "上海", category: "景点", region: "华东" },
  { id: 2002, name: "东方明珠塔", address: "上海市浦东新区世纪大道1号", latitude: 31.2397, longitude: 121.4998, city: "上海", category: "景点", region: "华东" },
  { id: 2003, name: "豫园", address: "上海市黄浦区豫园老街279号", latitude: 31.2275, longitude: 121.4887, city: "上海", category: "景点", region: "华东" },
  { id: 2004, name: "南京路步行街", address: "上海市黄浦区南京路", latitude: 31.2351, longitude: 121.4749, city: "上海", category: "购物", region: "华东" },
  { id: 2005, name: "上海迪士尼度假区", address: "上海市浦东新区川沙镇黄赵路310号", latitude: 31.1432, longitude: 121.6570, city: "上海", category: "景点", region: "华东" },
  { id: 2006, name: "田子坊", address: "上海市黄浦区泰康路210弄", latitude: 31.2168, longitude: 121.4731, city: "上海", category: "景点", region: "华东" },
  // 广州
  { id: 3001, name: "广州塔", address: "广州市海珠区阅江西路222号", latitude: 23.1086, longitude: 113.3189, city: "广州", category: "景点", region: "华南" },
  { id: 3002, name: "白云山", address: "广州市白云区白云山风景名胜区", latitude: 23.1848, longitude: 113.3059, city: "广州", category: "景点", region: "华南" },
  { id: 3003, name: "北京路步行街", address: "广州市越秀区北京路", latitude: 23.1246, longitude: 113.2653, city: "广州", category: "购物", region: "华南" },
  { id: 3004, name: "珠江夜游", address: "广州市越秀区沿江东路", latitude: 23.1132, longitude: 113.2758, city: "广州", category: "景点", region: "华南" },
  { id: 3005, name: "长隆野生动物世界", address: "广州市番禺区大石街", latitude: 22.9755, longitude: 113.3375, city: "广州", category: "景点", region: "华南" },
  // 深圳
  { id: 4001, name: "世界之窗", address: "深圳市南山区深南大道9037号", latitude: 22.5396, longitude: 113.9757, city: "深圳", category: "景点", region: "华南" },
  { id: 4002, name: "东部华侨城", address: "深圳市盐田区大梅沙东部华侨城", latitude: 22.6074, longitude: 114.2993, city: "深圳", category: "景点", region: "华南" },
  { id: 4003, name: "欢乐谷", address: "深圳市南山区侨城西街18号", latitude: 22.5423, longitude: 113.9772, city: "深圳", category: "景点", region: "华南" },
  { id: 4004, name: "大梅沙海滨公园", address: "深圳市盐田区大梅沙盐葵路", latitude: 22.5953, longitude: 114.3065, city: "深圳", category: "景点", region: "华南" },
  // 成都
  { id: 5001, name: "大熊猫繁育研究基地", address: "成都市成华区外北熊猫大道1375号", latitude: 30.7417, longitude: 104.1466, city: "成都", category: "景点", region: "西南" },
  { id: 5002, name: "宽窄巷子", address: "成都市青羊区长顺街附近", latitude: 30.6608, longitude: 104.0569, city: "成都", category: "景点", region: "西南" },
  { id: 5003, name: "锦里古街", address: "成都市武侯区武侯祠大街231号", latitude: 30.6514, longitude: 104.0562, city: "成都", category: "景点", region: "西南" },
  { id: 5004, name: "青城山", address: "成都市都江堰市青城山镇", latitude: 30.8915, longitude: 103.5332, city: "成都", category: "景点", region: "西南" },
  { id: 5005, name: "都江堰景区", address: "成都市都江堰市都江堰大道231号", latitude: 31.0024, longitude: 103.6140, city: "成都", category: "景点", region: "西南" },
  { id: 5006, name: "武侯祠", address: "成都市武侯区武侯祠大街231号", latitude: 30.6512, longitude: 104.0561, city: "成都", category: "景点", region: "西南" },
  // 杭州
  { id: 6001, name: "西湖", address: "杭州市西湖区西湖风景名胜区", latitude: 30.2468, longitude: 120.1483, city: "杭州", category: "景点", region: "华东" },
  { id: 6002, name: "灵隐寺", address: "杭州市西湖区灵隐路法云弄1号", latitude: 30.2379, longitude: 120.0920, city: "杭州", category: "景点", region: "华东" },
  { id: 6003, name: "宋城", address: "杭州市西湖区之江路148号", latitude: 30.1319, longitude: 120.0443, city: "杭州", category: "景点", region: "华东" },
  { id: 6004, name: "千岛湖", address: "杭州市淳安县千岛湖镇", latitude: 29.8826, longitude: 119.0322, city: "杭州", category: "景点", region: "华东" },
  { id: 6005, name: "雷峰塔", address: "杭州市西湖区南山路15号", latitude: 30.2433, longitude: 120.1486, city: "杭州", category: "景点", region: "华东" },
  // 南京
  { id: 7001, name: "中山陵", address: "南京市玄武区中山陵园街道", latitude: 32.0611, longitude: 118.8577, city: "南京", category: "景点", region: "华东" },
  { id: 7002, name: "夫子庙秦淮风光带", address: "南京市秦淮区夫子庙", latitude: 32.0134, longitude: 118.7874, city: "南京", category: "景点", region: "华东" },
  { id: 7003, name: "南京总统府", address: "南京市玄武区长江路292号", latitude: 32.0286, longitude: 118.7869, city: "南京", category: "景点", region: "华东" },
  { id: 7004, name: "玄武湖", address: "南京市玄武区玄武巷1号", latitude: 32.0810, longitude: 118.7894, city: "南京", category: "景点", region: "华东" },
  { id: 7005, name: "明孝陵", address: "南京市玄武区石象路7号", latitude: 32.0606, longitude: 118.8552, city: "南京", category: "景点", region: "华东" },
  // 武汉
  { id: 8001, name: "黄鹤楼", address: "武汉市武昌区蛇山西山坡特1号", latitude: 30.5486, longitude: 114.3039, city: "武汉", category: "景点", region: "华中" },
  { id: 8002, name: "武汉大学", address: "武汉市武昌区珞珈山路16号", latitude: 30.5358, longitude: 114.3669, city: "武汉", category: "景点", region: "华中" },
  { id: 8003, name: "东湖", address: "武汉市武昌区东湖路特1号", latitude: 30.5522, longitude: 114.3643, city: "武汉", category: "景点", region: "华中" },
  { id: 8004, name: "户部巷", address: "武汉市武昌区自由路", latitude: 30.5432, longitude: 114.2958, city: "武汉", category: "美食", region: "华中" },
  { id: 8005, name: "楚河汉街", address: "武汉市武昌区中北路", latitude: 30.5688, longitude: 114.2763, city: "武汉", category: "购物", region: "华中" },
  // 西安
  { id: 9001, name: "秦始皇兵马俑", address: "西安市临潼区秦始皇帝陵博物院", latitude: 34.3843, longitude: 109.2785, city: "西安", category: "景点", region: "西北" },
  { id: 9002, name: "大雁塔", address: "西安市雁塔区雁塔南路", latitude: 34.2190, longitude: 108.9603, city: "西安", category: "景点", region: "西北" },
  { id: 9003, name: "回民街", address: "西安市莲湖区北院门街道", latitude: 34.2655, longitude: 108.9431, city: "西安", category: "美食", region: "西北" },
  { id: 9004, name: "城墙", address: "西安市新城区环城南路", latitude: 34.2680, longitude: 108.9544, city: "西安", category: "景点", region: "西北" },
  { id: 9005, name: "大唐芙蓉园", address: "西安市雁塔区芙蓉西路99号", latitude: 34.2057, longitude: 108.9745, city: "西安", category: "景点", region: "西北" },
  { id: 9006, name: "钟楼", address: "西安市碑林区东大街和北大街交汇处", latitude: 34.2625, longitude: 108.9433, city: "西安", category: "景点", region: "西北" },
  // 重庆
  { id: 10001, name: "解放碑", address: "重庆市渝中区解放碑步行街", latitude: 29.5589, longitude: 106.5784, city: "重庆", category: "景点", region: "西南" },
  { id: 10002, name: "洪崖洞", address: "重庆市渝中区嘉滨路88号", latitude: 29.5626, longitude: 106.5828, city: "重庆", category: "景点", region: "西南" },
  { id: 10003, name: "磁器口古镇", address: "重庆市沙坪坝区磁南街1号", latitude: 29.5791, longitude: 106.4465, city: "重庆", category: "景点", region: "西南" },
  { id: 10004, name: "长江索道", address: "重庆市渝中区新华路151号", latitude: 29.5537, longitude: 106.5879, city: "重庆", category: "景点", region: "西南" },
  { id: 10005, name: "武隆天生三桥", address: "重庆市武隆区仙女山镇", latitude: 29.4103, longitude: 107.9013, city: "重庆", category: "景点", region: "西南" },
];

// Get popular attractions
app.get('/api/v1/attractions', (req, res) => {
  const { city, category, region, search, limit = 20, offset = 0 } = req.query;
  
  let filtered = [...popularAttractions];
  
  // Filter by city
  if (city && typeof city === 'string') {
    filtered = filtered.filter(a => a.city.includes(city));
  }
  
  // Filter by category
  if (category && typeof category === 'string') {
    filtered = filtered.filter(a => a.category === category);
  }
  
  // Filter by region
  if (region && typeof region === 'string') {
    filtered = filtered.filter(a => a.region === region);
  }
  
  // Search by name
  if (search && typeof search === 'string') {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(a => 
      a.name.toLowerCase().includes(searchLower) ||
      a.address.toLowerCase().includes(searchLower)
    );
  }
  
  // Paginate
  const total = filtered.length;
  const paginated = filtered.slice(Number(offset), Number(offset) + Number(limit));
  
  res.status(200).json({
    success: true,
    data: {
      items: paginated,
      total,
      limit: Number(limit),
      offset: Number(offset),
    },
  });
});

// Get attraction by ID
app.get('/api/v1/attractions/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const attraction = popularAttractions.find(a => a.id === id);
  
  if (!attraction) {
    return res.status(404).json({ success: false, error: 'Attraction not found' });
  }
  
  res.status(200).json({
    success: true,
    data: attraction,
  });
});

// Get all cities with attractions
app.get('/api/v1/attractions/cities/list', (req, res) => {
  const cities = [...new Set(popularAttractions.map(a => a.city))];
  
  res.status(200).json({
    success: true,
    data: cities.map(city => ({
      city,
      count: popularAttractions.filter(a => a.city === city).length,
    })),
  });
});

// Serve static files from dist-client directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDistPath = path.join(__dirname, '..', 'dist-client');

// Serve static assets with long cache
app.use('/_expo', express.static(path.join(clientDistPath, '_expo'), {
  maxAge: '1y',
  immutable: true,
  fallthrough: true,
}));

app.use('/assets', express.static(path.join(clientDistPath, 'assets'), {
  maxAge: '1y',
  immutable: true,
  fallthrough: true,
}));

// Serve main app files
app.use(express.static(clientDistPath, {
  maxAge: '1h',
  fallthrough: true,
}));

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}/`);
});
