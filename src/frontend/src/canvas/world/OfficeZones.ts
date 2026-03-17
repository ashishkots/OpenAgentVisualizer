export interface Zone {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: number;
}

export const OFFICE_ZONES: Zone[] = [
  { id: 'desk_area', name: 'Desk Area', x: 2, y: 2, width: 8, height: 6, color: 0x1e2433 },
  { id: 'meeting_room', name: 'Meeting Room', x: 12, y: 2, width: 5, height: 5, color: 0x1a2535 },
  { id: 'server_room', name: 'Server Room', x: 12, y: 10, width: 4, height: 4, color: 0x151f2e },
  { id: 'lounge', name: 'Lounge', x: 2, y: 12, width: 6, height: 4, color: 0x1c2438 },
];

export function getZoneForPosition(x: number, y: number): string {
  for (const zone of OFFICE_ZONES) {
    if (x >= zone.x && x < zone.x + zone.width && y >= zone.y && y < zone.y + zone.height) {
      return zone.id;
    }
  }
  return 'open_floor';
}
