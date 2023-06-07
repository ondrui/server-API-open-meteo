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

const sql = `SELECT * FROM ${tabName} WHERE request_time > '2023-06-07 10:02:02' LIMIT 4;`;
connection.query(sql, function (err, result) {
  if (err) throw err;
  console.log(result);
});

closeConnectionDb();
