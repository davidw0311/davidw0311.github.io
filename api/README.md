# Language Lab speech function

This Azure Function keeps the portfolio on GitHub Pages while protecting the Azure Speech key on the server. It accepts one short 16 kHz mono WAV attempt and returns normalized pronunciation scores. It does not write audio or scores to storage.

## What you create in Azure

1. Create an **Azure AI Speech** resource. Keep its region and one access key.
2. Create a **Function App** using Node.js 22 and the same Azure region when practical. This MVP uses the Windows Consumption plan because Flex Consumption is unavailable on Azure Free Trial subscriptions.
   The Function App also needs an Azure Storage account for host/runtime state; this is infrastructure storage, not an application database, and lesson attempts are not persisted there.
3. In the Function App's **Environment variables / App settings**, add:

   - `AZURE_SPEECH_KEY`: the Speech resource key
   - `AZURE_SPEECH_REGION`: the Speech resource region identifier, such as `southeastasia`
   - `ALLOWED_ORIGINS`: `https://davidw0311.github.io`

Never add the Speech key to GitHub or to a `NEXT_PUBLIC_` variable.

## Run locally

Install Node.js 22+ and Azure Functions Core Tools v4, then from this `api` directory:

```sh
npm install
cp local.settings.example.json local.settings.json
npm start
```

Put your real Speech key and region in `local.settings.json`. In the portfolio root, create `.env.local` containing:

```text
NEXT_PUBLIC_PRONUNCIATION_API_URL=http://localhost:7071/api/pronunciation/assess
```

Then run `npm run dev` from the portfolio root. The function health check is at `http://localhost:7071/api/health`.

## Publish the function

Sign in with the Azure CLI and publish from this `api` directory:

```sh
az login
func azure functionapp publish <YOUR_FUNCTION_APP_NAME> --javascript
```

Core Tools prints the production endpoint after deployment. New Azure apps can receive a region-qualified hostname, so use the exact printed URL rather than constructing one from the app name.

For the deployed MVP, the endpoint is:

```text
https://speechlab-assessment-hfh9hpfwhdafh7gz.southeastasia-01.azurewebsites.net/api/pronunciation/assess
```

## Connect GitHub Pages

The GitHub Pages workflow sets `NEXT_PUBLIC_PRONUNCIATION_API_URL` to the deployed public endpoint while building the static site. The Azure Speech key remains only in the Function App.

## MVP safeguards

- Accepted origins are restricted to the configured site.
- Requests are limited to the four lesson locales and short WAV files.
- Each warm function instance applies a small per-address rate limit.
- Nothing is persisted, so no database is needed.

The endpoint is still publicly reachable. Set an Azure budget/cost alert before sharing it widely. At higher traffic, add durable rate limiting or API Management, abuse monitoring, and user authentication.
