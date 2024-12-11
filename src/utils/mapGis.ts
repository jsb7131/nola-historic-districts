import { LngLatBoundsLike } from 'mapbox-gl';

// Generate a random pastel HSL color
export function getRandomPastelColor(): string {
    const hue = Math.floor(Math.random() * 360);
    // hsl(hue, 50%, 70%)
    return `hsl(${hue},50%,70%)`;
}
  
// Compute bounding box of polygon
export function getGeometryBounds(geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon): LngLatBoundsLike {
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
  
    const updateBounds = (coord: number[]) => {
      const [lng, lat] = coord;
      if (lng < minX) minX = lng;
      if (lat < minY) minY = lat;
      if (lng > maxX) maxX = lng;
      if (lat > maxY) maxY = lat;
    };
  
    if (geometry.type === 'Polygon') {
      // Handle single polygon
      geometry.coordinates[0].forEach(updateBounds);
    } else {
      // Handle multipolygon
      geometry.coordinates.forEach(polygon => {
        // Each polygon's first array is the outer ring
        polygon[0].forEach(updateBounds);
      });
    }
  
    return [[minX, minY], [maxX, maxY]];
};
