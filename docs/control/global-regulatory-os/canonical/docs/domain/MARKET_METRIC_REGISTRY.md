# Market Metric Registry

## Registry purpose

The registry prevents conflicting totals, hidden definitions and forecast-baseline drift. A metric definition is immutable after publication; changes create a new version.

## Required dimensions

- Jurisdiction and market programme.
- Product and cannabinoid class.
- Intended use.
- Channel and supply-chain stage.
- Licence or facility type.
- Time period and period basis.
- Unit and currency.
- Tax inclusion.
- Gross/net basis.
- Actual, estimate, forecast or scenario state.
- Source dataset and methodology version.

## Initial metric families

1. Retail sales value and volume.
2. Wholesale sales and transfer value.
3. Import and export value, mass and units.
4. Production and harvest.
5. Inventory by stage.
6. Destruction and loss.
7. Licensed cultivation/manufacturing area or capacity.
8. Capacity utilization.
9. Active, pending and awarded licences.
10. Licence density by population or market.
11. Patients, registrations and prescriptions.
12. Prescriber and pharmacy participation.
13. Retail and wholesale price.
14. Reimbursement and formulary values.
15. Tax, excise and fee receipts.
16. Product registrations and SKUs.
17. Enforcement, recalls and inspection incidence.
18. Tender and procurement value.
19. Shortage and availability indicators.
20. Employment and capital expenditure where methodologically supportable.

## Metric-definition example

```yaml
metric_key: retail_sales_value
version: 1
canonical_name: Licensed retail cannabis sales value
definition: Value of final licensed retail cannabis sales to consumers during the period.
included_activity: [licensed_retail, regulated_medical_dispensing]
excluded_activity: [wholesale_transfer, illicit_market, intercompany_transfer]
unit: currency
currency: jurisdiction_reporting_currency
tax_treatment: exclude_sales_tax_include_excise_if_reported_in_regulator_total
gross_net_basis: gross_consumer_sales
period_basis: calendar
allowed_states: [reported_actual, revised_actual, preliminary_actual, modeled_estimate]
methodology: Jurisdiction-specific source mappings must identify deviations from this canonical definition.
revision_policy: Preserve prior observation and link revised_from_id.
```

## Publication rules

- Actuals, preliminary data, estimates, imputations, forecasts and scenarios use visibly different labels.
- Components must reconcile with totals or an approved reconciliation exception must accompany publication.
- Growth rates identify exact baseline observations.
- Currency conversions retain rate, provider and date.
- No chart omits metric definition, as-of date, observation state, source and methodology version.
- Licensed data fields enforce redistribution rights in APIs, exports and derived products.

## Quality checks

- Unit and currency compatibility.
- Period overlap and missing periods.
- Component-total arithmetic.
- Negative or implausible values.
- Revision chain integrity.
- Duplicate observations.
- Jurisdiction/programme compatibility.
- Forecast baseline existence.
- Evidence and rights completeness.
- Cross-surface canonical-value equality.
