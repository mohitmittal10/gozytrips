/**
 * @fileOverview Travel image constants and activity classification.
 *
 * Provides:
 * - classifyActivityTerm()   — categorizes an activity search term
 * - getTypedFallbackUrl()    — returns a relevant fallback image for each category
 * - Per-category Unsplash photo slug pools (India-first, then global)
 */

// ─── Activity categories ──────────────────────────────────────────────────────

export type ActivityCategory =
    | 'landmark'       // monuments, temples, forts, palaces
    | 'sightseeing'    // general sightseeing, viewpoints
    | 'hotel'          // check-in, accommodation, resort
    | 'beach'          // beaches, coastal
    | 'nature'         // forests, hills, valleys, national parks
    | 'adventure'      // trekking, rafting, paragliding, safari
    | 'cultural'       // local culture, heritage, art, museums
    | 'shopping'       // markets, bazaars, malls
    | 'food'           // meals, restaurants, cafés (use food fallback — not scenic)
    | 'transit'        // specific scenic drives, train journeys
    | 'transit_generic'// generic transfers (skip Unsplash)
    | 'rest'           // free time, leisure, overnight (skip Unsplash)
    | 'general';       // everything else

// ─── Classification rules ────────────────────────────────────────────────────

const CATEGORY_PATTERNS: [RegExp, ActivityCategory][] = [
    // Mundane — skip Unsplash
    [/\b(breakfast|lunch|dinner|meal|cafe|restaurant|food|cuisine|eat|dining|snack|chai|tea)\b/i, 'food'],
    [/\b(free\s*time|leisure|relax|rest|nap|overnight|sleep|night\s*halt)\b/i, 'rest'],
    [/\b(transfer|cab|taxi|airport|railway\s*station|bus\s*stand|depart|arrival|board|flight\s*catch)\b/i, 'transit_generic'],

    // Specific scenic transit
    [/\b(scenic\s*drive|valley\s*drive|ghats?|mountain\s*road|heritage\s*train|toy\s*train|palace\s*on\s*wheels)\b/i, 'transit'],

    // Hotel
    [/\b(check[- ]in|check[- ]out|hotel|resort|homestay|heritage\s*hotel|palace\s*hotel|housebo(a)?t|lodge|camp)\b/i, 'hotel'],

    // Beach & coastal
    [/\b(beach|coastal|sea|ocean|snorkel|diving|water\s*sport|island|backwater|houseboat|lagoon)\b/i, 'beach'],

    // Adventure
    [/\b(trek|hike|safari|raft|kayak|paraglid|bungee|zip\s*line|rock\s*climb|camp|wildlife|jungle|tiger|elephant\s*ride)\b/i, 'adventure'],

    // Nature & landscape
    [/\b(waterfall|forest|national\s*park|sanctuary|hill|valley|lake|river|meadow|garden|tea\s*garden|tea\s*estate|plantation|sunrise|sunset)\b/i, 'nature'],

    // Cultural
    [/\b(museum|gallery|art|craft|local\s*market|cultural|festival|folk|heritage\s*walk|old\s*city|old\s*town|bazaar)\b/i, 'cultural'],

    // Shopping
    [/\b(shopping|market|mall|emporium|souvenir|handicraft|textile|silk|jewel)\b/i, 'shopping'],

    // Landmarks — temples, forts, palaces, monuments
    [/\b(temple|mandir|masjid|mosque|church|fort|palace|mahal|monument|ruins|tomb|dargah|gurudwara|ashram|ghats?\s*visit|ghats?)\b/i, 'landmark'],

    // Sightseeing (catch-all for "visit X" type activities)
    [/\b(visit|sightseeing|tour|explore|walk|stroll|viewpoint|panorama|observation)\b/i, 'sightseeing'],
];

export function classifyActivityTerm(term: string): ActivityCategory {
    if (!term || term.trim().length === 0) return 'general';
    for (const [pattern, category] of CATEGORY_PATTERNS) {
        if (pattern.test(term)) return category;
    }
    return 'general';
}

// ─── Photo pools ──────────────────────────────────────────────────────────────
// Each entry is an Unsplash photo slug (the path after images.unsplash.com/)
// India-first, then Southeast Asia, then global for each category.

export const ACTIVITY_FALLBACKS: Record<ActivityCategory, string[]> = {
    landmark: [
        'photo-1587474260584-136574528ed5', // Taj Mahal aerial
        'photo-1548013146-72479768bada',     // Taj Mahal classic
        'photo-1524492412937-b28074a5d7da', // Red Fort Delhi
        'photo-1578662996442-48f60103fc96', // Qutub Minar
        'photo-1506905925346-21bda4d32df4', // Lotus Temple
        'photo-1467003909585-2f8a72700288', // Meenakshi Temple
        'photo-1706132604889-eaec56922a73', // Kyoto temple
        'photo-1568454537842-d933259bb258', // ancient temple
        'photo-1590835192370-3941b97e93fd', // Machu Picchu
        'photo-1511739001486-6bfe10ce785f', // Eiffel Tower
    ],
    sightseeing: [
        'photo-1524492412937-b28074a5d7da', // Indian heritage site
        'photo-1512343879784-a960bf40e7f2', // Jaipur city
        'photo-1477587458883-47145ed6979c', // Varanasi ghats
        'photo-1582510003544-4d00b7f74220', // India travel
        'photo-1519475889208-0878bd7b4e25', // old city architecture
        'photo-1524492412937-b28074a5d7da', // Indian streetscape
        'photo-1469854523086-cc02fe5d8800', // open road travel
        'photo-1530789253388-582c481c54b0', // aerial city travel
        'photo-1476514525535-07fb3b4ae5f1', // aerial landscape
        'photo-1488085061387-422e29b40080', // night city
    ],
    hotel: [
        'photo-1566073771259-6a8506099945', // luxury hotel pool
        'photo-1564501049412-61c2a3083791', // heritage hotel India
        'photo-1551882547-ff40c63fe2dc', // hotel room luxury
        'photo-1584132967334-10e028bd69f7', // boutique hotel
        'photo-1578681994506-b8f463906a3a', // resort pool
        'photo-1582719508461-905c673771fd', // beachside resort
        'photo-1540541338287-41700207dee6', // hotel lobby
        'photo-1618773928121-c32242e63f39', // hotel room modern
        'photo-1445019980597-93fa8acb246c', // resort sunset
        'photo-1520250497591-112f2f40a3f4', // hotel exterior
    ],
    beach: [
        'photo-1507525428034-b723cf961d3e', // Goa beach
        'photo-1519046904884-53103b34b206', // tropical beach
        'photo-1584132967334-10e028bd69f7', // Maldives overwater
        'photo-1526481280693-3bfa7568e0f3', // Indian Ocean
        'photo-1573843981267-be1999ff37cd', // Maldives aerial
        'photo-1452421822248-d4c2b47f0c81', // coastal landscape
        'photo-1575999502951-4ab25b5ca889', // Andaman beach
        'photo-1516815231560-8f41ec531527', // Kerala backwaters
        'photo-1506905925346-21bda4d32df4', // Kerala houseboat
        'photo-1544644181-1484b3fdfc62', // tropical island
    ],
    nature: [
        'photo-1501854140801-50d01698950b', // mountain vista
        'photo-1469854523086-cc02fe5d8800', // winding road hills
        'photo-1558618666-fcd25c85cd64', // valley landscape
        'photo-1469474968028-56623f02e42e', // green valley
        'photo-1431794062232-2a99a5431c6c', // sunrise landscape
        'photo-1533130061792-64b345e4a833', // forest path
        'photo-1441974231531-c6227db76b6e', // forest sunlight
        'photo-1506905925346-21bda4d32df4', // Kerala waterway
        'photo-1585409677983-0f6c41ca9c3b', // tea estate India
        'photo-1484910292437-025e5d13ce87', // Munnar hills
    ],
    adventure: [
        'photo-1522163182402-834f871fd851', // trekking mountains
        'photo-1551632811-561732d1e306', // hiking adventure
        'photo-1533130061792-64b345e4a833', // forest trek
        'photo-1472214103451-9374bd1c798e', // mountain lake hike
        'photo-1462275646964-a0e3386b89fa', // rafting
        'photo-1528543606781-2f6e8759bc41', // adventure jeep
        'photo-1530789253388-582c481c54b0', // aerial adventure
        'photo-1447752875215-b2761acb3c5d', // national park safari
        'photo-1516426122078-c23e76319801', // wildlife
        'photo-1534361960057-19f4434a4b8a', // elephant wildlife
    ],
    cultural: [
        'photo-1477587458883-47145ed6979c', // Varanasi ghats ceremony
        'photo-1582510003544-4d00b7f74220', // Indian culture
        'photo-1570168007204-dfb528c6958f', // Indian folk art
        'photo-1519046904884-53103b34b206', // heritage walk
        'photo-1595183163487-ab8321cc5239', // Morocco medina street
        'photo-1531366936337-7c912a4589a7', // night festival
        'photo-1613395877344-13d4a8e0d49e', // heritage village
        'photo-1595535873420-a599195b3f4a', // local market
        'photo-1533090161767-e6ffed986c88', // Rajasthan culture
        'photo-1524492412937-b28074a5d7da', // heritage building
    ],
    shopping: [
        'photo-1595183163487-ab8321cc5239', // colorful market
        'photo-1533090161767-e6ffed986c88', // Rajasthan bazaar
        'photo-1590916836228-26d3e76e2ced', // spice market India
        'photo-1504384308090-c894fdcc538d', // market stalls
        'photo-1608198093002-ad4e005484ec', // fabric market
        'photo-1549367045-d43d5fbf0b22', // old market
        'photo-1586348943529-beaae6c28db9', // handicrafts
        'photo-1519475889208-0878bd7b4e25', // local shop street
        'photo-1471922694854-ff1b63b20054', // street market
        'photo-1578662996442-48f60103fc96', // bazaar
    ],
    food: [
        // For food activities, show the destination city rather than food close-ups
        'photo-1477587458883-47145ed6979c', // Varanasi (travel scene)
        'photo-1512343879784-a960bf40e7f2', // Jaipur
        'photo-1507525428034-b723cf961d3e', // coastal Goa
        'photo-1571115177098-24ec42ed204d', // rooftop cafe view
        'photo-1533090161767-e6ffed986c88', // colourful streets
        'photo-1476514525535-07fb3b4ae5f1', // travel landscape
        'photo-1547525400-ef6b47040b49', // street view travel
        'photo-1595183163487-ab8321cc5239', // market scene
        'photo-1506905925346-21bda4d32df4', // scenic view
        'photo-1530789253388-582c481c54b0', // city aerial
    ],
    transit: [
        'photo-1469854523086-cc02fe5d8800', // scenic mountain road
        'photo-1476514525535-07fb3b4ae5f1', // aerial landscape road
        'photo-1544620347-c4fd4a3d5957', // train journey India
        'photo-1554050857-c84a8abdb5e2', // train scenic route
        'photo-1501785888041-af3ef285b470', // winding road valley
        'photo-1488646953014-85cb44e25828', // travel road trip
        'photo-1502082553048-f009c37129b9', // open road landscape
        'photo-1519046904884-53103b34b206', // journey travel
    ],
    transit_generic: [
        'photo-1476514525535-07fb3b4ae5f1', // aerial landscape
        'photo-1469854523086-cc02fe5d8800', // road trip
        'photo-1436491865332-7a61a109cc05', // clouds horizon
        'photo-1530789253388-582c481c54b0', // travel aerial
        'photo-1501854140801-50d01698950b', // mountain journey
        'photo-1506905925346-21bda4d32df4', // water travel
    ],
    rest: [
        'photo-1445019980597-93fa8acb246c', // resort sunset
        'photo-1476514525535-07fb3b4ae5f1', // serene landscape
        'photo-1506905925346-21bda4d32df4', // peaceful water
        'photo-1436491865332-7a61a109cc05', // calm clouds
        'photo-1501854140801-50d01698950b', // scenic vista
        'photo-1431794062232-2a99a5431c6c', // sunrise
    ],
    general: [
        'photo-1476514525535-07fb3b4ae5f1', // aerial landscape
        'photo-1506748686214-e9df14d4d9d0', // nature lake
        'photo-1469854523086-cc02fe5d8800', // road trip
        'photo-1436491865332-7a61a109cc05', // clouds water
        'photo-1530789253388-582c481c54b0', // travel
        'photo-1501854140801-50d01698950b', // mountains
        'photo-1488085061387-422e29b40080', // night city
        'photo-1548013146-72479768bada', // Taj Mahal
        'photo-1477587458883-47145ed6979c', // Varanasi
        'photo-1512343879784-a960bf40e7f2', // Jaipur
    ],
};

// ─── Destination keyword → category override ──────────────────────────────────
// If the area name contains these keywords, bias fallbacks accordingly

const DESTINATION_KEYWORD_MAP: [RegExp, ActivityCategory][] = [
    [/\b(goa|beach|andaman|lakshadweep|maldives|phuket|bali|krabi|koh)\b/i, 'beach'],
    [/\b(manali|shimla|leh|ladakh|kedarnath|badrinath|valley|spiti|coorg|ooty|darjeeling|sikkim|munnar)\b/i, 'nature'],
    [/\b(jaipur|rajasthan|jodhpur|udaipur|jaisalmer|agra|delhi|lucknow)\b/i, 'landmark'],
    [/\b(rishikesh|adventure|trek|corbett|ranthambore|bandhavgarh|masai|serengeti)\b/i, 'adventure'],
    [/\b(varanasi|kerala|hampi|khajuraho|mysore|madurai|amritsar|puri)\b/i, 'cultural'],
];

/**
 * Destination-aware fallback photo pool — returns slugs relevant to the area.
 */
export const DESTINATION_FALLBACKS: Record<string, string[]> = {
    goa: [
        'photo-1507525428034-b723cf961d3e',
        'photo-1519046904884-53103b34b206',
        'photo-1526481280693-3bfa7568e0f3',
        'photo-1507525428034-b723cf961d3e',
    ],
    rajasthan: [
        'photo-1512343879784-a960bf40e7f2',
        'photo-1533090161767-e6ffed986c88',
        'photo-1524492412937-b28074a5d7da',
        'photo-1586348943529-beaae6c28db9',
    ],
    kerala: [
        'photo-1516815231560-8f41ec531527',
        'photo-1506905925346-21bda4d32df4',
        'photo-1484910292437-025e5d13ce87',
        'photo-1585409677983-0f6c41ca9c3b',
    ],
    himachal: [
        'photo-1501854140801-50d01698950b',
        'photo-1558618666-fcd25c85cd64',
        'photo-1469474968028-56623f02e42e',
        'photo-1431794062232-2a99a5431c6c',
    ],
    default: [
        'photo-1476514525535-07fb3b4ae5f1',
        'photo-1548013146-72479768bada',
        'photo-1477587458883-47145ed6979c',
        'photo-1512343879784-a960bf40e7f2',
        'photo-1507525428034-b723cf961d3e',
        'photo-1469854523086-cc02fe5d8800',
        'photo-1530789253388-582c481c54b0',
        'photo-1501854140801-50d01698950b',
    ],
};

// ─── URL builder ──────────────────────────────────────────────────────────────

const IMAGE_PARAMS = 'q=80&w=1080&auto=format&fit=crop';

function slugToUrl(slug: string): string {
    if (slug.startsWith('http')) return slug;
    return `https://images.unsplash.com/${slug}?${IMAGE_PARAMS}`;
}

/**
 * Returns a typed fallback URL for a given activity category.
 * Uses destination keyword matching for extra relevance.
 *
 * @param category   - Detected activity category
 * @param areaName   - Day's areaFocus string for destination-level override
 * @param dayIndex   - Day number for deterministic variety
 */
export function getTypedFallbackUrl(
    category: ActivityCategory,
    areaName: string | undefined,
    dayIndex: number
): string {
    // Try destination-specific pool first
    if (areaName) {
        const areaLower = areaName.toLowerCase();
        for (const [pattern, destCategory] of DESTINATION_KEYWORD_MAP) {
            if (pattern.test(areaLower)) {
                // Use destination pool if category is general/transit/food,
                // otherwise use the typed category pool
                const useDestPool = ['general', 'transit_generic', 'food', 'rest'].includes(category);
                if (useDestPool) {
                    const destKey = areaLower.includes('goa') ? 'goa'
                        : areaLower.match(/jaipur|rajasthan|jodhpur|udaipur|jaisalmer/) ? 'rajasthan'
                        : areaLower.includes('kerala') ? 'kerala'
                        : areaLower.match(/manali|shimla|leh|ladakh|spiti|himachal/) ? 'himachal'
                        : 'default';
                    const pool = DESTINATION_FALLBACKS[destKey] || DESTINATION_FALLBACKS.default;
                    return slugToUrl(pool[dayIndex % pool.length]);
                }
                // Otherwise bias to dest category pool but from the typed category
                const biasedCategory = destCategory;
                const pool = ACTIVITY_FALLBACKS[biasedCategory] || ACTIVITY_FALLBACKS.general;
                return slugToUrl(pool[dayIndex % pool.length]);
            }
        }
    }

    // Use category-specific pool
    const pool = ACTIVITY_FALLBACKS[category] || ACTIVITY_FALLBACKS.general;
    return slugToUrl(pool[dayIndex % pool.length]);
}

// ─── Legacy compat ────────────────────────────────────────────────────────────
// Keep old exports so existing callers don't break

/** @deprecated Use getTypedFallbackUrl() instead */
export const DEFAULT_FALLBACK_PHOTOS = ACTIVITY_FALLBACKS.general;

/** @deprecated Use getTypedFallbackUrl() instead */
export const getActivityFallbackUrl = (index: number, fallbackPhotos?: string[]) => {
    const pool = fallbackPhotos && fallbackPhotos.length > 0
        ? fallbackPhotos
        : DEFAULT_FALLBACK_PHOTOS;
    const slug = pool[index % pool.length];
    if (slug.startsWith('http')) return slug;
    return `https://images.unsplash.com/${slug}?${IMAGE_PARAMS}`;
};
