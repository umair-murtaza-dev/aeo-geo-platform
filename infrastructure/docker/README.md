# Local dependencies

`docker-compose.yml` starts Redis for BullMQ and a disposable Postgres instance for tests.

The application database for development is Neon. Point `DATABASE_URL` at the Neon pooled host and `DIRECT_URL` at the Neon direct host. Do not point those variables at this compose Postgres unless you intend to use a disposable local database.

The compose Postgres publishes `127.0.0.1:54329`. A matching test URL is:

`postgresql://aeo:aeo@127.0.0.1:54329/aeo_test`

That password is the local compose default, not a credential for any hosted database. Do not reuse it anywhere else.

Docker was not available in the environment that produced M01, so this file was not executed there.
