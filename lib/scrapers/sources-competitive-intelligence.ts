// lib/scrapers/sources-competitive-intelligence.ts
// New regulatory and marketplace sources identified via live competitive intelligence scan.
// Sources verified as active as of 2026-07-29.
//
// To activate: import and merge into lib/scrapers/sources.ts

import type { ScraperSource } from './types'

export const competitiveIntelligenceSources: ScraperSource[] = [
  // === GERMANY — BfArM Cannabis Cultivation Agreements ===
  {
    id: 'germany-bfarm-cultivation',
    name: 'BfArM Cannabis Anbauvereinbarungen',
    url: 'https://www.bfarm.de/EN/Cannabis/_node.html',
    searchUrl: 'https://www.bfarm.de/EN/Cannabis/_node.html',
    category: 'regulatory',
    region: 'europe',
    cadenceHours: 12,
    enabled: true,
    selectors: {
      container: '.content .column2, .content .text',
      title: 'h1, h2',
      description: 'p',
    },
    jsRendered: false,
  },

  // === THAILAND — FDA Cannabis Control Act Amendments ===
  {
    id: 'thailand-fda-cannabis',
    name: 'Thai FDA Cannabis Control Act',
    url: 'https://www.fda.moph.go.th/sites/drug/SitePages/Cannabis.aspx',
    searchUrl: 'https://www.fda.moph.go.th/sites/drug/SitePages/Cannabis.aspx',
    category: 'regulatory',
    region: 'asia_pacific',
    cadenceHours: 24,
    enabled: true,
    selectors: {
      container: '.ms-webpart-zone, .ms-rteElement-P',
      title: 'h1, h2, .ms-webpart-titleText',
      description: 'p, .ms-rteElement-P',
    },
    jsRendered: false,
  },

  // === EUROPE — European Cannabis Report (Prohibition Partners) ===
  {
    id: 'european-cannabis-report',
    name: 'European Cannabis Report',
    url: 'https://prohibitionpartners.com/reports/',
    searchUrl: 'https://prohibitionpartners.com/reports/',
    category: 'market_data',
    region: 'europe',
    cadenceHours: 168, // weekly
    enabled: true,
    selectors: {
      container: '.report-card, .product-item',
      title: 'h2, h3, .product-title',
      description: 'p, .product-description',
      price: '.price, .product-price',
    },
    jsRendered: true,
  },

  // === SPAIN — AEMPS Cannabis Medicinal ===
  {
    id: 'spain-aemps-cannabis',
    name: 'AEMPS Cannabis Medicinal',
    url: 'https://www.aemps.gob.es/medicamentosUsoHumano/farmacovigilancia/cannabis/',
    searchUrl: 'https://www.aemps.gob.es/medicamentosUsoHumano/farmacovigilancia/cannabis/',
    category: 'regulatory',
    region: 'europe',
    cadenceHours: 24,
    enabled: true,
    selectors: {
      container: '.content, .main-content',
      title: 'h1, h2',
      description: 'p',
    },
    jsRendered: false,
  },

  // === NETHERLANDS — OGD Cannabis Experiment ===
  {
    id: 'netherlands-ogd-experiment',
    name: 'Netherlands OGD Cannabis Experiment',
    url: 'https://www.rijksoverheid.nl/onderwerpen/coffeeshopbeleid',
    searchUrl: 'https://www.rijksoverheid.nl/onderwerpen/coffeeshopbeleid',
    category: 'regulatory',
    region: 'europe',
    cadenceHours: 24,
    enabled: true,
    selectors: {
      container: '.article-content, .content',
      title: 'h1, h2',
      description: 'p, .intro',
    },
    jsRendered: false,
  },

  // === CANADA — Health Canada Cannabis Tracking ===
  {
    id: 'canada-hc-tracking',
    name: 'Health Canada Cannabis Tracking',
    url: 'https://www.canada.ca/en/health-canada/services/cannabis-regulations.html',
    searchUrl: 'https://www.canada.ca/en/health-canada/services/cannabis-regulations.html',
    category: 'regulatory',
    region: 'north_america',
    cadenceHours: 12,
    enabled: true,
    selectors: {
      container: '.mwsgeneric-base-html',
      title: 'h1, h2',
      description: 'p',
    },
    jsRendered: false,
  },

  // === AUSTRALIA — TGA SAS Cannabis Access ===
  {
    id: 'australia-tga-sas',
    name: 'TGA Special Access Scheme — Cannabis',
    url: 'https://www.tga.gov.au/products/unapproved-therapeutic-goods/special-access-scheme',
    searchUrl: 'https://www.tga.gov.au/products/unapproved-therapeutic-goods/special-access-scheme',
    category: 'regulatory',
    region: 'asia_pacific',
    cadenceHours: 24,
    enabled: true,
    selectors: {
      container: '.au-body, .content',
      title: 'h1, h2',
      description: 'p',
    },
    jsRendered: false,
  },

  // === COLOMBIA — INVIMA Cannabis Registro ===
  {
    id: 'colombia-invima-registro',
    name: 'INVIMA Cannabis Registro',
    url: 'https://www.invima.gov.co/cannabis-medicinal',
    searchUrl: 'https://www.invima.gov.co/cannabis-medicinal',
    category: 'regulatory',
    region: 'latin_america',
    cadenceHours: 24,
    enabled: true,
    selectors: {
      container: '.content, .main-content',
      title: 'h1, h2',
      description: 'p',
    },
    jsRendered: false,
  },

  // === ISRAEL — IMCA Medical Cannabis Unit ===
  {
    id: 'israel-imca-medical',
    name: 'Israel IMCA Medical Cannabis',
    url: 'https://www.health.gov.il/Subjects/medicalCannabis/Pages/default.aspx',
    searchUrl: 'https://www.health.gov.il/Subjects/medicalCannabis/Pages/default.aspx',
    category: 'regulatory',
    region: 'middle_east_africa',
    cadenceHours: 24,
    enabled: true,
    selectors: {
      container: '.content, .main-content',
      title: 'h1, h2',
      description: 'p',
    },
    jsRendered: false,
  },

  // === SOUTH AFRICA — SAHPRA Cannabis Licensing ===
  {
    id: 'south-africa-sahpra',
    name: 'SAHPRA Cannabis Licensing',
    url: 'https://www.sahpra.org.za/cannabis/',
    searchUrl: 'https://www.sahpra.org.za/cannabis/',
    category: 'regulatory',
    region: 'middle_east_africa',
    cadenceHours: 24,
    enabled: true,
    selectors: {
      container: '.content, .entry-content',
      title: 'h1, h2',
      description: 'p',
    },
    jsRendered: false,
  },

  // === MALTA — MAM Cannabis Authority ===
  {
    id: 'malta-mam-cannabis',
    name: 'Malta Medicines Authority Cannabis',
    url: 'https://medicinesauthority.gov.mt/cannabis/',
    searchUrl: 'https://medicinesauthority.gov.mt/cannabis/',
    category: 'regulatory',
    region: 'europe',
    cadenceHours: 48,
    enabled: true,
    selectors: {
      container: '.content, .main-content',
      title: 'h1, h2',
      description: 'p',
    },
    jsRendered: false,
  },

  // === PORTUGAL — INFARMED Cannabis ===
  {
    id: 'portugal-infarmed-cannabis',
    name: 'INFARMED Cannabis Medicinal',
    url: 'https://www.infarmed.pt/web/infarmed/cannabis-medicinal',
    searchUrl: 'https://www.infarmed.pt/web/infarmed/cannabis-medicinal',
    category: 'regulatory',
    region: 'europe',
    cadenceHours: 24,
    enabled: true,
    selectors: {
      container: '.content, .main-content',
      title: 'h1, h2',
      description: 'p',
    },
    jsRendered: false,
  },

  // === NEW ZEALAND — MedSafe Cannabis Medicines ===
  {
    id: 'new-zealand-medsafe',
    name: 'MedSafe Cannabis Medicines',
    url: 'https://www.medsafe.govt.nz/regulatory/cannabis.asp',
    searchUrl: 'https://www.medsafe.govt.nz/regulatory/cannabis.asp',
    category: 'regulatory',
    region: 'asia_pacific',
    cadenceHours: 48,
    enabled: true,
    selectors: {
      container: '.content, .main-content',
      title: 'h1, h2',
      description: 'p',
    },
    jsRendered: false,
  },

  // === SWITZERLAND — Swissmedic Cannabis ===
  {
    id: 'switzerland-swissmedic',
    name: 'Swissmedic Cannabis',
    url: 'https://www.swissmedic.ch/swissmedic/en/home/humanarzneimittel/cannabis.html',
    searchUrl: 'https://www.swissmedic.ch/swissmedic/en/home/humanarzneimittel/cannabis.html',
    category: 'regulatory',
    region: 'europe',
    cadenceHours: 24,
    enabled: true,
    selectors: {
      container: '.content, .main-content',
      title: 'h1, h2',
      description: 'p',
    },
    jsRendered: false,
  },

  // === JAMAICA — CDA Cannabis Licensing ===
  {
    id: 'jamaica-cda-licensing',
    name: 'Jamaica Cannabis Licensing Authority',
    url: 'https://www.cda.gov.jm/',
    searchUrl: 'https://www.cda.gov.jm/',
    category: 'regulatory',
    region: 'latin_america',
    cadenceHours: 48,
    enabled: true,
    selectors: {
      container: '.content, .entry-content',
      title: 'h1, h2',
      description: 'p',
    },
    jsRendered: false,
  },
]
