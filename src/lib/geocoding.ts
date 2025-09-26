// Geocoding service for Swiss location search
// Using Mapbox Geocoding API

export interface SearchResult {
    id: string
    name: string
    coordinates: [number, number] // [longitude, latitude]
    type: string
    boundingBox?: [number, number, number, number] // [minLng, minLat, maxLng, maxLat]
    relevance: number
}

class GeocodingService {
    private baseUrl = 'https://api.mapbox.com/geocoding/v5/mapbox.places'

    async searchPlaces(query: string, limit: number = 8): Promise<SearchResult[]> {
        const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

        if (!token) {
            console.error('Mapbox token not found for geocoding')
            return []
        }

        try {
            // Encode query and add Swiss bias
            const encodedQuery = encodeURIComponent(query)
            const url = `${this.baseUrl}/${encodedQuery}.json?access_token=${token}&country=CH&limit=${limit}&types=place,locality,neighborhood,address,poi`

            console.log('Searching for:', query, 'URL:', url)

            const response = await fetch(url)

            if (!response.ok) {
                throw new Error(`Geocoding API error: ${response.status}`)
            }

            const data = await response.json()
            console.log('Geocoding response:', data)

            return data.features.map((feature: any) => ({
                id: feature.id,
                name: feature.place_name,
                coordinates: feature.center,
                type: this.getPlaceType(feature.place_type),
                boundingBox: feature.bbox,
                relevance: feature.relevance
            }))
        } catch (error) {
            console.error('Geocoding search error:', error)
            return []
        }
    }

    private getPlaceType(placeTypes: string[]): string {
        // Priority order for display
        const typeMap: Record<string, string> = {
            'country': 'Country',
            'region': 'Region',
            'place': 'City',
            'locality': 'Town',
            'neighborhood': 'District',
            'address': 'Address',
            'poi': 'POI'
        }

        for (const type of placeTypes) {
            if (typeMap[type]) {
                return typeMap[type]
            }
        }

        return 'Location'
    }

    // Search specifically for Swiss cities and towns
    async searchSwissCities(query: string): Promise<SearchResult[]> {
        return this.searchPlaces(`${query}, Switzerland`, 5)
    }

    // Search for POIs near a location
    async searchPOIsNear(coordinates: [number, number], query?: string): Promise<SearchResult[]> {
        const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

        if (!token) {
            console.error('Mapbox token not found for POI search')
            return []
        }

        try {
            const searchQuery = query || 'restaurant,hotel,hospital,station'
            const encodedQuery = encodeURIComponent(searchQuery)
            const [lng, lat] = coordinates

            const url = `${this.baseUrl}/${encodedQuery}.json?access_token=${token}&proximity=${lng},${lat}&country=CH&types=poi&limit=10`

            const response = await fetch(url)

            if (!response.ok) {
                throw new Error(`POI search API error: ${response.status}`)
            }

            const data = await response.json()

            return data.features.map((feature: any) => ({
                id: feature.id,
                name: feature.place_name,
                coordinates: feature.center,
                type: 'POI',
                boundingBox: feature.bbox,
                relevance: feature.relevance
            }))
        } catch (error) {
            console.error('POI search error:', error)
            return []
        }
    }
}

export const geocodingService = new GeocodingService()
