import { createClient } from '@/lib/supabase/client';
import type { TravelItineraryOutput } from '@/ai/flows/generate-travel-itinerary';

export async function saveItinerary(
  userId: string,
  {
    title,
    description,
    startingLocation,
    endingLocation,
    startDate,
    endDate,
    startTime,
    endTime,
    destinations,
    budget,
    walkingDistance,
    mustInclude,
    avoid,
    itineraryData,
  }: {
    title: string;
    description?: string;
    startingLocation: string;
    endingLocation?: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    destinations: string;
    budget?: number;
    walkingDistance?: number;
    mustInclude?: string;
    avoid?: string;
    itineraryData: TravelItineraryOutput;
  }
) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('itineraries')
    .insert([
      {
        user_id: userId,
        title,
        description: description || null,
        starting_location: startingLocation,
        ending_location: endingLocation || null,
        start_date: startDate,
        end_date: endDate,
        start_time: startTime,
        end_time: endTime,
        destinations,
        budget: budget || null,
        walking_distance: walkingDistance || null,
        must_include: mustInclude || null,
        avoid: avoid || null,
        itinerary_data: itineraryData,
      },
    ])
    .select();

  if (error) {
    throw error;
  }

  return data?.[0];
}
