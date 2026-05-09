// POST /api/generate — kicks off one ad generation.
// Body: see server/lib/generate.js for the input shape.

import { Router } from 'express';
import { z } from 'zod';
import { generateAd } from '../lib/generate.js';
import { validate } from '../lib/schemas.js';

export const generateRouter = Router();

const PicksSchema = z.object({
  headline:     z.string().max(2000).optional(),
  sub_headline: z.string().max(2000).optional(),
  value_stack:  z.string().max(2000).optional(),
  cta:          z.string().max(2000).optional(),
  badge:        z.string().max(2000).optional(),
}).strict().optional().default({});

const GenerateInputSchema = z.object({
  archetype:           z.string().min(1).max(10),
  client_id:           z.string().max(120).optional(),
  client:              z.record(z.string(), z.any()).optional(),
  city:                z.string().max(120).optional(),
  picks:               PicksSchema,
  component_keys:      z.array(z.string().max(120)).optional().default([]),
  attach_client_photos:z.array(z.string().max(160)).optional().default([]),
  quality:             z.enum(['low', 'medium', 'high', 'auto']).optional().default('high'),
  compose_only:        z.boolean().optional().default(false),
  n_candidates:        z.number().int().min(1).max(4).optional().default(3),
  skip_critique:       z.boolean().optional().default(false),
  // Operator-edited prompt — bypasses Claude entirely, sends this text
  // straight to gpt-image-2 along with the same attachments.
  prompt_override:     z.string().max(40000).optional(),
}).strict();

generateRouter.post('/', async (req, res, next) => {
  try {
    const input = validate(GenerateInputSchema, req.body);
    const result = await generateAd(input);
    res.json(result);
  } catch (e) { next(e); }
});
