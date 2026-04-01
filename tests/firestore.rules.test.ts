import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

const PROJECT_ID = "demo-sera";
const HOUSEHOLD_A = "household-a";
const HOUSEHOLD_B = "household-b";

let testEnv: RulesTestEnvironment;

async function seedFirestore() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    await setDoc(doc(db, "households", HOUSEHOLD_A), {
      ownerId: "owner-a",
      members: ["owner-a", "admin-a", "member-a"],
      name: "Household A",
    });
    await setDoc(doc(db, "households", HOUSEHOLD_A, "members", "admin-a"), {
      uid: "admin-a",
      role: "admin",
      displayName: "Admin A",
    });
    await setDoc(doc(db, "households", HOUSEHOLD_A, "members", "member-a"), {
      uid: "member-a",
      role: "member",
      displayName: "Member A",
    });

    await setDoc(doc(db, "households", HOUSEHOLD_B), {
      ownerId: "owner-b",
      members: ["owner-b", "member-b"],
      name: "Household B",
    });
    await setDoc(doc(db, "households", HOUSEHOLD_B, "members", "owner-b"), {
      uid: "owner-b",
      role: "admin",
      displayName: "Owner B",
    });
    await setDoc(doc(db, "households", HOUSEHOLD_B, "members", "member-b"), {
      uid: "member-b",
      role: "member",
      displayName: "Member B",
    });

    await setDoc(doc(db, "cases", "case-a"), {
      householdId: HOUSEHOLD_A,
      authorId: "member-a",
      title: "Case A",
      status: "new",
    });
  });
}

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host: "127.0.0.1",
      port: 8080,
      rules: readFileSync(resolve(process.cwd(), "firestore.rules"), "utf8"),
    },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await seedFirestore();
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe("Firestore rules", () => {
  it("allows a household member to read a case in their own household", async () => {
    const db = testEnv.authenticatedContext("member-a").firestore();

    await assertSucceeds(getDoc(doc(db, "cases", "case-a")));
  });

  it("denies cross-household case reads", async () => {
    const db = testEnv.authenticatedContext("member-b").firestore();

    await assertFails(getDoc(doc(db, "cases", "case-a")));
  });

  it("allows a household admin to update another member role in their own household", async () => {
    const db = testEnv.authenticatedContext("admin-a").firestore();

    await assertSucceeds(
      updateDoc(doc(db, "households", HOUSEHOLD_A, "members", "member-a"), {
        role: "caregiver",
      })
    );
  });

  it("denies a non-admin member from updating another member role", async () => {
    const db = testEnv.authenticatedContext("member-a").firestore();

    await assertFails(
      updateDoc(doc(db, "households", HOUSEHOLD_A, "members", "admin-a"), {
        role: "member",
      })
    );
  });

  it("denies cross-household document creation even when the user is authenticated", async () => {
    const db = testEnv.authenticatedContext("member-a").firestore();

    await assertFails(
      setDoc(doc(db, "documents", "cross-household-doc"), {
        householdId: HOUSEHOLD_B,
        authorId: "member-a",
        name: "Other Household Document",
        url: "https://example.invalid/document.pdf",
      })
    );
  });
});
