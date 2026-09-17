mod pdf_tools;
mod pdf_render;

use pdf_tools::{compress_pdf, extract_pages, inspect_pdf, merge_pdfs, protect_pdf, reorder_rotate_pages, split_pdf, unlock_pdf, update_metadata};
use pdf_render::{images_to_pdf, inspect_image_files, render_pdf_pages, render_pdf_thumbnails};
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(target_os = "windows")]
            {
                if let Some(window) = app.get_webview_window("main") {
                    window.set_icon(tauri::include_image!("./icons/icon.ico"))?;
                }
            }
            Ok(())
        })
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![inspect_pdf, merge_pdfs, split_pdf, extract_pages, reorder_rotate_pages, compress_pdf, update_metadata, protect_pdf, unlock_pdf, render_pdf_pages, render_pdf_thumbnails, inspect_image_files, images_to_pdf])
        .run(tauri::generate_context!())
        .expect("error while running _davPDF");
}
