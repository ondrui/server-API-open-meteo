import express from "express";
import createError from "http-errors";
import { createConnection } from "mysql2/promise";
import "dotenv/config";

const port = process.env.PORT ?? 3002;
const app = express();

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.set("view engine", "ejs");
// db table name
const tabName = "data";

const connection = await createConnection({
  host: process.env.HOST,
  user: process.env.USER_DB,
  password: process.env.PASSWORD_DB,
  database: process.env.NAME_DB,
  timezone: process.env.TIMEZONE_DB,
});

connection.ping(function (err) {
  if (err) throw err;
  console.log("Server responded to ping");
});

/** CORS setting with OPTIONS pre-flight handling */
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, accept, access-control-allow-origin"
  );

  if ("OPTIONS" == req.method) res.sendStatus(200);
  else next();
});

/**
 * GET some models, one runtime
 */
app.get("/models", async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  /**
   * Function query data mysql.
   * @param model Weather model name.
   * @param runTime API runtime.
   * @returns Data object.
   */
  const query = async () => {
    let str = "";
    const dataFromFront = [
      { model: "hmn", runTime: "2023-06-28 06:00:02" },
      { model: "best_match", runTime: "2023-06-28 06:00:02" },
      { model: "ecmwf_ifs04", runTime: "2023-06-28 06:00:02" },
      { model: "gem_global", runTime: "2023-06-28 06:00:02" },
      { model: "gfs_global", runTime: "2023-06-28 06:00:02" },
      { model: "icon_eu", runTime: "2023-06-28 06:00:02" },
      { model: "icon_global", runTime: "2023-06-28 06:00:02" },
      { model: "jma_gsm", runTime: "2023-06-28 06:00:02" },
      { model: "meteofrance_arpege_europe", runTime: "2023-06-28 06:00:02" },
      { model: "meteofrance_arpege_world", runTime: "2023-06-28 06:00:02" },
    ];
    dataFromFront.forEach(
      ({ model, runTime }) =>
        (str += `(runtime="${runTime}" AND model="${model}") OR `)
    );
    str = str.slice(0, -4);
    const sqlModelRuntime = `
    SELECT
      runtime,
      forecast_time,
      ROUND(temperature_2m, 2) AS temp,
      model
    FROM
      ${tabName}
    WHERE
      ${str}
    ORDER BY
      forecast_time
      `;

    const [rows] = await connection.execute(sqlModelRuntime).catch((error) => {
      throw error;
    });
    if (rows.length === 0) console.log("Empty rows! Check query params!");
    // await connection.end();
    return rows ?? [];
  };

  try {
    const result = await query();
    res.json(result);
  } catch (err) {
    console.error(`Error while query forecast_time`, err.message);
    next(err);
  }
});

/**
 * POST all models, one runtime
 */
// app.get("/runtime", (req, res) => {
//   res.set("Access-Control-Allow-Origin", "*");
//   res.send(result);
// });

/**
 * POST one models, one forecast time --> all runtime
 */
app.post("/forecast_time", async (req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  const { model, forecast_time } = req.body;

  const query = async (str) => {
    const [rows] = await connection.execute(str).catch((error) => {
      throw error;
    });
    if (rows.length === 0) console.log("Empty rows! Check query params!");
    // await connection.end();
    return rows ?? [];
  };
  /**
   * First query gets list runtime.
   */
  const sqlFirst = `SELECT
      runtime
    FROM
      ${tabName}
    WHERE
      (forecast_time = '${forecast_time}' AND model='${model}')
    ORDER BY
      forecast_time`;

  const listRuntime = await query(sqlFirst);

  /**
   * Second query base on result from first query.
   */
  let queryStr = "";
  listRuntime.forEach((v) => (queryStr += `"${v.runtime.toISOString()}", `));
  queryStr = queryStr.slice(0, -2);

  const sqlSecond = `
    SELECT
      runtime,
      forecast_time,
      ROUND(temperature_2m, 2) AS temp,
      model
    FROM
      ${tabName}
    WHERE
      runtime IN (${queryStr}) AND model='${model}'
    ORDER BY
      forecast_time`;

  const result = await query(sqlSecond);

  // await connection.end();

  try {
    res.json(result);
  } catch (err) {
    console.error(`Error while query forecast_time`, err.message);
    next(err);
  }
});

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
