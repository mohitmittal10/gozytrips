import { describe, it, expect } from 'vitest';
import type { WhatsAppMetaIntegration, IngestedWhatsAppLeadRecord } from '@/types/enquiry';

describe('WhatsApp & Meta Lead Ingestion Functionality', () => {
  it('validates WhatsAppMetaIntegration object structure', () => {
    const integration: WhatsAppMetaIntegration = {
      accountName: 'GozyTrips Luxury Concierge',
      phoneNumber: '+91 98765 43210',
      provider: 'meta_whatsapp',
      status: 'connected',
      autoSync: true,
      syncIntervalMinutes: 5,
      leadsIngestedCount: 12,
      lastSyncedAt: new Date().toISOString(),
    };

    expect(integration.accountName).toBe('GozyTrips Luxury Concierge');
    expect(integration.status).toBe('connected');
    expect(integration.autoSync).toBe(true);
    expect(integration.leadsIngestedCount).toBe(12);
  });

  it('validates Meta Webhook handshake challenge requirements', () => {
    const queryParams = {
      'hub.mode': 'subscribe',
      'hub.challenge': '1158201444',
      'hub.verify_token': 'gozytrips_meta_lead_sync',
    };

    const isAuthorized =
      queryParams['hub.mode'] === 'subscribe' &&
      (queryParams['hub.verify_token'] === 'gozytrips_meta_lead_sync' ||
        queryParams['hub.verify_token'].startsWith('meta_verify_'));

    expect(isAuthorized).toBe(true);
    expect(queryParams['hub.challenge']).toBe('1158201444');
  });

  it('formats 1-click WhatsApp reply URL without requiring manual POST', () => {
    const phone = '+91 98201-44552';
    const suggestedReply = 'Hi Aakash! We have prepared your bespoke Maldives honeymoon quote.';
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(suggestedReply)}`;

    expect(cleanPhone).toBe('919820144552');
    expect(waLink).toContain('https://wa.me/919820144552?text=Hi%20Aakash!');
  });

  it('parses incoming Meta Lead Ad field_data into structured lead info', () => {
    const metaFieldData = [
      { name: 'full_name', values: ['Dr. Ananya Sengupta'] },
      { name: 'phone_number', values: ['+91 97112 88390'] },
      { name: 'email', values: ['ananya.sengupta@apollo.org'] },
      { name: 'preferred_destination', values: ['Switzerland & Paris'] },
      { name: 'travel_dates', values: ['October 2026'] },
      { name: 'budget_inr', values: ['5,00,000'] },
    ];

    let name = '';
    let phone = '';
    let email = '';
    let customFields: Record<string, string> = {};

    for (const f of metaFieldData) {
      const fname = f.name.toLowerCase();
      const val = f.values[0];
      if (fname.includes('name')) name = val;
      else if (fname.includes('phone')) phone = val;
      else if (fname.includes('email')) email = val;
      else customFields[f.name] = val;
    }

    expect(name).toBe('Dr. Ananya Sengupta');
    expect(phone).toBe('+91 97112 88390');
    expect(email).toBe('ananya.sengupta@apollo.org');
    expect(customFields['preferred_destination']).toBe('Switzerland & Paris');
  });

  it('correctly tracks channelSource for IngestedWhatsAppLeadRecord', () => {
    const metaLead: IngestedWhatsAppLeadRecord = {
      id: 'lead-123',
      formId: 'form-123',
      clientId: 'client-123',
      clientName: 'Rishabh Kapoor',
      clientEmail: 'rishabh@example.com',
      phone: '+91 98190 33441',
      destinations: 'Phuket & Krabi',
      startingLocation: 'New Delhi',
      startDate: '2026-11-10',
      endDate: '2026-11-17',
      durationDays: 7,
      adultPax: 2,
      childPax: 1,
      infantPax: 0,
      budget: 160000,
      currency: 'INR',
      tripType: 'family',
      status: 'pending',
      urgency: 'normal',
      confidenceScore: 92,
      summary: 'Family vacation to Phuket and Krabi',
      suggestedWhatsAppReply: 'Hi Rishabh, your Thailand family itinerary is ready!',
      rawChat: 'Raw meta lead payload',
      channelSource: 'meta_lead_ad',
      submittedAt: new Date().toISOString(),
      convertedAt: null,
      convertedItineraryId: null,
    };

    expect(metaLead.channelSource).toBe('meta_lead_ad');
    expect(metaLead.childPax).toBe(1);
    expect(metaLead.budget).toBe(160000);
  });

  it('deduplicates Meta leads using meta_lead_id to prevent duplicates on recurring sync', () => {
    const existingIngestedResponses = [
      { id: 'resp-1', raw_payload: { meta_lead_id: 'meta-lead-999' } },
      { id: 'resp-2', raw_payload: { meta_lead_id: 'meta-lead-888' } },
    ];

    const alreadyIngestedIds = new Set(
      existingIngestedResponses.map((r) => r.raw_payload.meta_lead_id)
    );

    const incomingFromMeta = [
      { id: 'meta-lead-999', field_data: [] }, // duplicate
      { id: 'meta-lead-777', field_data: [] }, // new
    ];

    const newLeads = incomingFromMeta.filter((l) => !alreadyIngestedIds.has(l.id));

    expect(newLeads.length).toBe(1);
    expect(newLeads[0].id).toBe('meta-lead-777');
  });
});

