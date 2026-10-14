/* ─────────────────────────────────────────────────────────────
   ART ALIVE SITE SETTINGS
   Fill these in, save, then Commit and Push origin in GitHub Desktop.
   Every page reads them, so this is the only file you need to edit.
   ───────────────────────────────────────────────────────────── */
window.ART_ALIVE = {

  // 1. WHERE SIGN-UPS AND MESSAGES GO
  //    Make a free form at https://formspree.io → New form → copy its address.
  //    It looks like: 'https://formspree.io/f/abcdwxyz'
  //    The waitlist and the contact page both send to it, and you get each one by email.
  formEndpoint: '',

  // 2. A PUBLIC EMAIL ADDRESS (optional)
  //    Shown on the contact page for galleries, businesses and press.
  //    Leave it as '' to keep your email off the site.
  contactEmail: '',

  // 3. VISITOR COUNTING (optional, free, no cookies)
  //    Make an account at https://www.goatcounter.com and type your code here,
  //    for example 'artalive' if your dashboard is artalive.goatcounter.com
  goatcounter: '',

  // 4. ACCOUNTS (Supabase): customers log in and save their projects
  //    From supabase.com → your project → Connect (or Settings → API Keys).
  //    Only the Project URL and the PUBLISHABLE key go here. Never the secret key.
  supabaseUrl: 'https://skacvtlqmbnkkyatkogn.supabase.co',
  supabaseKey: 'sb_publishable_CtdqqBuI7ndfTOLfNUmetw_rjETRv1E',

  //    true: anyone can make an account by entering their email.
  //    false: only people you've added in Supabase (Authentication → Users → Invite) can log in.
  openSignup: true,

  // 5. SHORT SHARE LINKS WITH PREVIEW PICTURES (optional)
  //    After setting up the share helper in Cloudflare (see README, "Link previews"),
  //    type its address here, for example 'https://share.artalivestudio.com/'.
  //    New links and QR codes then show the piece's picture and title when texted or posted.
  //    Leave it as '' to use plain links. Old links and printed QR codes keep working either way.
  shareBase: 'https://share.artalivestudio.com/',

  // 6. PLANS: your Stripe payment links (Stripe → Payment Links → copy each link)
  //    Leave a link as '' and its button goes to the contact page instead.
  stripeLinks: {
    pro20:  '',   // $10 a month, 20 published pieces
    pro50:  '',   // $25 a month, 50 published pieces
    pro100: '',   // $50 a month, 100 published pieces
    pro250: ''    // $100 a month, 250 published pieces
  },

  // 7. 1-ON-1 BOOKING (optional): a Calendly or similar link for custom work.
  //    Leave as '' to send people to the contact page.
  bookingLink: '',

  // 8. BILLING PAGE (optional): Stripe → Settings → Billing → Customer portal →
  //    copy the "login link" (starts https://billing.stripe.com/p/login/).
  //    Paying customers use it to change plan, update their card or cancel.
  stripePortal: ''

};
