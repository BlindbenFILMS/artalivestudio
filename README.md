# Art Alive

Point your phone. Watch any image come alive.

Live at https://artalivestudio.com/

Made by the Blind Canvas Project and Able Art Alliance.

---

## Before launch: three settings

Open `site-config.js` in Notepad, fill in the blanks between the quote marks, and save. Every page reads this one file.

1. **Contact form.** Make a free account at https://formspree.io, choose New form, and copy its address (it looks like `https://formspree.io/f/abcdwxyz`). Paste it into `formEndpoint`. Every message then arrives in your email. Until you do this, the forms say "not connected yet" and send nothing.
2. **Public email (optional).** Put an address in `contactEmail` to show it on the contact page. Leave it empty to keep your email off the site.
3. **Visitor counting (optional).** Make a free account at https://www.goatcounter.com (no cookies, no banner needed). If your dashboard is `artalive.goatcounter.com`, type `artalive` into `goatcounter`. It counts page views plus these moments in the demo: camera started, watched without the camera, shape found, and forms sent.

Then in GitHub Desktop: write a short summary, click **Commit to main**, then **Push origin**. Changes are live in a minute or two.

## Launch checklist

- [ ] Fill in `site-config.js` (above), push, then send yourself a test sign-up.
- [ ] Open the demo on your phone and point it at a TV, a poster and a sheet of paper.
- [ ] Print the letter-size poster (`print/art-alive-poster-letter.pdf`) and scan its QR code.
- [ ] Paste the home page link into a message to yourself and check the preview image shows.
- [ ] Confirm you have the rights to every painting and video used on the site.
- [ ] Check the name: other apps already use "Art Alive" (see below).

## What's where

| File or folder | What it is |
| --- | --- |
| `index.html` | Home page |
| `for-*.html` | For Creators, Galleries, Businesses and Everyone |
| `about.html`, `contact.html`, `privacy.html` | About, contact form, privacy notice |
| `login.html`, `projects.html`, `plans.html` | Create account or log in, My projects, Plans and pricing |
| `presskit.html` | Logos, videos, printables and ready-to-post captions |
| `demo/` | The camera demo ("See it now") |
| `studio/` | The Living Painting Studio ("Create your own") |
| `games/` | The Game Maker: turn a painting into a game with your voice |
| `gallery.html`, `play/` | The Gallery page and its playable example games |
| `how-to.html`, `howto/` | How to make one, with step-by-step pictures |
| `voice/` | Your Chatterbox voice files and the script that makes them |
| `capture.js` | Take photo, crop and record tools used by the studio and Game Maker |
| `print/` | Printable PDFs: posters, coaster, sticker, table card |
| `site.css` | Look and layout for every page |
| `site-config.js` | Your settings (the only file you need to edit) |
| `site.js` | Counting and forms; no need to edit |
| `setup/` | One-time database files for Supabase, the link-preview helper and the payments helper |

## Your own voice (Chatterbox)

Every fixed line the site speaks (the camera help and the example games) can play in your cloned voice instead of the computer voice.

1. Put a clean 10-20 second recording of your voice in the `voice` folder, named `my-voice.wav`.
2. Open a terminal in `voice` and run `python make_voice.py` (use the Python where Chatterbox is installed).
3. Commit and push. Any line without a file keeps the computer voice, so you can do it a few at a time.

Made the files another way? Name them as in `voice/voice-lines.csv` (for example `camera-03.mp3`), put them in `voice`, and run `python make_voice.py --index`.

## Plans and automatic billing

Everyone starts on Free (3 published pieces). Paid plans switch on and off by themselves through Stripe.

1. **Database:** in Supabase, open SQL Editor, then run `setup/plans-setup.sql`, then `setup/billing-setup.sql`.
2. **Payment links:** in Stripe, make 4 Payment Links: $10, $25, $50 and $100 a month. Under "After payment", choose to redirect to `https://artalivestudio.com/plans.html?thanks=1`. Paste the links into `stripeLinks` in `site-config.js`.
3. **Payments helper:** in Supabase, open Edge Functions, choose to deploy a new function with the editor, name it `stripe-webhook`, and paste all of `setup/stripe-webhook.ts`. In the function's settings, turn **off** "Verify JWT" (Stripe doesn't sign in to Supabase).
4. **Tell Stripe:** in Stripe, open Developers → Webhooks and add an endpoint at `https://skacvtlqmbnkkyatkogn.supabase.co/functions/v1/stripe-webhook`. Choose these events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`.
5. **The secret:** Stripe then shows a signing secret starting `whsec_`. In Supabase, open Edge Functions → Secrets and add it as `STRIPE_WEBHOOK_SECRET`.
6. **Billing page (optional):** in Stripe, turn on the Customer portal and paste its login link into `stripePortal` in `site-config.js`. Paying customers use it to change plan, update their card or cancel.

When someone cancels, or Stripe gives up on a failed card, they go back to Free. Nothing is deleted: visitors see their first 3 pieces until they unpublish some or subscribe again. Your own `owner` row and any `custom` deals are never changed automatically. To give someone a custom deal, set their row in Table Editor → plans to tier `custom` and the number you agreed.

If you change a price in Stripe, change it in Table Editor → plan_prices too (amounts are in cents: 1000 is $10).

## Your web address

The site lives at **https://artalivestudio.com**, published from its own GitHub repository with GitHub Pages.
The `CNAME` file tells GitHub Pages which domain to use; leave it in place.
The domain is registered at Cloudflare, whose DNS points it to GitHub Pages (see the setup steps Claude gave you).

## Customer accounts (Supabase)

Customers log in with an email link (no password) and save their animations and games to **My projects**.

- Settings are in `site-config.js`: the Supabase Project URL and **publishable** key. Never put the secret key in any file here.
- One-time setup: in Supabase, open **SQL Editor → New query**, paste everything from `setup/supabase-setup.sql`, and press **Run**.
- To make accounts invite-only, set `openSignup: false` in `site-config.js` and invite people in Supabase under **Authentication → Users → Invite**.
- Pages: `login.html` (log in), `projects.html` (My projects). The Studio and Game Maker each have a **Save to my account** button.

## Publishing (links and QR codes)

- One-time setup: in Supabase **SQL Editor → New query**, paste everything from `setup/publish-setup.sql`, and press **Run** (after `supabase-setup.sql`).
- Creators press **Publish** in the Studio, the Game Maker or My projects. They get a link like `artalivestudio.com/p/?c=abcd2345` and a QR code to download and print.
- Visitors need no account. Games play at that link; animations open in the Studio player, where **Point at the picture** puts the living version on the real picture through the phone camera.
- Saving a published project updates what visitors see. **Unpublish** hides it; publishing again keeps the same link and QR code.

## Collections ("50 images, 1 QR code")

- One-time setup: run `setup/collections-setup.sql` in Supabase's SQL Editor (after the other two).
- In **My projects**, press **New collection**, name it, tick up to 50 pieces, and save. Each piece is published automatically.
- Press **Publish** on the collection for one QR code. Visitors scan it, press **Point at a picture**, and the camera works out which piece they are looking at. There is also a list to choose from, for anyone who prefers it.
- The camera tells pieces apart by their pictures, so very similar-looking pieces are harder to tell apart.

## Link previews (picture and title when a link is texted or posted)

The main site is one page for every piece, so a small Cloudflare helper ("Worker") answers apps like iMessage with the right picture and title, then sends people on. It's free.

1. In Cloudflare, open **Workers & Pages → Create → Create Worker**. Name it `artalive-share` and press **Deploy**.
2. Press **Edit code**, delete what's there, paste everything from `setup/share-worker.js`, and press **Deploy**.
3. In the Worker, open **Settings → Domains & Routes → Add → Custom domain**, type `share.artalivestudio.com`, and add it. Cloudflare sets up the address and its padlock by itself.
4. In `site-config.js`, set `shareBase: 'https://share.artalivestudio.com/'`, then commit and push.

New links then look like `share.artalivestudio.com/k7m2qx9a`. Old links and printed QR codes keep working.
