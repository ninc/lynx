import React, { useState, useEffect } from "react";
import { Chart } from "react-google-charts";
import "./App.css";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  DialogContentText,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
} from "@material-ui/core";
import { DataGrid } from "@material-ui/data-grid";
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
const auth = firebase.auth();

function LoginDialog(props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const okClicked = () => {
    auth
      .signInWithEmailAndPassword(email, password)
      .then(() => setOpen(false))
      .catch((error) => {
        alert(error.message);
      });
  };

  const googleClicked = () => {
    let provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithRedirect(provider);
  };

  const logoutClicked = () => {
    auth.signOut();
    props.onLogout();
  };

  return (
    <div>
      {!props.isLoggedIn && (
        <Button
          variant="outlined"
          color="primary"
          onClick={() => setOpen(true)}
        >
          Login
        </Button>
      )}
      {props.loginName && <span>Logged in in as {props.loginName}</span>}
      {props.isLoggedIn && (
        <Button variant="outlined" color="primary" onClick={logoutClicked}>
          Logout
        </Button>
      )}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Login</DialogTitle>
        <DialogContent>
          <DialogContentText></DialogContentText>
          <Button variant="outlined" onClick={googleClicked}>
            Login with Google account
          </Button>
          <br />
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="dense"
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={okClicked} color="primary">
            Ok
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

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

function TopList(props) {
  const rowSelected = (r) => {
    props.onSelect(r.data.id);
  };

  const columns = [
    { field: "name", headerName: "Name", width: 300 },
    {
      field: "safety",
      headerName: "Margin of safety",
      width: 200,
      valueFormatter: ({ value }) => percent(value),
    },
    { field: "r12_pe", headerName: "PE", type: "number", width: 200 },
    {
      field: "expected_pe",
      headerName: "Expected PE",
      type: "number",
      width: 200,
    },
  ];
  const sortModel = [
    {
      field: "safety",
      sort: "desc",
    },
  ];
  return (
      <div style={{ height: 1000, width: "100%" }}>
        <DataGrid
          autoPageSize
          sortModel={sortModel}
          onRowSelected={rowSelected}
          rows={props.data}
          columns={columns}
        />
      </div>
  );
}

const db = firebase.database();

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
  "Utdelade kronor per aktie",
];

function percent(x) {
  if (isNaN(x) || !isFinite(x) || x === null) return "";
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
        last && r.revenue[q] !== null && last.revenue[q] !== null
          ? r.revenue[q] / last.revenue[q] - 1
          : null
      );
      r.ebit_growth.push(
        last && r.ebit[q] !== null && last.ebit[q] !== null
          ? r.ebit[q] / last.ebit[q] - 1
          : null
      );
      r.schablon.push(
        r.result[q] !== null && shares > 0
          ? (r.result[q] * (1 - tax)) / shares
          : null
      );
    }
  }
}

function num(n) {
  if (n === null || isNaN(n) || !isFinite(n)) {
    return "";
  }
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

function getRevenueGrowthSinceStart(com) {
  if (com.results.length < 5) return 0;
  const last = com.results[com.results.length - 2];
  const first = com.results[0];
  const diff = last.year - first.year;
  return Math.pow(last.revenue[4] / first.revenue[4], 1 / diff) - 1;
}

function getExpectedPE(com, expectedReturn) {
  const goal = getRevenueGrowthSinceStart(com) * 100;
  const revenueLevels = [0, 5, 10, 15, 20, 25];
  const peTable = {
    5: [10, 15, 22, 34, 51, 79],
    10: [8, 11, 15, 22, 32, 48],
    15: [6, 8, 11, 15, 21, 31],
    20: [5, 6, 8, 11, 15, 21],
    25: [4, 5, 6, 8, 11, 15],
  };
  const level = revenueLevels.reduce((prev, curr) =>
    Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev
  );
  return peTable[expectedReturn][revenueLevels.indexOf(level)];
}

function getDataGrowth(com, r, i) {
  const last = com.results[com.results.length - 2];
  const diff = last.year - r.year;
  const yindex = com.results.findIndex((f) => f.year === r.year);
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

async function getPrices(id, num) {
  let prices = [];
  let snapshot = await db
    .ref(`borsdata/instrument/${id}/stock_prices/stockPricesList`)
    .limitToLast(num)
    .once("value");
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
  return prices;
}

async function getPE(id) {
  let snapshot = await db.ref(`borsdata/calc/${id}`).once("value");
  let data = snapshot.val();
  const now = new Date().getTime();

  if (data && data.date && (now - data.date) < 12 * 60 * 60 * 1000) return data;
  else {
    return await calcPE(id);
  }
}

async function calcPE(id) {
  const prices = await getPrices(id, 1);
  const com = await getInstrument(id);

  const now = new Date().getTime();
  const price = prices[0].close;
  const r12_eps =
    com.results.length > 2
      ? [
          ...com.results[com.results.length - 2].eps.slice(0, 4),
          ...com.results[com.results.length - 1].eps.slice(0, 4),
        ]
          .filter((x) => x !== null)
          .slice(-4)
          .reduce((v, a) => v + a)
      : 0;
  const r12_pe = price / r12_eps;
  const expected_pe = getExpectedPE(com, 10);
  let safety = 1 - r12_pe / expected_pe;
  if (safety < 0 || safety > 1) safety = 0;

  const data = {
    r12_pe: r12_pe,
    expected_pe: expected_pe,
    safety: safety,
    date: now,
  };
  console.log(`Update ${id}`);
  db.ref(`borsdata/calc/${id}`).set(data);
  return data;
}

async function getQualityInstruments() {
  let promises = [];
  let snapshot = await db.ref("quality_instruments").once("value");
  snapshot.forEach((q) => {
    const instrument = q.val();
    promises.push(
      (async () => {
        const data = await getPE(instrument.insId);
        return {
          id: instrument.insId,
          name: instrument.name,
          ...data,
        };
      })()
    );
  });
  return await Promise.all(promises);
}

async function getInstrument(id) {
  let metasnapshot = await db
    .ref(`borsdata/metadata/instruments/${id}`)
    .once("value");
  let metaobj = metasnapshot.val();

  let instrument = {
    name: metaobj.name,
    shortname: metaobj.ticker,
    isin: metaobj.isin,
    results: [],
  };

  let yearsnapshot = await db
    .ref(`borsdata/instrument/${id}/reports/reportsYear`)
    .once("value");

  yearsnapshot.val().forEach((y) => {
    let result = instrument.results.find((r) => r.year === y.year);
    if (result === undefined) {
      result = {
        year: y.year,
        revenue: Array.from({ length: 5 }, () => null),
        ebit: Array.from({ length: 5 }, () => null),
        result: Array.from({ length: 5 }, () => null),
        eps: Array.from({ length: 5 }, () => null),
      };
      instrument.results.push(result);
    }
    result.dividend = y.dividend;
    result.revenue[4] = y.revenues;
    result.ebit[4] = y.operating_Income;
    result.result[4] = y.profit_Before_Tax;
    result.eps[4] = y.earnings_Per_Share;
    result.shares = y.number_Of_Shares;
  });

  let quartersnapshot = await db
    .ref(`borsdata/instrument/${id}/reports/reportsQuarter`)
    .once("value");

  quartersnapshot.val().forEach((y) => {
    let result = instrument.results.find((r) => r.year === y.year);
    if (result === undefined) {
      result = {
        year: y.year,
        revenue: Array.from({ length: 5 }, () => null),
        ebit: Array.from({ length: 5 }, () => null),
        result: Array.from({ length: 5 }, () => null),
        eps: Array.from({ length: 5 }, () => null),
      };
      instrument.results.push(result);
    }
    let q = y.period - 1;
    result.revenue[q] = y.revenues;
    result.ebit[q] = y.operating_Income;
    result.result[q] = y.profit_Before_Tax;
    result.eps[q] = y.earnings_Per_Share;
  });

  instrument.results.sort((a, b) => a.year - b.year);
  return instrument;
}

function emptyInstrument() {
  return {
    name: "...",
    shortname: "...",
    results: [],
  };
}

function StockInfoTable(props) {
  let com = props.data;
  let r12_eps =
    com.results.length > 2
      ? [
          ...com.results[com.results.length - 2].eps.slice(0, 4),
          ...com.results[com.results.length - 1].eps.slice(0, 4),
        ]
          .filter((x) => x !== null)
          .slice(-4)
          .reduce((v, a) => v + a)
      : 0;
  const price = props.prices[props.prices.length - 1].close;
  const date = props.prices[props.prices.length - 1].date;
  const r12_pe = price / r12_eps;
  const expected_pe = getExpectedPE(com, 10);
  const safety = 1 - r12_pe / expected_pe;

  const rev = [...com.results].reverse();

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
      <h3>
        Pris {date}: {price}
      </h3>
      <h3>Vinst/aktie senaste 4 kvartal: {num(r12_eps)}</h3>
      <h3>PE senaste 4 kvartal: {num(r12_pe)}</h3>
      <h3>Förväntad PE: {num(expected_pe)}</h3>
      <h3>Margin of safety: {percent(safety)}</h3>

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

      {rev.map((r) => (
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
  let [isLoggedIn, setIsLoggedIn] = useState("");
  let [loginName, setLoginName] = useState("");
  let [qualityInstruments, setQualityInstruments] = useState([]);
  let [selectedInstrument, setSelectedInstrument] = useState(null);

  useEffect(() => {
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
        setIsLoggedIn(true);
        setLoginName(user.email);
      } else {
        console.log("NO AUTH");
      }
    });
  }, []);

  useEffect(() =>  {
    if (isLoggedIn) {
      getQualityInstruments().then((data) => {
        setQualityInstruments(data);
      });
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (selectedInstrument !== null) {
      getPrices(selectedInstrument, 30).then((data) => {
        setPrices(data);
      });
      getInstrument(selectedInstrument).then((data) => {
        setData(data);
      });
    }
  }, [selectedInstrument]);

  const back = () => {
    setSelectedInstrument(null);
  };

  return (
    <div className="App">
      <LoginDialog
        isLoggedIn={isLoggedIn}
        loginName={loginName}
        onLogout={() => {
          setIsLoggedIn(false);
          setLoginName("");
        }}
      />
      {selectedInstrument && isLoggedIn && <Button onClick={back}>Back</Button>}
      {selectedInstrument && isLoggedIn && prices.length > 0 && (
        <StockInfoTable data={data} prices={prices} />
      )}
      {selectedInstrument && isLoggedIn && prices.length > 0 && (
        <PriceChart data={prices} />
      )}
      {selectedInstrument === null && (
        <TopList
          data={qualityInstruments}
          onSelect={(id) => setSelectedInstrument(id)}
        />
      )}
    </div>
  );
}

export default App;
