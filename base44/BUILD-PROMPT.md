# Rebuilding BioHack Gold inside Base44

This replaces the shop in Karl's Base44 app with the one in `~/peptide-app`.

**Before pasting anything, read "What has to be true first" at the bottom.** The
two files this prompt fetches have to be pushed to GitHub, or the builder has
nothing to pull.

---

## The prompt — paste everything between the lines into the Base44 builder

---

Replace this app's storefront with the BioHack Gold shop I have already built.
Do not redesign it, do not restyle it, and do not "improve" the copy — the whole
point of this exercise is that the shop arrives exactly as written. It is one
self-contained React component with its own stylesheet inside it. It does not
use Tailwind, shadcn, or any component library, and it must not be converted to
them.

**1. Fetch the two source files.**

```
curl -sL https://raw.githubusercontent.com/leedavidsherriff/biohack-gold/main/src/vendor/qrcode.mjs -o src/vendor/qrcode.mjs
curl -sL https://raw.githubusercontent.com/leedavidsherriff/biohack-gold/main/src/App.jsx      -o src/BioHackShop.jsx
```

Put the shop at `src/BioHackShop.jsx`, not in `src/pages/` — it imports
`./vendor/qrcode.mjs` and that relative path has to keep resolving. If you
cannot reach the internet from the sandbox, stop and tell me, and I will paste
the files in instead. Do not write your own version of either file.

**2. Make exactly two edits to `src/BioHackShop.jsx`, and no others.**

- Change the export line `export default function App()` to
  `export default function BioHackShop()`.
- In the `BIZ` block near the top, change `assetBase: './'` to
  `assetBase: 'https://leedavidsherriff.github.io/biohack-gold/'`

  That second one matters: the video, the vial photography, the logo and the
  room-tone audio are hosted there. Without it every image on the site is a
  broken box.

**3. Wire it up as the whole site.**

In `src/App.jsx`, keep `AuthProvider`, `QueryClientProvider` and `Toaster`
exactly as they are, and replace the routes with two that both render the shop:

```jsx
<Route path="/" element={<BioHackShop />} />
<Route path="*" element={<BioHackShop />} />
```

The shop does its own routing internally using the URL hash (`#/shop`,
`#/product/bpc-157`, `#/track`), which react-router ignores, so the two do not
fight. Leave the Login / Register / ForgotPassword / ResetPassword / OAuthConsent
pages alone — they are platform pages.

**4. Delete the old storefront.** These are all superseded and must go, or the
app ships two shops: `src/pages/Home.jsx`, `Shop.jsx`, `ProductDetail.jsx`,
`Checkout.jsx`, `OrderTracking.jsx`, `About.jsx`, `AdminProducts.jsx`, and the
whole of `src/components/shop/`.

**5. Set the page title** in `index.html` to `BioHack Gold — Research Peptides`,
and add `<meta name="robots" content="noindex, nofollow">` while the site is not
finished.

**6. Leave the backend alone.** The shop posts orders to, and reads its live
prices from, an existing order store — the endpoints are already in the `BIZ`
block and they work. Do NOT rewire it to this app's own `Product` and `Order`
entities, do not add `base44.entities` calls to it, and do not create backend
functions for it. Order intake there re-prices every line server-side and
refuses anything without the eligibility declaration; writing orders straight
from the browser would throw that away.

**Rules that are not up for negotiation** — these are legal and commercial, not
stylistic:

- Every price in the file is real. Do not adjust, round, or "benchmark" any of
  them, and do not invent a was/RRP price to make anything look discounted.
- Products marked out of stock stay listed and stay unbuyable. Do not delete
  them and do not quietly make them purchasable.
- Never print a count of how many products there are, anywhere.
- The copy never says a compound does anything to a person. No treats, helps,
  improves, cures, prevents. It is research-use-only material and the wording
  is deliberate throughout.
- Do not touch the `disclaimer`, `eligibilityText` or `returnsText` fields.
- No video anywhere gets a `controls` attribute or a play button.

When you are done, show me the home page, the catalogue, a product page and the
checkout payment screen.

---

## What has to be true first

1. **The source has to be on GitHub.** The prompt pulls from
   `leedavidsherriff/biohack-gold` on `main`. Everything built on 8 Aug is
   committed locally but not pushed, so push first:

   ```bash
   git -C ~/peptide-app push origin main
   ```

2. **The media has to stay where it is.** `assetBase` points at
   `leedavidsherriff.github.io/biohack-gold/`, which serves the hero clip, the
   vial stills, the ambience bed and the posters today. The two new logo files
   (`logo-mark.webp`, `logo-lockup.webp`) are NOT there yet — GitHub Pages has
   been refusing to deploy since 6 Aug. Until that is fixed the header falls
   back to the "BHG" text mark and the age gate shows no logo. Nothing else
   breaks. Fixing Pages, or moving to Cloudflare Pages, fixes the logo too.

3. **Access.** App `6a085638a471335c65dcd3b5` ("Velocis Commerce") is on Karl's
   Base44 account, not Lee's — Lee's login gets `user_not_registered` against
   it. So either Karl adds `info@honestmistywindowrepairs.co.uk` to that app, or
   Karl pastes this prompt into his own builder.

## The alternative to pasting a prompt

If Karl adds Lee to the app, the files can be written straight into the app's
sandbox instead — same result, no builder AI in the middle deciding to be
helpful, and every file verifiable afterwards. The builder still works normally
on the app afterwards, because these are real source files in the repo. That is
the safer route for a 4,000-line component; a builder asked to "recreate" this
will not reproduce it.
