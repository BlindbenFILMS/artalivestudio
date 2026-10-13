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
  openSignup: true

};
