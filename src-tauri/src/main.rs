#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use std::process::{Child, Command};
use std::sync::Mutex;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

static BACKEND_PROCESS: Mutex<Option<Child>> = Mutex::new(None);

fn spawn_backend() {
  if let Ok(current_exe) = std::env::current_exe() {
    if let Some(exe_dir) = current_exe.parent() {
      let mut candidates = vec![
        exe_dir.join("paytrack-api.exe"),
        exe_dir.join("binaries").join("paytrack-api.exe"),
        exe_dir.join("paytrack-api-x86_64-pc-windows-msvc.exe"),
      ];

      // Fallback in case of parent directory binaries
      if let Some(parent) = exe_dir.parent() {
        candidates.push(parent.join("binaries").join("paytrack-api-x86_64-pc-windows-msvc.exe"));
      }

      for candidate in candidates {
        if candidate.exists() {
          let mut cmd = Command::new(&candidate);
          cmd.current_dir(exe_dir);

          #[cfg(target_os = "windows")]
          {
            const CREATE_NO_WINDOW: u32 = 0x08000000;
            cmd.creation_flags(CREATE_NO_WINDOW);
          }

          match cmd.spawn() {
            Ok(child) => {
              if let Ok(mut lock) = BACKEND_PROCESS.lock() {
                *lock = Some(child);
              }
              return;
            }
            Err(e) => {
              eprintln!("Error al iniciar backend en {:?}: {}", candidate, e);
            }
          }
        }
      }
    }
  }
}

fn kill_backend() {
  if let Ok(mut lock) = BACKEND_PROCESS.lock() {
    if let Some(mut child) = lock.take() {
      let _ = child.kill();
    }
  }
}

fn main() {
  spawn_backend();

  tauri::Builder::default()
    .build(tauri::generate_context!())
    .expect("error while building tauri application")
    .run(|_app_handle, event| {
      if let tauri::RunEvent::ExitRequested { .. } = event {
        kill_backend();
      }
    });
}
