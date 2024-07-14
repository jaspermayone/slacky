import * as dotenv from "dotenv";
dotenv.config();

import { App, ExpressReceiver } from "@slack/bolt";
import colors from "colors";
import express from "express";

import { indexEndpoint } from "./endpoints";
import { healthEndpoint } from "./endpoints/health";
import { t } from "./lib/templates";
import { blog, slog } from "./util/Logger";

const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET!,
});

const app = new App({
  token: process.env.SLACK_BOT_TOKEN!,
  appToken: process.env.SLACK_APP_TOKEN!,
  signingSecret: process.env.SLACK_SIGNING_SECRET!,
  receiver,
});

const xoxc = process.env.MAX_SLACK_BROWSER_TOKEN!;
const xoxd = process.env.MAX_SLACK_COOKIE!;
const cookie = `d=${xoxd}`;

app.event(/.*/, async ({ event, client }) => {
  try {
    switch (event.type) {
      case "team_join":
        break;
    }
  } catch (error) {
    blog(`Error in event handler: ${error}`, "error");
  }
});

app.action(/.*?/, async (args) => {
  try {
    const { ack, respond, payload, client, body } = args;
    const user = body.user.id;

    await ack();

    // @ts-ignore
    switch (payload.action_id) {
      case "initial":
        break;
    }
  } catch (error) {
    blog(`Error in action handler: ${error}`, "error");
  }
});

app.command(/.*?/, async ({ ack, body, client }) => {
  try {
    await ack();

    switch (body.command) {
      case "/toggle-visibility":
        // get the user who sent the command
        const user = body.user_id;

        // get the channel where the command was sent
        const channel = body.channel_id;

        // check if the bot is in the channel
        const channelMembers = await client.conversations.members({
          channel: channel,
        });

        // get the visibility of the channel
        const visibility = await client.conversations.info({
          channel: channel,
        });

        // get the visibility of the channel
        const isPrivate = visibility.channel?.is_private;

        // send a message to the channel
        await client.chat.postMessage({
          channel: channel,
          text: `The channel is ${isPrivate ? "private" : "public"}`,
        });

        // change the visibility of the channel

        if (isPrivate) {
          let form = new URLSearchParams();
          form.append("token", xoxc);
          form.append("channel", channel);

          await fetch(
            `https://hackclub.slack.com/api/conversations.convertToPublic`,
            {
              headers: { cookie, "User-Agent": "jasper@hacklub.com" },
              body: form,
              method: "POST",
            }
          );
        } else {
        }

        break;
    }
  } catch (error) {
    console.log(error);
    blog(`Error in command handler: ${error}`, "error");
  }
});

receiver.router.use(express.json());
receiver.router.get("/", indexEndpoint);
receiver.router.get("/ping", healthEndpoint);
receiver.router.get("/up", healthEndpoint);

const logStartup = async (app: App) => {
  let env = process.env.NODE_ENV;
  slog(t("app.startup", { environment: env }), "info");
};

app.start(process.env.PORT || 3000).then(async () => {
  await logStartup(app);
  console.log(
    colors.bgCyan(`⚡️ Bolt app is running in env ${process.env.NODE_ENV}`)
  );
});

const client: any = app.client;
export { app, client };
