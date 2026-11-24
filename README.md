# Aari Studio

Aari embroidery lessons and design patterns in English and Tamil. Serve `dist` for the free gallery, setup guide, Straight Chain Stitch and Curves and Corners lessons.

## Self-paced training

The ₹99 course includes 30 days of access to advanced stitching and an original blouse-neckline project. The Training & payment section shows the UPI QR and payment-reference form when the Node service confirms that enrollments are available.

Run `node server/index.mjs` with Node 22.13 or later. The service serves the site and the training API on `PORT` (8080 by default).

| Variable | Purpose |
| --- | --- |
| `AARI_DATA_DIR` | Absolute path on persistent storage outside `dist`. Extract the private training ZIP here so `training.json` sits beside the SQLite database. |
| `AARI_MANUAL_UPI_ENABLED` | Set to `1` to open enrollment and show the studio's UPI QR. |
| `AARI_ADMIN_TOKEN` | Required for approvals. Use a random secret of at least 32 characters. |

1. Find the incoming ₹99 credit and its reference in the receiving UPI or bank app.
2. Open `/admin/payments` on the Node service. Enter the admin token and the credited payment's reference, confirm the amount and approve.
3. The learner enters the reference at `/#payment`. The page checks for approval and automatically opens the training in the browser that claims the payment. Each confirmed reference can be claimed once. To renew, the learner makes another ₹99 payment.

The server verifies the session before serving any paid lesson and records when the training first and last opened. Back up the SQLite database and private training file. Keep real credentials and course files outside the repository and the public directory.

The legacy design membership endpoints retain their existing configuration and private `designs/` directory requirements when legacy contact or Razorpay settings are enabled. They are separate from training enrollment.
