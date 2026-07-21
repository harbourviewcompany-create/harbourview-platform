import Link from 'next/link'
import type { CountryRolePublicDto, } from '@/lib/roles/dto'
import { roleProfiles } from '@/lib/roles/role-profiles'

function labelize(value: string) {
return value.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
}

export function EvidenceGapState({ dto }: { dto: CountryRolePublicDto }) {
if (dto.evidence.confidence !== 'evidence_gap') return null
return (
<section className="rounded-3xl border border-amber-300/30 bg-amber-300/[0.08] p-4 text-amber-50 shadow-2xl shadow-black/20">
<p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-200/80">Evidence gap</p>
<p className="mt-2 text-sm leading-6">Evidence gap: Harbourview has not fully verified this country-role pathway yet.</p>
<div className="mt-4 grid grid-cols-1 gap-2 text-xs [@media(min-width:480px)]:grid-cols-2 sm:grid-cols-4">
{['Request review', 'Submit evidence', 'Track this jurisdiction', 'View adjacent verified markets'].map((action) => (
<Link key={action} href={dto.primaryAction.href} className="flex min-h-[44px] items-center justify-center rounded-2xl border border-amber-200/20 bg-black/20 px-3 py-3 text-center font-semibold text-amber-100">{action}</Link>
))}
</div>
</section>
)
}

export function CountryRoleHeader({ dto }: { dto: CountryRolePublicDto }) {
return (
<header className="rounded-[2rem] border border-[#d6b66b]/20 bg-[#071425]/95 p-5 shadow-2xl shadow-black/30">
<div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d6b66b]">
<span>{dto.country.countryName}</span><span>•</span><span>{dto.role.label}</span><span>•</span><span>{dto.family.label}</span>
</div>
<h1 className="mt-4 font-serif text-2xl leading-tight tracking-[-0.04em] text-[#f7f1df] [@media(min-width:480px)]:text-3xl sm:text-5xl">{dto.role.shortLabel} command center</h1>
<p className="mt-4 text-sm leading-7 text-white/68">{dto.role.operatingQuestion}</p>
<div className="mt-5 flex flex-col gap-3 sm:flex-row">
<Link href={dto.primaryAction.href} className="flex min-h-[48px] items-center justify-center rounded-2xl bg-[#d6b66b] px-5 py-4 text-center text-sm font-bold text-[#08111f] shadow-xl shadow-[#d6b66b]/10 sm:flex-1">{dto.primaryAction.label}</Link>
<Link href={`/country/${dto.country.countrySlug}/role/${dto.role.slug}#modules`} className="flex min-h-[48px] items-center justify-center rounded-2xl border border-white/15 px-5 py-4 text-center text-sm font-semibold text-white/80 sm:flex-1">View modules</Link>
</div>
</header>
)
}

export function RoleMissionCard({ dto }: { dto: CountryRolePublicDto }) {
return <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"><p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d6b66b]/80">Mission priority</p><p className="mt-2 text-sm leading-6 text-white/72">{dto.role.priority}</p></section>
}

export function RoleActionBar({ dto }: { dto: CountryRolePublicDto }) {
return <section className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{dto.actions.map((action) => <Link className="flex min-h-[44px] min-w-max snap-start items-center rounded-full border border-[#d6b66b]/20 bg-[#d6b66b]/10 px-4 py-3 text-xs font-semibold text-[#f3dda5]" key={action} href={dto.primaryAction.href}>{labelize(action)}</Link>)}</section>
}

export function RoleModuleCard({ moduleKey, index }: { moduleKey: string; index: number }) {
return <article className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.025))] p-4"><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">Module {String(index + 1).padStart(2, '0')}</p><h3 className="mt-2 text-lg font-semibold text-white">{labelize(moduleKey)}</h3><p className="mt-2 text-sm leading-6 text-white/55">Evidence-gated workspace. Missing source coverage remains marked as a gap; Harbourview does not invent suppliers, licences, COAs, clinical facts, trade facts, or genetics/IP claims.</p></article>
}

export function RolePriorityStack({ dto }: { dto: CountryRolePublicDto }) {
const topModules = dto.moduleOrder.slice(0, 4)
return <section id="modules" className="grid gap-3 sm:grid-cols-2">{topModules.map((moduleKey, index) => <RoleModuleCard key={moduleKey} moduleKey={moduleKey} index={index} />)}</section>
}

export function RoleSelector({ dto }: { dto: CountryRolePublicDto }) {
const familyRoles = roleProfiles.filter((role) => role.family === dto.role.family).slice(0, 10)
return <section className="rounded-3xl border border-white/10 bg-black/20 p-4"><p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">Switch role in this family</p><div className="mt-3 flex flex-wrap gap-2">{familyRoles.map((role) => <Link key={role.slug} href={`/country/${dto.country.countrySlug}/role/${role.slug}`} className={`flex min-h-[44px] items-center rounded-full border px-3 py-2 text-xs ${role.slug === dto.role.slug ? 'border-[#d6b66b] bg-[#d6b66b]/15 text-[#f4dfaa]' : 'border-white/10 text-white/62'}`}>{role.shortLabel}</Link>)}</div></section>
}

export function MobileCommandStack({ dto }: { dto: CountryRolePublicDto }) {
return <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] [padding-left:max(1rem,env(safe-area-inset-left))] [padding-right:max(1rem,env(safe-area-inset-right))] sm:px-6 lg:py-8"><CountryRoleHeader dto={dto} /><EvidenceGapState dto={dto} /><RoleMissionCard dto={dto} /><RoleActionBar dto={dto} /><RolePriorityStack dto={dto} /><RoleSelector dto={dto} /></main>
}

export function CommandCenterShell({ dto }: { dto: CountryRolePublicDto }) {
return <div className="min-h-screen bg-[#020814] text-white"><div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(214,182,107,0.14),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(65,96,130,0.18),transparent_32%)]" /><div className="relative"><MobileCommandStack dto={dto} /></div></div>
}
