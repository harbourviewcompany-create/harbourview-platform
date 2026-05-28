import type { CountryDashboardSummary, DashboardPanel, DashboardPanelState, DashboardSection, PublicCountryDashboardDto } from './contracts'

export const dashboardSections: Exclude<DashboardSection, 'overview'>[] = [
  'market',
  'education',
  'compliance',
  'signals',
  'opportunities',
  'intelligence',
  'connections',
]

const sectionLabels: Record<Exclude<DashboardSection, 'overview'>, string> = {
  market: 'Market',
  education: 'Education',
  compliance: 'Compliance',
  signals: 'Signals',
  opportunities: 'Opportunities',
  intelligence: 'Intelligence',
  connections: 'Reviewed Connections',
}

const statusLabels: Record<DashboardPanelState, string> = {
  live: 'Live dashboard',
  partial: 'Partial dashboard',
  'static-orientation': 'Static orientation',
  'fallback-backed': 'Fallback-backed orientation',
  'request-only': 'Request-only review',
  'review-required': 'Review required',
  unavailable: 'Unavailable',
}

const availableStates = new Set<DashboardPanelState>(['live', 'partial', 'static-orientation', 'fallback-backed', 'request-only', 'review-required'])

export function getDashboardCountryHref(slug: string) {
  return `/dashboard/country/${slug}`
}

export function getDashboardSectionHref(slug: string, section: Exclude<DashboardSection, 'overview'>) {
  return `${getDashboardCountryHref(slug)}/${section}`
}

function makePanel(countrySlug: string, section: Exclude<DashboardSection, 'overview'>, state: DashboardPanelState, countryName: string): DashboardPanel {
  const label = sectionLabels[section]
  return {
    state,
    title: `${countryName} ${label}`,
    summary: `${label} dashboard state for ${countryName}: ${statusLabels[state].toLowerCase()}.`,
    statusLabel: statusLabels[state],
    emptyState: state === 'unavailable'
      ? `${label} is not available for ${countryName}. Request a confidential review for routed support.`
      : `${label} content is available as ${statusLabels[state].toLowerCase()}.`,
    actions: [
      { label: `Open ${label}`, href: getDashboardSectionHref(countrySlug, section), section, intent: 'secondary' },
      { label: 'Request Confidential Review', href: `/contact?country=${countrySlug}&intent=dashboard-review`, section, intent: 'review' },
    ],
    sourceStatus: {
      label: statusLabels[state],
      state,
      lastUpdatedLabel: 'Updated May 28, 2026',
    },
  }
}

function panelStateFor(section: Exclude<DashboardSection, 'overview'>, dashboardStatus: DashboardPanelState): DashboardPanelState {
  if (dashboardStatus === 'unavailable') return 'unavailable'
  if (section === 'market') return dashboardStatus
  if (section === 'education') return dashboardStatus === 'live' ? 'partial' : 'static-orientation'
  if (section === 'compliance') return dashboardStatus === 'live' ? 'partial' : 'review-required'
  if (section === 'signals') return dashboardStatus === 'live' || dashboardStatus === 'partial' ? 'fallback-backed' : dashboardStatus
  if (section === 'opportunities') return 'request-only'
  if (section === 'intelligence') return dashboardStatus === 'live' ? 'partial' : 'static-orientation'
  return dashboardStatus === 'live' ? 'review-required' : 'unavailable'
}

type CountrySeed = {
  slug: string
  iso2: string
  iso3: string
  displayName: string
  region: string
  subregion: string
  globeFeatureId: string
  aliases: string[]
  dashboardStatus: DashboardPanelState
  publicSummary: string
}

const countrySeeds: CountrySeed[] = 
[
  {
    slug: "afghanistan",
    iso2: "AF",
    iso3: "AFG",
    displayName: "Afghanistan",
    region: "Asia",
    subregion: "Southern Asia",
    globeFeatureId: "AFG",
    aliases: [
      "Afghanistan"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Afghanistan has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "albania",
    iso2: "AL",
    iso3: "ALB",
    displayName: "Albania",
    region: "Europe",
    subregion: "Southern Europe",
    globeFeatureId: "ALB",
    aliases: [
      "Albania"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Albania has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "algeria",
    iso2: "DZ",
    iso3: "DZA",
    displayName: "Algeria",
    region: "Africa",
    subregion: "Northern Africa",
    globeFeatureId: "DZA",
    aliases: [
      "Algeria"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Algeria has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "angola",
    iso2: "AO",
    iso3: "AGO",
    displayName: "Angola",
    region: "Africa",
    subregion: "Middle Africa",
    globeFeatureId: "AGO",
    aliases: [
      "Angola"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Angola has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "antarctica",
    iso2: "AQ",
    iso3: "ATA",
    displayName: "Antarctica",
    region: "Antarctica",
    subregion: "Antarctica",
    globeFeatureId: "ATA",
    aliases: [
      "Antarctica"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Antarctica has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "argentina",
    iso2: "AR",
    iso3: "ARG",
    displayName: "Argentina",
    region: "Americas",
    subregion: "South America",
    globeFeatureId: "ARG",
    aliases: [
      "Argentina"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Argentina has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "armenia",
    iso2: "AM",
    iso3: "ARM",
    displayName: "Armenia",
    region: "Asia",
    subregion: "Western Asia",
    globeFeatureId: "ARM",
    aliases: [
      "Armenia"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Armenia has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "australia",
    iso2: "AU",
    iso3: "AUS",
    displayName: "Australia",
    region: "Oceania",
    subregion: "Australia and New Zealand",
    globeFeatureId: "AUS",
    aliases: [
      "Australia"
    ],
    dashboardStatus: "partial",
    publicSummary: "Australia has a partial dashboard for medical-market orientation, education, compliance, and signals."
  },
  {
    slug: "austria",
    iso2: "AT",
    iso3: "AUT",
    displayName: "Austria",
    region: "Europe",
    subregion: "Western Europe",
    globeFeatureId: "AUT",
    aliases: [
      "Austria"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Austria has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "azerbaijan",
    iso2: "AZ",
    iso3: "AZE",
    displayName: "Azerbaijan",
    region: "Asia",
    subregion: "Western Asia",
    globeFeatureId: "AZE",
    aliases: [
      "Azerbaijan"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Azerbaijan has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "bangladesh",
    iso2: "BD",
    iso3: "BGD",
    displayName: "Bangladesh",
    region: "Asia",
    subregion: "Southern Asia",
    globeFeatureId: "BGD",
    aliases: [
      "Bangladesh"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Bangladesh has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "belarus",
    iso2: "BY",
    iso3: "BLR",
    displayName: "Belarus",
    region: "Europe",
    subregion: "Eastern Europe",
    globeFeatureId: "BLR",
    aliases: [
      "Belarus"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Belarus has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "belgium",
    iso2: "BE",
    iso3: "BEL",
    displayName: "Belgium",
    region: "Europe",
    subregion: "Western Europe",
    globeFeatureId: "BEL",
    aliases: [
      "Belgium"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Belgium has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "belize",
    iso2: "BZ",
    iso3: "BLZ",
    displayName: "Belize",
    region: "Americas",
    subregion: "Central America",
    globeFeatureId: "BLZ",
    aliases: [
      "Belize"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Belize has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "benin",
    iso2: "BJ",
    iso3: "BEN",
    displayName: "Benin",
    region: "Africa",
    subregion: "Western Africa",
    globeFeatureId: "BEN",
    aliases: [
      "Benin"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Benin has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "bhutan",
    iso2: "BT",
    iso3: "BTN",
    displayName: "Bhutan",
    region: "Asia",
    subregion: "Southern Asia",
    globeFeatureId: "BTN",
    aliases: [
      "Bhutan"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Bhutan has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "bolivia",
    iso2: "BO",
    iso3: "BOL",
    displayName: "Bolivia",
    region: "Americas",
    subregion: "South America",
    globeFeatureId: "BOL",
    aliases: [
      "Bolivia",
      "Plurinational State of Bolivia"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Bolivia has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "bosnia-and-herzegovina",
    iso2: "BA",
    iso3: "BIH",
    displayName: "Bosnia and Herzegovina",
    region: "Europe",
    subregion: "Southern Europe",
    globeFeatureId: "BIH",
    aliases: [
      "Bosnia and Herzegovina"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Bosnia and Herzegovina has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "botswana",
    iso2: "BW",
    iso3: "BWA",
    displayName: "Botswana",
    region: "Africa",
    subregion: "Southern Africa",
    globeFeatureId: "BWA",
    aliases: [
      "Botswana"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Botswana has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "brazil",
    iso2: "BR",
    iso3: "BRA",
    displayName: "Brazil",
    region: "Americas",
    subregion: "South America",
    globeFeatureId: "BRA",
    aliases: [
      "Brazil"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Brazil has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "brunei",
    iso2: "BN",
    iso3: "BRN",
    displayName: "Brunei",
    region: "Asia",
    subregion: "South-Eastern Asia",
    globeFeatureId: "BRN",
    aliases: [
      "Brunei"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Brunei has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "bulgaria",
    iso2: "BG",
    iso3: "BGR",
    displayName: "Bulgaria",
    region: "Europe",
    subregion: "Eastern Europe",
    globeFeatureId: "BGR",
    aliases: [
      "Bulgaria"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Bulgaria has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "burkina-faso",
    iso2: "BF",
    iso3: "BFA",
    displayName: "Burkina Faso",
    region: "Africa",
    subregion: "Western Africa",
    globeFeatureId: "BFA",
    aliases: [
      "Burkina Faso"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Burkina Faso has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "burundi",
    iso2: "BI",
    iso3: "BDI",
    displayName: "Burundi",
    region: "Africa",
    subregion: "Eastern Africa",
    globeFeatureId: "BDI",
    aliases: [
      "Burundi"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Burundi has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "cambodia",
    iso2: "KH",
    iso3: "KHM",
    displayName: "Cambodia",
    region: "Asia",
    subregion: "South-Eastern Asia",
    globeFeatureId: "KHM",
    aliases: [
      "Cambodia"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Cambodia has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "cameroon",
    iso2: "CM",
    iso3: "CMR",
    displayName: "Cameroon",
    region: "Africa",
    subregion: "Middle Africa",
    globeFeatureId: "CMR",
    aliases: [
      "Cameroon"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Cameroon has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "canada",
    iso2: "CA",
    iso3: "CAN",
    displayName: "Canada",
    region: "Americas",
    subregion: "Northern America",
    globeFeatureId: "CAN",
    aliases: [
      "Canada"
    ],
    dashboardStatus: "live",
    publicSummary: "Canada has a live dashboard orientation for licensed supply, education, signals, and international market routing."
  },
  {
    slug: "central-african-republic",
    iso2: "CF",
    iso3: "CAF",
    displayName: "Central African Republic",
    region: "Africa",
    subregion: "Middle Africa",
    globeFeatureId: "CAF",
    aliases: [
      "Central African Republic"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Central African Republic has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "chad",
    iso2: "TD",
    iso3: "TCD",
    displayName: "Chad",
    region: "Africa",
    subregion: "Middle Africa",
    globeFeatureId: "TCD",
    aliases: [
      "Chad"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Chad has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "chile",
    iso2: "CL",
    iso3: "CHL",
    displayName: "Chile",
    region: "Americas",
    subregion: "South America",
    globeFeatureId: "CHL",
    aliases: [
      "Chile"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Chile has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "china",
    iso2: "CN",
    iso3: "CHN",
    displayName: "China",
    region: "Asia",
    subregion: "Eastern Asia",
    globeFeatureId: "CHN",
    aliases: [
      "China"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "China has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "colombia",
    iso2: "CO",
    iso3: "COL",
    displayName: "Colombia",
    region: "Americas",
    subregion: "South America",
    globeFeatureId: "COL",
    aliases: [
      "Colombia"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Colombia has fallback-backed dashboard orientation with request-first opportunity and intelligence routing."
  },
  {
    slug: "costa-rica",
    iso2: "CR",
    iso3: "CRI",
    displayName: "Costa Rica",
    region: "Americas",
    subregion: "Central America",
    globeFeatureId: "CRI",
    aliases: [
      "Costa Rica"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Costa Rica has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "croatia",
    iso2: "HR",
    iso3: "HRV",
    displayName: "Croatia",
    region: "Europe",
    subregion: "Southern Europe",
    globeFeatureId: "HRV",
    aliases: [
      "Croatia"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Croatia has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "cuba",
    iso2: "CU",
    iso3: "CUB",
    displayName: "Cuba",
    region: "Americas",
    subregion: "Caribbean",
    globeFeatureId: "CUB",
    aliases: [
      "Cuba"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Cuba has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "cyprus",
    iso2: "CY",
    iso3: "CYP",
    displayName: "Cyprus",
    region: "Asia",
    subregion: "Western Asia",
    globeFeatureId: "CYP",
    aliases: [
      "Cyprus"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Cyprus has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "czechia",
    iso2: "CZ",
    iso3: "CZE",
    displayName: "Czechia",
    region: "Europe",
    subregion: "Eastern Europe",
    globeFeatureId: "CZE",
    aliases: [
      "Czechia",
      "Czech Republic"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Czechia has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "democratic-republic-of-the-congo",
    iso2: "CD",
    iso3: "COD",
    displayName: "Democratic Republic of the Congo",
    region: "Africa",
    subregion: "Middle Africa",
    globeFeatureId: "COD",
    aliases: [
      "Democratic Republic of the Congo",
      "DRC"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Democratic Republic of the Congo has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "denmark",
    iso2: "DK",
    iso3: "DNK",
    displayName: "Denmark",
    region: "Europe",
    subregion: "Northern Europe",
    globeFeatureId: "DNK",
    aliases: [
      "Denmark"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Denmark has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "djibouti",
    iso2: "DJ",
    iso3: "DJI",
    displayName: "Djibouti",
    region: "Africa",
    subregion: "Eastern Africa",
    globeFeatureId: "DJI",
    aliases: [
      "Djibouti"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Djibouti has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "dominican-republic",
    iso2: "DO",
    iso3: "DOM",
    displayName: "Dominican Republic",
    region: "Americas",
    subregion: "Caribbean",
    globeFeatureId: "DOM",
    aliases: [
      "Dominican Republic"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Dominican Republic has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "east-timor",
    iso2: "TL",
    iso3: "TLS",
    displayName: "East Timor",
    region: "Asia",
    subregion: "South-Eastern Asia",
    globeFeatureId: "TLS",
    aliases: [
      "East Timor"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "East Timor has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "ecuador",
    iso2: "EC",
    iso3: "ECU",
    displayName: "Ecuador",
    region: "Americas",
    subregion: "South America",
    globeFeatureId: "ECU",
    aliases: [
      "Ecuador"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Ecuador has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "egypt",
    iso2: "EG",
    iso3: "EGY",
    displayName: "Egypt",
    region: "Africa",
    subregion: "Northern Africa",
    globeFeatureId: "EGY",
    aliases: [
      "Egypt"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Egypt has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "el-salvador",
    iso2: "SV",
    iso3: "SLV",
    displayName: "El Salvador",
    region: "Americas",
    subregion: "Central America",
    globeFeatureId: "SLV",
    aliases: [
      "El Salvador"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "El Salvador has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "equatorial-guinea",
    iso2: "GQ",
    iso3: "GNQ",
    displayName: "Equatorial Guinea",
    region: "Africa",
    subregion: "Middle Africa",
    globeFeatureId: "GNQ",
    aliases: [
      "Equatorial Guinea"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Equatorial Guinea has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "eritrea",
    iso2: "ER",
    iso3: "ERI",
    displayName: "Eritrea",
    region: "Africa",
    subregion: "Eastern Africa",
    globeFeatureId: "ERI",
    aliases: [
      "Eritrea"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Eritrea has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "estonia",
    iso2: "EE",
    iso3: "EST",
    displayName: "Estonia",
    region: "Europe",
    subregion: "Northern Europe",
    globeFeatureId: "EST",
    aliases: [
      "Estonia"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Estonia has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "eswatini",
    iso2: "SZ",
    iso3: "SWZ",
    displayName: "eSwatini",
    region: "Africa",
    subregion: "Southern Africa",
    globeFeatureId: "SWZ",
    aliases: [
      "eSwatini"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "eSwatini has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "ethiopia",
    iso2: "ET",
    iso3: "ETH",
    displayName: "Ethiopia",
    region: "Africa",
    subregion: "Eastern Africa",
    globeFeatureId: "ETH",
    aliases: [
      "Ethiopia"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Ethiopia has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "falkland-islands",
    iso2: "FK",
    iso3: "FLK",
    displayName: "Falkland Islands",
    region: "Americas",
    subregion: "South America",
    globeFeatureId: "FLK",
    aliases: [
      "Falkland Islands"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Falkland Islands has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "fiji",
    iso2: "FJ",
    iso3: "FJI",
    displayName: "Fiji",
    region: "Oceania",
    subregion: "Melanesia",
    globeFeatureId: "FJI",
    aliases: [
      "Fiji"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Fiji has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "finland",
    iso2: "FI",
    iso3: "FIN",
    displayName: "Finland",
    region: "Europe",
    subregion: "Northern Europe",
    globeFeatureId: "FIN",
    aliases: [
      "Finland"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Finland has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "france",
    iso2: "F",
    iso3: "FRA",
    displayName: "France",
    region: "Europe",
    subregion: "Western Europe",
    globeFeatureId: "FRA",
    aliases: [
      "France"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "France has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "french-southern-and-antarctic-lands",
    iso2: "TF",
    iso3: "ATF",
    displayName: "French Southern and Antarctic Lands",
    region: "Africa",
    subregion: "Seven seas (open ocean)",
    globeFeatureId: "ATF",
    aliases: [
      "French Southern and Antarctic Lands"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "French Southern and Antarctic Lands has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "gabon",
    iso2: "GA",
    iso3: "GAB",
    displayName: "Gabon",
    region: "Africa",
    subregion: "Middle Africa",
    globeFeatureId: "GAB",
    aliases: [
      "Gabon"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Gabon has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "gambia",
    iso2: "GM",
    iso3: "GMB",
    displayName: "Gambia",
    region: "Africa",
    subregion: "Western Africa",
    globeFeatureId: "GMB",
    aliases: [
      "Gambia"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Gambia has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "georgia",
    iso2: "GE",
    iso3: "GEO",
    displayName: "Georgia",
    region: "Asia",
    subregion: "Western Asia",
    globeFeatureId: "GEO",
    aliases: [
      "Georgia"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Georgia has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "germany",
    iso2: "DE",
    iso3: "DEU",
    displayName: "Germany",
    region: "Europe",
    subregion: "Western Europe",
    globeFeatureId: "DEU",
    aliases: [
      "Germany"
    ],
    dashboardStatus: "live",
    publicSummary: "Germany has a live market dashboard orientation for regulated medical pathways, import posture, signal monitoring, and reviewed connection readiness."
  },
  {
    slug: "ghana",
    iso2: "GH",
    iso3: "GHA",
    displayName: "Ghana",
    region: "Africa",
    subregion: "Western Africa",
    globeFeatureId: "GHA",
    aliases: [
      "Ghana"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Ghana has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "greece",
    iso2: "GR",
    iso3: "GRC",
    displayName: "Greece",
    region: "Europe",
    subregion: "Southern Europe",
    globeFeatureId: "GRC",
    aliases: [
      "Greece"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Greece has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "greenland",
    iso2: "GL",
    iso3: "GRL",
    displayName: "Greenland",
    region: "Americas",
    subregion: "Northern America",
    globeFeatureId: "GRL",
    aliases: [
      "Greenland"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Greenland has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "guatemala",
    iso2: "GT",
    iso3: "GTM",
    displayName: "Guatemala",
    region: "Americas",
    subregion: "Central America",
    globeFeatureId: "GTM",
    aliases: [
      "Guatemala"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Guatemala has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "guinea",
    iso2: "GN",
    iso3: "GIN",
    displayName: "Guinea",
    region: "Africa",
    subregion: "Western Africa",
    globeFeatureId: "GIN",
    aliases: [
      "Guinea"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Guinea has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "guinea-bissau",
    iso2: "GW",
    iso3: "GNB",
    displayName: "Guinea-Bissau",
    region: "Africa",
    subregion: "Western Africa",
    globeFeatureId: "GNB",
    aliases: [
      "Guinea-Bissau"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Guinea-Bissau has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "guyana",
    iso2: "GY",
    iso3: "GUY",
    displayName: "Guyana",
    region: "Americas",
    subregion: "South America",
    globeFeatureId: "GUY",
    aliases: [
      "Guyana"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Guyana has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "haiti",
    iso2: "HT",
    iso3: "HTI",
    displayName: "Haiti",
    region: "Americas",
    subregion: "Caribbean",
    globeFeatureId: "HTI",
    aliases: [
      "Haiti"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Haiti has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "honduras",
    iso2: "HN",
    iso3: "HND",
    displayName: "Honduras",
    region: "Americas",
    subregion: "Central America",
    globeFeatureId: "HND",
    aliases: [
      "Honduras"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Honduras has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "hong-kong",
    iso2: "XK",
    iso3: "HON",
    displayName: "Hong Kong",
    region: "Asia",
    subregion: "Eastern Asia",
    globeFeatureId: "hong-kong",
    aliases: [
      "Hong Kong"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Hong Kong has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "hungary",
    iso2: "HU",
    iso3: "HUN",
    displayName: "Hungary",
    region: "Europe",
    subregion: "Eastern Europe",
    globeFeatureId: "HUN",
    aliases: [
      "Hungary"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Hungary has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "iceland",
    iso2: "IS",
    iso3: "ISL",
    displayName: "Iceland",
    region: "Europe",
    subregion: "Northern Europe",
    globeFeatureId: "ISL",
    aliases: [
      "Iceland"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Iceland has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "india",
    iso2: "IN",
    iso3: "IND",
    displayName: "India",
    region: "Asia",
    subregion: "Southern Asia",
    globeFeatureId: "IND",
    aliases: [
      "India"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "India has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "indonesia",
    iso2: "ID",
    iso3: "IDN",
    displayName: "Indonesia",
    region: "Asia",
    subregion: "South-Eastern Asia",
    globeFeatureId: "IDN",
    aliases: [
      "Indonesia"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Indonesia has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "iran",
    iso2: "IR",
    iso3: "IRN",
    displayName: "Iran",
    region: "Asia",
    subregion: "Southern Asia",
    globeFeatureId: "IRN",
    aliases: [
      "Iran",
      "Islamic Republic of Iran"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Iran has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "iraq",
    iso2: "IQ",
    iso3: "IRQ",
    displayName: "Iraq",
    region: "Asia",
    subregion: "Western Asia",
    globeFeatureId: "IRQ",
    aliases: [
      "Iraq"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Iraq has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "ireland",
    iso2: "IE",
    iso3: "IRL",
    displayName: "Ireland",
    region: "Europe",
    subregion: "Northern Europe",
    globeFeatureId: "IRL",
    aliases: [
      "Ireland"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Ireland has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "israel",
    iso2: "IL",
    iso3: "ISR",
    displayName: "Israel",
    region: "Asia",
    subregion: "Western Asia",
    globeFeatureId: "ISR",
    aliases: [
      "Israel"
    ],
    dashboardStatus: "unavailable",
    publicSummary: "Israel currently shows unavailable dashboard panels with a confidential review request path."
  },
  {
    slug: "italy",
    iso2: "IT",
    iso3: "ITA",
    displayName: "Italy",
    region: "Europe",
    subregion: "Southern Europe",
    globeFeatureId: "ITA",
    aliases: [
      "Italy"
    ],
    dashboardStatus: "partial",
    publicSummary: "Italy has a partial dashboard with market, education, and compliance orientation while live source review remains in progress."
  },
  {
    slug: "cote-divoire",
    iso2: "CI",
    iso3: "CIV",
    displayName: "Ivory Coast",
    region: "Africa",
    subregion: "Western Africa",
    globeFeatureId: "CIV",
    aliases: [
      "Côte d’Ivoire",
      "Côte d'Ivoire",
      "Ivory Coast"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Ivory Coast has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "jamaica",
    iso2: "JM",
    iso3: "JAM",
    displayName: "Jamaica",
    region: "Americas",
    subregion: "Caribbean",
    globeFeatureId: "JAM",
    aliases: [
      "Jamaica"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Jamaica has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "japan",
    iso2: "JP",
    iso3: "JPN",
    displayName: "Japan",
    region: "Asia",
    subregion: "Eastern Asia",
    globeFeatureId: "JPN",
    aliases: [
      "Japan"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Japan has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "jordan",
    iso2: "JO",
    iso3: "JOR",
    displayName: "Jordan",
    region: "Asia",
    subregion: "Western Asia",
    globeFeatureId: "JOR",
    aliases: [
      "Jordan"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Jordan has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "kazakhstan",
    iso2: "KZ",
    iso3: "KAZ",
    displayName: "Kazakhstan",
    region: "Asia",
    subregion: "Central Asia",
    globeFeatureId: "KAZ",
    aliases: [
      "Kazakhstan"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Kazakhstan has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "kenya",
    iso2: "KE",
    iso3: "KEN",
    displayName: "Kenya",
    region: "Africa",
    subregion: "Eastern Africa",
    globeFeatureId: "KEN",
    aliases: [
      "Kenya"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Kenya has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "kosovo",
    iso2: "KO",
    iso3: "KOS",
    displayName: "Kosovo",
    region: "Europe",
    subregion: "Southern Europe",
    globeFeatureId: "KOS",
    aliases: [
      "Kosovo"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Kosovo has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "kuwait",
    iso2: "KW",
    iso3: "KWT",
    displayName: "Kuwait",
    region: "Asia",
    subregion: "Western Asia",
    globeFeatureId: "KWT",
    aliases: [
      "Kuwait"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Kuwait has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "kyrgyzstan",
    iso2: "KG",
    iso3: "KGZ",
    displayName: "Kyrgyzstan",
    region: "Asia",
    subregion: "Central Asia",
    globeFeatureId: "KGZ",
    aliases: [
      "Kyrgyzstan"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Kyrgyzstan has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "laos",
    iso2: "LA",
    iso3: "LAO",
    displayName: "Laos",
    region: "Asia",
    subregion: "South-Eastern Asia",
    globeFeatureId: "LAO",
    aliases: [
      "Laos",
      "Lao PDR"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Laos has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "latvia",
    iso2: "LV",
    iso3: "LVA",
    displayName: "Latvia",
    region: "Europe",
    subregion: "Northern Europe",
    globeFeatureId: "LVA",
    aliases: [
      "Latvia"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Latvia has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "lebanon",
    iso2: "LB",
    iso3: "LBN",
    displayName: "Lebanon",
    region: "Asia",
    subregion: "Western Asia",
    globeFeatureId: "LBN",
    aliases: [
      "Lebanon"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Lebanon has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "lesotho",
    iso2: "LS",
    iso3: "LSO",
    displayName: "Lesotho",
    region: "Africa",
    subregion: "Southern Africa",
    globeFeatureId: "LSO",
    aliases: [
      "Lesotho"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Lesotho has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "liberia",
    iso2: "LR",
    iso3: "LBR",
    displayName: "Liberia",
    region: "Africa",
    subregion: "Western Africa",
    globeFeatureId: "LBR",
    aliases: [
      "Liberia"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Liberia has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "libya",
    iso2: "LY",
    iso3: "LBY",
    displayName: "Libya",
    region: "Africa",
    subregion: "Northern Africa",
    globeFeatureId: "LBY",
    aliases: [
      "Libya"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Libya has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "lithuania",
    iso2: "LT",
    iso3: "LTU",
    displayName: "Lithuania",
    region: "Europe",
    subregion: "Northern Europe",
    globeFeatureId: "LTU",
    aliases: [
      "Lithuania"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Lithuania has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "luxembourg",
    iso2: "LU",
    iso3: "LUX",
    displayName: "Luxembourg",
    region: "Europe",
    subregion: "Western Europe",
    globeFeatureId: "LUX",
    aliases: [
      "Luxembourg"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Luxembourg has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "macau",
    iso2: "XK",
    iso3: "MAC",
    displayName: "Macau",
    region: "Asia",
    subregion: "Eastern Asia",
    globeFeatureId: "macau",
    aliases: [
      "Macau"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Macau has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "madagascar",
    iso2: "MG",
    iso3: "MDG",
    displayName: "Madagascar",
    region: "Africa",
    subregion: "Eastern Africa",
    globeFeatureId: "MDG",
    aliases: [
      "Madagascar"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Madagascar has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "malawi",
    iso2: "MW",
    iso3: "MWI",
    displayName: "Malawi",
    region: "Africa",
    subregion: "Eastern Africa",
    globeFeatureId: "MWI",
    aliases: [
      "Malawi"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Malawi has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "malaysia",
    iso2: "MY",
    iso3: "MYS",
    displayName: "Malaysia",
    region: "Asia",
    subregion: "South-Eastern Asia",
    globeFeatureId: "MYS",
    aliases: [
      "Malaysia"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Malaysia has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "mali",
    iso2: "ML",
    iso3: "MLI",
    displayName: "Mali",
    region: "Africa",
    subregion: "Western Africa",
    globeFeatureId: "MLI",
    aliases: [
      "Mali"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Mali has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "mauritania",
    iso2: "MR",
    iso3: "MRT",
    displayName: "Mauritania",
    region: "Africa",
    subregion: "Western Africa",
    globeFeatureId: "MRT",
    aliases: [
      "Mauritania"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Mauritania has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "mexico",
    iso2: "MX",
    iso3: "MEX",
    displayName: "Mexico",
    region: "Americas",
    subregion: "Central America",
    globeFeatureId: "MEX",
    aliases: [
      "Mexico"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Mexico has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "moldova",
    iso2: "MD",
    iso3: "MDA",
    displayName: "Moldova",
    region: "Europe",
    subregion: "Eastern Europe",
    globeFeatureId: "MDA",
    aliases: [
      "Moldova",
      "Republic of Moldova"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Moldova has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "mongolia",
    iso2: "MN",
    iso3: "MNG",
    displayName: "Mongolia",
    region: "Asia",
    subregion: "Eastern Asia",
    globeFeatureId: "MNG",
    aliases: [
      "Mongolia"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Mongolia has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "montenegro",
    iso2: "ME",
    iso3: "MNE",
    displayName: "Montenegro",
    region: "Europe",
    subregion: "Southern Europe",
    globeFeatureId: "MNE",
    aliases: [
      "Montenegro"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Montenegro has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "morocco",
    iso2: "MA",
    iso3: "MAR",
    displayName: "Morocco",
    region: "Africa",
    subregion: "Northern Africa",
    globeFeatureId: "MAR",
    aliases: [
      "Morocco"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Morocco has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "mozambique",
    iso2: "MZ",
    iso3: "MOZ",
    displayName: "Mozambique",
    region: "Africa",
    subregion: "Eastern Africa",
    globeFeatureId: "MOZ",
    aliases: [
      "Mozambique"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Mozambique has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "myanmar",
    iso2: "MM",
    iso3: "MMR",
    displayName: "Myanmar",
    region: "Asia",
    subregion: "South-Eastern Asia",
    globeFeatureId: "MMR",
    aliases: [
      "Myanmar"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Myanmar has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "namibia",
    iso2: "NA",
    iso3: "NAM",
    displayName: "Namibia",
    region: "Africa",
    subregion: "Southern Africa",
    globeFeatureId: "NAM",
    aliases: [
      "Namibia"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Namibia has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "nepal",
    iso2: "NP",
    iso3: "NPL",
    displayName: "Nepal",
    region: "Asia",
    subregion: "Southern Asia",
    globeFeatureId: "NPL",
    aliases: [
      "Nepal"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Nepal has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "netherlands",
    iso2: "NL",
    iso3: "NLD",
    displayName: "Netherlands",
    region: "Europe",
    subregion: "Western Europe",
    globeFeatureId: "NLD",
    aliases: [
      "Netherlands",
      "Holland"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Netherlands has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "new-caledonia",
    iso2: "NC",
    iso3: "NCL",
    displayName: "New Caledonia",
    region: "Oceania",
    subregion: "Melanesia",
    globeFeatureId: "NCL",
    aliases: [
      "New Caledonia"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "New Caledonia has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "new-zealand",
    iso2: "NZ",
    iso3: "NZL",
    displayName: "New Zealand",
    region: "Oceania",
    subregion: "Australia and New Zealand",
    globeFeatureId: "NZL",
    aliases: [
      "New Zealand"
    ],
    dashboardStatus: "request-only",
    publicSummary: "New Zealand is available for confidential review requests and directional market orientation."
  },
  {
    slug: "nicaragua",
    iso2: "NI",
    iso3: "NIC",
    displayName: "Nicaragua",
    region: "Americas",
    subregion: "Central America",
    globeFeatureId: "NIC",
    aliases: [
      "Nicaragua"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Nicaragua has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "niger",
    iso2: "NE",
    iso3: "NER",
    displayName: "Niger",
    region: "Africa",
    subregion: "Western Africa",
    globeFeatureId: "NER",
    aliases: [
      "Niger"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Niger has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "nigeria",
    iso2: "NG",
    iso3: "NGA",
    displayName: "Nigeria",
    region: "Africa",
    subregion: "Western Africa",
    globeFeatureId: "NGA",
    aliases: [
      "Nigeria"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Nigeria has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "north-korea",
    iso2: "KP",
    iso3: "PRK",
    displayName: "North Korea",
    region: "Asia",
    subregion: "Eastern Asia",
    globeFeatureId: "PRK",
    aliases: [
      "North Korea",
      "DPRK"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "North Korea has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "north-macedonia",
    iso2: "MK",
    iso3: "MKD",
    displayName: "North Macedonia",
    region: "Europe",
    subregion: "Southern Europe",
    globeFeatureId: "MKD",
    aliases: [
      "North Macedonia"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "North Macedonia has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "northern-cyprus",
    iso2: "CN",
    iso3: "CYN",
    displayName: "Northern Cyprus",
    region: "Asia",
    subregion: "Western Asia",
    globeFeatureId: "CYN",
    aliases: [
      "Northern Cyprus"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Northern Cyprus has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "norway",
    iso2: "N",
    iso3: "NOR",
    displayName: "Norway",
    region: "Europe",
    subregion: "Northern Europe",
    globeFeatureId: "NOR",
    aliases: [
      "Norway"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Norway has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "oman",
    iso2: "OM",
    iso3: "OMN",
    displayName: "Oman",
    region: "Asia",
    subregion: "Western Asia",
    globeFeatureId: "OMN",
    aliases: [
      "Oman"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Oman has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "pakistan",
    iso2: "PK",
    iso3: "PAK",
    displayName: "Pakistan",
    region: "Asia",
    subregion: "Southern Asia",
    globeFeatureId: "PAK",
    aliases: [
      "Pakistan"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Pakistan has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "palestine",
    iso2: "PS",
    iso3: "PSE",
    displayName: "Palestine",
    region: "Asia",
    subregion: "Western Asia",
    globeFeatureId: "PSX",
    aliases: [
      "Palestine",
      "Palestinian Territory"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Palestine has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "panama",
    iso2: "PA",
    iso3: "PAN",
    displayName: "Panama",
    region: "Americas",
    subregion: "Central America",
    globeFeatureId: "PAN",
    aliases: [
      "Panama"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Panama has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "papua-new-guinea",
    iso2: "PG",
    iso3: "PNG",
    displayName: "Papua New Guinea",
    region: "Oceania",
    subregion: "Melanesia",
    globeFeatureId: "PNG",
    aliases: [
      "Papua New Guinea"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Papua New Guinea has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "paraguay",
    iso2: "PY",
    iso3: "PRY",
    displayName: "Paraguay",
    region: "Americas",
    subregion: "South America",
    globeFeatureId: "PRY",
    aliases: [
      "Paraguay"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Paraguay has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "peru",
    iso2: "PE",
    iso3: "PER",
    displayName: "Peru",
    region: "Americas",
    subregion: "South America",
    globeFeatureId: "PER",
    aliases: [
      "Peru"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Peru has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "philippines",
    iso2: "PH",
    iso3: "PHL",
    displayName: "Philippines",
    region: "Asia",
    subregion: "South-Eastern Asia",
    globeFeatureId: "PHL",
    aliases: [
      "Philippines"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Philippines has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "poland",
    iso2: "PL",
    iso3: "POL",
    displayName: "Poland",
    region: "Europe",
    subregion: "Eastern Europe",
    globeFeatureId: "POL",
    aliases: [
      "Poland"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Poland has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "portugal",
    iso2: "PT",
    iso3: "PRT",
    displayName: "Portugal",
    region: "Europe",
    subregion: "Southern Europe",
    globeFeatureId: "PRT",
    aliases: [
      "Portugal"
    ],
    dashboardStatus: "review-required",
    publicSummary: "Portugal requires review before relying on dashboard content for routed market or compliance decisions."
  },
  {
    slug: "puerto-rico",
    iso2: "PR",
    iso3: "PRI",
    displayName: "Puerto Rico",
    region: "Americas",
    subregion: "Caribbean",
    globeFeatureId: "PRI",
    aliases: [
      "Puerto Rico"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Puerto Rico has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "qatar",
    iso2: "QA",
    iso3: "QAT",
    displayName: "Qatar",
    region: "Asia",
    subregion: "Western Asia",
    globeFeatureId: "QAT",
    aliases: [
      "Qatar"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Qatar has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "republic-of-the-congo",
    iso2: "CG",
    iso3: "COG",
    displayName: "Republic of the Congo",
    region: "Africa",
    subregion: "Middle Africa",
    globeFeatureId: "COG",
    aliases: [
      "Congo",
      "Republic of the Congo"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Republic of the Congo has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "romania",
    iso2: "RO",
    iso3: "ROU",
    displayName: "Romania",
    region: "Europe",
    subregion: "Eastern Europe",
    globeFeatureId: "ROU",
    aliases: [
      "Romania"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Romania has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "russia",
    iso2: "RU",
    iso3: "RUS",
    displayName: "Russia",
    region: "Europe",
    subregion: "Eastern Europe",
    globeFeatureId: "RUS",
    aliases: [
      "Russia",
      "Russian Federation"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Russia has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "rwanda",
    iso2: "RW",
    iso3: "RWA",
    displayName: "Rwanda",
    region: "Africa",
    subregion: "Eastern Africa",
    globeFeatureId: "RWA",
    aliases: [
      "Rwanda"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Rwanda has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "saudi-arabia",
    iso2: "SA",
    iso3: "SAU",
    displayName: "Saudi Arabia",
    region: "Asia",
    subregion: "Western Asia",
    globeFeatureId: "SAU",
    aliases: [
      "Saudi Arabia"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Saudi Arabia has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "senegal",
    iso2: "SN",
    iso3: "SEN",
    displayName: "Senegal",
    region: "Africa",
    subregion: "Western Africa",
    globeFeatureId: "SEN",
    aliases: [
      "Senegal"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Senegal has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "serbia",
    iso2: "RS",
    iso3: "SRB",
    displayName: "Serbia",
    region: "Europe",
    subregion: "Southern Europe",
    globeFeatureId: "SRB",
    aliases: [
      "Serbia"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Serbia has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "sierra-leone",
    iso2: "SL",
    iso3: "SLE",
    displayName: "Sierra Leone",
    region: "Africa",
    subregion: "Western Africa",
    globeFeatureId: "SLE",
    aliases: [
      "Sierra Leone"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Sierra Leone has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "slovakia",
    iso2: "SK",
    iso3: "SVK",
    displayName: "Slovakia",
    region: "Europe",
    subregion: "Eastern Europe",
    globeFeatureId: "SVK",
    aliases: [
      "Slovakia"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Slovakia has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "slovenia",
    iso2: "SI",
    iso3: "SVN",
    displayName: "Slovenia",
    region: "Europe",
    subregion: "Southern Europe",
    globeFeatureId: "SVN",
    aliases: [
      "Slovenia"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Slovenia has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "solomon-islands",
    iso2: "SB",
    iso3: "SLB",
    displayName: "Solomon Islands",
    region: "Oceania",
    subregion: "Melanesia",
    globeFeatureId: "SLB",
    aliases: [
      "Solomon Islands"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Solomon Islands has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "somalia",
    iso2: "SO",
    iso3: "SOM",
    displayName: "Somalia",
    region: "Africa",
    subregion: "Eastern Africa",
    globeFeatureId: "SOM",
    aliases: [
      "Somalia"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Somalia has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "somaliland",
    iso2: "SL",
    iso3: "SOL",
    displayName: "Somaliland",
    region: "Africa",
    subregion: "Eastern Africa",
    globeFeatureId: "SOL",
    aliases: [
      "Somaliland"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Somaliland has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "south-africa",
    iso2: "ZA",
    iso3: "ZAF",
    displayName: "South Africa",
    region: "Africa",
    subregion: "Southern Africa",
    globeFeatureId: "ZAF",
    aliases: [
      "South Africa"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "South Africa has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "south-korea",
    iso2: "KR",
    iso3: "KOR",
    displayName: "South Korea",
    region: "Asia",
    subregion: "Eastern Asia",
    globeFeatureId: "KOR",
    aliases: [
      "South Korea",
      "Republic of Korea"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "South Korea has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "south-sudan",
    iso2: "SS",
    iso3: "SSD",
    displayName: "South Sudan",
    region: "Africa",
    subregion: "Eastern Africa",
    globeFeatureId: "SDS",
    aliases: [
      "South Sudan"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "South Sudan has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "spain",
    iso2: "ES",
    iso3: "ESP",
    displayName: "Spain",
    region: "Europe",
    subregion: "Southern Europe",
    globeFeatureId: "ESP",
    aliases: [
      "Spain"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Spain has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "sri-lanka",
    iso2: "LK",
    iso3: "LKA",
    displayName: "Sri Lanka",
    region: "Asia",
    subregion: "Southern Asia",
    globeFeatureId: "LKA",
    aliases: [
      "Sri Lanka"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Sri Lanka has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "sudan",
    iso2: "SD",
    iso3: "SDN",
    displayName: "Sudan",
    region: "Africa",
    subregion: "Northern Africa",
    globeFeatureId: "SDN",
    aliases: [
      "Sudan"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Sudan has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "suriname",
    iso2: "SR",
    iso3: "SUR",
    displayName: "Suriname",
    region: "Americas",
    subregion: "South America",
    globeFeatureId: "SUR",
    aliases: [
      "Suriname"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Suriname has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "sweden",
    iso2: "SE",
    iso3: "SWE",
    displayName: "Sweden",
    region: "Europe",
    subregion: "Northern Europe",
    globeFeatureId: "SWE",
    aliases: [
      "Sweden"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Sweden has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "switzerland",
    iso2: "CH",
    iso3: "CHE",
    displayName: "Switzerland",
    region: "Europe",
    subregion: "Western Europe",
    globeFeatureId: "CHE",
    aliases: [
      "Switzerland"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Switzerland has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "syria",
    iso2: "SY",
    iso3: "SYR",
    displayName: "Syria",
    region: "Asia",
    subregion: "Western Asia",
    globeFeatureId: "SYR",
    aliases: [
      "Syria",
      "Syrian Arab Republic"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Syria has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "taiwan",
    iso2: "CN-TW",
    iso3: "TWN",
    displayName: "Taiwan",
    region: "Asia",
    subregion: "Eastern Asia",
    globeFeatureId: "TWN",
    aliases: [
      "Taiwan"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Taiwan has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "tajikistan",
    iso2: "TJ",
    iso3: "TJK",
    displayName: "Tajikistan",
    region: "Asia",
    subregion: "Central Asia",
    globeFeatureId: "TJK",
    aliases: [
      "Tajikistan"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Tajikistan has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "tanzania",
    iso2: "TZ",
    iso3: "TZA",
    displayName: "Tanzania",
    region: "Africa",
    subregion: "Eastern Africa",
    globeFeatureId: "TZA",
    aliases: [
      "Tanzania",
      "United Republic of Tanzania"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Tanzania has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "thailand",
    iso2: "TH",
    iso3: "THA",
    displayName: "Thailand",
    region: "Asia",
    subregion: "South-Eastern Asia",
    globeFeatureId: "THA",
    aliases: [
      "Thailand"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Thailand has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "the-bahamas",
    iso2: "BS",
    iso3: "BHS",
    displayName: "The Bahamas",
    region: "Americas",
    subregion: "Caribbean",
    globeFeatureId: "BHS",
    aliases: [
      "The Bahamas"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "The Bahamas has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "togo",
    iso2: "TG",
    iso3: "TGO",
    displayName: "Togo",
    region: "Africa",
    subregion: "Western Africa",
    globeFeatureId: "TGO",
    aliases: [
      "Togo"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Togo has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "trinidad-and-tobago",
    iso2: "TT",
    iso3: "TTO",
    displayName: "Trinidad and Tobago",
    region: "Americas",
    subregion: "Caribbean",
    globeFeatureId: "TTO",
    aliases: [
      "Trinidad and Tobago"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Trinidad and Tobago has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "tunisia",
    iso2: "TN",
    iso3: "TUN",
    displayName: "Tunisia",
    region: "Africa",
    subregion: "Northern Africa",
    globeFeatureId: "TUN",
    aliases: [
      "Tunisia"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Tunisia has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "turkey",
    iso2: "TR",
    iso3: "TUR",
    displayName: "Turkey",
    region: "Asia",
    subregion: "Western Asia",
    globeFeatureId: "TUR",
    aliases: [
      "Turkey"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Turkey has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "turkiye",
    iso2: "XK",
    iso3: "TUR",
    displayName: "Türkiye",
    region: "Unassigned",
    subregion: "Unassigned",
    globeFeatureId: "turkiye",
    aliases: [
      "Türkiye",
      "Turkey"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Türkiye has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "turkmenistan",
    iso2: "TM",
    iso3: "TKM",
    displayName: "Turkmenistan",
    region: "Asia",
    subregion: "Central Asia",
    globeFeatureId: "TKM",
    aliases: [
      "Turkmenistan"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Turkmenistan has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "uganda",
    iso2: "UG",
    iso3: "UGA",
    displayName: "Uganda",
    region: "Africa",
    subregion: "Eastern Africa",
    globeFeatureId: "UGA",
    aliases: [
      "Uganda"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Uganda has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "ukraine",
    iso2: "UA",
    iso3: "UKR",
    displayName: "Ukraine",
    region: "Europe",
    subregion: "Eastern Europe",
    globeFeatureId: "UKR",
    aliases: [
      "Ukraine"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Ukraine has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "united-arab-emirates",
    iso2: "AE",
    iso3: "ARE",
    displayName: "United Arab Emirates",
    region: "Asia",
    subregion: "Western Asia",
    globeFeatureId: "ARE",
    aliases: [
      "United Arab Emirates"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "United Arab Emirates has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "united-kingdom",
    iso2: "GB",
    iso3: "GBR",
    displayName: "United Kingdom",
    region: "Europe",
    subregion: "Northern Europe",
    globeFeatureId: "GBR",
    aliases: [
      "United Kingdom",
      "UK",
      "Great Britain"
    ],
    dashboardStatus: "partial",
    publicSummary: "United Kingdom has a partial dashboard covering medical market posture, compliance orientation, and signal monitoring."
  },
  {
    slug: "united-states",
    iso2: "US",
    iso3: "USA",
    displayName: "United States",
    region: "Americas",
    subregion: "Northern America",
    globeFeatureId: "USA",
    aliases: [
      "United States",
      "United States of America",
      "USA",
      "US"
    ],
    dashboardStatus: "live",
    publicSummary: "United States has a live dashboard orientation with jurisdiction-aware routing boundaries and public-safe market summaries."
  },
  {
    slug: "uruguay",
    iso2: "UY",
    iso3: "URY",
    displayName: "Uruguay",
    region: "Americas",
    subregion: "South America",
    globeFeatureId: "URY",
    aliases: [
      "Uruguay"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Uruguay has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "uzbekistan",
    iso2: "UZ",
    iso3: "UZB",
    displayName: "Uzbekistan",
    region: "Asia",
    subregion: "Central Asia",
    globeFeatureId: "UZB",
    aliases: [
      "Uzbekistan"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Uzbekistan has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "vanuatu",
    iso2: "VU",
    iso3: "VUT",
    displayName: "Vanuatu",
    region: "Oceania",
    subregion: "Melanesia",
    globeFeatureId: "VUT",
    aliases: [
      "Vanuatu"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Vanuatu has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "venezuela",
    iso2: "VE",
    iso3: "VEN",
    displayName: "Venezuela",
    region: "Americas",
    subregion: "South America",
    globeFeatureId: "VEN",
    aliases: [
      "Venezuela",
      "Bolivarian Republic of Venezuela"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Venezuela has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "vietnam",
    iso2: "VN",
    iso3: "VNM",
    displayName: "Vietnam",
    region: "Asia",
    subregion: "South-Eastern Asia",
    globeFeatureId: "VNM",
    aliases: [
      "Vietnam",
      "Viet Nam"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Vietnam has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "western-sahara",
    iso2: "EH",
    iso3: "ESH",
    displayName: "Western Sahara",
    region: "Africa",
    subregion: "Northern Africa",
    globeFeatureId: "SAH",
    aliases: [
      "Western Sahara"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Western Sahara has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "yemen",
    iso2: "YE",
    iso3: "YEM",
    displayName: "Yemen",
    region: "Asia",
    subregion: "Western Asia",
    globeFeatureId: "YEM",
    aliases: [
      "Yemen"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Yemen has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "zambia",
    iso2: "ZM",
    iso3: "ZMB",
    displayName: "Zambia",
    region: "Africa",
    subregion: "Eastern Africa",
    globeFeatureId: "ZMB",
    aliases: [
      "Zambia"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Zambia has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  },
  {
    slug: "zimbabwe",
    iso2: "ZW",
    iso3: "ZWE",
    displayName: "Zimbabwe",
    region: "Africa",
    subregion: "Eastern Africa",
    globeFeatureId: "ZWE",
    aliases: [
      "Zimbabwe"
    ],
    dashboardStatus: "fallback-backed",
    publicSummary: "Zimbabwe has a dashboard-safe default record for country routing, directory discovery, and confidential review requests."
  }
]

export const countries: CountryDashboardSummary[] = countrySeeds.map((seed) => {
  const panels = Object.fromEntries(
    dashboardSections.map((section) => [section, makePanel(seed.slug, section, panelStateFor(section, seed.dashboardStatus), seed.displayName)]),
  ) as CountryDashboardSummary['panels']

  return {
    ...seed,
    dashboardPath: getDashboardCountryHref(seed.slug),
    defaultDashboardSection: 'market',
    routeAvailability: {
      overview: availableStates.has(seed.dashboardStatus),
      market: availableStates.has(panels.market.state),
      education: availableStates.has(panels.education.state),
      compliance: availableStates.has(panels.compliance.state),
      signals: availableStates.has(panels.signals.state),
      opportunities: availableStates.has(panels.opportunities.state),
      intelligence: availableStates.has(panels.intelligence.state),
      connections: availableStates.has(panels.connections.state),
    },
    lastUpdated: '2026-05-28',
    statusBadge: {
      label: statusLabels[seed.dashboardStatus],
      state: seed.dashboardStatus,
      tone: seed.dashboardStatus === 'live' ? 'green' : seed.dashboardStatus === 'unavailable' ? 'red' : 'gold',
    },
    panels,
    fixtureLevel: ['germany', 'italy', 'new-zealand', 'canada', 'united-states', 'united-kingdom', 'portugal', 'australia', 'colombia', 'israel'].includes(seed.slug)
      ? 'rich-fixture'
      : 'dashboard-safe-default',
  }
})

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const bySlug = new Map(countries.map((country) => [country.slug, country]))
const byIso2 = new Map(countries.map((country) => [country.iso2.toLowerCase(), country]))
const byIso3 = new Map(countries.map((country) => [country.iso3.toLowerCase(), country]))
const byAlias = new Map<string, CountryDashboardSummary>()
for (const country of countries) {
  byAlias.set(normalize(country.displayName), country)
  for (const alias of country.aliases) byAlias.set(normalize(alias), country)
}

export function getCountryBySlug(slug?: string | null) {
  return slug ? bySlug.get(normalize(slug)) ?? null : null
}

export function getCountryByIso2(iso2?: string | null) {
  return iso2 ? byIso2.get(iso2.toLowerCase()) ?? null : null
}

export function getCountryByIso3(iso3?: string | null) {
  return iso3 ? byIso3.get(iso3.toLowerCase()) ?? null : null
}

export function getCountryByAlias(alias?: string | null) {
  return alias ? byAlias.get(normalize(alias)) ?? null : null
}

export function resolveCountryRouteParam(value?: string | null) {
  return getCountryBySlug(value) ?? getCountryByIso2(value) ?? getCountryByIso3(value) ?? getCountryByAlias(value)
}

export function isDashboardCountryAvailable(slug: string) {
  const country = getCountryBySlug(slug)
  return Boolean(country && availableStates.has(country.dashboardStatus))
}

export function getDashboardSafeUnresolvedCountry(name: string) {
  return {
    reason: 'unresolved-country',
    name,
    dashboardPath: '/dashboard',
    routeAvailability: 'unavailable' as const,
    actionLabel: 'Browse country directory',
  }
}

export function serializePublicCountryDashboard(country: CountryDashboardSummary): PublicCountryDashboardDto {
  return {
    countryName: country.displayName,
    slug: country.slug,
    iso2: country.iso2,
    iso3: country.iso3,
    region: country.region,
    subregion: country.subregion,
    publicSummary: country.publicSummary,
    dashboardStatusLabel: country.statusBadge.label,
    dashboardStatus: country.dashboardStatus,
    routeAvailability: country.routeAvailability,
    lastUpdatedLabel: 'Updated May 28, 2026',
    panels: Object.fromEntries(
      dashboardSections.map((section) => [
        section,
        {
          state: country.panels[section].state,
          title: country.panels[section].title,
          summary: country.panels[section].summary,
          statusLabel: country.panels[section].statusLabel,
          emptyState: country.panels[section].emptyState,
          routeHref: getDashboardSectionHref(country.slug, section),
          requestReviewHref: `/contact?country=${country.slug}&intent=dashboard-review`,
        },
      ]),
    ) as PublicCountryDashboardDto['panels'],
    actions: [
      { label: 'View Country Dashboard', href: country.dashboardPath, intent: 'primary' },
      { label: 'Request Confidential Review', href: `/contact?country=${country.slug}&intent=dashboard-review`, intent: 'review' },
      { label: 'Back to Globe', href: '/', intent: 'globe' },
    ],
  }
}
