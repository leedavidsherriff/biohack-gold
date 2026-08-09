# Rebuilding BioHack Gold inside Base44

Send this to Karl to paste into the Base44 builder of the app he is already
running ("Velocis Commerce", `6a085638a471335c65dcd3b5`). It replaces that
app's storefront with the shop in `~/peptide-app`.

Everything it fetches is live and was checked on 8 Aug 2026:

| What | Where | Checked |
|---|---|---|
| Shop source (3,807 lines) | `raw.githubusercontent.com/leedavidsherriff/biohack-gold/main/src/App.jsx` | 200, 190 KB |
| QR encoder | `…/main/src/vendor/qrcode.mjs` | 200, 52 KB |
| All media (video, vials, logos, audio) | `cdn.jsdelivr.net/gh/leedavidsherriff/biohack-gold@main/public/` | 200, CORS `*` |

Media goes through jsDelivr rather than GitHub Pages deliberately: Pages has
been refusing to deploy since 6 Aug, so the two new logo files never landed
there. jsDelivr serves straight off the repo, so it has everything, and it is a
real CDN rather than a raw file host. If media is ever replaced, purge it at
`purge.jsdelivr.net/gh/leedavidsherriff/biohack-gold@main/public/media/<file>` —
jsDelivr caches `@main` for up to a week.

---

## The prompt — paste everything between the lines

---

Replace this app's storefront with the BioHack Gold shop I have already built.
Do not redesign it, do not restyle it, and do not rewrite the copy — the point
of this exercise is that the shop arrives exactly as written. It is one
self-contained React component with its own stylesheet inside it. It does not
use Tailwind, shadcn or any component library, and it must not be converted to
them.

**1. Fetch the two source files.**

```
curl -sL https://raw.githubusercontent.com/leedavidsherriff/biohack-gold/main/src/vendor/qrcode.mjs -o src/vendor/qrcode.mjs
curl -sL https://raw.githubusercontent.com/leedavidsherriff/biohack-gold/main/src/App.jsx           -o src/BioHackShop.jsx
```

The shop goes at `src/BioHackShop.jsx`, NOT in `src/pages/` — it imports
`./vendor/qrcode.mjs` and that relative path has to keep resolving. Check the
first file is about 2,250 lines and the second about 3,800; if either comes back
short or as an HTML error page, stop and tell me rather than filling in the
gaps. Do not write your own version of either file.

**2. Make exactly two edits to `src/BioHackShop.jsx`, and no others.**

- `export default function App() {` → `export default function BioHackShop() {`
- In the `BIZ` block near the top (line 39), `assetBase: './',` becomes:

  ```js
  assetBase: 'https://cdn.jsdelivr.net/gh/leedavidsherriff/biohack-gold@main/public/',
  ```

  That one matters: the hero video, the vial photography, the logo and the
  room-tone audio all live there. Without it every image on the site is a
  broken box.

**3. Wire it up as the whole site.**

In `src/App.jsx`, keep `AuthProvider`, `QueryClientProvider` and `Toaster`
exactly as they are, and replace the routes with two that both render the shop:

```jsx
<Route path="/" element={<BioHackShop />} />
<Route path="*" element={<BioHackShop />} />
```

The shop routes internally using the URL hash (`#/shop`, `#/product/bpc-157`,
`#/track`), which react-router ignores, so the two do not fight. Leave the
Login / Register / ForgotPassword / ResetPassword / OAuthConsent pages alone —
they are platform pages.

**4. Delete the old storefront**, or the app ships two shops: `src/pages/Home.jsx`,
`Shop.jsx`, `ProductDetail.jsx`, `Checkout.jsx`, `OrderTracking.jsx`,
`About.jsx`, `AdminProducts.jsx`, and all of `src/components/shop/`.

**5. In `index.html`**, set the title to `BioHack Gold — Research Peptides` and
add `<meta name="robots" content="noindex, nofollow">` while the site is not
finished.

**6. Leave the backend alone.** The shop posts orders to, and reads its live
prices from, an order store that already exists — the endpoints are in the `BIZ`
block and they work. Do NOT rewire it to this app's own `Product` and `Order`
entities, do not add `base44.entities` calls to it, and do not create backend
functions for it. That store re-prices every line server-side, caps the
discount, refuses anything without the eligibility declaration, allocates the
payment reference and sends the confirmation email. Writing orders straight
from the browser would throw all of that away.

**Rules that are not up for negotiation** — these are legal and commercial, not
stylistic:

- Every price in the file is real. Do not adjust, round or "benchmark" any of
  them, and never invent a was/RRP price to make something look discounted.
- Products marked out of stock stay listed and stay unbuyable. Do not delete
  them, and do not quietly make them purchasable.
- Never print a count of how many products there are, anywhere.
- The copy never says a compound does anything to a person — no treats, helps,
  improves, cures, prevents. This is research-use-only material and the wording
  throughout is deliberate.
- Do not touch the `disclaimer`, `eligibilityText` or `returnsText` fields.
- No video anywhere gets a `controls` attribute or a play button.

When you are done, show me the home page, the catalogue, a product page and the
checkout payment screen.

---

## What to expect afterwards

- **The age gate comes up first** — 18+, session-scoped. That is correct.
- **The hero is a video that plays itself**, silent, with a small sound chip. If
  the clip is slow to arrive the poster shows instead; nothing breaks.
- **Orders land in the ops hub**, `https://biohack-ops-f35f9650.base44.app`
  (Lee's key opens it). They do not appear in this Base44 app's `Order` entity —
  that is by design.
- **Prices can be changed without a deploy**, from the catalogue editor in that
  same hub. The shop reads them on load and falls back to its built-in prices if
  the call fails.

## Still outstanding, unrelated to this move

Whether Karl holds all fifteen priced products or only nine · Wallid's own bank
details, if they differ from the Barclays ones · an orders inbox
(`BHG_NOTIFY_EMAIL`) · real stock counts · the commission rate, still zero.
