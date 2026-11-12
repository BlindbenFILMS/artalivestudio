/* What the Ora snowman says when the globe opens (Ben's own voice, recorded as "Sewall Ave 3"):

     "Happy holidays, Ora Family! Every snowflake is different. Bring the right ones together and you can really spell something special."

   src    the recording (hello.mp3: the recording with the quiet moment before the first word cut short, and nothing else changed)
   first  when the first word begins (seconds into hello.mp3)
   to     when the last word has ended
   mouth  how wide his mouth is open, 50 times a second, measured from the loudness of the voice in hello.mp3
          (one character each: 0 = closed … z = wide open). A new recording needs a new measurement. */
export const hello = {
  src: new URL('./hello.mp3', import.meta.url).href,
  words: 'Happy holidays, Ora Family! Every snowflake is different. Bring the right ones together and you can really spell something special.',
  from: 0, first: 0.50, to: 11.26, fps: 50,
  mouth: '00000000000000000000000009rxzzzwvyxh5200kolje99ine51000000000dyzxvxxzzzzyxzn88wzyurpmopjeec52000000000000000cuzzzzzyxwyyxwwyzzzyte410000000ajifoutsswzzqedlolhfa69dcb62122242112100000000000000000000000000000000000000000000009vzzzzp9313lwwsh7210000000007txyzzyti62100008mmknnk93101cjd520000004pzzyn8210008ffb9ba72100000000000000000000000000000000000000dquzzzywsqrwtkc4119lpxzzzyth8521dyzzzzym93100021iwi622kxzxwuqe8purpkd52100000000000000000000000000000001343akswyn93104lqsqib7bfnotyxpiiswwqc410000009rqotssutf5100005sxurwi6214myxi83100003lrngie5254218a9652100000000000000000000000000000000000000000000000'
};
