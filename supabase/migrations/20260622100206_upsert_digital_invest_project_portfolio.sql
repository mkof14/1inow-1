-- Upsert Digital Invest portfolio projects from https://www.digitalinvest.com/projects.
-- Data-only migration: no schema changes.

UPDATE public.projects
SET slug = 'digital-invest-portfolio',
    updated_at = now()
WHERE slug = 'digital-invest'
  AND NOT EXISTS (
    SELECT 1
    FROM public.projects
    WHERE slug = 'digital-invest-portfolio'
  );

UPDATE public.projects
SET slug = 'table-served',
    updated_at = now()
WHERE slug = 'tableserved'
  AND NOT EXISTS (
    SELECT 1
    FROM public.projects
    WHERE slug = 'table-served'
  );

INSERT INTO public.projects (
  name,
  slug,
  description,
  status,
  priority,
  color,
  category,
  progress,
  health
) VALUES
  (
    'Digital Invest Portfolio',
    'digital-invest-portfolio',
    'Multi-sector portfolio spanning HealthTech, AgroTech, FoodTech, Robotics, and AI. Shared infrastructure and cross-project synergies create compounding value across 20+ innovative ventures.',
    'active',
    'critical',
    '#0a2540',
    'FinTech / Multi-Sector Holding',
    82,
    'on_track'
  ),
  (
    'BioMath Life Platform',
    'biomathlife',
    'Precision medicine platform with 200+ health services across 20 categories. Integrates genetic analysis, biomathematical modeling, and AI diagnostics for disease prevention and longevity optimization.',
    'active',
    'critical',
    '#14b8a6',
    'BioTech / Longevity Wellness Platform',
    64,
    'on_track'
  ),
  (
    'BioMath Core',
    'biomath-core',
    'Foundational health operating system unifying medical records, genetics, and lifestyle into actionable insights. The data engine powering the BioMath ecosystem for precision clinical decisions.',
    'active',
    'critical',
    '#ef4444',
    'Digital Health / Foundation Layer',
    52,
    'watchlist'
  ),
  (
    'SAVEN',
    'saven',
    'Infrastructure of Continuous Execution bridging digital understanding and physical reality. A 5-step cycle of Context, Action, Verification, Control, and Support helps keep life on track.',
    'active',
    'high',
    '#3b82f6',
    'Infrastructure / Medical Robotics',
    58,
    'on_track'
  ),
  (
    'Stress',
    'stresscore',
    'Psychological state intelligence tracking stress, mood, and energy with AI micro-insights. Identifies triggers, predicts low-energy windows, and delivers timely interventions for emotional resilience.',
    'planning',
    'high',
    '#8b5cf6',
    'Mental Health / HRV Stress',
    24,
    'watchlist'
  ),
  (
    'Vital',
    'vitalcore',
    'Unified vital signs dashboard combining HR, HRV, sleep, stress, and activity patterns. Detects anomalies before emergencies and provides actionable alerts for proactive health management.',
    'planning',
    'high',
    '#06b6d4',
    'Vitals / Wearables',
    28,
    'watchlist'
  ),
  (
    'BioAge',
    'bioagecore',
    'AI-powered biological age analysis comparing chronological age to real body condition. Continuous optimization tracking and personalized interventions help users control their aging trajectory.',
    'planning',
    'medium',
    '#22c55e',
    'Longevity / Biological Age',
    22,
    'on_track'
  ),
  (
    'Senior',
    'seniorcore',
    'Support system for seniors and caregivers monitoring wellness patterns, medication adherence, and activity levels. Real-time health insights support safety, independence, and family peace of mind.',
    'planning',
    'medium',
    '#f97316',
    'Senior Care / Caregivers',
    20,
    'on_track'
  ),
  (
    'Skin',
    'skincore',
    'Camera-based AI skin analysis tracking texture, tone, and condition changes over time. Ingredient-level feedback and visual trend tracking help users understand what truly works for their skin.',
    'planning',
    'medium',
    '#ec4899',
    'Beauty / Skin Analysis',
    18,
    'on_track'
  ),
  (
    'Luna Balance',
    'luna-balance',
    'Mindfulness platform helping women understand themselves through Silence Technology and Relationship Mode. Acceptance over pressure, translating internal sensations into human language.',
    'planning',
    'medium',
    '#a855f7',
    'Women''s Health / Hormonal Cycle',
    18,
    'on_track'
  ),
  (
    'T1/2D',
    't1d',
    'A practical system that helps people with Type 1 and Type 2 diabetes understand what is happening, respond in time, and manage daily life with less stress.',
    'idea',
    'high',
    '#0ea5e9',
    'Diabetes Care / Daily Life',
    14,
    'watchlist'
  ),
  (
    'MRX.Health',
    'mrx-health',
    'Medication Reactions Explorer tracking prescriptions and monitoring body effects in real time. Interactive bio-scan analysis helps identify adverse interactions early.',
    'planning',
    'high',
    '#10b981',
    'MedTech / Clinical Telehealth',
    24,
    'watchlist'
  ),
  (
    'BaseLine',
    'baseline',
    'Professional health logic made simple. A 4-step clinical launch translating clinical noise into clarity: Biological Handshake, Baseline Ingestion, Marker Synthesis, and Prognostic Launch.',
    'planning',
    'medium',
    '#64748b',
    'HealthTech / Continuous Monitoring',
    20,
    'on_track'
  ),
  (
    'AGRON - Aerial-Ground Robotics Operations Network',
    'agron',
    'National infrastructure for autonomous aerial and ground robotics: training, certification, fleet operations, and standards. The operational backbone of the U.S. robotics economy.',
    'active',
    'critical',
    '#22c55e',
    'Robotics / Field Operations',
    48,
    'watchlist'
  ),
  (
    'AGRON Work',
    'agron-work',
    'Talent platform connecting employers with verified professionals in drones, robotics, AI, and automation. Direct hiring, skill certification, and workforce intelligence for the autonomy era.',
    'planning',
    'high',
    '#84cc16',
    'Workforce / Operations',
    26,
    'on_track'
  ),
  (
    'TerraAero',
    'terraaero',
    'Drone agricultural services across the Southern U.S. for precision monitoring, crop analytics, and resource optimization. Building U.S. drone manufacturing with a 23-state expansion roadmap.',
    'active',
    'high',
    '#0ea5e9',
    'AgriTech / Precision Agriculture',
    42,
    'on_track'
  ),
  (
    'MyDay',
    'myday',
    'AI-powered daily planning SaaS transforming routines into measurable behavioral patterns. Structured nutrition tracking, energy management, and micro-goal architecture backed by analytics.',
    'active',
    'medium',
    '#06b6d4',
    'Lifestyle / AI Planning',
    50,
    'on_track'
  ),
  (
    'It''s Good Today',
    'itsgoodtoday',
    'Wellness companion built on simplicity: small daily actions in food, movement, mood, and lifestyle. No complexity, no pressure. Today is good; tomorrow can be a little better.',
    'planning',
    'medium',
    '#f59e0b',
    'Wellness / Daily Practice',
    24,
    'on_track'
  ),
  (
    'TableServed',
    'table-served',
    'Deterministic family nutrition with scheduled meals from certified U.S. hubs every Sunday. Weekly stability boxes use a Friday Lock and Sunday Pulse production cycle with diverse local cuisines.',
    'planning',
    'medium',
    '#fb923c',
    'FoodTech / Hospitality',
    34,
    'on_track'
  ),
  (
    '1inow',
    '1inow',
    'Personal and business intelligence environment connecting tasks, notes, projects, files, meetings, and messages into a single living context so people remember less and understand more.',
    'active',
    'critical',
    '#111827',
    'Productivity / Intelligence Environment',
    66,
    'on_track'
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  priority = EXCLUDED.priority,
  color = EXCLUDED.color,
  category = EXCLUDED.category,
  progress = EXCLUDED.progress,
  health = EXCLUDED.health,
  archived_at = NULL,
  updated_at = now();
