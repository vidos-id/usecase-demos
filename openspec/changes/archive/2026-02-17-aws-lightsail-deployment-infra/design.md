## Context

The repo needs an infrastructure-as-code path to deploy the Bun backend in Docker to AWS with minimal cost and operational overhead. The target is Lightsail Container Service in eu-west-1 with a public HTTPS endpoint, backed by a private ECR repository. The deployment is for demo use, so single-node service is acceptable. Infrastructure will live under `infrastructure/` with a TypeScript deploy script under `scripts/`.

## Goals / Non-Goals

**Goals:**
- Provision Lightsail Container Service and ECR via Pulumi (AWS Classic provider) in eu-west-1.
- Keep costs low (micro tier, 1 node, minimal resources).
- Provide a repeatable TypeScript deployment script to build, tag, push, and roll out images.
- Document setup, secrets, deployment, logs, and teardown for someone new to the repo.

**Non-Goals:**
- High availability, auto-scaling, or multi-AZ deployments.
- Custom domains, load balancers, or blue-green releases.
- CI/CD pipelines or automated monitoring/alerting beyond Lightsail defaults.

## Decisions

- Use Pulumi AWS Classic provider for Lightsail support and familiarity. Alternative: AWS Native provider, but Lightsail support is limited and less mature.
- Use Lightsail Container Service micro tier with single node. Alternative: larger tiers or multiple nodes increase cost without benefit for demos.
- Use private ECR with a lifecycle policy to retain last 5 images. Alternative: public ECR or unlimited retention increases exposure or cost.
- Deploy via a TypeScript script (Node) instead of shell. Alternative: bash script is simpler but inconsistent with TS preference and harder to test.
- Tag images with git SHA when available, fallback to timestamp. Alternative: semantic versions require additional release process.
- Use Lightsail managed HTTPS endpoint instead of custom domain/cert. Alternative: custom domain adds complexity and cost.

## Risks / Trade-offs

- Lightsail service has limited configurability compared to ECS/Fargate → Accept reduced flexibility for simplicity.
- ECR auth and Lightsail image updates require AWS CLI and valid credentials → Mitigation: clear docs and pre-flight checks in script.
- Single-node service means downtime during deploys or node failures → Mitigation: accept for demo use; document limitations.

## Migration Plan

- Run `pulumi up` to provision ECR and Lightsail service in dev stack.
- Configure required secrets for `vidos:authorizerUrl` and optional `vidos:apiKey`.
- Use `scripts/deploy.ts` to build, push, and update the service image.
- Rollback by redeploying a previous image tag if needed.

## Open Questions

- Preferred image tag strategy (git SHA vs timestamp) if the repo is not a git checkout.
- Whether to support an optional rollback flag in the deploy script.
