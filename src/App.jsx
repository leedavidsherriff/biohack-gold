import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'

/* ============================================================================
   BIZ — the entire reskin surface.
   Change this block and the whole app changes: brand, colours, trust marks,
   catalogue, stacks, discount tiers, bank details, legal copy, guides.

   COMPLIANCE NOTES FOR WHOEVER EDITS THIS:
   - `disclaimer` and `eligibilityText` are single fields on purpose. They go to
     legal/regulatory review before launch. Edit them here, nowhere else.
   - Product copy describes RESEARCH CONTEXT only. Never write what a compound
     does for a person. No "helps", "improves", "treats", "cures", "prevents".
   - `researchRefs` ship as flagged placeholders. Replace each with a verified
     citation before launch — do not invent references.
   - Prices marked ESTIMATE are placeholders benchmarked against market rates.
   ========================================================================== */

const BIZ = {
  name: 'BioHack Gold',
  shortName: 'BHG',
  // The mark is a symbol only — the wordmark is real type, never generated.
  // `logo-chain.webp` is the alternate (peptide-chain hexagons).
  logo: './media/logo.webp',
  tagline: 'Research-grade peptides, verified to the batch.',
  established: 'Est. 2026 · London',
  email: 'info@biohackgold.com',

  palette: {
    bg: '#0A0A0B',
    surface: '#131418',
    surfaceAlt: '#1A1C21',
    border: '#26282F',
    text: '#F3F0E9',
    textMuted: '#8B8880',
    primary: '#D6A94C',      // gold — brand, value, savings
    primaryDim: '#8A6E31',
    accent: '#79C2D4',       // lab ice — verification, purity, cold chain
    good: '#6FCF97',
    warn: '#E2B04A',
  },

  // Trust pillar #1 — shown first on the landing view, before any product.
  trust: [
    { icon: 'flask', label: 'Third-party tested', sub: 'HPLC & Mass Spec, independent lab' },
    { icon: 'shield', label: '≥99% purity', sub: 'Certificate of Analysis per batch' },
    { icon: 'snow', label: 'Cold-chain dispatch', sub: 'Temperature-controlled from London' },
    { icon: 'truck', label: 'Next-day dispatch', sub: 'Same day on orders before 1pm' },
  ],

  stats: [
    { value: '4.9★', label: 'Average rating' },
    { value: '6,000+', label: 'Orders dispatched' },
    { value: '100%', label: 'Batch traced' },
    { value: '24h', label: 'Dispatch window' },
  ],

  labPartner: 'Janoshik Analytical',

  /* --- Higgsfield media -------------------------------------------------
     Everything here is optional. Each file is HEAD-probed at runtime: what
     exists is used, what doesn't is skipped silently, so the app ships and
     looks intentional before a single clip lands. Drop files in and reload.

     Hero clips: seedance_2_0, 12s, 1080p, generate_audio true.
     Product shots: nano_banana_pro, 2k. A SMALL set reused across the whole
     catalogue via `shot` on each product — four images cover twenty vials.
     Prompts live in ASSET-PROMPTS.md. Never leave a prompt unfiled.        */
  media: {
    poster: './media/hero-poster.jpg',
    ambience: './media/ambience.m4a',
    // Each inner array is one cycle. Multiple entries = chapters played straight through.
    cycles: [
      ['./media/hero-01-reconstitution.mp4'],
      ['./media/hero-02-coldchain.mp4'],
    ],
    cyclesMobile: [
      ['./media/m/hero-01-reconstitution.mp4'],
      ['./media/m/hero-02-coldchain.mp4'],
    ],
    // The reusable product stills. Key here = `shot` on a product.
    shots: {
      gold: './media/products/vial-gold.webp',
      green: './media/products/vial-green.webp',
      ice: './media/products/vial-ice.webp',
      violet: './media/products/vial-violet.webp',
    },
  },

  reviews: [
    { name: 'Verified buyer', text: 'Very professional and responds in a very timely manner.', stars: 5 },
    { name: 'Verified buyer', text: 'Some initial confusion on my order, dealt with in a completely professional manner.', stars: 5 },
    { name: 'Verified buyer', text: 'Reliable. Query sorted in under 24 hours.', stars: 5 },
    { name: 'Verified buyer', text: 'Five star service — won’t order from anyone else.', stars: 5 },
  ],

  /* --- LEGAL: single-source fields, reviewed before launch ---------------- */
  disclaimer:
    'All products supplied by BioHack Gold are sold strictly for in-vitro laboratory research purposes only. ' +
    'They are not medicines, not supplements, and not for human or veterinary consumption, ingestion, injection, ' +
    'or any form of clinical or diagnostic use. Nothing on this site constitutes medical advice or a recommendation ' +
    'to administer any substance to any person or animal. Purchasers must be 18 or over and confirm they are a ' +
    'qualified researcher or acting on behalf of a research institution. By ordering you accept full responsibility ' +
    'for the lawful handling, storage and use of these materials in a controlled laboratory setting.',

  eligibilityText:
    'I confirm I am 18 or over, that I am purchasing these materials for in-vitro laboratory research only, and that ' +
    'I will not administer them to humans or animals.',

  returnsText:
    'Unopened vials may be returned within 14 days of delivery. Opened vials cannot be accepted for hygiene and ' +
    'chain-of-custody reasons. Cold-chain items are dispatched with temperature control; report any transit issue ' +
    'within 24 hours of delivery.',

  /* --- Where a placed order actually goes ---------------------------------
     A static site has no server, so an order has to leave the browser somehow.

     `endpoint`: any URL that accepts a JSON POST — a Formspree / Web3Forms
     form endpoint, a Zapier or Make catch hook, or your own function. Set it
     and orders are delivered automatically the moment they are placed.

     Until it IS set, the app does NOT pretend an order has been sent. It shows
     the customer a send button instead, which opens their mail app with the
     whole order filled in, addressed to `notifyEmail` and copied to
     themselves. Nothing is ever silently lost.                              */
  orders: {
    endpoint: '',                          // ← set this and delivery is automatic
    notifyEmail: 'orders@biohackgold.com', // PLACEHOLDER — real inbox before launch
  },

  /* --- Pay by Bank ---------------------------------------------------------
     Bank transfer only. No cards, ever.

     `pisp.createUrl` is where the app-to-app flow plugs in — the thing that
     opens the customer's banking app with payee, amount and reference already
     filled. That handshake is regulated: it needs a licensed payment
     initiation provider (TrueLayer, Volt, Yapily, Token.io, GoCardless
     Instant Bank Pay). There is no free URL scheme that does it in the UK, so
     until an account exists this stays empty and customers get the manual
     details with one-tap copy instead.

     When you have one, point `createUrl` at your endpoint. It receives the
     order as JSON and must return { redirectUrl } — the app sends the
     customer there and the bank app takes over. Nothing else needs changing.

     CHECK THE PROVIDER ACCEPTS THIS CATEGORY BEFORE SIGNING UP: several
     prohibit research chemicals exactly as the card processors do.          */
  payments: {
    pisp: {
      name: '',        // e.g. 'TrueLayer' — shown on the button
      createUrl: '',   // POST order JSON -> { redirectUrl }
    },
  },

  /* --- Payment account the transfer lands in ------------------------------ */
  bank: {
    method: 'Pay by Bank (UK bank transfer)',
    accountName: 'BioHack Gold Ltd',
    sortCode: '04-00-75',            // PLACEHOLDER — replace with real details
    accountNumber: '00000000',       // PLACEHOLDER — replace with real details
    refPrefix: 'BHG',
    note: 'Payment is matched automatically to your order reference. Orders are dispatched once funds clear — usually the same working day for Faster Payments.',
  },

  /* --- Stack builder discount ladder ------------------------------------- */
  discountTiers: [
    { minItems: 2, pct: 5 },
    { minItems: 3, pct: 10 },
    { minItems: 4, pct: 15 },
    { minItems: 6, pct: 20 },
  ],

  /* --- Research domains, used as the catalogue's goal filter -------------- */
  goals: [
    { id: 'recovery', label: 'Recovery & repair' },
    { id: 'growth', label: 'Growth pathways' },
    { id: 'metabolic', label: 'Metabolic' },
    { id: 'cognition', label: 'Cognition' },
    { id: 'cosmetic', label: 'Skin & cosmetic' },
    { id: 'sleep', label: 'Sleep & circadian' },
    { id: 'immune', label: 'Immune & inflammation' },
    { id: 'longevity', label: 'Longevity & cellular' },
  ],

  products: [
    {
      id: 'bpc-157', name: 'BPC-157', category: 'peptide', goals: ['recovery'],
      purity: '≥99%', badges: ['bestseller'],
      blurb: 'Pentadecapeptide sequence derived from a protein identified in gastric juice.',
      description:
        'A synthetic 15-amino-acid sequence corresponding to a partial sequence of body protection compound isolated from gastric juice. ' +
        'One of the most frequently referenced compounds in preclinical tissue-repair literature, typically appearing in in-vitro and rodent-model studies.',
      sizes: [
        { label: '5mg', price: 49.99, stock: 'in' },
        { label: '10mg', price: 79.99, stock: 'in' },
      ],
      pairsWith: ['tb-500', 'kpv'],
      researchRefs: [
        '[REF PLACEHOLDER] Preclinical tissue-repair model literature — add verified citation',
        '[REF PLACEHOLDER] Gastrointestinal model reviews — add verified citation',
      ],
    },
    {
      id: 'tb-500', name: 'TB-500', category: 'peptide', goals: ['recovery'],
      purity: '≥99%', badges: ['bestseller'],
      blurb: 'Synthetic fragment corresponding to a region of thymosin beta-4.',
      description:
        'A synthetic peptide corresponding to an active region of the naturally occurring protein thymosin beta-4. ' +
        'Appears widely in cell-migration and actin-binding research models.',
      sizes: [{ label: '5mg', price: 59.99, stock: 'in' }, { label: '10mg', price: 94.99, stock: 'in' }],
      pairsWith: ['bpc-157', 'ghk-cu'],
      researchRefs: ['[REF PLACEHOLDER] Thymosin beta-4 cell-migration literature — add verified citation'],
    },
    {
      id: 'cjc-1295', name: 'CJC-1295', category: 'peptide', goals: ['growth'],
      purity: '≥99%', badges: ['bestseller'],
      blurb: 'Modified growth hormone releasing hormone analogue.',
      description:
        'A synthetic analogue of growth hormone releasing hormone (GHRH) carrying amino acid substitutions that extend its half-life in vitro. ' +
        'Studied alongside secretagogue peptides in endocrine research models.',
      sizes: [{ label: '2mg', price: 54.99, stock: 'in' }, { label: '5mg', price: 89.99, stock: 'in' }],
      pairsWith: ['ipamorelin', 'aod-9604'],
      researchRefs: ['[REF PLACEHOLDER] GHRH analogue pharmacokinetic literature — add verified citation'],
    },
    {
      id: 'ipamorelin', name: 'Ipamorelin', category: 'peptide', goals: ['growth'],
      purity: '≥99%', badges: ['bestseller'],
      blurb: 'Selective pentapeptide growth hormone secretagogue.',
      description:
        'A synthetic pentapeptide characterised in the literature as a selective ghrelin-receptor agonist. ' +
        'Frequently paired with GHRH analogues in comparative endocrine research.',
      sizes: [{ label: '5mg', price: 49.99, stock: 'in' }, { label: '10mg', price: 79.99, stock: 'in' }],
      pairsWith: ['cjc-1295', 'mots-c'],
      researchRefs: ['[REF PLACEHOLDER] Ghrelin-receptor selectivity literature — add verified citation'],
    },
    {
      id: 'ghk-cu', name: 'GHK-Cu', category: 'peptide', goals: ['cosmetic', 'recovery'],
      purity: '≥99%', badges: ['bestseller'],
      blurb: 'Copper-binding tripeptide complex.',
      description:
        'A naturally occurring tripeptide (glycyl-L-histidyl-L-lysine) in complex with copper(II). ' +
        'Extensively referenced in dermal fibroblast and extracellular-matrix research.',
      sizes: [{ label: '50mg', price: 49.99, stock: 'in' }, { label: '100mg', price: 84.99, stock: 'in' }],
      pairsWith: ['glutathione', 'bpc-157'],
      researchRefs: ['[REF PLACEHOLDER] Dermal fibroblast / ECM literature — add verified citation'],
    },
    {
      id: 'aod-9604', name: 'AOD-9604', category: 'peptide', goals: ['metabolic'],
      purity: '≥99%', badges: [],
      blurb: 'Modified fragment of the human growth hormone C-terminus.',
      description:
        'A synthetic peptide corresponding to residues 176–191 of human growth hormone with an added tyrosine residue. ' +
        'Studied in adipocyte and lipid-metabolism research models.',
      sizes: [{ label: '5mg', price: 54.99, stock: 'in' }],
      pairsWith: ['mots-c', 'cjc-1295'],
      researchRefs: ['[REF PLACEHOLDER] hGH fragment adipocyte literature — add verified citation'],
    },
    {
      id: 'mots-c', name: 'MOTS-c', category: 'peptide', goals: ['metabolic', 'longevity'],
      purity: '≥99%', badges: ['new'],
      blurb: 'Mitochondrial-derived peptide of 16 amino acids.',
      description:
        'A peptide encoded in the mitochondrial genome, identified in cellular energy-metabolism research. ' +
        'Commonly appears in AMPK-pathway and metabolic-signalling studies.',
      sizes: [{ label: '10mg', price: 59.99, stock: 'in' }],
      pairsWith: ['aod-9604', 'epitalon'],
      researchRefs: ['[REF PLACEHOLDER] Mitochondrial-derived peptide literature — add verified citation'],
    },
    {
      id: 'epitalon', name: 'Epitalon', category: 'peptide', goals: ['longevity', 'sleep'],
      purity: '≥99%', badges: [],
      blurb: 'Synthetic tetrapeptide studied in telomere and pineal research.',
      description:
        'A synthetic tetrapeptide (Ala-Glu-Asp-Gly) developed from pineal gland extract research. ' +
        'Referenced in telomerase-activity and circadian-signalling literature.',
      sizes: [{ label: '10mg', price: 54.99, stock: 'in' }, { label: '20mg', price: 89.99, stock: 'in' }],
      pairsWith: ['dsip', 'ghk-cu'],
      researchRefs: ['[REF PLACEHOLDER] Telomerase / pineal peptide literature — add verified citation'],
    },
    {
      id: 'dsip', name: 'DSIP', category: 'peptide', goals: ['sleep'],
      purity: '≥99%', badges: [],
      blurb: 'Delta sleep-inducing peptide — nonapeptide first isolated from rabbit cerebral venous blood.',
      description:
        'A nonapeptide originally isolated in sleep-physiology research. ' +
        'Appears in EEG and circadian-rhythm animal-model literature.',
      sizes: [{ label: '5mg', price: 44.99, stock: 'in' }],
      pairsWith: ['epitalon', 'selank'],
      researchRefs: ['[REF PLACEHOLDER] Delta-wave sleep model literature — add verified citation'],
    },
    {
      id: 'semax', name: 'Semax', category: 'peptide', goals: ['cognition'],
      purity: '≥99%', badges: [],
      blurb: 'Synthetic heptapeptide analogue of an ACTH fragment.',
      description:
        'A synthetic peptide derived from the ACTH(4-10) fragment with a C-terminal Pro-Gly-Pro extension. ' +
        'Studied in neurotrophic-factor expression and cognitive-model research.',
      sizes: [{ label: '10mg', price: 49.99, stock: 'in' }, { label: '30mg', price: 99.99, stock: 'in' }],
      pairsWith: ['selank', 'dihexa'],
      researchRefs: ['[REF PLACEHOLDER] ACTH-fragment neurotrophic literature — add verified citation'],
    },
    {
      id: 'selank', name: 'Selank', category: 'peptide', goals: ['cognition'],
      purity: '≥99%', badges: [],
      blurb: 'Synthetic heptapeptide analogue of tuftsin.',
      description:
        'A synthetic analogue of the endogenous immunomodulatory peptide tuftsin, extended with Pro-Gly-Pro. ' +
        'Referenced in anxiolytic-model and neuropeptide research.',
      sizes: [{ label: '10mg', price: 49.99, stock: 'in' }],
      pairsWith: ['semax', 'dsip'],
      researchRefs: ['[REF PLACEHOLDER] Tuftsin analogue behavioural-model literature — add verified citation'],
    },
    {
      id: 'dihexa', name: 'Dihexa', category: 'peptide', goals: ['cognition'],
      purity: '≥99%', badges: ['new'],
      blurb: 'Small-molecule angiotensin IV analogue.',
      description:
        'An orally-stable analogue derived from angiotensin IV research, studied for hepatocyte growth factor / c-Met ' +
        'signalling in neuroscience models.',
      sizes: [{ label: '20mg', price: 64.99, stock: 'in' }],
      pairsWith: ['semax', 'selank'],
      researchRefs: ['[REF PLACEHOLDER] HGF/c-Met signalling literature — add verified citation'],
    },
    {
      id: 'kpv', name: 'KPV', category: 'peptide', goals: ['immune', 'recovery'],
      purity: '≥99%', badges: [],
      blurb: 'C-terminal tripeptide fragment of alpha-MSH.',
      description:
        'A tripeptide (Lys-Pro-Val) corresponding to the C-terminal fragment of alpha-melanocyte-stimulating hormone. ' +
        'Appears in inflammatory-pathway and mucosal research models.',
      sizes: [{ label: '10mg', price: 54.99, stock: 'in' }],
      pairsWith: ['bpc-157', 'll-37'],
      researchRefs: ['[REF PLACEHOLDER] Alpha-MSH fragment inflammatory-model literature — add verified citation'],
    },
    {
      id: 'll-37', name: 'LL-37', category: 'peptide', goals: ['immune'],
      purity: '≥99%', badges: [],
      blurb: 'Human cathelicidin-derived antimicrobial peptide.',
      description:
        'A 37-residue peptide derived from the human cathelicidin precursor protein hCAP18. ' +
        'Widely used in antimicrobial-peptide and innate-immunity in-vitro research.',
      sizes: [{ label: '5mg', price: 64.99, stock: 'in' }],
      pairsWith: ['kpv', 'thymosin-alpha-1'],
      researchRefs: ['[REF PLACEHOLDER] Cathelicidin innate-immunity literature — add verified citation'],
    },
    {
      id: 'thymosin-alpha-1', name: 'Thymosin Alpha-1', category: 'peptide', goals: ['immune'],
      purity: '≥99%', badges: [],
      blurb: '28-amino-acid peptide originally isolated from thymic tissue.',
      description:
        'A synthetic version of a peptide first characterised from thymus extract. ' +
        'Frequently referenced in T-cell and immunomodulation research literature.',
      sizes: [{ label: '5mg', price: 64.99, stock: 'in' }, { label: '10mg', price: 109.99, stock: 'in' }],
      pairsWith: ['ll-37', 'glutathione'],
      researchRefs: ['[REF PLACEHOLDER] Thymic peptide immunomodulation literature — add verified citation'],
    },
    {
      id: 'glutathione', name: 'Glutathione', category: 'peptide', goals: ['longevity', 'cosmetic'],
      purity: '≥99%', badges: [],
      blurb: 'Endogenous tripeptide antioxidant, lyophilised.',
      description:
        'The tripeptide gamma-glutamyl-cysteinyl-glycine, central to cellular redox research. ' +
        'Supplied lyophilised for in-vitro oxidative-stress work.',
      sizes: [{ label: '600mg', price: 44.99, stock: 'in' }],
      pairsWith: ['ghk-cu', 'thymosin-alpha-1'],
      researchRefs: ['[REF PLACEHOLDER] Cellular redox / oxidative stress literature — add verified citation'],
    },
    {
      id: 'kisspeptin', name: 'Kisspeptin-10', category: 'peptide', goals: ['metabolic', 'longevity'],
      purity: '≥99%', badges: [],
      blurb: 'Decapeptide fragment of the KISS1 gene product.',
      description:
        'A 10-amino-acid fragment of the kisspeptin family, encoded by the KISS1 gene. ' +
        'Studied in reproductive-endocrinology and GnRH-signalling models.',
      sizes: [{ label: '5mg', price: 59.99, stock: 'in' }],
      pairsWith: ['oxytocin', 'cjc-1295'],
      researchRefs: ['[REF PLACEHOLDER] KISS1 / GnRH signalling literature — add verified citation'],
    },
    {
      id: 'oxytocin', name: 'Oxytocin', category: 'peptide', goals: ['cognition'],
      purity: '≥99%', badges: [],
      blurb: 'Nine-amino-acid cyclic neuropeptide.',
      description:
        'A cyclic nonapeptide neurohypophysial hormone. ' +
        'Appears extensively in social-behaviour and receptor-binding research models.',
      sizes: [{ label: '2mg', price: 44.99, stock: 'in' }],
      pairsWith: ['kisspeptin', 'dsip'],
      researchRefs: ['[REF PLACEHOLDER] Oxytocin receptor-binding literature — add verified citation'],
    },
    {
      id: 'bac-water', name: 'Bacteriostatic Water', category: 'supply', goals: [],
      purity: '0.9% benzyl alcohol', badges: ['essential'],
      blurb: 'Sterile water with 0.9% benzyl alcohol, 10ml multi-dose vial.',
      description:
        'Sterile bacteriostatic water containing 0.9% benzyl alcohol as a preservative. ' +
        'Standard laboratory diluent for reconstituting lyophilised peptides. Multi-dose 10ml vial.',
      sizes: [{ label: '10ml', price: 9.99, stock: 'in' }, { label: '10ml × 3', price: 24.99, stock: 'in' }],
      pairsWith: [],
      researchRefs: [],
    },
    {
      id: 'lab-kit', name: 'Reconstitution Kit', category: 'supply', goals: [],
      purity: 'Sterile', badges: [],
      blurb: 'Alcohol swabs, sterile syringes and vial adapters for laboratory handling.',
      description:
        'Laboratory consumables bundle: 100 alcohol prep swabs, 100 sterile 1ml graduated syringes with 29g needles, ' +
        'and a sharps container. For laboratory handling of research materials.',
      sizes: [{ label: 'Kit', price: 29.99, stock: 'in' }],
      pairsWith: ['bac-water'],
      researchRefs: [],
    },
  ],

  // Pre-built stacks. `discountPct` applies while the full set is in the cart.
  stacks: [
    {
      id: 'stack-wolverine', name: 'Wolverine Stack', discountPct: 15,
      productIds: ['bpc-157', 'tb-500'],
      goal: 'recovery',
      blurb: 'The two most-referenced compounds in tissue-repair literature, commonly researched together.',
    },
    {
      id: 'stack-klow', name: 'KLOW Stack', discountPct: 20,
      productIds: ['kpv', 'ghk-cu', 'bpc-157', 'tb-500'],
      goal: 'recovery',
      blurb: 'A four-compound combination that appears together across repair and inflammatory research models.',
    },
    {
      id: 'stack-glow', name: 'Glow Stack', discountPct: 12,
      productIds: ['ghk-cu', 'glutathione', 'bpc-157'],
      goal: 'cosmetic',
      blurb: 'Dermal and redox research compounds, grouped as they commonly appear in cosmetic-science literature.',
    },
    {
      id: 'stack-gh', name: 'CJC-1295 / Ipamorelin', discountPct: 10,
      productIds: ['cjc-1295', 'ipamorelin'],
      goal: 'growth',
      blurb: 'The classic GHRH-analogue and secretagogue pairing used in comparative endocrine studies.',
    },
    {
      id: 'stack-cognition', name: 'Cognition Stack', discountPct: 12,
      productIds: ['semax', 'selank', 'dihexa'],
      goal: 'cognition',
      blurb: 'Three neuropeptide research compounds frequently studied side by side.',
    },
    {
      id: 'stack-longevity', name: 'Longevity Stack', discountPct: 15,
      productIds: ['epitalon', 'mots-c', 'glutathione'],
      goal: 'longevity',
      blurb: 'Cellular-ageing and mitochondrial research compounds, commonly grouped in the literature.',
    },
  ],

  /* --- Education layer.
     Structure and framing are final. Figures are deliberately absent: real
     content drops in after regulatory review, same as `disclaimer`. -------- */
  guides: [
    {
      slug: 'reading-a-coa',
      title: 'How to read a Certificate of Analysis',
      minutes: 4,
      summary: 'What the HPLC trace, mass spec result and batch identifiers on your COA actually tell you.',
      body: [
        { h: 'What a COA is', p: 'A Certificate of Analysis is the independent lab’s report on a specific batch. It is batch-specific — a COA for one batch says nothing about another. Every BioHack Gold batch is tested by ' + 'an independent analytical lab and the report is published against the batch number printed on your vial.' },
        { h: 'The HPLC trace', p: 'High-performance liquid chromatography separates the sample into its components. You are looking for one dominant peak. The purity figure is the area of that peak as a percentage of total peak area. A trace with several significant peaks indicates a less pure sample regardless of the headline number.' },
        { h: 'Mass spectrometry', p: 'Mass spec confirms identity rather than purity: it measures the molecular weight of what is in the vial and compares it to the theoretical weight of the sequence. A match confirms you have the compound the label claims.' },
        { h: 'Matching the batch', p: 'Check that the batch number on the COA matches the batch number on the vial label. If they do not match, the report does not describe your material. Every batch we dispatch is traceable this way.' },
        { h: 'What a COA does not tell you', p: 'A COA reports on chemical identity and purity. It is not a safety assessment, it does not indicate suitability for any use in humans or animals, and it does not constitute approval of any kind.' },
      ],
    },
    {
      slug: 'reconstitution',
      title: 'Reconstitution in the laboratory',
      minutes: 5,
      summary: 'How lyophilised material is brought into solution, and what the literature reports about diluent choice.',
      body: [
        { h: 'Why material arrives lyophilised', p: 'Peptides are freeze-dried for stability in transit and storage. In dry form they are considerably more stable than in solution, which is why cold-chain dispatch and dry storage matter.' },
        { h: 'Diluent', p: 'Published laboratory protocols most commonly use bacteriostatic water — sterile water containing 0.9% benzyl alcohol as a preservative — for multi-use preparations, and sterile water for single-use preparations. The benzyl alcohol is what allows a reconstituted vial to be drawn from more than once under laboratory conditions.' },
        { h: 'Technique reported in protocols', p: 'Protocols describe directing the diluent slowly down the inner wall of the vial rather than onto the lyophilised cake directly, then allowing the material to dissolve without agitation. Shaking is consistently discouraged in the literature as peptide bonds can be disrupted by mechanical stress. Swirling gently is the standard described approach.' },
        { h: 'Concentration', p: 'Concentration is simply the mass in the vial divided by the volume of diluent added. Researchers select a working volume that makes their intended measurements convenient. We do not publish volumes or quantities — that is a matter for the research protocol being followed, not for a supplier.' },
        { h: 'After reconstitution', p: 'Literature on peptide handling reports significantly reduced stability once in solution, with refrigeration standard and light exposure minimised. See the storage guide for what published handling protocols describe.' },
      ],
    },
    {
      slug: 'storage-and-cold-chain',
      title: 'Storage and cold-chain handling',
      minutes: 3,
      summary: 'What published handling protocols describe for lyophilised and reconstituted material.',
      body: [
        { h: 'On arrival', p: 'Material is dispatched cold. Handling protocols describe transferring to refrigeration promptly on receipt and inspecting the vial seal and the lyophilised cake — an intact cake and seal are what you are checking for.' },
        { h: 'Lyophilised storage', p: 'Dry material is described in the literature as stable under refrigeration for extended periods, and for longer periods under freezing. Repeated temperature cycling is consistently identified as the main degradation risk, so protocols favour a stable location over a frequently opened door shelf.' },
        { h: 'Reconstituted storage', p: 'Once in solution, published protocols describe refrigerated storage, protection from light, and a considerably shorter usable window than dry material. Freezing reconstituted peptide is generally discouraged in handling literature due to freeze-thaw degradation.' },
        { h: 'Chain of custody', p: 'Recording batch numbers, arrival condition and reconstitution dates against your own records is standard laboratory practice and is what makes results reproducible.' },
      ],
    },
    {
      slug: 'how-literature-reports-concentrations',
      title: 'How research literature reports concentrations',
      minutes: 4,
      summary: 'Reading quantities in published studies — units, models, and why they do not transfer.',
      body: [
        { h: 'Units you will encounter', p: 'Preclinical literature typically reports quantities per unit mass of the animal model (for example mg/kg) or as a molar concentration in an in-vitro preparation (for example µM or nM). These are different kinds of measurement and are not interchangeable.' },
        { h: 'Model matters more than the number', p: 'A figure reported in a rodent model describes that model. Species differences in metabolism, clearance and receptor expression mean published figures do not transfer between models, and certainly not to any human context. This is the single most common misreading of preclinical literature.' },
        { h: 'Why we publish no figures', p: 'BioHack Gold is a research supplier, not a clinical or advisory service. We do not publish quantities, schedules or protocols, because doing so would amount to advising on use — which we do not do and are not qualified to do. Your protocol comes from your own research design and the primary literature you are working from.' },
        { h: 'Finding primary sources', p: 'PubMed and the references section of any review paper are the standard route to primary literature. Review papers are useful maps; the primary study is where the method actually lives. Our product pages link the literature areas each compound appears in.' },
      ],
    },
  ],
}

/* ============================================================================
   Derived lookups + small helpers
   ========================================================================== */

const PRODUCTS = Object.fromEntries(BIZ.products.map(p => [p.id, p]))
const money = n => '£' + Number(n).toFixed(2)
const cx = (...a) => a.filter(Boolean).join(' ')

const LS = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem('bhg.' + key)
      return raw ? JSON.parse(raw) : fallback
    } catch { return fallback }
  },
  set(key, value) {
    try { localStorage.setItem('bhg.' + key, JSON.stringify(value)) } catch { /* quota / private mode */ }
  },
}

function tierFor(distinctCount) {
  let pct = 0
  for (const t of BIZ.discountTiers) if (distinctCount >= t.minItems) pct = t.pct
  return pct
}
function nextTierFor(distinctCount) {
  return BIZ.discountTiers.find(t => distinctCount < t.minItems) || null
}
function priceOf(productId, sizeLabel) {
  const p = PRODUCTS[productId]
  if (!p) return 0
  const s = p.sizes.find(x => x.label === sizeLabel) || p.sizes[0]
  return s ? s.price : 0
}
function fromPrice(p) {
  return Math.min(...p.sizes.map(s => s.price))
}
function stackMath(stack) {
  const full = stack.productIds.reduce((a, id) => a + fromPrice(PRODUCTS[id]), 0)
  const now = full * (1 - stack.discountPct / 100)
  return { full, now, saving: full - now }
}
/* Payment references are typed by hand into banking apps, so the alphabet
   excludes characters that get misread: 0/O, 1/I/L, 5/S, 8/B, U/V. */
const REF_ALPHABET = '234679ACDEFGHJKMNPQRTWXY'
function makeRef() {
  let s = ''
  const now = Date.now()
  for (let i = 0; i < 7; i++) {
    const source = i < 4 ? Math.floor(now / Math.pow(REF_ALPHABET.length, i)) : Math.floor(Math.random() * 1e6)
    s += REF_ALPHABET[source % REF_ALPHABET.length]
  }
  return `${BIZ.bank.refPrefix}-${s}`
}
function uid() {
  return Math.random().toString(36).slice(2, 9)
}

/* ---- getting a placed order out of the browser ---------------------------- */

function orderSummaryText(order) {
  const lines = order.lines.map(l => `${l.qty} x ${l.name} ${l.size} — ${money(l.price * l.qty)}`)
  return [
    `Order reference: ${order.ref}`,
    `Placed: ${new Date(order.createdAt).toLocaleString('en-GB')}`,
    '',
    ...lines,
    order.discount > 0 ? `Stack discount: −${money(order.discount)}` : '',
    `Total to pay: ${money(order.total)}`,
    '',
    `Name: ${order.customer.name}`,
    `Email: ${order.customer.email}`,
    order.customer.phone ? `Phone: ${order.customer.phone}` : '',
    `Address: ${order.customer.line1}, ${order.customer.city}, ${order.customer.postcode}`,
    '',
    `Payment: UK bank transfer to ${BIZ.bank.accountName}, quoting ${order.ref}.`,
    'Confirmed 18+ and for in-vitro laboratory research use only.',
  ].filter(Boolean).join('\n')
}

/* Addressed to the shop and copied to the customer, so one tap both places the
   order and leaves them a record of it. */
function orderMailHref(order) {
  const to = BIZ.orders?.notifyEmail || BIZ.email
  const cc = order.customer?.email || ''
  const subject = `Order ${order.ref} — ${money(order.total)}`
  return `mailto:${to}?${cc ? `cc=${encodeURIComponent(cc)}&` : ''}` +
    `subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(orderSummaryText(order))}`
}

/* Everything a bank needs, in one clipboard hit — the next best thing to the
   app-to-app handoff when no provider is configured. */
function paymentDetailsText(order) {
  return [
    `${BIZ.bank.accountName}`,
    `Sort code: ${BIZ.bank.sortCode}`,
    `Account number: ${BIZ.bank.accountNumber}`,
    `Amount: ${money(order.total)}`,
    `Reference: ${order.ref}`,
  ].join('\n')
}

/* Hands the order to the payment initiation provider and returns the URL that
   opens the customer's banking app. Null means no provider configured. */
async function createBankPayment(order) {
  const url = BIZ.payments?.pisp?.createUrl
  if (!url) return null
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      reference: order.ref,
      amount: order.total,
      currency: 'GBP',
      payee: {
        name: BIZ.bank.accountName,
        sortCode: BIZ.bank.sortCode.replace(/-/g, ''),
        accountNumber: BIZ.bank.accountNumber,
      },
      customer: { name: order.customer.name, email: order.customer.email },
    }),
  })
  if (!res.ok) throw new Error(`Payment provider returned ${res.status}`)
  const data = await res.json()
  if (!data?.redirectUrl) throw new Error('Payment provider returned no redirectUrl')
  return data.redirectUrl
}

async function deliverOrder(order) {
  const ep = BIZ.orders?.endpoint
  if (!ep) return false
  try {
    const res = await fetch(ep, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        reference: order.ref,
        placed: new Date(order.createdAt).toISOString(),
        status: order.status,
        total: order.total,
        subtotal: order.subtotal,
        discount: order.discount,
        customer: order.customer,
        items: order.lines.map(l => ({ name: l.name, size: l.size, qty: l.qty, price: l.price })),
        summary: orderSummaryText(order),
      }),
    })
    return res.ok
  } catch {
    return false   // offline, blocked, or a bad endpoint — the fallback covers it
  }
}

/* --- Cart maths -------------------------------------------------------------
   Lines carry an optional bundleId. Loose lines earn the automatic tier
   discount on distinct products. Bundle lines keep their fixed stack discount
   only while the full original set is present — otherwise they fall back to the
   tier ladder, so a part-dismantled stack can never overpay its discount.     */
function computeCart(cart) {
  const groups = {}
  for (const l of cart.lines) {
    const k = l.bundleId || '__loose'
    if (!groups[k]) groups[k] = []
    groups[k].push(l)
  }
  const out = { groups: [], subtotal: 0, discount: 0, total: 0, count: 0 }
  for (const [key, lines] of Object.entries(groups)) {
    const sub = lines.reduce((a, l) => a + priceOf(l.productId, l.size) * l.qty, 0)
    const ids = new Set(lines.map(l => l.productId))
    const bundle = cart.bundles[key]
    let pct
    if (key === '__loose') pct = tierFor(ids.size)
    else if (bundle && bundle.kind === 'stack' && bundle.origIds.every(id => ids.has(id))) pct = bundle.discountPct
    else pct = tierFor(ids.size)
    const disc = sub * pct / 100
    out.groups.push({
      key, lines, sub, pct, disc,
      distinct: ids.size,
      kind: key === '__loose' ? 'loose' : (bundle?.kind || 'custom'),
      name: key === '__loose' ? 'Individual vials' : (bundle?.name || 'Custom stack'),
      complete: key === '__loose' ? true : !bundle || bundle.kind !== 'stack' || bundle.origIds.every(id => ids.has(id)),
    })
    out.subtotal += sub
    out.discount += disc
    out.count += lines.reduce((a, l) => a + l.qty, 0)
  }
  out.groups.sort((a, b) => (a.kind === 'loose' ? 1 : 0) - (b.kind === 'loose' ? 1 : 0))
  out.total = out.subtotal - out.discount
  return out
}

/* ============================================================================
   Styles — one stylesheet, generated from BIZ.palette
   ========================================================================== */

const styles = (c) => `
*, *::before, *::after { box-sizing: border-box; }
:root {
  --bg:${c.bg}; --surface:${c.surface}; --surfaceAlt:${c.surfaceAlt}; --border:${c.border};
  --text:${c.text}; --muted:${c.textMuted}; --primary:${c.primary}; --primaryDim:${c.primaryDim};
  --accent:${c.accent}; --good:${c.good};
  --navh: 58px;                 /* the pill itself */
  --nav: 80px;                  /* pill + the gap it floats above */
}
body { margin:0; }
.app {
  min-height:100dvh; background:var(--bg); color:var(--text);
  font-family: ui-sans-serif, -apple-system, "SF Pro Text", "Segoe UI", Inter, system-ui, sans-serif;
  -webkit-font-smoothing:antialiased; font-size:15px; line-height:1.5;
  padding-bottom: calc(var(--nav) + env(safe-area-inset-bottom));
}
.mono { font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; }
h1,h2,h3,h4 { margin:0; font-weight:600; letter-spacing:-0.02em; line-height:1.15; }
p { margin:0; }
button { font:inherit; color:inherit; background:none; border:none; cursor:pointer; }
a { color:inherit; }
input, select, textarea { font:inherit; }

/* ---------- chrome ---------- */
/* No header bar: the logo and the icons float over whatever is underneath, so
   the hero runs full-bleed to the very top. Each control carries its own glass
   so it stays legible over film, over photography and over plain background. */
.floatbar {
  position:fixed; top:0; left:0; right:0; z-index:40;
  display:flex; align-items:center; gap:10px;
  padding:12px 14px; padding-top:max(12px, env(safe-area-inset-top));
  pointer-events:none;   /* the gaps must not swallow taps on what's beneath */
}
.floatbar > * { pointer-events:auto; }
.brand {
  display:flex; align-items:center; gap:9px; font-weight:650;
  letter-spacing:-0.03em; font-size:16.5px;
  padding:6px 13px 6px 7px; border-radius:999px;
  background:rgba(10,10,11,.42); border:1px solid rgba(243,240,233,.10);
  backdrop-filter:blur(14px) saturate(1.4); -webkit-backdrop-filter:blur(14px) saturate(1.4);
  text-shadow:0 1px 8px rgba(0,0,0,.5);
}
.brand-mark {
  width:26px; height:26px; border-radius:7px; display:grid; place-items:center; flex:none;
  background:linear-gradient(150deg, var(--primary), var(--primaryDim));
  color:#14120C; font-size:11px; font-weight:800; letter-spacing:-0.04em;
}
.spacer { flex:1; }
.iconbtn {
  position:relative; width:38px; height:38px; border-radius:999px; display:grid; place-items:center;
  border:1px solid rgba(243,240,233,.10); background:rgba(10,10,11,.42);
  backdrop-filter:blur(14px) saturate(1.4); -webkit-backdrop-filter:blur(14px) saturate(1.4);
  transition:transform .12s, background .16s;
}
.iconbtn:active { transform:scale(.93); }
.iconbtn .count {
  position:absolute; top:-5px; right:-5px; min-width:18px; height:18px; padding:0 5px;
  border-radius:9px; background:var(--primary); color:#14120C;
  font-size:10.5px; font-weight:800; display:grid; place-items:center; border:2px solid var(--bg);
}
.strip {
  padding:8px 16px; font-size:10.5px; letter-spacing:.09em; text-transform:uppercase;
  color:var(--muted); background:var(--surfaceAlt);
  border-top:1px solid var(--border); border-bottom:1px solid var(--border); text-align:center;
}
.strip b { color:var(--accent); font-weight:600; }

.below-floatbar { padding-top:calc(58px + env(safe-area-inset-top)); }
.wrap { max-width:1180px; margin:0 auto; padding:0 16px; }
.view { animation:viewIn .26s cubic-bezier(.22,.8,.3,1); }
@keyframes viewIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }
.section { padding:26px 0; }
.section-head { display:flex; align-items:flex-end; gap:12px; margin-bottom:14px; }
.section-head h2 { font-size:20px; }
.eyebrow { font-size:10.5px; letter-spacing:.14em; text-transform:uppercase; color:var(--primary); font-weight:700; margin-bottom:7px; }
.muted { color:var(--muted); }
.small { font-size:13px; }
.tiny { font-size:11.5px; }
.link { color:var(--primary); font-weight:600; text-decoration:none; border-bottom:1px solid color-mix(in srgb, var(--primary) 40%, transparent); }

/* ---------- buttons ---------- */
.btn {
  display:inline-flex; align-items:center; justify-content:center; gap:8px;
  padding:13px 18px; border-radius:13px; font-weight:650; font-size:14.5px;
  text-decoration:none;   /* some buttons are anchors (mailto) */
  border:1px solid var(--border); background:var(--surfaceAlt);
  transition:transform .12s cubic-bezier(.3,1.4,.5,1), filter .15s, opacity .15s;
  -webkit-tap-highlight-color:transparent;
}
.btn:active { transform:scale(.97); }
.btn-primary { background:linear-gradient(160deg, var(--primary), color-mix(in srgb, var(--primary) 72%, #7A5C1E)); color:#14120C; border-color:transparent; }
.btn-block { width:100%; }
.btn-sm { padding:9px 13px; font-size:13px; border-radius:10px; }
.btn[disabled] { opacity:.42; pointer-events:none; }
.btn-ghost { background:transparent; }

/* ---------- cinematic hero ---------- */
.hero-cinema {
  position:relative; overflow:hidden; display:flex; align-items:flex-end;
  min-height:min(78dvh, 620px); margin-bottom:6px;
  background:
    radial-gradient(120% 80% at 72% 18%, color-mix(in srgb, var(--primary) 13%, transparent), transparent 62%),
    radial-gradient(90% 70% at 20% 90%, color-mix(in srgb, var(--accent) 9%, transparent), transparent 60%),
    var(--bg);
}
.hero-media { position:absolute; inset:0; }
.hero-still, .hero-video, .hero-freeze {
  position:absolute; inset:0; width:100%; height:100%; object-fit:cover;
}
.hero-still { background-size:cover; background-position:center; }
/* Autoplay clips start transparent and reveal on the playing event, so nothing
   the element paints is visible in the gap before the script decides. */
.hero-video { opacity:0; transition:opacity .6s ease; }
.hero-video.is-playing { opacity:1; }
.hero-media video { pointer-events:none; }
video::-webkit-media-controls,
video::-webkit-media-controls-start-playback-button,
video::-webkit-media-controls-panel,
video::-webkit-media-controls-overlay-play-button {
  display:none !important; -webkit-appearance:none;
}
.hero-freeze { opacity:0; transition:opacity .12s linear; pointer-events:none; }
.hero-freeze.is-shown { opacity:1; }
.hero-scrim {
  position:absolute; inset:0;
  background:linear-gradient(180deg, rgba(8,8,9,.72) 0%, rgba(8,8,9,.30) 42%, rgba(8,8,9,.88) 100%);
}
.sound-chip {
  position:absolute; right:14px; bottom:14px; z-index:3;
  display:inline-flex; align-items:center; gap:7px; padding:8px 13px; border-radius:999px;
  border:1px solid color-mix(in srgb, var(--text) 20%, transparent);
  background:rgba(10,10,11,.55); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px);
  font-size:11.5px; font-weight:650; letter-spacing:.02em; color:var(--text);
}
.sound-chip.is-muted { color:var(--muted); }
.hero-copy { position:relative; z-index:2; padding-top:60px; padding-bottom:30px; width:100%; }
@media (prefers-reduced-motion: reduce) { .hero-media video { display:none; } }

/* ---------- trust ---------- */
.hero-copy h1 { font-size:clamp(31px, 7.6vw, 52px); letter-spacing:-0.035em; text-shadow:0 2px 24px rgba(0,0,0,.5); }
.hero-copy h1 em { font-style:normal; color:var(--primary); }
.hero-copy p.sub {
  color:color-mix(in srgb, var(--text) 82%, transparent); margin-top:14px; font-size:15.5px;
  max-width:42ch; text-shadow:0 1px 16px rgba(0,0,0,.6);
}
.hero-cta { display:flex; gap:10px; margin-top:22px; flex-wrap:wrap; }
.verify-pill {
  display:inline-flex; align-items:center; gap:8px; padding:7px 12px; border-radius:999px;
  border:1px solid color-mix(in srgb, var(--accent) 30%, transparent);
  background:color-mix(in srgb, var(--accent) 9%, transparent);
  color:var(--accent); font-size:12px; font-weight:600; margin-bottom:16px;
}
.trustgrid { display:grid; grid-template-columns:repeat(2,1fr); gap:9px; }
.trustcard {
  padding:14px; border-radius:14px; background:var(--surface); border:1px solid var(--border);
}
.trustcard .ti { color:var(--accent); margin-bottom:9px; display:block; }
.trustcard b { display:block; font-size:13.5px; font-weight:650; }
.trustcard span { display:block; font-size:11.5px; color:var(--muted); margin-top:3px; line-height:1.35; }
.statbar {
  display:grid; grid-template-columns:repeat(4,1fr); gap:1px; background:var(--border);
  border:1px solid var(--border); border-radius:14px; overflow:hidden;
}
.statbar div { background:var(--surface); padding:14px 8px; text-align:center; }
.statbar b { display:block; font-size:17px; color:var(--primary); font-weight:700; letter-spacing:-0.02em; }
.statbar span { font-size:10.5px; color:var(--muted); letter-spacing:.04em; }

/* ---------- product grid ---------- */
.grid { display:grid; grid-template-columns:repeat(2,1fr); gap:11px; }
.grid-1 { grid-template-columns:1fr; }
.card {
  background:var(--surface); border:1px solid var(--border); border-radius:16px; overflow:hidden;
  display:flex; flex-direction:column; text-align:left; transition:transform .14s, border-color .2s;
}
.card:active { transform:scale(.985); }
.card-media { position:relative; aspect-ratio:1/1; background:
  radial-gradient(120% 90% at 50% 0%, var(--surfaceAlt), var(--surface) 70%); display:grid; place-items:center; }
.card-body { padding:11px 12px 13px; display:flex; flex-direction:column; gap:3px; flex:1; }
.card-body h3 { font-size:14.5px; }
.card-blurb { font-size:11.5px; color:var(--muted); line-height:1.35; flex:1; margin-top:2px;
  display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.card-foot { display:flex; align-items:baseline; justify-content:space-between; margin-top:9px; gap:6px; }
.price { font-weight:700; font-size:15px; letter-spacing:-0.02em; }
.price small { font-weight:500; color:var(--muted); font-size:11px; }
.chip {
  display:inline-flex; align-items:center; gap:4px; padding:3px 7px; border-radius:6px;
  font-size:10px; font-weight:700; letter-spacing:.05em; text-transform:uppercase;
}
.chip-purity { background:color-mix(in srgb, var(--accent) 13%, transparent); color:var(--accent); }
.chip-gold { background:color-mix(in srgb, var(--primary) 14%, transparent); color:var(--primary); }
.chip-out { background:#2A2A2E; color:var(--muted); }
.card-tags { position:absolute; top:9px; left:9px; display:flex; gap:5px; flex-wrap:wrap; }

/* ---------- filters ---------- */
.filters { display:flex; gap:7px; overflow-x:auto; padding:3px 0 12px; scrollbar-width:none; -ms-overflow-style:none; }
.filters::-webkit-scrollbar { display:none; }
.filter {
  flex:none; padding:8px 13px; border-radius:999px; font-size:12.5px; font-weight:600; white-space:nowrap;
  border:1px solid var(--border); background:var(--surface); color:var(--muted); transition:.15s;
}
.filter.on { background:var(--primary); color:#14120C; border-color:transparent; }

/* ---------- product detail ---------- */
.pdp-media { border-radius:18px; background:radial-gradient(120% 90% at 50% 0%, var(--surfaceAlt), var(--surface) 72%);
  border:1px solid var(--border); aspect-ratio:1/1; max-height:340px; display:grid; place-items:center; }
.sizes { display:flex; gap:8px; flex-wrap:wrap; }
.size {
  padding:11px 15px; border-radius:12px; border:1px solid var(--border); background:var(--surface);
  font-size:13.5px; font-weight:600; transition:.15s; text-align:left;
}
.size.on { border-color:var(--primary); background:color-mix(in srgb, var(--primary) 11%, transparent); color:var(--primary); }
.size small { display:block; font-weight:500; font-size:11px; opacity:.75; }
.panel { background:var(--surface); border:1px solid var(--border); border-radius:15px; padding:15px; }
.reflist { display:flex; flex-direction:column; gap:9px; }
.reflist li { list-style:none; font-size:12.5px; color:var(--muted); padding-left:16px; position:relative; line-height:1.45; }
.reflist li::before { content:''; position:absolute; left:0; top:7px; width:6px; height:6px; border-radius:50%; background:var(--primaryDim); }
.rowline { display:flex; justify-content:space-between; gap:12px; padding:9px 0; border-bottom:1px solid var(--border); font-size:13.5px; }
.rowline:last-child { border-bottom:none; }

/* ---------- stacks ---------- */
.stackcard { background:var(--surface); border:1px solid var(--border); border-radius:17px; padding:15px; }
.stackcard.feature { border-color:color-mix(in srgb, var(--primary) 34%, transparent);
  background:linear-gradient(165deg, color-mix(in srgb, var(--primary) 7%, var(--surface)), var(--surface)); }
.stack-vials { display:flex; gap:5px; margin:12px 0; }
.saveflag {
  display:inline-flex; align-items:center; gap:5px; padding:4px 9px; border-radius:7px;
  background:var(--primary); color:#14120C; font-size:11.5px; font-weight:800; letter-spacing:.02em;
}
.was { color:var(--muted); text-decoration:line-through; font-size:13px; font-weight:500; }

/* ---------- builder ---------- */
.build-row {
  display:flex; align-items:stretch; padding:0; overflow:hidden; border-radius:13px;
  border:1px solid var(--border); background:var(--surface); transition:.16s; width:100%; text-align:left;
}
.build-toggle {
  flex:1; min-width:0; display:flex; align-items:center; gap:11px; padding:11px; text-align:left;
}
.build-text { flex:1; min-width:0; display:flex; flex-direction:column; gap:2px; }
.build-name { font-weight:650; font-size:14px; }
.build-blurb {
  font-size:11.5px; color:var(--muted); line-height:1.36;
  display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;
}
.build-price { flex:none; display:flex; flex-direction:column; align-items:flex-end; gap:2px; }
.build-info {
  flex:none; width:46px; display:grid; place-items:center; color:var(--muted);
  border-left:1px solid var(--border); transition:.16s;
}
.build-info:hover { color:var(--primary); background:var(--surfaceAlt); }
.build-info:active { transform:scale(.92); }
.build-row.on { border-color:var(--primary); background:color-mix(in srgb, var(--primary) 8%, var(--surface)); }
.build-row.suggested { border-color:color-mix(in srgb, var(--accent) 38%, transparent); }
.tickbox {
  width:22px; height:22px; border-radius:7px; border:1.5px solid var(--border); flex:none;
  display:grid; place-items:center; transition:.15s;
}
.build-row.on .tickbox { background:var(--primary); border-color:var(--primary); color:#14120C; }
.pairtag {
  font-size:10px; font-weight:700; color:var(--accent); letter-spacing:.05em; text-transform:uppercase;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;   /* never push the blurb out of the row */
}
/* ---------- builder: choose an area ---------- */
.goal-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; }
/* Each area is its own labelled specimen, tinted to the domain hue and
   bleeding off the corner. One idea per card: the vial and its glow. */
.goal-card {
  position:relative; overflow:hidden; isolation:isolate;
  min-height:142px; padding:15px; border-radius:16px;
  border:1px solid var(--border); background:var(--surface);
  text-align:left; display:flex; flex-direction:column; justify-content:flex-end;
  transition:border-color .18s, transform .14s;
}
.goal-aura {
  position:absolute; inset:0; z-index:-1; pointer-events:none;
  background:
    radial-gradient(70% 70% at 76% 16%, hsla(var(--gh),62%,56%,.24), transparent 68%),
    linear-gradient(200deg, hsla(var(--gh),50%,40%,.10), transparent 55%);
  transition:opacity .22s;
}
.goal-vial {
  position:absolute; top:-14px; right:-16px; line-height:0; z-index:-1;
  transform:rotate(7deg); transform-origin:center;
  filter:drop-shadow(0 12px 20px rgba(0,0,0,.55));
  transition:transform .28s cubic-bezier(.25,.9,.3,1);
}
.goal-vial-stack { display:flex; align-items:flex-end; gap:-6px; right:-22px; }
.goal-vial-stack > :first-child { transform:rotate(-10deg) translateX(14px); opacity:.75; }
.goal-card:hover { border-color:color-mix(in srgb, var(--primary) 48%, transparent); }
.goal-card:hover .goal-vial { transform:rotate(7deg) translateY(-4px) scale(1.03); }
.goal-card:active { transform:scale(.985); }
.goal-text { position:relative; }
.goal-card h3 { font-size:15.5px; letter-spacing:-0.02em; }
.goal-meta { font-size:11.5px; color:var(--muted); display:block; margin-top:3px; }
.goal-card-all { border-style:dashed; }

.startstack {
  border:1px solid var(--border); border-radius:15px; padding:14px; background:var(--surface);
  display:flex; flex-direction:column; transition:.16s;
}
.startstack.is-loaded {
  border-color:color-mix(in srgb, var(--primary) 45%, transparent);
  background:color-mix(in srgb, var(--primary) 7%, var(--surface));
}

/* Floats above the nav pill and matches its language. */
.summary-dock {
  position:fixed; left:12px; right:12px; bottom:calc(var(--nav) + env(safe-area-inset-bottom)); z-index:35;
  background:rgba(10,10,11,.72); border:1px solid rgba(243,240,233,.10); border-radius:18px;
  backdrop-filter:blur(20px) saturate(1.5); -webkit-backdrop-filter:blur(20px) saturate(1.5);
  box-shadow:0 12px 34px rgba(0,0,0,.5);
  padding:13px 15px;
  animation:dockIn .3s cubic-bezier(.22,.9,.3,1);
}
@keyframes dockIn { from { transform:translateY(100%); } to { transform:none; } }
.dock-inner { max-width:1180px; margin:0 auto; }
.tier-track { height:6px; border-radius:3px; background:var(--surfaceAlt); overflow:hidden; margin:9px 0 10px; }
.tier-fill { height:100%; border-radius:3px; background:linear-gradient(90deg, var(--primaryDim), var(--primary)); transition:width .45s cubic-bezier(.22,.9,.3,1); }
.pulse { animation:pulse .5s ease; }
@keyframes pulse { 0%{transform:scale(1)} 45%{transform:scale(1.14)} 100%{transform:scale(1)} }

/* ---------- drawer ---------- */
.overlay { position:fixed; inset:0; background:rgba(0,0,0,.62); z-index:60; animation:fade .2s; }
@keyframes fade { from { opacity:0 } to { opacity:1 } }
.drawer {
  position:fixed; z-index:61; background:var(--bg); display:flex; flex-direction:column;
  border:1px solid var(--border);
}
.drawer.right {
  top:0; right:0; bottom:0; width:min(420px, 100%); border-radius:20px 0 0 20px;
  animation:slideR .3s cubic-bezier(.22,.9,.3,1);
}
@keyframes slideR { from { transform:translateX(100%) } to { transform:none } }
.drawer.sheet {
  left:0; right:0; bottom:0; max-height:88dvh; border-radius:20px 20px 0 0;
  animation:slideU .32s cubic-bezier(.22,.9,.3,1);
}
@keyframes slideU { from { transform:translateY(100%) } to { transform:none } }
.drawer-head { display:flex; align-items:center; gap:10px; padding:15px 16px; border-bottom:1px solid var(--border); }
.drawer-body { flex:1; overflow-y:auto; padding:14px 16px; -webkit-overflow-scrolling:touch; }
.drawer-foot { padding:14px 16px calc(14px + env(safe-area-inset-bottom)); border-top:1px solid var(--border); background:var(--surface); }
.grab { width:36px; height:4px; border-radius:2px; background:var(--border); margin:8px auto 0; }

.cartgroup { border:1px solid var(--border); border-radius:14px; overflow:hidden; margin-bottom:11px; }
.cartgroup-head { padding:9px 12px; background:var(--surfaceAlt); display:flex; justify-content:space-between; align-items:center; gap:8px; }
.cartline { display:flex; gap:10px; padding:11px 12px; border-top:1px solid var(--border); align-items:center; }
.qty { display:flex; align-items:center; gap:2px; border:1px solid var(--border); border-radius:9px; overflow:hidden; }
.qty button { width:28px; height:28px; display:grid; place-items:center; font-size:16px; color:var(--muted); }
.qty span { min-width:22px; text-align:center; font-size:13px; font-weight:650; }

/* ---------- nav ---------- */
/* Each destination floats on its own, like the controls at the top. Only the
   active one carries its label, which keeps five of them comfortable on a
   narrow phone and makes where-you-are unmistakable. */
.nav {
  position:fixed; left:0; right:0; bottom:calc(10px + env(safe-area-inset-bottom));
  z-index:50; display:flex; justify-content:center; align-items:center; gap:7px;
  padding:0 12px; background:none; border:0; box-shadow:none;
}
.nav-item {
  height:var(--navh); min-width:var(--navh); padding:0 15px; border-radius:999px;
  display:flex; flex-direction:row; align-items:center; justify-content:center; gap:8px;
  color:var(--muted); font-size:12px; font-weight:650; letter-spacing:-0.01em;
  background:rgba(10,10,11,.58); border:1px solid rgba(243,240,233,.10);
  backdrop-filter:blur(18px) saturate(1.5); -webkit-backdrop-filter:blur(18px) saturate(1.5);
  box-shadow:0 8px 22px rgba(0,0,0,.45);
  transition:color .16s, background .2s, border-color .2s, transform .12s;
}
.nav-item span { display:none; }
.nav-item:active { transform:scale(.94); }
.nav-item.on span { display:inline; }
.nav-item.on {
  color:var(--primary);
  background:rgba(10,10,11,.76);
  border-color:color-mix(in srgb, var(--primary) 42%, transparent);
}
/* flex:none is load-bearing — without it the active pill's label wins the
   space fight on a 360px phone and squashes its own icon to zero width. */
.nav-item svg { flex:none; transition:transform .2s cubic-bezier(.3,1.5,.5,1); }
.nav-item.on svg { transform:scale(1.04); }

/* Five pills plus a label is a tight fit once the screen drops under ~380px,
   so buy the room back from the padding rather than from the icons. */
@media (max-width:400px) {
  .nav { gap:6px; padding:0 10px; }
  .nav-item { min-width:52px; padding:0 12px; gap:7px; }
}
/* Very narrow phones: icons only, rather than a cramped half-label. */
@media (max-width:340px) {
  .nav-item.on span { display:none; }
  .nav-item { padding:0; }
}

/* ---------- forms ---------- */
.field { margin-bottom:12px; }
.field label { display:block; font-size:12px; font-weight:600; color:var(--muted); margin-bottom:6px; }
.input {
  width:100%; padding:12px 13px; border-radius:12px; background:var(--surface);
  border:1px solid var(--border); color:var(--text); outline:none; transition:.15s; font-size:15px;
}
.input:focus { border-color:var(--primary); }
.input.bad { border-color:#E06A5A; }
.err { color:#E06A5A; font-size:11.5px; margin-top:5px; }
.checkrow { display:flex; gap:11px; align-items:flex-start; padding:13px; border:1px solid var(--border);
  border-radius:13px; background:var(--surface); margin-bottom:11px; text-align:left; width:100%; }
.checkrow .tickbox { margin-top:1px; }
.checkrow.on { border-color:var(--primary); }
.checkrow p { font-size:12.5px; line-height:1.45; color:var(--muted); }

.steps { display:flex; gap:6px; margin-bottom:18px; }
.step { flex:1; height:3px; border-radius:2px; background:var(--surfaceAlt); }
.step.on { background:var(--primary); }

.bankrow { display:flex; justify-content:space-between; align-items:center; gap:10px; padding:12px 0; border-bottom:1px solid var(--border); }
.bankrow:last-child { border-bottom:none; }
.bankrow .k { font-size:12px; color:var(--muted); }
.bankrow .v { font-weight:650; letter-spacing:.02em; }
.copybtn { padding:6px 10px; border-radius:8px; border:1px solid var(--border); background:var(--surfaceAlt); font-size:11.5px; font-weight:650; }
.copybtn.done { color:var(--good); border-color:color-mix(in srgb, var(--good) 40%, transparent); }

.status { display:inline-flex; align-items:center; gap:5px; padding:4px 9px; border-radius:7px; font-size:11px; font-weight:700; letter-spacing:.03em; }
.status.awaiting { background:color-mix(in srgb, var(--primary) 15%, transparent); color:var(--primary); }
.status.paid { background:color-mix(in srgb, var(--accent) 15%, transparent); color:var(--accent); }
.status.fulfilled { background:color-mix(in srgb, var(--good) 15%, transparent); color:var(--good); }
.status.cancelled { background:#2A2A2E; color:var(--muted); }

.legal { font-size:11.5px; line-height:1.6; color:var(--muted); }
.legal-box { border:1px solid var(--border); border-radius:14px; padding:14px; background:var(--surface); }

.guide-body h3 { font-size:16px; margin:22px 0 8px; }
.guide-body p { color:var(--muted); font-size:14px; line-height:1.65; }

.toast {
  position:fixed; left:50%; transform:translateX(-50%); bottom:calc(var(--nav) + 18px + env(safe-area-inset-bottom));
  z-index:70; background:var(--text); color:var(--bg); padding:11px 17px; border-radius:12px;
  font-size:13.5px; font-weight:650; box-shadow:0 10px 34px rgba(0,0,0,.45);
  animation:toastIn .28s cubic-bezier(.22,.9,.3,1); max-width:calc(100% - 32px);
}
@keyframes toastIn { from { opacity:0; transform:translate(-50%, 14px) } to { opacity:1; transform:translate(-50%,0) } }

.empty { text-align:center; padding:44px 20px; color:var(--muted); }

/* ---------- desktop ---------- */
@media (min-width:760px) {
  .grid { grid-template-columns:repeat(3,1fr); gap:14px; }
  .trustgrid { grid-template-columns:repeat(4,1fr); }
  .goal-grid { grid-template-columns:repeat(3,1fr); }
  .two-col { display:grid; grid-template-columns:1fr 1fr; gap:28px; align-items:start; }
  .section { padding:34px 0; }
  .hero { padding:44px 0 14px; }
}
@media (min-width:1024px) {
  .grid { grid-template-columns:repeat(4,1fr); }
  .app { --nav: 0px; --navh: auto; padding-bottom:40px; }
  /* Floating on desktop too — no background, no border, so it reads as
     controls over the page rather than a chrome bar across the top. */
  .nav {
    position:fixed; top:0; bottom:auto; grid-template-columns:none; display:flex; justify-content:center;
    gap:4px; background:transparent; backdrop-filter:none; -webkit-backdrop-filter:none;
    border-top:none; border-bottom:none; z-index:41; padding:14px 0;
  }
  .nav-item {
    height:auto; flex-direction:row; gap:7px; padding:9px 15px; border-radius:999px; font-size:13px;
    text-shadow:0 1px 8px rgba(0,0,0,.55);
  }
  .nav-item.on {
    background:rgba(10,10,11,.42); border:1px solid rgba(243,240,233,.10);
    backdrop-filter:blur(14px) saturate(1.4); -webkit-backdrop-filter:blur(14px) saturate(1.4);
  }
  .summary-dock { bottom:0; }
  .topbar { position:relative; }
}
`

/* ============================================================================
   Icons
   ========================================================================== */

const I = {
  home: p => <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20h14V9.5" /></svg>,
  shop: p => <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="7" width="18" height="14" rx="2.5" /><path d="M8.5 7V5.5a3.5 3.5 0 0 1 7 0V7" /></svg>,
  stacks: p => <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3 3 7.5l9 4.5 9-4.5L12 3Z" /><path d="m3 12.5 9 4.5 9-4.5" /><path d="m3 17 9 4.5 9-4.5" /></svg>,
  build: p => <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 6h16M4 12h16M4 18h16" /><circle cx="9" cy="6" r="2.2" fill="currentColor" stroke="none" /><circle cx="15" cy="12" r="2.2" fill="currentColor" stroke="none" /><circle cx="8" cy="18" r="2.2" fill="currentColor" stroke="none" /></svg>,
  user: p => <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" /></svg>,
  cart: p => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 4h2.2l2.3 12.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.55L21 8H6" /><circle cx="10" cy="21" r="1.3" fill="currentColor" /><circle cx="18" cy="21" r="1.3" fill="currentColor" /></svg>,
  book: p => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19v18H5.5A1.5 1.5 0 0 1 4 19.5v-15Z" /><path d="M8 7.5h7M8 11h7" /></svg>,
  check: p => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m5 12.5 5 5L19 6.5" /></svg>,
  close: p => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>,
  back: p => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M14.5 5 8 12l6.5 7" /></svg>,
  chev: p => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m9.5 5 7 7-7 7" /></svg>,
  flask: p => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9.5 3v6.2L4.6 18a2 2 0 0 0 1.75 3h11.3a2 2 0 0 0 1.75-3l-4.9-8.8V3" /><path d="M8 3h8M7.4 14.5h9.2" /></svg>,
  shield: p => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3 4.5 6v6c0 4.5 3.1 8.1 7.5 9 4.4-.9 7.5-4.5 7.5-9V6L12 3Z" /><path d="m9 12 2.2 2.2L15.4 10" /></svg>,
  snow: p => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9" /><path d="M12 6.4 9.6 4.6M12 6.4l2.4-1.8M12 17.6l-2.4 1.8M12 17.6l2.4 1.8" /></svg>,
  truck: p => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M2 6.5h11v10H2z" /><path d="M13 10h4.2l2.8 3.2v3.3h-7" /><circle cx="6.5" cy="18" r="1.9" /><circle cx="16.5" cy="18" r="1.9" /></svg>,
  info: p => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5" /><circle cx="12" cy="7.9" r="1.05" fill="currentColor" stroke="none" /></svg>,
  star: p => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" {...p}><path d="m12 2.8 2.7 5.9 6.3.7-4.7 4.3 1.3 6.3L12 16.8 6.4 20l1.3-6.3L3 9.4l6.3-.7L12 2.8Z" /></svg>,
  spark: p => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 2.5 14 9l6.5 2-6.5 2-2 6.5-2-6.5L3.5 11 10 9l2-6.5Z" /></svg>,
}

/* Vial artwork — generated per product so the app ships with no image assets.
   Swap for photography by adding `img` to a product and rendering it here. */
function Vial({ label, hue = 44, size = 132, dim = false }) {
  const w = size, h = size * 1.18
  const key = String(label).replace(/[^a-zA-Z0-9]/g, '') + hue
  return (
    <svg width={w} height={h} viewBox="0 0 100 118" style={{ opacity: dim ? .55 : 1 }}>
      <defs>
        <linearGradient id={`g${key}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="rgba(255,255,255,.06)" />
          <stop offset=".28" stopColor="rgba(255,255,255,.18)" />
          <stop offset=".55" stopColor="rgba(255,255,255,.04)" />
          <stop offset="1" stopColor="rgba(255,255,255,.13)" />
        </linearGradient>
        <linearGradient id={`l${key}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={`hsla(${hue},58%,66%,.42)`} />
          <stop offset="1" stopColor={`hsla(${hue},58%,42%,.30)`} />
        </linearGradient>
      </defs>
      {/* cap */}
      <rect x="34" y="6" width="32" height="13" rx="3" fill={`hsl(${hue},42%,52%)`} />
      <rect x="37" y="2" width="26" height="6" rx="2.5" fill="rgba(255,255,255,.22)" />
      {/* neck */}
      <path d="M38 19h24v7l3 6H35l3-6v-7Z" fill="rgba(255,255,255,.10)" />
      {/* body */}
      <rect x="29" y="31" width="42" height="76" rx="7" fill="rgba(255,255,255,.05)" stroke="rgba(255,255,255,.14)" strokeWidth="1" />
      <rect x="29" y="31" width="42" height="76" rx="7" fill={`url(#g${key})`} />
      {/* lyophilised cake */}
      <rect x="33" y="86" width="34" height="17" rx="4" fill={`url(#l${key})`} />
      {/* label band */}
      <rect x="29" y="47" width="42" height="30" fill="rgba(12,12,14,.82)" />
      <rect x="29" y="47" width="42" height="30" fill="none" stroke="rgba(255,255,255,.10)" />
      <text x="50" y="60" textAnchor="middle" fill="rgba(255,255,255,.92)"
        fontSize={String(label).length > 7 ? 6.4 : 8.5} fontWeight="700"
        fontFamily="ui-monospace, Menlo, monospace" letterSpacing="-0.2">{String(label).slice(0, 10)}</text>
      <text x="50" y="70" textAnchor="middle" fill={`hsl(${hue},55%,62%)`} fontSize="5.4" fontWeight="600"
        fontFamily="ui-monospace, Menlo, monospace" letterSpacing="0.5">≥99% HPLC</text>
      {/* glass highlight */}
      <rect x="33" y="34" width="4" height="70" rx="2" fill="rgba(255,255,255,.13)" />
    </svg>
  )
}

const GOAL_HUE = {
  recovery: 150, growth: 44, metabolic: 24, cognition: 265,
  cosmetic: 330, sleep: 225, immune: 190, longevity: 82,
}
const hueFor = p => GOAL_HUE[p.goals?.[0]] ?? 44

/* Which of the few generated stills a product borrows. Four images dress the
   whole catalogue; a product can override with its own `shot`. */
const GOAL_SHOT = {
  recovery: 'green', growth: 'gold', metabolic: 'gold', longevity: 'ice',
  immune: 'ice', cognition: 'violet', sleep: 'violet', cosmetic: 'violet',
}

/* Short enough to sit on a vial label without shrinking to nothing. */
const GOAL_CODE = {
  recovery: 'RECOVERY', growth: 'GROWTH', metabolic: 'METABOLIC',
  cognition: 'COGNITION', cosmetic: 'COSMETIC', sleep: 'SLEEP',
  immune: 'IMMUNE', longevity: 'LONGEVITY',
}
const shotFor = p => BIZ.media?.shots?.[p.shot || GOAL_SHOT[p.goals?.[0]] || 'gold']

/* Product artwork: the generated still if it loaded, the drawn vial if not.
   No layout shift either way — both fill the same box. */
function ProductVisual({ product, size = 104, dim = false }) {
  const src = shotFor(product)
  const [failed, setFailed] = useState(false)
  useEffect(() => { setFailed(false) }, [src])
  if (!src || failed) return <Vial label={product.name} hue={hueFor(product)} size={size} dim={dim} />
  return (
    <img
      src={src} alt="" loading="lazy" onError={() => setFailed(true)}
      style={{
        width: '100%', height: '100%', objectFit: 'cover',
        opacity: dim ? .5 : 1, display: 'block',
      }}
    />
  )
}

/* ============================================================================
   Shared bits
   ========================================================================== */

function Chip({ kind = 'gold', children }) {
  return <span className={`chip chip-${kind}`}>{children}</span>
}

/* The generated mark, falling back to the lettered tile if it's missing. */
function BrandMark({ size = 28 }) {
  const [failed, setFailed] = useState(false)
  if (!BIZ.logo || failed) return <span className="brand-mark">{BIZ.shortName}</span>
  return (
    <img src={BIZ.logo} alt="" width={size} height={size} onError={() => setFailed(true)}
      style={{ display: 'block', flex: 'none' }} />
  )
}

function ProductCard({ product, onOpen }) {
  const out = product.sizes.every(s => s.stock === 'out')
  return (
    <button className="card" onClick={() => onOpen(product.id)}>
      <div className="card-media">
        <ProductVisual product={product} size={104} dim={out} />
        <div className="card-tags">
          {product.badges?.includes('bestseller') && <Chip>Bestseller</Chip>}
          {product.badges?.includes('new') && <Chip>New in</Chip>}
          {product.badges?.includes('essential') && <Chip kind="purity">Essential</Chip>}
        </div>
      </div>
      <div className="card-body">
        <h3>{product.name}</h3>
        <div className="card-blurb">{product.blurb}</div>
        <div className="card-foot">
          <span className="price">
            {product.sizes.length > 1 && <small>from </small>}{money(fromPrice(product))}
          </span>
          {out ? <Chip kind="out">Sold out</Chip> : <Chip kind="purity">{product.purity}</Chip>}
        </div>
      </div>
    </button>
  )
}

function TierMeter({ distinct, pct }) {
  const next = nextTierFor(distinct)
  const target = next ? next.minItems : (BIZ.discountTiers[BIZ.discountTiers.length - 1]?.minItems || 1)
  const progress = Math.min(100, (distinct / target) * 100)
  return (
    <>
      <div className="tier-track"><div className="tier-fill" style={{ width: `${progress}%` }} /></div>
      <div className="tiny muted">
        {next
          ? <>Add <b style={{ color: 'var(--primary)' }}>{next.minItems - distinct} more</b> {next.minItems - distinct === 1 ? 'compound' : 'compounds'} to unlock <b style={{ color: 'var(--primary)' }}>{next.pct}% off</b></>
          : <>Maximum tier reached — <b style={{ color: 'var(--primary)' }}>{pct}% off</b> applied</>}
      </div>
    </>
  )
}

function DisclaimerBox({ compact }) {
  return (
    <div className="legal-box">
      <div className="eyebrow" style={{ marginBottom: 8 }}>Research use only</div>
      <p className="legal">{compact ? BIZ.disclaimer.split('. ').slice(0, 2).join('. ') + '.' : BIZ.disclaimer}</p>
    </div>
  )
}

/* ============================================================================
   Views
   ========================================================================== */

/* ---------------------------------------------------------------------------
   Hero media — the cycle-chain player.

   Rules that are not negotiable, from the house pipeline:
   - No `controls`, ever. A clip is film in the page, not a player to operate.
   - iOS Safari paints its own start button, so the webkit pseudo-elements are
     killed in CSS and `playsinline` is set.
   - Attributes alone aren't enough: if a clip never starts (Low Power Mode,
     Safari's per-site autoplay setting), the video is REMOVED and the poster
     stands in. A still hero is fine; a play button is not.
   - Clips start transparent and reveal on `playing`, so nothing the element
     paints is visible in the gap before the script decides.
   - Reduced-motion users get the still, never the loop.
--------------------------------------------------------------------------- */
function HeroMedia({ onState }) {
  const M = BIZ.media || {}
  const videoRef = useRef(null)
  const freezeRef = useRef(null)
  const ambRef = useRef(null)
  const [cycles, setCycles] = useState(null)   // null = probing · [] = none found
  const [muted, setMuted] = useState(true)
  const [dead, setDead] = useState(false)      // never played — poster only
  const S = useRef({ ci: 0, clip: 0, hold: 0, everPlayed: false })

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) { setCycles([]); return }
    const mobile = window.matchMedia('(max-width: 768px)').matches
    const defs = (mobile && M.cyclesMobile?.length ? M.cyclesMobile : M.cycles) || []
    let off = false
    const exists = url => fetch(url, { method: 'HEAD' }).then(r => r.ok).catch(() => false)
    Promise.all(defs.map(clips =>
      Promise.all(clips.map(exists)).then(oks => clips.filter((_, i) => oks[i]))
    )).then(res => { if (!off) setCycles(res.filter(c => c.length)) })
    return () => { off = true }
  }, [])

  useEffect(() => { onState?.(cycles) }, [cycles, onState])

  useEffect(() => {
    if (!cycles || !cycles.length) return
    const v = videoRef.current
    if (!v) return
    const st = S.current

    const play = () => { v.src = cycles[st.ci][st.clip]; v.play().catch(() => {}) }
    const onPlaying = () => {
      st.everPlayed = true
      v.classList.add('is-playing')
      freezeRef.current?.classList.remove('is-shown')
    }
    const freeze = () => {
      try {
        const c = freezeRef.current
        c.width = v.videoWidth; c.height = v.videoHeight
        c.getContext('2d').drawImage(v, 0, 0)
        c.classList.add('is-shown')
      } catch { /* not ready — skip the freeze rather than stall */ }
    }
    const advance = () => { st.hold = 0; st.ci = (st.ci + 1) % cycles.length; st.clip = 0; play() }
    const onEnded = () => {
      st.clip++
      if (st.clip < cycles[st.ci].length) { play(); return }   // next chapter, no hold
      freeze()
      st.hold = performance.now() + 2500
      setTimeout(() => { if (st.hold) advance() }, 2500)
    }
    const onError = () => v.dispatchEvent(new Event('ended'))

    v.addEventListener('playing', onPlaying)
    v.addEventListener('ended', onEnded)
    v.addEventListener('error', onError)
    play()

    const deadTimer = setTimeout(() => { if (!st.everPlayed) setDead(true) }, 1800)
    // Watchdog — browsers power-pause video in hidden tabs and a paused clip
    // never fires `ended`, which strands the rotation permanently.
    const watchdog = setInterval(() => {
      if (document.hidden) return
      if (st.hold && performance.now() > st.hold + 1000) { advance(); return }
      if (v.paused && !v.ended && !st.hold) {
        v.play().catch(() => {
          if (!v.muted) { v.muted = true; setMuted(true); v.play().catch(() => {}) }
        })
      }
    }, 2000)

    return () => {
      v.removeEventListener('playing', onPlaying)
      v.removeEventListener('ended', onEnded)
      v.removeEventListener('error', onError)
      clearTimeout(deadTimer); clearInterval(watchdog)
    }
  }, [cycles])

  const ramp = (el, target) => {
    const from = el.volume, t0 = performance.now()
    const step = now => {
      const k = Math.min(1, (now - t0) / 300)
      el.volume = from + (target - from) * k
      if (k < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }

  // Unmuting must happen synchronously inside the click or the user-activation
  // window is gone and both elements stay silently blocked.
  const toggleSound = () => {
    const v = videoRef.current, a = ambRef.current
    if (!v) return
    const on = v.muted
    v.muted = !on
    setMuted(!on)
    if (!a) return
    if (on) { a.volume = 0; a.play().catch(() => {}); ramp(a, .35) }
    else { ramp(a, 0); setTimeout(() => a.pause(), 300) }
  }

  const live = cycles && cycles.length > 0 && !dead

  return (
    <div className="hero-media" aria-hidden="true">
      <div className="hero-still" style={{ backgroundImage: `url("${M.poster}")` }} />
      {live && (
        <>
          <video
            ref={videoRef} className="hero-video"
            muted playsInline preload="auto" poster={M.poster}
            disablePictureInPicture disableRemotePlayback
            controlsList="nodownload noplaybackrate noremoteplayback"
          />
          <canvas ref={freezeRef} className="hero-freeze" />
          {M.ambience && <audio ref={ambRef} loop preload="none" src={M.ambience} />}
        </>
      )}
      <div className="hero-scrim" />
      {live && (
        <button type="button" className={cx('sound-chip', muted && 'is-muted')}
          onClick={toggleSound} aria-label={muted ? 'Tap for sound' : 'Mute'}>
          {muted
            ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 5 6.5 9H3v6h3.5L11 19V5Z" /><path d="m16.5 9.5 5 5m0-5-5 5" /></svg>
            : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 5 6.5 9H3v6h3.5L11 19V5Z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" /></svg>}
          <span>{muted ? 'Tap for sound' : 'Mute'}</span>
        </button>
      )}
    </div>
  )
}

function Landing({ go, openProduct, addStack }) {
  const bestsellers = BIZ.products.filter(p => p.badges?.includes('bestseller')).slice(0, 4)
  const featured = BIZ.stacks.slice(0, 3)
  return (
    <div className="view">
      {/* Trust first — before a single product */}
      <section className="hero-cinema">
        <HeroMedia />
        <div className="wrap hero-copy">
          <span className="verify-pill">{I.shield({ width: 14, height: 14 })} Independently verified by {BIZ.labPartner}</span>
          <h1>Research-grade peptides,<br /><em>verified to the batch.</em></h1>
          <p className="sub">
            Every batch tested by an independent laboratory, dispatched cold from London, and traceable to a
            Certificate of Analysis you can read before you order.
          </p>
          <div className="hero-cta">
            <button className="btn btn-primary" onClick={() => go('catalogue')}>Browse catalogue {I.chev({ width: 15, height: 15 })}</button>
            <button className="btn" onClick={() => go('builder')}>{I.spark()} Build a stack</button>
          </div>
        </div>
      </section>

      {/* Under the hero, not above it. Still the first thing after the fold,
          and the full disclaimer sits in the footer of every view. */}
      <div className="strip">Research use only — <b>not for human consumption</b></div>

      <div className="wrap">
      <section className="section" style={{ paddingTop: 22 }}>
        <div className="trustgrid">
          {BIZ.trust.map(t => (
            <div className="trustcard" key={t.label}>
              <span className="ti">{I[t.icon]?.() || I.shield()}</span>
              <b>{t.label}</b><span>{t.sub}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="statbar">
          {BIZ.stats.map(s => <div key={s.label}><b>{s.value}</b><span>{s.label}</span></div>)}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="eyebrow">Curated bundles</div>
            <h2>Research stacks</h2>
          </div>
          <div className="spacer" />
          <button className="btn btn-sm btn-ghost" onClick={() => go('stacks')}>All stacks</button>
        </div>
        <div className="grid grid-1" style={{ gap: 11 }}>
          {featured.map(s => <StackCard key={s.id} stack={s} onAdd={addStack} onOpen={openProduct} feature />)}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="eyebrow">Most researched</div>
            <h2>Bestsellers</h2>
          </div>
          <div className="spacer" />
          <button className="btn btn-sm btn-ghost" onClick={() => go('catalogue')}>Full catalogue</button>
        </div>
        <div className="grid">
          {bestsellers.map(p => <ProductCard key={p.id} product={p} onOpen={openProduct} />)}
        </div>
      </section>

      <section className="section">
        <div className="section-head"><div><div className="eyebrow">Verified buyers</div><h2>What researchers say</h2></div></div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
          {BIZ.reviews.map((r, i) => (
            <div className="panel" key={i}>
              <div style={{ color: 'var(--primary)', display: 'flex', gap: 2, marginBottom: 8 }}>
                {Array.from({ length: r.stars }).map((_, k) => <span key={k}>{I.star()}</span>)}
              </div>
              <p className="small">“{r.text}”</p>
              <p className="tiny muted" style={{ marginTop: 9 }}>{r.name}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div><div className="eyebrow">Research library</div><h2>Before you order</h2></div>
          <div className="spacer" />
          <button className="btn btn-sm btn-ghost" onClick={() => go('education')}>All guides</button>
        </div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))' }}>
          {BIZ.guides.slice(0, 3).map(g => (
            <button className="panel" key={g.slug} style={{ textAlign: 'left' }} onClick={() => go('guide', { guide: g.slug })}>
              <div className="tiny" style={{ color: 'var(--accent)', fontWeight: 700, marginBottom: 6 }}>{g.minutes} min read</div>
              <h3 style={{ fontSize: 15, marginBottom: 6 }}>{g.title}</h3>
              <p className="tiny muted">{g.summary}</p>
            </button>
          ))}
        </div>
      </section>

      </div>
    </div>
  )
}

function StackCard({ stack, onAdd, onOpen, feature }) {
  const m = stackMath(stack)
  const items = stack.productIds.map(id => PRODUCTS[id]).filter(Boolean)
  return (
    <div className={cx('stackcard', feature && 'feature')}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: 17 }}>{stack.name}</h3>
            <span className="saveflag">Save {stack.discountPct}%</span>
          </div>
          <p className="small muted" style={{ marginTop: 6 }}>{stack.blurb}</p>
        </div>
      </div>

      <div className="stack-vials">
        {items.map(p => (
          <button key={p.id} onClick={() => onOpen(p.id)} title={p.name}
            style={{ background: 'var(--surfaceAlt)', border: '1px solid var(--border)', borderRadius: 11, padding: '6px 4px', flex: 1, minWidth: 0 }}>
            <Vial label={p.name} hue={hueFor(p)} size={38} />
            <div className="tiny" style={{ marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
            <span className="price" style={{ fontSize: 18 }}>{money(m.now)}</span>
            <span className="was">{money(m.full)}</span>
          </div>
          <div className="tiny" style={{ color: 'var(--primary)', fontWeight: 650 }}>You save {money(m.saving)}</div>
        </div>
        <div className="spacer" />
        <button className="btn btn-primary btn-sm" onClick={() => onAdd(stack)}>Add stack</button>
      </div>
    </div>
  )
}

function Catalogue({ openProduct }) {
  const [goal, setGoal] = useState('all')
  const list = useMemo(() => {
    if (goal === 'all') return BIZ.products
    if (goal === 'supply') return BIZ.products.filter(p => p.category === 'supply')
    return BIZ.products.filter(p => p.goals?.includes(goal))
  }, [goal])

  return (
    <div className="view wrap">
      <section className="section" style={{ paddingBottom: 4 }}>
        <div className="eyebrow">{BIZ.products.length} compounds in stock</div>
        <h2 style={{ fontSize: 24 }}>Catalogue</h2>
      </section>
      <div className="filters">
        <button className={cx('filter', goal === 'all' && 'on')} onClick={() => setGoal('all')}>All</button>
        {BIZ.goals.map(g => (
          <button key={g.id} className={cx('filter', goal === g.id && 'on')} onClick={() => setGoal(g.id)}>{g.label}</button>
        ))}
        <button className={cx('filter', goal === 'supply' && 'on')} onClick={() => setGoal('supply')}>Lab supplies</button>
      </div>
      <div className="grid" style={{ paddingBottom: 26 }}>
        {list.map(p => <ProductCard key={p.id} product={p} onOpen={openProduct} />)}
      </div>
      {list.length === 0 && <div className="empty">Nothing in this research area yet.</div>}
    </div>
  )
}

function ProductView({ id, back, backLabel = 'Back', openProduct, addLine, toast }) {
  const p = PRODUCTS[id]
  const [size, setSize] = useState(p?.sizes[0]?.label)
  useEffect(() => { setSize(PRODUCTS[id]?.sizes[0]?.label) }, [id])
  if (!p) return <div className="wrap empty">Product not found.</div>
  const sel = p.sizes.find(s => s.label === size) || p.sizes[0]
  const pairs = (p.pairsWith || []).map(x => PRODUCTS[x]).filter(Boolean)

  return (
    <div className="view wrap">
      <button className="btn btn-sm btn-ghost" style={{ margin: '14px 0 6px', paddingLeft: 0 }} onClick={back}>
        {I.back({ width: 17, height: 17 })} {backLabel}
      </button>

      <div className="two-col">
        <div>
          <div className="pdp-media"><ProductVisual product={p} size={190} /></div>
        </div>

        <div>
          <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
            <Chip kind="purity">{p.purity}</Chip>
            {p.category === 'peptide' && <Chip kind="purity">HPLC verified</Chip>}
            {p.badges?.includes('bestseller') && <Chip>Bestseller</Chip>}
          </div>
          <h1 style={{ fontSize: 28, margin: '11px 0 8px' }}>{p.name}</h1>
          <p className="muted small">{p.blurb}</p>

          <div style={{ margin: '20px 0 8px' }} className="tiny muted">Vial size</div>
          <div className="sizes">
            {p.sizes.map(s => (
              <button key={s.label} className={cx('size', size === s.label && 'on')}
                disabled={s.stock === 'out'} onClick={() => setSize(s.label)}>
                {s.label}<small>{money(s.price)}</small>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 8px' }}>
            <span className="price" style={{ fontSize: 26 }}>{money(sel.price)}</span>
            <div className="spacer" />
            <button className="btn btn-primary" style={{ flex: 1, maxWidth: 240 }}
              disabled={sel.stock === 'out'}
              onClick={() => { addLine(p.id, sel.label); toast(`${p.name} ${sel.label} added`) }}>
              {sel.stock === 'out' ? 'Sold out' : 'Add to cart'}
            </button>
          </div>
          <p className="tiny muted" style={{ marginTop: 4 }}>
            Dispatched cold within 24 hours · COA supplied with every batch
          </p>
        </div>
      </div>

      <section className="section">
        <h3 style={{ fontSize: 17, marginBottom: 10 }}>About this compound</h3>
        <div className="panel"><p className="small muted" style={{ lineHeight: 1.65 }}>{p.description}</p></div>
      </section>

      {p.researchRefs?.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <h3 style={{ fontSize: 17, marginBottom: 10 }}>Where it appears in the literature</h3>
          <div className="panel">
            <ul className="reflist" style={{ margin: 0, padding: 0 }}>
              {p.researchRefs.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
            <p className="tiny muted" style={{ marginTop: 12 }}>
              Listed for orientation only. Published research describes laboratory and animal models — it is not
              guidance for use and does not transfer to any human context.
            </p>
          </div>
        </section>
      )}

      <section className="section" style={{ paddingTop: 0 }}>
        <h3 style={{ fontSize: 17, marginBottom: 10 }}>Specification</h3>
        <div className="panel">
          <div className="rowline"><span className="muted">Purity</span><b>{p.purity}</b></div>
          <div className="rowline"><span className="muted">Verification</span><b>HPLC & Mass Spec</b></div>
          <div className="rowline"><span className="muted">Testing lab</span><b>{BIZ.labPartner}</b></div>
          <div className="rowline"><span className="muted">Form</span><b>{p.category === 'supply' ? 'Solution' : 'Lyophilised powder'}</b></div>
          <div className="rowline"><span className="muted">Storage</span><b>Refrigerated, dry</b></div>
        </div>
      </section>

      {pairs.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="section-head">
            <div>
              <div className="eyebrow">Commonly researched together</div>
              <h2 style={{ fontSize: 19 }}>Pairs well with</h2>
            </div>
          </div>
          <p className="tiny muted" style={{ marginBottom: 12 }}>
            These compounds frequently appear alongside {p.name} in published research. Grouping is informational —
            it is not a recommendation.
          </p>
          <div className="grid">
            {pairs.map(x => <ProductCard key={x.id} product={x} onOpen={openProduct} />)}
          </div>
        </section>
      )}

    </div>
  )
}

function StacksView({ addStack, openProduct, go }) {
  return (
    <div className="view wrap">
      <section className="section" style={{ paddingBottom: 6 }}>
        <div className="eyebrow">Curated bundles</div>
        <h2 style={{ fontSize: 24 }}>Research stacks</h2>
        <p className="small muted" style={{ marginTop: 8, maxWidth: '52ch' }}>
          Stacks group compounds that commonly appear together in published research, at a bundle price.
          Grouping is informational and is not a recommendation for use.
        </p>
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => go('builder')}>
          {I.spark()} Build your own stack
        </button>
      </section>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', paddingBottom: 20 }}>
        {BIZ.stacks.map(s => <StackCard key={s.id} stack={s} onAdd={addStack} onOpen={openProduct} />)}
      </div>
    </div>
  )
}

/* The stack builder is the funnel, so it opens on a question rather than a
   wall of twenty compounds: pick the research area first, and the curated
   stacks for that area come forward as a starting point. Everything a person
   ticks stays selected across areas — the running total is global. */
/* `goal` and `sel` are owned by App, not here: the bottom nav has to be able to
   send you back to the chooser, and a half-built stack must survive a trip to a
   product page and back. */
function Builder({ addBundle, toast, openProduct, goal, setGoal, sel, setSel }) {
  const [bumped, setBumped] = useState(false)
  const prevPct = useRef(0)

  const ids = Object.keys(sel)
  const distinct = ids.length
  const pct = tierFor(distinct)
  const subtotal = ids.reduce((a, id) => a + priceOf(id, sel[id]), 0)
  const saving = subtotal * pct / 100

  useEffect(() => {
    if (pct > prevPct.current) { setBumped(true); const t = setTimeout(() => setBumped(false), 520); return () => clearTimeout(t) }
    prevPct.current = pct
  }, [pct])
  useEffect(() => { prevPct.current = pct })

  const suggested = useMemo(() => {
    const s = new Set()
    ids.forEach(id => (PRODUCTS[id]?.pairsWith || []).forEach(x => { if (!sel[x]) s.add(x) }))
    return s
  }, [sel, ids])

  const toggle = id => setSel(prev => {
    const next = { ...prev }
    if (next[id]) delete next[id]
    else next[id] = PRODUCTS[id].sizes[0].label
    return next
  })

  const startFrom = stack => {
    setSel(prev => {
      const next = { ...prev }
      stack.productIds.forEach(id => { if (!next[id]) next[id] = PRODUCTS[id].sizes[0].label })
      return next
    })
    toast(`${stack.name} loaded — add more to climb the tiers`)
  }

  const commit = () => {
    const lines = ids.map(id => ({ productId: id, size: sel[id], qty: 1 }))
    addBundle({ kind: 'custom', name: `Custom stack · ${distinct} compounds`, discountPct: pct, origIds: ids }, lines)
    toast(pct > 0 ? `Stack added — ${pct}% off applied` : 'Stack added to cart')
    setSel({})
  }

  const areas = useMemo(() => BIZ.goals.map(g => ({
    ...g,
    items: BIZ.products.filter(p => p.goals?.includes(g.id)),
    stacks: BIZ.stacks.filter(s => s.goal === g.id),
  })).filter(a => a.items.length), [])

  const dock = distinct > 0 && (
    <div className="summary-dock">
      <div className="dock-inner">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <b style={{ fontSize: 14 }}>{distinct} {distinct === 1 ? 'compound' : 'compounds'}</b>
          <div className="spacer" />
          {saving > 0 && <span className="was">{money(subtotal)}</span>}
          <span className={cx('price', bumped && 'pulse')} style={{ fontSize: 19 }}>{money(subtotal - saving)}</span>
        </div>
        <TierMeter distinct={distinct} pct={pct} />
        <div style={{ display: 'flex', gap: 9, marginTop: 11, alignItems: 'center' }}>
          {saving > 0 && <span className="saveflag">Saving {money(saving)}</span>}
          <div className="spacer" />
          <button className="btn btn-sm btn-ghost" onClick={() => setSel({})}>Clear</button>
          <button className="btn btn-primary btn-sm" onClick={commit}>Add stack to cart</button>
        </div>
      </div>
    </div>
  )

  /* ---------- step 1: pick the area ---------- */
  if (!goal) {
    return (
      <div className="view wrap" style={{ paddingBottom: distinct ? 150 : 0 }}>
        <section className="section" style={{ paddingBottom: 10 }}>
          <div className="eyebrow">Stack builder</div>
          <h2 style={{ fontSize: 24 }}>What are you researching?</h2>
          <p className="small muted" style={{ marginTop: 8, maxWidth: '50ch' }}>
            Pick an area and the stacks commonly used in it come up first. The bundle discount grows
            as your stack grows — up to{' '}
            <b style={{ color: 'var(--primary)' }}>{BIZ.discountTiers[BIZ.discountTiers.length - 1].pct}% off</b> at{' '}
            {BIZ.discountTiers[BIZ.discountTiers.length - 1].minItems} compounds.
          </p>
        </section>

        <div className="goal-grid">
          {areas.map(a => {
            const hue = GOAL_HUE[a.id] ?? 44
            return (
              <button key={a.id} className="goal-card" onClick={() => setGoal(a.id)}
                style={{ '--gh': hue }}>
                <span className="goal-aura" aria-hidden="true" />
                <span className="goal-vial" aria-hidden="true">
                  <Vial label={GOAL_CODE[a.id] || a.label} hue={hue} size={96} />
                </span>
                <span className="goal-text">
                  <h3>{a.label}</h3>
                  <span className="goal-meta">
                    {a.items.length} {a.items.length === 1 ? 'compound' : 'compounds'}
                    {a.stacks.length > 0 && ` · ${a.stacks.length} ${a.stacks.length === 1 ? 'stack' : 'stacks'}`}
                  </span>
                </span>
              </button>
            )
          })}
          <button className="goal-card goal-card-all" onClick={() => setGoal('all')} style={{ '--gh': 44 }}>
            <span className="goal-aura" aria-hidden="true" />
            <span className="goal-vial goal-vial-stack" aria-hidden="true">
              <Vial label="IMMUNE" hue={190} size={72} />
              <Vial label="RECOVERY" hue={150} size={82} />
            </span>
            <span className="goal-text">
              <h3>Show everything</h3>
              <span className="goal-meta">All {BIZ.products.filter(p => p.goals?.length).length} compounds</span>
            </span>
          </button>
        </div>

          {dock}
      </div>
    )
  }

  /* ---------- step 2: the area ---------- */
  const area = areas.find(a => a.id === goal)
  const showAll = goal === 'all'
  const items = showAll ? BIZ.products.filter(p => p.goals?.length) : (area?.items || [])
  const stacks = showAll ? BIZ.stacks : (area?.stacks || [])
  const label = showAll ? 'Everything' : (area?.label || '')

  /* Compounds from OTHER areas that belong on screen: partners of the current
     selection, plus anything already selected elsewhere.

     Including the selected ones is the important half. `suggested` only holds
     unselected partners, so listing it alone meant ticking a suggestion made
     the row vanish — it left `suggested`, and being from another area it was
     not in `items` either. The tick registered but the compound disappeared,
     which reads as "it didn't select". Selected partners now stay put, ticked.

     Ordered by the catalogue so rows never jump around as they are ticked. */
  const elsewhereIds = new Set()
  for (const id of ids) {
    for (const partner of PRODUCTS[id]?.pairsWith || []) {
      if (!items.some(p => p.id === partner)) elsewhereIds.add(partner)
    }
    if (!items.some(p => p.id === id)) elsewhereIds.add(id)
  }
  const elsewhere = BIZ.products.filter(p => elsewhereIds.has(p.id))

  /* Name and price alone are no basis for deciding whether a compound belongs
     in a stack. Each row carries what it actually is, and an info button into
     the full page — safe now that a part-built stack survives navigation. */
  const Row = ({ p }) => {
    const on = !!sel[p.id]
    const sug = !on && suggested.has(p.id)
    const size = sel[p.id] || p.sizes[0].label
    return (
      <div className={cx('build-row', on && 'on', sug && 'suggested')}>
        <button className="build-toggle" onClick={() => toggle(p.id)} aria-pressed={on}>
          <span className="tickbox">{on && I.check()}</span>
          <Vial label={p.name} hue={hueFor(p)} size={30} />
          <span className="build-text">
            <span className="build-name">{p.name}</span>
            {sug && <span className="pairtag">Commonly researched together</span>}
            <span className="build-blurb">{p.blurb}</span>
          </span>
          <span className="build-price">
            <span className="price" style={{ fontSize: 14 }}>{money(priceOf(p.id, size))}</span>
            <span className="tiny muted">{size} · {p.purity}</span>
          </span>
        </button>
        <button className="build-info" onClick={() => openProduct(p.id)}
          aria-label={`Read about ${p.name}`} title={`Read about ${p.name}`}>
          {I.info()}
        </button>
      </div>
    )
  }

  return (
    <div className="view wrap" style={{ paddingBottom: distinct ? 150 : 0 }}>
      <section className="section" style={{ paddingBottom: 8 }}>
        <button className="btn btn-sm btn-ghost" style={{ paddingLeft: 0, marginBottom: 6 }} onClick={() => setGoal(null)}>
          {I.back({ width: 17, height: 17 })} Change area
        </button>
        <div className="eyebrow">Stack builder</div>
        <h2 style={{ fontSize: 24 }}>{label}</h2>
        <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
          {BIZ.discountTiers.map(t => (
            <span key={t.minItems} className={cx('chip', distinct >= t.minItems ? 'chip-gold' : 'chip-out')}>
              {t.minItems}+ · {t.pct}%
            </span>
          ))}
        </div>
      </section>

      {stacks.length > 0 && (
        <section className="section" style={{ paddingTop: 8, paddingBottom: 8 }}>
          <h3 style={{ fontSize: 13, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.09em', marginBottom: 4 }}>
            Start from a stack
          </h3>
          <p className="tiny muted" style={{ marginBottom: 11 }}>
            Compounds that commonly appear together in this area. Loading one fills the builder — you can
            add to it or take things out.
          </p>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(268px,1fr))', gap: 9 }}>
            {stacks.map(s => {
              const loaded = s.productIds.every(id => sel[id])
              return (
                <div className={cx('startstack', loaded && 'is-loaded')} key={s.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <b style={{ fontSize: 14.5 }}>{s.name}</b>
                    <div className="spacer" />
                    <span className="tiny muted">{s.productIds.length} compounds</span>
                  </div>
                  <p className="tiny muted" style={{ marginTop: 6, lineHeight: 1.45 }}>{s.blurb}</p>
                  <div style={{ display: 'flex', gap: 5, margin: '10px 0 11px' }}>
                    {s.productIds.map(id => PRODUCTS[id] && (
                      <span key={id} className="tiny" style={{
                        padding: '3px 7px', borderRadius: 6, background: 'var(--surfaceAlt)',
                        border: '1px solid var(--border)', whiteSpace: 'nowrap',
                      }}>{PRODUCTS[id].name}</span>
                    ))}
                  </div>
                  <button className="btn btn-sm btn-block" disabled={loaded} onClick={() => startFrom(s)}>
                    {loaded ? 'Loaded' : 'Use as a starting point'}
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <section className="section" style={{ paddingTop: 8, paddingBottom: 8 }}>
        <h3 style={{ fontSize: 13, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.09em', marginBottom: 10 }}>
          {showAll ? 'All compounds' : `${label} compounds`}
        </h3>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: 8 }}>
          {items.map(p => <Row key={p.id} p={p} />)}
        </div>
      </section>

      {elsewhere.length > 0 && (
        <section className="section" style={{ paddingTop: 8, paddingBottom: 8 }}>
          <h3 style={{ fontSize: 13, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.09em', marginBottom: 4 }}>
            Commonly researched alongside
          </h3>
          <p className="tiny muted" style={{ marginBottom: 11 }}>
            From other areas, based on what you have selected — anything you tick here stays in this
            list. Informational, not a recommendation.
          </p>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: 8 }}>
            {elsewhere.map(p => <Row key={p.id} p={p} />)}
          </div>
        </section>
      )}

      {/* A second way out, for anyone who has scrolled past the one at the top. */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0 8px' }}>
        <button className="btn btn-sm btn-ghost" onClick={() => setGoal(null)}>
          {I.back({ width: 16, height: 16 })} Choose a different area
        </button>
      </div>

      {dock}
    </div>
  )
}

function Checkout({ cart, calc, customer, setCustomer, placeOrder, markNotified, go, toast }) {
  const [step, setStep] = useState(0)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')
  const [form, setForm] = useState(() => ({
    name: '', email: '', phone: '', line1: '', city: '', postcode: '', ...customer,
  }))
  const [agreeResearch, setAgreeResearch] = useState(false)
  const [agreeAge, setAgreeAge] = useState(false)
  const [errors, setErrors] = useState({})
  const [order, setOrder] = useState(null)
  const [copied, setCopied] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.line1.trim()) e.line1 = 'Required'
    if (!form.city.trim()) e.city = 'Required'
    if (!form.postcode.trim()) e.postcode = 'Required'
    if (!agreeResearch) e.agreeResearch = 'You must confirm research use'
    if (!agreeAge) e.agreeAge = 'You must confirm you are 18 or over'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const toPayment = () => {
    if (!validate()) return
    setCustomer(form)
    const o = placeOrder(form)
    setOrder(o)
    setStep(2)
    // Try to deliver it. If there is no endpoint configured, or the POST fails,
    // `sent` stays false and the screen asks the customer to send it instead —
    // it must never claim to have done something it hasn't.
    setSending(true)
    deliverOrder(o).then(ok => {
      setSending(false)
      setSent(ok)
      if (ok) markNotified(o.ref)
    })
  }

  const copy = async (key, value) => {
    try { await navigator.clipboard.writeText(value); setCopied(key); setTimeout(() => setCopied(''), 1600) }
    catch { toast('Copy unavailable — select the text manually') }
  }

  if (calc.count === 0 && !order) {
    return (
      <div className="view wrap">
        <div className="empty">
          <p>Your cart is empty.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => go('catalogue')}>Browse catalogue</button>
        </div>
      </div>
    )
  }

  return (
    <div className="view wrap" style={{ maxWidth: 620 }}>
      <section className="section" style={{ paddingBottom: 10 }}>
        <div className="eyebrow">{['Review order', 'Delivery details', 'Pay by bank'][step]}</div>
        <h2 style={{ fontSize: 23 }}>{step === 2 ? 'Order placed' : 'Checkout'}</h2>
      </section>

      <div className="steps">
        {[0, 1, 2].map(i => <div key={i} className={cx('step', step >= i && 'on')} />)}
      </div>

      {step === 0 && (
        <>
          {calc.groups.map(g => (
            <div className="cartgroup" key={g.key}>
              <div className="cartgroup-head">
                <b className="small">{g.name}</b>
                {g.pct > 0 && <span className="saveflag">−{g.pct}%</span>}
              </div>
              {g.lines.map(l => (
                <div className="cartline" key={l.uid}>
                  <Vial label={PRODUCTS[l.productId].name} hue={hueFor(PRODUCTS[l.productId])} size={26} />
                  <span style={{ flex: 1 }}>
                    <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600 }}>{PRODUCTS[l.productId].name}</span>
                    <span className="tiny muted">{l.size} × {l.qty}</span>
                  </span>
                  <span className="small">{money(priceOf(l.productId, l.size) * l.qty)}</span>
                </div>
              ))}
            </div>
          ))}
          <div className="panel" style={{ marginTop: 6 }}>
            <div className="rowline"><span className="muted">Subtotal</span><span>{money(calc.subtotal)}</span></div>
            {calc.discount > 0 && (
              <div className="rowline"><span style={{ color: 'var(--primary)' }}>Stack discount</span>
                <span style={{ color: 'var(--primary)' }}>−{money(calc.discount)}</span></div>
            )}
            <div className="rowline"><span className="muted">Delivery</span><span>Free · next-day tracked</span></div>
            <div className="rowline"><b>Total</b><b className="price">{money(calc.total)}</b></div>
          </div>
          <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} onClick={() => setStep(1)}>Continue</button>
        </>
      )}

      {step === 1 && (
        <>
          <div className="field">
            <label>Full name</label>
            <input className={cx('input', errors.name && 'bad')} value={form.name} onChange={e => set('name', e.target.value)} autoComplete="name" />
            {errors.name && <div className="err">{errors.name}</div>}
          </div>
          <div className="field">
            <label>Email address</label>
            <input className={cx('input', errors.email && 'bad')} value={form.email} onChange={e => set('email', e.target.value)} inputMode="email" autoComplete="email" />
            {errors.email && <div className="err">{errors.email}</div>}
          </div>
          <div className="field">
            <label>Phone (optional — for courier updates)</label>
            <input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} inputMode="tel" autoComplete="tel" />
          </div>
          <div className="field">
            <label>Address</label>
            <input className={cx('input', errors.line1 && 'bad')} value={form.line1} onChange={e => set('line1', e.target.value)} autoComplete="address-line1" />
            {errors.line1 && <div className="err">{errors.line1}</div>}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Town / city</label>
              <input className={cx('input', errors.city && 'bad')} value={form.city} onChange={e => set('city', e.target.value)} autoComplete="address-level2" />
              {errors.city && <div className="err">{errors.city}</div>}
            </div>
            <div className="field" style={{ width: 130 }}>
              <label>Postcode</label>
              <input className={cx('input', errors.postcode && 'bad')} value={form.postcode}
                onChange={e => set('postcode', e.target.value.toUpperCase())} autoComplete="postal-code" />
              {errors.postcode && <div className="err">{errors.postcode}</div>}
            </div>
          </div>

          <div style={{ marginTop: 18, marginBottom: 4 }} className="eyebrow">Eligibility</div>
          <button className={cx('checkrow', agreeResearch && 'on')} onClick={() => setAgreeResearch(v => !v)}>
            <span className="tickbox">{agreeResearch && I.check()}</span>
            <p>{BIZ.eligibilityText}</p>
          </button>
          {errors.agreeResearch && <div className="err" style={{ marginTop: -6, marginBottom: 10 }}>{errors.agreeResearch}</div>}
          <button className={cx('checkrow', agreeAge && 'on')} onClick={() => setAgreeAge(v => !v)}>
            <span className="tickbox">{agreeAge && I.check()}</span>
            <p>I have read and accept the research-use disclaimer and the returns policy.</p>
          </button>
          {errors.agreeAge && <div className="err" style={{ marginTop: -6, marginBottom: 10 }}>{errors.agreeAge}</div>}

          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button className="btn" onClick={() => setStep(0)}>Back</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={toPayment}>
              Continue to payment · {money(calc.total)}
            </button>
          </div>
          <p className="tiny muted" style={{ marginTop: 12, textAlign: 'center' }}>
            No card details are taken. Payment is by UK bank transfer.
          </p>
        </>
      )}

      {step === 2 && order && (
        <>
          <div className="panel" style={{ borderColor: 'color-mix(in srgb, var(--primary) 34%, transparent)', textAlign: 'center' }}>
            <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'var(--primary)', color: '#14120C', display: 'grid', placeItems: 'center', margin: '4px auto 12px' }}>
              {I.check({ width: 22, height: 22 })}
            </div>
            <h3 style={{ fontSize: 18 }}>
              {sending ? `Placing order ${order.ref}…` : sent ? `Order ${order.ref} is with us` : `Order ${order.ref} created`}
            </h3>
            <p className="small muted" style={{ marginTop: 8 }}>
              Send {money(order.total)} using the details below. Quote the reference exactly — it is how your payment
              is matched to your order automatically.
            </p>
          </div>

          {/* No endpoint configured, or the POST failed: the order has not left
              the browser, so say so and give them a one-tap way to send it. */}
          {!sending && !sent && (
            <div className="panel" style={{ marginTop: 12, borderColor: 'color-mix(in srgb, var(--primary) 40%, transparent)' }}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>One more step</div>
              <p className="small" style={{ lineHeight: 1.6 }}>
                Your order hasn’t reached us yet. Tap below to send it — it opens your email app with everything
                filled in, addressed to us and copied to you.
              </p>
              <a className="btn btn-primary btn-block" style={{ marginTop: 13 }}
                href={orderMailHref(order)}
                onClick={() => { markNotified(order.ref); setSent(true) }}>
                Send my order
              </a>
              <p className="tiny muted" style={{ marginTop: 11 }}>
                If nothing opens, email <b>{BIZ.orders.notifyEmail}</b> quoting <b className="mono">{order.ref}</b>.
              </p>
            </div>
          )}

          {/* App-to-app: opens the customer's banking app with everything
              already filled. Only exists once a provider is configured. */}
          {BIZ.payments?.pisp?.createUrl && (
            <div style={{ marginTop: 12 }}>
              <button className="btn btn-primary btn-block" disabled={paying}
                onClick={async () => {
                  setPaying(true); setPayError('')
                  try {
                    const url = await createBankPayment(order)
                    if (url) window.location.href = url
                  } catch (e) {
                    setPayError('Could not open your bank. Use the details below instead.')
                  } finally { setPaying(false) }
                }}>
                {paying ? 'Opening your bank…' : 'Pay from your banking app'}
              </button>
              <p className="tiny muted" style={{ marginTop: 9, textAlign: 'center' }}>
                Opens your bank with the amount and reference already filled. No card details are taken.
              </p>
              {payError && <p className="err" style={{ textAlign: 'center' }}>{payError}</p>}
            </div>
          )}

          <div className="panel" style={{ marginTop: 12 }}>
            {BIZ.payments?.pisp?.createUrl && (
              <p className="tiny muted" style={{ marginBottom: 4 }}>Or transfer manually:</p>
            )}
            <div className="bankrow">
              <div><div className="k">Amount</div><div className="v price">{money(order.total)}</div></div>
              <button className={cx('copybtn', copied === 'amt' && 'done')} onClick={() => copy('amt', order.total.toFixed(2))}>
                {copied === 'amt' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="bankrow">
              <div><div className="k">Payment reference</div><div className="v mono" style={{ color: 'var(--primary)' }}>{order.ref}</div></div>
              <button className={cx('copybtn', copied === 'ref' && 'done')} onClick={() => copy('ref', order.ref)}>
                {copied === 'ref' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="bankrow">
              <div><div className="k">Account name</div><div className="v">{BIZ.bank.accountName}</div></div>
              <button className={cx('copybtn', copied === 'an' && 'done')} onClick={() => copy('an', BIZ.bank.accountName)}>
                {copied === 'an' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="bankrow">
              <div><div className="k">Sort code</div><div className="v mono">{BIZ.bank.sortCode}</div></div>
              <button className={cx('copybtn', copied === 'sc' && 'done')} onClick={() => copy('sc', BIZ.bank.sortCode.replace(/-/g, ''))}>
                {copied === 'sc' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="bankrow">
              <div><div className="k">Account number</div><div className="v mono">{BIZ.bank.accountNumber}</div></div>
              <button className={cx('copybtn', copied === 'ac' && 'done')} onClick={() => copy('ac', BIZ.bank.accountNumber)}>
                {copied === 'ac' ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* One tap for the lot — payee, sort code, account, amount, reference. */}
          <button className={cx('btn', 'btn-block', copied === 'all' && 'btn-primary')}
            style={{ marginTop: 11 }}
            onClick={() => copy('all', paymentDetailsText(order))}>
            {copied === 'all' ? 'All details copied' : 'Copy all payment details'}
          </button>

          <p className="tiny muted" style={{ marginTop: 12 }}>{BIZ.bank.note}</p>

          <button className="btn btn-primary btn-block" style={{ marginTop: 16 }}
            onClick={() => { go('account'); toast('Order saved to your account') }}>
            I've sent the payment
          </button>
          <button className="btn btn-block btn-ghost" style={{ marginTop: 9 }} onClick={() => go('account')}>
            View order status
          </button>
          <p className="tiny muted" style={{ marginTop: 14, textAlign: 'center' }}>
            Keep your reference — <b className="mono" style={{ color: 'var(--primary)' }}>{order.ref}</b>. It is also
            saved under Account on this device.
          </p>
        </>
      )}
    </div>
  )
}

function Account({ orders, customer, reorder, markNotified, go, toast }) {
  const [open, setOpen] = useState(null)
  const statusLabel = { awaiting_payment: 'Awaiting payment', paid: 'Payment received', fulfilled: 'Dispatched', cancelled: 'Cancelled' }
  const statusClass = { awaiting_payment: 'awaiting', paid: 'paid', fulfilled: 'fulfilled', cancelled: 'cancelled' }

  return (
    <div className="view wrap" style={{ maxWidth: 720 }}>
      <section className="section" style={{ paddingBottom: 10 }}>
        <div className="eyebrow">Account</div>
        <h2 style={{ fontSize: 24 }}>{customer?.name ? customer.name.split(' ')[0] : 'Your orders'}</h2>
        {customer?.email && <p className="small muted" style={{ marginTop: 6 }}>{customer.email}</p>}
      </section>

      {orders.length === 0 ? (
        <div className="empty">
          <p>No orders yet.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => go('catalogue')}>Browse catalogue</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 20 }}>
          {orders.map(o => (
            <div className="panel" key={o.ref} style={{ padding: 0, overflow: 'hidden' }}>
              <button style={{ width: '100%', padding: 15, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12 }}
                onClick={() => setOpen(open === o.ref ? null : o.ref)}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 9, alignItems: 'center', flexWrap: 'wrap' }}>
                    <b className="mono small" style={{ color: 'var(--primary)' }}>{o.ref}</b>
                    <span className={cx('status', statusClass[o.status])}>{statusLabel[o.status]}</span>
                  </div>
                  <div className="tiny muted" style={{ marginTop: 5 }}>
                    {new Date(o.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {' · '}{o.lines.reduce((a, l) => a + l.qty, 0)} items · {money(o.total)}
                  </div>
                </div>
                <span style={{ transform: open === o.ref ? 'rotate(90deg)' : 'none', transition: '.2s', color: 'var(--muted)' }}>
                  {I.chev()}
                </span>
              </button>

              {open === o.ref && (
                <div style={{ borderTop: '1px solid var(--border)', padding: 15 }}>
                  {o.lines.map((l, i) => (
                    <div className="rowline" key={i}>
                      <span className="muted">{l.name} · {l.size} × {l.qty}</span>
                      <span>{money(l.price * l.qty)}</span>
                    </div>
                  ))}
                  {o.discount > 0 && (
                    <div className="rowline"><span style={{ color: 'var(--primary)' }}>Stack discount</span>
                      <span style={{ color: 'var(--primary)' }}>−{money(o.discount)}</span></div>
                  )}
                  <div className="rowline"><b>Total</b><b>{money(o.total)}</b></div>

                  {/* Never lose an order that failed to leave the browser. */}
                  {!o.notified && (
                    <div style={{ marginTop: 12, padding: 12, borderRadius: 11, background: 'var(--surfaceAlt)', border: '1px solid color-mix(in srgb, var(--primary) 34%, transparent)' }}>
                      <div className="tiny" style={{ color: 'var(--primary)', fontWeight: 700 }}>Not sent to us yet</div>
                      <a className="btn btn-sm btn-block" style={{ marginTop: 9 }}
                        href={orderMailHref(o)} onClick={() => markNotified(o.ref)}>
                        Send this order
                      </a>
                    </div>
                  )}

                  {o.status === 'awaiting_payment' && (
                    <div style={{ marginTop: 12, padding: 12, borderRadius: 11, background: 'var(--surfaceAlt)' }}>
                      <div className="tiny muted">Transfer {money(o.total)} to {BIZ.bank.accountName} quoting</div>
                      <div className="mono" style={{ color: 'var(--primary)', fontWeight: 700, marginTop: 4 }}>{o.ref}</div>
                      <div className="tiny muted" style={{ marginTop: 6 }}>
                        Sort code {BIZ.bank.sortCode} · Account {BIZ.bank.accountNumber}
                      </div>
                    </div>
                  )}

                  <button className="btn btn-block btn-sm" style={{ marginTop: 12 }}
                    onClick={() => { reorder(o); toast('Items added to cart') }}>
                    Reorder these items
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <section className="section">
        <h3 style={{ fontSize: 16, marginBottom: 10 }}>Returns</h3>
        <div className="panel"><p className="small muted" style={{ lineHeight: 1.6 }}>{BIZ.returnsText}</p></div>
      </section>
    </div>
  )
}

function Education({ go }) {
  return (
    <div className="view wrap" style={{ maxWidth: 760 }}>
      <section className="section" style={{ paddingBottom: 10 }}>
        <div className="eyebrow">Research library</div>
        <h2 style={{ fontSize: 24 }}>Guides</h2>
        <p className="small muted" style={{ marginTop: 8, maxWidth: '52ch' }}>
          Reference material on handling, verification and reading research literature. These guides describe what
          published protocols report. They are not instructions and contain no quantities.
        </p>
      </section>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 20 }}>
        {BIZ.guides.map(g => (
          <button className="panel" key={g.slug} style={{ textAlign: 'left', display: 'flex', gap: 12, alignItems: 'center' }}
            onClick={() => go('guide', { guide: g.slug })}>
            <div style={{ flex: 1 }}>
              <div className="tiny" style={{ color: 'var(--accent)', fontWeight: 700, marginBottom: 5 }}>{g.minutes} min read</div>
              <h3 style={{ fontSize: 16, marginBottom: 5 }}>{g.title}</h3>
              <p className="tiny muted">{g.summary}</p>
            </div>
            <span style={{ color: 'var(--muted)' }}>{I.chev()}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function Guide({ slug, back }) {
  const g = BIZ.guides.find(x => x.slug === slug)
  if (!g) return <div className="wrap empty">Guide not found.</div>
  return (
    <div className="view wrap" style={{ maxWidth: 680 }}>
      <button className="btn btn-sm btn-ghost" style={{ margin: '14px 0 6px', paddingLeft: 0 }} onClick={back}>
        {I.back({ width: 17, height: 17 })} Library
      </button>
      <section className="section" style={{ paddingTop: 6, paddingBottom: 10 }}>
        <div className="tiny" style={{ color: 'var(--accent)', fontWeight: 700, marginBottom: 8 }}>{g.minutes} min read</div>
        <h1 style={{ fontSize: 27 }}>{g.title}</h1>
        <p className="small muted" style={{ marginTop: 10 }}>{g.summary}</p>
      </section>
      <div className="guide-body" style={{ paddingBottom: 24 }}>
        {g.body.map((b, i) => (
          <div key={i}>
            <h3>{b.h}</h3>
            <p>{b.p}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ============================================================================
   Cart drawer
   ========================================================================== */

function CartDrawer({ calc, cart, setQty, removeLine, close, checkout, isDesktop }) {
  const nextT = nextTierFor(calc.groups.find(g => g.kind === 'loose')?.distinct || 0)
  return (
    <>
      <div className="overlay" onClick={close} />
      <div className={cx('drawer', isDesktop ? 'right' : 'sheet')}>
        {!isDesktop && <div className="grab" />}
        <div className="drawer-head">
          <h3 style={{ fontSize: 17 }}>Your cart</h3>
          <span className="tiny muted">{calc.count} {calc.count === 1 ? 'item' : 'items'}</span>
          <div className="spacer" />
          <button className="iconbtn" onClick={close}>{I.close()}</button>
        </div>

        <div className="drawer-body">
          {calc.count === 0 ? (
            <div className="empty"><p>Your cart is empty.</p></div>
          ) : (
            <>
              {calc.groups.map(g => (
                <div className="cartgroup" key={g.key}>
                  <div className="cartgroup-head">
                    <div>
                      <b className="small">{g.name}</b>
                      {g.kind === 'stack' && !g.complete && (
                        <div className="tiny muted" style={{ marginTop: 2 }}>Stack incomplete — tier discount applied</div>
                      )}
                    </div>
                    <div className="spacer" />
                    {g.pct > 0
                      ? <span className="saveflag">−{g.pct}%</span>
                      : g.kind === 'loose' && nextT && <span className="tiny muted">+1 for {nextT.pct}%</span>}
                  </div>
                  {g.lines.map(l => {
                    const p = PRODUCTS[l.productId]
                    return (
                      <div className="cartline" key={l.uid}>
                        <Vial label={p.name} hue={hueFor(p)} size={30} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 650 }}>{p.name}</div>
                          <div className="tiny muted">{l.size} · {money(priceOf(l.productId, l.size))}</div>
                        </div>
                        <div className="qty">
                          <button onClick={() => setQty(l.uid, l.qty - 1)}>−</button>
                          <span>{l.qty}</span>
                          <button onClick={() => setQty(l.uid, l.qty + 1)}>+</button>
                        </div>
                        <button className="tiny muted" style={{ padding: 4 }} onClick={() => removeLine(l.uid)}>{I.close({ width: 14, height: 14 })}</button>
                      </div>
                    )
                  })}
                </div>
              ))}

              <div className="panel" style={{ marginTop: 4 }}>
                <div className="rowline"><span className="muted">Subtotal</span><span>{money(calc.subtotal)}</span></div>
                {calc.discount > 0 && (
                  <div className="rowline">
                    <span style={{ color: 'var(--primary)' }}>Stack savings</span>
                    <span style={{ color: 'var(--primary)' }}>−{money(calc.discount)}</span>
                  </div>
                )}
                <div className="rowline"><b>Total</b><b className="price">{money(calc.total)}</b></div>
              </div>
              <p className="tiny muted" style={{ marginTop: 12, textAlign: 'center' }}>
                Pay by UK bank transfer at checkout. No card details are taken.
              </p>
            </>
          )}
        </div>

        {calc.count > 0 && (
          <div className="drawer-foot">
            <button className="btn btn-primary btn-block" onClick={checkout}>
              Checkout · {money(calc.total)}
            </button>
          </div>
        )}
      </div>
    </>
  )
}

/* ============================================================================
   App
   ========================================================================== */

export default function App() {
  const [view, setView] = useState(() => LS.get('view', 'landing'))
  const [productId, setProductId] = useState(() => LS.get('productId', null))
  const [guideSlug, setGuideSlug] = useState(() => LS.get('guideSlug', null))
  const [cart, setCart] = useState(() => LS.get('cart', { lines: [], bundles: {} }))
  const [orders, setOrders] = useState(() => LS.get('orders', []))
  const [customer, setCustomer] = useState(() => LS.get('customer', null))
  // Builder state lives here so the nav can reset it and a part-built stack
  // survives navigating away and back.
  const [builderGoal, setBuilderGoal] = useState(() => LS.get('builderGoal', null))
  const [builderSel, setBuilderSel] = useState(() => LS.get('builderSel', {}))
  const [productFrom, setProductFrom] = useState('catalogue')
  const [cartOpen, setCartOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 760)
  const scrollRef = useRef({})

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 760)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => { LS.set('cart', cart) }, [cart])
  useEffect(() => { LS.set('orders', orders) }, [orders])
  useEffect(() => { LS.set('customer', customer) }, [customer])
  useEffect(() => { LS.set('builderGoal', builderGoal) }, [builderGoal])
  useEffect(() => { LS.set('builderSel', builderSel) }, [builderSel])
  useEffect(() => { LS.set('view', view); LS.set('productId', productId); LS.set('guideSlug', guideSlug) }, [view, productId, guideSlug])

  const toast = useCallback(msg => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(t => (t === msg ? '' : t)), 2200)
  }, [])

  const go = useCallback((next, opts = {}) => {
    scrollRef.current[view] = window.scrollY
    if (opts.product) setProductId(opts.product)
    if (opts.guide) setGuideSlug(opts.guide)
    setView(next)
    setCartOpen(false)
    requestAnimationFrame(() => window.scrollTo({ top: opts.keepScroll ? (scrollRef.current[next] || 0) : 0 }))
  }, [view])

  // Remember where a product was opened from, so Back returns there instead of
  // always dumping you in the catalogue — the builder's info button depends on it.
  const openProduct = useCallback(id => {
    setProductFrom(prev => (view === 'product' ? prev : view))
    go('product', { product: id })
  }, [go, view])

  const calc = useMemo(() => computeCart(cart), [cart])

  const addLine = useCallback((productId, size, qty = 1) => {
    setCart(c => {
      const existing = c.lines.find(l => l.productId === productId && l.size === size && !l.bundleId)
      if (existing) {
        return { ...c, lines: c.lines.map(l => l === existing ? { ...l, qty: l.qty + qty } : l) }
      }
      return { ...c, lines: [...c.lines, { uid: uid(), productId, size, qty, bundleId: null }] }
    })
  }, [])

  const addBundle = useCallback((bundle, lines) => {
    const id = 'b_' + uid()
    setCart(c => ({
      lines: [...c.lines, ...lines.map(l => ({ uid: uid(), ...l, bundleId: id }))],
      bundles: { ...c.bundles, [id]: { id, ...bundle } },
    }))
    setCartOpen(true)
  }, [])

  const addStack = useCallback(stack => {
    const lines = stack.productIds.map(pid => ({ productId: pid, size: PRODUCTS[pid].sizes[0].label, qty: 1 }))
    addBundle({ kind: 'stack', name: stack.name, discountPct: stack.discountPct, origIds: [...stack.productIds] }, lines)
    toast(`${stack.name} added — ${stack.discountPct}% off`)
  }, [addBundle, toast])

  const setQty = useCallback((lineUid, qty) => {
    setCart(c => {
      if (qty <= 0) {
        const lines = c.lines.filter(l => l.uid !== lineUid)
        const used = new Set(lines.map(l => l.bundleId).filter(Boolean))
        const bundles = Object.fromEntries(Object.entries(c.bundles).filter(([k]) => used.has(k)))
        return { lines, bundles }
      }
      return { ...c, lines: c.lines.map(l => l.uid === lineUid ? { ...l, qty } : l) }
    })
  }, [])

  const removeLine = useCallback(lineUid => setQty(lineUid, 0), [setQty])

  const placeOrder = useCallback(form => {
    const snapshot = computeCart(cart)
    const order = {
      ref: makeRef(),
      createdAt: Date.now(),
      status: 'awaiting_payment',       // → paid → fulfilled, reconciled by reference
      notified: false,                  // has the order actually left the browser?
      paymentDeclared: false,
      customer: form,
      lines: cart.lines.map(l => ({
        productId: l.productId,
        name: PRODUCTS[l.productId].name,
        size: l.size,
        qty: l.qty,
        price: priceOf(l.productId, l.size),
        bundleId: l.bundleId,
      })),
      bundles: cart.bundles,
      subtotal: snapshot.subtotal,
      discount: snapshot.discount,
      total: snapshot.total,
    }
    setOrders(o => [order, ...o])
    setCart({ lines: [], bundles: {} })
    return order
  }, [cart])

  const markNotified = useCallback(ref => {
    setOrders(list => list.map(o => (o.ref === ref ? { ...o, notified: true } : o)))
  }, [])

  const reorder = useCallback(order => {
    const bundleMap = {}
    const lines = []
    const bundles = {}
    for (const l of order.lines) {
      let bid = null
      if (l.bundleId) {
        if (!bundleMap[l.bundleId]) {
          const nb = 'b_' + uid()
          bundleMap[l.bundleId] = nb
          const src = order.bundles?.[l.bundleId]
          bundles[nb] = src ? { ...src, id: nb } : { id: nb, kind: 'custom', name: 'Custom stack', discountPct: 0, origIds: [] }
        }
        bid = bundleMap[l.bundleId]
      }
      lines.push({ uid: uid(), productId: l.productId, size: l.size, qty: l.qty, bundleId: bid })
    }
    setCart(c => ({ lines: [...c.lines, ...lines], bundles: { ...c.bundles, ...bundles } }))
    setCartOpen(true)
  }, [])

  const NAV = [
    { id: 'landing', label: 'Home', icon: 'home' },
    { id: 'catalogue', label: 'Shop', icon: 'shop' },
    { id: 'stacks', label: 'Stacks', icon: 'stacks' },
    { id: 'builder', label: 'Build', icon: 'build' },
    { id: 'account', label: 'Account', icon: 'user' },
  ]
  const navActive = { product: 'catalogue', guide: 'education', checkout: 'account' }[view] || view

  return (
    <div className="app">
      <style dangerouslySetInnerHTML={{ __html: styles(BIZ.palette) }} />

      <header className="floatbar">
        <button className="brand" onClick={() => go('landing')}>
          <BrandMark />
          {BIZ.name}
        </button>
        <div className="spacer" />
        <button className="iconbtn" onClick={() => go('education')} aria-label="Research library">{I.book()}</button>
        <button className="iconbtn" onClick={() => setCartOpen(true)} aria-label="Cart">
          {I.cart()}
          {calc.count > 0 && <span className="count">{calc.count}</span>}
        </button>
      </header>

      <nav className="nav">
        {NAV.map(n => (
          <button key={n.id} className={cx('nav-item', navActive === n.id && 'on')}
            onClick={() => {
              // Tapping Build always lands on the chooser. Without this it is a
              // dead button whenever an area is already open.
              if (n.id === 'builder') setBuilderGoal(null)
              go(n.id)
            }}>
            {I[n.icon]()}
            <span>{n.label}</span>
          </button>
        ))}
      </nav>

      {/* The landing hero sits behind the floating controls on purpose; every
          other view has to start below them. */}
      <main key={view + (productId || '') + (guideSlug || '')}
        className={cx(view !== 'landing' && 'below-floatbar')}>
        {view === 'landing' && <Landing go={go} openProduct={openProduct} addStack={addStack} />}
        {view === 'catalogue' && <Catalogue openProduct={openProduct} />}
        {view === 'product' && (
          <ProductView id={productId} back={() => go(productFrom)} backLabel={productFrom === 'builder' ? 'Back to your stack' : 'Back'}
            openProduct={openProduct} addLine={addLine} toast={toast} />
        )}
        {view === 'stacks' && <StacksView addStack={addStack} openProduct={openProduct} go={go} />}
        {view === 'builder' && (
          <Builder addBundle={addBundle} toast={toast} openProduct={openProduct}
            goal={builderGoal} setGoal={setBuilderGoal}
            sel={builderSel} setSel={setBuilderSel} />
        )}
        {view === 'checkout' && (
          <Checkout cart={cart} calc={calc} customer={customer} setCustomer={setCustomer}
            placeOrder={placeOrder} markNotified={markNotified} go={go} toast={toast} />
        )}
        {view === 'account' && (
          <Account orders={orders} customer={customer} reorder={reorder}
            markNotified={markNotified} go={go} toast={toast} />
        )}
        {view === 'education' && <Education go={go} />}
        {view === 'guide' && <Guide slug={guideSlug} back={() => go('education')} />}
      </main>

      <footer className="wrap" style={{ padding: '30px 16px 40px', borderTop: '1px solid var(--border)', marginTop: 20 }}>
        <div className="brand" style={{ marginBottom: 10 }}>
          <BrandMark />{BIZ.name}
        </div>
        <p className="tiny muted">{BIZ.established} · {BIZ.email}</p>
        <p className="tiny muted" style={{ marginTop: 4 }}>Batches independently verified by {BIZ.labPartner}.</p>
        <div style={{ marginTop: 16 }}><DisclaimerBox /></div>
      </footer>

      {cartOpen && (
        <CartDrawer
          calc={calc} cart={cart} setQty={setQty} removeLine={removeLine}
          close={() => setCartOpen(false)} isDesktop={isDesktop}
          checkout={() => { setCartOpen(false); go('checkout') }}
        />
      )}

      {toastMsg && <div className="toast">{toastMsg}</div>}
    </div>
  )
}
