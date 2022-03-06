import { withSentry, captureException } from "@sentry/nextjs";
import { NextApiHandler } from "next";
import * as URL from "url";

// Change host appropriately if you run your own Sentry instance.
const sentryHost = "sentry.io";

// Set knownProjectIds to an array with your Sentry project IDs which you
// want to accept through this proxy.
const knownProjectIds = [process.env.SENTRY_PROJECT_ID as string];

const sentryHandler: NextApiHandler = async (req, res) => {
  try {
    const envelope = req.body;
    const pieces = envelope.split("\n");

    const header = JSON.parse(pieces[0]);

    const { host, path } = URL.parse(header.dsn);
    if (!host?.endsWith(sentryHost)) {
      throw new Error(`invalid host: ${host}`);
    }

    const projectId = path?.endsWith("/") ? path.slice(0, -1) : path;
    if (!knownProjectIds.includes(projectId as string)) {
      throw new Error(`invalid project id: ${projectId}`);
    }
    if (process.env.NODE_ENV === "development") {
      return void res.status(200).end();
    }

    const url = `https://${sentryHost}/api${projectId}/envelope/`;
    const response = await fetch(url, {
      method: "POST",
      body: envelope,
    });
    return res.status(response.status).json(response.json());
  } catch (e) {
    console.error(e);
    captureException(e);
    return res.status(400).json({ status: "invalid request" });
  }
};

export default withSentry(sentryHandler);
