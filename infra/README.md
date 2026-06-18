# AWS Deploy

This project deploys as:

- Web: Vite static build to S3, served through CloudFront.
- API: Hono Lambda with a public Lambda Function URL.
- Database: Neon Postgres through `DATABASE_URL`.

## First-time AWS permission

The AWS user running deployment needs permission to create/update:

- `personal-lift-api` Lambda
- `personal-lift-lambda-role` IAM role
- `personal-lift-web-638111422252-us-west-2` S3 bucket
- one CloudFront distribution

Attach the policy in `infra/aws-deploy-policy.json` to the IAM user that runs deployment.

For this local machine, that user is currently:

```txt
arn:aws:iam::638111422252:user/github-actions-personal-lift
```

## Local deploy

After AWS permissions are attached:

```bash
pnpm deploy:aws
```

The script reads secrets from `apps/server/.env` locally and from environment variables in CI.
Set `WEB_URL` to the public frontend URL when the frontend is hosted outside AWS, for example:

```bash
WEB_URL=https://numjy.com,https://app.numjy.com pnpm deploy:aws
```

It writes non-secret deployment outputs to `infra/.deploy.json`, which is ignored by git.

## GitHub Actions secrets

For CI/CD, add these repository secrets in GitHub:

```txt
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
DATABASE_URL
BETTER_AUTH_SECRET
```

Then pushes to `main` run `.github/workflows/deploy.yml`.
