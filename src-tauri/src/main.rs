#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use tauri::api::process::Command;

fn main() {
  tauri::Builder::default()
    .setup(|_app| {
      #[cfg(not(debug_assertions))]
      {
        let sidecar_res = Command::new_sidecar("binaries/paytrack-api")
          .or_else(|_| Command::new_sidecar("paytrack-api"));
        
        if let Ok(cmd) = sidecar_res {
          if let Ok((_rx, _child)) = cmd.spawn() {
            println!("PayTrack API sidecar launched successfully.");
          }
        }
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
