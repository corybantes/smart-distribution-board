import { NextResponse } from "next/server";
import { adminDb, adminRtdb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");

  if (!uid)
    return NextResponse.json({ error: "UID required" }, { status: 400 });

  try {
    const userDoc = await adminDb.collection("users").doc(uid).get();
    const userData = userDoc.data();
    const isAdmin = userData?.role === "admin";
    const isMultiMode = userData?.systemMode === "multi";

    let balance = 0;
    let query;
    let monthlyUsage: any[] = [];

    // --- 1. ROLE-AWARE BALANCE & HISTORY ---
    if (isAdmin && isMultiMode) {
      // LANDLORD MODE: Fetch all tenants assigned to this admin
      const tenantsSnap = await adminDb
        .collection("users")
        .where("adminId", "==", uid)
        .get();

      const tenantUids = tenantsSnap.docs.map((doc) => doc.id);

      // Sum up all the tenants' balances to show the "Total Active Float"
      balance = tenantsSnap.docs.reduce(
        (sum, doc) => sum + (doc.data().balance || 0),
        0,
      );

      // Fetch the most recent 20 transactions across ALL tenants
      if (tenantUids.length > 0) {
        query = adminDb
          .collection("billing")
          .where("userId", "in", tenantUids)
          .orderBy("createdAt", "desc");
      }
    } else {
      // TENANT MODE: Just fetch their own data
      balance = userData?.balance || 0;
      query = adminDb
        .collection("billing")
        .where("userId", "==", uid)
        .orderBy("createdAt", "desc");

      // Fetch Tenant's specific monthly usage for the AI Prediction chart
      const monthlySnap = await adminDb
        .collection("users")
        .doc(uid)
        .collection("billingHistory")
        .orderBy("month", "desc")
        .limit(6)
        .get();
      monthlyUsage = monthlySnap.docs.map((doc) => doc.data());
    }

    // Execute the History Query (if it exists)
    let history: any[] = [];
    if (query) {
      const historySnap = await query.limit(20).get();
      history = historySnap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Fallback to ISO string if createdAt doesn't exist yet
          date: data.createdAt
            ? data.createdAt.toDate().toISOString()
            : new Date().toISOString(),
        };
      });
    }

    return NextResponse.json({ balance, history, monthlyUsage });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Fetch failed", details: error.message },
      { status: 500 },
    );
  }
}

// --- POST: AUTO-ROUTING TOP UP LOGIC ---
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Extract the new payload structure sent from BillingTopup.tsx
    const { adminId, outletId, targetEmail, amount } = body;

    if (!adminId || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // 2. Authenticate the Admin initiating the transaction
    const initiatorDoc = await adminDb.collection("users").doc(adminId).get();

    if (!initiatorDoc.exists) {
      return NextResponse.json(
        { error: "Admin account not found" },
        { status: 404 },
      );
    }

    const initiatorData = initiatorDoc.data();
    let targetUid = adminId; // Default to self
    let smartDbId = initiatorData?.smartDbId;

    // 3. ADMIN-TO-TENANT ROUTING (Locate Tenant via Email)
    if (initiatorData?.role === "admin" && targetEmail) {
      const tenantQuery = await adminDb
        .collection("users")
        .where("email", "==", targetEmail)
        .limit(1)
        .get();

      if (!tenantQuery.empty) {
        targetUid = tenantQuery.docs[0].id; // We found the tenant!
      } else {
        return NextResponse.json(
          {
            error: `No registered tenant found with email: ${targetEmail}. Have they signed up?`,
          },
          { status: 404 },
        );
      }
    }

    // 4. Create Ledger Receipt in the TARGET's history
    await adminDb.collection("billing").add({
      userId: targetUid,
      outletId: outletId || initiatorData?.outletId || "System",
      amount: Number(amount),
      status: "Paid",
      type: "credit",
      allocatedBy: initiatorData?.role === "admin" ? "Admin" : "Self",
      createdAt: FieldValue.serverTimestamp(),
      date: new Date().toISOString(), // Standardized date for table sorting
    });

    // 5. Update the TARGET's Wallet Balance
    await adminDb
      .collection("users")
      .doc(targetUid)
      .update({
        balance: FieldValue.increment(Number(amount)),
      });

    // 6. HARDWARE AUTO-RECONNECT
    // If we have the board ID and the outlet ID, turn the relay ON
    if (smartDbId && outletId) {
      await adminRtdb
        .ref(`Devices/ESP_${smartDbId}/Control/O${outletId}`)
        .set(1);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Topup routing error:", error);
    // Send the actual error message back to the frontend toast
    return NextResponse.json(
      { error: error.message || "Transaction failed" },
      { status: 500 },
    );
  }
}
