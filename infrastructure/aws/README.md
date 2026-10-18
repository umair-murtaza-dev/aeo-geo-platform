# AWS shape

M01 does not create AWS resources. Do not apply infrastructure from this repository until a later milestone explicitly authorizes it.

Planned production shape, without Kubernetes:

- Next.js web and the Express API run as separate container services.
- The BullMQ worker runs as its own service.
- Neon PostgreSQL remains the system of record. AWS RDS is not the primary database.
- Redis is an ElastiCache or equivalent managed Redis, reachable only from the worker and any future enqueue path.
- Amazon S3 stores raw observation payloads and report exports. The database stores object references, not the objects.
- Secrets Manager or SSM Parameter Store holds `AUTH_SECRET`, provider credentials, and Stripe keys. `ProviderSecretRef.secretName` points at those names.
- A load balancer terminates TLS. Set `TRUST_PROXY=1` only behind that balancer.
- Logs go to CloudWatch. They must not include database URLs, access tokens, or passwords.

Stripe billing stays disabled until merchant eligibility is confirmed.
