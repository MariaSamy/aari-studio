# Aari Studio

Aari embroidery lessons and design patterns in English and Tamil. Serve `dist` for the gallery, free lessons and the self-paced training.

## Training enrollment

Learners pay ₹99 with the displayed UPI QR or UPI app link. They enter their payment reference at `/#payment` to open the six training lessons for 30 days. The site trusts the submitted reference. It uses browser storage to remember the expiry and prevent the same reference from being reused in that browser. The reference is hashed in the browser and the original ID is discarded. The static lesson file is publicly reachable.

The optional Node service starts with `node server/index.mjs` on Node 22.13 or later and serves the site on `PORT` (8080 by default). Its older membership and manual approval endpoints are independent of the browser-based training flow.
