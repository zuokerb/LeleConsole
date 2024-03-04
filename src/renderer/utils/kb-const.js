const CmdId = {
  get_protocol_version: 0x01, // always 0x01
  get_keyboard_value: 0x02,
  set_keyboard_value: 0x03,
  dynamic_keymap_get_keycode: 0x04,
  dynamic_keymap_set_keycode: 0x05,
  dynamic_keymap_reset: 0x06,
  lighting_set_value: 0x07,
  lighting_get_value: 0x08,
  lighting_save: 0x09,
  eeprom_reset: 0x0a,
  bootloader_jump: 0x0b,
  dynamic_keymap_macro_get_count: 0x0c,
  dynamic_keymap_macro_get_buffer_size: 0x0d,
  dynamic_keymap_macro_get_buffer: 0x0e,
  dynamic_keymap_macro_set_buffer: 0x0f,
  dynamic_keymap_macro_reset: 0x10,
  dynamic_keymap_get_layer_count: 0x11,
  dynamic_keymap_get_buffer: 0x12,
  dynamic_keymap_set_buffer: 0x13,
  
  get_custom_value: 0x08,
  set_custom_value: 0x07,

  dongle_get_value: 0xa0,
  dongle_set_value: 0xa1,
  dongle_get_slave_usb_val: 0xa2,
  dongle_bootloader_jump: 0xa3,
  

  id_unhandled: 0xff
};

const KbValueId = {
  id_uptime: 0x01,
  id_layout_options: 0x02,
  id_switch_matrix_state: 0x03,
  id_battery_status: 0xa0,
  id_usb_nkro: 0xb1,
  matrix_scan_mode: 0xb2,
  matrix_scan_freq: 0xb3,
  matrix_scan_debounce: 0xb4,
  ble_power: 0xb5,
  radio_power: 0xb6,
  auto_sleep_sec: 0xc0,
  enable_usb_sleep: 0xc1,
};
const DongleValueId = {
  version : 1,
  slave_map : 2, 
  curr_slave : 3,
};
const DongleSlaveValueId = {
  vidpid : 1,
  pid : 2,
  prod_str : 3,
  manu_str : 4,
  sn : 5,
  fw_ver: 6,
}
export { CmdId, KbValueId, DongleValueId, DongleSlaveValueId };
