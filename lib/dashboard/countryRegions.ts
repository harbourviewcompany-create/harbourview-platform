/**
 * lib/dashboard/countryRegions.ts
 *
 * Sub-national regions for countries where cannabis regulation differs
 * meaningfully by state/province/territory, or where market scale warrants
 * regional filtering.
 *
 * REGIONS   — ISO2 → array of region names shown in the "Select a region" dropdown
 * WARN_REGIONS — regions with elevated caution flags
 * REGION_LABELS — ISO2 → display string for the rules instrument panel header
 *
 * Countries with purely national frameworks are NOT in REGIONS (no dropdown)
 * but ARE in REGION_LABELS (shows "· national-level rule instrument").
 *
 * Last reviewed: June 2026
 */

// ── Sub-national regions ───────────────────────────────────────────────────────
// Only countries where regional variation is commercially meaningful.

export const REGIONS: Record<string, string[]> = {

  // ── Oceania ─────────────────────────────────────────────────────────────────
  AU: ['New South Wales','Victoria','Queensland','Western Australia','South Australia','Australian Capital Territory','Northern Territory','Tasmania'],
  NZ: ['Auckland','Wellington','Canterbury','Otago','Waikato','Bay of Plenty','Manawatu-Whanganui','Northland','Hawke\'s Bay','Taranaki'],

  // ── Europe ──────────────────────────────────────────────────────────────────
  DE: ['Bavaria','Berlin','Hamburg','North Rhine-Westphalia','Baden-Württemberg','Hesse','Lower Saxony','Saxony','Rhineland-Palatinate','Brandenburg','Thuringia','Saxony-Anhalt','Schleswig-Holstein','Mecklenburg-Vorpommern','Saarland','Bremen'],
  NL: ['North Holland','South Holland','Utrecht','Gelderland','North Brabant','Overijssel','Groningen','Friesland','Limburg','Zeeland','Drenthe','Flevoland'],
  GB: ['England','Scotland','Wales','Northern Ireland'],
  CH: ['Zurich','Basel-Stadt','Basel-Land','Geneva','Vaud','Bern','Ticino','Aargau','St. Gallen','Lucerne'],
  PT: ['Lisbon','Porto','Algarve','Alentejo','Centro','Norte','Madeira','Azores'],
  IT: ['Lombardy','Lazio','Campania','Sicily','Veneto','Piedmont','Emilia-Romagna','Apulia','Tuscany','Calabria','Sardinia','Liguria','Marche','Abruzzo','Friuli-Venezia Giulia','Trentino-Alto Adige','Umbria','Basilicata','Molise','Val d\'Aosta'],
  ES: ['Catalonia','Madrid','Andalusia','Valencia','Basque Country','Galicia','Castile and León','Castile-La Mancha','Canary Islands','Murcia','Aragon','Extremadura','Balearic Islands','Asturias','Navarra','Cantabria','La Rioja','Ceuta','Melilla'],
  FR: ['Île-de-France','Auvergne-Rhône-Alpes','Nouvelle-Aquitaine','Occitanie','Hauts-de-France','Provence-Alpes-Côte d\'Azur','Grand Est','Pays de la Loire','Brittany','Normandy','Bourgogne-Franche-Comté','Centre-Val de Loire','Corsica','Overseas Territories'],
  PL: ['Masovian','Silesian','Greater Poland','Lower Silesian','Łódź','Lesser Poland','Pomeranian','Kuyavian-Pomeranian','Lublin','Subcarpathian','Warmian-Masurian','West Pomeranian','Świętokrzyskie','Opole','Podlaskie','Lubusz'],
  CZ: ['Prague','South Moravian','Central Bohemian','Moravian-Silesian','Ústí nad Labem','South Bohemian','Vysočina','Olomouc','Plzeň','Hradec Králové','Liberec','Pardubice','Zlín','Karlovy Vary'],
  GR: ['Attica','Central Macedonia','Thessaly','Western Greece','Crete','Eastern Macedonia','Peloponnese','Epirus','Western Macedonia','Ionian Islands','Aegean Islands','Central Greece','Mount Athos'],
  IL: ['Tel Aviv','Jerusalem','Haifa','Central','Northern','Southern','West Bank Settlements'],
  DK: ['Capital Region','Central Denmark','North Denmark','Zealand','Southern Denmark'],
  HR: ['Zagreb','Split-Dalmatia','Osijek-Baranja','Rijeka','Dubrovnik-Neretva','Istria','Slavonski Brod-Posavina','Zadar','Sisak-Moslavina','Koprivnica-Križevci'],
  RO: ['Bucharest','Cluj','Timiș','Iași','Constanța','Brașov','Prahova','Dolj','Mureș','Bacău'],
  UA: ['Kyiv','Lviv','Kharkiv','Odessa','Dnipro','Zaporizhzhia','Vinnytsya','Poltava','Chernihiv','Sumy','Zakarpattia','Ivano-Frankivsk','Ternopil','Khmelnytskyi'],
  AT: ['Vienna','Lower Austria','Upper Austria','Styria','Tyrol','Carinthia','Salzburg','Vorarlberg','Burgenland'],
  BE: ['Flanders','Wallonia','Brussels-Capital'],
  SI: ['Ljubljana','Maribor','Celje','Kranj','Koper','Novo Mesto','Velenje','Nova Gorica','Murska Sobota'],
  NO: ['Oslo','Viken','Innlandet','Vestfold and Telemark','Agder','Rogaland','Vestland','Møre og Romsdal','Trøndelag','Nordland','Troms og Finnmark'],
  SE: ['Stockholm','Västra Götaland','Skåne','Östergötland','Jönköping','Uppsala','Halland','Örebro','Dalarna','Gävleborg','Norrbotten','Västerbotten','Sörmland','Värmland','Västmanland','Blekinge','Kalmar','Kronoberg','Jämtland','Västernorrland','Gotland'],
  FI: ['Uusimaa','Pirkanmaa','Southwest Finland','North Ostrobothnia','Central Finland','North Savo','South Ostrobothnia','Ostrobothnia','Päijät-Häme','South Karelia','Satakunta','Lapland','North Karelia','Kainuu','South Savo','Tavastia Proper','Central Ostrobothnia','Kymenlaakso','Åland'],
  LU: ['Luxembourg City','Esch-sur-Alzette','Differdange','Dudelange','Pétange'],
  MT: ['Northern','Southern','Central','Gozo','Valletta'],
  MK: ['Skopje','Pelagonia','Polog','Vardar','Southwest','Southeast','Northeast','Eastern'],

  // ── Americas ────────────────────────────────────────────────────────────────
  CA: ['Ontario','British Columbia','Alberta','Quebec','Nova Scotia','New Brunswick','Manitoba','Saskatchewan','Prince Edward Island','Newfoundland and Labrador','Northwest Territories','Yukon','Nunavut'],
  US: ['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming','District of Columbia'],
  MX: ['Aguascalientes','Baja California','Baja California Sur','Campeche','Chiapas','Chihuahua','Coahuila','Colima','Durango','Guanajuato','Guerrero','Hidalgo','Jalisco','Mexico City','Mexico State','Michoacán','Morelos','Nayarit','Nuevo León','Oaxaca','Puebla','Querétaro','Quintana Roo','San Luis Potosí','Sinaloa','Sonora','Tabasco','Tamaulipas','Tlaxcala','Veracruz','Yucatán','Zacatecas'],
  BR: ['São Paulo','Rio de Janeiro','Minas Gerais','Bahia','Paraná','Rio Grande do Sul','Pernambuco','Ceará','Pará','Maranhão','Goiás','Amazonas','Santa Catarina','Espírito Santo','Mato Grosso','Rio Grande do Norte','Alagoas','Piauí','Distrito Federal','Mato Grosso do Sul','Sergipe','Rondônia','Tocantins','Acre','Amapá','Roraima','Paraíba'],
  AR: ['Buenos Aires Province','Buenos Aires City','Córdoba','Santa Fe','Mendoza','Tucumán','Entre Ríos','Salta','Misiones','Chaco','Corrientes','San Juan','Jujuy','Río Negro','Neuquén','Formosa','Chubut','San Luis','Santiago del Estero','La Pampa','Catamarca','La Rioja','Santa Cruz','Tierra del Fuego'],
  CO: ['Bogotá D.C.','Antioquia','Valle del Cauca','Cundinamarca','Atlántico','Santander','Bolívar','Nariño','Boyacá','Cauca','Tolima','Norte de Santander','Huila','Meta','Caldas','Risaralda','Córdoba','Quindío','Magdalena','Sucre','Casanare','Putumayo','Cesar','La Guajira','Caquetá','Chocó','Amazonas','Guaviare','Arauca','Vichada','Guainía','Vaupés'],
  CL: ['Santiago Metropolitan','Valparaíso','Biobío','Araucanía','O\'Higgins','Maule','Los Lagos','Los Ríos','Coquimbo','Antofagasta','Atacama','La Araucanía','Tarapacá','Arica y Parinacota','Magallanes','Ñuble','Aysén'],
  PE: ['Lima','Arequipa','La Libertad','Piura','Lambayeque','Junín','Cusco','Puno','Ica','Áncash','Loreto','Cajamarca','Tacna','San Martín','Ucayali','Madre de Dios','Huánuco','Apurímac','Ayacucho','Moquegua','Tumbes','Pasco','Amazonas','Huancavelica'],
  UY: ['Montevideo','Canelones','Maldonado','Salto','Colonia','Rivera','Paysandú','San José','Tacuarembó','Artigas','Cerro Largo','Durazno','Florida','Flores','Lavalleja','Rocha','Río Negro','Soriano','Treinta y Tres'],
  JM: ['Kingston','St. Andrew','St. Thomas','Portland','St. Mary','St. Ann','Trelawny','St. James','Hanover','Westmoreland','St. Elizabeth','Manchester','Clarendon','St. Catherine'],
  TT: ['Port of Spain','San Fernando','Arima','Chaguanas','Tobago'],

  // ── Middle East / Africa ────────────────────────────────────────────────────
  LS: ['Maseru','Leribe','Berea','Mafeteng','Mohale\'s Hoek','Quthing','Qacha\'s Nek','Mokhotlong','Thaba-Tseka','Butha-Buthe'],
  ZA: ['Gauteng','Western Cape','KwaZulu-Natal','Eastern Cape','Limpopo','Mpumalanga','North West','Free State','Northern Cape'],
  ZW: ['Harare','Bulawayo','Manicaland','Mashonaland Central','Mashonaland East','Mashonaland West','Masvingo','Matabeleland North','Matabeleland South','Midlands'],
  ZM: ['Lusaka','Copperbelt','Eastern','Northern','Southern','Central','Western','Luapula','North-Western','Muchinga'],
  MW: ['Blantyre','Lilongwe','Mzuzu','Zomba','Kasungu','Mangochi','Karonga','Salima','Dedza','Ntcheu'],
  MK: ['Skopje','Bitola','Kumanovo','Ohrid','Strumica','Tetovo','Veles','Štip','Gostivar','Kičevo'],
  MA: ['Casablanca-Settat','Rabat-Salé-Kénitra','Marrakech-Safi','Fès-Meknès','Tanger-Tétouan-Al Hoceïma','Oriental','Drâa-Tafilalet','Béni Mellal-Khénifra','Guelmim-Oued Noun','Laâyoune-Sakia El Hamra','Dakhla-Oued Ed-Dahab','Souss-Massa'],
  LB: ['Beirut','Mount Lebanon','North Lebanon','South Lebanon','Bekaa','Nabatieh','Akkar','Baalbek-Hermel'],
  TH: ['Bangkok','Chiang Mai','Chiang Rai','Phuket','Koh Samui','Pattaya','Nonthaburi','Udon Thani','Khon Kaen','Nakhon Ratchasima','Chonburi','Rayong','Songkhla','Surat Thani'],

  // ── Asia-Pacific ─────────────────────────────────────────────────────────────
  IN: ['Uttar Pradesh','Uttarakhand','Himachal Pradesh','Maharashtra','Karnataka','Tamil Nadu','Rajasthan','West Bengal','Gujarat','Madhya Pradesh','Andhra Pradesh','Odisha','Bihar','Telangana','Punjab','Haryana','Kerala','Assam','Delhi','Chhattisgarh','Jharkhand','Jammu & Kashmir'],
}

// ── Warn regions — elevated caution within an otherwise-open country ───────────
export const WARN_REGIONS: Record<string, string[]> = {
  US: ['Idaho','Kansas','Nebraska','Wyoming','Texas','South Carolina','South Dakota'],
  AU: ['Australian Capital Territory'],
  CA: ['Nunavut','Northwest Territories'],
  MX: ['Chiapas','Guerrero','Michoacán','Sinaloa','Tamaulipas'],
  CO: ['Chocó','Caquetá','Putumayo','Vichada','Guainía'],
  IN: ['Rajasthan','Uttar Pradesh','Bihar'],
  ZA: ['Northern Cape','Free State'],
}

// ── Region labels — shown in the country rules panel header ───────────────────
// Format: "Country · [level] rule instrument"
// Every country in the registry gets an entry; countries without REGIONS
// get "national-level rule instrument".

export const REGION_LABELS: Record<string, string> = {
  // Fully legal / major markets — state/provincial level
  CA: 'Canada · provincial rule instrument',
  US: 'United States · state-level rule instrument',
  DE: 'Germany · Länder-level rule instrument',
  AU: 'Australia · state & territory rule instrument',
  NL: 'Netherlands · provincial rule instrument',
  CH: 'Switzerland · cantonal rule instrument',
  ES: 'Spain · autonomous community rule instrument',
  IT: 'Italy · regional rule instrument',
  GB: 'United Kingdom · devolved rule instrument',
  FR: 'France · regional rule instrument',
  BE: 'Belgium · regional rule instrument',
  MX: 'Mexico · state-level rule instrument',
  BR: 'Brazil · state-level rule instrument',
  AR: 'Argentina · provincial rule instrument',
  IN: 'India · state-level rule instrument',
  CO: 'Colombia · departmental rule instrument',
  CL: 'Chile · regional rule instrument',
  PE: 'Peru · regional rule instrument',
  ZA: 'South Africa · provincial rule instrument',
  TH: 'Thailand · provincial rule instrument',
  UA: 'Ukraine · oblast rule instrument',
  // National-level frameworks — no meaningful sub-national variation
  IL: 'Israel · national-level rule instrument',
  NZ: 'New Zealand · national-level rule instrument',
  PT: 'Portugal · national-level rule instrument',
  PL: 'Poland · national-level rule instrument',
  CZ: 'Czechia · national-level rule instrument',
  DK: 'Denmark · national-level rule instrument',
  HR: 'Croatia · national-level rule instrument',
  GR: 'Greece · national-level rule instrument',
  AT: 'Austria · national-level rule instrument',
  SE: 'Sweden · national-level rule instrument',
  FI: 'Finland · national-level rule instrument',
  NO: 'Norway · national-level rule instrument',
  RO: 'Romania · national-level rule instrument',
  SI: 'Slovenia · national-level rule instrument',
  SK: 'Slovakia · national-level rule instrument',
  LT: 'Lithuania · national-level rule instrument',
  LV: 'Latvia · national-level rule instrument',
  EE: 'Estonia · national-level rule instrument',
  HU: 'Hungary · national-level rule instrument',
  BG: 'Bulgaria · national-level rule instrument',
  RS: 'Serbia · national-level rule instrument',
  LU: 'Luxembourg · national-level rule instrument',
  MT: 'Malta · national-level rule instrument',
  CY: 'Cyprus · national-level rule instrument',
  IE: 'Ireland · national-level rule instrument',
  MK: 'North Macedonia · national-level rule instrument',
  ME: 'Montenegro · national-level rule instrument',
  BA: 'Bosnia · national-level rule instrument',
  XK: 'Kosovo · national-level rule instrument',
  IS: 'Iceland · national-level rule instrument',
  UY: 'Uruguay · national-level rule instrument',
  JM: 'Jamaica · national-level rule instrument',
  TT: 'Trinidad and Tobago · national-level rule instrument',
  EC: 'Ecuador · national-level rule instrument',
  BO: 'Bolivia · national-level rule instrument',
  PY: 'Paraguay · national-level rule instrument',
  GY: 'Guyana · national-level rule instrument',
  SR: 'Suriname · national-level rule instrument',
  CR: 'Costa Rica · national-level rule instrument',
  BS: 'Bahamas · national-level rule instrument',
  LC: 'Saint Lucia · national-level rule instrument',
  MA: 'Morocco · national-level rule instrument',
  LB: 'Lebanon · national-level rule instrument',
  LS: 'Lesotho · national-level rule instrument',
  ZW: 'Zimbabwe · national-level rule instrument',
  ZM: 'Zambia · national-level rule instrument',
  MW: 'Malawi · national-level rule instrument',
  GH: 'Ghana · national-level rule instrument',
  GE: 'Georgia · national-level rule instrument',
  KR: 'South Korea · national-level rule instrument',
  JP: 'Japan · national-level rule instrument',
  LK: 'Sri Lanka · national-level rule instrument',
  PH: 'Philippines · national-level rule instrument',
  KH: 'Cambodia · national-level rule instrument',
  TR: 'Turkey · national-level rule instrument',
  EG: 'Egypt · national-level rule instrument',
  NG: 'Nigeria · national-level rule instrument',
  KE: 'Kenya · national-level rule instrument',
  TZ: 'Tanzania · national-level rule instrument',
  ET: 'Ethiopia · national-level rule instrument',
  UG: 'Uganda · national-level rule instrument',
  RW: 'Rwanda · national-level rule instrument',
  SN: 'Senegal · national-level rule instrument',
  CI: 'Côte d\'Ivoire · national-level rule instrument',
  CM: 'Cameroon · national-level rule instrument',
  NA: 'Namibia · national-level rule instrument',
  BW: 'Botswana · national-level rule instrument',
  SZ: 'eSwatini · national-level rule instrument',
  MZ: 'Mozambique · national-level rule instrument',
  MG: 'Madagascar · national-level rule instrument',
  AO: 'Angola · national-level rule instrument',
  // Prohibition states — no instrument to show
  CN: 'China · prohibition',
  RU: 'Russia · prohibition',
  SA: 'Saudi Arabia · prohibition',
  AE: 'United Arab Emirates · prohibition',
  IR: 'Iran · prohibition',
  IQ: 'Iraq · prohibition',
  SY: 'Syria · prohibition',
  AF: 'Afghanistan · prohibition',
  PK: 'Pakistan · prohibition',
  MY: 'Malaysia · prohibition',
  ID: 'Indonesia · prohibition',
  VN: 'Vietnam · prohibition',
  KP: 'North Korea · prohibition',
  KW: 'Kuwait · prohibition',
  QA: 'Qatar · prohibition',
  BH: 'Bahrain · prohibition',
  OM: 'Oman · prohibition',
  YE: 'Yemen · prohibition',
  SD: 'Sudan · prohibition',
  SS: 'South Sudan · prohibition',
  LY: 'Libya · prohibition',
  TN: 'Tunisia · prohibition',
  DZ: 'Algeria · prohibition',
  TM: 'Turkmenistan · prohibition',
  UZ: 'Uzbekistan · prohibition',
  TJ: 'Tajikistan · prohibition',
  BY: 'Belarus · prohibition',
  CU: 'Cuba · prohibition',
  MM: 'Myanmar · prohibition',
  BN: 'Brunei · prohibition',
  SG: 'Singapore · prohibition',
  TW: 'Taiwan · prohibition',
  HK: 'Hong Kong · prohibition',
  MO: 'Macau · prohibition',
}
