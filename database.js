import "dotenv/config";
import { createConnection } from "mysql2/promise";

const model = "best_match, hmn";
const runTime = "2023-06-22 06:00:02";

/**
 * Function query data mysql.
 * @param model Weather model name.
 * @param runTime API runtime.
 * @returns Data object.
 */
export const query = async (model) => {
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
  console.log("start");
  // db table name
  const tabName = "data";
  let str = "";
  const dataFromFront = [
    { model: "hmn", runTime: "2023-06-27 06:00:02" },
    { model: "best_match", runTime: "2023-06-27 06:00:02" },
    { model: "ecmwf_ifs04", runTime: "2023-06-27 06:00:02" },
    { model: "gem_global", runTime: "2023-06-27 06:00:02" },
    { model: "gfs_global", runTime: "2023-06-27 06:00:02" },
    { model: "icon_eu", runTime: "2023-06-27 06:00:02" },
    { model: "icon_global", runTime: "2023-06-27 06:00:02" },
    { model: "jma_gsm", runTime: "2023-06-27 06:00:02" },
    { model: "meteofrance_arpege_europe", runTime: "2023-06-27 06:00:02" },
    { model: "meteofrance_arpege_world", runTime: "2023-06-27 06:00:02" },
  ];
  // dataFromFront.forEach(
  //   ({ model, runTime }) =>
  //     (str += `(runtime="${runTime}" AND model="${model}") OR `)
  // );
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

  const sqlModelPoint = `SELECT
      runtime,
      forecast_time,
      ROUND(temperature_2m, 2) AS temp,
      model
    FROM
      ${tabName}
    WHERE
      (forecast_time = '2023-06-27 10:00:00' AND model='hmn')
    ORDER BY
      forecast_time`;

  const sqlRuntime = `SELECT
      runtime,
      forecast_time,
      ROUND(temperature_2m, 2) AS temp,
      model
    FROM
      ${tabName}
    WHERE
      runtime = '2023-06-27 06:00:02'
    ORDER BY
      forecast_time`;

  const [rows] = await connection.execute(sqlModelPoint).catch((error) => {
    throw error;
  });
  if (rows.length === 0) console.log("Empty rows! Check query params!");
  await connection.end();
  return {
    data: rows ?? [],
  };
};
export const result = await query(model);
