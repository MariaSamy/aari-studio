# aari-studio
Aari embroidery lessons in Tamil and English, with stitch videos, a design gallery, and printable patterns.

## Design membership

The static site shows two free designs and previews of the professional collection. The membership controls appear when the Node web service is configured. Use Node 22.13 or later and run `npm start`. The service serves the website and membership API from the same origin.

Set these server-side variables in the hosting dashboard.

| Variable | Value |
| --- | --- |
| `AARI_DATA_DIR` | Absolute path on persistent storage, outside `dist`. Extract the private design package into this directory so that it contains `designs/`. Keep the SQLite database and designs on the same persistent volume. |
| `AARI_ADMIN_TOKEN` | An independent, randomly generated secret with at least 32 characters. |
| `AARI_MEMBERSHIP_CONTACT_URL` | A public business WhatsApp URL or support email link where customers can send their UPI transaction reference. Use an HTTPS or mailto URL. |

### Confirm and issue a code

1. In the receiving UPI app, verify that the payment has been credited and that its amount and reference match the customer's payment.
2. Send a POST request to `/api/membership/codes` with a JSON body containing `"reference"` and `"amountPaise": 9900`, and an `Authorization: Bearer` header containing the server's admin token. Use a trusted terminal or API client and keep the token private.
3. Send the returned `code` to the customer. The service returns it at issuance and stores a hash. One confirmed payment reference can issue one code. The code opens all professional designs for 30 days from issuance. Each renewal requires a new verified UPI payment and code.

The service verifies access on each full-image request and records verified payments, the first and latest design opens, and the total number of opens for each code in SQLite. Volume backups retain these records. Serve only `dist` as public static files. Deploy on a persistent Node web service before replacing the current static production site.
