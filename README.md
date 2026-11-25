# Aari Studio

Aari embroidery lessons and design patterns in English and Tamil. Serve `dist` for the gallery, free lessons and the self-paced training.

## Training enrollment

Learners pay ₹99 with the displayed UPI QR or UPI app link. They enter their payment reference on `/payment.html` to open Lesson 3 onward and Design Mixer for 30 days. The site trusts the submitted reference. It uses browser storage to remember the expiry and prevent the same reference from being reused in that browser. The reference is hashed in the browser and the original ID is discarded. The static lesson file is publicly reachable.

The optional Node service starts with `node server/index.mjs` on Node 22.13 or later and serves the site on `PORT` (8080 by default). Its older membership and manual approval endpoints are independent of the browser-based training flow.

## Owner reporting

The optional Node service can serve the owner dashboard at `/admin` alongside the same shop and checkout. The Render Static Site alone cannot run the reporting routes. Reporting is off by default and the static pages continue to work without a reporting server.

On a Node deployment serving the existing site origin, configure:

| Setting | Value |
| --- | --- |
| `AARI_REPORTING_ORIGIN` | The exact HTTPS origin, with no trailing slash. For a local test, use the local HTTP origin including its port. |
| `AARI_REPORTING_DATA_DIR` | An absolute directory outside `dist` on a durable volume. Preserve this directory across restarts and deployments. Run one replica per SQLite database. |
| `AARI_REPORTING_OWNER_KEY` | A private random base64url secret of at least 32 bytes. To generate one, run `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"`. Give it only to the owner over a secure channel and store it as a server-side secret. |

Use the username `owner` and the configured secret at the browser sign-in prompt. The count of tracked unique browsers is based on a first-party random browser ID and begins when the reporting database is initialized. Observed browser unlock events are counted separately. The confirmed payment count increases only when the owner records a unique reference after matching it to an incoming ₹99 credit. The dashboard shows reference suffixes and the time each payment was recorded. It does not grant training access.

Run `node --test test/reporting.test.mjs` to check authentication, independent counts and restart persistence locally.
