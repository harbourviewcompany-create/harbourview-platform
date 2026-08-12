# Corridor Gate Catalogue

Every corridor version instantiates the applicable gates below. A gate may be `not_applicable` only with a rule and evidence explaining why.

| Gate family | Mandatory gate definitions |
|---|---|
| Product legality | Origin legality; destination legality; transit legality; controlled-substance classification alignment; intended-use eligibility |
| Party authorization | Exporter entity validity; exporter licence/scope; importer entity validity; importer licence/scope; distributor/recipient authorization |
| Permits and quotas | Destination import authorization; origin export authorization; transit authorization; treaty estimate/quota; national quota; quantity compatibility |
| Product authorization | Product registration; named-patient/special-access eligibility; dosage/form/strength eligibility; packaging and labelling |
| Quality | Cultivation standard; manufacturing authorization; GMP/GACP/GDP; laboratory/testing; certificate of analysis; batch release; stability/shelf life |
| Customs and tax | Commodity classification; customs declaration; duties/tariffs; excise/tax; valuation; origin documentation |
| Logistics | Qualified carrier; route approval; storage; temperature/environment; security; chain of custody; receipt and discrepancy reporting |
| Commercial and legal | Quality agreement; supply agreement; insurance; payment/commercial approval; privacy/data transfer; sanctions/export controls |
| Evidence and operations | Document completeness; validity/expiry; responsible party; record retention; notification/reporting; contingency and recall plan |
| Counterparty | Licence freshness; ownership transparency; enforcement risk; certification status; approved-counterparty decision |

## Determination logic

- Any failed critical mandatory gate produces HOLD.
- Any unknown critical gate produces insufficient information or HOLD according to policy.
- Conditional satisfaction produces CONDITIONAL GO only when the condition, owner, due date and recheck are recorded.
- GO requires current evidence and specialist approval for high-risk corridors.
- Material input or rule changes produce a new corridor version; prior GO is not silently reused.
