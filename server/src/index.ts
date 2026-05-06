import express from "express";
import type { Request, Response } from "express";
import type { NextFunction } from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db, schema } from "./db";
import { eq, and, like, or, desc, inArray } from "drizzle-orm";
import { 
  httpStatusInterceptor, 
  responseLogger, 
  requestLogger,
  corsMiddleware,
  responseFormat 
} from "./interceptors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 9091;
const JWT_SECRET = process.env.JWT_SECRET || "route-planner-secret-key-2024";

// Middleware - 顺序很重要
app.use(corsMiddleware);
app.use(requestLogger);
app.use(responseLogger);
app.use(httpStatusInterceptor);
app.use(responseFormat);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Error handling middleware
const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ success: false, error: err.message || 'Internal server error' });
};

// JWT Authentication middleware
interface AuthRequest extends Request {
  userId?: number;
  user?: { id: number; username: string; email: string };
}

const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Authorization token required' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, decoded.userId)
    });

    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    req.userId = user.id;
    req.user = { id: user.id, username: user.username, email: user.email };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

// ============ Auth APIs ============

// Register
app.post('/api/v1/auth/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, error: 'Username, email and password are required' });
    }

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: or(
        eq(schema.users.username, username),
        eq(schema.users.email, email)
      )
    });

    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Username or email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [newUser] = await db.insert(schema.users).values({
      username,
      email,
      password: hashedPassword,
    }).returning();

    // Generate token
    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      data: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Login
app.post('/api/v1/auth/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(schema.users.email, email)
    });

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get current user
app.get('/api/v1/auth/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  res.status(200).json({
    success: true,
    data: req.user,
  });
});

// ============ Address APIs ============

// Get all addresses (with auth)
app.get('/api/v1/addresses', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const addresses = await db.query.addresses.findMany({
      where: eq(schema.addresses.userId, req.userId!),
      orderBy: desc(schema.addresses.createdAt),
    });

    res.status(200).json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    next(error);
  }
});

// Get single address
app.get('/api/v1/addresses/:id', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string);
    const address = await db.query.addresses.findFirst({
      where: and(
        eq(schema.addresses.id, id),
        eq(schema.addresses.userId, req.userId!)
      ),
    });

    if (!address) {
      return res.status(404).json({ success: false, error: 'Address not found' });
    }

    res.status(200).json({ success: true, data: address });
  } catch (error) {
    next(error);
  }
});

// Create address
app.post('/api/v1/addresses', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, address, latitude, longitude, city } = req.body;

    if (!name || !address || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, error: 'Name, address, latitude and longitude are required' });
    }

    const [newAddress] = await db.insert(schema.addresses).values({
      userId: req.userId!,
      name,
      address,
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      city,
    }).returning();

    res.status(201).json({ success: true, data: newAddress });
  } catch (error) {
    next(error);
  }
});

// Update address
app.put('/api/v1/addresses/:id', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string);
    const { name, address, latitude, longitude, city, isStart, isEnd } = req.body;

    // Check ownership
    const existing = await db.query.addresses.findFirst({
      where: and(
        eq(schema.addresses.id, id),
        eq(schema.addresses.userId, req.userId!)
      ),
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Address not found' });
    }

    const [updated] = await db.update(schema.addresses)
      .set({
        name: name ?? existing.name,
        address: address ?? existing.address,
        latitude: latitude?.toString() ?? existing.latitude,
        longitude: longitude?.toString() ?? existing.longitude,
        city: city ?? existing.city,
        isStart: isStart ?? existing.isStart,
        isEnd: isEnd ?? existing.isEnd,
      })
      .where(eq(schema.addresses.id, id))
      .returning();

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

// Delete address
app.delete('/api/v1/addresses/:id', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string);

    // Check ownership
    const existing = await db.query.addresses.findFirst({
      where: and(
        eq(schema.addresses.id, id),
        eq(schema.addresses.userId, req.userId!)
      ),
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Address not found' });
    }

    await db.delete(schema.addresses).where(eq(schema.addresses.id, id));

    res.status(200).json({ success: true, data: { id } });
  } catch (error) {
    next(error);
  }
});

// ============ Geocode APIs ============

// Geocode address
app.post('/api/v1/geocode', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query } = req.body as { query?: string };
    if (!query) return res.status(400).json({ success: false, error: 'Query is required' });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
    );
    const data = await response.json() as Array<{ lat?: string; lon?: string; display_name?: string }>;

    if (!data || data.length === 0 || !data[0]) {
      return res.status(404).json({ success: false, error: 'Address not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        latitude: parseFloat(data[0].lat || '0'),
        longitude: parseFloat(data[0].lon || '0'),
        displayName: data[0].display_name || '',
      },
    });
  } catch (error) {
    next(error);
  }
});

// Reverse geocode
app.post('/api/v1/reverse-geocode', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { latitude, longitude } = req.body as { latitude?: number; longitude?: number };

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
    );
    const data = await response.json() as { display_name?: string; address?: { city?: string; town?: string; village?: string } };

    res.status(200).json({
      success: true,
      data: {
        displayName: data.display_name || '',
        city: data.address?.city || data.address?.town || data.address?.village || '',
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============ Route APIs ============

// Get all routes (with auth)
app.get('/api/v1/routes', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const routes = await db.query.routes.findMany({
      where: eq(schema.routes.userId, req.userId!),
      orderBy: desc(schema.routes.createdAt),
    });

    res.status(200).json({
      success: true,
      data: routes.map(route => ({
        ...route,
        addressIds: JSON.parse(route.addressIds),
        orderedAddresses: JSON.parse(route.orderedAddresses),
      })),
    });
  } catch (error) {
    next(error);
  }
});

// Get single route
app.get('/api/v1/routes/:id', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string);
    const route = await db.query.routes.findFirst({
      where: and(
        eq(schema.routes.id, id),
        eq(schema.routes.userId, req.userId!)
      ),
    });

    if (!route) {
      return res.status(404).json({ success: false, error: 'Route not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        ...route,
        addressIds: JSON.parse(route.addressIds),
        orderedAddresses: JSON.parse(route.orderedAddresses),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Optimize route
app.post('/api/v1/routes/optimize', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { addressIds, mode = 'shortest' } = req.body;

    if (!addressIds || !Array.isArray(addressIds) || addressIds.length < 2) {
      return res.status(400).json({ success: false, error: 'At least 2 addresses required' });
    }

    // Fetch addresses from database
    const addresses = await db.query.addresses.findMany({
      where: and(
        eq(schema.addresses.userId, req.userId!),
      ),
    });

    const selectedAddresses = addresses.filter(a => addressIds.includes(a.id));
    if (selectedAddresses.length < 2) {
      return res.status(400).json({ success: false, error: 'Not enough valid addresses' });
    }

    // Optimize using algorithms
    const optimized = optimizeAddresses(selectedAddresses, mode);

    res.status(200).json({
      success: true,
      data: {
        addressIds: optimized.map(a => a.id),
        orderedAddresses: optimized,
        totalDistance: calculateTotalDistance(optimized),
        optimizationMode: mode,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Save route
app.post('/api/v1/routes', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, optimizationMode, totalDistance, addressIds, orderedAddresses } = req.body;

    if (!name || !optimizationMode || totalDistance === undefined || !addressIds || !orderedAddresses) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const [newRoute] = await db.insert(schema.routes).values({
      userId: req.userId!,
      name,
      optimizationMode,
      totalDistance: totalDistance.toString(),
      addressIds: JSON.stringify(addressIds),
      orderedAddresses: JSON.stringify(orderedAddresses),
    }).returning();

    res.status(201).json({
      success: true,
      data: {
        ...newRoute,
        addressIds: JSON.parse(newRoute.addressIds),
        orderedAddresses: JSON.parse(newRoute.orderedAddresses),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Delete route
app.delete('/api/v1/routes/:id', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string);

    const existing = await db.query.routes.findFirst({
      where: and(
        eq(schema.routes.id, id),
        eq(schema.routes.userId, req.userId!)
      ),
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Route not found' });
    }

    await db.delete(schema.routes).where(eq(schema.routes.id, id));

    res.status(200).json({ success: true, data: { id } });
  } catch (error) {
    next(error);
  }
});

// ============ Utility APIs ============

// Calculate distance
app.post('/api/v1/distance', async (req: Request, res: Response) => {
  const { from, to } = req.body;
  const distance = haversineDistance(from.latitude, from.longitude, to.latitude, to.longitude);
  res.status(200).json({ success: true, data: { distance, unit: 'km' } });
});

// Generate external map URL
app.post('/api/v1/external-map-url', async (req: Request, res: Response) => {
  const { latitude, longitude, name, provider = 'amap' } = req.body;

  const urls: Record<string, string> = {
    amap: `https://uri.amap.com/navigation?to=${longitude},${latitude},${name || '目的地'}&mode=car&callnative=1`,
    baidu: `https://api.map.baidu.com/direction?destination=latlng:${latitude},${longitude}|name:${name || '目的地'}&mode=driving`,
    google: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
    apple: `http://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`,
  };

  res.status(200).json({ success: true, data: { url: urls[provider] || urls.amap, provider } });
});

// Local geocode (batch)
app.post('/api/v1/geocode/local', async (req: Request, res: Response) => {
  const { query } = req.body as { query?: string };
  if (!query) return res.status(400).json({ success: false, error: 'Query required' });
  
  // Use Nominatim
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
  );
  const data = await response.json() as Array<{ lat?: string; lon?: string; display_name?: string }>;

  if (data && data.length > 0 && data[0]) {
    res.status(200).json({
      success: true,
      data: {
        latitude: parseFloat(data[0].lat || '0'),
        longitude: parseFloat(data[0].lon || '0'),
        displayName: data[0].display_name || '',
      },
    });
  } else {
    res.status(404).json({ success: false, error: 'Address not found' });
  }
});

// Nominatim geocode
app.post('/api/v1/geocode/nominatim', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query } = req.body as { query?: string };
    if (!query) return res.status(400).json({ success: false, error: 'Query required' });
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
    );
    const data = await response.json() as Array<{ lat?: string; lon?: string; display_name?: string }>;

    if (data && data.length > 0 && data[0]) {
      res.status(200).json({
        success: true,
        data: {
          latitude: parseFloat(data[0].lat || '0'),
          longitude: parseFloat(data[0].lon || '0'),
          displayName: data[0].display_name || '',
        },
      });
    } else {
      res.status(404).json({ success: false, error: 'Address not found' });
    }
  } catch (error) {
    next(error);
  }
});

// Batch geocode
app.post('/api/v1/geocode/batch', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { addresses } = req.body as { addresses?: Array<{ name: string; address: string }> };

    if (!addresses || !Array.isArray(addresses)) {
      return res.status(400).json({ success: false, error: 'Addresses array required' });
    }

    const results = await Promise.all(
      addresses.map(async (addr) => {
        try {
          const query = `${addr.name}, ${addr.address}`;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
          );
          const data = await response.json() as Array<{ lat?: string; lon?: string }>;

          if (data && data.length > 0 && data[0]) {
            return {
              success: true,
              data: {
                name: addr.name,
                address: addr.address,
                latitude: parseFloat(data[0].lat || '0'),
                longitude: parseFloat(data[0].lon || '0'),
              },
            };
          }
          return { success: false, error: 'Not found', name: addr.name, address: addr.address };
        } catch {
          return { success: false, error: 'Request failed', name: addr.name, address: addr.address };
        }
      })
    );

    res.status(200).json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
});

// ============ Attraction APIs ============

// Get attractions (public, seeded from places)
app.get('/api/v1/attractions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { city, category, region, search, limit = 20, offset = 0 } = req.query;

    let attractions = await db.query.attractions.findMany({
      limit: Number(limit),
      offset: Number(offset),
    });

    // Filter in memory for simplicity
    if (city) attractions = attractions.filter(a => a.city.includes(city as string));
    if (category) attractions = attractions.filter(a => a.category === category);
    if (region) attractions = attractions.filter(a => a.region === region);
    if (search) {
      const searchLower = (search as string).toLowerCase();
      attractions = attractions.filter(a =>
        a.name.toLowerCase().includes(searchLower) ||
        a.address.toLowerCase().includes(searchLower)
      );
    }

    res.status(200).json({
      success: true,
      data: {
        items: attractions,
        total: attractions.length,
        limit: Number(limit),
        offset: Number(offset),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get attraction by ID
app.get('/api/v1/attractions/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string);
    const attraction = await db.query.attractions.findFirst({
      where: eq(schema.attractions.id, id),
    });

    if (!attraction) {
      return res.status(404).json({ success: false, error: 'Attraction not found' });
    }

    res.status(200).json({ success: true, data: attraction });
  } catch (error) {
    next(error);
  }
});

// Get cities list
app.get('/api/v1/attractions/cities/list', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const attractions = await db.query.attractions.findMany();
    const cityCounts = attractions.reduce((acc, a) => {
      acc[a.city] = (acc[a.city] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.status(200).json({
      success: true,
      data: Object.entries(cityCounts).map(([city, count]) => ({ city, count })),
    });
  } catch (error) {
    next(error);
  }
});

// Add attraction to user addresses
app.post('/api/v1/addresses/from-attraction/:id', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const attractionId = parseInt(req.params.id as string);
    
    // Get attraction
    const attraction = await db.query.attractions.findFirst({
      where: eq(schema.attractions.id, attractionId),
    });

    if (!attraction) {
      return res.status(404).json({ success: false, error: 'Attraction not found' });
    }

    // Create address from attraction
    const [newAddress] = await db.insert(schema.addresses).values({
      userId: req.userId!,
      name: attraction.name,
      address: attraction.address,
      latitude: attraction.latitude,
      longitude: attraction.longitude,
      isStart: false,
      isEnd: false,
    }).returning();

    res.status(201).json({ success: true, data: newAddress });
  } catch (error) {
    next(error);
  }
});

// Batch add attractions to user addresses
app.post('/api/v1/addresses/from-attractions', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { attractionIds } = req.body as { attractionIds?: number[] };

    if (!attractionIds || !Array.isArray(attractionIds)) {
      return res.status(400).json({ success: false, error: 'Attraction IDs required' });
    }

    // Get attractions
    const attractions = await db.query.attractions.findMany({
      where: inArray(schema.attractions.id, attractionIds),
    });

    if (attractions.length === 0) {
      return res.status(404).json({ success: false, error: 'No attractions found' });
    }

    // Create addresses from attractions
    const addressesToInsert = attractions.map(a => ({
      userId: req.userId!,
      name: a.name,
      address: a.address,
      latitude: a.latitude,
      longitude: a.longitude,
      isStart: false,
      isEnd: false,
    }));

    const newAddresses = await db.insert(schema.addresses).values(addressesToInsert).returning();

    res.status(201).json({ 
      success: true, 
      data: {
        added: newAddresses.length,
        addresses: newAddresses,
      }
    });
  } catch (error) {
    next(error);
  }
});

// ============ Health Check ============

app.get('/api/v1/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============ API 文档 ============
import docsRouter from './routes/docs';
app.use('/api/v1', docsRouter);

// ============ Static Files (Production) ============

const clientDistPath = path.join(__dirname, '..', 'dist-client');

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

app.use(express.static(clientDistPath, {
  maxAge: '1h',
  fallthrough: true,
}));

app.get('*', (req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Error handler
app.use(errorHandler);

// ============ Utility Functions ============

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateTotalDistance(addresses: any[]): number {
  let total = 0;
  for (let i = 0; i < addresses.length - 1; i++) {
    total += haversineDistance(
      parseFloat(addresses[i].latitude),
      parseFloat(addresses[i].longitude),
      parseFloat(addresses[i + 1].latitude),
      parseFloat(addresses[i + 1].longitude)
    );
  }
  return Math.round(total * 100) / 100;
}

function optimizeAddresses(addresses: any[], mode: string): any[] {
  if (addresses.length <= 2) return addresses;

  // TSP Greedy Algorithm
  const result: any[] = [];
  const used = new Set<number>();
  const start = addresses[0];

  result.push(start);
  used.add(start.id);

  let current = start;
  while (used.size < addresses.length) {
    let nearest: any = null;
    let minDist = Infinity;

    for (const addr of addresses) {
      if (!used.has(addr.id)) {
        const dist = haversineDistance(
          parseFloat(current.latitude),
          parseFloat(current.longitude),
          parseFloat(addr.latitude),
          parseFloat(addr.longitude)
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

  // 2-opt optimization for balanced mode
  if (mode === 'balanced' && result.length >= 4) {
    return twoOpt(result);
  }

  return result;
}

function twoOpt(addresses: any[]): any[] {
  let best = [...addresses];
  let improved = true;
  let iter = 0;

  while (improved && iter < 100) {
    improved = false;
    iter++;

    for (let i = 0; i < best.length - 2; i++) {
      for (let j = i + 2; j < best.length; j++) {
        const delta =
          haversineDistance(parseFloat(best[i].latitude), parseFloat(best[i].longitude), parseFloat(best[j].latitude), parseFloat(best[j].longitude)) +
          haversineDistance(parseFloat(best[i + 1].latitude), parseFloat(best[i + 1].longitude), parseFloat(best[j + 1]?.latitude || best[j].latitude), parseFloat(best[j + 1]?.longitude || best[j].longitude)) -
          haversineDistance(parseFloat(best[i].latitude), parseFloat(best[i].longitude), parseFloat(best[i + 1].latitude), parseFloat(best[i + 1].longitude)) -
          haversineDistance(parseFloat(best[j].latitude), parseFloat(best[j].longitude), parseFloat(best[j + 1]?.latitude || best[j].latitude), parseFloat(best[j + 1]?.longitude || best[j].longitude));

        if (delta < -0.0001) {
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

// ============ Seed Attractions Data ============

async function seedAttractions() {
  try {
    const existing = await db.query.attractions.findMany({ limit: 1 });
    if (existing.length > 0) {
      console.log('Attractions already seeded');
      return;
    }

    const attractions = [
      // 北京
      { name: "天安门广场", address: "北京市东城区天安门广场", latitude: "39.9073", longitude: "116.3910", city: "北京", category: "景点", region: "华北" },
      { name: "故宫博物院", address: "北京市东城区景山前街4号", latitude: "39.9163", longitude: "116.3972", city: "北京", category: "景点", region: "华北" },
      { name: "王府井大街", address: "北京市东城区王府井大街", latitude: "39.9143", longitude: "116.4105", city: "北京", category: "商场", region: "华北" },
      { name: "长城", address: "北京市延庆区八达岭镇", latitude: "40.3576", longitude: "116.5704", city: "北京", category: "景点", region: "华北" },
      { name: "颐和园", address: "北京市海淀区新建宫门路19号", latitude: "39.9998", longitude: "116.4669", city: "北京", category: "景点", region: "华北" },
      { name: "鸟巢", address: "北京市朝阳区国家体育场南路1号", latitude: "39.9909", longitude: "116.3915", city: "北京", category: "地标", region: "华北" },
      { name: "南锣鼓巷", address: "北京市东城区南锣鼓巷", latitude: "39.9379", longitude: "116.4037", city: "北京", category: "景点", region: "华北" },
      { name: "三里屯", address: "北京市朝阳区三里屯", latitude: "39.9366", longitude: "116.4497", city: "北京", category: "商场", region: "华北" },
      // 上海
      { name: "外滩", address: "上海市黄浦区中山东一路", latitude: "31.2405", longitude: "121.4901", city: "上海", category: "景点", region: "华东" },
      { name: "东方明珠", address: "上海市浦东新区世纪大道1号", latitude: "31.2397", longitude: "121.4998", city: "上海", category: "景点", region: "华东" },
      { name: "南京路步行街", address: "上海市黄浦区南京东路", latitude: "31.2375", longitude: "121.4852", city: "上海", category: "商场", region: "华东" },
      { name: "豫园", address: "上海市黄浦区豫园", latitude: "31.2276", longitude: "121.4901", city: "上海", category: "景点", region: "华东" },
      { name: "田子坊", address: "上海市黄浦区泰康路210弄", latitude: "31.2166", longitude: "121.4703", city: "上海", category: "景点", region: "华东" },
      // 广州
      { name: "广州塔", address: "广州市海珠区阅江西路222号", latitude: "23.1086", longitude: "113.3189", city: "广州", category: "地标", region: "华南" },
      { name: "上下九步行街", address: "广州市荔湾区上下九步行街", latitude: "23.1196", longitude: "113.2385", city: "广州", category: "商场", region: "华南" },
      { name: "北京路步行街", address: "广州市越秀区北京路", latitude: "23.1297", longitude: "113.2665", city: "广州", category: "商场", region: "华南" },
      { name: "白云山", address: "广州市白云区白云山", latitude: "23.1823", longitude: "113.2668", city: "广州", category: "景点", region: "华南" },
      // 深圳
      { name: "世界之窗", address: "深圳市南山区深南大道9037号", latitude: "22.5395", longitude: "113.9738", city: "深圳", category: "景点", region: "华南" },
      { name: "东门步行街", address: "深圳市罗湖区东门步行街", latitude: "22.5485", longitude: "114.1319", city: "深圳", category: "商场", region: "华南" },
      { name: "欢乐谷", address: "深圳市南山区侨城西街18号", latitude: "22.5401", longitude: "113.9849", city: "深圳", category: "景点", region: "华南" },
      // 成都
      { name: "宽窄巷子", address: "成都市青羊区长顺街", latitude: "30.6598", longitude: "104.0569", city: "成都", category: "景点", region: "西南" },
      { name: "春熙路", address: "成都市锦江区春熙路", latitude: "30.6587", longitude: "104.1354", city: "成都", category: "商场", region: "西南" },
      { name: "大熊猫繁育研究基地", address: "成都市成华区外北熊猫大道1375号", latitude: "30.7405", longitude: "104.1521", city: "成都", category: "景点", region: "西南" },
      { name: "锦里古街", address: "成都市武侯区武侯祠大街231号", latitude: "30.6512", longitude: "104.0587", city: "成都", category: "景点", region: "西南" },
      // 杭州
      { name: "西湖", address: "杭州市西湖区西湖", latitude: "30.2467", longitude: "120.1488", city: "杭州", category: "景点", region: "华东" },
      { name: "灵隐寺", address: "杭州市西湖区灵隐路法云弄1号", latitude: "30.2367", longitude: "120.0965", city: "杭州", category: "景点", region: "华东" },
      { name: "河坊街", address: "杭州市上城区河坊街", latitude: "30.2447", longitude: "120.1667", city: "杭州", category: "商场", region: "华东" },
      { name: "宋城", address: "杭州市西湖区之江路148号", latitude: "30.1295", longitude: "120.0499", city: "杭州", category: "景点", region: "华东" },
      // 南京
      { name: "夫子庙", address: "南京市秦淮区夫子庙", latitude: "32.0133", longitude: "118.7872", city: "南京", category: "景点", region: "华东" },
      { name: "中山陵", address: "南京市玄武区中山陵园", latitude: "32.0603", longitude: "118.8585", city: "南京", category: "景点", region: "华东" },
      { name: "新街口", address: "南京市玄武区中山路", latitude: "32.0475", longitude: "118.7903", city: "南京", category: "商场", region: "华东" },
      // 武汉
      { name: "黄鹤楼", address: "武汉市武昌区蛇山西山坡特1号", latitude: "30.5486", longitude: "114.3039", city: "武汉", category: "景点", region: "华中" },
      { name: "武汉大学", address: "武汉市武昌区珞珈山路16号", latitude: "30.5358", longitude: "114.3669", city: "武汉", category: "景点", region: "华中" },
      { name: "户部巷", address: "武汉市武昌区自由路", latitude: "30.5432", longitude: "114.2958", city: "武汉", category: "美食", region: "华中" },
      // 西安
      { name: "秦始皇兵马俑", address: "西安市临潼区秦始皇帝陵博物院", latitude: "34.3843", longitude: "109.2785", city: "西安", category: "景点", region: "西北" },
      { name: "大雁塔", address: "西安市雁塔区雁塔南路", latitude: "34.2190", longitude: "108.9603", city: "西安", category: "景点", region: "西北" },
      { name: "回民街", address: "西安市莲湖区北院门街道", latitude: "34.2655", longitude: "108.9431", city: "西安", category: "美食", region: "西北" },
      { name: "钟楼", address: "西安市碑林区东大街和北大街交汇处", latitude: "34.2625", longitude: "108.9433", city: "西安", category: "景点", region: "西北" },
      // 重庆
      { name: "解放碑", address: "重庆市渝中区解放碑步行街", latitude: "29.5589", longitude: "106.5784", city: "重庆", category: "景点", region: "西南" },
      { name: "洪崖洞", address: "重庆市渝中区嘉滨路88号", latitude: "29.5626", longitude: "106.5828", city: "重庆", category: "景点", region: "西南" },
      { name: "磁器口古镇", address: "重庆市沙坪坝区磁南街1号", latitude: "29.5791", longitude: "106.4465", city: "重庆", category: "景点", region: "西南" },
    ];

    await db.insert(schema.attractions).values(attractions);
    console.log(`Seeded ${attractions.length} attractions`);
  } catch (error) {
    console.error('Error seeding attractions:', error);
  }
}

// Start server
app.listen(port, async () => {
  console.log(`Server listening at http://localhost:${port}/`);
  
  // Seed attractions on startup
  await seedAttractions();
});
