import { ImageResponse } from "@vercel/og";
import type { NextApiRequest } from "next";
import type { SatoriOptions } from "satori";
import { z } from "zod";

import { Meeting, App, Generic } from "@calcom/lib/OgImages";

const calFont = fetch(new URL("../../../../public/fonts/cal.ttf", import.meta.url)).then((res) =>
  res.arrayBuffer()
);

// customRemove
/*const interFont = fetch(new URL("../../../../public/fonts/Inter-Regular.ttf", import.meta.url)).then((res) =>
  res.arrayBuffer()
);

const interFontMedium = fetch(new URL("../../../../public/fonts/Inter-Medium.ttf", import.meta.url)).then(
  (res) => res.arrayBuffer()
);*/
// end customRemove

export const config = {
  runtime: "edge",
};

const meetingSchema = z.object({
  imageType: z.literal("meeting"),
  title: z.string(),
  names: z.string().array(),
  usernames: z.string().array(),
  meetingProfileName: z.string(),
  meetingImage: z.string().nullable().optional(),
});

const appSchema = z.object({
  imageType: z.literal("app"),
  name: z.string(),
  description: z.string(),
  slug: z.string(),
});

const genericSchema = z.object({
  imageType: z.literal("generic"),
  title: z.string(),
  description: z.string(),
});

export default async function handler(req: NextApiRequest) {
  const { searchParams } = new URL(`${req.url}`);
  const imageType = searchParams.get("type");

  // customRemove
  const [calFontData] = await Promise.all([calFont]);
  const ogConfig = {
    width: 1200,
    height: 630,
    fonts: [
      // customRemove { name: "inter", data: interFontData, weight: 400 },
      // customRemove { name: "inter", data: interFontMediumData, weight: 500 },
      { name: "cal", data: calFontData, weight: 400 },
      { name: "cal", data: calFontData, weight: 600 },
    ] as SatoriOptions["fonts"],
  };

  switch (imageType) {
    case "meeting": {
      const { names, usernames, title, meetingProfileName, meetingImage } = meetingSchema.parse({
        names: searchParams.getAll("names"),
        usernames: searchParams.getAll("usernames"),
        title: searchParams.get("title"),
        meetingProfileName: searchParams.get("meetingProfileName"),
        meetingImage: searchParams.get("meetingImage"),
        imageType,
      });

      const img = new ImageResponse(
        (
          <Meeting
            title={title}
            profile={{ name: meetingProfileName, image: meetingImage }}
            users={names.map((name, index) => ({ name, username: usernames[index] }))}
          />
        ),
        ogConfig
      ) as { body: Buffer };

      return new Response(img.body, { status: 200, headers: { "Content-Type": "image/png" } });
    }
    case "app": {
      const { name, description, slug } = appSchema.parse({
        name: searchParams.get("name"),
        description: searchParams.get("description"),
        slug: searchParams.get("slug"),
        imageType,
      });
      const img = new ImageResponse(<App name={name} description={description} slug={slug} />, ogConfig) as {
        body: Buffer;
      };

      return new Response(img.body, { status: 200, headers: { "Content-Type": "image/png" } });
    }

    case "generic": {
      const { title, description } = genericSchema.parse({
        title: searchParams.get("title"),
        description: searchParams.get("description"),
        imageType,
      });

      const img = new ImageResponse(<Generic title={title} description={description} />, ogConfig) as {
        body: Buffer;
      };

      return new Response(img.body, { status: 200, headers: { "Content-Type": "image/png" } });
    }

    default:
      return new Response("What you're looking for is not here..", { status: 404 });
  }
}
