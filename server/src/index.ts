import express from "express";
import cors from "cors";
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

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}/`);
});
