import "dotenv/config";
import { createConnection } from "mysql2/promise";

const model = "best_match, hmn";
const reqTime = "2023-06-22 06:00:02";

/**
 * Function query data mysql.
 * @param model Weather model name.
 * @param reqTime API request time.
 * @returns Data object.
 */
export const query = async (model, reqTime) => {
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
  const sql = `SELECT
      request_time,
      runtime,
      ROUND(temperature_2m, 2) AS temp,
      model
    FROM
      data
    WHERE
      (request_time = '2023-06-19 12:00:02' AND model='hmn')
      OR
      (request_time = '2023-06-19 12:00:02' AND model='ecmwf_ifs04')
      OR
      (request_time = '2023-06-19 18:00:02' AND model='icon_global')
      OR
      (request_time = '2023-06-20 00:00:02' AND model='icon_global')
      OR
      (request_time = '2023-06-20 06:00:02' AND model='hmn')
    ORDER BY
      runtime`;
  // const sqlOld = `SELECT runtime, ROUND(temperature_2m, 2) AS temp, model FROM ${tabName} WHERE request_time = '${reqTime}' AND model IN ("best_match", "hmn", "icon_global", "gfs_global", "ecmwf_ifs04") ORDER BY runtime`;
  const [rows] = await connection.execute(sql).catch((error) => {
    throw error;
  });
  if (rows.length === 0) console.log("Empty rows! Check query params!");
  await connection.end();
  return {
    data: rows ?? [],
    model,
  };
};
export const result = await query(model, reqTime);
