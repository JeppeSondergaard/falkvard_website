export type ContentType = "text" | "image" | "json";

export interface ContentEntry {
  key: string;
  value: string;
  type: ContentType;
}

export const CONTENT_DEFAULTS: Record<string, { value: string; type: ContentType; label: string; page: string; section: string }> = {
  // ---- About page ----
  "about.hero_heading": { value: "Om Falkvard Tattoo", type: "text", label: "Overskrift", page: "Om", section: "Hero" },
  "about.hero_intro": { value: "Hej allesammen 🖤 Jeg har åbent efter aftale, da jeg driver et privat studie og ikke en butik eller shop.", type: "text", label: "Intro-tekst", page: "Om", section: "Hero" },
  "about.profile_image": { value: "/AndreaFalkvard.jpg", type: "image", label: "Profilbillede", page: "Om", section: "Kunstner" },
  "about.artist_heading": { value: "Historien bag studiet", type: "text", label: "Overskrift", page: "Om", section: "Kunstner" },
  "about.artist_text": { value: "I mit private studie er kunden altid i centrum. Det vigtigste for mig er, at du føler dig tryg, hørt og set gennem hele processen. Jeg er her for at hjælpe dig med at finde det rette design, der passer til dig og din historie.", type: "text", label: "Tekst", page: "Om", section: "Kunstner" },
  "about.quote_text": { value: "Det vigtigste for mig er, at du føler dig tryg, hørt og set gennem hele processen.", type: "text", label: "Citat", page: "Om", section: "Filosofi" },
  "about.value_1_title": { value: "Tryghed", type: "text", label: "Værdi 1 titel", page: "Om", section: "Filosofi" },
  "about.value_1_desc": { value: "Dit private rum, din trygge oplevelse", type: "text", label: "Værdi 1 beskrivelse", page: "Om", section: "Filosofi" },
  "about.value_2_title": { value: "Håndværk", type: "text", label: "Værdi 2 titel", page: "Om", section: "Filosofi" },
  "about.value_2_desc": { value: "Omhyggelig teknik, unikke designs", type: "text", label: "Værdi 2 beskrivelse", page: "Om", section: "Filosofi" },
  "about.value_3_title": { value: "Sjæl", type: "text", label: "Værdi 3 titel", page: "Om", section: "Filosofi" },
  "about.value_3_desc": { value: "Personlig forbindelse, meningsfulde tatoveringer", type: "text", label: "Værdi 3 beskrivelse", page: "Om", section: "Filosofi" },
  "about.booking_heading": { value: "Sådan booker du en tid til en tatovering hos mig:", type: "text", label: "Overskrift", page: "Om", section: "Booking-trin" },
  "about.booking_steps": { value: JSON.stringify(["Velkommen – fedt at du har fundet mig!", "Find din inspiration.", "Send en forespørgsel.", "Vi designer sammen.", "Bliv tatoveret i trygge rammer."]), type: "json", label: "Booking-trin", page: "Om", section: "Booking-trin" },
  "about.cta_heading": { value: "Lad os snakke om dit næste projekt", type: "text", label: "CTA overskrift", page: "Om", section: "CTA" },

  // ---- Home page ----
  "home.hero_label": { value: "Privat studie i Svendborg", type: "text", label: "Label", page: "Forside", section: "Hero" },
  "home.hero_title": { value: "Tatoveringer\nmed sjæl", type: "text", label: "Titel", page: "Forside", section: "Hero" },
  "home.hero_sub": { value: "Nordisk, Ornamental, Dark Art & blomster — skabt i trygge rammer, kun for dig.", type: "text", label: "Undertekst", page: "Forside", section: "Hero" },
  "home.intro_label": { value: "Historien", type: "text", label: "Label", page: "Forside", section: "Intro" },
  "home.intro_heading": { value: "Et privat studie hvor kunden altid er i centrum", type: "text", label: "Overskrift", page: "Forside", section: "Intro" },
  "home.intro_text": { value: "Det vigtigste for mig er, at du føler dig tryg, hørt og set gennem hele processen. Jeg er her for at hjælpe dig med at finde det rette design, der passer til dig og din historie.", type: "text", label: "Tekst", page: "Forside", section: "Intro" },
  "home.services_heading": { value: "Hvad vi tilbyder", type: "text", label: "Overskrift", page: "Forside", section: "Services" },
  "home.service_1_title": { value: "Tatovering", type: "text", label: "Service 1 titel", page: "Forside", section: "Services" },
  "home.service_1_text": { value: "Custom designs i nordisk, ornamental, dark art og blomster stilarter. Altid unikke, altid personlige.", type: "text", label: "Service 1 tekst", page: "Forside", section: "Services" },
  "home.service_2_title": { value: "Piercing", type: "text", label: "Service 2 titel", page: "Forside", section: "Services" },
  "home.service_2_text": { value: "Professionel piercing med kvalitetssmykker i et trygt og sterilt miljø.", type: "text", label: "Service 2 tekst", page: "Forside", section: "Services" },
  "home.service_3_title": { value: "Konsultation", type: "text", label: "Service 3 titel", page: "Forside", section: "Services" },
  "home.service_3_text": { value: "Gratis forhåndssamtale hvor vi sammen finder det perfekte design og placering.", type: "text", label: "Service 3 tekst", page: "Forside", section: "Services" },
  "home.quote_text": { value: "Det vigtigste for mig er, at du føler dig tryg, hørt og set gennem hele processen.", type: "text", label: "Citat", page: "Forside", section: "Citat" },
  "home.quote_author": { value: "— A Falkvard Tattoo", type: "text", label: "Forfatter", page: "Forside", section: "Citat" },
  "home.process_heading": { value: "Sådan booker du", type: "text", label: "Overskrift", page: "Forside", section: "Proces" },
  "home.process_steps": { value: JSON.stringify([
    { title: "Find din inspiration", text: "Kig vores galleri igennem, eller fortæl os om din idé." },
    { title: "Send en forespørgsel", text: "Brug bookingformularen eller skriv direkte til os." },
    { title: "Vi designer sammen", text: "Vi skaber et unikt design, der passer præcist til dig." },
    { title: "Bliv tatoveret", text: "I trygge rammer i vores private studie. Kun dig og tatovøren." },
  ]), type: "json", label: "Procestrin", page: "Forside", section: "Proces" },
  "home.cta_heading": { value: "Klar til din næste tatovering?", type: "text", label: "CTA overskrift", page: "Forside", section: "CTA" },
  "home.cta_text": { value: "Book en gratis konsultation og lad os finde dit perfekte design sammen.", type: "text", label: "CTA tekst", page: "Forside", section: "CTA" },

  // ---- Services page ----
  "services.hero_title": { value: "Alt hvad vi tilbyder", type: "text", label: "Titel", page: "Services", section: "Hero" },
  "services.hero_sub": { value: "I vores private studie i Svendborg", type: "text", label: "Undertekst", page: "Services", section: "Hero" },
  "services.piercing_text": { value: "Vi udfører professionel piercing med kvalitetssmykker i et trygt og sterilt miljø. Alle piercinger inkluderer et startsmykke i titanium og en grundig vejledning i efterpleje.", type: "text", label: "Piercing tekst", page: "Services", section: "Piercing" },
  "services.price_note": { value: "Inkl. smykke. Endelig pris aftales altid på forhånd.", type: "text", label: "Prisnote", page: "Services", section: "Priser" },
  "services.price_consultation": { value: "Gratis", type: "text", label: "Konsultation pris", page: "Services", section: "Priser" },
  "services.price_minimum": { value: "800 kr", type: "text", label: "Minimum pris", page: "Services", section: "Priser" },
  "services.price_hourly": { value: "1.200 kr", type: "text", label: "Timepris", page: "Services", section: "Priser" },
  "services.price_piercing": { value: "400 kr", type: "text", label: "Piercing fra pris", page: "Services", section: "Priser" },
  "services.cta_heading": { value: "Klar til at komme i gang?", type: "text", label: "CTA overskrift", page: "Services", section: "CTA" },
  "services.cta_text": { value: "Book en gratis konsultation og lad os finde dit design sammen.", type: "text", label: "CTA tekst", page: "Services", section: "CTA" },

  // ---- Aftercare page ----
  "aftercare.hero_heading": { value: "Efterpleje", type: "text", label: "Overskrift", page: "Aftercare", section: "Hero" },
  "aftercare.hero_intro": { value: "God efterpleje er afgørende for et flot resultat. Her er din guide til at passe på din nye tatovering eller piercing.", type: "text", label: "Intro", page: "Aftercare", section: "Hero" },
  "aftercare.tattoo_heading": { value: "Tatovering efterpleje", type: "text", label: "Sektion overskrift", page: "Aftercare", section: "Tattoo" },
  "aftercare.tattoo_steps": { value: JSON.stringify([
    { title: "Dag 1-3", text: "Hold forbindingen på i 2-4 timer. Vask forsigtigt med lunkent vand og parfumefri sæbe. Dup tør med rent papir - gnid ikke." },
    { title: "Uge 1-2", text: "Smør tynt lag af efterplejeproduktet 2-3 gange dagligt. Undgå at kradse eller pille i skorperne. Hold tatoveringen ren og tør." },
    { title: "Uge 3-4", text: "Huden kan begynde at skalle - det er helt normalt. Fortsæt med at fugte, men lad huden ånde. Undgå sol, bassiner og havet." },
    { title: "Fremover", text: "Brug altid solcreme (SPF 30+) på din tatovering i solen. Det holder farverne stærke og linjerne skarpe i årevis." },
  ]), type: "json", label: "Efterpleje-trin", page: "Aftercare", section: "Tattoo" },
  "aftercare.donts_heading": { value: "Undgå de første 2-4 uger", type: "text", label: "Sektion overskrift", page: "Aftercare", section: "Undgå" },
  "aftercare.donts_items": { value: JSON.stringify([
    "Svømmehaller, badekar og sauna",
    "Direkte sollys og solarier",
    "Stram, gnidende tøj over tatoveringen",
    "At kradse eller pille i skorper",
    "Alkohol og blodfortyndende midler (24 timer efter)",
    "Dyrehår og støvede omgivelser",
  ]), type: "json", label: "Undgå-liste", page: "Aftercare", section: "Undgå" },
  "aftercare.piercing_heading": { value: "Piercing efterpleje", type: "text", label: "Sektion overskrift", page: "Aftercare", section: "Piercing" },
  "aftercare.piercing_steps": { value: JSON.stringify([
    { title: "De første uger", text: "Rens med saltvand (0.9%) morgen og aften. Undgå at røre piercingen med beskidte hænder. Lad smykket sidde - drej det ikke." },
    { title: "Helingsperiode", text: "De fleste piercinger heler i løbet af 6-12 uger (brusk kan tage op til 6 måneder). Undgå at skifte smykke for tidligt." },
    { title: "Tegn på problemer", text: "Hævelse og rødme de første dage er normalt. Kontakt os hvis du oplever vedvarende smerte, grøn/gul væske eller usædvanlig hævelse." },
  ]), type: "json", label: "Piercing-trin", page: "Aftercare", section: "Piercing" },
  "aftercare.cta_heading": { value: "Har du spørgsmål?", type: "text", label: "CTA overskrift", page: "Aftercare", section: "CTA" },
  "aftercare.cta_text": { value: "Er du i tvivl om noget, er du altid velkommen til at kontakte mig.", type: "text", label: "CTA tekst", page: "Aftercare", section: "CTA" },
  "aftercare.cta_button_label": { value: "Kontakt mig", type: "text", label: "CTA knaptekst", page: "Aftercare", section: "CTA" },

  // ---- Contact page ----
  "contact.hero_heading": { value: "Kontakt", type: "text", label: "Overskrift", page: "Kontakt", section: "Hero" },
  "contact.hero_intro": { value: "Har du spørgsmål eller vil du booke en tid? Du er altid velkommen til at skrive.", type: "text", label: "Intro", page: "Kontakt", section: "Hero" },
  "contact.address_line1": { value: "Ramsherred 1", type: "text", label: "Adresse linje 1", page: "Kontakt", section: "Info" },
  "contact.address_line2": { value: "5700 Svendborg", type: "text", label: "Adresse linje 2", page: "Kontakt", section: "Info" },
  "contact.address_note": { value: "Privat studie — kun efter aftale", type: "text", label: "Adresse note", page: "Kontakt", section: "Info" },
  "contact.instagram": { value: "@a_falkvard_tattoo", type: "text", label: "Instagram", page: "Kontakt", section: "Info" },
  "contact.instagram_url": { value: "https://www.instagram.com/a_falkvard_tattoo/", type: "text", label: "Instagram URL", page: "Kontakt", section: "Info" },
  "contact.instagram_note": { value: "Instagram er den hurtigste måde at nå mig", type: "text", label: "Instagram note", page: "Kontakt", section: "Info" },
  "contact.hours": { value: "Kun efter aftale", type: "text", label: "Åbningstider", page: "Kontakt", section: "Info" },
  "contact.hours_note": { value: "Book din tid, så finder vi et tidspunkt der passer", type: "text", label: "Åbningstider note", page: "Kontakt", section: "Info" },
  "contact.cta_heading": { value: "Klar til at booke?", type: "text", label: "CTA overskrift", page: "Kontakt", section: "CTA" },
  "contact.cta_text": { value: "Udfyld vores booking-formular, så vender jeg tilbage hurtigst muligt.", type: "text", label: "CTA tekst", page: "Kontakt", section: "CTA" },

  // ---- Booking page ----
  "booking.heading": { value: "Book en tid", type: "text", label: "Overskrift", page: "Booking", section: "Formular" },
  "booking.intro": { value: "Udfyld formularen herunder, så vender jeg tilbage hurtigst muligt med en bekræftelse og evt. designforslag.", type: "text", label: "Intro", page: "Booking", section: "Formular" },
  "booking.faq": { value: JSON.stringify([
    { q: "Hvor lang tid tager en tatovering?", a: "Det kommer helt an på størrelse og detaljegrad. Små tatoveringer tager typisk 1-2 timer, mens større projekter kan tage flere sessioner." },
    { q: "Gør det ondt?", a: "Smerte er individuelt, men de fleste beskriver det som et ubehag der er til at holde ud. Vi sørger for, at du er så komfortabel som muligt." },
    { q: "Kan jeg tage en ven med?", a: "Ja, du er velkommen til at tage én person med til din session." },
    { q: "Hvad koster en tatovering?", a: "Prisen afhænger af størrelse, kompleksitet og placering. Minimum er 800 kr. Vi aftaler altid en fast pris inden vi starter." },
    { q: "Skal jeg have en idé klar?", a: "Det behøver du ikke! Vi kan sagtens designe noget sammen baseret på dine ønsker og idéer. Book en konsultation, så tager vi en snak." },
  ]), type: "json", label: "FAQ", page: "Booking", section: "FAQ" },
};
