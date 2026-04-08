/**
 * 路线优化算法工具
 * 
 * 使用 TSP (旅行商问题) 贪心算法 + 2-opt 优化
 * 支持三种优化模式：
 * - shortest: 最短距离（快速）
 * - balanced: 均衡路线（中等精度）
 * - regional: 区域扫描（高精度）
 */

export interface AddressItem {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  city?: string;
  isStart?: boolean;
  isEnd?: boolean;
}

export interface OptimizationResult {
  orderedAddresses: AddressItem[];
  totalDistance: number;
  mode: 'shortest' | 'balanced' | 'regional';
}

// 使用 Haversine 公式计算两点间距离（公里）
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // 地球半径（公里）
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 计算路线总距离
export function calculateTotalDistance(addresses: AddressItem[]): number {
  let total = 0;
  for (let i = 0; i < addresses.length - 1; i++) {
    const a = addresses[i];
    const b = addresses[i + 1];
    total += haversineDistance(a.latitude, a.longitude, b.latitude, b.longitude);
  }
  return total;
}

// TSP 贪心算法 - 从起点开始，每次选择最近的未访问点
function tspGreedy(addresses: AddressItem[]): AddressItem[] {
  if (addresses.length <= 2) return [...addresses];

  const result: AddressItem[] = [];
  const remaining = new Set(addresses.map((_, i) => i));
  
  // 找到起点（如果设置了 isStart）
  let currentIndex = addresses.findIndex(a => a.isStart);
  if (currentIndex === -1) currentIndex = 0;
  
  result.push(addresses[currentIndex]);
  remaining.delete(currentIndex);

  // 贪心选择
  while (remaining.size > 0) {
    const current = addresses[currentIndex];
    let nearestIndex = -1;
    let nearestDistance = Infinity;

    for (const idx of remaining) {
      const distance = haversineDistance(
        current.latitude,
        current.longitude,
        addresses[idx].latitude,
        addresses[idx].longitude
      );
      
      // 优先选择终点
      if (addresses[idx].isEnd && nearestIndex === -1) {
        nearestIndex = idx;
        nearestDistance = distance;
      } else if (!addresses[idx].isEnd && distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = idx;
      }
    }

    if (nearestIndex !== -1) {
      result.push(addresses[nearestIndex]);
      remaining.delete(nearestIndex);
      currentIndex = nearestIndex;
    }
  }

  return result;
}

// 2-opt 优化算法 - 通过交换边来优化路线
function twoOpt(addresses: AddressItem[], maxIterations: number = 100): AddressItem[] {
  if (addresses.length <= 3) return [...addresses];

  let best = [...addresses];
  let bestDistance = calculateTotalDistance(best);
  let improved = true;
  let iterations = 0;

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    for (let i = 0; i < best.length - 2; i++) {
      for (let j = i + 2; j < best.length; j++) {
        // 反转 i+1 到 j 之间的城市
        const newRoute = [
          ...best.slice(0, i + 1),
          ...best.slice(i + 1, j + 1).reverse(),
          ...best.slice(j + 1),
        ];

        const newDistance = calculateTotalDistance(newRoute);
        
        if (newDistance < bestDistance) {
          best = newRoute;
          bestDistance = newDistance;
          improved = true;
        }
      }
    }
  }

  return best;
}

// 主优化函数
export function optimizeRoute(
  addresses: AddressItem[],
  mode: 'shortest' | 'balanced' | 'regional' = 'shortest'
): OptimizationResult {
  if (addresses.length < 2) {
    return {
      orderedAddresses: [...addresses],
      totalDistance: 0,
      mode,
    };
  }

  // 分离起点和终点
  const startAddr = addresses.find(a => a.isStart);
  const endAddr = addresses.find(a => a.isEnd);
  const middleAddresses = addresses.filter(a => !a.isStart && !a.isEnd);

  let optimizedAddresses: AddressItem[];

  switch (mode) {
    case 'balanced': {
      // 多轮 2-opt 优化
      let bestRoute = middleAddresses;
      let bestDistance = Infinity;

      for (let i = 0; i < 5; i++) {
        const shuffled = [...middleAddresses].sort(() => Math.random() - 0.5);
        const greedy = tspGreedy(shuffled);
        const optimized = twoOpt(greedy, 200);
        const distance = calculateTotalDistance(optimized);
        
        if (distance < bestDistance) {
          bestDistance = distance;
          bestRoute = optimized;
        }
      }
      optimizedAddresses = bestRoute;
      break;
    }
    case 'regional': {
      // 深度 2-opt 优化
      const greedy1 = tspGreedy(middleAddresses);
      optimizedAddresses = twoOpt(greedy1, 150);
      break;
    }
    case 'shortest':
    default: {
      // 快速优化
      const greedy2 = tspGreedy(middleAddresses);
      optimizedAddresses = twoOpt(greedy2, 100);
      break;
    }
  }

  // 应用起点/终点约束
  if (startAddr) {
    optimizedAddresses = [
      startAddr,
      ...optimizedAddresses.filter(a => a.id !== startAddr.id),
    ];
  }

  if (endAddr) {
    optimizedAddresses = [
      ...optimizedAddresses.filter(a => a.id !== endAddr.id),
      endAddr,
    ];
  }

  return {
    orderedAddresses: optimizedAddresses,
    totalDistance: calculateTotalDistance(optimizedAddresses),
    mode,
  };
}

// 计算两个地址之间的距离
export function getDistanceBetween(
  addr1: AddressItem,
  addr2: AddressItem
): number {
  return haversineDistance(
    addr1.latitude,
    addr1.longitude,
    addr2.latitude,
    addr2.longitude
  );
}

// 获取路线上的下一个点
export function getNextWaypoint(
  current: AddressItem,
  remaining: AddressItem[],
  preferEnd: boolean = true
): AddressItem | null {
  if (remaining.length === 0) return null;
  if (remaining.length === 1) return remaining[0];

  let bestIndex = -1;
  let bestDistance = Infinity;

  remaining.forEach((addr, index) => {
    // 如果优先终点且是终点
    if (preferEnd && addr.isEnd && bestIndex === -1) {
      bestIndex = index;
      bestDistance = getDistanceBetween(current, addr);
    } else if (!addr.isEnd) {
      const distance = getDistanceBetween(current, addr);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    }
  });

  return bestIndex >= 0 ? remaining[bestIndex] : null;
}
