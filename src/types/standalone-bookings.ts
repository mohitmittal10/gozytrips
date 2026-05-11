export type BookingServiceType = 'flight' | 'cab' | 'bus' | 'train' | 'hotel';
export type BookingStatus = 'draft' | 'quoted' | 'confirmed' | 'cancelled';

export interface BaseBookingDetails {
  notes?: string;
  provider?: string;
  pnr_or_confirmation?: string;
}

export interface FlightBookingDetails extends BaseBookingDetails {
  airline: string;
  flight_number: string;
  departure_airport: string;
  arrival_airport: string;
  departure_time: string; // ISO datetime
  arrival_time: string; // ISO datetime
  class_of_service?: string;
  passengers: number;
}

export interface CabBookingDetails extends BaseBookingDetails {
  vehicle_type: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_time: string; // ISO datetime
  passengers: number;
  driver_contact?: string;
}

export interface BusBookingDetails extends BaseBookingDetails {
  operator: string;
  departure_location: string;
  arrival_location: string;
  departure_time: string; // ISO datetime
  bus_type: string; // e.g., 'Sleeper AC'
  seat_numbers?: string;
  passengers: number;
}

export interface TrainBookingDetails extends BaseBookingDetails {
  train_name_or_number: string;
  departure_station: string;
  arrival_station: string;
  departure_time: string; // ISO datetime
  arrival_time: string; // ISO datetime
  class_of_service: string; // e.g., '3A', 'SL'
  passengers: number;
}

export interface HotelBookingDetails extends BaseBookingDetails {
  hotel_name: string;
  check_in_date: string; // ISO date
  check_out_date: string; // ISO date
  room_type: string;
  number_of_rooms: number;
  guests: number;
}

export type StandaloneBookingDetails =
  | FlightBookingDetails
  | CabBookingDetails
  | BusBookingDetails
  | TrainBookingDetails
  | HotelBookingDetails;

