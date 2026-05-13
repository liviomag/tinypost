import { requireAuth } from '../auth/guards.js';

await requireAuth();
