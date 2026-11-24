# aari-studio
Aari embroidery lessons in Tamil and English, with stitch videos, a design gallery, and printable patterns.

## Design membership

The static site shows two free designs and the names of the locked professional designs. The payment QR and reference entry appear when the Node web service is configured for Razorpay UPI QR payments. Use Node 22.13 or later and run `npm start`. The service serves the website and membership API from the same origin.

Set these server-side variables in the hosting dashboard.

| Variable | Value |
| --- | --- |
| `AARI_DATA_DIR` | Absolute path on persistent storage, outside `dist`. Extract the private design package into this directory so that it contains `designs/`. Keep the SQLite database and designs on the same persistent volume. |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Live credentials for the studio's Razorpay merchant account with UPI QR Codes enabled. Store them in the service's environment variables. |
| `AARI_PAYMENT_TEST_MODE` | Set to `1` only on a separate test deployment if test keys are used. |
| `AARI_ADMIN_TOKEN` | Optional for manual code issuance. Use an independent random secret with at least 32 characters. |

### Verify a QR payment

Visitors generate a ₹99 single-use QR, scan it, and enter the 12-digit UPI reference from their receipt. The service checks Razorpay for the payment on that QR, verifies that it was captured for ₹99, and opens the collection for 30 days starting from the payment. Each Razorpay payment can be used once. Access resumes in the same browser until expiry.

Enable the QR product and verify a live checkout in the studio’s Razorpay account before announcing payments. Razorpay test QR codes cannot be scanned for a real UPI payment.

### Issue a manual code when needed

1. In the receiving UPI app, verify that the payment has been credited and that its amount and reference match the customer's payment.
2. Send a POST request to `/api/membership/codes` with a JSON body containing `"reference"` and `"amountPaise": 9900`, and an `Authorization: Bearer` header containing the server's admin token. Use a trusted terminal or API client and keep the token private.
3. Send the returned `code` to the customer. The service returns it at issuance and stores a hash. One confirmed payment reference can issue one code. The code opens all professional designs for 30 days from issuance. Each renewal requires a new verified UPI payment and code.

The service verifies access on each full-image request and records verified payments, the first and latest design opens, and the total number of opens for each membership in SQLite. Volume backups retain these records. Serve only `dist` as public static files. Deploy on a persistent Node web service before replacing the current static production site. An existing manual-code deployment can retain its `AARI_MEMBERSHIP_CONTACT_URL` and admin token to keep serving previously issued codes during migration.
