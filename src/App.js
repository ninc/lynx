import React, { useState, useEffect } from "react";
import { Chart } from "react-google-charts";
import "./App.css";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
} from "@material-ui/core";
import firebase from "firebase/app";
import "firebase/auth";
import "firebase/database";

const config = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_DATABASE_URL,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
};

firebase.initializeApp(config);

let auth = firebase.auth();
auth
  .getRedirectResult()
  .then((result) => {
    console.log("AUTH OK", result);
  })
  .catch((error) => {
    console.log("AUTH ERROR", error);
  });

auth.onAuthStateChanged((user) => {
  if (user) {
    console.log("AUTH", user.email, user.uid);
  } else {
    console.log("NO AUTH");
  }
});

function login() {
  let provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithRedirect(provider);
}

function loginPassword(email, password) {
  firebase.auth().signInWithEmailAndPassword(email, password).catch(error => {
    console.log(error.message);
  });
}

function logout() {
  auth.signOut();
}
console.log(login, loginPassword);

function PriceChart(props) {
  return (
    <Chart
      width={"100%"}
      height={350}
      chartType="CandlestickChart"
      loader={<div>Loading</div>}
      data={[
        ["date", "open", "low", "high", "close"],
        ...props.data.map((p) => [
          p.date.replace("2020-", ""),
          p.low,
          p.open,
          p.close,
          p.high,
        ]),
      ]}
      options={{
        legend: "none",
        bar: { groupWidth: "80%" },
        candlestick: {
          fallingColor: { strokeWidth: 0, fill: "red" },
          risingColor: { strokWidth: 0, fill: "green" },
        },
      }}
      rootProps={{ "data-testid": "2" }}
    />
  );
}

let db = firebase.database();

const cols = ["", "Q1", "Q2", "Q3", "Q4", "Sum"];
const rows = ["revenue", "ebit", "margin", "result", "schablon", "eps"];
const row_title = [
  "Omsättning",
  "Rörelseresultat",
  "Rörelsemarginal",
  "Resultat efter finansnetto",
  "Vinst/aktie schablon",
  "Vinst/aktie redovisad",
];

const colsGrowth = [
  "År",
  "Omsättningstillväxt",
  "Rörelseresultatstillväxt",
  "Genomsnittsmarginal",
];

const colsSummary = [
  "År",
  "Omsättning",
  "Rörelseresultat",
  "Rörelsemarginal",
  "Omsättningstillväxt",
  "Utdelning",
];
const colsSummaryTooltip = [
  "",
  "Total försäljning i MSEK",
  "Vinst före räntor och skatter i MSEK (EBIT)",
  "Andel av omsättning som blir kvar för att täcka räntor och skatt samt vinst (rörelseresultat / omsättning). Ger en uppfattning om lönsamhet i företaget.",
  "Förändring av omsättning sedan föregående år",
  "",
];

function percent(x) {
  if (isNaN(x)) return "";
  if (!isFinite(x)) return "";
  return (x * 100).toFixed(2) + "%";
}

function calc(com) {
  let tax = 0.22;
  for (let i = 0; i < com.results.length; ++i) {
    let r = com.results[i];
    let last = i > 0 ? com.results[i - 1] : null;
    let shares = r.shares > 0 ? r.shares : com.results[i - 2].shares;
    r.margin = [];
    r.schablon = [];
    r.revenue_growth = [];
    r.ebit_growth = [];
    for (let q = 0; q < 5; ++q) {
      r.margin.push(r.ebit[q] / r.revenue[q]);
      r.revenue_growth.push(
        last ? r.revenue[q] / last.revenue[q] - 1 : undefined
      );
      r.ebit_growth.push(last ? r.ebit[q] / last.ebit[q] - 1 : undefined);
      r.schablon.push((r.result[q] * (1 - tax)) / shares);
    }
  }
}

function num(n) {
  return n.toFixed(2);
}

function getData(com, result, row, col) {
  if (col === 0) {
    let i = rows.indexOf(row);
    return row_title[i];
  }
  let quarter = col - 1;
  let r;
  let g;
  switch (row) {
    case "revenue":
    case "ebit":
      r = num(result[row][quarter]);
      g = percent(result[row + "_growth"][quarter]);
      return (
        <div>
          {r}
          <br />
          <b>{g}</b>
        </div>
      );
    case "result":
    case "eps":
      return num(result[row][quarter]);
    case "margin":
      return percent(result.margin[quarter]);
    case "schablon":
      return num(result.schablon[quarter]);
    default:
      return "bad row";
  }
}

function getDataSummary(com, r, i) {
  if (i < 3) return [r.year, num(r.revenue[4]), num(r.ebit[4])][i];
  if (i === 3) return percent(r.margin[4]);
  if (i === 4) {
    return percent(r.revenue_growth[4]);
  }
  if (i === 5) return r.dividend;
}

function getDataGrowth(com, r, i) {
  let last = com.results[com.results.length - 2];
  let diff = last.year - r.year;
  let yindex = com.results.findIndex((f) => f.year === r.year);
  if (diff <= 0) return "";
  switch (i) {
    case 0:
      return diff;
    case 1:
      return percent(Math.pow(last.revenue[4] / r.revenue[4], 1 / diff) - 1);
    case 2:
      return percent(Math.pow(last.ebit[4] / r.ebit[4], 1 / diff) - 1);
    case 3:
      let margins = com.results
        .map((r) => r.ebit[4] / r.revenue[4])
        .filter((f) => !isNaN(f));
      let avg = 0;
      margins = margins.slice(yindex);
      margins.forEach((m) => (avg += m));
      return percent(avg / margins.length);
    default:
      return "bad index";
  }
}

function getPrices(id) {
  return new Promise((resolve, reject) => {
    let prices = [];
    db.ref(`borsdata/instrument/${id}/stock_prices/stockPricesList`)
      .limitToLast(90)
      .once("value", (snapshot) => {
        snapshot.forEach((child) => {
          let p = child.val();
          prices.push({
            date: p.d,
            price: p.p,
            low: p.l,
            high: p.h,
            close: p.c,
            open: p.o,
            volume: p.v,
          });
        });
        resolve(prices);
      });
  });
}

function getInstrument(id) {
  let instrument = { results: [] };

  let pmeta = new Promise((resolve, reject) => {
    db.ref(`borsdata/metadata/instruments/${id}`).once("value", (snapshot) => {
      let obj = snapshot.val();
      instrument.name = obj.name;
      instrument.shortname = obj.ticker;
      instrument.isin = obj.isin;
    });
    resolve(instrument);
  });

  let pyear = new Promise((resolve, reject) => {
    let yearReports = [];
    db.ref(`borsdata/instrument/${id}/reports/reportsYear`).once(
      "value",
      (snapshot) => {
        let val = snapshot.val();
        val.forEach((y) => {
          yearReports.push({
            year: y.year,
            dividend: y.dividend,
            revenue: y.revenues,
            ebit: y.operating_Income,
            result: y.profit_Before_Tax,
            eps: y.earnings_Per_Share,
            shares: y.number_Of_Shares,
          });
        });
      }
    );
    resolve(yearReports);
  });

  return new Promise((resolve, reject) => {
    db.ref(`borsdata/instrument/${id}/reports/reportsQuarter`).once(
      "value",
      (snapshot) => {
        let val = snapshot.val();
        val.forEach((y) => {
          let result = instrument.results.find((r) => r.year === y.year);
          if (result === undefined) {
            result = {
              year: y.year,
              revenue: [0, 0, 0, 0, 0],
              ebit: [0, 0, 0, 0, 0],
              result: [0, 0, 0, 0, 0],
              eps: [0, 0, 0, 0, 0],
            };
            instrument.results.push(result);
          }
          let q = y.period - 1;
          result.revenue[q] = y.revenues;
          result.ebit[q] = y.operating_Income;
          result.result[q] = y.profit_Before_Tax;
          result.eps[q] = y.earnings_Per_Share;
        });
        pmeta.then((r) => {
          instrument = { ...instrument, ...r };
          pyear.then((py) => {
            py.forEach((y) => {
              let result = instrument.results.find((r) => r.year === y.year);
              if (result === undefined) {
                result = {
                  year: y.year,
                  revenue: [0, 0, 0, 0, 0],
                  ebit: [0, 0, 0, 0, 0],
                  result: [0, 0, 0, 0, 0],
                  eps: [0, 0, 0, 0, 0],
                };
                instrument.results.push(result);
              }
              result.dividend = y.dividend;
              result.revenue[4] = y.revenue;
              result.ebit[4] = y.ebit;
              result.result[4] = y.result;
              result.eps[4] = y.eps;
              result.shares = y.shares;
            });
            instrument.results.sort((a, b) => a.year - b.year);
            resolve(instrument);
          });
        });
      }
    );
  });
}

function emptyInstrument() {
  return {
    name: "...",
    shortname: "...",
    results: [],
  };
}

function table(com) {
  calc(com);
  return (
    <Box width="100%" margin={5}>
      <h2>{com.name}</h2>
      <h3>{com.shortname}</h3>
      <h3>
        Antal aktier:{" "}
        {com.results.length > 1
          ? com.results[com.results.length - 2].shares
          : 0}
        M
      </h3>

      <br />

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {colsSummary.map((c, i) => (
                <Tooltip key={c} title={colsSummaryTooltip[i]} arrow>
                  <TableCell key={c}>{c}</TableCell>
                </Tooltip>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {com.results.map((r) => (
              <TableRow key={r.year}>
                {colsSummary.map((c, i) => (
                  <TableCell key={c}>{getDataSummary(com, r, i)}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <br />

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {colsGrowth.map((c) => (
                <TableCell key={c}>{c}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {com.results.map((r) => (
              <TableRow key={r.year}>
                {colsGrowth.map((c, i) => (
                  <TableCell key={c}>{getDataGrowth(com, r, i)}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {com.results.map((r) => (
        <Box key={r.year}>
          <h2>{r.year}</h2>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {cols.map((c) => (
                    <TableCell key={c}>{c}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row}>
                    {cols.map((c, i) => (
                      <TableCell key={c}>{getData(com, r, row, i)}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ))}
    </Box>
  );
}

function App() {
  let [data, setData] = useState(emptyInstrument());
  let [prices, setPrices] = useState([]);

  useEffect(() => {
    getPrices(758).then((data) => {
      setPrices(data);
    });
    getInstrument(758).then((data) => {
      setData(data);
    });
  }, []);

  return (
    <div className="App">
      <PriceChart data={prices} />
      {table(data)}
    </div>
  );
}

export default App;
