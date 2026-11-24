export interface AdminStore {
  id: number
  name: string
  address: string
  lat: number
  lng: number
  phone: string
  hours: string
}

export type EventType = 'AUTHOR' | 'KIDS' | 'OTHER'
export type EventLocation = 'IN_STORE' | 'VIRTUAL'

export interface StoreEvent {
  id: number
  storeId: number
  storeName: string
  title: string
  type: EventType
  locationType: EventLocation
  date: string // YYYY-MM-DD
  time: string // HH:mm
}

export const EVENT_TYPE_LABEL: Record<EventType, string> = {
  AUTHOR: 'Müəllif görüşü',
  KIDS: 'Uşaq tədbiri',
  OTHER: 'Digər',
}

export const EVENT_LOCATION_LABEL: Record<EventLocation, string> = {
  IN_STORE: 'Mağazada',
  VIRTUAL: 'Onlayn',
}