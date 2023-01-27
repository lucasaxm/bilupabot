import * as dotenv from "dotenv"
dotenv.config();

const {
  PORT,
  BOT_TOKEN: token,
  WEBHOOK_DOMAIN: webhookDomain,
  SERPAPI_KEY: serpApiKey
} = process.env;

// default to port 4000 if PORT is not set
const port = Number(PORT) || 4000;

// assert and refuse to start bot if token or webhookDomain is not passed
if (!token) throw new Error('"BOT_TOKEN" env var is required!');
if (!webhookDomain) throw new Error('"WEBHOOK_DOMAIN" env var is required!');
if (!serpApiKey) throw new Error('"SERPAPI_KEY" env var is required!');

import { Telegraf } from "telegraf";
import { InlineQueryResult } from "telegraf/types";
import { config, getJson } from "serpapi";
import type { GoogleParameters } from "serpapi";

config.api_key = serpApiKey;
config.timeout = 10000;

const bot = new Telegraf(token);

bot.on("inline_query", async ctx => {
  console.log('received query', ctx.inlineQuery.query);
  if (ctx.inlineQuery.query.length <= 1) {
    ctx.answerInlineQuery([{
      type: "article",
      id: '1',
      title: 'Type your query',
      input_message_content: {
        message_text: 'É O VIRUS QUE DEIXA COM ALEMTA GRANDE'
      }
    }]);
    return;
  }
  const searchParams = {
    q: ctx.inlineQuery.query,
    tbm: "isch",
    ijn: "0"
  } satisfies GoogleParameters;
  return getJson("google", searchParams).then((response) => {
    const images = (response["images_results"] as {
      position: number,
      original: string,
      thumbnail: string
    }[]);
    const inlineResults = images.slice(0, 50).map((image): InlineQueryResult => {
      return {  /** Type of the result, must be photo */
        type: "photo",
        id: image.position.toString(),
        photo_url: image.original,
        thumb_url: image.thumbnail
      }
    });
    console.log(`${inlineResults.length} inlineResults for query ${ctx.inlineQuery.query}.`);
    return inlineResults;
  }).then(inlineResults => {
    console.log('answered query', ctx.inlineQuery.query);
    return ctx.answerInlineQuery(inlineResults)
  });
});

bot.on("chosen_inline_result", ({ chosenInlineResult }) => {
  console.log("chosen inline result", chosenInlineResult);
});

// Start webhook via launch method (preferred)
bot.launch({
  webhook: {
    domain: webhookDomain,
    port: port
  }
}).then(() => console.log(`Webhook bot listening on ${port} and domain ${webhookDomain}`));
