

// Your web app's Firebase configuration
var firebaseConfig = {
  apiKey: "",
  authDomain: "",
  databaseURL: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: ""
};

var default_color = "#1abc9c";

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
var db = firebase.database();
var production_data;
var production_data_ready = false;
var running = false;
var data_entry = {
      board_production_date : "",
      label_print_result : "",
      mac : "",
      lan7801_sw_version : "",
      lan7801_flash_result : "",
      mechanics_production_date : "",
      stm32_sw_version : "",
      stm32_flash_result : "",
      com_test1_result : "",
      led_test_result : "",
      testing_date : "",
      usb_serial : ""
    };


const production_states = {
    STATE_FLASH_LAN7801: 'STATE_FLASH_LAN7801',
    STATE_FLASH_STM32: 'STATE_FLASH_STM32',
    STATE_COM_TEST1: 'STATE_COM_TEST1',
    STATE_MASTER_SLAVE_BTN: 'MASTER_SLAVE_BTN',
    STATE_LED_TEST: 'STATE_LED_TEST',
    STATE_PRINT_LABEL: 'STATE_PRINT_LABEL',
    STATE_UPLOAD_RESULTS: 'STATE_UPLOAD_RESULTS',
    STATE_IDLE: 'STATE_IDLE',
    STATE_START_PRODUCTION: 'STATE_START_PRODUCTION',
    STATE_ERROR: 'STATE_ERROR',
    STATE_WAITING: 'STATE_WAITING'
}

var production_state = production_states.STATE_IDLE

document.addEventListener('DOMContentLoaded', function () {
    set_colors("red");
    read_all_production_data();
}, false);

function clear_fields() {

  var mechanics_date = data_entry.mechanics_production_date;
  var board_date = data_entry.board_production_date;

  data_entry = {
    board_production_date : board_date,
    label_print_result : "",
    mac : "",
    lan7801_sw_version : "",
    lan7801_flash_result : "",
    mechanics_production_date : mechanics_date,
    stm32_sw_version : "",
    stm32_flash_result : "",
    com_test1_result : "",
    led_test_result : "",
    testing_date : "",
    usb_serial : ""
  };

  set_colors(default_color);
  change_production_state(production_states.STATE_IDLE);
  update_production_data_fields(data_entry);
}

function set_colors(color) {
  change_color("clear_btn", color);
  change_color("start_btn", color);
  change_color("flash_lan7801_btn", color);
  change_color("flash_stm32_btn", color);
  change_color("com_test1_btn", color);
  change_color("led_test_btn", color);
  change_color("label_print_btn", color);
  change_color("upload_test_results_btn", color);

}

function update_production_data_fields() {
  //This is a purely visual function

  document.getElementById("mac_input").value = data_entry.mac;
  document.getElementById("board_production_date_input").value = data_entry.board_production_date;
  document.getElementById("label_print_result_input").value = data_entry.label_print_result;
  document.getElementById("lan7801_sw_version_input").value = data_entry.lan7801_sw_version;
  document.getElementById("lan7801_flash_result_input").value = data_entry.lan7801_flash_result;
  document.getElementById("mechanics_production_date_input").value = data_entry.mechanics_production_date;
  document.getElementById("stm32_sw_version_input").value = data_entry.stm32_sw_version;
  document.getElementById("stm32_flash_result_input").value = data_entry.stm32_flash_result;
  document.getElementById("com_test1_result_input").value = data_entry.com_test1_result;
  document.getElementById("led_test_result_input").value = data_entry.led_test_result;
  document.getElementById("testing_date_input").value = data_entry.testing_date;
  document.getElementById("usb_serial_input").value = data_entry.usb_serial;
}

function change_production_state(new_state) {

  if(!production_state){
      throw new Error('production_state is not defined');
  }
  production_state = new_state;
  console.log(new_state);
}

function start_production_test_old() {

  console.log("Step 0");
  if (!add_board_production_date())
    return;
  if (!add_mechanics_production_date())
    return;
  if (!add_testing_date())
    return;
  if (!get_mac())
    return;
  update_production_data_fields();

  console.log(data_entry);

  console.log("Step 1");
  flash_lan7801();

  console.log("Step 2");
  flash_stm32();

  console.log("Step 3");
  com_test1();

  console.log("Step 7");
  led_test();

  console.log("Step 8");
  print_label();

  console.log("Step 9");
  upload_test_results();

  change_color("start_btn", "green");
}


async function production_state_handler() {

  switch(production_state){
    case production_states.STATE_FLASH_LAN7801:
      console.log("Step 1");
      await flash_lan7801();
      break;
    case production_states.STATE_FLASH_STM32:
      console.log("Step 2");
      await flash_stm32();
      break;
    case production_states.STATE_COM_TEST1:
      console.log("Step 3");
      await com_test1();
      break;
    case production_states.STATE_LED_TEST:
      console.log("Step 7");
      await waitUserInput(production_states.STATE_PRINT_LABEL);
      break;
    case production_states.STATE_PRINT_LABEL:
      console.log("Step 8");
      await waitUserInput(production_states.STATE_UPLOAD_RESULTS);
      break;
    case production_states.STATE_UPLOAD_RESULTS:
      console.log("Step 9");
      await upload_test_results();
      break;
    case production_states.STATE_ERROR:
      change_color("start_btn", "red");
      running = false;
      return false;
    default:
      change_color("start_btn", "green");
      running = false;
      return true;
  }
}

const timeout = async ms => new Promise(res => setTimeout(res, ms));

async function waitUserInput(state) {
  while(production_state != state && production_state != production_states.STATE_ERROR) await timeout(50);
}


async function start_production_test() {

  change_production_state(production_states.STATE_START_PRODUCTION);

  console.log("Step 0");
  if (!add_board_production_date())
    return;
  if (!add_mechanics_production_date())
    return;
  if (!add_testing_date())
    return;
  if (!get_mac())
    return;
  update_production_data_fields();

  change_production_state(production_states.STATE_FLASH_LAN7801);

  running = true;
  while(running) {

    await production_state_handler();
  }

}


function add_board_production_date(){

  var board_date = document.getElementById("board_production_date_input").value;

  var date = Date.parse(board_date);

  if (isNaN(date) == false) {
    console.log("Found valid board_production_date: " + board_date)
    data_entry.board_production_date = board_date;
    return true;
  }
  else
  {
    console.log("Invalid board_production_date: " + board_date)
    change_color("start_btn", "red");
    return false;
  }
}

function add_mechanics_production_date(){

  var mechanics_date = document.getElementById("mechanics_production_date_input").value;

  var date = Date.parse(mechanics_date);

  if (isNaN(date) == false) {
    console.log("Found valid mechanics_production_date: " + mechanics_date)
    data_entry.mechanics_production_date = mechanics_date;
    return true;
  }
  else
  {
    console.log("Invalid mechanics_production_date: " + mechanics_date)
    change_color("start_btn", "red");
    return false;
  }
}

function add_testing_date() {

  var current_date = new Date().toISOString().slice(0,10);

  data_entry.testing_date = current_date;

  return true;
}

function get_mac() {

  var mac_addr = document.getElementById("mac_input").value;

  if (mac_addr == "") {
    console.log("Finding next available mac address");
    find_next_free_mac_address();
    return true;
  }
  else
  {
    console.log("Using provided mac_addr: " + mac_addr);
    data_entry.mac = mac_addr;
    return true;
  }

}

async function flash_lan7801() {

  console.log("flash_lan7801");
  var lan7801_sw_version = "2.0";
  var usb_serial = data_entry.mac;

  //Remove : from the mac_string
  usb_serial = usb_serial.replace(/:+/g, '');

  var fetch_str = 'http://localhost:3000/lan7801/mac/' + data_entry.mac + '/serial/' + usb_serial;

  console.log(data_entry.mac);
  console.log(usb_serial);
  console.log(fetch_str);

  const response = await fetch(fetch_str);
  console.log(response);
  const json = await response.json(); //DET GÅR DÅLIGT HÄR
  console.log(json);

  var result = json.status;

  if (result) {
    console.log("Successfully flashed lan7801: " + lan7801_sw_version);
    data_entry.lan7801_sw_version = lan7801_sw_version;
    data_entry.lan7801_flash_result = "PASSED";
    data_entry.usb_serial = usb_serial;
    change_production_state(production_states.STATE_FLASH_STM32);
    change_color("flash_lan7801_btn", "green");
  }
  else
  {
    console.log("Failed to flashed lan7801: " + lan7801_sw_version);
    data_entry.lan7801_sw_version = lan7801_sw_version;
    data_entry.lan7801_flash_result = "FAILED";
    data_entry.usb_serial = usb_serial;
    change_production_state(production_states.STATE_ERROR);
    change_color("flash_lan7801_btn", "red");
  }

  update_production_data_fields(data_entry);
  return result;
}

async function flash_stm32() {

  console.log("flash_stm32");
  const response = await fetch('http://localhost:3000/stm32');
  const json = await response.json();
  console.log(json);

  var result = json.status;
  var stm32_sw_version = "1.0";

  if (result) {
    console.log("Successfully flashed stm32: " + stm32_sw_version);
    data_entry.stm32_sw_version = stm32_sw_version;
    data_entry.stm32_flash_result = "PASSED";
    change_production_state(production_states.STATE_COM_TEST1);
    change_color("flash_stm32_btn", "green");
    return true;
  }
  else
  {
    console.log("Failed to flashed stm32: " + stm32_sw_version);
    data_entry.stm32_sw_version = stm32_sw_version;
    data_entry.stm32_flash_result = "FAILED";
    change_production_state(production_states.STATE_ERROR);
    change_color("flash_stm32_btn", "red");
    return false;
  }

  update_production_data_fields(data_entry);
}

async function com_test1() {

  console.log("com_test1");

  const response = await fetch('http://localhost:3000/iperf');
  const json = await response.json();
  console.log(json);

  var result = json.status;

  if (result) {
    console.log("Passed com_test1");
    data_entry.com_test1_result = "PASSED";
    change_production_state(production_states.STATE_LED_TEST);
    change_color("com_test1_btn", "green");
    return true;
  }
  else
  {
    console.log("Failed com_test1");
    data_entry.com_test1_result = "FAILED";
    change_production_state(production_states.STATE_ERROR);
    change_color("com_test1_btn", "red");
    return false;
  }

  update_production_data_fields(data_entry);
}

async function led_test(status) {

  console.log("led_test");
  if (status) {
    console.log("Passed led_test");
    data_entry.led_test_result = "PASSED";
    change_production_state(production_states.STATE_PRINT_LABEL);
    change_color("led_test_btn", "green");
  }
  else {
    console.log("Failed led_test");
    data_entry.led_test_result = "FAILED";
    change_production_state(production_states.STATE_ERROR);
    change_color("led_test_btn", "red");
  }

  update_production_data_fields(data_entry);
}

async function print_label(status) {

  console.log("print_label");

  if (status) {
    console.log("Passed label_print");
    data_entry.label_print_result = "PASSED";
    change_production_state(production_states.STATE_UPLOAD_RESULTS);
    change_color("label_print_btn", "green");
  }
  else {
    console.log("Failed label_print");
    data_entry.label_print_result = "FAILED";
    change_production_state(production_states.STATE_ERROR);
    change_color("label_print_btn", "red");
  }

  update_production_data_fields(data_entry);
}

async function upload_test_results() {

  console.log("upload_test_results");

  var result = true;
  // TODO INSERT FIREBASE CODE response check
  if (production_data.hasOwnProperty(data_entry.mac)) {
    production_data.mac_addr = data_entry; //Update local reference
    write_production_data(data_entry); //Update database reference
  }

  if (result) {
    console.log("Passed upload_test_results");
    change_production_state(production_states.STATE_IDLE);
    change_color("upload_test_results_btn", "green");
  }
  else {
    console.log("Failed upload_test_results");
    change_production_state(production_states.STATE_ERROR);
    change_color("upload_test_results_btn", "red");
  }

}

function translate_number_to_hex_string(number, add_zero) {

  var output = "";

  if (number < 16 && add_zero) {
    output = "0";
  }

  output = output + number.toString(16);
  return output;
}

function is_mac_unused(mac_addr) {
  if (production_data.hasOwnProperty(mac_addr)) {
    if (production_data[mac_addr].hasOwnProperty("board_production_date")) {
      if (production_data[mac_addr].board_production_date == "") {
        return true;
      }
    }
  }
  return false;
}

function find_next_free_mac_address() {

  var start_of_mac = "70:b3:d5:8e:6"
  var mac_addr = "";
  for (var i = 0; i<16; i++) {
    for (var j = 0; j<256; j++) {
    mac_addr = start_of_mac + translate_number_to_hex_string(i, false) + ":" + translate_number_to_hex_string(j, true);

    // Found unused MAC
    if (is_mac_unused(mac_addr)) {
      data_entry.mac = mac_addr;
      console.log("Found next available mac address: " + mac_addr);
      return true;
    }

    }
  }
  return false;;
}


function change_color(id, color){
    document.getElementById(id).style.backgroundColor = color;
}


function write_production_data(data_entry) {
  var mac = data_entry.mac;
  var result = db.ref('/lunamoth/' + mac).set(data_entry);

  console.log(result);
}

function read_all_production_data() {
    db.ref('/lunamoth/').once('value').then(function (snapshot) {
        production_data = snapshot.val();
        console.log("Successfully read data from firebase");
        production_data_ready = true;
        set_colors(default_color);
    });
}

function populate_db(){

  var start_of_mac = "70:b3:d5:8e:6"
  var mac_addr = "";
  for (var i = 0; i<16; i++) {
    for (var j = 0; j<256; j++) {
    mac_addr = start_of_mac + translate_number_to_hex_string(i, false) + ":" + translate_number_to_hex_string(j, true);

    var data_entry = {
      board_production_date : "",
      label_print_result : "",
      mac : mac_addr,
      lan7801_sw_version : "",
      lan7801_flash_result : "",
      mechanics_production_date : "",
      stm32_sw_version : "",
      stm32_flash_result : "",
      com_test1_result : "",
      led_test_result : "",
      testing_date : "",
      usb_serial : ""
    };

    write_production_data(data_entry);
    }
  }

}