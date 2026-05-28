import { CountryRegistryRecord, DashboardPanelState, DashboardSection } from './country-registry'

export interface DashboardSourceStatus { label: string; state: DashboardPanelState }
export interface DashboardStatusBadge { label: string; tone: DashboardPanelState }
export interface DashboardRouteAction { label: string; href: string; section?: DashboardSection }
export interface CountryDashboardSummary { country: CountryRegistryRecord; status: DashboardStatusBadge; actions: DashboardRouteAction[] }
export interface MarketDashboardPanel { state: DashboardPanelState; summary: string }
export interface EducationDashboardPanel { state: DashboardPanelState; summary: string }
export interface ComplianceDashboardPanel { state: DashboardPanelState; summary: string }
export interface SignalsDashboardPanel { state: DashboardPanelState; summary: string }
export interface OpportunitiesDashboardPanel { state: DashboardPanelState; summary: string }
export interface IntelligenceDashboardPanel { state: DashboardPanelState; summary: string }
export interface ConnectionsDashboardPanel { state: DashboardPanelState; summary: string }
