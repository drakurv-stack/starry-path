export type PosePoint = {
  x: number;
  y: number;
  score?: number;
};

export type PoseLandmarks = {
  keypoints: PosePoint[];
};

export type ProfileMetrics = {
  bodyAngle: number;
  bodyTilt: number;
  elbowAngle: number;
  confidence: number;
};

function pointAngle(a: PosePoint, vertex: PosePoint, c: PosePoint) {
  const abX = a.x - vertex.x;
  const abY = a.y - vertex.y;
  const cbX = c.x - vertex.x;
  const cbY = c.y - vertex.y;
  const magnitude = Math.hypot(abX, abY) * Math.hypot(cbX, cbY);

  if (!magnitude) return null;

  const cosine = Math.max(-1, Math.min(1, (abX * cbX + abY * cbY) / magnitude));
  return (Math.acos(cosine) * 180) / Math.PI;
}

function confidentPoint(points: PosePoint[], index: number) {
  const point = points[index];
  return point && (point.score ?? 0) >= 0.35 ? point : null;
}

export function getProfileMetrics(pose: PoseLandmarks): ProfileMetrics | null {
  const sides = [
    { shoulder: 5, elbow: 7, wrist: 9, hip: 11, ankle: 15 },
    { shoulder: 6, elbow: 8, wrist: 10, hip: 12, ankle: 16 },
  ];

  const candidates = sides.flatMap((side) => {
    const shoulder = confidentPoint(pose.keypoints, side.shoulder);
    const elbow = confidentPoint(pose.keypoints, side.elbow);
    const wrist = confidentPoint(pose.keypoints, side.wrist);
    const hip = confidentPoint(pose.keypoints, side.hip);
    const ankle = confidentPoint(pose.keypoints, side.ankle);

    if (!shoulder || !elbow || !wrist || !hip || !ankle) return [];

    const bodyAngle = pointAngle(shoulder, hip, ankle);
    const elbowAngle = pointAngle(shoulder, elbow, wrist);
    if (bodyAngle === null || elbowAngle === null) return [];
    const rawBodyTilt =
      (Math.abs((Math.atan2(ankle.y - shoulder.y, ankle.x - shoulder.x) * 180) / Math.PI) % 180);
    const bodyTilt = Math.min(rawBodyTilt, 180 - rawBodyTilt);

    return [{
      bodyAngle,
      bodyTilt,
      elbowAngle,
      confidence: Math.min(
        shoulder.score ?? 0,
        elbow.score ?? 0,
        wrist.score ?? 0,
        hip.score ?? 0,
        ankle.score ?? 0,
      ),
    }];
  });

  return candidates.sort((a, b) => b.confidence - a.confidence)[0] ?? null;
}