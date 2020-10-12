import React from 'react';
import './App.css';
import { Box, Table, TableBody, TableCell, TableContainer,
         TableHead, TableRow, Paper } from '@material-ui/core';

const nil = {
  name: "Nilörngruppen B",
  shortname: "NIL B",
  isin: "SE0007100342",
  number_of_stocks: 11.4*10e6,
  results: [
    {
      year: 2011,
      revenue: [0, 0, 0, 0, 324],
      ebit: [0, 0, 0, 0, 42],
      result: [0, 0, 0, 0, 43.2],
      eps: [0, 0, 0, 0, 12.7]
    },
    {
      year: 2012,
      revenue: [0, 0, 0, 0, 333.4],
      ebit: [0, 0, 0, 0, 33],
      result: [0, 0, 0, 0, 33],
      eps: [0, 0, 0, 0, 8.78]
    },
    {
      year: 2013,
      revenue: [0, 0, 0, 0, 385.8],
      ebit: [0, 0, 0, 0, 43.7],
      result: [0, 0, 0, 0, 44],
      eps: [0, 0, 0, 0, 12.14]
    },
    {
      year: 2014,
      revenue: [90.6, 132.6, 108.2, 130, 461.4],
      ebit: [7,	19.3,	10.2,	15.20, 51.7],
      result: [7,	19,	10,	15.30, 51.3],
      eps: [2.07, 1.25, 0.74, 10.6, 14.64]
    },
    {
      year: 2015,
      revenue: [109.4, 152.6, 119.2, 145.9, 533.7],
      ebit: [4.7, 17.7, 8.8, 19.6, 50.8],
      result: [4.7, 17.4, 8.6, 19.4, 50.1],
      eps: [1.24, 1.16, 0.54, 0.48, 3.42]
    },
    {
      year: 2016,
      revenue: [119.7, 171.9, 144.6, 179.90, 616.1],
      ebit: [9.5, 25.9, 17.4, 22.20, 75],
      result: [9.4, 25.9, 17.3, 21.30, 73.9],
      eps: [0.64, 1.81, 1.13, 1.4, 4.93]
    },
    {
      year: 2017,
      revenue: [159.3, 192.4, 149.2, 185.6, 686.5],
      ebit: [17.5, 24.2, 15.3, 25.4, 82.4],
      result: [17.4, 23.9, 15.1, 25.8, 82.2],
      eps: [1.16, 1.62, 0.99, 1.9, 5.7]
    },
    {
      year: 2018,
      revenue: [156.1, 209.1, 177, 196.2, 738.4],
      ebit: [13.4, 27.3, 19.1, 25.4, 85.2],
      result: [12.4, 27.6, 17.9, 25.9, 83.8],
      eps: [0.82, 1.87, 1.21, 2.3, 6.2]
    },
    {
      year: 2019,
      revenue: [178.1, 195.7, 170.7, 176, 720.5],
      ebit: [15.1, 20.2, 19.3, 11.60, 66.2],
      result: [14.3, 19.5, 19.3, 9.9, 63],
      eps: [0.97, 1.32, 1.23, 0.62, 4.14]
    },
  ]
};

const cols = ['', 'Q1', 'Q2', 'Q3', 'Q4', 'Sum'];
const rows = ['revenue', 'ebit', 'margin', 'result', 'tax', 'schablon', 'eps'];
const row_title = ['Omsättning (MSEK)', 'Rörelseresultat (MSEK)', 'Rörelsemarginal',
    'Resultat efter finansnetto (MSEK)', 'Skattesats', 'Vinst/aktie schablon',
    'Vinst/aktie redovisad'];

const colsGrowth = ['År', 'Omsättningstillväxt',	'Rörelseresultatstillväxt', 'Genomsnittsmarginal'];

const colsSummary = ['År', 'Omsättning', 'Rörelseresultat', 'Marginal', 'Omsättningstillgångar'];

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
    r.margin = [];
    r.schablon = [];
    r.revenue_growth = [];
    r.ebit_growth = [];
    for (let q = 0; q < 5; ++q) {
      r.margin.push(r.ebit[q] / r.revenue[q]);
      r.revenue_growth.push(last ? r.revenue[q] / last.revenue[q] - 1 : undefined);
      r.ebit_growth.push(last ? r.ebit[q] / last.ebit[q] - 1 : undefined);
      r.schablon.push((r.result[q] * (1 - tax)) * 10e6 / com.number_of_stocks);
    }
  }
}

function getData(com, result, row, col) {
  if (col === 0) {
    let i = rows.indexOf(row);
    return row_title[i];
  }
  let quarter = col - 1;
  switch (row) {
  case 'revenue':
  case 'ebit':
    let r = result.[row][quarter];
    let g = percent(result.[row + '_growth'][quarter]);
    return <div>{r}<br/><b>{g}</b></div>;
  case 'result':
  case 'eps':
    return result.[row][quarter];
  case 'margin':
    return percent(result.margin[quarter]);
  case 'tax':
    return percent(0.22);
  case 'schablon':
    return result.schablon[quarter].toFixed(2);
  default:
    return 'bad row';
  }
}

function getDataSummary(com, r, i) {
  if (i < 3)
    return [r.year, r.revenue[4], r.ebit[4]][i];
  if (i === 3)
    return percent(r.margin[4]);
  if (i === 4) {
    return percent(r.revenue_growth[4]);
  }
}

function getDataGrowth(com, r, i)
{
  let last = com.results[com.results.length - 1];
  let diff = last.year - r.year;
  let yindex = com.results.findIndex(f => f.year === r.year);
  switch (i) {
    case 0:
      return last.year - r.year;
    case 1:
      return percent(Math.pow(last.revenue[4] / r.revenue[4], 1 / diff) - 1);
    case 2:
      return percent(Math.pow(last.ebit[4] / r.ebit[4], 1 / diff) - 1);
    case 3:
      let margins = com.results.map(r => r.ebit[4] / r.revenue[4]).filter(f => !isNaN(f));
      let avg = 0;
      margins = margins.slice(yindex);
      margins.forEach(m => avg += m);
      return percent(avg / margins.length);
    default:
      return 'bad index';
  }
}

function table(com) {
  calc(com);
  return (
    <Box width="50%" margin={5}>
    <h2>{com.name}</h2>
    <h3>{com.shortname}</h3>
    <h3>Antal aktier: {com.number_of_stocks / 10e6}M</h3>

    <br/>

    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {colsSummary.map(c => (
              <TableCell key={c}>{c}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
        {com.results.map(r =>
          <TableRow key={r.year}>
          {colsSummary.map((c, i) => (
            <TableCell key={c}>{getDataSummary(com, r, i)}</TableCell>
          ))}
          </TableRow>
        )}
        </TableBody>
      </Table>
    </TableContainer>

    <br/>

    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {colsGrowth.map(c =>
              <TableCell key={c}>{c}</TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
        {com.results.map(r =>
          <TableRow key={r.year}>
          {colsGrowth.map((c, i) =>
            <TableCell key={c}>{getDataGrowth(com, r, i)}</TableCell>
          )}
          </TableRow>
        )}
        </TableBody>
      </Table>
    </TableContainer>

    {com.results.map(r => (
    <Box key={r.year}>
    <h2>{r.year}</h2>
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {cols.map(c =>
              <TableCell key={c}>{c}</TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
        {rows.map(row =>
          <TableRow key={row}>
          {cols.map((c, i) =>
            <TableCell key={c}>{getData(com, r, row, i)}</TableCell>
          )}
          </TableRow>
        )}
        </TableBody>
      </Table>
    </TableContainer>
    </Box>
  ))}
  </Box>
  );
}

function App() {
  return (
    <div className="App">
      {table(nil)}
    </div>
  );
}

export default App;
