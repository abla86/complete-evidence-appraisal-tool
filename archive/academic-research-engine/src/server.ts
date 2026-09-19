import "dotenv/config";

import {
  createApp
} from "./api/http.js";

const app =
  createApp();

const port =
  Number(
    process.env.PORT || 4100
  );

app.listen(
  port,
  "0.0.0.0",
  () => {

    console.log(
      `Academic Research Engine running on http://localhost:${port}`
    );

  }
);
