// Haversine distance (meters)
function distMeters(a, b) {
  const R = 6371000;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDlat = Math.sin(dLat / 2),
    sinDlng = Math.sin(dLng / 2);
  const h =
    sinDlat * sinDlat + Math.cos(lat1) * Math.cos(lat2) * sinDlng * sinDlng;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

// Decode Google encoded polyline (returns [{lat,lng},...])
function decodePolyline(str) {
  let index = 0,
    lat = 0,
    lng = 0,
    coords = [];
  while (index < str.length) {
    let b,
      shift = 0,
      result = 0;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    coords.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return coords;
}

// Distance from point P to segment AB (meters)
function pointSegDistMeters(P, A, B) {
  const toRad = (x) => (x * Math.PI) / 180;
  // project using simple equirectangular for short segments to estimate meters
  const R = 6371000;
  const x = (lng) => toRad(lng) * Math.cos(toRad((A.lat + B.lat) / 2));
  const y = (lat) => toRad(lat);
  const Ax = x(A.lng),
    Ay = y(A.lat);
  const Bx = x(B.lng),
    By = y(B.lat);
  const Px = x(P.lng),
    Py = y(P.lat);

  const ABx = Bx - Ax,
    ABy = By - Ay;
  const APx = Px - Ax,
    APy = Py - Ay;
  const ab2 = ABx * ABx + ABy * ABy || 1e-12;
  let t = (APx * ABx + APy * ABy) / ab2;
  t = Math.max(0, Math.min(1, t));
  const Qx = Ax + t * ABx,
    Qy = Ay + t * ABy;

  const dx = Px - Qx,
    dy = Py - Qy;
  const distRad = Math.sqrt(dx * dx + dy * dy);
  return distRad * R;
}

// Minimum distance from point to polyline (meters)
function minDistToPathMeters(point, polylineStr) {
  const pts = decodePolyline(polylineStr || "");
  if (pts.length < 2) return Infinity;
  let min = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const d = pointSegDistMeters(point, pts[i], pts[i + 1]);
    if (d < min) min = d;
  }
  return min;
}

module.exports = { distMeters, decodePolyline, minDistToPathMeters };
