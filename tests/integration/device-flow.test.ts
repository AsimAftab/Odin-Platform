import { describe, expect, test, beforeAll } from "bun:test";
import { jsonRequest } from "./setup";

let codePOST: (req: import("next/server").NextRequest) => Promise<Response>;
let tokenPOST: (req: import("next/server").NextRequest) => Promise<Response>;
let DeviceCode: typeof import("@/models/DeviceCode").DeviceCode;
let validateApiToken: (raw: string) => Promise<string | null>;

const IP = "10.2.0.1";

beforeAll(async () => {
  const { connectDB } = await import("@/lib/db");
  await connectDB();
  ({ POST: codePOST } = await import("@/app/api/device/code/route"));
  ({ POST: tokenPOST } = await import("@/app/api/device/token/route"));
  ({ DeviceCode } = await import("@/models/DeviceCode"));
  ({ validateApiToken } = await import("@/lib/api-token"));
});

function requestCode(label = "integration-cli") {
  return codePOST(
    jsonRequest("http://localhost/api/device/code", { label }, { "x-forwarded-for": IP })
  );
}

function pollToken(deviceCode: string, ip = IP) {
  return tokenPOST(
    jsonRequest(
      "http://localhost/api/device/token",
      { device_code: deviceCode },
      { "x-forwarded-for": ip }
    )
  );
}

/** Clear the RFC 8628 poll-interval gate so the next poll isn't a slow_down. */
async function backdatePoll(deviceCode: string) {
  await DeviceCode.updateOne(
    { deviceCode },
    { lastPolledAt: new Date(Date.now() - 60_000) }
  );
}

describe("device authorization flow (RFC 8628)", () => {
  test("issues a device_code + user_code pair", async () => {
    const res = await requestCode();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.device_code).toHaveLength(64);
    expect(body.user_code).toMatch(/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
    expect(body.verification_uri).toContain("/activate");
    expect(body.interval).toBeGreaterThan(0);
  });

  test("full flow: pending → slow_down → approved → token, single-use", async () => {
    const { device_code } = await (await requestCode()).json();

    // First poll: user hasn't approved yet.
    let res = await pollToken(device_code);
    expect((await res.json()).error).toBe("authorization_pending");

    // A re-poll inside the minimum interval violates the pacing gate. Pin
    // lastPolledAt to now so the assertion can't flake on a slow test run.
    await DeviceCode.updateOne(
      { deviceCode: device_code },
      { lastPolledAt: new Date() }
    );
    res = await pollToken(device_code);
    expect((await res.json()).error).toBe("slow_down");

    // Simulate the user approving the code at /activate.
    await DeviceCode.updateOne(
      { deviceCode: device_code },
      { status: "approved", userId: "user-device", userEmail: "dev@example.com" }
    );
    await backdatePoll(device_code);

    res = await pollToken(device_code);
    expect(res.status).toBe(200);
    const grant = await res.json();
    expect(grant.token_type).toBe("Bearer");
    expect(grant.access_token).toMatch(/^odin_[0-9a-f]{16}_[0-9a-f]{64}$/);
    expect(grant.account.email).toBe("dev@example.com");

    // The minted token authenticates as the approving user.
    expect(await validateApiToken(grant.access_token)).toBe("user-device");

    // A device_code is single-use: the second claim must fail.
    await backdatePoll(device_code);
    res = await pollToken(device_code);
    expect((await res.json()).error).toBe("invalid_grant");
  });

  test("denied approval yields access_denied", async () => {
    const { device_code } = await (await requestCode()).json();
    await DeviceCode.updateOne(
      { deviceCode: device_code },
      { status: "denied" }
    );
    const res = await pollToken(device_code);
    expect((await res.json()).error).toBe("access_denied");
  });

  test("expired or unknown device_code yields expired_token", async () => {
    const { device_code } = await (await requestCode()).json();
    await DeviceCode.updateOne(
      { deviceCode: device_code },
      { expiresAt: new Date(Date.now() - 1000) }
    );
    let res = await pollToken(device_code);
    expect((await res.json()).error).toBe("expired_token");

    res = await pollToken("0".repeat(64));
    expect((await res.json()).error).toBe("expired_token");
  });

  test("device/code is rate limited per IP", async () => {
    const floodIp = "10.2.0.99";
    let last: Response | null = null;
    // Limit is 10/min.
    for (let i = 0; i < 11; i++) {
      last = await codePOST(
        jsonRequest("http://localhost/api/device/code", {}, { "x-forwarded-for": floodIp })
      );
    }
    expect(last!.status).toBe(429);
  });
});
