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
| `magicpostcard/` | Magic Postcards: make a postcard that comes alive, printed and mailed |
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

## Magic Postcards (artalivestudio.com/magicpostcard)

A postcard that comes alive. People pick a picture (our Asbury Park boardwalk, or their own photo), add their own video message and a personal message, and type the address. The card is printed and mailed. The person who gets it scans the QR code and points their phone at the postcard: the picture comes alive, and under the card, like the artist's clip under a Blind Canvas painting, a black strip says FROM and the sender's name, with their video playing under it, with sound. Tap the video to pause it. The small picture on the back works too. Without a camera, "Watch it here" shows the same thing on the screen.

The six steps: 1. pick a picture (or upload your own), 2. write the message, 3. record or upload the front video, 4. record or upload a back video (optional; it plays under the card when they scan the back, otherwise the front video plays there too), plus the small picture on the back, 5. who it's going to: "Mail it for me" or "I'll print it myself" (their name goes on the front as To: unless that box is unticked), 6. from you (the name on the FROM strip). Printing it yourself saves the postcard (so its QR code works) and downloads the print files; anything left blank prints as empty lines to write on by hand. No order or payment is made for those yet.

- `magicpostcard/index.html`: the page and the "Make your own" portal, with a live preview of the front and back.
- `magicpostcard/postcard.js`: draws the postcard. The preview, the print files and the picture the camera looks for all come from it.
### Locations, Events and For Businesses

Three example pages, linked from the top of the Magic Postcards page, each with subtabs:
- `magicpostcard/locations.html`: every place card by region (Northeast, South, Midwest, Southwest, West & Pacific). Tap a card to watch it come alive; "Make this card" opens the maker with it chosen (`./?t=<template id>#make`).
- `magicpostcard/events.html`: occasion cards (Birthdays, Holidays, Weddings, New Year, Graduation, Thank You, New Baby). For now they use our place pictures with occasion effects. To add a designed occasion card: put its picture in `stock/` (and a 240 px copy in `stock/thumbs/`), then add an entry to `stock/catalog.json` with `"category": "event"`, `"occasion"` (which subtab it goes in), `"greetText"` (the small script line, e.g. "Happy Birthday") and `"place"` (the big title, e.g. "Pete!"), plus a `live` block (effects: `confetti`, `snow`, `hearts`, `fireworks`, and everything the places use). The maker's step 1 has Locations and Events tabs.
- `magicpostcard/business.html`: one fully produced example (The Sea Glass Hotel, a made-up hotel: the Asbury card with each guest's name, an offer on the back, the hotel logo to scan, and a video under the card), then subtabs with ideas for each industry. "Let's make yours" goes to the contact page, or to `bookingLink` in `site-config.js` if set.

Every card's greeting line is now editable in the maker ("Greetings from", "Happy Holidays from", or none).

### Opened emails and video replies

When someone opens a postcard for the first time, the sender gets an email ("Pete just opened your Magic Postcard!"). The person who got it can record a video reply, or a voice reply if they're camera-shy (a big record button right on the page, or upload a voice memo). It goes privately to the sender: they get an email and watch it on `magicpostcard/replies.html` (Your replies). Opening your own card on the device you ordered it from, or while logged in to your own account, doesn't count. Senders can turn either off in step 6. Each postcard takes up to 10 replies of up to about a minute (50 MB). If you ran `postcard-replies-setup.sql` before voice replies were added, run it again (it's safe).

Setup (once):
1. In Supabase, open SQL Editor and run all of `setup/postcard-replies-setup.sql` (after `postcard-setup.sql`).
2. Emails: make a free account at https://resend.com. Under Domains, add `artalivestudio.com` and add the DNS records it shows you in Cloudflare (DNS → Records). When it says Verified, create an API key.
3. In Supabase, open Edge Functions, deploy a new function with the editor, name it `postcard-events`, and paste all of `setup/postcard-events.ts`. In its settings, turn **off** "Verify JWT" (the people scanning postcards don't have accounts).
4. In Edge Functions → Secrets, add `RESEND_API_KEY` (the key from step 2). Optional: `EMAIL_FROM` (default `Art Alive <postcards@artalivestudio.com>`) and `SITE_URL` (default `https://artalivestudio.com`).

Without the Resend key, nothing is emailed, but replies are still saved and shown on Your replies.

- `magicpostcard/sound.js` and `magicpostcard/stock/sounds/`: soundscapes. A place can have a 16-second sound loop (`"sound"` in the catalog) that plays in step with its animation, on the page and through the camera, and gets quieter while a video message is talking. One sound button turns all of it on or off. Asbury Park's: surf, gulls and the boardwalk crowd by day, a shimmer as the lights come on, a distant band at night, and each firework's whistle, boom and crackle right when it bursts. Sound files are 17 seconds: the last half second of the loop, the 16-second loop, then its first half second.
- `magicpostcard/animate.js`: "Make it move for me". When someone uses their own photo, it brings the photo to life with the Creator Studio's own effects (Glow, Shimmer, Sway, golden hour and night). It finds the sky, the bright spots and the greenery by itself. Three styles: Day to night, Fireworks night, and Sparkle and glow. It's drawn live on the phone, so nothing extra is uploaded.
- `magicpostcard/play.html`: what the QR code opens. Visitors need no account.
- `magicpostcard/stock/`: the place pictures to choose from, listed in `stock/catalog.json` (one entry per place: title, state, city, the place name printed on the card ("Greetings from ARIZONA": the state for a state card, the city for a city card), a one-line blurb, and how it comes alive). The portal shows them with a search box and a state picker, so it grows to every state.
  - **Live places (the default):** a square picture `stock/<id>.jpg` (1024 px or bigger) plus a 240 px copy in `stock/thumbs/<id>.jpg`, and a `live` block in the catalog. No video: Art Alive effects run live on the phone. The `live` block says where the sky and water are, where the sun or a lighthouse lamp sits, where mist drifts, and how the light changes over the loop (golden hour, dusk, stars, sunrise). All settings are explained at the top of `animate.js`. Each postcard keeps a copy of its settings, so editing the catalog never changes cards already sent.
  - **Video places:** like Asbury Park (a 16-second loop made from our effects with hand-tuned lights): the picture plus its animation as an MP4 and a WebM with the same name, and `"video"` in the catalog. An animation must keep the picture exactly in place, because it plays right on top of the printed picture.
  - Live places: all 50 states (plus Asbury Park), each turning from day to a moonlit night with twinkling stars and shooting stars. Effects a place can use: moon and its path on water, Milky Way, northern lights, lens flare, glowing surf, swells, lighthouse beam, warm lit windows, lanterns and boat lights (reflected in water), car headlights along a road, fireflies (or synchronous fireflies), mist, moonbeams through trees, a flowing waterfall, heat lightning, autumn leaves, birds, cloud shadows. Next: two city cards per state (place = the city name).
- `magicpostcard/samples/`: the Asbury Park sample's print files (front and an empty back) and its share picture.

**Switching on ordering (once):**

1. In Supabase, open SQL Editor, then run `setup/postcard-setup.sql` (after the other setup files). It lets projects be postcards, keeps addresses in their own private table, and makes sure postcards never use up a plan's published pieces.
2. Payment (optional): in Stripe, make a Payment Link for one postcard. Under "After payment", redirect to `https://artalivestudio.com/magicpostcard/?paid=1`. Paste it into `stripeLinks.postcard` in `site-config.js`, and put the price in `postcardPrice` (for example `'$4.99'`). With no link, orders are saved without payment, so you can take them by hand at first.

**Filling an order:**

1. In Supabase, open Table Editor, then `postcard_orders`. Each row is one postcard with its address and its `code`.
2. Open `https://artalivestudio.com/magicpostcard/play.html?c=CODE&print=1` and press the two print-file buttons. You get the front and back at 6 × 4 in with 1/8 in bleed, at 300 dpi.
3. Send them to your print-and-mail service with the address (services like Lob and PostGrid print the address on the back for you), then set the row's `status` to `printed` or `mailed`.

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

## Stats (how people enjoy each piece)

- One-time setup: run `setup/analytics-setup.sql` in Supabase's SQL Editor (after the publishing and collections setups). Until then the site works as before and simply counts nothing.
- In **My projects**, every live piece and collection has a **Stats** link: visits each day, how many turned on the camera and found the picture, photos taken and shared, the time of day people visit, phones vs computers, time zones and languages.
- Only the creator who published a piece can see its stats. Nothing that identifies a visitor is kept (no names, emails or IP addresses), and browsers set to "do not track" aren't counted.

## Snow globes (artalivestudio.com/snowglobe)

- One-time setup: run `setup/snowglobe-setup.sql` in Supabase's SQL Editor (after `postcard-setup.sql`).
- Anyone can make one: take or choose a photo or video, fit it in the circle, and (for a video) pick the still. Art Alive suggests a sharp, bright frame. Add the words at the top, a name or a logo for the base (shown in gold), and a base colour.
- **Make my snow globe** saves it to their account and gives a link and QR code. Visitors shake their phone (or swipe, or press Shake) and the snow flies; a video plays once from the chosen frame, then fades back to the still.
- Videos can be up to a minute and 50 MB. Snow globes count towards the plan, like animations and games.
- The Ora holiday globe is at `play/holiday-snowglobe.html`.

## Photos to share

- When a piece comes alive in the camera (Studio player, collections, Magic Postcards, the mug lab), a **Photo** button takes a picture of the moment with the living artwork on it, plus a small "Made with Art Alive" credit. Visitors can **Share** it straight to their apps or **Save** it.

## Link previews (picture and title when a link is texted or posted)

The main site is one page for every piece, so a small Cloudflare helper ("Worker") answers apps like iMessage with the right picture and title, then sends people on. It's free.

1. In Cloudflare, open **Workers & Pages → Create → Create Worker**. Name it `artalive-share` and press **Deploy**.
2. Press **Edit code**, delete what's there, paste everything from `setup/share-worker.js`, and press **Deploy**.
3. In the Worker, open **Settings → Domains & Routes → Add → Custom domain**, type `share.artalivestudio.com`, and add it. Cloudflare sets up the address and its padlock by itself.
4. In `site-config.js`, set `shareBase: 'https://share.artalivestudio.com/'`, then commit and push.

New links then look like `share.artalivestudio.com/k7m2qx9a`. Old links and printed QR codes keep working.
