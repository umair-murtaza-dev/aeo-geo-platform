# Milestones M02–M10

M01 is the foundation. Later milestones stay inside the module ownership table. None of them are implemented here.

| Milestone | Outcome | Lead chat |
| --- | --- | --- |
| M02 | Organization, workspace, brand, domain, location, and competitor management on the existing schema | A, with E for screens |
| M03 | Prompt versions, schedules, and real provider execution through the adapter interface | B |
| M04 | Persist observations, citations, and mentions as immutable evidence, including raw response storage | B |
| M05 | Visibility metrics from stored observations, using the metric keys in `@aeo/shared` | C |
| M06 | Technical SEO/AEO audits, findings, recommendations, and implementation tasks | C |
| M07 | Interventions, cohorts, baseline/control comparison, and uncertainty on linked observations | D |
| M08 | Agency-branded report generation and exports | E |
| M09 | Plans, entitlements, quotas, and Stripe billing if the merchant account is eligible | F |
| M10 | Production deployment, external integrations, operational limits, and release hardening | F and G |

M03 must not treat `MODEL_API` output as `CONSUMER_SEARCH`. M05 must not display fixture numbers. M09 must not store card data. M10 must not introduce Kubernetes or a second database engine.
