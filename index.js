import { error } from "console";
import { connection } from "./database.js";
import Highcharts from 'highcharts';

// db table name
const tabName = "data_copy";

// Terminating a connection db gracefully.
const closeConnectionDb = () => {
  connection.end(function (err) {
    if (err) {
      return console.log('error:' + err.message);
    }
    console.log('Close the database connection.');
  });
};

const sql = `SELECT runtime, ROUND(temperature_2m, 2) AS temp FROM ${tabName} WHERE request_time = "2023-06-07 10:02:02" AND model = "best_match" ORDER BY runtime`;
const [results] = await connection.execute(sql).catch(error => { throw error });

results.forEach(v => console.log(v));

closeConnectionDb();
