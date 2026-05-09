import { z } from 'zod';

// Validation rule of thumb for Phase 1: be strict about top-level shape, lax
// about pool contents (they're free-text). Reject 400 + ZodError.format() so
// the UI can show what was wrong.

const ComponentRefSchema = z.object({
  slot: z.string(),
  usage: z.string(),
});

export const ArchetypePatchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  tagline: z.string().max(500).optional(),
  funnel_stage: z.string().max(120).optional(),
  exemplar: z.string().max(40).optional(),
  accent: z.string().max(40).optional(),
  rules: z.array(z.string().min(1).max(2000)).optional(),
  components: z.array(ComponentRefSchema).optional(),
  variable_inputs: z.record(z.string(), z.array(z.string())).optional(),
  fires: z.string().max(120).optional(),
}).strict();

export const GlobalRuleCreateSchema = z.object({
  rule: z.string().min(1).max(2000),
  id: z.string().max(20).optional(),
}).strict();

export const GlobalRulePatchSchema = z.object({
  rule: z.string().min(1).max(2000),
}).strict();

const ComponentBaseSchema = z.object({
  category: z.string().min(1).max(80),
  key: z.string().min(1).max(80),
  description: z.string().max(500).optional().default(''),
  type: z.string().max(40).optional().default('locked'),
  usedBy: z.array(z.string().max(20)).optional().default([]),
});

export const ComponentCreateSchema = ComponentBaseSchema;

export const ComponentPatchSchema = z.object({
  category: z.string().min(1).max(80).optional(),
  key: z.string().min(1).max(80).optional(),
  description: z.string().max(500).optional(),
  type: z.string().max(40).optional(),
  usedBy: z.array(z.string().max(20)).optional(),
}).strict();

const ServiceAreaSchema = z.object({
  name: z.string().min(1).max(120),
  postcode: z.string().max(10).optional().default(''),
  primary: z.boolean().optional().default(false),
  notes: z.string().max(500).optional().default(''),
});

export const ClientCreateSchema = z.object({
  business_name: z.string().min(1).max(160),
  // city + postcode are kept on the record for back-compat with master-prompt {{city}} /
  // {{postcode}} references. The server auto-derives them from the primary service area
  // on save, so the canonical source of truth is service_areas[].
  city: z.string().max(120).optional().default(''),
  postcode: z.string().max(10).optional().default(''),
  state: z.string().max(10).optional().default(''),
  // Deprecated free-text region — superseded by service_areas[]. Kept on existing
  // records but new clients should populate service_areas instead.
  region: z.string().max(240).optional().default(''),
  // Structured list of cities/regions the client services. Exactly one entry should
  // have primary=true. Master AI gets the full list for per-ad copy decisions.
  service_areas: z.array(ServiceAreaSchema).optional().default([]),
  brands_sold: z.array(z.string().max(80)).optional().default([]),
  google_review_count: z.number().int().nonnegative().optional().default(0),
  install_guarantee_days: z.number().int().nonnegative().optional().default(0),
  years_in_business: z.number().int().nonnegative().optional().default(0),
  default_per_week_price: z.union([z.string(), z.number()]).optional().default(''),
  default_fixed_price: z.union([z.string(), z.number()]).optional().default(''),
  default_anchor_price: z.union([z.string(), z.number()]).optional().default(''),
  // Pricing constraint: 'per_week_only' (default), 'fixed_only', 'mixed'.
  // Hard rule passed to the prompt — flexible archetypes (A6/A7/A8) follow it,
  // archetypes with their own pricing rules still respect those (now empty
  // since A1/A3/A4 had their per-archetype pricing rules stripped — pricing
  // is fully controlled globally per the operator's spec).
  pricing_mode: z.enum(['per_week_only', 'fixed_only', 'mixed']).optional().default('per_week_only'),
  current_promo_pct: z.number().int().min(0).max(100).optional().default(0),
  team_photos_uploaded: z.boolean().optional().default(false),
  owner_photos_uploaded: z.boolean().optional().default(false),
  van_photos_uploaded: z.boolean().optional().default(false),
  family_owned: z.boolean().optional().default(false),
  australian_owned: z.boolean().optional().default(false),
  onboarded_date: z.string().max(20).optional(),
  // Optional explicit ID; otherwise derived from business_name.
  id: z.string().max(80).optional(),
}).strict();

export const ClientPatchSchema = ClientCreateSchema.partial().strict();

export const PricePatchSchema = z.object({
  fixed: z.string().max(40).optional(),
  anchor: z.string().max(40).optional(),
  perWeek: z.string().max(40).optional(),
  rebate: z.string().max(40).optional(),
}).strict();

// Wraps a zod parse and turns failure into a 400 response.
export function validate(schema, body) {
  const r = schema.safeParse(body);
  if (!r.success) {
    const err = new Error('validation failed');
    err.status = 400;
    err.details = r.error.flatten();
    throw err;
  }
  return r.data;
}
